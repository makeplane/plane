from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


def activate_legacy_pending_bindings(apps, schema_editor):
    LooperNodeBinding = apps.get_model("db", "LooperNodeBinding")
    LooperNodeBinding.objects.filter(state="pending", deleted_at__isnull=True).update(
        state="active",
        allowed_roles=["planner", "worker"],
    )


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0125_looper_protocol_immutable_trigger"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(activate_legacy_pending_bindings, migrations.RunPython.noop),
        migrations.CreateModel(
            name="LooperConnectionSession",
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
                ("connect_code", models.CharField(max_length=64, unique=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("created", "Created"),
                            ("cli_connected", "CLI connected"),
                            ("binding_created", "Binding created"),
                            ("completed", "Completed"),
                            ("cancelled", "Cancelled"),
                            ("expired", "Expired"),
                            ("failed", "Failed"),
                            ("device_exists", "Device exists"),
                        ],
                        default="created",
                        max_length=24,
                    ),
                ),
                ("expires_at", models.DateTimeField()),
                ("node_id", models.CharField(blank=True, default="", max_length=128)),
                ("node_name", models.CharField(blank=True, default="", max_length=255)),
                ("error_code", models.CharField(blank=True, default="", max_length=64)),
                ("error_detail", models.TextField(blank=True, default="")),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "binding",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="connection_sessions",
                        to="db.loopernodebinding",
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
                    "member",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="looper_connection_sessions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="project_%(class)s", to="db.project"
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
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_%(class)s",
                        to="db.workspace",
                    ),
                ),
            ],
            options={"db_table": "looper_connection_sessions"},
        ),
        migrations.AddIndex(
            model_name="looperconnectionsession",
            index=models.Index(fields=["project", "member", "status"], name="looper_connect_owner_idx"),
        ),
    ]
