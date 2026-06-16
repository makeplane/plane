# Generated migration for WorkspaceSecOpsConfig

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0129_changeactivity_deleted_at_changeapproval_deleted_at_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkspaceSecOpsConfig",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="Last Modified At"),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                        blank=True,
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                        blank=True,
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(blank=True, null=True),
                ),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                (
                    "workspace",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="secops_config",
                        to="db.workspace",
                    ),
                ),
                (
                    "default_change_project",
                    models.ForeignKey(
                        blank=True,
                        help_text=(
                            "Default project used to store change management "
                            "records in this workspace. If NULL, the first "
                            "project in the workspace is used automatically."
                        ),
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="secops_config_changes",
                        to="db.project",
                    ),
                ),
            ],
            options={
                "verbose_name": "Workspace SecOps Config",
                "verbose_name_plural": "Workspace SecOps Configs",
                "db_table": "workspace_secops_configs",
                "ordering": ("-created_at",),
            },
        ),
    ]
