from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/admin/", include("accounts.admin_urls")),
    path("api/panel/", include("accounts.panel_urls")),
    path("api/teacher/", include("accounts.teacher_urls")),
    path("api/catalog/", include("catalog.urls")),
]
