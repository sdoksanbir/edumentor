from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.utils.normalize import tr_title
from accounts.utils.phone import normalize_tr_phone

User = get_user_model()


class MeUpdateSerializer(serializers.Serializer):
    """PATCH /auth/me/ için profile güncelleme."""

    first_name = serializers.CharField(required=False, allow_blank=True, max_length=50)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=50)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=30)
    gender = serializers.ChoiceField(
        choices=[(c.value, c.label) for c in User.Gender],
        required=False,
    )

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
        user = instance
        update_fields = []
        if "first_name" in validated_data:
            user.first_name = validated_data["first_name"] or ""
            update_fields.append("first_name")
        if "last_name" in validated_data:
            user.last_name = validated_data["last_name"] or ""
            update_fields.append("last_name")
        if "phone" in validated_data:
            user.phone = validated_data["phone"] or ""
            update_fields.append("phone")
        if "gender" in validated_data:
            user.gender = validated_data["gender"] or User.Gender.UNSPECIFIED
            update_fields.append("gender")
        fn = (user.first_name or "").strip()
        ln = (user.last_name or "").strip()
        if fn and ln and not user.profile_completed:
            user.profile_completed = True
            update_fields.append("profile_completed")
        if update_fields:
            user.save(update_fields=update_fields)
        return user


class TeacherRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    def validate_first_name(self, value):
        if not value or not value.strip():
            return ""
        return tr_title(value)

    def validate_last_name(self, value):
        if not value or not value.strip():
            return ""
        return tr_title(value)

    def validate_email(self, value):
        value = (value or "").strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Bu email zaten kayıtlı.")
        return value

    def validate(self, attrs):
        """
        ✅ Django AUTH_PASSWORD_VALIDATORS'ı, user attribute similarity dahil
        en doğru şekilde uygular.
        """
        email = (attrs.get("email") or "").strip().lower()
        first_name = attrs.get("first_name") or ""
        last_name = attrs.get("last_name") or ""
        password = attrs.get("password") or ""

        # DB'ye yazmadan geçici user objesi oluştur (similarity validator için)
        temp_user = User(email=email, first_name=first_name, last_name=last_name)

        try:
            validate_password(password, user=temp_user)
        except DjangoValidationError as e:
            # DRF standardı: field bazlı error
            raise serializers.ValidationError({"password": list(e.messages)})

        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"].strip().lower(),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=User.Role.TEACHER,
            is_active=True,
            is_approved=False,  # Self-register: admin onayı bekler
        )
        return user


from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return (value or "").strip().lower()

    def save(self):
        """
        Güvenlik: kullanıcı var/yok bilgisini sızdırmayız.
        Eğer kullanıcı varsa reset link üretip email göndeririz.
        """
        email = self.validated_data["email"]
        user = User.objects.filter(email=email, is_active=True).first()
        if not user:
            return  # her zaman başarılı gibi davran

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = PasswordResetTokenGenerator().make_token(user)

        base = getattr(settings, "FRONTEND_RESET_PASSWORD_URL", "").rstrip("/")
        reset_link = f"{base}?uid={uid}&token={token}"

        subject = "Şifre Sıfırlama"
        message = (
            "Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanın:\n\n"
            f"{reset_link}\n\n"
            "Eğer bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz."
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[user.email],
            fail_silently=False,
        )


class ChangePasswordSerializer(serializers.Serializer):
    """POST /auth/change-password/ - giriş yapmış kullanıcı şifresini değiştirir."""
    old_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate_old_password(self, value):
        user = self.context.get("request").user
        if not user.check_password(value):
            raise serializers.ValidationError("Mevcut şifre hatalı.")
        return value

    def validate_new_password(self, value):
        user = self.context.get("request").user
        try:
            validate_password(value, user=user)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])
        return user


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        uid = attrs.get("uid")
        token = attrs.get("token")
        new_password = attrs.get("new_password") or ""

        # uid -> user
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except Exception:
            raise serializers.ValidationError({"uid": "Geçersiz bağlantı."})

        # token doğrula
        if not PasswordResetTokenGenerator().check_token(user, token):
            raise serializers.ValidationError({"token": "Bağlantı geçersiz veya süresi dolmuş."})

        # Django password validators (sen register'da yaptığın gibi)
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        new_password = self.validated_data["new_password"]
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return user
