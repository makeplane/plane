# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the documented work item relation removal endpoint
(``IssueRelationRemoveAPIEndpoint``, ``POST .../relations/remove/``).

Covers: removal of a forward relation, removal of a reverse relation type
(``blocking``), symmetry (either work item can remove the pair), 404 (not 500)
for a pair that has no relation, 400 for a missing payload field, 404 for an
issue outside the project, the emitted delete activity, and
unauthenticated/invalid-key access being rejected.
"""

import json
from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status

from plane.bgtasks.issue_activities_task import delete_issue_relation_activity
from plane.db.models import Issue, IssueRelation, Project, ProjectMember


@pytest.fixture(autouse=True)
def activity_mock(db):
    with (
        mock.patch("plane.api.views.issue.issue_activity") as activity,
        mock.patch("plane.api.views.issue.base_host", return_value="http://testserver"),
    ):
        yield activity


@pytest.fixture
def own_project(workspace, create_user):
    project = Project.objects.create(name="OWN", identifier="OWN", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def own_issue(own_project):
    return Issue.objects.create(name="Own", project=own_project, workspace=own_project.workspace)


@pytest.fixture
def related_issue(own_project):
    return Issue.objects.create(name="Related", project=own_project, workspace=own_project.workspace)


def _relations_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/relations/"


def _remove_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/relations/remove/"


def _create(api_key_client, workspace, project, issue, relation_type, issues):
    payload = {"relation_type": relation_type, "issues": [str(i) for i in issues]}
    return api_key_client.post(_relations_url(workspace, project, issue), payload, format="json")


def _remove(api_key_client, workspace, project, issue, related_issue):
    payload = {"related_issue": str(related_issue)}
    return api_key_client.post(_remove_url(workspace, project, issue), payload, format="json")


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_deletes_relation_and_it_disappears_from_get(
    api_key_client, workspace, own_project, own_issue, related_issue
):
    created = _create(api_key_client, workspace, own_project, own_issue, "blocked_by", [related_issue.id])
    assert created.status_code == status.HTTP_201_CREATED, created.content

    response = _remove(api_key_client, workspace, own_project, own_issue, related_issue.id)

    assert response.status_code == status.HTTP_204_NO_CONTENT, response.content
    assert IssueRelation.objects.filter(issue=own_issue, related_issue=related_issue).count() == 0

    listing = api_key_client.get(_relations_url(workspace, own_project, own_issue))
    assert listing.status_code == status.HTTP_200_OK
    assert listing.data["blocked_by"] == []


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_unknown_pair_is_404_not_500(api_key_client, workspace, own_project, own_issue, related_issue):
    response = _remove(api_key_client, workspace, own_project, own_issue, related_issue.id)

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.content
    assert "error" in response.data


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_reverse_relation_type_blocking(api_key_client, workspace, own_project, own_issue, related_issue):
    # "blocking" is stored reversed: IssueRelation(issue=related, related_issue=own, relation_type="blocked_by").
    created = _create(api_key_client, workspace, own_project, own_issue, "blocking", [related_issue.id])
    assert created.status_code == status.HTTP_201_CREATED, created.content
    assert IssueRelation.objects.filter(issue=related_issue, related_issue=own_issue).count() == 1

    response = _remove(api_key_client, workspace, own_project, own_issue, related_issue.id)

    assert response.status_code == status.HTTP_204_NO_CONTENT, response.content
    assert IssueRelation.objects.filter(issue=related_issue, related_issue=own_issue).count() == 0
    assert api_key_client.get(_relations_url(workspace, own_project, own_issue)).data["blocking"] == []


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_is_symmetric(api_key_client, workspace, own_project, own_issue, related_issue):
    created = _create(api_key_client, workspace, own_project, own_issue, "blocked_by", [related_issue.id])
    assert created.status_code == status.HTTP_201_CREATED, created.content

    # Called from the other side of the pair, the same relation is removed.
    response = _remove(api_key_client, workspace, own_project, related_issue, own_issue.id)

    assert response.status_code == status.HTTP_204_NO_CONTENT, response.content
    assert IssueRelation.objects.filter(issue=own_issue, related_issue=related_issue).count() == 0


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_drops_every_relation_between_the_pair(api_key_client, workspace, own_project, own_issue, related_issue):
    created = _create(api_key_client, workspace, own_project, own_issue, "blocked_by", [related_issue.id])
    assert created.status_code == status.HTTP_201_CREATED, created.content
    # Same pair, opposite direction: the unique constraint on (issue, related_issue)
    # ignores relation_type, so a second row for the *same* direction would be
    # silently dropped by the create view's ignore_conflicts bulk_create.
    IssueRelation.objects.create(
        issue=related_issue,
        related_issue=own_issue,
        relation_type="relates_to",
        project=own_project,
        workspace=own_project.workspace,
    )
    assert (
        IssueRelation.objects.filter(
            issue__in=[own_issue, related_issue], related_issue__in=[own_issue, related_issue]
        ).count()
        == 2
    )

    response = _remove(api_key_client, workspace, own_project, own_issue, related_issue.id)

    assert response.status_code == status.HTTP_204_NO_CONTENT, response.content
    assert (
        IssueRelation.objects.filter(
            issue__in=[own_issue, related_issue], related_issue__in=[own_issue, related_issue]
        ).count()
        == 0
    )


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_unknown_related_issue_uuid_is_404(api_key_client, workspace, own_project, own_issue):
    response = _remove(api_key_client, workspace, own_project, own_issue, uuid4())

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.content


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_issue_outside_project_is_404(api_key_client, workspace, own_project, related_issue):
    response = api_key_client.post(
        f"/api/v1/workspaces/{workspace.slug}/projects/{own_project.id}/work-items/{uuid4()}/relations/remove/",
        {"related_issue": str(related_issue.id)},
        format="json",
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.content


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_missing_payload_field_is_400(api_key_client, workspace, own_project, own_issue):
    response = api_key_client.post(_remove_url(workspace, own_project, own_issue), {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.content


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_emits_delete_activity(api_key_client, workspace, own_project, own_issue, related_issue, activity_mock):
    created = _create(api_key_client, workspace, own_project, own_issue, "blocked_by", [related_issue.id])
    assert created.status_code == status.HTTP_201_CREATED, created.content
    # The create call above also queues a "created" activity on the same mock;
    # reset it so the assertions below measure only the delete activity.
    activity_mock.reset_mock()

    response = _remove(api_key_client, workspace, own_project, own_issue, related_issue.id)
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.content

    assert activity_mock.delay.call_count == 1
    kwargs = activity_mock.delay.call_args.kwargs
    assert kwargs["type"] == "issue_relation.activity.deleted"
    payload = json.loads(kwargs["requested_data"])
    assert payload["related_issue"] == str(related_issue.id)
    assert payload["relation_type"] == "blocked_by"


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_unauthenticated_is_rejected(api_client, workspace, own_project, own_issue, related_issue):
    response = api_client.post(
        _remove_url(workspace, own_project, own_issue), {"related_issue": str(related_issue.id)}, format="json"
    )

    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_invalid_api_key_is_rejected(api_client, workspace, own_project, own_issue, related_issue):
    api_client.credentials(HTTP_X_API_KEY="not-a-real-token")

    response = api_client.post(
        _remove_url(workspace, own_project, own_issue), {"related_issue": str(related_issue.id)}, format="json"
    )

    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.fixture
def hidden_project(workspace, create_bot_user):
    """A project the API-key user is NOT a member of."""
    project = Project.objects.create(
        name="HIDDEN",
        identifier="HIDDEN",
        workspace=workspace,
        created_by=create_bot_user,
    )
    ProjectMember.objects.create(project=project, member=create_bot_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def hidden_issue(hidden_project):
    """An issue in a project the API-key user cannot see."""
    return Issue.objects.create(name="Hidden", project=hidden_project, workspace=hidden_project.workspace)


@pytest.fixture
def other_project(workspace, create_user):
    """A project in the same workspace that the API-key user IS a member of (for cross-project tests)."""
    project = Project.objects.create(name="OTHER", identifier="OTHER", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def other_issue(other_project):
    """An issue in another project that the API-key user CAN see."""
    return Issue.objects.create(name="Other", project=other_project, workspace=other_project.workspace)


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_counterpart_hidden_returns_404_and_relation_survives(
    api_key_client, workspace, own_project, own_issue, hidden_issue, activity_mock
):
    """COUNTERPART VISIBILITY: Caller cannot view hidden counterpart → 404.

    Security: prevent work item probing in projects the caller cannot access.
    Uses visible_issue_q (same rule as list endpoint). Not limited to same-project.

    Assert: 404 response AND relation row survives (not deleted).
    """
    # Create the relation row directly (bypassing the API endpoint which would
    # check visibility at create time). This simulates a cross-project pair where
    # the hidden issue is legitimately related but now hidden from the caller.
    relation = IssueRelation.objects.create(
        issue=own_issue,
        related_issue=hidden_issue,
        relation_type="blocked_by",
        project=own_project,
        workspace=workspace,
    )
    assert IssueRelation.objects.filter(pk=relation.pk).exists()

    # Attempt to remove the relation to the hidden issue.
    response = _remove(api_key_client, workspace, own_project, own_issue, hidden_issue.id)

    # Must return 404, not 500 or 204.
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.content
    assert "error" in response.data

    # Relation row must NOT be deleted (it was hidden, not removed).
    assert IssueRelation.objects.filter(pk=relation.pk).exists()

    # Activity should NOT be emitted for a failed visibility check.
    activity_mock.delay.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
def test_remove_inverse_relation_type_in_deletion_activity(
    api_key_client, workspace, own_project, own_issue, related_issue, activity_mock
):
    """INVERSE RELATION TYPE: Activity for reversed relations carries inverted type.

    When the stored row points toward the path issue (relation.related_issue_id == path),
    the activity payload must carry get_inverse_relation(stored type), not the stored type.

    Example: 'blocking' stored as (issue=related, related_issue=own, type='blocked_by').
    When removed from own_issue, the activity for own_issue carries 'blocking', not 'blocked_by'.

    Assert: activity payload relation_type == 'blocking'.
    """
    # Create a "blocking" relation, which is stored reversed:
    # IssueRelation(issue=related_issue, related_issue=own_issue, relation_type="blocked_by")
    created = _create(api_key_client, workspace, own_project, own_issue, "blocking", [related_issue.id])
    assert created.status_code == status.HTTP_201_CREATED, created.content

    # Verify the row was stored reversed.
    stored_relation = IssueRelation.objects.get(issue=related_issue, related_issue=own_issue)
    assert stored_relation.relation_type == "blocked_by"

    # Reset the mock to measure only the delete activity.
    activity_mock.reset_mock()

    # Remove from the path issue (own_issue). The stored row points AT own_issue
    # (related_issue_id == own_issue.id), so it's the inverse from own_issue's view.
    response = _remove(api_key_client, workspace, own_project, own_issue, related_issue.id)
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.content

    # Check the activity payload.
    assert activity_mock.delay.call_count == 1
    kwargs = activity_mock.delay.call_args.kwargs
    payload = json.loads(kwargs["requested_data"])

    # The activity for own_issue (path issue) must carry the INVERSE type.
    assert payload["relation_type"] == "blocking", (
        f"Expected 'blocking' (inverse of stored 'blocked_by'), got '{payload['relation_type']}'"
    )


@pytest.mark.unit
@pytest.mark.django_db
def test_delete_relation_activity_records_counterpart_in_workspace(
    workspace, own_project, own_issue, other_project, other_issue, create_user
):
    """CROSS-PROJECT COUNTERPART: a counterpart in another project still gets a row.

    Exercises delete_issue_relation_activity directly (no mocked delay call). The
    counterpart is looked up workspace-wide, so a cross-project pair is recorded and
    the row is stamped like the create path stamps it: the activity's own project.
    """
    issue_activities = []

    delete_issue_relation_activity(
        requested_data=json.dumps({"related_issue": str(other_issue.id), "relation_type": "start_after"}),
        current_instance=None,
        issue_id=str(own_issue.id),
        project_id=str(own_project.id),
        workspace_id=str(workspace.id),
        actor_id=str(create_user.id),
        issue_activities=issue_activities,
        epoch=1,
    )

    assert len(issue_activities) == 2
    path_activity, counterpart_activity = issue_activities

    assert str(path_activity.issue_id) == str(own_issue.id)
    assert str(path_activity.project_id) == str(own_project.id)
    assert str(path_activity.workspace_id) == str(workspace.id)
    assert path_activity.field == "start_after"

    assert str(counterpart_activity.issue_id) == str(other_issue.id)
    assert str(counterpart_activity.project_id) == str(own_project.id)
    assert str(counterpart_activity.workspace_id) == str(workspace.id)
    assert counterpart_activity.field == "start_before"
