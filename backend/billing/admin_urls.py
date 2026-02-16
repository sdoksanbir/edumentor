"""Admin billing URLs - /api/admin/billing/"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PlanViewSet,
    SubscriptionViewSet,
    AdminTeacherSubscriptionView,
)

router = DefaultRouter()
router.register(r"plans", PlanViewSet, basename="admin-billing-plan")
router.register(r"subscriptions", SubscriptionViewSet, basename="admin-billing-subscription")

urlpatterns = [
    path("", include(router.urls)),
    path("teachers/<int:teacher_profile_id>/subscription/", AdminTeacherSubscriptionView.as_view(), name="admin-teacher-subscription"),
]
