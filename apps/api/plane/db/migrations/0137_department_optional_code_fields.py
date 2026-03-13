"""
Make short_name and dept_code optional on Department.
These fields are not always assigned when first creating a department.
NULL values are allowed (Postgres treats NULL != NULL so unique constraints still work).
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0136_department_workspace_migration"),
    ]

    operations = [
        migrations.AlterField(
            model_name="department",
            name="short_name",
            field=models.CharField(max_length=10, blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="department",
            name="dept_code",
            field=models.CharField(max_length=4, blank=True, null=True),
        ),
    ]
