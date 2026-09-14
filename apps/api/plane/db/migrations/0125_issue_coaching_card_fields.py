from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0124_move_custom_playlists_to_artifact_metadata"),
    ]

    operations = [
        migrations.AddField(
            model_name="issue",
            name="coaching_card_data",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="issue",
            name="roster_player",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="coaching_card_issues",
                to="db.rosterplayer",
            ),
        ),
    ]
