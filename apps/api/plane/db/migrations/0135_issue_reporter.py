# Generated migration for Issue reporter FK

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("db", "0134_supportticket_due_date_supportticket_start_date_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="issue",
            name="reporter",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reported_issues",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
