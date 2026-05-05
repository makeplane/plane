from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0162_add_job_position_models"),
    ]

    operations = [
        migrations.AddField(
            model_name="maintaskcategory",
            name="code",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="subtaskcategory",
            name="code",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
    ]
