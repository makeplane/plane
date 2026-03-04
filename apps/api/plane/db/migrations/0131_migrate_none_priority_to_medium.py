from django.db import migrations


def migrate_none_to_medium(apps, schema_editor):
    Issue = apps.get_model("db", "Issue")
    IssueVersion = apps.get_model("db", "IssueVersion")
    DraftIssue = apps.get_model("db", "DraftIssue")
    Issue.objects.filter(priority="none").update(priority="medium")
    IssueVersion.objects.filter(priority="none").update(priority="medium")
    DraftIssue.objects.filter(priority="none").update(priority="medium")


def reverse_migration(apps, schema_editor):
    pass  # intentionally irreversible


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0130_issue_add_time_spent_model"),
    ]
    operations = [
        migrations.RunPython(migrate_none_to_medium, reverse_migration),
    ]
