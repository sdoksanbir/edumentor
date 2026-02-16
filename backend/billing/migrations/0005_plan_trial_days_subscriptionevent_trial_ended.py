# Plan.trial_days

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("billing", "0004_backfill_subscription_amount"),
    ]

    operations = [
        migrations.AddField(
            model_name="plan",
            name="trial_days",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
