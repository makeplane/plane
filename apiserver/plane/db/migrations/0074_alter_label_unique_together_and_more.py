# Generated by Django 4.2.11 on 2024-07-31 12:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "db",
            "0073_analyticview_deleted_at_apiactivitylog_deleted_at_and_more",
        ),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="label",
            unique_together={("name", "project", "deleted_at")},
        ),
        migrations.AlterUniqueTogether(
            name="module",
            unique_together={("name", "project", "deleted_at")},
        ),
        migrations.AlterUniqueTogether(
            name="project",
            unique_together={
                ("identifier", "workspace", "deleted_at"),
                ("name", "workspace", "deleted_at"),
            },
        ),
        migrations.AlterUniqueTogether(
            name="projectidentifier",
            unique_together={("name", "workspace", "deleted_at")},
        ),
        migrations.AddConstraint(
            model_name="label",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("name", "project"),
                name="label_unique_name_project_when_deleted_at_null",
            ),
        ),
        migrations.AddConstraint(
            model_name="module",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("name", "project"),
                name="module_unique_name_project_when_deleted_at_null",
            ),
        ),
        migrations.AddConstraint(
            model_name="project",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("identifier", "workspace"),
                name="project_unique_identifier_workspace_when_deleted_at_null",
            ),
        ),
        migrations.AddConstraint(
            model_name="project",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("name", "workspace"),
                name="project_unique_name_workspace_when_deleted_at_null",
            ),
        ),
        migrations.AddConstraint(
            model_name="projectidentifier",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("name", "workspace"),
                name="unique_name_workspace_when_deleted_at_null",
            ),
        ),
    ]