"""
Admin-only API endpoints (analytics vb.).
/api/admin/ prefix altında.
"""
from django.urls import path

from .admin_views import DashboardAnalyticsView

urlpatterns = [
    path("analytics/dashboard/", DashboardAnalyticsView.as_view(), name="admin-analytics-dashboard"),
]
