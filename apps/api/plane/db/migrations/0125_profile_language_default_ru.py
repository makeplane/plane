from django.db import migrations, models


def set_existing_language_to_ru(apps, schema_editor):
    """Switch existing profiles still on the previous default ("en") to Russian.

    This deployment is Russian-first, so accounts that never explicitly picked a
    language are migrated to "ru". Profiles with any other explicit language are
    left untouched.
    """
    Profile = apps.get_model("db", "Profile")
    Profile.objects.filter(language="en").update(language="ru")


def reverse_language_to_en(apps, schema_editor):
    Profile = apps.get_model("db", "Profile")
    Profile.objects.filter(language="ru").update(language="en")


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0124_alter_chatmessenger_created_by_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="profile",
            name="language",
            field=models.CharField(default="ru", max_length=255),
        ),
        migrations.RunPython(set_existing_language_to_ru, reverse_language_to_en),
    ]
