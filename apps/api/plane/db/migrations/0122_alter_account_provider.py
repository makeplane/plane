from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0121_alter_estimate_type"),
    ]

    operations = [
        migrations.AlterField(
            model_name="account",
            name="provider",
            field=models.CharField(
                choices=[
                    ("google", "Google"),
                    ("github", "Github"),
                    ("gitlab", "GitLab"),
                    ("gitea", "Gitea"),
                    ("keycloak", "Keycloak"),
                ]
            ),
        ),
    ]
