# Generated by Django 3.2.14 on 2022-11-10 19:46

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0003_auto_20221109_2320"),
    ]

    operations = [
        migrations.AlterField(
            model_name="state",
            name="sequence",
            field=models.FloatField(default=65535),
        ),
    ]
