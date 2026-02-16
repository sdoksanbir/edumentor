"""Billing API URLs - teacher self endpoints."""
from django.urls import path

from .views import TeacherMySubscriptionView

urlpatterns = [
    path("me/subscription/", TeacherMySubscriptionView.as_view()),
]
