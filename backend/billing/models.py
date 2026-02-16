"""
Billing models: Plan, Subscription, SubscriptionEvent.
Öğretmen koçluk abonelik sistemi.
"""
from django.db import models
from django.utils import timezone


class Plan(models.Model):
    """Abonelik planı - öğrenci kotası ve fiyat bilgisi."""

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    student_limit = models.PositiveIntegerField()
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default="TRY")
    is_active = models.BooleanField(default=True)
    trial_days = models.PositiveIntegerField(default=0)
    features = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["student_limit"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    @property
    def yearly_savings(self):
        """Yıllık tasarruf: price_monthly*12 - price_yearly."""
        from decimal import Decimal
        monthly_total = self.price_monthly * 12
        return monthly_total - self.price_yearly

    @property
    def yearly_discount_percent(self):
        """Yıllık indirim yüzdesi."""
        from decimal import Decimal
        if self.price_monthly <= 0:
            return Decimal("0")
        monthly_total = self.price_monthly * 12
        if monthly_total <= 0:
            return Decimal("0")
        return (self.yearly_savings / monthly_total) * 100


class Subscription(models.Model):
    """Öğretmen aboneliği - OneToOne TeacherProfile."""

    class Status(models.TextChoices):
        TRIALING = "TRIALING", "Deneme"
        ACTIVE = "ACTIVE", "Aktif"
        EXPIRED = "EXPIRED", "Süresi Dolmuş"
        CANCELED = "CANCELED", "İptal Edilmiş"

    class BillingPeriod(models.TextChoices):
        MONTHLY = "MONTHLY", "Aylık"
        YEARLY = "YEARLY", "Yıllık"

    teacher = models.OneToOneField(
        "accounts.TeacherProfile",
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name="subscriptions",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    cancel_at_period_end = models.BooleanField(default=False)
    trial_end = models.DateTimeField(null=True, blank=True)
    student_limit_snapshot = models.PositiveIntegerField()
    billing_period = models.CharField(
        max_length=20,
        choices=BillingPeriod.choices,
        default=BillingPeriod.MONTHLY,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default="TRY")
    auto_renew = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["current_period_end"]),
        ]

    def __str__(self):
        return f"Subscription({self.teacher_id}, {self.plan.code}, {self.status})"


class SubscriptionEvent(models.Model):
    """Abonelik olayları - audit log."""

    class EventType(models.TextChoices):
        CREATED = "CREATED", "Oluşturuldu"
        PLAN_CHANGED = "PLAN_CHANGED", "Plan Değişti"
        RENEWED = "RENEWED", "Yenilendi"
        REACTIVATED = "REACTIVATED", "Yeniden Aktifleştirildi"
        REASSIGNED = "REASSIGNED", "Plan Yeniden Atandı"
        CANCELED = "CANCELED", "İptal Edildi"
        EXPIRED = "EXPIRED", "Süresi Doldu"
        TRIAL_ENDED = "TRIAL_ENDED", "Deneme Bitti"

    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name="events",
    )
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    payload = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["subscription", "created_at"]),
        ]

    def __str__(self):
        return f"{self.event_type} @ {self.created_at}"
