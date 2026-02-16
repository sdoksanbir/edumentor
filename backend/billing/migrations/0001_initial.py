# Generated manually for billing app

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0012_add_token_version_to_user"),
    ]

    operations = [
        migrations.CreateModel(
            name="Plan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=50, unique=True)),
                ("name", models.CharField(max_length=100)),
                ("student_limit", models.PositiveIntegerField()),
                ("price_monthly", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("price_yearly", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("currency", models.CharField(default="TRY", max_length=10)),
                ("is_active", models.BooleanField(default=True)),
                ("features", models.JSONField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["student_limit"],
            },
        ),
        migrations.CreateModel(
            name="Subscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("TRIALING", "Deneme"), ("ACTIVE", "Aktif"), ("EXPIRED", "Süresi Dolmuş"), ("CANCELED", "İptal Edilmiş")], default="ACTIVE", max_length=20)),
                ("current_period_start", models.DateTimeField()),
                ("current_period_end", models.DateTimeField()),
                ("cancel_at_period_end", models.BooleanField(default=False)),
                ("trial_end", models.DateTimeField(blank=True, null=True)),
                ("student_limit_snapshot", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("plan", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="subscriptions", to="billing.plan")),
                ("teacher", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="subscription", to="accounts.teacherprofile")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="SubscriptionEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("event_type", models.CharField(choices=[("CREATED", "Oluşturuldu"), ("PLAN_CHANGED", "Plan Değişti"), ("RENEWED", "Yenilendi"), ("CANCELED", "İptal Edildi"), ("EXPIRED", "Süresi Doldu")], max_length=20)),
                ("payload", models.JSONField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("subscription", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="events", to="billing.subscription")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="plan",
            index=models.Index(fields=["code"], name="billing_pla_code_0a1e5e_idx"),
        ),
        migrations.AddIndex(
            model_name="plan",
            index=models.Index(fields=["is_active"], name="billing_pla_is_acti_8e8f2a_idx"),
        ),
        migrations.AddIndex(
            model_name="subscription",
            index=models.Index(fields=["status"], name="billing_sub_status_9c8e4a_idx"),
        ),
        migrations.AddIndex(
            model_name="subscription",
            index=models.Index(fields=["current_period_end"], name="billing_sub_current_7a9b3c_idx"),
        ),
        migrations.AddIndex(
            model_name="subscriptionevent",
            index=models.Index(fields=["subscription", "created_at"], name="billing_sub_subscri_1d2e3f_idx"),
        ),
    ]
