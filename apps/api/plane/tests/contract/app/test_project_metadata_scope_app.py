# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workspace estimates and the entity search's project results follow the project
list's visibility: guests only get projects they are an active member of,
members also get public projects."""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Estimate, Project, ProjectMember, User, WorkspaceMember

ESTIMATES_URL = "/api/workspaces/{slug}/estimates/"
SEARCH_URL = "/api/workspaces/{slug}/entity-search/?query_type=project&query=Project"


def _client(workspace, workspace_role, project=None, is_active=True):
    """Session client for a new workspace user, optionally a member of ``project``."""
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"user-{unique_id}@plane.so", username=f"user_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=workspace_role)
    if project:
        ProjectMember.objects.create(
            project=project, member=user, workspace=workspace, role=workspace_role, is_active=is_active
        )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _project(workspace, name, network):
    project = Project.objects.create(name=name, identifier=name[:3].upper(), workspace=workspace, network=network)
    project.estimate = Estimate.objects.create(name=f"{name} estimate", project=project, workspace=workspace)
    project.save()
    return project


@pytest.fixture
def public_project(db, workspace):
    return _project(workspace, "Public Project", network=2)


@pytest.fixture
def secret_project(db, workspace):
    return _project(workspace, "Secret Project", network=0)


def _ids(response, key=None):
    assert response.status_code == status.HTTP_200_OK, response.data
    return {str(row["id"]) for row in (response.data[key] if key else response.data)}


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectMetadataScope:
    @pytest.mark.parametrize(
        "workspace_role, joined, expected",
        [
            (5, False, set()),
            (5, True, {"secret"}),
            (15, False, {"public"}),
            (15, True, {"public", "secret"}),
            (20, False, {"public", "secret"}),
        ],
    )
    def test_workspace_estimates_follow_project_visibility(
        self, workspace, public_project, secret_project, workspace_role, joined, expected
    ):
        client = _client(workspace, workspace_role, project=secret_project if joined else None)
        estimates = {"public": str(public_project.estimate_id), "secret": str(secret_project.estimate_id)}

        response = client.get(ESTIMATES_URL.format(slug=workspace.slug))

        assert _ids(response) == {estimates[name] for name in expected}

    @pytest.mark.parametrize(
        "workspace_role, joined, is_active, expected",
        [
            (5, False, True, set()),
            (5, True, True, {"secret"}),
            (15, True, False, {"public"}),
            (15, True, True, {"public", "secret"}),
        ],
    )
    def test_entity_search_projects_follow_project_visibility(
        self, workspace, public_project, secret_project, workspace_role, joined, is_active, expected
    ):
        client = _client(workspace, workspace_role, project=secret_project if joined else None, is_active=is_active)
        projects = {"public": str(public_project.id), "secret": str(secret_project.id)}

        response = client.get(SEARCH_URL.format(slug=workspace.slug))

        assert _ids(response, "project") == {projects[name] for name in expected}
