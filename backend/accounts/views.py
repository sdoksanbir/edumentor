from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import TeacherRegisterSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from .serializers import ForgotPasswordSerializer, ResetPasswordSerializer, MeUpdateSerializer, ChangePasswordSerializer


@api_view(["GET"])
def health(request):
    return Response({"ok": True})


def _me_response(user):
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
        "must_change_password": getattr(user, "must_change_password", False),
    })


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    if request.method == "PATCH":
        ser = MeUpdateSerializer(user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
    return _me_response(user)


class RegisterTeacherView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = TeacherRegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()

        refresh = RefreshToken.for_user(user)

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
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            # 🔐 Güvenli ve Türkçe
            raise AuthenticationFailed("E-posta veya şifre hatalı.")

        # JWT login sonrası last_login güncelle (Django session auth bunu otomatik yapar, JWT yapmaz)
        self.user.last_login = timezone.now()
        self.user.save(update_fields=["last_login"])

        return data

class TRTokenObtainPairView(TokenObtainPairView):
    serializer_class = TRTokenObtainPairSerializer




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


class ChangePasswordView(APIView):
    """Giriş yapmış kullanıcı şifresini değiştirir. must_change_password=True ise zorunlu."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({"detail": "Şifreniz başarıyla güncellendi."}, status=status.HTTP_200_OK)
