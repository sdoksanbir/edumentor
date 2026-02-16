from django.db import migrations


def create_singleton(apps, schema_editor):
    SiteSettings = apps.get_model("site_settings", "SiteSettings")
    if not SiteSettings.objects.filter(id=1).exists():
        SiteSettings.objects.create(id=1, site_name="EDUMENTOR")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("site_settings", "0001_initial_site_settings"),
    ]

    operations = [
        migrations.RunPython(create_singleton, noop),
    ]
