import logging
from django.conf import settings as django_settings
from django.core.mail import get_connection
from django.core.mail.message import EmailMessage
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminOnly

from .models import SiteSettings
from .serializers import SiteSettingsSerializer, SiteSettingsUpdateSerializer

logger = logging.getLogger(__name__)

SINGLETON_ID = 1


def get_site_settings():
    """Get singleton SiteSettings. Creates id=1 if missing."""
    obj, _ = SiteSettings.objects.get_or_create(
        id=SINGLETON_ID,
        defaults={"site_name": "EDUMENTOR"},
    )
    return obj


class SiteSettingsView(APIView):
    """GET /api/admin/settings/site/ - id=1 ayarlarını döndür."""
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request):
        obj = get_site_settings()
        serializer = SiteSettingsSerializer(obj, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        obj = get_site_settings()
        serializer = SiteSettingsUpdateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # smtp_password: gelirse güncelle, gelmezse mevcut kalsın
        if "smtp_password" in data and data["smtp_password"] == "":
            data.pop("smtp_password")

        for key, value in data.items():
            setattr(obj, key, value)
        obj.updated_by = request.user
        obj.save()

        out_serializer = SiteSettingsSerializer(obj, context={"request": request})
        return Response(out_serializer.data)


class SiteSettingsUploadView(APIView):
    """POST /api/admin/settings/site/upload/ - multipart logo/logo_dark/favicon upload."""
    permission_classes = [IsAuthenticated, IsAdminOnly]

    ALLOWED_FIELDS = {"logo", "logo_dark", "favicon"}

    def post(self, request):
        field_name = None
        for k in request.FILES:
            if k in self.ALLOWED_FIELDS:
                field_name = k
                break

        if not field_name:
            return Response(
                {"detail": "Geçersiz alan. 'logo', 'logo_dark' veya 'favicon' gönderin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file_obj = request.FILES[field_name]
        obj = get_site_settings()

        # Eski dosyayı sil (storage üzerinden)
        old_file = getattr(obj, field_name, None)
        if old_file:
            try:
                old_file.delete(save=False)
            except Exception as e:
                logger.warning("Eski dosya silinemedi: %s", e)

        setattr(obj, field_name, file_obj)
        obj.updated_by = request.user
        obj.save(update_fields=[field_name, "updated_at", "updated_by"])

        serializer = SiteSettingsSerializer(obj, context={"request": request})
        return Response(serializer.data)


class SiteSettingsTestEmailView(APIView):
    """POST /api/admin/settings/site/test-email/ - Test mail gönder."""
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def post(self, request):
        obj = get_site_settings()
        if not obj.smtp_enabled:
            return Response(
                {"success": False, "message": "SMTP etkin değil. Önce SMTP ayarlarını yapılandırın."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        to_email = request.data.get("to_email")
        if not to_email or not isinstance(to_email, str):
            return Response(
                {"success": False, "message": "Geçerli bir e-posta adresi girin."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        to_email = to_email.strip()
        if "@" not in to_email:
            return Response(
                {"success": False, "message": "Geçerli bir e-posta adresi girin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Runtime SMTP config
        conn = get_connection(
            backend="django.core.mail.backends.smtp.EmailBackend",
            host=obj.smtp_host,
            port=obj.smtp_port,
            username=obj.smtp_username or None,
            password=obj.smtp_password or None,
            use_tls=obj.smtp_use_tls,
        )
        try:
            msg = EmailMessage(
                subject="EDUMENTOR Test Mail",
                body="Bu bir test e-postasıdır. SMTP ayarlarınız doğru yapılandırılmış.",
                from_email=obj.smtp_from_email or django_settings.DEFAULT_FROM_EMAIL,
                to=[to_email],
                connection=conn,
            )
            msg.send()
            return Response({"success": True})
        except Exception as e:
            msg = str(e)
            if "Authentication failed" in msg or "authentication" in msg.lower():
                msg = "SMTP kimlik doğrulaması başarısız. Kullanıcı adı ve şifreyi kontrol edin."
            elif "Connection" in msg or "connect" in msg.lower():
                msg = "SMTP sunucusuna bağlanılamadı. Host ve portu kontrol edin."
            else:
                msg = "E-posta gönderilemedi. Ayarlarınızı kontrol edin."

            return Response(
                {"success": False, "message": msg},
                status=status.HTTP_400_BAD_REQUEST,
            )
