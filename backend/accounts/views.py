from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework.exceptions import AuthenticationFailed
from .serializers import TeacherRegisterSerializer, ForgotPasswordSerializer, ResetPasswordSerializer, MeUpdateSerializer, ChangePasswordSerializer
from .utils.auth_logging import log_auth_event
from .models import AuthEventLog


@api_view(["GET"])
def health(request):
    return Response({"ok": True})


def _me_response(user, request=None):
    approved_by_id = None
    approved_by_email = None
    ab = getattr(user, "approved_by", None)
    if ab:
        approved_by_id = ab.id
        approved_by_email = ab.email

    avatar_url = None
    avatar = getattr(user, "avatar", None)
    if avatar and hasattr(avatar, "url"):
        avatar_url = avatar.url
        if request:
            avatar_url = request.build_absolute_uri(avatar_url)

    return Response({
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone or "",
        "gender": getattr(user, "gender", "UNSPECIFIED"),
        "profile_completed": user.profile_completed,
        "role": getattr(user, "role", None),
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_approved": getattr(user, "is_approved", True),
        "is_active": getattr(user, "is_active", True),
        "must_change_password": getattr(user, "must_change_password", False),
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "approved_at_iso": getattr(user, "approved_at", None).isoformat() if getattr(user, "approved_at", None) else None,
        "approved_by_id": approved_by_id,
        "approved_by_email": approved_by_email,
        "avatar_url": avatar_url,
    })


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    if request.method == "PATCH":
        ser = MeUpdateSerializer(user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
    return _me_response(user, request)


class RegisterTeacherView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = TeacherRegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()

        refresh = RefreshToken.for_user(user)
        refresh["token_version"] = getattr(user, "token_version", 0)

        return Response(
            {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": getattr(user, "role", None),
                    "is_approved": getattr(user, "is_approved", False),
                    "must_change_password": getattr(user, "must_change_password", False),
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )



class TRTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["token_version"] = getattr(user, "token_version", 0)
        return token

    def validate(self, attrs):
        request = self.context.get("request")
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            # Başarısız login logla (user yok, email meta'da)
            attempted = attrs.get("email") or attrs.get("username") or ""
            log_auth_event(
                request,
                AuthEventLog.EventType.LOGIN_FAIL,
                user=None,
                meta={"email": str(attempted)},
            )
            raise AuthenticationFailed("E-posta veya şifre hatalı.")

        # Başarılı login logla
        log_auth_event(request, AuthEventLog.EventType.LOGIN_SUCCESS, user=self.user)

        # JWT login sonrası last_login güncelle
        self.user.last_login = timezone.now()
        self.user.save(update_fields=["last_login"])

        return data


class TRTokenObtainPairView(TokenObtainPairView):
    serializer_class = TRTokenObtainPairSerializer


class TRTokenRefreshSerializer(TokenRefreshSerializer):
    """Refresh token doğrulamasında token_version kontrolü yapar."""

    def validate(self, attrs):
        refresh = self.token_class(attrs["refresh"])
        user_id = refresh.payload.get(api_settings.USER_ID_CLAIM)
        if user_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(**{api_settings.USER_ID_FIELD: user_id})
            except User.DoesNotExist:
                pass
            else:
                token_version = refresh.payload.get("token_version", 0)
                user_version = getattr(user, "token_version", 0)
                if token_version != user_version:
                    raise AuthenticationFailed(
                        "Token geçersiz. Lütfen tekrar giriş yapın.",
                        code="token_version_mismatch",
                    )
        return super().validate(attrs)


class TRTokenRefreshView(TokenRefreshView):
    serializer_class = TRTokenRefreshSerializer
    """Refresh token sonrası REFRESH event loglar."""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        # Token'dan user çıkarmak için decode gerekir; basit tutmak için
        # refresh sonrası user bilgisi olmadan log atıyoruz (opsiyonel)
        log_auth_event(request, AuthEventLog.EventType.REFRESH, user=None, meta={"event": "token_refresh"})
        return response




class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = ForgotPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()

        # Güvenlik için her zaman aynı cevap
        return Response(
            {"detail": "Eğer bu email kayıtlıysa şifre sıfırlama bağlantısı gönderildi."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = ResetPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({"detail": "Şifre başarıyla güncellendi."}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Logout sırasında LOGOUT event loglanır."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        log_auth_event(request, AuthEventLog.EventType.LOGOUT, user=request.user)
        return Response({"detail": "Başarıyla çıkış yapıldı."}, status=status.HTTP_200_OK)


class LogoutAllView(APIView):
    """Tüm cihazlardan çıkış: token_version artırılır, mevcut tüm tokenlar geçersiz olur."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.token_version = (getattr(user, "token_version", 0) or 0) + 1
        user.save(update_fields=["token_version"])
        log_auth_event(request, AuthEventLog.EventType.LOGOUT, user=user, meta={"logout_all": True})
        return Response({"success": True}, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """Giriş yapmış kullanıcı şifresini değiştirir. must_change_password=True ise zorunlu."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({"detail": "Şifreniz başarıyla güncellendi."}, status=status.HTTP_200_OK)


class MeEventsView(APIView):
    """GET /auth/me/events/ - kullanıcının kendi auth event logları (paginated)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from datetime import timedelta

        user = request.user
        days = int(request.query_params.get("days", 30))
        page = max(1, int(request.query_params.get("page", 1)))
        page_size = min(50, max(1, int(request.query_params.get("page_size", 20))))

        since = timezone.now() - timedelta(days=days)
        qs = AuthEventLog.objects.filter(user=user, created_at__gte=since).order_by("-created_at")

        total = qs.count()
        offset = (page - 1) * page_size
        items_qs = qs[offset : offset + page_size]

        items = [
            {
                "id": e.id,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "event_type": e.event_type,
                "ip_address": e.ip_address or "",
                "user_agent": e.user_agent or "",
                "meta": e.meta or {},
            }
            for e in items_qs
        ]

        return Response({
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        })
