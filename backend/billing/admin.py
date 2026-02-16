from django.contrib import admin
from .models import Plan, Subscription, SubscriptionEvent


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "student_limit", "price_monthly", "price_yearly", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["code", "name"]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["teacher", "plan", "status", "current_period_end", "student_limit_snapshot"]
    list_filter = ["status"]
    raw_id_fields = ["teacher", "plan"]


@admin.register(SubscriptionEvent)
class SubscriptionEventAdmin(admin.ModelAdmin):
    list_display = ["subscription", "event_type", "created_at"]
    list_filter = ["event_type"]
    raw_id_fields = ["subscription"]
