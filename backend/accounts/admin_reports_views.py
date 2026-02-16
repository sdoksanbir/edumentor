"""
Admin Reports API - Raporlama & Analitik modülü.
Sadece ADMIN rolü erişebilir. /api/admin/reports/* altında.
"""
from datetime import datetime, timedelta

from django.db.models import Count, Max, Q
from django.db.models.functions import TruncDay
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import User, TeacherProfile, StudentProfile, AuthEventLog
from .permissions import IsAdminOnly
from catalog.models import Course


def _parse_date_range(request, default_days=30):
    """date_from, date_to query params (ISO date/datetime) -> timezone aware datetime range."""
    from django.utils.dateparse import parse_datetime, parse_date
    now = timezone.now()
    default_start = now - timedelta(days=default_days)
    date_from_str = request.query_params.get("date_from")
    date_to_str = request.query_params.get("date_to")

    def parse_start(s):
        if not s:
            return default_start
        dt = parse_datetime(s)
        if dt:
            return timezone.make_aware(dt) if timezone.is_naive(dt) else dt
        d = parse_date(s)
        if d:
            return timezone.make_aware(datetime.combine(d, datetime.min.time()))
        return default_start

    def parse_end(s):
        if not s:
            return now
        dt = parse_datetime(s)
        if dt:
            return timezone.make_aware(dt) if timezone.is_naive(dt) else dt
        d = parse_date(s)
        if d:
            return timezone.make_aware(datetime.combine(d, datetime.max.time()))
        return now

    try:
        return parse_start(date_from_str), parse_end(date_to_str)
    except Exception:
        return default_start, now


def _teacher_name(user):
    name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    return name or user.email


# --- Pagination ---
class ReportsPagePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# --- (1) Teacher Performance ---
class TeacherPerformanceReportView(APIView):
    """
    GET /api/admin/reports/teacher-performance/
    Query: date_from, date_to (ISO), ordering (students_count|logins_count|last_login_at)

    Example response:
    {"results": [{"teacher_profile_id": 1, "teacher_user_id": 2, "teacher_name": "Ali Veli",
      "branch_label": "Matematik", "students_count": 5, "logins_count": 42,
      "last_login_at": "2026-02-16T10:30:00+00:00", "must_change_password_count": 1}]}
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        date_from, date_to = _parse_date_range(request, 30)
        branch_id = request.query_params.get("branch_id")
        ordering = request.query_params.get("ordering", "students_count")

        qs = TeacherProfile.objects.select_related("user", "branch").prefetch_related(
            "students", "students__user"
        )

        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        teacher_profiles = list(qs)
        teacher_user_ids = [tp.user_id for tp in teacher_profiles]
        login_counts = dict(
            AuthEventLog.objects.filter(
                user_id__in=teacher_user_ids,
                event_type=AuthEventLog.EventType.LOGIN_SUCCESS,
                created_at__gte=date_from,
                created_at__lte=date_to,
            )
            .values("user_id")
            .annotate(c=Count("id"))
            .values_list("user_id", "c")
        )
        last_logins_raw = (
            AuthEventLog.objects.filter(
                user_id__in=teacher_user_ids,
                event_type=AuthEventLog.EventType.LOGIN_SUCCESS,
            )
            .values("user_id")
            .annotate(created_at=Max("created_at"))
        )
        last_logins = {r["user_id"]: r["created_at"] for r in last_logins_raw}

        teachers = []
        for tp in teacher_profiles:
            user = tp.user
            students = list(tp.students.all())
            students_count = len(students)
            must_change_password_count = sum(1 for s in students if s.user.must_change_password)
            logins_count = login_counts.get(user.id, 0)
            last_login_at = last_logins.get(user.id)

            teachers.append({
                "teacher_profile_id": tp.id,
                "teacher_user_id": user.id,
                "teacher_name": _teacher_name(user),
                "branch_label": tp.branch.label if tp.branch else None,
                "students_count": students_count,
                "logins_count": logins_count,
                "last_login_at": last_login_at.isoformat() if last_login_at else None,
                "must_change_password_count": must_change_password_count,
            })

        valid_orderings = ["students_count", "logins_count", "last_login_at"]
        if ordering in valid_orderings:
            reverse = ordering == "last_login_at"
            teachers.sort(
                key=lambda x: (x[ordering] or 0) if ordering != "last_login_at" else (x[ordering] or ""),
                reverse=reverse if ordering != "last_login_at" else True,
            )
        if ordering == "last_login_at":
            teachers.sort(key=lambda x: x["last_login_at"] or "", reverse=True)

        return Response({"results": teachers})


# --- (2) Student Progress ---
class StudentProgressReportView(APIView):
    """
    GET /api/admin/reports/student-progress/
    Query: date_from, date_to, teacher_profile_id, search, ordering (last_login_at)
    Progress tablosu yok, progress_percent şimdilik NULL.

    Example response:
    {"results": [{"student_profile_id": 1, "student_user_id": 3, "student_name": "Ayşe Yılmaz",
      "teacher_name": "Ali Veli", "grade_label": "9. Sınıf", "target_exam_label": "YKS",
      "progress_percent": null, "last_login_at": "2026-02-15T14:20:00+00:00",
      "must_change_password": false}]}
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        date_from, date_to = _parse_date_range(request, 30)
        teacher_profile_id = request.query_params.get("teacher_profile_id")
        search = request.query_params.get("search", "").strip()
        ordering = request.query_params.get("ordering", "last_login_at")

        qs = StudentProfile.objects.select_related(
            "user", "teacher__user", "grade", "target_exam"
        )

        if teacher_profile_id:
            qs = qs.filter(teacher_id=teacher_profile_id)

        if search:
            qs = qs.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__email__icontains=search)
            )

        profiles = list(qs)
        student_user_ids = [sp.user_id for sp in profiles]
        last_logins_students = {
            r["user_id"]: r["created_at"]
            for r in AuthEventLog.objects.filter(
                user_id__in=student_user_ids,
                event_type=AuthEventLog.EventType.LOGIN_SUCCESS,
            )
            .values("user_id")
            .annotate(created_at=Max("created_at"))
        }

        results = []
        for sp in profiles:
            user = sp.user
            teacher_name = _teacher_name(sp.teacher.user) if sp.teacher else None
            last_login = last_logins_students.get(user.id)

            results.append({
                "student_profile_id": sp.id,
                "student_user_id": user.id,
                "student_name": _teacher_name(user),
                "teacher_name": teacher_name,
                "grade_label": sp.grade.label if sp.grade else None,
                "target_exam_label": sp.target_exam.label if sp.target_exam else None,
                "progress_percent": None,  # Enrollment/progress tablosu gerekir
                "last_login_at": last_login.isoformat() if last_login else None,
                "must_change_password": user.must_change_password,
            })

        valid_orderings = ["last_login_at", "progress_percent"]
        if ordering in valid_orderings:
            reverse = True
            results.sort(
                key=lambda x: (x[ordering] or 0) if ordering == "progress_percent" else (x[ordering] or ""),
                reverse=reverse,
            )

        return Response({"results": results})


# --- (3) Most Active Teachers ---
class MostActiveTeachersReportView(APIView):
    """
    GET /api/admin/reports/most-active-teachers/
    Query: date_from, date_to, limit (default 10). LOGIN_SUCCESS sayısına göre.

    Example response:
    {"results": [{"teacher_profile_id": 1, "teacher_name": "Ali Veli",
      "logins_count": 42, "last_login_at": "2026-02-16T10:30:00+00:00"}]}
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        date_from, date_to = _parse_date_range(request, 30)
        limit = int(request.query_params.get("limit", 10))

        qs = (
            TeacherProfile.objects.filter(user__role=User.Role.TEACHER)
            .annotate(
                logins_count=Count(
                    "user__auth_event_logs",
                    filter=Q(
                        user__auth_event_logs__event_type=AuthEventLog.EventType.LOGIN_SUCCESS,
                        user__auth_event_logs__created_at__gte=date_from,
                        user__auth_event_logs__created_at__lte=date_to,
                    ),
                ),
                last_login_at=Max(
                    "user__auth_event_logs__created_at",
                    filter=Q(
                        user__auth_event_logs__event_type=AuthEventLog.EventType.LOGIN_SUCCESS
                    ),
                ),
            )
            .filter(logins_count__gt=0)
            .order_by("-logins_count")[:limit]
            .select_related("user")
        )

        results = [
            {
                "teacher_profile_id": tp.id,
                "teacher_name": _teacher_name(tp.user),
                "logins_count": tp.logins_count,
                "last_login_at": tp.last_login_at.isoformat() if tp.last_login_at else None,
            }
            for tp in qs
        ]

        return Response({"results": results})


# --- (4) Most Used Courses ---
# NOT: Gerçek kullanım metriği için enrollment/progress tablosu gerekir.
# Şu an proxy: topics_count (konu sayısı) + related_teachers_count (branşı eşleşen öğretmen sayısı).
class MostUsedCoursesReportView(APIView):
    """
    GET /api/admin/reports/most-used-courses/
    Query: limit (default 10). Proxy metrik: topics_count, related_teachers_count.

    Example response:
    {"results": [{"course_id": 1, "course_label": "TYT Matematik", "subject_label": "Matematik",
      "topics_count": 24, "related_teachers_count": 3, "is_proxy_metric": true}]}
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        limit = int(request.query_params.get("limit", 10))

        qs = (
            Course.objects.annotate(topics_count=Count("topics"))
            .filter(topics_count__gt=0)
            .order_by("-topics_count")[:limit]
            .select_related("subject")
        )

        results = []
        for c in qs:
            related_teachers_count = TeacherProfile.objects.filter(
                branch_id=c.subject_id
            ).count() if c.subject_id else 0

            results.append({
                "course_id": c.id,
                "course_label": c.label,
                "subject_label": c.subject.label if c.subject else None,
                "topics_count": c.topics_count,
                "related_teachers_count": related_teachers_count,
                "is_proxy_metric": True,
            })

        return Response({"results": results})


# --- (5) Daily Logins ---
class DailyLoginsReportView(APIView):
    """
    GET /api/admin/reports/daily-logins/
    Query: date_from, date_to.

    Example response:
    {"results": [{"date": "2026-02-16", "logins": 120, "unique_users": 45}]}
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        date_from, date_to = _parse_date_range(request, 30)

        qs = (
            AuthEventLog.objects.filter(
                event_type=AuthEventLog.EventType.LOGIN_SUCCESS,
                created_at__gte=date_from,
                created_at__lte=date_to,
            )
            .annotate(date=TruncDay("created_at"))
            .values("date")
            .annotate(
                logins=Count("id"),
                unique_users=Count("user", distinct=True),
            )
            .order_by("date")
        )

        results = [
            {
                "date": r["date"].strftime("%Y-%m-%d"),
                "logins": r["logins"],
                "unique_users": r["unique_users"],
            }
            for r in qs
        ]

        return Response({"results": results})


# --- (6) Login Logs (paginated) ---
class LoginLogsReportView(APIView):
    """
    GET /api/admin/reports/login-logs/
    Query: date_from, date_to, event_type, user_id, search, page, page_size.

    Example response:
    {"items": [{"id": 1, "created_at": "2026-02-16T10:30:00+00:00", "event_type": "LOGIN_SUCCESS",
      "user": {"id": 2, "email": "a@b.com", "name": "Ali", "role": "TEACHER"},
      "ip_address": "127.0.0.1", "user_agent": "Mozilla/5.0...", "meta": null}],
     "total": 100, "page": 1, "page_size": 20}
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]
    pagination_class = ReportsPagePagination

    def get(self, request):
        date_from, date_to = _parse_date_range(request, 30)
        event_type = request.query_params.get("event_type")
        user_id = request.query_params.get("user_id")
        search = request.query_params.get("search", "").strip()

        qs = AuthEventLog.objects.select_related("user").order_by("-created_at")

        qs = qs.filter(created_at__gte=date_from, created_at__lte=date_to)

        if event_type:
            qs = qs.filter(event_type=event_type)
        if user_id:
            qs = qs.filter(user_id=user_id)
        if search:
            qs = qs.filter(
                Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(meta__email__icontains=search)  # LOGIN_FAIL için meta.email
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)

        items = [
            {
                "id": log.id,
                "created_at": log.created_at.isoformat(),
                "event_type": log.event_type,
                "user": {
                    "id": log.user_id,
                    "email": log.user.email if log.user else None,
                    "name": _teacher_name(log.user) if log.user else None,
                    "role": getattr(log.user, "role", None) if log.user else None,
                }
                if log.user
                else None,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "meta": log.meta,
            }
            for log in (page or [])
        ]

        return Response({
            "items": items,
            "total": paginator.page.paginator.count,
            "page": paginator.page.number,
            "page_size": paginator.page.paginator.per_page,
        })


# --- (7) Risky Teachers ---
def _low_login_activity_score(logins_last_14: int) -> float:
    """0=>1.0, 1-2=>0.6, 3-5=>0.3, 6+=>0.0"""
    if logins_last_14 == 0:
        return 1.0
    if logins_last_14 <= 2:
        return 0.6
    if logins_last_14 <= 5:
        return 0.3
    return 0.0


class RiskyTeachersReportView(APIView):
    """
    GET /api/admin/reports/risky-teachers/
    Query: date_from, date_to, limit (default 20).
    Risk skoru: inactive_students_ratio, must_change_password_ratio, low_login_activity.
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        date_from, date_to = _parse_date_range(request, 30)
        limit = int(request.query_params.get("limit", 20))
        inactive_days = 14
        cutoff = timezone.now() - timedelta(days=inactive_days)

        teacher_profiles = list(
            TeacherProfile.objects.select_related("user", "branch").prefetch_related(
                "students", "students__user"
            )
        )

        if not teacher_profiles:
            return Response({"results": []})

        teacher_user_ids = [tp.user_id for tp in teacher_profiles]
        student_user_ids = []
        for tp in teacher_profiles:
            for s in tp.students.all():
                student_user_ids.append(s.user_id)

        last_login_students = {
            r["user_id"]: r["created_at"]
            for r in AuthEventLog.objects.filter(
                user_id__in=student_user_ids,
                event_type=AuthEventLog.EventType.LOGIN_SUCCESS,
            )
            .values("user_id")
            .annotate(created_at=Max("created_at"))
        }

        teacher_logins_14d = dict(
            AuthEventLog.objects.filter(
                user_id__in=teacher_user_ids,
                event_type=AuthEventLog.EventType.LOGIN_SUCCESS,
                created_at__gte=cutoff,
            )
            .values("user_id")
            .annotate(c=Count("id"))
            .values_list("user_id", "c")
        )

        results = []
        for tp in teacher_profiles:
            students = list(tp.students.all())
            students_count = len(students)
            if students_count == 0:
                score = 0.0
                inactive_ratio = 0.0
                mcp_ratio = 0.0
                inactive_count = 0
                mcp_count = 0
                teacher_logins = 0
            else:
                inactive_count = sum(
                    1 for s in students
                    if last_login_students.get(s.user_id) is None or last_login_students[s.user_id] < cutoff
                )
                mcp_count = sum(1 for s in students if s.user.must_change_password)
                inactive_ratio = inactive_count / students_count
                mcp_ratio = mcp_count / students_count
                teacher_logins = teacher_logins_14d.get(tp.user_id, 0)
                low_activity = _low_login_activity_score(teacher_logins)
                raw_score = (
                    40 * inactive_ratio +
                    30 * mcp_ratio +
                    30 * low_activity
                )
                score = max(0.0, min(100.0, raw_score))

            results.append({
                "teacher_profile_id": tp.id,
                "teacher_user_id": tp.user_id,
                "teacher_name": _teacher_name(tp.user),
                "branch_label": tp.branch.label if tp.branch else None,
                "students_count": students_count,
                "inactive_students_count": inactive_count,
                "inactive_students_ratio": round(inactive_ratio, 4),
                "must_change_password_count": mcp_count,
                "must_change_password_ratio": round(mcp_ratio, 4),
                "teacher_logins_last_14_days": teacher_logins,
                "risk_score": round(score, 2),
            })

        results.sort(key=lambda x: (-x["risk_score"], -x["students_count"]))
        return Response({"results": results[:limit]})


# --- (8) Inactive Students ---
class InactiveStudentsReportView(APIView):
    """
    GET /api/admin/reports/inactive-students/
    Query: days (default 14), teacher_profile_id, search, page, page_size.
    Pasif öğrenci = son <days> gün LOGIN_SUCCESS yok.
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        days = int(request.query_params.get("days", 14))
        teacher_profile_id = request.query_params.get("teacher_profile_id")
        search = request.query_params.get("search", "").strip()

        cutoff = timezone.now() - timedelta(days=days)

        last_logins = {
            r["user_id"]: r["created_at"]
            for r in AuthEventLog.objects.filter(
                event_type=AuthEventLog.EventType.LOGIN_SUCCESS,
            )
            .values("user_id")
            .annotate(created_at=Max("created_at"))
        }

        qs = StudentProfile.objects.select_related("user", "teacher__user")

        if teacher_profile_id:
            qs = qs.filter(teacher_id=teacher_profile_id)
        if search:
            qs = qs.filter(
                Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            )

        profiles = list(qs)
        items = []
        for sp in profiles:
            last_login = last_logins.get(sp.user_id)
            last_login_dt = last_login
            if last_login is None or last_login < cutoff:
                days_inactive = days
                if last_login:
                    delta = timezone.now() - last_login
                    days_inactive = delta.days
                items.append({
                    "student_profile_id": sp.id,
                    "student_user_id": sp.user_id,
                    "student_name": _teacher_name(sp.user),
                    "teacher_name": _teacher_name(sp.teacher.user) if sp.teacher else None,
                    "last_login_at": last_login_dt.isoformat() if last_login_dt else None,
                    "days_inactive": days_inactive,
                    "must_change_password": sp.user.must_change_password,
                })

        items.sort(key=lambda x: (-(x["days_inactive"] or 0), x["student_name"] or ""))

        page_num = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        page_size = min(page_size, 100)
        total = len(items)
        start = (page_num - 1) * page_size
        end = start + page_size
        page_items = items[start:end]

        return Response({
            "items": page_items,
            "total": total,
            "page": page_num,
            "page_size": page_size,
        })
