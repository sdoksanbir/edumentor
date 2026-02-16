from django.contrib import admin
from .models import User, AuthEventLog

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "is_staff", "is_active")
    ordering = ("email",)
    search_fields = ("email",)


@admin.register(AuthEventLog)
class AuthEventLogAdmin(admin.ModelAdmin):
    list_display = ("id", "event_type", "user", "ip_address", "created_at")
    list_filter = ("event_type",)
    search_fields = ("user__email", "ip_address")
    readonly_fields = ("created_at",)
