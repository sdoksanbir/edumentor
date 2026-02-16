from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView

from .views import (
    health,
    me,
    MeEventsView,
    RegisterTeacherView,
    TRTokenObtainPairView,
    TRTokenRefreshView,
    LogoutView,
    LogoutAllView,
    ForgotPasswordView,
    ResetPasswordView,
    ChangePasswordView,
)


urlpatterns = [
    # system
    path("health/", health),

    # auth
    path("auth/login/", TRTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TRTokenRefreshView.as_view()),
    path("auth/logout/", LogoutView.as_view()),
    path("auth/logout-all/", LogoutAllView.as_view()),
    path("auth/me/", me),
    path("auth/me/events/", MeEventsView.as_view()),

    # register (SADECE öğretmen)
    path("auth/register-teacher/", RegisterTeacherView.as_view()),

    # password reset
    path("auth/password/forgot/", ForgotPasswordView.as_view()),
    path("auth/password/reset/", ResetPasswordView.as_view()),
    path("auth/change-password/", ChangePasswordView.as_view()),
]
