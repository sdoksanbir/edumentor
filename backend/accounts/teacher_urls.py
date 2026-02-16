from django.urls import path
from .panel_views import TeacherMyStudentsView, TeacherMyStudentDetailView

urlpatterns = [
    path("students/", TeacherMyStudentsView.as_view(), name="teacher-my-students"),
    path("students/<int:student_pk>/", TeacherMyStudentDetailView.as_view(), name="teacher-my-student-detail"),
]
