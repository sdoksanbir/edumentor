"""Billing serializers."""
from rest_framework import serializers
from .models import Plan, Subscription, SubscriptionEvent


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            "id",
            "code",
            "name",
            "student_limit",
            "price_monthly",
            "price_yearly",
            "currency",
            "is_active",
            "trial_days",
            "features",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_trial_days(self, value):
        if value is not None and (value < 0 or value > 365):
            raise serializers.ValidationError("Deneme süresi 0-365 gün arasında olmalıdır.")
        return value


class PlanListSerializer(serializers.ModelSerializer):
    """Lightweight for list - yearly_savings, yearly_discount_percent computed."""
    yearly_savings = serializers.SerializerMethodField()
    yearly_discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = [
            "id", "code", "name", "student_limit",
            "price_monthly", "price_yearly", "currency", "is_active",
            "trial_days", "yearly_savings", "yearly_discount_percent",
        ]

    def get_yearly_savings(self, obj):
        return str(obj.yearly_savings)

    def get_yearly_discount_percent(self, obj):
        return str(round(obj.yearly_discount_percent, 1))


class SubscriptionEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionEvent
        fields = ["id", "event_type", "payload", "created_at"]
        read_only_fields = ["id", "event_type", "payload", "created_at"]


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Nested plan with pricing."""
    yearly_savings = serializers.SerializerMethodField()
    yearly_discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = [
            "id", "code", "name", "student_limit",
            "price_monthly", "price_yearly", "currency",
            "yearly_savings", "yearly_discount_percent",
        ]

    def get_yearly_savings(self, obj):
        return str(obj.yearly_savings)

    def get_yearly_discount_percent(self, obj):
        return str(round(obj.yearly_discount_percent, 1))


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    teacher = serializers.SerializerMethodField()
    assigned_students_count = serializers.SerializerMethodField()
    remaining_slots = serializers.SerializerMethodField()
    period_days_remaining = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            "id",
            "teacher",
            "plan",
            "status",
            "billing_period",
            "amount",
            "currency",
            "auto_renew",
            "current_period_start",
            "current_period_end",
            "cancel_at_period_end",
            "trial_end",
            "student_limit_snapshot",
            "assigned_students_count",
            "remaining_slots",
            "period_days_remaining",
            "is_expired",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_teacher(self, obj):
        u = obj.teacher.user
        return {
            "id": obj.teacher.id,
            "user_id": u.id,
            "email": u.email,
            "first_name": u.first_name or "",
            "last_name": u.last_name or "",
        }

    def get_assigned_students_count(self, obj):
        fn = self.context.get("usage_fn")
        if fn:
            count, _ = fn(obj)
            return count
        return 0

    def get_remaining_slots(self, obj):
        fn = self.context.get("usage_fn")
        if fn:
            _, remaining = fn(obj)
            return remaining
        return 0

    def get_period_days_remaining(self, obj):
        from django.utils import timezone
        now = timezone.now()
        if obj.current_period_end and obj.current_period_end > now:
            return max(0, (obj.current_period_end - now).days)
        return 0

    def get_is_expired(self, obj):
        from django.utils import timezone
        if obj.current_period_end and obj.current_period_end < timezone.now():
            return True
        return False


class SubscriptionCreateSerializer(serializers.Serializer):
    teacher_profile_id = serializers.IntegerField()
    plan_id = serializers.IntegerField()
    billing_period = serializers.ChoiceField(
        choices=[("MONTHLY", "MONTHLY"), ("YEARLY", "YEARLY")],
        default="MONTHLY",
    )
    start_now = serializers.BooleanField(default=True)
    trial_days = serializers.IntegerField(
        required=False, allow_null=True, min_value=0, max_value=365
    )


class SubscriptionUpdateSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField(required=False)
    extend_days = serializers.IntegerField(required=False, min_value=1, max_value=365)
    cancel_at_period_end = serializers.BooleanField(required=False)


class ChangePlanSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    billing_period = serializers.ChoiceField(
        choices=[("MONTHLY", "MONTHLY"), ("YEARLY", "YEARLY")],
        required=False,
        allow_null=True,
    )
    effective = serializers.ChoiceField(choices=["IMMEDIATE", "NEXT_PERIOD"], default="IMMEDIATE")
    keep_period = serializers.BooleanField(default=True)
