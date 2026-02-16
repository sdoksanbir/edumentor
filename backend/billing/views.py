"""
Billing API views.
Admin-only: plans CRUD, subscriptions CRUD.
Teacher self: GET /api/billing/me/subscription/
"""
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import TeacherProfile, StudentProfile
from accounts.permissions import IsAdminOnly

from .models import Plan, Subscription, SubscriptionEvent
from .serializers import (
    PlanSerializer,
    PlanListSerializer,
    SubscriptionSerializer,
    SubscriptionCreateSerializer,
    SubscriptionUpdateSerializer,
    SubscriptionEventSerializer,
    ChangePlanSerializer,
)
from .services import (
    change_subscription_plan,
    _period_days,
    _get_amount_for_period,
)


def _get_subscription_usage(sub):
    """Returns (assigned_count, remaining_slots) for a subscription."""
    count = StudentProfile.objects.filter(teacher=sub.teacher).count()
    limit = sub.student_limit_snapshot
    remaining = max(0, limit - count)
    return count, remaining


def _is_subscription_active(sub):
    """Aktif abonelik: TRIALING/ACTIVE ve süre dolmamış."""
    if not sub:
        return False
    if sub.status not in [Subscription.Status.TRIALING, Subscription.Status.ACTIVE]:
        return False
    now = timezone.now()
    if sub.current_period_end and sub.current_period_end < now:
        return False
    if sub.trial_end and sub.trial_end < now:
        return False
    return True


def _check_teacher_quota(teacher_profile_id, new_student_count=1):
    """
    Returns (can_assign, limit, current, message).
    can_assign=False means quota reached or no active subscription.
    """
    try:
        sub = Subscription.objects.select_related("plan").get(teacher_id=teacher_profile_id)
    except Subscription.DoesNotExist:
        return False, 0, 0, "Öğretmenin aktif aboneliği yok."
    if not _is_subscription_active(sub):
        return False, sub.student_limit_snapshot, 0, "Abonelik süresi dolmuş veya iptal edilmiş."
    count = StudentProfile.objects.filter(teacher_id=teacher_profile_id).count()
    limit = sub.student_limit_snapshot
    if count + new_student_count > limit:
        return False, limit, count, "Öğrenci kotanız doldu. Paketinizi yükseltin."
    return True, limit, count, ""


# --- Admin Plan ViewSet ---
class PlanViewSet(viewsets.ModelViewSet):
    """Admin-only: /api/admin/billing/plans/"""
    permission_classes = [IsAuthenticated, IsAdminOnly]
    queryset = Plan.objects.all().order_by("student_limit")

    def get_serializer_class(self):
        if self.action == "list":
            return PlanListSerializer
        return PlanSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(code__icontains=search)
                | Q(name__icontains=search)
            )
        is_active = self.request.query_params.get("is_active", "").strip().lower()
        if is_active == "true" or is_active == "1":
            qs = qs.filter(is_active=True)
        elif is_active == "false" or is_active == "0":
            qs = qs.filter(is_active=False)
        return qs

    def perform_destroy(self, instance):
        # Hard delete yerine is_active=False
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])


# --- Admin Subscription ViewSet ---
class SubscriptionViewSet(viewsets.ModelViewSet):
    """Admin-only: /api/admin/billing/subscriptions/"""
    permission_classes = [IsAuthenticated, IsAdminOnly]
    queryset = Subscription.objects.select_related("plan", "teacher__user").all().order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return SubscriptionCreateSerializer
        if self.action in ("update", "partial_update"):
            return SubscriptionUpdateSerializer
        return SubscriptionSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["usage_fn"] = _get_subscription_usage
        return ctx

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get("status", "").strip()
        if status_filter:
            qs = qs.filter(status=status_filter)
        plan_id = self.request.query_params.get("plan", "").strip()
        if plan_id.isdigit():
            qs = qs.filter(plan_id=int(plan_id))
        teacher_id = self.request.query_params.get("teacher", "").strip()
        if teacher_id.isdigit():
            qs = qs.filter(teacher_id=int(teacher_id))
        expiring_soon = self.request.query_params.get("expiring_soon", "").strip()
        if expiring_soon.isdigit():
            from datetime import timedelta
            days = int(expiring_soon)
            threshold = timezone.now() + timedelta(days=days)
            qs = qs.filter(
                status__in=[Subscription.Status.TRIALING, Subscription.Status.ACTIVE],
                current_period_end__lte=threshold,
            )
        billing_period = self.request.query_params.get("billing_period", "").strip()
        if billing_period in ["MONTHLY", "YEARLY"]:
            qs = qs.filter(billing_period=billing_period)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = SubscriptionSerializer(
            qs,
            many=True,
            context={"request": request, "usage_fn": _get_subscription_usage},
        )
        # Add usage to each item
        data = []
        for sub in qs:
            count, remaining = _get_subscription_usage(sub)
            item = SubscriptionSerializer(sub, context=self.get_serializer_context()).data
            item["assigned_students_count"] = count
            item["remaining_slots"] = remaining
            data.append(item)
        return Response(data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        count, remaining = _get_subscription_usage(instance)
        serializer = SubscriptionSerializer(instance, context=self.get_serializer_context())
        data = serializer.data
        data["assigned_students_count"] = count
        data["remaining_slots"] = remaining
        return Response(data)

    def create(self, request, *args, **kwargs):
        ser = SubscriptionCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        teacher_profile_id = data["teacher_profile_id"]
        plan_id = data["plan_id"]
        billing_period = data.get("billing_period", "MONTHLY")
        if billing_period not in [Subscription.BillingPeriod.MONTHLY, Subscription.BillingPeriod.YEARLY]:
            billing_period = Subscription.BillingPeriod.MONTHLY
        start_now = data.get("start_now", True)
        # trial_days: payload'da yoksa plan.trial_days; varsa override
        if "trial_days" in data:
            effective_trial_days = data["trial_days"] or 0
        else:
            effective_trial_days = plan.trial_days if plan.trial_days > 0 else 0

        try:
            tp = TeacherProfile.objects.get(pk=teacher_profile_id)
        except TeacherProfile.DoesNotExist:
            return Response({"detail": "Öğretmen bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
        try:
            plan = Plan.objects.get(pk=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response({"detail": "Plan bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        from datetime import timedelta
        period_days = 30

        # LIMIT_TOO_LOW: Öğrenci sayısı > yeni plan limit ise engelle
        students_count = StudentProfile.objects.filter(teacher=tp).count()
        if students_count > plan.student_limit:
            return Response(
                {
                    "code": "LIMIT_TOO_LOW",
                    "message": "Bu plana geçmek için önce öğrenci sayısını azaltın.",
                    "current": students_count,
                    "limit": plan.student_limit,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        period_days_val = _period_days(billing_period)
        amount_val = _get_amount_for_period(plan, billing_period)

        existing = Subscription.objects.filter(teacher=tp).first()
        if existing:
            # UPSERT: Mevcut aboneliği güncelle (CANCELED/EXPIRED dahil)
            if effective_trial_days > 0:
                sub_status = Subscription.Status.TRIALING
                trial_end = now + timedelta(days=effective_trial_days)
                period_end = trial_end
            else:
                sub_status = Subscription.Status.ACTIVE
                trial_end = None
                period_end = now + timedelta(days=period_days_val) if start_now else now

            existing.plan = plan
            existing.student_limit_snapshot = plan.student_limit
            existing.billing_period = billing_period
            existing.amount = amount_val
            existing.currency = plan.currency
            existing.status = sub_status
            existing.current_period_start = now
            existing.current_period_end = period_end
            existing.trial_end = trial_end
            existing.cancel_at_period_end = False
            existing.save(update_fields=[
                "plan", "student_limit_snapshot", "billing_period", "amount", "currency",
                "status", "current_period_start", "current_period_end", "trial_end",
                "cancel_at_period_end", "updated_at",
            ])
            SubscriptionEvent.objects.create(
                subscription=existing,
                event_type=SubscriptionEvent.EventType.REASSIGNED,
                payload={"plan": plan.code, "trial_days": effective_trial_days},
            )
            count, remaining = _get_subscription_usage(existing)
            resp = SubscriptionSerializer(existing, context=self.get_serializer_context()).data
            resp["assigned_students_count"] = count
            resp["remaining_slots"] = remaining
            return Response(resp, status=status.HTTP_200_OK)

        # Yeni abonelik oluştur
        if effective_trial_days > 0:
            sub_status = Subscription.Status.TRIALING
            trial_end = now + timedelta(days=effective_trial_days)
            period_end = trial_end
        else:
            sub_status = Subscription.Status.ACTIVE
            trial_end = None
            period_end = now + timedelta(days=period_days_val) if start_now else now

        sub = Subscription.objects.create(
            teacher=tp,
            plan=plan,
            status=sub_status,
            billing_period=billing_period,
            amount=amount_val,
            currency=plan.currency,
            current_period_start=now,
            current_period_end=period_end,
            trial_end=trial_end,
            student_limit_snapshot=plan.student_limit,
        )
        SubscriptionEvent.objects.create(
            subscription=sub,
            event_type=SubscriptionEvent.EventType.CREATED,
            payload={"plan": plan.code, "trial_days": effective_trial_days},
        )
        count, remaining = _get_subscription_usage(sub)
        resp = SubscriptionSerializer(sub, context=self.get_serializer_context()).data
        resp["assigned_students_count"] = count
        resp["remaining_slots"] = remaining
        return Response(resp, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        ser = SubscriptionUpdateSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        if "plan_id" in data:
            try:
                plan = Plan.objects.get(pk=data["plan_id"], is_active=True)
            except Plan.DoesNotExist:
                return Response({"detail": "Plan bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
            students_count = StudentProfile.objects.filter(teacher=instance.teacher).count()
            if students_count > plan.student_limit:
                return Response(
                    {
                        "code": "LIMIT_TOO_LOW",
                        "message": "Bu plana geçmek için önce öğrenci sayısını azaltın.",
                        "current": students_count,
                        "limit": plan.student_limit,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            instance.plan = plan
            instance.student_limit_snapshot = plan.student_limit
            instance.save(update_fields=["plan", "student_limit_snapshot", "updated_at"])
            SubscriptionEvent.objects.create(
                subscription=instance,
                event_type=SubscriptionEvent.EventType.PLAN_CHANGED,
                payload={"new_plan": plan.code},
            )

        if "extend_days" in data:
            from datetime import timedelta
            instance.current_period_end += timedelta(days=data["extend_days"])
            instance.status = Subscription.Status.ACTIVE
            instance.save(update_fields=["current_period_end", "status", "updated_at"])
            SubscriptionEvent.objects.create(
                subscription=instance,
                event_type=SubscriptionEvent.EventType.RENEWED,
                payload={"extend_days": data["extend_days"]},
            )

        if "cancel_at_period_end" in data:
            instance.cancel_at_period_end = data["cancel_at_period_end"]
            instance.save(update_fields=["cancel_at_period_end", "updated_at"])

        count, remaining = _get_subscription_usage(instance)
        resp = SubscriptionSerializer(instance, context=self.get_serializer_context()).data
        resp["assigned_students_count"] = count
        resp["remaining_slots"] = remaining
        return Response(resp)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """Hemen iptal - status=CANCELED."""
        sub = self.get_object()
        sub.status = Subscription.Status.CANCELED
        sub.cancel_at_period_end = False
        sub.save(update_fields=["status", "cancel_at_period_end", "updated_at"])
        SubscriptionEvent.objects.create(
            subscription=sub,
            event_type=SubscriptionEvent.EventType.CANCELED,
            payload={"canceled_at": timezone.now().isoformat(), "immediate": True},
        )
        count, remaining = _get_subscription_usage(sub)
        resp = SubscriptionSerializer(sub, context=self.get_serializer_context()).data
        resp["assigned_students_count"] = count
        resp["remaining_slots"] = remaining
        return Response(resp)

    @action(detail=True, methods=["post"], url_path="reactivate")
    def reactivate(self, request, pk=None):
        """CANCELED/EXPIRED aboneliği yeniden aktifleştir."""
        from datetime import timedelta
        sub = self.get_object()
        extend_days = request.data.get("extend_days")
        if extend_days is None:
            extend_days = _period_days(sub.billing_period)
        else:
            extend_days = int(extend_days)
        if extend_days <= 0:
            extend_days = _period_days(sub.billing_period)
        extend_days = max(1, min(365, extend_days))

        now = timezone.now()
        sub.status = Subscription.Status.ACTIVE
        sub.cancel_at_period_end = False
        if sub.current_period_end < now:
            sub.current_period_start = now
            sub.current_period_end = now + timedelta(days=extend_days)
        else:
            sub.current_period_end += timedelta(days=extend_days)
        sub.student_limit_snapshot = sub.plan.student_limit
        sub.save(update_fields=[
            "status", "cancel_at_period_end", "current_period_start",
            "current_period_end", "student_limit_snapshot", "updated_at",
        ])
        SubscriptionEvent.objects.create(
            subscription=sub,
            event_type=SubscriptionEvent.EventType.REACTIVATED,
            payload={"extend_days": extend_days, "reactivated_at": now.isoformat()},
        )
        count, remaining = _get_subscription_usage(sub)
        resp = SubscriptionSerializer(sub, context=self.get_serializer_context()).data
        resp["assigned_students_count"] = count
        resp["remaining_slots"] = remaining
        return Response(resp)

    @action(detail=True, methods=["post"], url_path="change-plan")
    def change_plan(self, request, pk=None):
        """Plan değiştir (upgrade/downgrade)."""
        sub = self.get_object()
        ser = ChangePlanSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        plan_id = data["plan_id"]
        billing_period = data.get("billing_period")
        effective = data.get("effective", "IMMEDIATE")
        keep_period = data.get("keep_period", True)

        try:
            new_plan = Plan.objects.get(pk=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response({"detail": "Plan bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        current_students = StudentProfile.objects.filter(teacher=sub.teacher).count()
        if current_students > new_plan.student_limit:
            return Response(
                {
                    "code": "LIMIT_TOO_LOW",
                    "message": "Bu plana geçmek için önce öğrenci sayısını azaltın.",
                    "current": current_students,
                    "limit": new_plan.student_limit,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            change_subscription_plan(
                sub,
                new_plan,
                effective=effective,
                keep_period=keep_period,
                billing_period=billing_period,
            )
        except ValueError:
            return Response(
                {
                    "code": "LIMIT_TOO_LOW",
                    "message": "Bu plana geçmek için önce öğrenci sayısını azaltın.",
                    "current": current_students,
                    "limit": new_plan.student_limit,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        sub.refresh_from_db()
        count, remaining = _get_subscription_usage(sub)
        resp = SubscriptionSerializer(sub, context=self.get_serializer_context()).data
        resp["assigned_students_count"] = count
        resp["remaining_slots"] = remaining
        return Response(resp)

    @action(detail=True, methods=["post"])
    def renew(self, request, pk=None):
        sub = self.get_object()
        from datetime import timedelta
        renew_days = _period_days(sub.billing_period)
        sub.current_period_end += timedelta(days=renew_days)
        sub.status = Subscription.Status.ACTIVE
        sub.save(update_fields=["current_period_end", "status", "updated_at"])
        SubscriptionEvent.objects.create(
            subscription=sub,
            event_type=SubscriptionEvent.EventType.RENEWED,
            payload={"renewed_at": timezone.now().isoformat()},
        )
        count, remaining = _get_subscription_usage(sub)
        resp = SubscriptionSerializer(sub, context=self.get_serializer_context()).data
        resp["assigned_students_count"] = count
        resp["remaining_slots"] = remaining
        return Response(resp)

    @action(detail=True, methods=["get"])
    def events(self, request, pk=None):
        sub = self.get_object()
        events = sub.events.all()[:50]
        return Response(SubscriptionEventSerializer(events, many=True).data)


# --- Teacher self: GET /api/billing/me/subscription/ ---
class TeacherMySubscriptionView(APIView):
    """Teacher'ın kendi aboneliği + kullanım bilgisi."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, "teacher_profile") or user.role != "TEACHER":
            return Response(
                {"detail": "Bu endpoint sadece öğretmenler içindir."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            tp = user.teacher_profile
        except TeacherProfile.DoesNotExist:
            return Response(
                {"subscription": None, "assigned_students_count": 0, "remaining_slots": 0, "limit": 0},
            )
        try:
            sub = Subscription.objects.select_related("plan").get(teacher=tp)
        except Subscription.DoesNotExist:
            return Response({
                "subscription": None,
                "assigned_students_count": 0,
                "remaining_slots": 0,
                "limit": 0,
                "message": "Aboneliğiniz bulunmuyor. Yöneticinizle iletişime geçin.",
            })
        count, remaining = _get_subscription_usage(sub)
        now = timezone.now()
        plan_data = {
            "id": sub.plan.id,
            "code": sub.plan.code,
            "name": sub.plan.name,
            "student_limit": sub.student_limit_snapshot,
            "price_monthly": str(sub.plan.price_monthly),
            "price_yearly": str(sub.plan.price_yearly),
            "currency": sub.plan.currency,
            "yearly_savings": str(sub.plan.yearly_savings),
            "yearly_discount_percent": str(round(sub.plan.yearly_discount_percent, 1)),
        }
        is_inactive = sub.status in [Subscription.Status.CANCELED, Subscription.Status.EXPIRED]
        period_days_remaining = max(0, (sub.current_period_end - now).days) if sub.current_period_end > now else 0
        return Response({
            "subscription": {
                "id": sub.id,
                "plan": plan_data,
                "status": sub.status,
                "billing_period": sub.billing_period,
                "amount": str(sub.amount),
                "currency": sub.currency,
                "auto_renew": sub.auto_renew,
                "current_period_start": sub.current_period_start,
                "current_period_end": sub.current_period_end,
                "trial_end": sub.trial_end,
                "student_limit_snapshot": sub.student_limit_snapshot,
            },
            "assigned_students_count": count,
            "remaining_slots": 0 if is_inactive else remaining,
            "limit": sub.student_limit_snapshot,
            "period_days_remaining": period_days_remaining,
            "next_renewal_at": sub.current_period_end if sub.auto_renew else None,
            "message": "Aboneliğiniz aktif değil." if is_inactive else None,
        })


# --- Admin: teacher subscription by teacher_profile_id (for assignment UI) ---
class AdminTeacherSubscriptionView(APIView):
    """Admin: GET /api/admin/billing/teachers/<teacher_profile_id>/subscription/"""
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request, teacher_profile_id):
        try:
            sub = Subscription.objects.select_related("plan", "teacher__user").get(teacher_id=teacher_profile_id)
        except Subscription.DoesNotExist:
            return Response({
                "subscription": None,
                "assigned_students_count": 0,
                "remaining_slots": 0,
                "limit": 0,
            })
        count, remaining = _get_subscription_usage(sub)
        is_inactive = sub.status in [Subscription.Status.CANCELED, Subscription.Status.EXPIRED]
        now = timezone.now()
        period_days_remaining = max(0, (sub.current_period_end - now).days) if sub.current_period_end > now else 0
        return Response({
            "subscription": {
                "id": sub.id,
                "plan": {
                    "id": sub.plan.id,
                    "code": sub.plan.code,
                    "name": sub.plan.name,
                    "student_limit": sub.student_limit_snapshot,
                    "price_monthly": str(sub.plan.price_monthly),
                    "price_yearly": str(sub.plan.price_yearly),
                    "currency": sub.plan.currency,
                    "yearly_savings": str(sub.plan.yearly_savings),
                    "yearly_discount_percent": str(round(sub.plan.yearly_discount_percent, 1)),
                },
                "status": sub.status,
                "billing_period": sub.billing_period,
                "amount": str(sub.amount),
                "currency": sub.currency,
                "current_period_end": sub.current_period_end,
                "trial_end": sub.trial_end,
                "cancel_at_period_end": sub.cancel_at_period_end,
            },
            "assigned_students_count": count,
            "remaining_slots": 0 if is_inactive else remaining,
            "limit": sub.student_limit_snapshot,
            "period_days_remaining": period_days_remaining,
        })
