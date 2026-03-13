from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0143_project_is_bank_wide"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="module_view",
            field=models.BooleanField(default=True),
        ),
    ]
