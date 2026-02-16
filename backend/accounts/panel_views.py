"""
Admin Panel API - Kullanıcı yönetimi ve öğretmen-öğrenci atama.
Sadece ADMIN rolü erişebilir.
"""
import secrets
import string
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User, TeacherProfile, StudentProfile
from .permissions import IsAdminOnly
from .panel_serializers import (
    PanelUserSerializer,
    PanelUserCreateSerializer,
    PanelUserListSerializer,
    TeacherStudentSerializer,
    TeacherListSerializer,
)


def _generate_password(length=14):
    """Güçlü rastgele şifre üretir."""
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


class PanelUserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class PanelUserViewSet(viewsets.ModelViewSet):
    """GET/POST /api/panel/users/ - ADMIN only."""
    permission_classes = [IsAuthenticated, IsAdminOnly]
    queryset = User.objects.all().order_by("-created_at")
    pagination_class = PanelUserPagination

    def get_serializer_class(self):
        if self.action == "create":
            return PanelUserCreateSerializer
        if self.action in ("list", "retrieve"):
            return PanelUserListSerializer
        return PanelUserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )
        role = self.request.query_params.get("role", "").strip()
        if role in [User.Role.ADMIN, User.Role.TEACHER, User.Role.STUDENT, User.Role.PARENT]:
            qs = qs.filter(role=role)
        approved = self.request.query_params.get("approved", "").strip().lower()
        if approved == "true" or approved == "1":
            qs = qs.filter(is_approved=True)
        elif approved == "false" or approved == "0":
            qs = qs.filter(is_approved=False)
        active = self.request.query_params.get("active", "").strip().lower()
        if active == "true" or active == "1":
            qs = qs.filter(is_active=True)
        elif active == "false" or active == "0":
            qs = qs.filter(is_active=False)
        return qs

    def create(self, request, *args, **kwargs):
        ser = PanelUserCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        password = _generate_password()
        user = ser.save()
        user.set_password(password)
        user.must_change_password = True
        user.is_approved = ser.validated_data.get("is_approved", True)
        user.save(update_fields=["password", "must_change_password", "is_approved"])
        # Rol için profile oluştur
        if user.role == User.Role.TEACHER:
            TeacherProfile.objects.get_or_create(user=user)
        elif user.role == User.Role.STUDENT:
            StudentProfile.objects.get_or_create(user=user)
        return Response(
            {
                "user": PanelUserListSerializer(user).data,
                # Admin-only: Geçici şifre sadece oluşturulduğu anda 1 kez döner.
                # DB'de plaintext tutulmaz (set_password ile hashlenir).
                "generated_password": password,
            },
            status=status.HTTP_201_CREATED,
        )

    def perform_update(self, serializer):
        user = serializer.save()
        if "is_approved" in serializer.validated_data and serializer.validated_data["is_approved"]:
            if not user.approved_at:
                user.approved_at = timezone.now()
                user.approved_by = self.request.user
                user.save(update_fields=["approved_at", "approved_by"])

    @action(detail=True, methods=["post"])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        password = _generate_password()
        user.set_password(password)
        user.must_change_password = True
        user.save(update_fields=["password", "must_change_password"])
        # Admin-only: Geçici şifre sadece oluşturulduğu anda 1 kez döner.
        return Response({"generated_password": password})

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {"detail": "Kendinizi silemezsiniz."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PanelStudentListView(APIView):
    """GET /api/panel/students/ - öğrenci listesi (atama için)."""
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        qs = StudentProfile.objects.all().select_related("user", "grade").order_by("user__first_name", "user__last_name")
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            )
        return Response(TeacherStudentSerializer(qs, many=True).data)


class PanelTeacherListView(viewsets.ReadOnlyModelViewSet):
    """GET /api/panel/teachers/ - öğretmen listesi (dropdown için)."""
    permission_classes = [IsAuthenticated, IsAdminOnly]
    queryset = TeacherProfile.objects.all().select_related("user", "branch").order_by("user__first_name", "user__last_name")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            )
        return Response(TeacherListSerializer(qs, many=True).data)


class TeacherAvailableStudentsView(APIView):
    """GET /api/panel/teachers/<id>/available-students/ - Öğretmene atanmamış öğrenciler."""
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request, teacher_pk):
        try:
            tp = TeacherProfile.objects.get(pk=teacher_pk)
        except TeacherProfile.DoesNotExist:
            return Response({"detail": "Öğretmen bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
        # teacher=None VEYA teacher başka bir öğretmen olan öğrenciler (bu öğretmene atanabilir)
        qs = StudentProfile.objects.filter(
            Q(teacher__isnull=True) | ~Q(teacher=tp)
        ).select_related("user", "grade").order_by("user__first_name", "user__last_name")
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__phone__icontains=search)
            )
        return Response(TeacherStudentSerializer(qs, many=True).data)


class TeacherStudentsView(APIView):
    """GET /api/panel/teachers/<id>/students/"""
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request, teacher_pk):
        try:
            tp = TeacherProfile.objects.get(pk=teacher_pk)
        except TeacherProfile.DoesNotExist:
            return Response({"detail": "Öğretmen bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
        students = StudentProfile.objects.filter(teacher=tp).select_related("user", "grade")
        search = request.query_params.get("search", "").strip()
        if search:
            students = students.filter(
                Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__phone__icontains=search)
            )
        return Response(TeacherStudentSerializer(students, many=True).data)


class TeacherAssignStudentsView(APIView):
    """POST /api/panel/teachers/<id>/assign-students/
    One student can have only one teacher. Rejects if student already assigned to another teacher.
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def post(self, request, teacher_pk):
        try:
            tp = TeacherProfile.objects.get(pk=teacher_pk)
        except TeacherProfile.DoesNotExist:
            return Response({"detail": "Öğretmen bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
        ids = request.data.get("student_ids", [])
        if not ids:
            return Response({"detail": "student_ids zorunludur."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce: one student = one teacher. Reject if already assigned to another teacher.
        already_assigned = StudentProfile.objects.filter(
            pk__in=ids
        ).exclude(teacher__isnull=True).exclude(teacher=tp)
        if already_assigned.exists():
            emails = [
                sp.user.email
                for sp in already_assigned.select_related("user")[:5]
            ]
            return Response(
                {
                    "detail": "Bazı öğrenciler başka bir öğretmene atanmış. Her öğrenci sadece bir öğretmene atanabilir.",
                    "already_assigned": emails,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = StudentProfile.objects.filter(pk__in=ids).update(teacher=tp)
        return Response({"assigned_count": updated})


class TeacherMyStudentDetailView(APIView):
    """GET /api/teacher/students/<id>/ - Logged-in teacher's single student."""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_pk):
        user = request.user
        if not hasattr(user, "teacher_profile") or user.role != User.Role.TEACHER:
            return Response(
                {"detail": "Bu endpoint sadece öğretmenler içindir."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            tp = user.teacher_profile
        except TeacherProfile.DoesNotExist:
            return Response(
                {"detail": "Öğretmen profili bulunamadı."},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            student = StudentProfile.objects.get(pk=student_pk, teacher=tp)
        except StudentProfile.DoesNotExist:
            return Response(
                {"detail": "Öğrenci bulunamadı veya size atanmamış."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(TeacherStudentSerializer(student).data)


class TeacherMyStudentsView(APIView):
    """GET /api/teacher/students/ - Logged-in teacher's assigned students."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, "teacher_profile") or user.role != User.Role.TEACHER:
            return Response(
                {"detail": "Bu endpoint sadece öğretmenler içindir."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            tp = user.teacher_profile
        except TeacherProfile.DoesNotExist:
            return Response(TeacherStudentSerializer([], many=True).data)
        students = StudentProfile.objects.filter(teacher=tp).select_related("user", "grade")
        search = request.query_params.get("search", "").strip()
        if search:
            students = students.filter(
                Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__phone__icontains=search)
            )
        return Response(TeacherStudentSerializer(students, many=True).data)


class TeacherUnassignStudentsView(APIView):
    """POST /api/panel/teachers/<id>/unassign-students/"""
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def post(self, request, teacher_pk):
        try:
            tp = TeacherProfile.objects.get(pk=teacher_pk)
        except TeacherProfile.DoesNotExist:
            return Response({"detail": "Öğretmen bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
        ids = request.data.get("student_ids", [])
        if not ids:
            return Response({"detail": "student_ids zorunludur."}, status=status.HTTP_400_BAD_REQUEST)
        updated = StudentProfile.objects.filter(pk__in=ids, teacher=tp).update(teacher=None)
        return Response({"unassigned_count": updated})
