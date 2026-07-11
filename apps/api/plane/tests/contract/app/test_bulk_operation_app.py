# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date
from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import (
    Cycle,
    CycleIssue,
    Estimate,
    EstimatePoint,
    Issue,
    IssueAssignee,
    IssueLabel,
    Label,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)


# --------------------------------------------------------------------------- #
# Helpers / fixtures
# --------------------------------------------------------------------------- #
def make_user(email=None, workspace=None, role_ws=15, project=None, role_project=15, is_active=True):
    user = User.objects.create_user(
        email=email or f"{uuid4().hex[:12]}@example.com",
        username=f"u-{uuid4().hex[:12]}",
    )
    if workspace is not None:
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=role_ws, is_active=True)
    if project is not None:
        ProjectMember.objects.create(project=project, member=user, role=role_project, is_active=is_active)
    return user


def make_issue(project, name="Issue"):
    return Issue.objects.create(name=name, project=project, workspace=project.workspace)


def make_state(project, name="State", group="backlog"):
    return State.objects.create(name=name, color="#fff", group=group, project=project, workspace=project.workspace)


def make_label(project, name=None):
    return Label.objects.create(name=name or f"L-{uuid4().hex[:6]}", project=project, workspace=project.workspace)


def make_module(project, name=None):
    return Module.objects.create(name=name or f"M-{uuid4().hex[:6]}", project=project, workspace=project.workspace)


def make_cycle(project, owner, name=None):
    return Cycle.objects.create(
        name=name or f"C-{uuid4().hex[:6]}", owned_by=owner, project=project, workspace=project.workspace
    )


def url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/bulk-operation-issues/"


def calls_of_type(activity, activity_type):
    return [c for c in activity.delay.call_args_list if c.kwargs.get("type") == activity_type]


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Test Project", identifier="TP", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture(autouse=True)
def activity():
    """Mock the Celery dispatch (no broker in tests) and base_host, and expose
    the activity mock so tests can assert what was queued."""
    with (
        mock.patch("plane.utils.bulk_issue.issue_activity") as activity_mock,
        mock.patch("plane.app.views.issue.base.base_host", return_value="http://localhost"),
    ):
        yield activity_mock


# --------------------------------------------------------------------------- #
# Scalar SET
# --------------------------------------------------------------------------- #
@pytest.mark.contract
class TestBulkScalarSet:
    @pytest.mark.django_db
    def test_set_state(self, session_client, workspace, project, activity):
        state = make_state(project, name="Done", group="completed")
        issue = make_issue(project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"state_id": str(state.id)}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["issue_ids"] == [str(issue.id)]
        issue.refresh_from_db()
        assert str(issue.state_id) == str(state.id)
        updated = calls_of_type(activity, "issue.activity.updated")
        assert len(updated) == 1
        assert updated[0].kwargs["issue_id"] == str(issue.id)
        assert "state_id" in updated[0].kwargs["requested_data"]

    @pytest.mark.django_db
    def test_set_priority(self, session_client, workspace, project):
        issue = make_issue(project)
        assert issue.priority == "none"

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"priority": "urgent"}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.priority == "urgent"

    @pytest.mark.django_db
    def test_set_start_and_target_dates(self, session_client, workspace, project):
        issue = make_issue(project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {
                "issue_ids": [str(issue.id)],
                "properties": {"start_date": "2026-06-01", "target_date": "2026-06-10"},
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.start_date == date(2026, 6, 1)
        assert issue.target_date == date(2026, 6, 10)

    @pytest.mark.django_db
    def test_set_estimate_point(self, session_client, workspace, project):
        estimate = Estimate.objects.create(name="E", project=project, workspace=workspace)
        point = EstimatePoint.objects.create(estimate=estimate, key=1, value="1", project=project, workspace=workspace)
        Project.objects.filter(pk=project.id).update(estimate=estimate)
        issue = make_issue(project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"estimate_point": str(point.id)}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert str(issue.estimate_point_id) == str(point.id)

    @pytest.mark.django_db
    def test_set_cycle_assigns_and_emits_cycle_activity(
        self, session_client, workspace, project, create_user, activity
    ):
        cycle = make_cycle(project, create_user)
        issue = make_issue(project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"cycle_id": str(cycle.id)}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert CycleIssue.objects.filter(issue=issue, cycle=cycle).exists()
        assert len(calls_of_type(activity, "cycle.activity.created")) == 1


# --------------------------------------------------------------------------- #
# Many-to-many ADD / APPEND (Plane-native semantics: keep existing, add new)
# --------------------------------------------------------------------------- #
@pytest.mark.contract
class TestBulkManyToManyAdd:
    @pytest.mark.django_db
    def test_add_assignees_keeps_existing(self, session_client, workspace, project):
        old = make_user(workspace=workspace, project=project)
        new = make_user(workspace=workspace, project=project)
        issue = make_issue(project)
        IssueAssignee.objects.create(assignee=old, issue=issue, project=project, workspace=workspace)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"assignee_ids": [str(new.id)]}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        # ADD: both the existing and the new assignee are active, no removal
        assert IssueAssignee.objects.filter(issue=issue, assignee=new).count() == 1
        assert IssueAssignee.objects.filter(issue=issue, assignee=old).count() == 1
        assert IssueAssignee.objects.filter(issue=issue).count() == 2

    @pytest.mark.django_db
    def test_add_labels_keeps_existing(self, session_client, workspace, project):
        old_label = make_label(project)
        new_label = make_label(project)
        issue = make_issue(project)
        IssueLabel.objects.create(label=old_label, issue=issue, project=project, workspace=workspace)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"label_ids": [str(new_label.id)]}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert IssueLabel.objects.filter(issue=issue, label=new_label).count() == 1
        assert IssueLabel.objects.filter(issue=issue, label=old_label).count() == 1
        assert IssueLabel.objects.filter(issue=issue).count() == 2

    @pytest.mark.django_db
    def test_empty_label_list_is_noop(self, session_client, workspace, project):
        label = make_label(project)
        issue = make_issue(project)
        IssueLabel.objects.create(label=label, issue=issue, project=project, workspace=workspace)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"label_ids": []}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        # ADD semantics: an empty list adds nothing and never clears existing labels
        assert IssueLabel.objects.filter(issue=issue, label=label).count() == 1

    @pytest.mark.django_db
    def test_add_modules_keeps_existing(self, session_client, workspace, project, activity):
        keep = make_module(project)
        add = make_module(project)
        issue = make_issue(project)
        ModuleIssue.objects.create(module=keep, issue=issue, project=project, workspace=workspace)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"module_ids": [str(keep.id), str(add.id)]}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        active = set(ModuleIssue.objects.filter(issue=issue).values_list("module_id", flat=True))
        # ADD: the already-linked module stays, the new one is attached, none detached
        assert active == {keep.id, add.id}
        assert ModuleIssue.objects.filter(issue=issue, module=keep).count() == 1
        # only the newly-added module fires an activity; the retained one is silent
        assert len(calls_of_type(activity, "module.activity.created")) == 1
        assert len(calls_of_type(activity, "module.activity.deleted")) == 0

    @pytest.mark.django_db
    def test_idempotent_m2m_no_active_duplicate(self, session_client, workspace, project):
        member = make_user(workspace=workspace, project=project)
        issue = make_issue(project)
        payload = {"issue_ids": [str(issue.id)], "properties": {"assignee_ids": [str(member.id)]}}

        first = session_client.post(url(workspace.slug, project.id), payload, format="json")
        second = session_client.post(url(workspace.slug, project.id), payload, format="json")

        assert first.status_code == status.HTTP_200_OK
        assert second.status_code == status.HTTP_200_OK
        assert IssueAssignee.objects.filter(issue=issue, assignee=member).count() == 1


# --------------------------------------------------------------------------- #
# Partial / multi-issue behaviour
# --------------------------------------------------------------------------- #
@pytest.mark.contract
class TestBulkPartialAndMulti:
    @pytest.mark.django_db
    def test_absent_key_leaves_field_unchanged(self, session_client, workspace, project):
        label = make_label(project)
        issue = make_issue(project)
        IssueLabel.objects.create(label=label, issue=issue, project=project, workspace=workspace)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"priority": "high"}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.priority == "high"
        # labels were not part of the payload -> untouched
        assert IssueLabel.objects.filter(issue=issue, label=label).count() == 1

    @pytest.mark.django_db
    def test_multi_issues_all_updated(self, session_client, workspace, project):
        state = make_state(project, name="Prog", group="started")
        issues = [make_issue(project, name=f"I{i}") for i in range(3)]

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(i.id) for i in issues], "properties": {"state_id": str(state.id)}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert set(response.json()["issue_ids"]) == {str(i.id) for i in issues}
        for issue in issues:
            issue.refresh_from_db()
            assert str(issue.state_id) == str(state.id)

    @pytest.mark.django_db
    def test_activity_emitted_per_item(self, session_client, workspace, project, activity):
        issues = [make_issue(project, name=f"I{i}") for i in range(3)]

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(i.id) for i in issues], "properties": {"priority": "low"}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        updated = calls_of_type(activity, "issue.activity.updated")
        assert len(updated) == 3
        assert {c.kwargs["issue_id"] for c in updated} == {str(i.id) for i in issues}


# --------------------------------------------------------------------------- #
# Validation / anti-leak
# --------------------------------------------------------------------------- #
@pytest.mark.contract
class TestBulkValidation:
    @pytest.mark.django_db
    def test_issue_from_other_project_rejected(self, session_client, workspace, project, create_user):
        other_project = Project.objects.create(name="Other", identifier="OT", workspace=workspace)
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        mine = make_issue(project)
        foreign = make_issue(other_project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(mine.id), str(foreign.id)], "properties": {"priority": "high"}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # atomic: nothing changed on the legitimate issue
        mine.refresh_from_db()
        assert mine.priority == "none"

    @pytest.mark.django_db
    def test_invalid_state_rejected(self, session_client, workspace, project):
        other_project = Project.objects.create(name="Other", identifier="OT", workspace=workspace)
        foreign_state = make_state(other_project)
        issue = make_issue(project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"state_id": str(foreign_state.id)}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_invalid_priority_rejected(self, session_client, workspace, project):
        issue = make_issue(project)
        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"priority": "sky-high"}},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_assignee_not_member_rejected(self, session_client, workspace, project):
        outsider = make_user(workspace=workspace)  # workspace member, NOT project member
        issue = make_issue(project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"assignee_ids": [str(outsider.id)]}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert IssueAssignee.objects.filter(issue=issue).count() == 0

    @pytest.mark.django_db
    def test_inactive_member_assignee_rejected(self, session_client, workspace, project):
        inactive = make_user(workspace=workspace, project=project, is_active=False)
        issue = make_issue(project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"assignee_ids": [str(inactive.id)]}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_label_from_other_project_rejected(self, session_client, workspace, project):
        other_project = Project.objects.create(name="Other", identifier="OT", workspace=workspace)
        foreign_label = make_label(other_project)
        issue = make_issue(project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"label_ids": [str(foreign_label.id)]}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_module_from_other_project_rejected(self, session_client, workspace, project):
        other_project = Project.objects.create(name="Other", identifier="OT", workspace=workspace)
        foreign_module = make_module(other_project)
        issue = make_issue(project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"module_ids": [str(foreign_module.id)]}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_cycle_from_other_project_rejected(self, session_client, workspace, project, create_user):
        other_project = Project.objects.create(name="Other", identifier="OT", workspace=workspace)
        foreign_cycle = make_cycle(other_project, create_user)
        issue = make_issue(project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"cycle_id": str(foreign_cycle.id)}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_estimate_point_when_estimates_disabled_rejected(self, session_client, workspace, project):
        # project.estimate is None (default) -> estimates not enabled
        estimate = Estimate.objects.create(name="E", project=project, workspace=workspace)
        point = EstimatePoint.objects.create(estimate=estimate, key=1, value="1", project=project, workspace=workspace)
        issue = make_issue(project)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"estimate_point": str(point.id)}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_incoherent_dates_rejected(self, session_client, workspace, project):
        issue = make_issue(project)
        response = session_client.post(
            url(workspace.slug, project.id),
            {
                "issue_ids": [str(issue.id)],
                "properties": {"start_date": "2026-06-10", "target_date": "2026-06-01"},
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        issue.refresh_from_db()
        assert issue.start_date is None

    @pytest.mark.django_db
    def test_only_start_date_violating_existing_target_rejected(self, session_client, workspace, project):
        issue = make_issue(project)
        Issue.objects.filter(pk=issue.pk).update(target_date=date(2026, 1, 1))

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"start_date": "2026-06-01"}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        issue.refresh_from_db()
        assert issue.start_date is None

    @pytest.mark.django_db
    def test_empty_issue_ids_rejected(self, session_client, workspace, project):
        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [], "properties": {"priority": "high"}},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_empty_properties_rejected(self, session_client, workspace, project):
        issue = make_issue(project)
        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {}},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# --------------------------------------------------------------------------- #
# Permissions
# --------------------------------------------------------------------------- #
@pytest.mark.contract
class TestBulkPermissions:
    @pytest.mark.django_db
    def test_guest_forbidden(self, session_client, workspace, project):
        guest = make_user(workspace=workspace, role_ws=5, project=project, role_project=5)
        issue = make_issue(project)
        session_client.force_authenticate(user=guest)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"priority": "high"}},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        issue.refresh_from_db()
        assert issue.priority == "none"

    @pytest.mark.django_db
    def test_member_allowed(self, session_client, workspace, project):
        member = make_user(workspace=workspace, project=project, role_project=15)
        issue = make_issue(project)
        session_client.force_authenticate(user=member)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"priority": "high"}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.priority == "high"

    @pytest.mark.django_db
    def test_non_member_of_workspace_forbidden(self, session_client, workspace, project):
        stranger = make_user()  # no workspace membership
        issue = make_issue(project)
        session_client.force_authenticate(user=stranger)

        response = session_client.post(
            url(workspace.slug, project.id),
            {"issue_ids": [str(issue.id)], "properties": {"priority": "high"}},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
