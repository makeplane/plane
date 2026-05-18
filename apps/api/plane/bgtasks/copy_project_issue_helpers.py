# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Project copy helpers — part 2: issue M2M links, comments, attachments, worklogs, members."""

import uuid

from plane.db.models import (
    CycleIssue, IssueAssignee, IssueAttachment, IssueComment,
    IssueLabel, IssueWorkLog, ModuleIssue, ProjectMember,
    WorkspaceMember, WorkspaceMemberInvite,
)
from plane.settings.storage import S3Storage
from plane.bgtasks.copy_project_helpers import BATCH


def _remap_link(model, qs_values, field_a, field_b, map_a, map_b, new_project, extra_kwargs=None):
    """Generic helper: bulk-create remapped many-to-many link rows."""
    rows = []
    for row in qs_values:
        new_a = map_a.get(row[field_a])
        new_b = map_b.get(row[field_b])
        if new_a and new_b:
            kwargs = {"id": uuid.uuid4(), field_a: new_a, field_b: new_b,
                      "project": new_project, "workspace": new_project.workspace}
            if extra_kwargs:
                kwargs.update(extra_kwargs)
            rows.append(model(**kwargs))
    model.objects.bulk_create(rows, batch_size=BATCH, ignore_conflicts=True)


def copy_issue_labels(source_project, new_project, issue_id_map, label_id_map):
    _remap_link(IssueLabel,
                IssueLabel.objects.filter(project=source_project).values("issue_id", "label_id"),
                "issue_id", "label_id", issue_id_map, label_id_map, new_project)


def copy_issue_assignees(source_project, new_project, issue_id_map):
    target_member_ids = set(
        WorkspaceMember.objects.filter(workspace=new_project.workspace, is_active=True)
        .values_list("member_id", flat=True)
    )
    rows = []
    for ia in IssueAssignee.objects.filter(project=source_project).values("issue_id", "assignee_id"):
        new_issue_id = issue_id_map.get(ia["issue_id"])
        if new_issue_id and ia["assignee_id"] in target_member_ids:
            rows.append(IssueAssignee(id=uuid.uuid4(), issue_id=new_issue_id,
                                      assignee_id=ia["assignee_id"],
                                      project=new_project, workspace=new_project.workspace))
    IssueAssignee.objects.bulk_create(rows, batch_size=BATCH, ignore_conflicts=True)


def copy_module_issues(source_project, new_project, module_id_map, issue_id_map):
    _remap_link(ModuleIssue,
                ModuleIssue.objects.filter(project=source_project).values("module_id", "issue_id"),
                "module_id", "issue_id", module_id_map, issue_id_map, new_project)


def copy_cycle_issues(source_project, new_project, cycle_id_map, issue_id_map):
    _remap_link(CycleIssue,
                CycleIssue.objects.filter(project=source_project).values("cycle_id", "issue_id"),
                "cycle_id", "issue_id", cycle_id_map, issue_id_map, new_project)


def copy_issue_comments(source_project, new_project, issue_id_map):
    new_rows = []
    for cmt in IssueComment.objects.filter(project=source_project).values(
        "issue_id", "actor_id", "comment_stripped", "comment_json", "comment_html", "access"
    ):
        new_issue_id = issue_id_map.get(cmt["issue_id"])
        if not new_issue_id:
            continue
        new_rows.append(
            IssueComment(
                id=uuid.uuid4(),
                issue_id=new_issue_id,
                actor_id=cmt["actor_id"],
                comment_stripped=cmt["comment_stripped"],
                comment_json=cmt["comment_json"],
                comment_html=cmt["comment_html"],
                access=cmt["access"],
                project=new_project,
                workspace=new_project.workspace,
            )
        )
    # bulk_create bypasses IssueComment.save(), so Description records are not created.
    # Copied comments have comment_html/json but description_id=None — acceptable for Phase 01.
    IssueComment.objects.bulk_create(new_rows, batch_size=BATCH)


def copy_issue_attachments(source_project, new_project, issue_id_map):
    """Copy S3 files; failed copies are skipped individually."""
    storage = S3Storage()
    new_rows = []
    for att in IssueAttachment.objects.filter(project=source_project):
        new_issue_id = issue_id_map.get(att.issue_id)
        if not new_issue_id:
            continue
        old_key = str(att.asset)
        new_key = f"{new_project.workspace_id}/{uuid.uuid4().hex}-{old_key.split('/')[-1]}"
        try:
            result = storage.copy_object(old_key, new_key)
            if result is None:  # copy_object returns None on S3 ClientError
                continue
        except Exception:
            continue
        new_rows.append(
            IssueAttachment(
                id=uuid.uuid4(),
                attributes=att.attributes,
                asset=new_key,
                issue_id=new_issue_id,
                project=new_project,
                workspace=new_project.workspace,
            )
        )
    IssueAttachment.objects.bulk_create(new_rows, batch_size=BATCH)


def copy_worklogs(source_project, new_project, issue_id_map):
    new_rows = []
    for wl in IssueWorkLog.objects.filter(project=source_project):
        new_issue_id = issue_id_map.get(wl.issue_id)
        if not new_issue_id:
            continue
        new_rows.append(
            IssueWorkLog(
                id=uuid.uuid4(),
                issue_id=new_issue_id,
                logged_by_id=wl.logged_by_id,
                duration_minutes=wl.duration_minutes,
                description=wl.description,
                logged_at=wl.logged_at,
                project=new_project,
                workspace=new_project.workspace,
            )
        )
    IssueWorkLog.objects.bulk_create(new_rows, batch_size=BATCH)


def copy_project_members(source_project, new_project):
    """Add existing workspace members to new project; invite the rest."""
    target_ws = new_project.workspace
    existing_ws_member_ids = set(
        WorkspaceMember.objects.filter(workspace=target_ws, is_active=True)
        .values_list("member_id", flat=True)
    )
    existing_invite_emails = set(
        WorkspaceMemberInvite.objects.filter(workspace=target_ws, accepted=False)
        .values_list("email", flat=True)
    )

    new_project_members = []
    new_invites = []

    for pm in ProjectMember.objects.filter(project=source_project).select_related("member"):
        user = pm.member
        if user.id in existing_ws_member_ids:
            new_project_members.append(
                ProjectMember(
                    id=uuid.uuid4(),
                    project=new_project,
                    workspace=target_ws,
                    member=user,
                    role=pm.role,
                    is_active=True,
                )
            )
        elif user.email not in existing_invite_emails:
            new_invites.append(
                WorkspaceMemberInvite(
                    id=uuid.uuid4(),
                    workspace=target_ws,
                    email=user.email,
                    token=uuid.uuid4().hex,
                    role=pm.role,
                )
            )
            existing_invite_emails.add(user.email)

    ProjectMember.objects.bulk_create(new_project_members, batch_size=BATCH, ignore_conflicts=True)
    WorkspaceMemberInvite.objects.bulk_create(new_invites, batch_size=BATCH, ignore_conflicts=True)
