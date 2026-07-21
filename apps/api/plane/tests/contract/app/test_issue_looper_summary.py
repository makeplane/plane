# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    Issue,
    LooperArtifact,
    LooperCollaborationEvent,
    LooperCollaborationSnapshot,
    LooperDispatch,
    LooperRoleRequest,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)


@pytest.fixture
def looper_issue(workspace, create_user):
    project = Project.objects.create(
        name="Looper Project",
        identifier="LOOP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    state = State.objects.create(
        name="Todo",
        project=project,
        group="backlog",
        default=True,
    )
    issue = Issue.objects.create(
        name="Show Looper collaboration",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )
    return project, issue


def _summary_url(workspace, project, issue):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/looper/"


@pytest.mark.contract
@pytest.mark.django_db
def test_looper_summary_is_hidden_without_a_durable_dispatch(session_client, workspace, looper_issue):
    project, issue = looper_issue

    response = session_client.get(_summary_url(workspace, project, issue))

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        "visibility": "hidden",
        "protocol": None,
        "read_only": True,
        "permissions": {
            "can_view": True,
            "can_dispatch": False,
            "can_stop": False,
            "can_release": False,
        },
    }


@pytest.mark.contract
@pytest.mark.django_db
def test_looper_summary_projects_collaboration_state(session_client, workspace, create_user, looper_issue):
    project, issue = looper_issue
    dispatch = LooperDispatch.objects.create(
        project=project,
        issue=issue,
        requested_mode="auto",
        active_role="planner",
        owner_member=create_user,
        dispatched_by_member=create_user,
        node_id="node-cyan",
        node_name_snapshot="Owner MacBook",
        role_policy_revision=3,
        state="awaiting_human",
        wait_kind="role_decision",
        idempotency_key=uuid4(),
    )
    role_request = LooperRoleRequest.objects.create(
        project=project,
        dispatch=dispatch,
        source_event_key="role-request:design-001",
        role="design",
        question_summary="Choose the primary action placement",
        eligible_member=create_user,
        policy_revision=3,
    )
    artifact = LooperArtifact.objects.create(
        project=project,
        dispatch=dispatch,
        source_event_key="artifact:technical-spec:1",
        type="technical_spec",
        title="Technical specification",
        url="https://plane.example.test/pages/spec-1",
        source_revision_id="page-revision-1",
        source_kind="plane_page",
        source_object_id="spec-1",
    )
    LooperCollaborationEvent.objects.create(
        project=project,
        dispatch=dispatch,
        event_version=1,
        source_event_key="event:role-request:design-001",
        event_type="role_request_opened",
        phase="role_decisions",
        role="design",
        role_request=role_request,
        actor_member=create_user,
        role_policy_revision=3,
        artifact=artifact,
        occurred_at=timezone.now(),
    )
    LooperCollaborationSnapshot.objects.create(
        project=project,
        dispatch=dispatch,
        phase="role_decisions",
        phase_started_at=timezone.now(),
        waiting_role="design",
        waiting_member=create_user,
        role_counts={"design": {"open": 1}},
        snapshot_version=1,
    )

    response = session_client.get(_summary_url(workspace, project, issue))

    assert response.status_code == status.HTTP_200_OK
    assert response.data["visibility"] == "visible"
    assert response.data["protocol"] == "strict_v1"
    assert response.data["read_only"] is False
    assert response.data["permissions"]["can_stop"] is True
    assert response.data["dispatch"]["id"] == str(dispatch.id)
    assert response.data["dispatch"]["role_policy_revision"] == 3
    assert response.data["dispatch"]["owner"]["id"] == str(create_user.id)
    assert response.data["dispatch"]["owner"]["display_name"] == create_user.display_name
    assert response.data["dispatch"]["node"]["live_status"] == "unavailable"
    assert response.data["current_phase"] == "role_decisions"
    assert response.data["waiting_role"] == "design"
    assert response.data["current_question"] == "Choose the primary action placement"
    assert response.data["phases"][1] == {"key": "role_decisions", "status": "current"}
    assert response.data["roles"][1]["status"] == "waiting"
    assert response.data["roles"][1]["open_count"] == 1
    assert response.data["artifacts"][0]["url"] == "https://plane.example.test/pages/spec-1"
    assert response.data["recent_events"][0]["type"] == "role_request_opened"
    assert response.data["snapshot_version"] == 1
    assert response.data["available_actions"] == ["stop"]


@pytest.mark.contract
@pytest.mark.django_db
def test_looper_summary_rejects_non_project_members(api_client, workspace, looper_issue):
    project, issue = looper_issue
    outsider = User.objects.create(email="looper-outsider@plane.so", username="looper-outsider")
    WorkspaceMember.objects.create(workspace=workspace, member=outsider, role=15)
    api_client.force_authenticate(user=outsider)

    response = api_client.get(_summary_url(workspace, project, issue))

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_only_one_holding_dispatch_can_own_an_issue(workspace, create_user, looper_issue):
    project, issue = looper_issue
    common = {
        "project": project,
        "issue": issue,
        "requested_mode": "auto",
        "active_role": "planner",
        "owner_member": create_user,
        "dispatched_by_member": create_user,
        "node_id": "node-cyan",
        "node_name_snapshot": "Owner MacBook",
    }
    LooperDispatch.objects.create(**common, revision=1, idempotency_key=uuid4())

    with pytest.raises(IntegrityError), transaction.atomic():
        LooperDispatch.objects.create(**common, revision=2, idempotency_key=uuid4())

    LooperDispatch.objects.filter(issue=issue).update(state="completed")
    replacement = LooperDispatch.objects.create(**common, revision=2, idempotency_key=uuid4())

    assert replacement.state == "queued"
