# Generated by Django 4.2.7 on 2023-12-20 11:14

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import plane.db.models.cycle
import plane.db.models.issue
import plane.db.models.module
import plane.db.models.view
import plane.db.models.workspace
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0051_cycle_external_id_cycle_external_source_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='issueview',
            old_name='query_data',
            new_name='filters',
        ),
        migrations.RenameField(
            model_name='issueproperty',
            old_name='properties',
            new_name='display_properties',
        ),
        migrations.AlterField(
            model_name='issueproperty',
            name='display_properties',
            field=models.JSONField(default=plane.db.models.issue.get_default_display_properties),
        ),
        migrations.AddField(
            model_name='issueproperty',
            name='display_filters',
            field=models.JSONField(default=plane.db.models.issue.get_default_display_filters),
        ),
        migrations.AddField(
            model_name='issueproperty',
            name='filters',
            field=models.JSONField(default=plane.db.models.issue.get_default_filters),
        ),
        migrations.AddField(
            model_name='issueview',
            name='display_filters',
            field=models.JSONField(default=plane.db.models.view.get_default_display_filters),
        ),
        migrations.AddField(
            model_name='issueview',
            name='display_properties',
            field=models.JSONField(default=plane.db.models.view.get_default_display_properties),
        ),
        migrations.AddField(
            model_name='issueview',
            name='sort_order',
            field=models.FloatField(default=65535),
        ),
        migrations.AlterField(
            model_name='issueview',
            name='project',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='project_%(class)s', to='db.project'),
        ),
        migrations.CreateModel(
            name='WorkspaceUserProperties',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('filters', models.JSONField(default=plane.db.models.workspace.get_default_filters)),
                ('display_filters', models.JSONField(default=plane.db.models.workspace.get_default_display_filters)),
                ('display_properties', models.JSONField(default=plane.db.models.workspace.get_default_display_properties)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_user_properties', to=settings.AUTH_USER_MODEL)),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_user_properties', to='db.workspace')),
            ],
            options={
                'verbose_name': 'Workspace User Property',
                'verbose_name_plural': 'Workspace User Property',
                'db_table': 'Workspace_user_properties',
                'ordering': ('-created_at',),
                'unique_together': {('workspace', 'user')},
            },
        ),
        migrations.CreateModel(
            name='ModuleUserProperties',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('filters', models.JSONField(default=plane.db.models.module.get_default_filters)),
                ('display_filters', models.JSONField(default=plane.db.models.module.get_default_display_filters)),
                ('display_properties', models.JSONField(default=plane.db.models.module.get_default_display_properties)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('module', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='module_user_properties', to='db.module')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='project_%(class)s', to='db.project')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='module_user_properties', to=settings.AUTH_USER_MODEL)),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_%(class)s', to='db.workspace')),
            ],
            options={
                'verbose_name': 'Module User Property',
                'verbose_name_plural': 'Module User Property',
                'db_table': 'module_user_properties',
                'ordering': ('-created_at',),
                'unique_together': {('module', 'user')},
            },
        ),
        migrations.CreateModel(
            name='CycleUserProperties',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('filters', models.JSONField(default=plane.db.models.cycle.get_default_filters)),
                ('display_filters', models.JSONField(default=plane.db.models.cycle.get_default_display_filters)),
                ('display_properties', models.JSONField(default=plane.db.models.cycle.get_default_display_properties)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('cycle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cycle_user_properties', to='db.cycle')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='project_%(class)s', to='db.project')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cycle_user_properties', to=settings.AUTH_USER_MODEL)),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_%(class)s', to='db.workspace')),
            ],
            options={
                'verbose_name': 'Cycle User Property',
                'verbose_name_plural': 'Cycle User Properties',
                'db_table': 'cycle_user_properties',
                'ordering': ('-created_at',),
                'unique_together': {('cycle', 'user')},
            },
        ),
    ]