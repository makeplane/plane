from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0113_rosterplayer"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="sport",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
