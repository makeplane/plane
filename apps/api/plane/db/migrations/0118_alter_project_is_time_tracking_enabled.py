# Generated manually for enabling time tracking by default

from django.db import migrations, models


def enable_time_tracking_for_all_projects(apps, schema_editor):
    """Enable time tracking for all existing projects."""
    Project = apps.get_model('db', 'Project')
    Project.objects.filter(is_time_tracking_enabled=False).update(is_time_tracking_enabled=True)


def disable_time_tracking_for_all_projects(apps, schema_editor):
    """Reverse: disable time tracking for all projects (for rollback)."""
    Project = apps.get_model('db', 'Project')
    Project.objects.filter(is_time_tracking_enabled=True).update(is_time_tracking_enabled=False)


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0117_rename_description_draftissue_description_json_and_more'),
    ]

    operations = [
        # First, enable time tracking for all existing projects
        migrations.RunPython(
            enable_time_tracking_for_all_projects,
            reverse_code=disable_time_tracking_for_all_projects,
        ),
        # Then, change the default for new projects
        migrations.AlterField(
            model_name='project',
            name='is_time_tracking_enabled',
            field=models.BooleanField(default=True),
        ),
    ]
