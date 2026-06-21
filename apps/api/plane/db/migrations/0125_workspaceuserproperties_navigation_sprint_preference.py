from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0124_alter_workspacesprint_created_by_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspaceuserproperties",
            name="navigation_sprint_preference",
            field=models.CharField(
                choices=[("ACCORDION", "Accordion"), ("TABBED", "Tabbed")],
                default="ACCORDION",
                max_length=25,
            ),
        ),
    ]
