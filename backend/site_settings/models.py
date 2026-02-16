from django.db import models
from django.conf import settings


class SiteSettings(models.Model):
    """Singleton model for site-wide settings. Always use id=1."""

    # General
    site_name = models.CharField(max_length=100, default="EDUMENTOR")
    tagline = models.CharField(max_length=200, blank=True, default="")
    support_email = models.EmailField(blank=True, default="")
    support_phone = models.CharField(max_length=50, blank=True, default="")
    address = models.TextField(blank=True, default="")
    timezone = models.CharField(max_length=50, default="Europe/Istanbul")
    locale = models.CharField(max_length=20, default="tr-TR")

    # Branding
    logo = models.ImageField(upload_to="branding/", null=True, blank=True)
    logo_dark = models.ImageField(upload_to="branding/", null=True, blank=True)
    favicon = models.ImageField(upload_to="branding/", null=True, blank=True)

    # Maintenance
    maintenance_enabled = models.BooleanField(default=False)
    maintenance_message = models.TextField(
        blank=True, default="Sistem bakımda. Lütfen daha sonra tekrar deneyin."
    )
    maintenance_allowed_ips = models.TextField(blank=True, default="")  # line per IP

    # SMTP
    smtp_enabled = models.BooleanField(default=False)
    smtp_host = models.CharField(max_length=255, blank=True, default="")
    smtp_port = models.IntegerField(default=587)
    smtp_username = models.CharField(max_length=255, blank=True, default="")
    smtp_password = models.CharField(max_length=255, blank=True, default="")
    smtp_use_tls = models.BooleanField(default=True)
    smtp_from_email = models.EmailField(blank=True, default="")

    # Security
    force_strong_passwords = models.BooleanField(default=True)
    force_must_change_password_on_admin_reset = models.BooleanField(default=True)
    session_notice_enabled = models.BooleanField(default=True)

    # Integrations
    analytics_tracking_id = models.CharField(max_length=255, blank=True, default="")
    sentry_dsn = models.CharField(max_length=500, blank=True, default="")

    # Audit
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="site_settings_updates",
    )

    class Meta:
        verbose_name = "Site Ayarları"
        verbose_name_plural = "Site Ayarları"

    def __str__(self):
        return f"SiteSettings (id={self.id})"
