from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0138_issue_frequency"),
    ]

    operations = [
        migrations.AddField(
            model_name="state",
            name="is_system",
            field=models.BooleanField(default=False),
        ),
    ]
