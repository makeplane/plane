# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workflow approval models — RD-461 / spec §7.8–§7.10.

Additive only — builds on the P0.1 schema migration
(``0134_workflow_schema_p01``) without touching any of the existing
tables. Three new models ship here:

- ``WorkflowApproval`` (§7.8) with a partial-unique constraint that
  prevents two pending approvals from existing for the same Work Item
  at the same time;
- ``WorkflowApprovalApprover`` (§7.9) with a per-approval snapshot
  uniqueness on ``(approval, user)``;
- ``WorkflowApprovalDecision`` (§7.10) with a partial-unique
  ``(approval, idempotency_key)`` constraint implementing the §11.5
  replay rule at the database level.
"""

import django.db.models.deletion
import django.db.models.expressions
import django.db.models.fields
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0134_workflow_schema_p01'),
        ('db', '0135_drop_dashboard_tables'),
    ]

    operations = [
        migrations.CreateModel(
            name='WorkflowApproval',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('cancelled', 'Cancelled')], default='pending', max_length=16)),
                ('requested_at', models.DateTimeField(auto_now_add=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('resolution_comment', models.TextField(blank=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='project_%(class)s', to='db.project')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_%(class)s', to='db.workspace')),
                ('issue', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workflow_approvals', to='db.issue')),
                ('binding', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='approvals', to='db.issueworkflowbinding')),
                ('flow', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='approvals', to='db.workflowflow')),
                ('source_state', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='approval_source_states', to='db.state')),
                ('requested_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='workflow_approvals_requested', to=settings.AUTH_USER_MODEL)),
                ('resolved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='workflow_approvals_resolved', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Workflow Approval',
                'verbose_name_plural': 'Workflow Approvals',
                'db_table': 'workflow_approvals',
                'ordering': ('-created_at',),
            },
        ),
        migrations.CreateModel(
            name='WorkflowApprovalApprover',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('source_type', models.CharField(choices=[('ALL_PROJECT_MEMBERS', 'All project members'), ('STATIC_USERS', 'Static users'), ('PROJECT_ROLE', 'Project role'), ('REQUESTER_MANAGER', 'Requester manager'), ('DEPARTMENT_HEAD', 'Department head'), ('PORTAL_ROLE', 'Portal role'), ('PROPERTY_MEMBER', 'Member property')], max_length=64)),
                ('source_metadata', models.JSONField(blank=True, default=dict)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='project_%(class)s', to='db.project')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_%(class)s', to='db.workspace')),
                ('approval', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='approvers', to='db.workflowapproval')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workflow_approval_snapshots', to=settings.AUTH_USER_MODEL)),
                ('delegated_from', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='delegations', to='db.workflowapprovalapprover')),
            ],
            options={
                'verbose_name': 'Workflow Approval Approver',
                'verbose_name_plural': 'Workflow Approval Approvers',
                'db_table': 'workflow_approval_approvers',
                'ordering': ('created_at',),
            },
        ),
        migrations.CreateModel(
            name='WorkflowApprovalDecision',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ('decision', models.CharField(choices=[('approve', 'Approve'), ('reject', 'Reject')], max_length=16)),
                ('comment', models.TextField(blank=True)),
                ('idempotency_key', models.CharField(blank=True, max_length=128, null=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='project_%(class)s', to='db.project')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workspace_%(class)s', to='db.workspace')),
                ('approval', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='decisions', to='db.workflowapproval')),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='workflow_approval_decisions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Workflow Approval Decision',
                'verbose_name_plural': 'Workflow Approval Decisions',
                'db_table': 'workflow_approval_decisions',
                'ordering': ('-created_at',),
            },
        ),
        migrations.AddIndex(
            model_name='workflowapproval',
            index=models.Index(fields=['issue', 'status'], name='wf_approvals_issue_status_idx'),
        ),
        migrations.AddIndex(
            model_name='workflowapproval',
            index=models.Index(fields=['binding'], name='wf_approvals_binding_idx'),
        ),
        migrations.AddConstraint(
            model_name='workflowapproval',
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True, status='pending'),
                fields=['issue'],
                name='workflow_approvals_unique_pending_per_issue',
            ),
        ),
        migrations.AddIndex(
            model_name='workflowapprovalapprover',
            index=models.Index(fields=['approval', 'user'], name='wf_appr_appr_user_idx'),
        ),
        migrations.AddConstraint(
            model_name='workflowapprovalapprover',
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=['approval', 'user'],
                name='workflow_approval_approvers_unique_approval_user',
            ),
        ),
        migrations.AddIndex(
            model_name='workflowapprovaldecision',
            index=models.Index(fields=['approval'], name='wf_appr_dec_approval_idx'),
        ),
        migrations.AddConstraint(
            model_name='workflowapprovaldecision',
            constraint=models.UniqueConstraint(
                condition=models.Q(idempotency_key__isnull=False),
                fields=['approval', 'idempotency_key'],
                name='workflow_approval_decisions_unique_idempotency',
            ),
        ),
    ]