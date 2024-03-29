# Generated by Django 4.2.3 on 2023-07-20 09:35

from django.db import migrations


def restructure_theming(apps, schema_editor):
    Model = apps.get_model("db", "User")
    updated_user = []
    for obj in Model.objects.exclude(theme={}).all():
        current_theme = obj.theme
        updated_theme = {
            "primary": current_theme.get("accent", ""),
            "background": current_theme.get("bgBase", ""),
            "sidebarBackground": current_theme.get("sidebar", ""),
            "text": current_theme.get("textBase", ""),
            "sidebarText": current_theme.get("textBase", ""),
            "palette": f"""{current_theme.get("bgBase","")},{current_theme.get("textBase", "")},{current_theme.get("accent", "")},{current_theme.get("sidebar","")},{current_theme.get("textBase", "")}""",
            "darkPalette": current_theme.get("darkPalette", ""),
        }
        obj.theme = updated_theme
        updated_user.append(obj)

    Model.objects.bulk_update(updated_user, ["theme"], batch_size=100)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0037_issue_archived_at_project_archive_in_and_more"),
    ]

    operations = [migrations.RunPython(restructure_theming)]
