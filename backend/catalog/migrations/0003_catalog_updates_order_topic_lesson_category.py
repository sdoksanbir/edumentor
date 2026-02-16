# Generated manually for catalog model updates

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


def set_lesson_topic_lesson_category(apps, schema_editor):
    """Populate lesson_category from unit.lesson_category for existing LessonTopics."""
    LessonTopic = apps.get_model("catalog", "LessonTopic")
    for t in LessonTopic.objects.select_related("unit").all():
        if t.unit_id:
            t.lesson_category_id = t.unit.lesson_category_id
            t.save(update_fields=["lesson_category_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0002_add_lesson_category_unit_lessontopic"),
    ]

    operations = [
        # Subject: order nullable, created_at
        migrations.AlterField(
            model_name="subject",
            name="order",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="subject",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        # LessonCategory: order, created_at, updated_at
        migrations.AddField(
            model_name="lessoncategory",
            name="order",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="lessoncategory",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True, default=django.utils.timezone.now
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="lessoncategory",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        # Unit: order nullable, created_at, updated_at
        migrations.AlterField(
            model_name="unit",
            name="order",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="unit",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True, default=django.utils.timezone.now
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="unit",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        # LessonTopic: add lesson_category (nullable first), populate, then require
        migrations.AddField(
            model_name="lessontopic",
            name="lesson_category",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="topics",
                to="catalog.lessoncategory",
            ),
        ),
        migrations.RunPython(set_lesson_topic_lesson_category),
        migrations.AlterField(
            model_name="lessontopic",
            name="lesson_category",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="topics",
                to="catalog.lessoncategory",
            ),
        ),
        migrations.AlterField(
            model_name="lessontopic",
            name="order",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="lessontopic",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True, default=django.utils.timezone.now
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="lessontopic",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        # Remove old unique_together (unit, name) - we'll add constraints
        migrations.AlterUniqueTogether(
            name="lessontopic",
            unique_together=set(),
        ),
        # Make unit nullable
        migrations.AlterField(
            model_name="lessontopic",
            name="unit",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="topics",
                to="catalog.unit",
            ),
        ),
        # Add new unique constraints
        migrations.AddConstraint(
            model_name="lessontopic",
            constraint=models.UniqueConstraint(
                condition=models.Q(("unit__isnull", False)),
                fields=("unit", "name"),
                name="lessontopic_unique_unit_name",
            ),
        ),
        migrations.AddConstraint(
            model_name="lessontopic",
            constraint=models.UniqueConstraint(
                condition=models.Q(("unit__isnull", True)),
                fields=("lesson_category", "name"),
                name="lessontopic_unique_lc_name_when_unit_null",
            ),
        ),
    ]
