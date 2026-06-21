from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0126_workspace_sprint_automation_access"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspacesprintautomation",
            name="logo_props",
            field=models.JSONField(default=dict),
        ),
    ]
