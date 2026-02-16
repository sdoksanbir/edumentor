from django.urls import path

from .views import SiteSettingsView, SiteSettingsUploadView, SiteSettingsTestEmailView

urlpatterns = [
    path("", SiteSettingsView.as_view()),
    path("upload/", SiteSettingsUploadView.as_view()),
    path("test-email/", SiteSettingsTestEmailView.as_view()),
]
