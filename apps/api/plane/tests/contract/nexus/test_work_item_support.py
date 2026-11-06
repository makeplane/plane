# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Builders shared by the work_item group's contract tests (no tests here)."""

from uuid import uuid4

from plane.db.models import Issue, IssueAssignee, IssueLabel, Label, Project, ProjectMember, State

ADMIN, MEMBER, GUEST = 20, 15, 5


def make_state(project, group="unstarted", name=None, default=False):
    return State.objects.create(
        name=name or f"{group}-{uuid4().hex[:4]}", group=group, project=project, workspace=project.workspace,
        default=default,
    )  # fmt: skip


def make_issue(project, name="Work item", creator=None, assignees=(), labels=(), **fields):
    issue = Issue(project=project, workspace=project.workspace, name=name, **fields)
    issue.save(created_by_id=creator.id if creator else None)
    for user in assignees:
        IssueAssignee.objects.create(issue=issue, assignee=user, project=project, workspace=project.workspace)
    for label in labels:
        IssueLabel.objects.create(issue=issue, label=label, project=project, workspace=project.workspace)
    return issue


def make_label(project, name=None):
    return Label.objects.create(name=name or f"label-{uuid4().hex[:4]}", project=project, workspace=project.workspace)


def make_project(workspace, creator, identifier=None, members=()):
    project = Project.objects.create(
        name=f"P {uuid4().hex[:4]}", identifier=identifier or uuid4().hex[:5].upper(), workspace=workspace,
        created_by=creator,
    )  # fmt: skip
    ProjectMember.objects.create(project=project, member=creator, role=ADMIN, is_active=True)
    for user, role in members:
        ProjectMember.objects.create(project=project, member=user, role=role, is_active=True)
    make_state(project, "unstarted", "Todo", default=True)
    return project
