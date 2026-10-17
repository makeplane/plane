import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def audit_fields():
    return [
        ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
        ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
        ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
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
    ]


class Migration(migrations.Migration):
    dependencies = [("db", "0122_alter_draftissue_assignees_alter_issue_assignees_and_more")]

    operations = [
        migrations.CreateModel(
            name="TelegramIntegration",
            fields=audit_fields()
            + [
                ("bot_id", models.BigIntegerField(unique=True)),
                ("bot_username", models.CharField(max_length=64)),
                ("encrypted_bot_token", models.TextField()),
                ("webhook_secret", models.CharField(max_length=64)),
                (
                    "workspace",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="telegram_integration",
                        to="db.workspace",
                    ),
                ),
            ],
            options={"db_table": "telegram_integrations"},
        ),
        migrations.CreateModel(
            name="TelegramProjectChat",
            fields=audit_fields()
            + [
                ("chat_id", models.BigIntegerField()),
                ("topic_id", models.BigIntegerField(default=0)),
                ("chat_title", models.CharField(max_length=255)),
                (
                    "integration",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_chats",
                        to="db.telegramintegration",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="telegram_chats",
                        to="db.project",
                    ),
                ),
            ],
            options={"db_table": "telegram_project_chats"},
        ),
        migrations.CreateModel(
            name="TelegramUserLink",
            fields=audit_fields()
            + [
                ("telegram_user_id", models.BigIntegerField()),
                (
                    "integration",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="user_links",
                        to="db.telegramintegration",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"db_table": "telegram_user_links"},
        ),
        migrations.CreateModel(
            name="TelegramLinkToken",
            fields=audit_fields()
            + [
                ("token_hash", models.CharField(max_length=64, unique=True)),
                ("expires_at", models.DateTimeField()),
                (
                    "integration",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="db.telegramintegration"),
                ),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"db_table": "telegram_link_tokens"},
        ),
        migrations.CreateModel(
            name="TelegramProcessedUpdate",
            fields=audit_fields()
            + [
                ("update_id", models.BigIntegerField()),
                (
                    "integration",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="db.telegramintegration"),
                ),
            ],
            options={"db_table": "telegram_processed_updates"},
        ),
        migrations.AddConstraint(
            model_name="telegramprojectchat",
            constraint=models.UniqueConstraint(
                fields=("integration", "chat_id", "topic_id"), name="telegram_chat_topic_unique"
            ),
        ),
        migrations.AddConstraint(
            model_name="telegramprojectchat",
            constraint=models.UniqueConstraint(fields=("integration", "project"), name="telegram_project_unique"),
        ),
        migrations.AddConstraint(
            model_name="telegramuserlink",
            constraint=models.UniqueConstraint(fields=("integration", "user"), name="telegram_link_user_unique"),
        ),
        migrations.AddConstraint(
            model_name="telegramuserlink",
            constraint=models.UniqueConstraint(
                fields=("integration", "telegram_user_id"), name="telegram_link_telegram_user_unique"
            ),
        ),
        migrations.AddConstraint(
            model_name="telegramprocessedupdate",
            constraint=models.UniqueConstraint(fields=("integration", "update_id"), name="telegram_update_unique"),
        ),
    ]
