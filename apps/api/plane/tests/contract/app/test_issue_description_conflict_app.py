# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""PATCH .../issues/{issue_id}/ with ``base_description_html`` rejects stale description saves.

Two editors open on the same work item used to overwrite each other silently
(last write wins), dropping text and images added by the other user (#9995).
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State

ORIGINAL = "<p>original</p>"
OTHER_USER_EDIT = '<p>original</p><image-component src="asset-id"></image-component>'


@pytest.fixture
def setup(db, workspace, create_user):
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    state = State.objects.create(name="Todo", project=project, group="backlog", default=True)
    issue = Issue.objects.create(
        name="I",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
        description_html=ORIGINAL,
    )
    return project, issue


def url(workspace, project, issue):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/"


@pytest.fixture(autouse=True)
def background_tasks():
    with (
        mock.patch("plane.app.views.issue.base.issue_activity") as activity,
        mock.patch("plane.app.views.issue.base.model_activity"),
        mock.patch("plane.app.views.issue.base.issue_description_version_task"),
    ):
        yield activity


@pytest.mark.contract
@pytest.mark.django_db
def test_save_from_current_base_succeeds(session_client, workspace, setup, background_tasks):
    project, issue = setup

    response = session_client.patch(
        url(workspace, project, issue),
        {"description_html": "<p>mine</p>", "base_description_html": ORIGINAL},
        format="json",
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT
    issue.refresh_from_db()
    assert issue.description_html == "<p>mine</p>"
    # the base is a request-only field and must not leak into the activity payload
    assert "base_description_html" not in background_tasks.delay.call_args.kwargs["requested_data"]


@pytest.mark.contract
@pytest.mark.django_db
def test_save_from_stale_base_is_rejected(session_client, workspace, setup, background_tasks):
    project, issue = setup
    Issue.objects.filter(pk=issue.pk).update(description_html=OTHER_USER_EDIT)

    response = session_client.patch(
        url(workspace, project, issue),
        {"description_html": "<p>mine</p>", "base_description_html": ORIGINAL},
        format="json",
    )

    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.data["code"] == "DESCRIPTION_CONFLICT"
    assert response.data["description_html"] == OTHER_USER_EDIT
    issue.refresh_from_db()
    assert issue.description_html == OTHER_USER_EDIT
    background_tasks.delay.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
def test_save_without_base_keeps_last_write_wins(session_client, workspace, setup):
    """Clients that do not send a base (public API, older web builds) keep the previous behaviour."""
    project, issue = setup
    Issue.objects.filter(pk=issue.pk).update(description_html=OTHER_USER_EDIT)

    response = session_client.patch(url(workspace, project, issue), {"description_html": "<p>mine</p>"}, format="json")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    issue.refresh_from_db()
    assert issue.description_html == "<p>mine</p>"


@pytest.mark.contract
@pytest.mark.django_db
def test_non_description_update_ignores_base(session_client, workspace, setup):
    project, issue = setup
    Issue.objects.filter(pk=issue.pk).update(description_html=OTHER_USER_EDIT)

    response = session_client.patch(
        url(workspace, project, issue), {"priority": "high", "base_description_html": ORIGINAL}, format="json"
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT
    issue.refresh_from_db()
    assert issue.priority == "high"
    assert issue.description_html == OTHER_USER_EDIT
