from rest_framework import serializers
from .models import SiteSettings


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Read serializer: smtp_password excluded for security."""

    logo_url = serializers.SerializerMethodField()
    logo_dark_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()

    class Meta:
        model = SiteSettings
        fields = [
            "id",
            "site_name",
            "tagline",
            "support_email",
            "support_phone",
            "address",
            "timezone",
            "locale",
            "logo_url",
            "logo_dark_url",
            "favicon_url",
            "maintenance_enabled",
            "maintenance_message",
            "maintenance_allowed_ips",
            "smtp_enabled",
            "smtp_host",
            "smtp_port",
            "smtp_username",
            "smtp_use_tls",
            "smtp_from_email",
            "force_strong_passwords",
            "force_must_change_password_on_admin_reset",
            "session_notice_enabled",
            "analytics_tracking_id",
            "sentry_dsn",
            "updated_at",
            "updated_by",
        ]
        read_only_fields = ["id", "updated_at"]

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None

    def get_logo_dark_url(self, obj):
        if obj.logo_dark:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.logo_dark.url)
            return obj.logo_dark.url
        return None

    def get_favicon_url(self, obj):
        if obj.favicon:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.favicon.url)
            return obj.favicon.url
        return None


class SiteSettingsUpdateSerializer(serializers.ModelSerializer):
    """PATCH serializer: smtp_password included, optional."""

    class Meta:
        model = SiteSettings
        fields = [
            "site_name",
            "tagline",
            "support_email",
            "support_phone",
            "address",
            "timezone",
            "locale",
            "maintenance_enabled",
            "maintenance_message",
            "maintenance_allowed_ips",
            "smtp_enabled",
            "smtp_host",
            "smtp_port",
            "smtp_username",
            "smtp_password",
            "smtp_use_tls",
            "smtp_from_email",
            "force_strong_passwords",
            "force_must_change_password_on_admin_reset",
            "session_notice_enabled",
            "analytics_tracking_id",
            "sentry_dsn",
        ]
        extra_kwargs = {
            "smtp_password": {"write_only": True, "required": False, "allow_blank": True},
        }

    def validate_smtp_port(self, value):
        if value is not None and (value < 1 or value > 65535):
            raise serializers.ValidationError("Port 1-65535 arasında olmalıdır.")
        return value

    def validate_timezone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Timezone boş olamaz.")
        return value.strip()
