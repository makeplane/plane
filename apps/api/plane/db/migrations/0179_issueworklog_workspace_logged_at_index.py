from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0178_help_center"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="issueworklog",
            index=models.Index(
                fields=["workspace", "logged_at"],
                name="issue_workl_workspa_logged_idx",
            ),
        ),
    ]
