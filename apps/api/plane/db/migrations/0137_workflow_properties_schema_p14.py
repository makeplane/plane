# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Work Item custom-property models — RD-463 / spec §14.1–§14.4.

Additive only — builds on the P1.1 schema migration
(``0136_workflow_approvals_schema_p11``) without touching any of the
existing tables. Three new models ship here:

- ``WorkspaceProperty`` (§14.3) — workspace-scoped property catalog
  with name uniqueness among non-deleted rows;
- ``IssueTypeProperty`` (§14.3) — ``(issue_type, property)``
  association carrying ``is_required`` / ``default_value`` / ``sequence``;
- ``IssuePropertyValue`` (§14.3) — per-issue typed value with
  partial-unique on ``(issue, property)``.

The migration also adds the ``WorkflowPropertyType`` TextChoices value
through the model declaration; no separate data migration is needed
because no enum values are stored anywhere yet.

This is the schema half of P1.4. The validators + serializers +
API endpoints ship in ``apps/api/plane/services/workflow_properties/``
and ``apps/api/plane/app/serializers/workflow_property.py`` /
``apps/api/plane/app/views/workflow_property/`` in the same PR.
"""

import django.db.models.deletion
import django.db.models.fields
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0136_workflow_approvals_schema_p11'),
    ]

    operations = [
        migrations.CreateModel(
            name='WorkspaceProperty',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('property_type', models.CharField(choices=[
                    ('TEXT', 'Text'),
                    ('PARAGRAPH', 'Paragraph'),
                    ('NUMBER', 'Number'),
                    ('BOOLEAN', 'Boolean'),
                    ('DATE', 'Date'),
                    ('DATETIME', 'Datetime'),
                    ('DROPDOWN', 'Dropdown'),
                    ('MULTI_SELECT', 'Multi-select'),
                    ('MEMBER', 'Member'),
                    ('URL', 'URL'),
                    ('EMAIL', 'Email'),
                    ('ENTITY_REFERENCE', 'Entity reference'),
                ], max_length=32)),
                ('config', models.JSONField(blank=True, default=dict)),
                ('is_active', models.BooleanField(default=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_%(class)s', to='db.workspace')),
            ],
            options={
                'verbose_name': 'Workspace Property',
                'verbose_name_plural': 'Workspace Properties',
                'db_table': 'workspace_properties',
                'ordering': ('-created_at',),
            },
        ),
        migrations.CreateModel(
            name='IssueTypeProperty',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('is_required', models.BooleanField(default=False)),
                ('default_value', models.JSONField(blank=True, default=None, null=True)),
                ('sequence', models.FloatField(default=65535)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('issue_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workflow_properties', to='db.issuetype')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='project_%(class)s', to='db.project')),
                ('property', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='type_associations', to='db.workspaceproperty')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_%(class)s', to='db.workspace')),
            ],
            options={
                'verbose_name': 'Issue Type Property',
                'verbose_name_plural': 'Issue Type Properties',
                'db_table': 'issue_type_properties',
                'ordering': ('sequence',),
            },
        ),
        migrations.CreateModel(
            name='IssuePropertyValue',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('value_json', models.JSONField(blank=True, default=None, null=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('issue', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workflow_property_values', to='db.issue')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='project_%(class)s', to='db.project')),
                ('property', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='issue_values', to='db.workspaceproperty')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_%(class)s', to='db.workspace')),
            ],
            options={
                'verbose_name': 'Issue Property Value',
                'verbose_name_plural': 'Issue Property Values',
                'db_table': 'issue_property_values',
                'ordering': ('-created_at',),
            },
        ),
        migrations.AddIndex(
            model_name='workspaceproperty',
            index=models.Index(fields=['workspace', 'is_active'], name='wf_workspace_props_active_idx'),
        ),
        migrations.AddConstraint(
            model_name='workspaceproperty',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('workspace', 'name'), name='workspace_properties_unique_workspace_name'),
        ),
        migrations.AddIndex(
            model_name='issuetypeproperty',
            index=models.Index(fields=['issue_type', 'is_required'], name='wf_issue_type_props_lookup_idx'),
        ),
        migrations.AddConstraint(
            model_name='issuetypeproperty',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('issue_type', 'property'), name='issue_type_properties_unique_issue_type_property'),
        ),
        migrations.AddIndex(
            model_name='issuepropertyvalue',
            index=models.Index(fields=['issue'], name='wf_issue_prop_val_issue_idx'),
        ),
        migrations.AddConstraint(
            model_name='issuepropertyvalue',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('issue', 'property'), name='issue_property_values_unique_issue_property'),
        ),
    ]
