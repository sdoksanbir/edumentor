"""
Admin Analytics API - Dashboard metrikleri ve grafik verileri.
Sadece ADMIN rolü erişebilir.
"""
from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import User, TeacherProfile, StudentProfile
from .permissions import IsAdminOnly


def _monthly_new_users():
    """Son 12 ay için aylık yeni kayıt sayısı."""
    now = timezone.now()
    result = []
    for i in range(12):
        # i ay önce - ayın ilk günü
        if i == 0:
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            first_of_this = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # i ay geri: önce 1 gün geri git, sonra o ayın 1'ine al
            d = first_of_this
            for _ in range(i):
                d = (d - timedelta(days=1)).replace(day=1)
            month_start = d
        # Ayın sonu
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        month_end = next_month - timedelta(seconds=1)

        count = User.objects.filter(
            created_at__gte=month_start,
            created_at__lte=month_end,
        ).count()

        month_str = month_start.strftime("%Y-%m")
        result.append({"month": month_str, "count": count})

    return result


def _role_distribution():
    """Rol bazlı dağılım (ADMIN, TEACHER, STUDENT)."""
    qs = User.objects.filter(
        role__in=[User.Role.ADMIN, User.Role.TEACHER, User.Role.STUDENT]
    ).values("role").annotate(count=Count("id")).order_by("role")

    role_map = {r.value: r.value for r in User.Role if r.value in ["ADMIN", "TEACHER", "STUDENT"]}
    result = []
    for item in qs:
        result.append({"role": item["role"], "count": item["count"]})

    # Eksik roller 0 ile ekle
    seen = {r["role"] for r in result}
    for role in ["ADMIN", "TEACHER", "STUDENT"]:
        if role not in seen:
            result.append({"role": role, "count": 0})

    return sorted(result, key=lambda x: ["ADMIN", "TEACHER", "STUDENT"].index(x["role"]))


def _students_per_teacher():
    """
    Öğretmen başına öğrenci sayısı (Top 10).
    StudentProfile.teacher -> TeacherProfile ilişkisi kullanılıyor.
    """
    qs = (
        TeacherProfile.objects.annotate(student_count=Count("students"))
        .filter(student_count__gt=0)
        .order_by("-student_count")[:10]
        .select_related("user")
    )

    result = []
    for tp in qs:
        user = tp.user
        name = f"{user.first_name or ''} {user.last_name or ''}".strip()
        if not name:
            name = user.email
        result.append({
            "teacher_id": user.id,
            "teacher_name": name,
            "count": tp.student_count,
        })

    return result


def _weekly_active_trend():
    """
    Son 8 hafta için haftalık aktiflik trendi.

    FALLBACK: Login/API log tablosu yok - şimdilik haftalık yeni kayıt sayısı
    kullanılıyor. İleride UserLoginLog veya ApiAccessLog tablosu eklendiğinde
    bu fonksiyon içinde sadece sorguyu değiştirmek yeterli olacak.
    """
    # TODO: Login log tablosu geldiğinde burayı güncelle.
    # Örnek: UserLoginLog.objects.filter(created_at__range=(start, end)).values('user').distinct().count()
    now = timezone.now()
    result = []

    for i in range(7, -1, -1):
        # ISO week: Pazartesi başlangıç
        week_end = now - timedelta(weeks=i)
        week_start = week_end - timedelta(days=7)

        # Haftalık yeni kayıt sayısı (fallback)
        count = User.objects.filter(
            created_at__gte=week_start,
            created_at__lt=week_end,
        ).count()

        year, week, _ = week_start.isocalendar()
        week_str = f"{year}-W{week:02d}"
        result.append({"week": week_str, "count": count})

    return result


class DashboardAnalyticsView(APIView):
    """
    GET /api/admin/analytics/dashboard/
    ADMIN only. Dashboard için tüm metrikleri tek çağrıda döner.
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        now = timezone.now()
        seven_days_ago = now - timedelta(days=7)

        # Metrikler (N+1 önlemek için tek sorgular)
        total_users = User.objects.count()

        active_teachers = User.objects.filter(
            role=User.Role.TEACHER,
            is_active=True,
        ).count()

        active_students = User.objects.filter(
            role=User.Role.STUDENT,
            is_active=True,
        ).count()

        # Atanmış öğrenci oranı: StudentProfile.teacher_id IS NOT NULL / toplam öğrenci
        total_students_with_profile = StudentProfile.objects.count()
        assigned_count = StudentProfile.objects.filter(teacher__isnull=False).count()
        if total_students_with_profile > 0:
            assigned_student_ratio = round(
                100.0 * assigned_count / total_students_with_profile,
                1,
            )
        else:
            assigned_student_ratio = 0.0

        new_users_last_7_days = User.objects.filter(
            created_at__gte=seven_days_ago,
        ).count()

        must_change_password_count = User.objects.filter(
            must_change_password=True,
        ).count()

        # Grafik verileri
        monthly_new_users = _monthly_new_users()
        role_distribution = _role_distribution()
        students_per_teacher = _students_per_teacher()
        weekly_active_trend = _weekly_active_trend()

        return Response({
            "total_users": total_users,
            "active_teachers": active_teachers,
            "active_students": active_students,
            "assigned_student_ratio": assigned_student_ratio,
            "new_users_last_7_days": new_users_last_7_days,
            "must_change_password_count": must_change_password_count,
            "monthly_new_users": monthly_new_users,
            "role_distribution": role_distribution,
            "students_per_teacher": students_per_teacher,
            "weekly_active_trend": weekly_active_trend,
        })
