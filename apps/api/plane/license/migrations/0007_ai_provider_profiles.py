import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("license", "0006_instance_is_current_version_deprecated"),
    ]

    operations = [
        migrations.CreateModel(
            name="AIProviderProfile",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
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
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("name", models.CharField(max_length=120)),
                ("slug", models.SlugField(max_length=120)),
                (
                    "protocol",
                    models.CharField(
                        choices=[("openai_compatible", "OpenAI-compatible")],
                        default="openai_compatible",
                        max_length=32,
                    ),
                ),
                ("base_url", models.URLField(max_length=500)),
                ("api_key_encrypted", models.TextField(blank=True, default="")),
                ("organization_id", models.CharField(blank=True, default="", max_length=255)),
                ("project_id", models.CharField(blank=True, default="", max_length=255)),
                ("default_model", models.CharField(blank=True, default="", max_length=255)),
                ("enabled", models.BooleanField(default=True)),
                ("is_default", models.BooleanField(default=False)),
                ("timeout_seconds", models.PositiveSmallIntegerField(default=30)),
                ("max_retries", models.PositiveSmallIntegerField(default=2)),
                ("temperature", models.FloatField(blank=True, null=True)),
                ("top_p", models.FloatField(blank=True, null=True)),
                ("max_output_tokens", models.PositiveIntegerField(blank=True, null=True)),
                ("last_tested_at", models.DateTimeField(blank=True, null=True)),
                ("last_test_success", models.BooleanField(blank=True, null=True)),
                ("last_test_error_code", models.CharField(blank=True, default="", max_length=64)),
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
                    "instance",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_providers",
                        to="license.instance",
                    ),
                ),
            ],
            options={"db_table": "ai_provider_profiles", "ordering": ("-created_at",)},
        ),
        migrations.CreateModel(
            name="AIModelProfile",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
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
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("model_id", models.CharField(max_length=255)),
                ("display_name", models.CharField(blank=True, default="", max_length=255)),
                ("enabled", models.BooleanField(default=True)),
                ("capabilities", models.JSONField(blank=True, default=list)),
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
                    "provider",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="model_profiles",
                        to="license.aiproviderprofile",
                    ),
                ),
            ],
            options={"db_table": "ai_model_profiles", "ordering": ("model_id",)},
        ),
        migrations.AddConstraint(
            model_name="aiproviderprofile",
            constraint=models.UniqueConstraint(fields=("instance", "slug"), name="unique_ai_provider_slug"),
        ),
        migrations.AddConstraint(
            model_name="aimodelprofile",
            constraint=models.UniqueConstraint(fields=("provider", "model_id"), name="unique_ai_model_profile"),
        ),
    ]
