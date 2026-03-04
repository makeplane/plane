from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0128_seed_default_labels_existing_projects"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="issue",
            name="estimate_time",
        ),
    ]
