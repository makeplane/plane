# Generated by Django 4.2.16 on 2024-11-30 07:15

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import plane.ee.models.teamspace
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0086_issueversion_alter_teampage_unique_together_and_more'),
        ('ee', '0015_remove_entityissuestateactivity_team_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='TeamSpace',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('description_json', models.JSONField(blank=True, default=dict)),
                ('description_html', models.TextField(blank=True, default='<p></p>')),
                ('description_stripped', models.TextField(blank=True, null=True)),
                ('description_binary', models.BinaryField(blank=True, null=True)),
                ('logo_props', models.JSONField(blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Team Space',
                'verbose_name_plural': 'Team Spaces',
                'db_table': 'team_spaces',
            },
        ),
        migrations.CreateModel(
            name='TeamSpaceActivity',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('verb', models.CharField(default='created', max_length=255, verbose_name='Action')),
                ('field', models.CharField(blank=True, max_length=255, null=True, verbose_name='Field Name')),
                ('old_value', models.TextField(blank=True, null=True, verbose_name='Old Value')),
                ('new_value', models.TextField(blank=True, null=True, verbose_name='New Value')),
                ('comment', models.TextField(blank=True, verbose_name='Comment')),
                ('old_identifier', models.UUIDField(null=True)),
                ('new_identifier', models.UUIDField(null=True)),
                ('epoch', models.FloatField(null=True)),
            ],
            options={
                'verbose_name': 'Team Space Activity',
                'verbose_name_plural': 'Team Space Activities',
                'db_table': 'team_space_activities',
                'ordering': ('-created_at',),
            },
        ),
        migrations.CreateModel(
            name='TeamSpaceComment',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('comment_stripped', models.TextField(blank=True, verbose_name='Comment')),
                ('comment_json', models.JSONField(blank=True, default=dict)),
                ('comment_html', models.TextField(blank=True, default='<p></p>')),
            ],
            options={
                'verbose_name': 'Team Space Comment',
                'verbose_name_plural': 'Team Space Comments',
                'db_table': 'team_space_comments',
            },
        ),
        migrations.CreateModel(
            name='TeamSpaceCommentReaction',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('reaction', models.CharField(max_length=20)),
            ],
            options={
                'verbose_name': 'Team Space Comment Reaction',
                'verbose_name_plural': 'Team Space Comment Reactions',
                'db_table': 'team_space_comment_reactions',
                'ordering': ('-created_at',),
            },
        ),
        migrations.CreateModel(
            name='TeamSpaceLabel',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('sort_order', models.IntegerField(default=65535)),
            ],
            options={
                'verbose_name': 'Team Space Label',
                'verbose_name_plural': 'Team Space Labels',
                'db_table': 'team_space_labels',
            },
        ),
        migrations.CreateModel(
            name='TeamSpaceMember',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('sort_order', models.IntegerField(default=65535)),
            ],
            options={
                'verbose_name': 'Team Space Member',
                'verbose_name_plural': 'Team Space Members',
                'db_table': 'team_space_members',
            },
        ),
        migrations.CreateModel(
            name='TeamSpacePage',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('sort_order', models.IntegerField(default=65535)),
            ],
            options={
                'verbose_name': 'Team Space Page',
                'verbose_name_plural': 'Team Space Pages',
                'db_table': 'team_space_pages',
            },
        ),
        migrations.CreateModel(
            name='TeamSpaceProject',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('sort_order', models.IntegerField(default=65535)),
            ],
            options={
                'verbose_name': 'Team Space Project',
                'verbose_name_plural': 'Team Space Projects',
                'db_table': 'team_space_projects',
            },
        ),
        migrations.CreateModel(
            name='TeamSpaceUserProperty',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('filters', models.JSONField(default=plane.ee.models.teamspace.get_default_filters)),
                ('display_filters', models.JSONField(default=plane.ee.models.teamspace.get_default_display_filters)),
                ('display_properties', models.JSONField(default=plane.ee.models.teamspace.get_default_display_properties)),
            ],
            options={
                'verbose_name': 'Team Space User Property',
                'verbose_name_plural': 'Team Space User Properties',
                'db_table': 'team_space_user_properties',
            },
        ),
        migrations.CreateModel(
            name='TeamSpaceView',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('sort_order', models.IntegerField(default=65535)),
            ],
            options={
                'verbose_name': 'Team Space View',
                'verbose_name_plural': 'Team Space Views',
                'db_table': 'team_space_views',
            },
        ),
        migrations.AddField(
            model_name='workspacefeature',
            name='is_teams_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='workspacelicense',
            name='last_payment_failed_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='workspacelicense',
            name='last_payment_failed_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='workspacelicense',
            name='last_verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='projectfeature',
            name='is_epic_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='projectfeature',
            name='is_project_updates_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='workspacelicense',
            name='plan',
            field=models.CharField(choices=[('FREE', 'Free'), ('PRO', 'Pro'), ('ONE', 'One'), ('BUSINESS', 'Business'), ('ENTERPRISE', 'Enterprise')], max_length=255),
        ),
        migrations.AlterUniqueTogether(
            name='projectcommentreaction',
            unique_together={('comment', 'actor', 'reaction', 'deleted_at')},
        ),
        migrations.AddConstraint(
            model_name='projectcommentreaction',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('comment', 'actor', 'reaction'), name='project_comment_reaction_unique_comment_actor_reaction_when_deleted_at_null'),
        ),
        migrations.AddField(
            model_name='teamspaceview',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By'),
        ),
        migrations.AddField(
            model_name='teamspaceview',
            name='team_space',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='views', to='ee.teamspace'),
        ),
        migrations.AddField(
            model_name='teamspaceview',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By'),
        ),
        migrations.AddField(
            model_name='teamspaceview',
            name='view',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_spaces', to='db.issueview'),
        ),
        migrations.AddField(
            model_name='teamspaceview',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_views', to='db.workspace'),
        ),
        migrations.AddField(
            model_name='teamspaceuserproperty',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By'),
        ),
        migrations.AddField(
            model_name='teamspaceuserproperty',
            name='team_space',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_properties', to='ee.teamspace'),
        ),
        migrations.AddField(
            model_name='teamspaceuserproperty',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By'),
        ),
        migrations.AddField(
            model_name='teamspaceuserproperty',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_properties', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='teamspaceuserproperty',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_user_properties', to='db.workspace'),
        ),
        migrations.AddField(
            model_name='teamspaceproject',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By'),
        ),
        migrations.AddField(
            model_name='teamspaceproject',
            name='project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_spaces', to='db.project'),
        ),
        migrations.AddField(
            model_name='teamspaceproject',
            name='team_space',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='projects', to='ee.teamspace'),
        ),
        migrations.AddField(
            model_name='teamspaceproject',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By'),
        ),
        migrations.AddField(
            model_name='teamspaceproject',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_projects', to='db.workspace'),
        ),
        migrations.AddField(
            model_name='teamspacepage',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By'),
        ),
        migrations.AddField(
            model_name='teamspacepage',
            name='page',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_spaces', to='db.page'),
        ),
        migrations.AddField(
            model_name='teamspacepage',
            name='team_space',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pages', to='ee.teamspace'),
        ),
        migrations.AddField(
            model_name='teamspacepage',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By'),
        ),
        migrations.AddField(
            model_name='teamspacepage',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_pages', to='db.workspace'),
        ),
        migrations.AddField(
            model_name='teamspacemember',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By'),
        ),
        migrations.AddField(
            model_name='teamspacemember',
            name='member',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_spaces', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='teamspacemember',
            name='team_space',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='members', to='ee.teamspace'),
        ),
        migrations.AddField(
            model_name='teamspacemember',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By'),
        ),
        migrations.AddField(
            model_name='teamspacemember',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_members', to='db.workspace'),
        ),
        migrations.AddField(
            model_name='teamspacelabel',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By'),
        ),
        migrations.AddField(
            model_name='teamspacelabel',
            name='label',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_spaces', to='db.label'),
        ),
        migrations.AddField(
            model_name='teamspacelabel',
            name='team_space',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='labels', to='ee.teamspace'),
        ),
        migrations.AddField(
            model_name='teamspacelabel',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By'),
        ),
        migrations.AddField(
            model_name='teamspacelabel',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_labels', to='db.workspace'),
        ),
        migrations.AddField(
            model_name='teamspacecommentreaction',
            name='actor',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_comment_reactions', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='teamspacecommentreaction',
            name='comment',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_reactions', to='ee.teamspacecomment'),
        ),
        migrations.AddField(
            model_name='teamspacecommentreaction',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By'),
        ),
        migrations.AddField(
            model_name='teamspacecommentreaction',
            name='team_space',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comment_reactions', to='ee.teamspace'),
        ),
        migrations.AddField(
            model_name='teamspacecommentreaction',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By'),
        ),
        migrations.AddField(
            model_name='teamspacecommentreaction',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_comment_reactions', to='db.workspace'),
        ),
        migrations.AddField(
            model_name='teamspacecomment',
            name='actor',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='team_space_comments', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='teamspacecomment',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By'),
        ),
        migrations.AddField(
            model_name='teamspacecomment',
            name='parent',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='children', to='ee.teamspacecomment'),
        ),
        migrations.AddField(
            model_name='teamspacecomment',
            name='team_space',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='ee.teamspace'),
        ),
        migrations.AddField(
            model_name='teamspacecomment',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By'),
        ),
        migrations.AddField(
            model_name='teamspacecomment',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_comments', to='db.workspace'),
        ),
        migrations.AddField(
            model_name='teamspaceactivity',
            name='actor',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='team_space_activities', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='teamspaceactivity',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By'),
        ),
        migrations.AddField(
            model_name='teamspaceactivity',
            name='team_space',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='activities', to='ee.teamspace'),
        ),
        migrations.AddField(
            model_name='teamspaceactivity',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By'),
        ),
        migrations.AddField(
            model_name='teamspaceactivity',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_space_activities', to='db.workspace'),
        ),
        migrations.AddField(
            model_name='teamspace',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By'),
        ),
        migrations.AddField(
            model_name='teamspace',
            name='lead',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='team_space_leads', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='teamspace',
            name='updated_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By'),
        ),
        migrations.AddField(
            model_name='teamspace',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_spaces', to='db.workspace'),
        ),
        migrations.AddConstraint(
            model_name='teamspaceview',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('team_space', 'view'), name='team_space_view_unique_team_space_view_when_deleted_at_null'),
        ),
        migrations.AlterUniqueTogether(
            name='teamspaceview',
            unique_together={('team_space', 'view', 'deleted_at')},
        ),
        migrations.AddConstraint(
            model_name='teamspaceuserproperty',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('team_space', 'user'), name='team_space_user_property_unique_team_space_user_when_deleted_at_null'),
        ),
        migrations.AlterUniqueTogether(
            name='teamspaceuserproperty',
            unique_together={('team_space', 'user', 'deleted_at')},
        ),
        migrations.AddConstraint(
            model_name='teamspaceproject',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('team_space', 'project'), name='team_space_project_unique_team_space_project_when_deleted_at_null'),
        ),
        migrations.AlterUniqueTogether(
            name='teamspaceproject',
            unique_together={('team_space', 'project', 'deleted_at')},
        ),
        migrations.AddConstraint(
            model_name='teamspacepage',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('team_space', 'page'), name='team_space_page_unique_team_space_page_when_deleted_at_null'),
        ),
        migrations.AlterUniqueTogether(
            name='teamspacepage',
            unique_together={('team_space', 'page', 'deleted_at')},
        ),
        migrations.AddConstraint(
            model_name='teamspacemember',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('member', 'team_space'), name='team_space_member_unique_member_team_space_when_deleted_at_null'),
        ),
        migrations.AlterUniqueTogether(
            name='teamspacemember',
            unique_together={('member', 'team_space', 'deleted_at')},
        ),
        migrations.AddConstraint(
            model_name='teamspacelabel',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('team_space', 'label'), name='team_space_label_unique_team_space_label_when_deleted_at_null'),
        ),
        migrations.AlterUniqueTogether(
            name='teamspacelabel',
            unique_together={('team_space', 'label', 'deleted_at')},
        ),
        migrations.AddConstraint(
            model_name='teamspacecommentreaction',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('comment', 'actor', 'reaction'), name='comment_reaction_unique_team_space_actor_reaction_when_deleted_at_null'),
        ),
        migrations.AlterUniqueTogether(
            name='teamspacecommentreaction',
            unique_together={('comment', 'actor', 'reaction', 'deleted_at')},
        ),
    ]
