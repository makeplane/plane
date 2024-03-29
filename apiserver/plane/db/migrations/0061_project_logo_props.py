# Generated by Django 4.2.7 on 2024-03-03 16:25

from django.db import migrations, models


class Migration(migrations.Migration):

    def update_project_logo_props(apps, schema_editor):
        Project = apps.get_model("db", "Project")

        bulk_update_project_logo = []
        # Iterate through projects and update logo_props
        for project in Project.objects.all():
            project.logo_props["in_use"] = "emoji" if project.emoji else "icon"
            project.logo_props["emoji"] = {
                "value": project.emoji if project.emoji else "",
                "url": "",
            }
            project.logo_props["icon"] = {
                "name": (
                    project.icon_prop.get("name", "")
                    if project.icon_prop
                    else ""
                ),
                "color": (
                    project.icon_prop.get("color", "")
                    if project.icon_prop
                    else ""
                ),
            }
            bulk_update_project_logo.append(project)

        # Bulk update logo_props for all projects
        Project.objects.bulk_update(
            bulk_update_project_logo, ["logo_props"], batch_size=1000
        )

    dependencies = [
        ("db", "0060_cycle_progress_snapshot"),
    ]

    operations = [
        migrations.AlterField(
            model_name="issuelink",
            name="url",
            field=models.TextField(),
        ),
        migrations.AddField(
            model_name="project",
            name="logo_props",
            field=models.JSONField(default=dict),
        ),
        migrations.RunPython(update_project_logo_props),
    ]
