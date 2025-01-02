# Generated by Django 4.2.17 on 2025-01-02 07:47

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0088_sticky_sort_order_workspaceuserlink"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkspaceHomePreference",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True, verbose_name="Last Modified At"
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Deleted At"
                    ),
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
                ("key", models.CharField(max_length=255)),
                ("is_enabled", models.BooleanField(default=True)),
                ("config", models.JSONField(default=dict)),
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
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_user_home_preferences",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_user_home_preferences",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Workspace Home Preference",
                "verbose_name_plural": "Workspace Home Preferences",
                "db_table": "workspace_home_preferences",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddConstraint(
            model_name="workspacehomepreference",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("workspace", "user", "key"),
                name="workspace_user_home_preferences_unique_workspace_user_key_when_deleted_at_null",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="workspacehomepreference",
            unique_together={("workspace", "user", "key", "deleted_at")},
        ),
        migrations.AlterField(
            model_name="page",
            name="name",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='workspacehomepreference',
            name='sort_order',
            field=models.PositiveIntegerField(default=65535),
        ),
    ]
