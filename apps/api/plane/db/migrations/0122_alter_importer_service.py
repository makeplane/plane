# Generated manually for EVA importer support

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0121_alter_estimate_type"),
    ]

    operations = [
        migrations.AlterField(
            model_name="importer",
            name="service",
            field=models.CharField(
                choices=[
                    ("github", "GitHub"),
                    ("jira", "Jira"),
                    ("eva", "EvaTeam"),
                ],
                max_length=50,
            ),
        ),
    ]
