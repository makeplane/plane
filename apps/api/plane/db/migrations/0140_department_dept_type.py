from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0139_department_optional_code"),
    ]

    operations = [
        migrations.AddField(
            model_name="department",
            name="dept_type",
            field=models.CharField(
                blank=True,
                choices=[("HO", "HO"), ("BRX", "BRX"), ("OSR", "OSR")],
                default="",
                max_length=3,
            ),
        ),
    ]
