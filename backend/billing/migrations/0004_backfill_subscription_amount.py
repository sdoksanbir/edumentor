# Backfill amount/currency for existing subscriptions

from django.db import migrations


def backfill_amount(apps, schema_editor):
    Subscription = apps.get_model("billing", "Subscription")
    for sub in Subscription.objects.select_related("plan").all():
        plan = sub.plan
        if sub.billing_period == "YEARLY":
            sub.amount = plan.price_yearly
        else:
            sub.amount = plan.price_monthly
        sub.currency = plan.currency
        sub.save(update_fields=["amount", "currency"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("billing", "0003_subscription_billing_period_amount_currency"),
    ]

    operations = [
        migrations.RunPython(backfill_amount, noop),
    ]
