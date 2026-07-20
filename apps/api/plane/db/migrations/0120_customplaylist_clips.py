from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0119_normalize_customplaylist_url_thumbnail"),
    ]

    operations = [
        migrations.AddField(
            model_name="customplaylist",
            name="clips",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
