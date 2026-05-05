from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0144_alter_project_module_view_default"),
    ]

    operations = [
        migrations.AddField(
            model_name="issueview",
            name="is_default",
            field=models.BooleanField(default=False),
        ),
    ]
