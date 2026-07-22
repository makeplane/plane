from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0120_customplaylist_clips"),
    ]

    operations = [
        migrations.AddField(
            model_name="customplaylist",
            name="subtitle",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
