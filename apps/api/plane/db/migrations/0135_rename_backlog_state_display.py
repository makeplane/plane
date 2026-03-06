from django.db import migrations


def rename_backlog_to_draft(apps, schema_editor):
    State = apps.get_model("db", "State")
    State.objects.filter(name="Backlog", group="backlog", deleted_at__isnull=True).update(name="Draft")


def rename_draft_to_backlog(apps, schema_editor):
    State = apps.get_model("db", "State")
    State.objects.filter(name="Draft", group="backlog", deleted_at__isnull=True).update(name="Backlog")


class Migration(migrations.Migration):
    dependencies = [("db", "0134_add_biweekly_default_label")]
    operations = [migrations.RunPython(rename_backlog_to_draft, rename_draft_to_backlog)]
