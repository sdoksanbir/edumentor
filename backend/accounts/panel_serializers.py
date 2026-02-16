import secrets
from rest_framework import serializers
from .models import User, TeacherProfile, StudentProfile
from catalog.models import Grade, GradeLevel
from accounts.utils.normalize import tr_title
from accounts.utils.phone import normalize_tr_phone


def _grade_from_grade_level(grade_level_id):
    """GradeLevel id -> Grade. Bulur veya oluşturur."""
    if not grade_level_id:
        return None
    try:
        gl = GradeLevel.objects.get(pk=grade_level_id, kind=GradeLevel.KIND_CLASS)
    except GradeLevel.DoesNotExist:
        return None
    grade, _ = Grade.objects.get_or_create(
        code=f"GL-{gl.id}",
        defaults={"label": gl.name, "order": gl.order or 0, "is_active": True},
    )
    return grade


class PanelUserListSerializer(serializers.ModelSerializer):
    teacher_profile_id = serializers.SerializerMethodField()
    student_profile_id = serializers.SerializerMethodField()
    assigned_teacher_id = serializers.SerializerMethodField()
    grade_label = serializers.SerializerMethodField()
    grade_id = serializers.SerializerMethodField()
    grade_level_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "gender",
            "role",
            "is_active",
            "is_approved",
            "must_change_password",
            "profile_completed",
            "created_at",
            "last_login",
            "teacher_profile_id",
            "student_profile_id",
            "assigned_teacher_id",
            "grade_label",
            "grade_id",
            "grade_level_id",
        ]

    def get_teacher_profile_id(self, obj):
        try:
            return obj.teacher_profile.id
        except TeacherProfile.DoesNotExist:
            return None

    def get_student_profile_id(self, obj):
        if obj.role != User.Role.STUDENT:
            return None
        profile, _ = StudentProfile.objects.get_or_create(user=obj)
        return profile.id

    def get_assigned_teacher_id(self, obj):
        """For STUDENT users: TeacherProfile.id of assigned teacher. Null if unassigned."""
        if obj.role != User.Role.STUDENT:
            return None
        try:
            profile = obj.student_profile
            return profile.teacher_id if profile.teacher_id else None
        except StudentProfile.DoesNotExist:
            return None

    def get_grade_label(self, obj):
        """For STUDENT users: grade label from StudentProfile (e.g. '9. Sınıf')."""
        if obj.role != User.Role.STUDENT:
            return None
        try:
            profile = obj.student_profile
            return profile.grade.label if profile.grade else None
        except StudentProfile.DoesNotExist:
            return None

    def get_grade_id(self, obj):
        """For STUDENT users: Grade.id from StudentProfile."""
        if obj.role != User.Role.STUDENT:
            return None
        try:
            profile = obj.student_profile
            return profile.grade_id if profile.grade_id else None
        except StudentProfile.DoesNotExist:
            return None

    def get_grade_level_id(self, obj):
        """For STUDENT users: GradeLevel.id matching grade.label (for edit form)."""
        if obj.role != User.Role.STUDENT:
            return None
        try:
            profile = obj.student_profile
            if not profile.grade:
                return None
            gl = GradeLevel.objects.filter(
                kind=GradeLevel.KIND_CLASS, name=profile.grade.label
            ).first()
            return gl.id if gl else None
        except StudentProfile.DoesNotExist:
            return None


class PanelUserSerializer(serializers.ModelSerializer):
    """PATCH için - admin güncelleyebilir."""
    student_grade_id = serializers.IntegerField(required=False, allow_null=True)
    student_grade_level_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone",
            "gender",
            "role",
            "is_active",
            "is_approved",
            "student_grade_id",
            "student_grade_level_id",
        ]

    def validate_first_name(self, value):
        if not value or not value.strip():
            return ""
        return tr_title(value)

    def validate_last_name(self, value):
        if not value or not value.strip():
            return ""
        return tr_title(value)

    def validate_phone(self, value):
        if not value or not value.strip():
            return ""
        return normalize_tr_phone(value)

    def validate_gender(self, value):
        if not value:
            return User.Gender.UNSPECIFIED
        valid = [c.value for c in User.Gender]
        if value not in valid:
            raise serializers.ValidationError("Geçersiz cinsiyet seçimi.")
        return value

    def update(self, instance, validated_data):
        from django.utils import timezone
        wants_grade_update = (
            "student_grade_level_id" in validated_data or "student_grade_id" in validated_data
        )
        student_grade_id = validated_data.pop("student_grade_id", None)
        student_grade_level_id = validated_data.pop("student_grade_level_id", None)
        user = super().update(instance, validated_data)
        if validated_data.get("is_approved") and not user.approved_at:
            user.approved_at = timezone.now()
            user.approved_by = self.context["request"].user
            user.save(update_fields=["approved_at", "approved_by"])
        if user.role == User.Role.STUDENT and wants_grade_update:
            grade = None
            if student_grade_level_id is not None:
                grade = _grade_from_grade_level(student_grade_level_id)
            elif student_grade_id is not None:
                try:
                    grade = Grade.objects.get(pk=student_grade_id) if student_grade_id else None
                except Grade.DoesNotExist:
                    pass
            try:
                profile = user.student_profile
                profile.grade = grade
                profile.save(update_fields=["grade"])
            except StudentProfile.DoesNotExist:
                pass
        return user


class PanelUserCreateSerializer(serializers.ModelSerializer):
    """POST için - admin kullanıcı oluşturur, şifre backend üretir."""
    password = serializers.CharField(write_only=True, required=False)
    grade_id = serializers.IntegerField(required=False, allow_null=True)
    grade_level_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone",
            "gender",
            "role",
            "is_approved",
            "grade_id",
            "grade_level_id",
            "password",
        ]

    def validate_first_name(self, value):
        if not value or not value.strip():
            return ""
        return tr_title(value)

    def validate_last_name(self, value):
        if not value or not value.strip():
            return ""
        return tr_title(value)

    def validate_phone(self, value):
        if not value or not value.strip():
            return ""
        return normalize_tr_phone(value)

    def validate_gender(self, value):
        if not value:
            return User.Gender.UNSPECIFIED
        valid = [c.value for c in User.Gender]
        if value not in valid:
            raise serializers.ValidationError("Geçersiz cinsiyet seçimi.")
        return value

    def validate_email(self, value):
        value = (value or "").strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Bu e-posta zaten kayıtlı.")
        return value

    def create(self, validated_data):
        validated_data.pop("password", None)
        grade_id = validated_data.pop("grade_id", None)
        grade_level_id = validated_data.pop("grade_level_id", None)
        email = validated_data.pop("email")
        user = User.objects.create_user(
            email=email,
            password=secrets.token_urlsafe(16),
            **validated_data,
        )
        if user.role == User.Role.STUDENT:
            grade = None
            if grade_level_id is not None:
                grade = _grade_from_grade_level(grade_level_id)
            elif grade_id is not None:
                try:
                    grade = Grade.objects.get(pk=grade_id) if grade_id else None
                except Grade.DoesNotExist:
                    pass
            if grade is not None:
                try:
                    profile = user.student_profile
                    profile.grade = grade
                    profile.save(update_fields=["grade"])
                except StudentProfile.DoesNotExist:
                    StudentProfile.objects.create(user=user, grade=grade)
        return user


class TeacherListSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    branch = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = ["id", "user_id", "email", "first_name", "last_name", "branch"]

    def get_branch(self, obj):
        return obj.branch.label if obj.branch else ""


class TeacherStudentSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True, default="")
    grade = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = ["id", "user_id", "email", "first_name", "last_name", "phone", "grade", "status", "created_at"]

    def get_grade(self, obj):
        return obj.grade.label if obj.grade else ""

    def get_status(self, obj):
        return "ACTIVE" if obj.user.is_active else "PASSIVE"
