from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0127_workspacesprintautomation_logo_props"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspacesprintautomation",
            name="archived_at",
            field=models.DateTimeField(null=True),
        ),
    ]
