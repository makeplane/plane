# Generated for gitsync overlay

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def _audit_fields():
    return [
        (
            "created_at",
            models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
        ),
        (
            "updated_at",
            models.DateTimeField(auto_now=True, verbose_name="Last Modified At"),
        ),
        (
            "deleted_at",
            models.DateTimeField(blank=True, null=True, verbose_name="Deleted At"),
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
            "created_by",
            models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="%(class)s_created_by",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Created By",
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
            ),
        ),
    ]


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("db", "0122_alter_draftissue_assignees_alter_issue_assignees_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectGitRemote",
            fields=_audit_fields()
            + [
                ("name", models.CharField(max_length=255)),
                (
                    "kind",
                    models.CharField(
                        choices=[("local_mount", "Local mount"), ("git_url", "Git url")],
                        default="local_mount",
                        max_length=32,
                    ),
                ),
                ("workdir", models.CharField(default="/opt/testhub/workdir", max_length=1024)),
                ("host_path", models.CharField(blank=True, default="", max_length=1024)),
                ("repo_url", models.CharField(blank=True, default="", max_length=1024)),
                ("branch", models.CharField(blank=True, default="", max_length=255)),
                ("credential_ref", models.CharField(blank=True, default="", max_length=255)),
                ("last_sync_sha", models.CharField(blank=True, default="", max_length=64)),
                ("last_sync_at", models.DateTimeField(blank=True, null=True)),
                ("last_sync_status", models.CharField(blank=True, default="", max_length=32)),
                ("last_sync_error", models.TextField(blank=True, default="")),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gitsync_remotes",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gitsync_remotes",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Project git remote",
                "verbose_name_plural": "Project git remotes",
                "db_table": "gitsync_project_git_remotes",
                "ordering": ("created_at",),
            },
        ),
        migrations.CreateModel(
            name="ModuleBinding",
            fields=_audit_fields()
            + [
                ("module_key", models.CharField(max_length=64)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gitsync_module_bindings",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gitsync_module_bindings",
                        to="db.workspace",
                    ),
                ),
                (
                    "remote",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="module_bindings",
                        to="gitsync.projectgitremote",
                    ),
                ),
            ],
            options={
                "verbose_name": "Module binding",
                "verbose_name_plural": "Module bindings",
                "db_table": "gitsync_module_bindings",
                "ordering": ("module_key",),
            },
        ),
        migrations.AddConstraint(
            model_name="projectgitremote",
            constraint=models.UniqueConstraint(fields=("project", "name"), name="gitsync_remote_project_name_uniq"),
        ),
        migrations.AddIndex(
            model_name="projectgitremote",
            index=models.Index(fields=["project", "kind"], name="gitsync_pro_project_idx"),
        ),
        migrations.AddConstraint(
            model_name="modulebinding",
            constraint=models.UniqueConstraint(
                fields=("project", "module_key"),
                name="gitsync_binding_project_module_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="modulebinding",
            constraint=models.CheckConstraint(
                condition=models.Q(module_key__in=("testhub", "features", "wiki", "prd")),
                name="gitsync_binding_known_module",
            ),
        ),
    ]
