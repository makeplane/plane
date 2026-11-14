# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for PATCH /api/v1/workspaces/<slug>/projects/<project_id>/intake-issues/<issue_id>/status/."""

from datetime import timedelta
from unittest import mock
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    APIToken,
    Intake,
    IntakeIssue,
    Issue,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)

ADMIN, MEMBER, GUEST = 20, 15, 5

INTAKE_ISSUE_KEYS = {
    "id",
    "issue_detail",
    "inbox",
    "created_at",
    "updated_at",
    "deleted_at",
    "status",
    "snoozed_till",
    "source",
    "source_email",
    "external_source",
    "external_id",
    "extra",
    "created_by",
    "updated_by",
    "project",
    "workspace",
    "intake",
    "issue",
    "duplicate_to",
}


@pytest.fixture(autouse=True)
def _no_side_effects(db):
    with (
        mock.patch("plane.api.views.intake.issue_activity") as mock_activity,
        mock.patch("plane.api.views.intake.base_host", return_value="http://testserver"),
    ):
        yield mock_activity


def _make_user(workspace, project, ws_role, project_role=None):
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"u-{uid}@plane.so", username=f"u_{uid}")
    user.set_password("test-password")
    user.save()
    if ws_role is not None:
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=ws_role, is_active=True)
    if project_role is not None and project is not None:
        ProjectMember.objects.create(
            project=project,
            member=user,
            workspace=workspace,
            role=project_role,
            is_active=True,
        )
    return user


def _client_for(user):
    token = APIToken.objects.create(user=user, label="t", token=f"tok-{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.fixture
def project(db, workspace, create_user):
    proj = Project.objects.create(
        name="Intake Status Project",
        identifier="ISP",
        workspace=workspace,
        created_by=create_user,
        intake_view=True,
    )
    ProjectMember.objects.create(project=proj, member=create_user, workspace=workspace, role=ADMIN, is_active=True)
    State.objects.create(
        name="Todo",
        color="#000000",
        group="backlog",
        default=True,
        project=proj,
        workspace=workspace,
        created_by=create_user,
    )
    return proj


@pytest.fixture
def triage_state(db, workspace, project, create_user):
    return State.objects.create(
        name="Triage",
        color="#4E5355",
        group="triage",
        default=False,
        is_triage=True,
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def intake(db, workspace, project):
    return Intake.objects.create(name="Default Intake", project=project, workspace=workspace, is_default=True)


@pytest.fixture
def intake_issue_record(db, workspace, project, intake, triage_state, create_user):
    issue = Issue.objects.create(
        name="Triaged Item",
        project=project,
        workspace=workspace,
        state=triage_state,
        created_by=create_user,
    )
    return IntakeIssue.objects.create(intake=intake, issue=issue, project=project, workspace=workspace)


def _status_url(slug, project_id, issue_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/intake-issues/{issue_id}/status/"


@pytest.mark.contract
@pytest.mark.django_db
def test_accept_transitions_state_ignores_issue_and_fires_activity(
    api_key_client, workspace, project, intake_issue_record, _no_side_effects
):
    issue = intake_issue_record.issue
    url = _status_url(workspace.slug, project.id, issue.id)

    response = api_key_client.patch(
        url,
        {
            "status": 1,
            "source": "EMAIL",
            "source_email": "reporter@plane.so",
            "issue": {"name": "Should Be Ignored"},
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK, response.content
    assert INTAKE_ISSUE_KEYS.issubset(set(response.data.keys()))
    assert response.data["status"] == 1
    assert response.data["source"] == "EMAIL"
    assert response.data["source_email"] == "reporter@plane.so"

    intake_issue_record.refresh_from_db()
    issue.refresh_from_db()
    assert intake_issue_record.status == 1
    assert issue.name == "Triaged Item"
    assert issue.state.group == "backlog"
    _no_side_effects.delay.assert_called_once()


@pytest.mark.contract
@pytest.mark.django_db
def test_snooze_duplicate_reject_and_pending_statuses(
    api_key_client, workspace, project, intake_issue_record, create_user
):
    issue = intake_issue_record.issue
    dup_target = Issue.objects.create(name="Target", project=project, workspace=workspace, created_by=create_user)
    url = _status_url(workspace.slug, project.id, issue.id)

    # Snooze (0) requires snoozed_till
    resp = api_key_client.patch(url, {"status": 0, "snoozed_till": "2030-01-15T00:00:00Z"}, format="json")
    assert resp.status_code == status.HTTP_200_OK, resp.content
    assert resp.data["status"] == 0
    assert resp.data["snoozed_till"] is not None

    # Duplicate (2) requires duplicate_to in same project
    resp = api_key_client.patch(url, {"status": 2, "duplicate_to": str(dup_target.id)}, format="json")
    assert resp.status_code == status.HTTP_200_OK, resp.content
    assert resp.data["status"] == 2
    assert str(resp.data["duplicate_to"]) == str(dup_target.id)

    # Declined (-1) and Pending (-2)
    for st in (-1, -2):
        resp = api_key_client.patch(url, {"status": st}, format="json")
        assert resp.status_code == status.HTTP_200_OK, resp.content
        assert resp.data["status"] == st


@pytest.mark.contract
@pytest.mark.django_db
def test_validation_errors_on_status_snooze_and_duplicate_to(
    api_key_client, workspace, project, intake_issue_record, create_user
):
    issue = intake_issue_record.issue
    url = _status_url(workspace.slug, project.id, issue.id)

    other_proj = Project.objects.create(name="Other", identifier="OTH", workspace=workspace, created_by=create_user)
    foreign_issue = Issue.objects.create(name="Foreign", project=other_proj, workspace=workspace)

    uid = uuid4().hex[:8]
    other_owner = User.objects.create(email=f"o-{uid}@plane.so", username=f"o_{uid}")
    other_ws = Workspace.objects.create(name="OtherWS", owner=other_owner, slug=f"ows-{uid}")
    other_ws_proj = Project.objects.create(name="OWP", identifier="OWP", workspace=other_ws, created_by=other_owner)
    other_ws_issue = Issue.objects.create(name="OWI", project=other_ws_proj, workspace=other_ws)

    for bad_payload in (
        {"status": 99},
        {"status": "not-an-int"},
        {"status": 0},
        {"status": 2},
        {"status": 2, "duplicate_to": str(foreign_issue.id)},
        {"status": 2, "duplicate_to": str(other_ws_issue.id)},
        {"status": 2, "duplicate_to": str(uuid4())},
    ):
        resp = api_key_client.patch(url, bad_payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST, (bad_payload, resp.content)

    intake_issue_record.refresh_from_db()
    assert intake_issue_record.status == -2
    assert intake_issue_record.duplicate_to_id is None


@pytest.mark.contract
@pytest.mark.django_db
def test_intake_none_returns_404(api_key_client, workspace, create_user):
    proj_no_intake = Project.objects.create(
        name="NoIntake",
        identifier="NI",
        workspace=workspace,
        created_by=create_user,
        intake_view=True,
    )
    ProjectMember.objects.create(
        project=proj_no_intake,
        member=create_user,
        workspace=workspace,
        role=ADMIN,
        is_active=True,
    )
    issue = Issue.objects.create(name="Orphan", project=proj_no_intake, workspace=workspace, created_by=create_user)

    resp = api_key_client.patch(
        _status_url(workspace.slug, proj_no_intake.id, issue.id),
        {"status": -1},
        format="json",
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND, resp.content


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize(
    "ws_role,proj_role,expected",
    [
        (ADMIN, ADMIN, status.HTTP_200_OK),
        (MEMBER, ADMIN, status.HTTP_200_OK),
        (ADMIN, MEMBER, status.HTTP_200_OK),
        (ADMIN, None, status.HTTP_403_FORBIDDEN),
        (MEMBER, MEMBER, status.HTTP_403_FORBIDDEN),
        (GUEST, GUEST, status.HTTP_403_FORBIDDEN),
        (MEMBER, None, status.HTTP_403_FORBIDDEN),
        (None, None, status.HTTP_403_FORBIDDEN),
    ],
)
def test_intake_status_permission_matrix(workspace, project, intake_issue_record, ws_role, proj_role, expected):
    user = _make_user(workspace, project, ws_role, proj_role)
    client = _client_for(user)
    url = _status_url(workspace.slug, project.id, intake_issue_record.issue_id)

    resp = client.patch(url, {"status": -1}, format="json")
    assert resp.status_code == expected, resp.content


@pytest.mark.contract
@pytest.mark.django_db
def test_cross_project_and_cross_workspace_issue_id_returns_404(
    api_key_client, workspace, project, intake_issue_record, create_user
):
    sib_proj = Project.objects.create(name="Sib", identifier="SIB", workspace=workspace, created_by=create_user)
    sib_intake = Intake.objects.create(name="SibIntake", project=sib_proj, workspace=workspace, is_default=True)
    sib_issue = Issue.objects.create(name="SibIssue", project=sib_proj, workspace=workspace)
    sib_ii = IntakeIssue.objects.create(intake=sib_intake, issue=sib_issue, project=sib_proj, workspace=workspace)

    uid = uuid4().hex[:8]
    other_owner = User.objects.create(email=f"o-{uid}@plane.so", username=f"o_{uid}")
    other_ws = Workspace.objects.create(name="Other", owner=other_owner, slug=f"other-{uid}")
    other_proj = Project.objects.create(name="OP", identifier="OP", workspace=other_ws, created_by=other_owner)
    other_intake = Intake.objects.create(name="OIntake", project=other_proj, workspace=other_ws, is_default=True)
    other_issue = Issue.objects.create(name="OIssue", project=other_proj, workspace=other_ws)
    other_ii = IntakeIssue.objects.create(
        intake=other_intake,
        issue=other_issue,
        project=other_proj,
        workspace=other_ws,
    )

    for foreign_ii in (sib_ii, other_ii):
        resp = api_key_client.patch(
            _status_url(workspace.slug, project.id, foreign_ii.issue_id),
            {"status": -1},
            format="json",
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND, resp.content
        foreign_ii.refresh_from_db()
        assert foreign_ii.status == -2


@pytest.mark.contract
@pytest.mark.django_db
def test_duplicate_to_self_is_rejected(api_key_client, workspace, project, intake_issue_record):
    issue = intake_issue_record.issue
    url = _status_url(workspace.slug, project.id, issue.id)

    resp = api_key_client.patch(url, {"status": 2, "duplicate_to": str(issue.id)}, format="json")

    assert resp.status_code == status.HTTP_400_BAD_REQUEST, resp.content
    assert "duplicate_to" in resp.data
    intake_issue_record.refresh_from_db()
    assert intake_issue_record.status == -2
    assert intake_issue_record.duplicate_to_id is None


@pytest.mark.contract
@pytest.mark.django_db
def test_duplicate_to_archived_draft_or_triage_issue_is_rejected(
    api_key_client, workspace, project, intake_issue_record, triage_state, create_user, _no_side_effects
):
    url = _status_url(workspace.slug, project.id, intake_issue_record.issue_id)
    archived = Issue.objects.create(
        name="Archived",
        project=project,
        workspace=workspace,
        created_by=create_user,
        archived_at=timezone.now().date(),
    )
    draft = Issue.objects.create(
        name="Draft", project=project, workspace=workspace, created_by=create_user, is_draft=True
    )
    pending = Issue.objects.create(
        name="Pending", project=project, workspace=workspace, created_by=create_user, state=triage_state
    )

    for target in (archived, draft, pending):
        resp = api_key_client.patch(url, {"status": 2, "duplicate_to": str(target.id)}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST, (target.name, resp.content)
        assert "duplicate_to" in resp.data

    intake_issue_record.refresh_from_db()
    assert intake_issue_record.status == -2
    assert intake_issue_record.duplicate_to_id is None
    _no_side_effects.delay.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
def test_stored_duplicate_to_and_snoozed_till_satisfy_status_requirements(
    api_key_client, workspace, project, intake_issue_record, create_user
):
    target = Issue.objects.create(name="Target", project=project, workspace=workspace, created_by=create_user)
    intake_issue_record.duplicate_to = target
    intake_issue_record.snoozed_till = timezone.now() + timedelta(days=3)
    intake_issue_record.save()
    url = _status_url(workspace.slug, project.id, intake_issue_record.issue_id)

    resp = api_key_client.patch(url, {"status": 2}, format="json")
    assert resp.status_code == status.HTTP_200_OK, resp.content
    assert str(resp.data["duplicate_to"]) == str(target.id)

    resp = api_key_client.patch(url, {"status": 0}, format="json")
    assert resp.status_code == status.HTTP_200_OK, resp.content
    assert resp.data["snoozed_till"] is not None


@pytest.mark.contract
@pytest.mark.django_db
def test_explicit_null_duplicate_to_does_not_fall_back_to_stored_value(
    api_key_client, workspace, project, intake_issue_record, create_user
):
    target = Issue.objects.create(name="Target", project=project, workspace=workspace, created_by=create_user)
    intake_issue_record.duplicate_to = target
    intake_issue_record.save()
    url = _status_url(workspace.slug, project.id, intake_issue_record.issue_id)

    resp = api_key_client.patch(url, {"status": 2, "duplicate_to": None}, format="json")

    assert resp.status_code == status.HTTP_400_BAD_REQUEST, resp.content


@pytest.mark.contract
@pytest.mark.django_db
def test_list_body_returns_400(api_key_client, workspace, project, intake_issue_record, _no_side_effects):
    url = _status_url(workspace.slug, project.id, intake_issue_record.issue_id)

    resp = api_key_client.patch(url, [{"status": -1}], format="json")

    assert resp.status_code == status.HTTP_400_BAD_REQUEST, resp.content
    assert "error" in resp.data
    intake_issue_record.refresh_from_db()
    assert intake_issue_record.status == -2
    _no_side_effects.delay.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("payload", [{}, {"issue": {"name": "Only Issue"}}, {"unknown": 1}])
def test_body_without_status_fields_returns_400_and_no_activity(
    api_key_client, workspace, project, intake_issue_record, _no_side_effects, payload
):
    url = _status_url(workspace.slug, project.id, intake_issue_record.issue_id)

    resp = api_key_client.patch(url, payload, format="json")

    assert resp.status_code == status.HTTP_400_BAD_REQUEST, resp.content
    assert "error" in resp.data
    intake_issue_record.refresh_from_db()
    assert intake_issue_record.status == -2
    _no_side_effects.delay.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
def test_nonexistent_project_is_decided_by_permission_class(api_key_client, workspace):
    resp = api_key_client.patch(_status_url(workspace.slug, uuid4(), uuid4()), {"status": -1}, format="json")

    assert resp.status_code == status.HTTP_403_FORBIDDEN, resp.content


@pytest.mark.contract
@pytest.mark.django_db
def test_clearing_required_field_without_status_is_rejected_for_stored_status(
    api_key_client, workspace, project, intake_issue_record, create_user
):
    target = Issue.objects.create(name="Target", project=project, workspace=workspace, created_by=create_user)
    url = _status_url(workspace.slug, project.id, intake_issue_record.issue_id)

    IntakeIssue.objects.filter(pk=intake_issue_record.pk).update(status=0, snoozed_till=timezone.now())
    resp = api_key_client.patch(url, {"snoozed_till": None}, format="json")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST, resp.content

    IntakeIssue.objects.filter(pk=intake_issue_record.pk).update(status=2, duplicate_to=target)
    resp = api_key_client.patch(url, {"duplicate_to": None}, format="json")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST, resp.content

    intake_issue_record.refresh_from_db()
    assert intake_issue_record.duplicate_to_id == target.id


@pytest.mark.contract
def test_status_route_documents_a_status_only_example():
    from plane.api.views.intake import IntakeIssueStatusAPIEndpoint
    from plane.utils.openapi import INTAKE_ISSUE_STATUS_UPDATE_EXAMPLE

    assert set(INTAKE_ISSUE_STATUS_UPDATE_EXAMPLE.value) <= set(IntakeIssueStatusAPIEndpoint.STATUS_FIELDS)
