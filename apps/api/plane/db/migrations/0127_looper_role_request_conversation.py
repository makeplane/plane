from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


def backfill_role_request_conversations(apps, schema_editor):
    LooperRoleRequest = apps.get_model("db", "LooperRoleRequest")
    LooperCollaborationEvent = apps.get_model("db", "LooperCollaborationEvent")
    for role_request in LooperRoleRequest.objects.all().iterator():
        event = (
            LooperCollaborationEvent.objects.filter(
                role_request_id=role_request.id,
                event_type="role_request_created",
            )
            .order_by("event_version")
            .first()
        )
        questions = event.payload.get("questions", []) if event and isinstance(event.payload, dict) else []
        updates = {"questions": questions if isinstance(questions, list) else []}
        if role_request.status == "answered":
            updates["conversation_state"] = "resolved"
        LooperRoleRequest.objects.filter(id=role_request.id).update(**updates)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0126_looperconnectionsession"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="looperrolerequest",
            name="conversation_state",
            field=models.CharField(
                choices=[
                    ("waiting_human", "Waiting for human"),
                    ("waiting_looper", "Waiting for Looper"),
                    ("resolved", "Resolved"),
                    ("failed", "Failed"),
                ],
                default="waiting_human",
                max_length=24,
            ),
        ),
        migrations.AddField(
            model_name="looperrolerequest",
            name="questions",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="looperrolerequest",
            name="resolution",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.CreateModel(
            name="LooperRoleRequestMessage",
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
                    "kind",
                    models.CharField(
                        choices=[("human_reply", "Human reply"), ("looper_reply", "Looper reply")], max_length=24
                    ),
                ),
                ("body", models.TextField()),
                ("client_message_id", models.UUIDField()),
                (
                    "delivery_state",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("processed", "Processed"),
                            ("delivered", "Delivered"),
                            ("failed", "Failed"),
                        ],
                        default="pending",
                        max_length=24,
                    ),
                ),
                ("evaluation", models.JSONField(blank=True, default=dict)),
                (
                    "actor_member",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="looper_role_request_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "comment",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="looper_role_request_messages",
                        to="db.issuecomment",
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
                    "in_reply_to",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="replies",
                        to="db.looperrolerequestmessage",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="project_%(class)s", to="db.project"
                    ),
                ),
                (
                    "role_request",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="db.looperrolerequest"
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
            options={"db_table": "looper_role_request_messages", "ordering": ("created_at", "id")},
        ),
        migrations.AddConstraint(
            model_name="looperrolerequestmessage",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("role_request", "client_message_id"),
                name="looper_role_message_client_unique",
            ),
        ),
        migrations.AddIndex(
            model_name="looperrolerequestmessage",
            index=models.Index(
                fields=["role_request", "delivery_state", "created_at"], name="looper_role_msg_pending_idx"
            ),
        ),
        migrations.RunPython(backfill_role_request_conversations, migrations.RunPython.noop),
    ]
