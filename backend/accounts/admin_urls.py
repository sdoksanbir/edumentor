"""
Admin-only API endpoints (analytics vb.).
/api/admin/ prefix altında.
"""
from django.urls import path

from .admin_views import DashboardAnalyticsView
from .admin_reports_views import (
    TeacherPerformanceReportView,
    StudentProgressReportView,
    MostActiveTeachersReportView,
    MostUsedCoursesReportView,
    DailyLoginsReportView,
    LoginLogsReportView,
    RiskyTeachersReportView,
    InactiveStudentsReportView,
)

urlpatterns = [
    path("analytics/dashboard/", DashboardAnalyticsView.as_view(), name="admin-analytics-dashboard"),
    # Reports
    path("reports/teacher-performance/", TeacherPerformanceReportView.as_view()),
    path("reports/student-progress/", StudentProgressReportView.as_view()),
    path("reports/most-active-teachers/", MostActiveTeachersReportView.as_view()),
    path("reports/most-used-courses/", MostUsedCoursesReportView.as_view()),
    path("reports/daily-logins/", DailyLoginsReportView.as_view()),
    path("reports/login-logs/", LoginLogsReportView.as_view()),
    path("reports/risky-teachers/", RiskyTeachersReportView.as_view()),
    path("reports/inactive-students/", InactiveStudentsReportView.as_view()),
]
