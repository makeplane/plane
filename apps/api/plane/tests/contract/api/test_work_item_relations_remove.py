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
    for relation_type in ("blocked_by", "relates_to"):
        created = _create(api_key_client, workspace, own_project, own_issue, relation_type, [related_issue.id])
        assert created.status_code == status.HTTP_201_CREATED, created.content
    assert IssueRelation.objects.filter(issue=own_issue, related_issue=related_issue).count() == 2

    response = _remove(api_key_client, workspace, own_project, own_issue, related_issue.id)

    assert response.status_code == status.HTTP_204_NO_CONTENT, response.content
    assert IssueRelation.objects.filter(issue=own_issue, related_issue=related_issue).count() == 0


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
