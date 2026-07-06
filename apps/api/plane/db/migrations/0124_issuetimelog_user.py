# Generated manually, following the style of 0123_add_issue_time_log_and_total_time_spent.py

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0123_add_issue_time_log_and_total_time_spent'),
    ]

    operations = [
        migrations.AddField(
            model_name='issuetimelog',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='issue_time_logs', to=settings.AUTH_USER_MODEL, verbose_name='Spent By'),
        ),
    ]
