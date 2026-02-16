from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/admin/settings/site/", include("site_settings.urls")),  # Before admin (more specific)
    path("api/admin/", include("accounts.admin_urls")),
    path("api/admin/billing/", include("billing.admin_urls")),
    path("api/panel/", include("accounts.panel_urls")),
    path("api/teacher/", include("accounts.teacher_urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/billing/", include("billing.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
