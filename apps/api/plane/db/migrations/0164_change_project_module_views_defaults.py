from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0163_add_code_to_task_categories"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="module_view",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="project",
            name="issue_views_view",
            field=models.BooleanField(default=True),
        ),
    ]
