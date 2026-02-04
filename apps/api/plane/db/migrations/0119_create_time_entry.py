# Generated migration for TimeEntry model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('db', '0118_alter_project_is_time_tracking_enabled'),
    ]

    operations = [
        migrations.CreateModel(
            name='TimeEntry',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('time_spent', models.IntegerField(validators=[django.core.validators.MinValueValidator(0)], verbose_name='Time Spent (seconds)')),
                ('description', models.TextField(blank=True, null=True)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('ended_at', models.DateTimeField(blank=True, null=True)),
                ('is_timer', models.BooleanField(default=False)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('issue', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='time_entries', to='db.issue')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='project_%(class)s', to='db.project')),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_%(class)s', to='db.workspace')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='time_entries', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Time Entry',
                'verbose_name_plural': 'Time Entries',
                'db_table': 'time_entries',
                'ordering': ('-created_at',),
            },
        ),
        migrations.AddIndex(
            model_name='timeentry',
            index=models.Index(fields=['issue', 'deleted_at'], name='time_entry_issue_idx'),
        ),
        migrations.AddIndex(
            model_name='timeentry',
            index=models.Index(fields=['user', 'deleted_at'], name='time_entry_user_idx'),
        ),
        migrations.AddIndex(
            model_name='timeentry',
            index=models.Index(fields=['created_at'], name='time_entry_created_at_idx'),
        ),
    ]
