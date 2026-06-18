# Generated migration for SupportTicket reporter_user FK and reporter_email

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("db", "0135_issue_reporter"),
    ]

    operations = [
        migrations.AddField(
            model_name="supportticket",
            name="reporter_user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reported_tickets",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="supportticket",
            name="reporter_email",
            field=models.CharField(
                blank=True,
                max_length=512,
                null=True,
            ),
        ),
    ]
