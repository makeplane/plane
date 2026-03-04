from django.db import migrations


def migrate_none_to_medium(apps, schema_editor):
    # Use raw SQL to avoid custom manager issues in migration context
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("UPDATE issues SET priority = 'medium' WHERE priority = 'none'")
        cursor.execute("UPDATE issue_versions SET priority = 'medium' WHERE priority = 'none'")
        cursor.execute("UPDATE draft_issues SET priority = 'medium' WHERE priority = 'none'")


def reverse_migration(apps, schema_editor):
    pass  # intentionally irreversible


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0130_issue_add_time_spent_model"),
    ]
    operations = [
        migrations.RunPython(migrate_none_to_medium, reverse_migration),
    ]
