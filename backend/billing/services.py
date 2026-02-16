"""
Billing business logic.
"""
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from accounts.models import StudentProfile

from .models import Plan, Subscription, SubscriptionEvent


def _period_days(billing_period):
    """MONTHLY=30, YEARLY=365."""
    if billing_period == Subscription.BillingPeriod.YEARLY:
        return 365
    return 30


def _get_amount_for_period(plan, billing_period):
    """Plan fiyatını period'a göre döner."""
    if billing_period == Subscription.BillingPeriod.YEARLY:
        return plan.price_yearly
    return plan.price_monthly


def _get_subscription_usage(sub):
    """Returns (assigned_count, remaining_slots) for a subscription."""
    count = StudentProfile.objects.filter(teacher=sub.teacher).count()
    limit = sub.student_limit_snapshot
    remaining = max(0, limit - count)
    return count, remaining


def change_subscription_plan(
    subscription,
    new_plan,
    effective="IMMEDIATE",
    keep_period=True,
    billing_period=None,
):
    """
    Abonelik planını değiştirir.

    Args:
        subscription: Subscription instance
        new_plan: Plan instance (is_active=True)
        effective: "IMMEDIATE" | "NEXT_PERIOD"
        keep_period: True ise current_period_end korunur
        billing_period: MONTHLY|YEARLY; verilirse güncellenir

    Returns:
        Updated subscription
    """
    now = timezone.now()
    current_students = StudentProfile.objects.filter(teacher=subscription.teacher).count()
    old_plan_id = subscription.plan_id
    old_limit = subscription.student_limit_snapshot

    if current_students > new_plan.student_limit:
        raise ValueError("LIMIT_TOO_LOW")

    subscription.plan = new_plan
    subscription.student_limit_snapshot = new_plan.student_limit
    subscription.cancel_at_period_end = False

    if billing_period:
        subscription.billing_period = billing_period
        subscription.amount = _get_amount_for_period(new_plan, billing_period)
        subscription.currency = new_plan.currency

    period_days = _period_days(
        billing_period if billing_period else subscription.billing_period
    )

    # CANCELED/EXPIRED ise ACTIVE yap, period setle
    if subscription.status in [Subscription.Status.CANCELED, Subscription.Status.EXPIRED]:
        subscription.status = Subscription.Status.ACTIVE
        subscription.current_period_start = now
        subscription.current_period_end = now + timedelta(days=period_days)
    # ACTIVE/TRIALING: keep_period kontrolü
    elif not keep_period:
        subscription.current_period_start = now
        subscription.current_period_end = now + timedelta(days=period_days)

    update_fields = [
        "plan", "student_limit_snapshot", "cancel_at_period_end",
        "status", "current_period_start", "current_period_end", "updated_at",
    ]
    if billing_period:
        update_fields.extend(["billing_period", "amount", "currency"])
    subscription.save(update_fields=update_fields)

    SubscriptionEvent.objects.create(
        subscription=subscription,
        event_type=SubscriptionEvent.EventType.PLAN_CHANGED,
        payload={
            "from_plan_id": old_plan_id,
            "to_plan_id": new_plan.id,
            "effective": effective,
            "billing_period": subscription.billing_period,
            "current_students": current_students,
            "old_limit": old_limit,
            "new_limit": new_plan.student_limit,
            "keep_period": keep_period,
        },
    )

    return subscription
