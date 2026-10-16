# d2m-plane: per-project working calendar for sprints

from django.db import migrations, models

import plane.db.models.project


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0122_alter_draftissue_assignees_alter_issue_assignees_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="working_days",
            field=models.JSONField(default=plane.db.models.project.get_default_working_days),
        ),
        migrations.AddField(
            model_name="project",
            name="holidays",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
