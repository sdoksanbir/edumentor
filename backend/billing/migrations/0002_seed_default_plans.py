# Data migration: seed default plans

from decimal import Decimal

from django.db import migrations


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("billing", "Plan")
    plans = [
        {
            "code": "STARTER_10",
            "name": "Starter",
            "student_limit": 10,
            "price_monthly": Decimal("299.00"),
            "price_yearly": Decimal("2990.00"),
            "currency": "TRY",
            "is_active": True,
        },
        {
            "code": "PRO_20",
            "name": "Pro",
            "student_limit": 20,
            "price_monthly": Decimal("499.00"),
            "price_yearly": Decimal("4990.00"),
            "currency": "TRY",
            "is_active": True,
        },
        {
            "code": "PREMIUM_30",
            "name": "Premium",
            "student_limit": 30,
            "price_monthly": Decimal("699.00"),
            "price_yearly": Decimal("6990.00"),
            "currency": "TRY",
            "is_active": True,
        },
    ]
    for p in plans:
        Plan.objects.update_or_create(code=p["code"], defaults=p)


def reverse_seed(apps, schema_editor):
    Plan = apps.get_model("billing", "Plan")
    Plan.objects.filter(code__in=["STARTER_10", "PRO_20", "PREMIUM_30"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("billing", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_plans, reverse_seed),
    ]
