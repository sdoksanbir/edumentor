from django.test import TestCase
from rest_framework.test import APIClient
from .models import User, AuthEventLog


class AuthEventLogTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="test123",
            role=User.Role.ADMIN,
            is_staff=True,
        )
        self.teacher = User.objects.create_user(
            email="teacher@test.com",
            password="test123",
            role=User.Role.TEACHER,
        )

    def test_admin_reports_200(self):
        """Admin token ile reports endpoint 200 döner."""
        self.client.force_authenticate(user=self.admin)
        r = self.client.get("/api/admin/reports/teacher-performance/")
        self.assertEqual(r.status_code, 200)
        r = self.client.get("/api/admin/reports/login-logs/")
        self.assertEqual(r.status_code, 200)

    def test_teacher_reports_403(self):
        """Teacher token ile reports endpoint 403 döner."""
        self.client.force_authenticate(user=self.teacher)
        r = self.client.get("/api/admin/reports/teacher-performance/")
        self.assertEqual(r.status_code, 403)

    def test_admin_all_reports_200(self):
        """Admin token ile tüm reports endpointleri 200 döner."""
        self.client.force_authenticate(user=self.admin)
        endpoints = [
            "/api/admin/reports/teacher-performance/",
            "/api/admin/reports/student-progress/",
            "/api/admin/reports/most-active-teachers/",
            "/api/admin/reports/most-used-courses/",
            "/api/admin/reports/daily-logins/",
            "/api/admin/reports/login-logs/",
        ]
        for url in endpoints:
            r = self.client.get(url)
            self.assertEqual(r.status_code, 200, f"Failed: {url}")
