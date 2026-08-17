# Generated for testhub overlay — platform-side overlay, never written to git

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("testhub", "0001_initial"),
        ("db", "0122_alter_draftissue_assignees_alter_issue_assignees_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="TesthubAssetOverlay",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
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
                ("asset_ref", models.CharField(max_length=512)),
                ("kind", models.CharField(default="progress", max_length=64)),
                ("payload", models.JSONField(default=dict)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="testhub_overlays",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="testhub_overlays",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Testhub asset overlay",
                "verbose_name_plural": "Testhub asset overlays",
                "db_table": "testhub_asset_overlays",
                "ordering": ("asset_ref",),
            },
        ),
        migrations.AddConstraint(
            model_name="testhubassetoverlay",
            constraint=models.UniqueConstraint(
                fields=("project", "asset_ref", "kind"),
                name="testhub_overlay_project_asset_kind_uniq",
            ),
        ),
        migrations.AddIndex(
            model_name="testhubassetoverlay",
            index=models.Index(fields=["project", "kind"], name="testhub_ove_project_idx"),
        ),
    ]
