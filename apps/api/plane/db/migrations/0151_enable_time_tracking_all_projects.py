from django.db import migrations


def enable_time_tracking(apps, schema_editor):
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute(
            "UPDATE projects SET is_time_tracking_enabled = TRUE "
            "WHERE is_time_tracking_enabled = FALSE"
        )


def reverse_migration(apps, schema_editor):
    pass  # intentionally irreversible


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0150_fix_default_view_rich_filters"),
    ]
    operations = [
        migrations.RunPython(enable_time_tracking, reverse_migration),
    ]
