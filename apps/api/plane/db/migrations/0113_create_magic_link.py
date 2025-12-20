# Generated migration for MagicLink model

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0112_auto_20251124_0603"),
    ]

    operations = [
        migrations.CreateModel(
            name="MagicLink",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "key",
                    models.CharField(db_index=True, max_length=255, unique=True),
                ),
                ("email", models.EmailField(max_length=254)),
                ("token", models.CharField(max_length=10)),
                ("current_attempt", models.IntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
            ],
            options={
                "db_table": "magic_links",
            },
        ),
        migrations.AddIndex(
            model_name="magiclink",
            index=models.Index(fields=["expires_at"], name="magic_links_expires_8a93a4_idx"),
        ),
    ]
