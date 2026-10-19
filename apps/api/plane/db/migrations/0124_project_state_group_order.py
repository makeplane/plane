# d2m-plane: per-project custom state group display order

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0123_project_working_days_holidays"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="state_group_order",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
