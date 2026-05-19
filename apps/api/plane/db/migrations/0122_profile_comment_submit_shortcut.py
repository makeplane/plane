# Generated for comment_submit_shortcut user preference

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0121_alter_estimate_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="comment_submit_shortcut",
            field=models.CharField(
                choices=[("enter", "Enter"), ("mod_enter", "Mod+Enter")],
                default="enter",
                max_length=20,
            ),
        ),
    ]
