from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .panel_views import (
    PanelUserViewSet,
    PanelTeacherListView,
    PanelStudentListView,
    TeacherStudentsView,
    TeacherAvailableStudentsView,
    TeacherAssignStudentsView,
    TeacherUnassignStudentsView,
    TeacherMyStudentsView,
)

router = DefaultRouter()
router.register(r"users", PanelUserViewSet, basename="panel-user")
router.register(r"teachers", PanelTeacherListView, basename="panel-teacher")

urlpatterns = [
    path("students/", PanelStudentListView.as_view(), name="panel-students"),
    path(
        "teachers/<int:teacher_pk>/students/",
        TeacherStudentsView.as_view(),
        name="panel-teacher-students",
    ),
    path(
        "teachers/<int:teacher_pk>/available-students/",
        TeacherAvailableStudentsView.as_view(),
        name="panel-teacher-available-students",
    ),
    path(
        "teachers/<int:teacher_pk>/assign-students/",
        TeacherAssignStudentsView.as_view(),
        name="panel-teacher-assign",
    ),
    path(
        "teachers/<int:teacher_pk>/unassign-students/",
        TeacherUnassignStudentsView.as_view(),
        name="panel-teacher-unassign",
    ),
    path("", include(router.urls)),
]
