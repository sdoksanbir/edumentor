from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Grade,
    GradeLevel,
    ExamType,
    Subject,
    LessonCategory,
    Unit,
    LessonTopic,
    Course,
    Topic,
)
from .serializers import (
    GradeLevelSerializer,
    GradeSerializer,
    ExamTypeSerializer,
    SubjectSerializer,
    LessonCategorySerializer,
    LessonCategoryBulkSerializer,
    UnitSerializer,
    UnitBulkSerializer,
    LessonTopicSerializer,
    LessonTopicBulkSerializer,
    CourseSerializer,
    TopicSerializer,
)
from accounts.permissions import IsApprovedUser
from .permissions import IsAdminOnly


class AdminOnlyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsApprovedUser, IsAdminOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        # Search
        search = self.request.query_params.get("search")
        if search and hasattr(self, "search_fields"):
            from django.db.models import Q
            q = Q()
            for field in self.search_fields:
                q |= Q(**{f"{field}__icontains": search})
            qs = qs.filter(q)
        # Ordering
        ordering = self.request.query_params.get("ordering")
        if ordering and hasattr(self, "ordering_fields"):
            if ordering.lstrip("-") in self.ordering_fields:
                qs = qs.order_by(ordering)
        return qs


class GradeLevelViewSet(AdminOnlyViewSet):
    queryset = GradeLevel.objects.all()
    serializer_class = GradeLevelSerializer
    search_fields = ["name", "code"]
    ordering_fields = ["order", "name", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        kind = self.request.query_params.get("kind")
        if kind in (GradeLevel.KIND_CLASS, GradeLevel.KIND_EXAM, GradeLevel.KIND_OTHER):
            qs = qs.filter(kind=kind)
        return qs

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"detail": "ids zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            for i, pk in enumerate(ids, start=1):
                GradeLevel.objects.filter(pk=pk).update(order=i)
        return Response({"status": "ok"})

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"detail": "ids zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = GradeLevel.objects.filter(pk__in=ids).delete()
        return Response({"deleted_count": deleted})


class SubjectViewSet(AdminOnlyViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    search_fields = ["code", "label"]
    ordering_fields = ["order", "label", "created_at"]

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"detail": "ids zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            for i, pk in enumerate(ids, start=1):
                Subject.objects.filter(pk=pk).update(order=i)
        return Response({"status": "ok"})

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"detail": "ids zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = Subject.objects.filter(pk__in=ids).delete()
        return Response({"deleted_count": deleted})


class LessonCategoryViewSet(AdminOnlyViewSet):
    queryset = LessonCategory.objects.select_related("grade_level").all()
    serializer_class = LessonCategorySerializer
    search_fields = ["name"]
    ordering_fields = ["order", "name", "created_at"]

    def list(self, request, *args, **kwargs):
        gl = request.query_params.get("grade_level")
        if not gl:
            return Response(
                {"detail": "grade_level parametresi zorunludur."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        gl = self.request.query_params.get("grade_level")
        if gl:
            qs = qs.filter(grade_level_id=gl)
        return qs

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create(self, request):
        ser = LessonCategoryBulkSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        grade_level = data["grade_level"]
        names_raw = data["names"]
        is_active = data.get("is_active", True)
        skip_existing = data.get("skip_existing", True)

        # trim, boşları at, tekilleştir
        seen_input = set()
        names = []
        for n in names_raw:
            n = (n or "").strip()
            if not n:
                continue
            if n.lower() in seen_input:
                continue
            seen_input.add(n.lower())
            names.append(n)

        if not names:
            return Response(
                {"detail": "En az bir geçerli ders adı gerekli."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not skip_existing:
            # Önce tüm çakışmaları kontrol et
            duplicates = []
            for name in names:
                if LessonCategory.objects.filter(
                    grade_level=grade_level, name__iexact=name
                ).exists():
                    duplicates.append(name)
            if duplicates:
                return Response(
                    {
                        "detail": "Çakışan ders adları var.",
                        "duplicates": duplicates,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        created = []
        skipped = []

        with transaction.atomic():
            for name in names:
                exists = LessonCategory.objects.filter(
                    grade_level=grade_level, name__iexact=name
                ).exists()
                if exists:
                    skipped.append(name)
                else:
                    obj = LessonCategory.objects.create(
                        grade_level=grade_level,
                        name=name,
                        is_active=is_active,
                    )
                    created.append(LessonCategorySerializer(obj).data)

        return Response({
            "created_count": len(created),
            "skipped_count": len(skipped),
            "created": created,
            "skipped": skipped,
        })

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"detail": "ids zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            for i, pk in enumerate(ids, start=1):
                LessonCategory.objects.filter(pk=pk).update(order=i)
        return Response({"status": "ok"})

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"detail": "ids zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = LessonCategory.objects.filter(pk__in=ids).delete()
        return Response({"deleted_count": deleted})


class UnitViewSet(AdminOnlyViewSet):
    queryset = Unit.objects.select_related("lesson_category").all()
    serializer_class = UnitSerializer
    search_fields = ["name"]
    ordering_fields = ["order", "name", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        lc_id = self.request.query_params.get("lesson_category_id")
        if lc_id:
            qs = qs.filter(lesson_category_id=lc_id)
        return qs

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create(self, request):
        ser = UnitBulkSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        lesson_category = data["lesson_category"]
        names_raw = data["names"]
        is_active = data.get("is_active", True)
        skip_existing = data.get("skip_existing", True)

        seen_input = set()
        names = []
        for n in names_raw:
            n = (n or "").strip()
            if not n:
                continue
            if n.lower() in seen_input:
                continue
            seen_input.add(n.lower())
            names.append(n)

        if not names:
            return Response(
                {"detail": "En az bir geçerli ünite adı gerekli."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not skip_existing:
            duplicates = []
            for name in names:
                if Unit.objects.filter(
                    lesson_category=lesson_category, name__iexact=name
                ).exists():
                    duplicates.append(name)
            if duplicates:
                return Response(
                    {
                        "detail": "Çakışan ünite adları var.",
                        "duplicates": duplicates,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        created = []
        skipped = []

        with transaction.atomic():
            for name in names:
                exists = Unit.objects.filter(
                    lesson_category=lesson_category, name__iexact=name
                ).exists()
                if exists:
                    skipped.append(name)
                else:
                    obj = Unit.objects.create(
                        lesson_category=lesson_category,
                        name=name,
                        is_active=is_active,
                    )
                    created.append(UnitSerializer(obj).data)

        return Response({
            "created_count": len(created),
            "skipped_count": len(skipped),
            "created": created,
            "skipped": skipped,
        })

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        lesson_category = request.data.get("lesson_category")
        ids = request.data.get("ids", [])
        if not lesson_category:
            return Response(
                {"detail": "lesson_category zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not ids:
            return Response(
                {"detail": "ids zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            for i, pk in enumerate(ids, start=1):
                Unit.objects.filter(
                    pk=pk, lesson_category_id=lesson_category
                ).update(order=i)
        return Response({"status": "ok"})

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"detail": "ids zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = Unit.objects.filter(pk__in=ids).delete()
        return Response({"deleted_count": deleted})


class LessonTopicViewSet(AdminOnlyViewSet):
    queryset = LessonTopic.objects.select_related(
        "unit", "lesson_category"
    ).all()
    serializer_class = LessonTopicSerializer
    search_fields = ["name"]
    ordering_fields = ["order", "name", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        lc_id = self.request.query_params.get("lesson_category_id")
        unit_id = self.request.query_params.get("unit_id")
        unit_null = self.request.query_params.get("unit__isnull")
        if lc_id:
            qs = qs.filter(lesson_category_id=lc_id)
        if unit_id:
            qs = qs.filter(unit_id=unit_id)
        if unit_null and unit_null.lower() in ("true", "1"):
            qs = qs.filter(unit__isnull=True)
        return qs

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        lesson_category = request.data.get("lesson_category")
        unit = request.data.get("unit")  # can be null for unitless topics
        ids = request.data.get("ids", [])
        if lesson_category is None:
            return Response(
                {"detail": "lesson_category zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not ids:
            return Response(
                {"detail": "ids zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            for i, pk in enumerate(ids, start=1):
                q = LessonTopic.objects.filter(
                    pk=pk, lesson_category_id=lesson_category
                )
                if unit is None:
                    q = q.filter(unit__isnull=True)
                else:
                    q = q.filter(unit_id=unit)
                q.update(order=i)
        return Response({"status": "ok"})

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"detail": "ids zorunludur"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = LessonTopic.objects.filter(pk__in=ids).delete()
        return Response({"deleted_count": deleted})

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create(self, request):
        ser = LessonTopicBulkSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        lesson_category = data["lesson_category"]
        unit = data.get("unit")
        names = data["names"]

        seen = set()
        created_count = 0
        with transaction.atomic():
            for name in names:
                name = (name or "").strip()
                if not name:
                    continue
                if unit:
                    key = ("unit", unit.id, name)
                else:
                    key = ("lc", lesson_category.id, name)
                if key in seen:
                    continue
                seen.add(key)
                if unit:
                    exists = LessonTopic.objects.filter(
                        unit=unit, name=name
                    ).exists()
                else:
                    exists = LessonTopic.objects.filter(
                        lesson_category=lesson_category,
                        unit__isnull=True,
                        name=name,
                    ).exists()
                if not exists:
                    LessonTopic.objects.create(
                        lesson_category=lesson_category,
                        unit=unit,
                        name=name,
                    )
                    created_count += 1
        return Response({"created": created_count})


# --- Legacy (IsAdminForWrite for read by non-admin) ---
from rest_framework.viewsets import ModelViewSet
from .permissions import IsAdminForWrite


class BaseCatalogViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsApprovedUser, IsAdminForWrite]


class GradeViewSet(BaseCatalogViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer


class ExamTypeViewSet(BaseCatalogViewSet):
    queryset = ExamType.objects.all()
    serializer_class = ExamTypeSerializer


class CourseViewSet(BaseCatalogViewSet):
    queryset = Course.objects.select_related("subject").all()
    serializer_class = CourseSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        subject_id = self.request.query_params.get("subject_id")
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        return qs


class TopicViewSet(BaseCatalogViewSet):
    queryset = Topic.objects.select_related("course", "course__subject").all()
    serializer_class = TopicSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get("course_id")
        subject_id = self.request.query_params.get("subject_id")
        if course_id:
            qs = qs.filter(course_id=course_id)
        if subject_id:
            qs = qs.filter(course__subject_id=subject_id)
        return qs
