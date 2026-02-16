# Generated manually - Subscription billing period fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("billing", "0002_seed_default_plans"),
    ]

    operations = [
        migrations.AddField(
            model_name="subscription",
            name="billing_period",
            field=models.CharField(
                choices=[("MONTHLY", "Aylık"), ("YEARLY", "Yıllık")],
                default="MONTHLY",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="subscription",
            name="amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="subscription",
            name="currency",
            field=models.CharField(default="TRY", max_length=10),
        ),
        migrations.AddField(
            model_name="subscription",
            name="auto_renew",
            field=models.BooleanField(default=True),
        ),
    ]
