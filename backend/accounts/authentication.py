"""
JWT Authentication with token_version validation.
Logout-all işlemi token_version'ı artırır; eski tokenlar geçersiz olur.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
from django.utils.translation import gettext_lazy as _


class TRJWTAuthentication(JWTAuthentication):
    """Access token doğrulamasında token_version kontrolü yapar."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        token_version = validated_token.get("token_version", 0)
        user_version = getattr(user, "token_version", 0)
        if token_version != user_version:
            raise AuthenticationFailed(
                _("Token geçersiz. Lütfen tekrar giriş yapın."),
                code="token_version_mismatch",
            )
        return user
