from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0171_project_copy_job"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="issue_views_view",
            field=models.BooleanField(default=False),
        ),
    ]
