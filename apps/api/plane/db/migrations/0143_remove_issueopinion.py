from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0142_issueopinion"),
    ]

    operations = [
        migrations.DeleteModel(name="IssueOpinion"),
    ]
