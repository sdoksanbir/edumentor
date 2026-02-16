from django.utils.text import slugify
from rest_framework import serializers
from shared.utils.strings import tr_capitalize_first
from .models import Grade, ExamType, Subject, GradeLevel, LessonCategory, Unit, LessonTopic, Course, Topic
from .models import _make_unique_slug


class GradeLevelSerializer(serializers.ModelSerializer):
    code = serializers.CharField(read_only=True)

    def validate_name(self, value):
        return tr_capitalize_first(value) if value else value

    class Meta:
        model = GradeLevel
        fields = [
            "id", "name", "code", "kind", "is_active",
            "order", "created_at", "updated_at",
        ]


class BaseLookupSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ["id", "code", "label", "order", "is_active"]


class GradeSerializer(BaseLookupSerializer):
    class Meta(BaseLookupSerializer.Meta):
        model = Grade


class ExamTypeSerializer(BaseLookupSerializer):
    class Meta(BaseLookupSerializer.Meta):
        model = ExamType


class SubjectSerializer(BaseLookupSerializer):
    code = serializers.CharField(read_only=True)

    def validate_label(self, value):
        return tr_capitalize_first(value) if value else value

    class Meta(BaseLookupSerializer.Meta):
        model = Subject
        fields = ["id", "code", "label", "order", "is_active"]

    def create(self, validated_data):
        label = validated_data.get("label", "")
        base = slugify(label or "x").replace("-", "_")[:50]
        validated_data["code"] = _make_unique_slug(base, Subject)
        return super().create(validated_data)


class LessonCategorySerializer(serializers.ModelSerializer):
    grade_level_name = serializers.CharField(source="grade_level.name", read_only=True)

    def validate_name(self, value):
        return tr_capitalize_first(value) if value else value

    class Meta:
        model = LessonCategory
        fields = [
            "id", "grade_level", "grade_level_name", "name",
            "is_active", "order", "created_at", "updated_at",
        ]


class LessonCategoryBulkSerializer(serializers.Serializer):
    grade_level = serializers.PrimaryKeyRelatedField(
        queryset=GradeLevel.objects.all()
    )
    names = serializers.ListField(
        child=serializers.CharField(max_length=200),
        allow_empty=False,
    )

    def validate_names(self, value):
        return [tr_capitalize_first(n) if n else n for n in value]
    is_active = serializers.BooleanField(default=True)
    skip_existing = serializers.BooleanField(default=True)


class UnitSerializer(serializers.ModelSerializer):
    lesson_category_name = serializers.CharField(source="lesson_category.name", read_only=True)

    def validate_name(self, value):
        return tr_capitalize_first(value) if value else value

    class Meta:
        model = Unit
        fields = [
            "id", "lesson_category", "lesson_category_name",
            "name", "order", "is_active", "created_at", "updated_at",
        ]


class UnitBulkSerializer(serializers.Serializer):
    lesson_category = serializers.PrimaryKeyRelatedField(
        queryset=LessonCategory.objects.all()
    )
    names = serializers.ListField(
        child=serializers.CharField(max_length=200),
        allow_empty=False,
    )
    is_active = serializers.BooleanField(default=True)
    skip_existing = serializers.BooleanField(default=True)

    def validate_names(self, value):
        return [tr_capitalize_first(n) if n else n for n in value]


class LessonTopicSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source="unit.name", read_only=True)
    lesson_category_name = serializers.CharField(source="lesson_category.name", read_only=True)

    def validate_name(self, value):
        return tr_capitalize_first(value) if value else value

    class Meta:
        model = LessonTopic
        fields = [
            "id", "lesson_category", "unit", "unit_name", "lesson_category_name",
            "name", "order", "is_active", "created_at", "updated_at",
        ]

    def validate(self, attrs):
        unit = attrs.get("unit")
        lesson_category = attrs.get("lesson_category")
        if unit and lesson_category:
            if unit.lesson_category_id != lesson_category.id:
                raise serializers.ValidationError(
                    {"unit": "unit.lesson_category ile lesson_category eşleşmeli."}
                )
        return attrs


class LessonTopicBulkSerializer(serializers.Serializer):
    lesson_category = serializers.PrimaryKeyRelatedField(
        queryset=LessonCategory.objects.all()
    )
    unit = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), required=False, allow_null=True
    )
    names = serializers.ListField(
        child=serializers.CharField(max_length=200),
        allow_empty=False,
    )

    def validate_names(self, value):
        return [tr_capitalize_first(n) if n else n for n in value]

    def validate(self, attrs):
        unit = attrs.get("unit")
        lesson_category = attrs["lesson_category"]
        if unit and unit.lesson_category_id != lesson_category.id:
            raise serializers.ValidationError(
                {"unit": "unit.lesson_category ile lesson_category eşleşmeli."}
            )
        return attrs


class CourseSerializer(BaseLookupSerializer):
    subject = serializers.PrimaryKeyRelatedField(read_only=True)
    subject_label = serializers.CharField(source="subject.label", read_only=True)

    class Meta(BaseLookupSerializer.Meta):
        model = Course
        fields = ["id", "code", "label", "order", "is_active", "subject", "subject_label"]


class TopicSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(read_only=True)
    course_label = serializers.CharField(source="course.label", read_only=True)
    subject_id = serializers.IntegerField(source="course.subject_id", read_only=True)
    subject_label = serializers.CharField(source="course.subject.label", read_only=True)

    def validate_title(self, value):
        return tr_capitalize_first(value) if value else value

    class Meta:
        model = Topic
        fields = ["id", "title", "order", "is_active", "course", "course_label", "subject_id", "subject_label"]
