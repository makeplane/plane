# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0120_issueview_archived_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='messenger_is_active',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='messenger_last_seen_at',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='messenger_level',
            field=models.PositiveSmallIntegerField(default=2),
        ),
    ]