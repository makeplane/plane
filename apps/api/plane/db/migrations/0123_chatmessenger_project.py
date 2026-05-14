# Generated migration for messenger chat project link

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0122_messenger_tables"),
    ]

    operations = [
        migrations.AddField(
            model_name="chatmessenger",
            name="project",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="messenger_chats",
                to="db.project",
            ),
        ),
    ]
