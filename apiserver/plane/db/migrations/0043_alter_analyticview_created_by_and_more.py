# Generated by Django 4.2.3 on 2023-09-12 07:29

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from plane.db.models import IssueRelation
from sentry_sdk import capture_exception
import uuid


def create_issue_relation(apps, schema_editor):
    try:
        IssueBlockerModel = apps.get_model("db", "IssueBlocker")
        updated_issue_relation = []
        for blocked_issue in IssueBlockerModel.objects.all():
            updated_issue_relation.append(
                IssueRelation(
                    issue_id=blocked_issue.block_id,
                    related_issue_id=blocked_issue.blocked_by_id,
                    relation_type="blocked_by",
                    project_id=blocked_issue.project_id,
                    workspace_id=blocked_issue.workspace_id,
                    created_by_id=blocked_issue.created_by_id,
                    updated_by_id=blocked_issue.updated_by_id,
                )
            )
        IssueRelation.objects.bulk_create(updated_issue_relation, batch_size=100)
    except Exception as e:
        print(e)
        capture_exception(e)


def update_issue_priority_choice(apps, schema_editor):
    IssueModel = apps.get_model("db", "Issue")
    updated_issues = []
    for obj in IssueModel.objects.all():
        if obj.priority is None:
            obj.priority = "none"
        updated_issues.append(obj)
    IssueModel.objects.bulk_update(updated_issues, ["priority"], batch_size=100)


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0042_alter_analyticview_created_by_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='IssueRelation',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('relation_type', models.CharField(choices=[('duplicate', 'Duplicate'), ('relates_to', 'Relates To'), ('blocked_by', 'Blocked By')], default='blocked_by', max_length=20, verbose_name='Issue Relation Type')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('issue', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='issue_relation', to='db.issue')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='project_%(class)s', to='db.project')),
                ('related_issue', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='issue_related', to='db.issue')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_%(class)s', to='db.workspace')),
            ],
            options={
                'verbose_name': 'Issue Relation',
                'verbose_name_plural': 'Issue Relations',
                'db_table': 'issue_relations',
                'ordering': ('-created_at',),
                'unique_together': {('issue', 'related_issue')},
            },
        ),
        migrations.AddField(
            model_name='issue',
            name='is_draft',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='issue',
            name='priority',
            field=models.CharField(choices=[('urgent', 'Urgent'), ('high', 'High'), ('medium', 'Medium'), ('low', 'Low'), ('none', 'None')], default='none', max_length=30, verbose_name='Issue Priority'),
        ),
        migrations.RunPython(create_issue_relation),
        migrations.RunPython(update_issue_priority_choice),
    ]
