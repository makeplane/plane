# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``ProjectViewSet`` PUT authorization.

PUT must enforce the same authorization as PATCH, not fall through to DRF's
generic handler under the bare default permission class.

``urls/project.py`` maps ``"put": "update"``, but the viewset never defined
``update`` — so PUT fell through to DRF's ``ModelViewSet.update``. The class sets
no ``permission_classes``, so that generic handler ran under the project default
of ``IsAuthenticated``, while ``partial_update`` on the *identical* URL requires
workspace admin or project admin.

A workspace member who is not in a Secret project could therefore PUT it to
``network=2`` (Public) and then use the legitimate public-join API to add
themselves — full read plus member-level write on a project they were never in.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, User, WorkspaceMember

pytestmark = [pytest.mark.contract, pytest.mark.django_db]


def project_detail_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/"


def full_put_body(project, workspace, **overrides):
    """A COMPLETE PUT body.

    DRF's generic update runs the serializer with partial=False, so an incomplete
    body 400s on validation before authorization differs at all — the test would
    then pass with or without the fix. A real caller sends every required field.
    """
    body = {
        "name": project.name,
        "identifier": project.identifier,
        "workspace": str(workspace.id),
        "network": project.network,
    }
    body.update(overrides)
    return body


@pytest.fixture
def secret_project(db, workspace, create_user):
    """A Secret (network=0) project owned by the workspace owner."""
    project = Project.objects.create(
        name="Secret Project",
        identifier=f"S{uuid4().hex[:3].upper()}",
        workspace=workspace,
        network=0,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    return project


@pytest.fixture
def outsider_client(db, workspace):
    """A workspace MEMBER with no membership of ``secret_project``.

    Role 15 (member), not admin — partial_update admits workspace admins, so an
    admin would be authorised on both verbs and could not show the asymmetry.
    """
    uid = uuid4().hex[:8]
    outsider = User.objects.create(email=f"outsider-{uid}@plane.so", username=f"outsider_{uid}")
    outsider.set_password("pw")
    outsider.save()
    WorkspaceMember.objects.create(workspace=workspace, member=outsider, role=15, is_active=True)
    client = APIClient()
    client.force_authenticate(user=outsider)
    return client


@pytest.mark.contract
class TestProjectPutAuthz:
    def test_non_member_put_is_denied(self, outsider_client, workspace, secret_project):
        response = outsider_client.put(
            project_detail_url(workspace.slug, secret_project.id),
            full_put_body(secret_project, workspace, name="Renamed", network=2),
            format="json",
        )
        assert response.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        ), f"Got {response.status_code}: {getattr(response, 'data', None)!r}"

    def test_denied_put_does_not_change_network(self, outsider_client, workspace, secret_project):
        """The 403 must also mean nothing was written.

        A denied response that still flipped network=2 would leave the project
        published — the actual damage, independent of the status code.
        """
        outsider_client.put(
            project_detail_url(workspace.slug, secret_project.id),
            full_put_body(secret_project, workspace, name="Renamed", network=2),
            format="json",
        )
        secret_project.refresh_from_db()
        assert secret_project.network == 0, "a denied PUT must not publish the project"
        assert secret_project.name == "Secret Project", "a denied PUT must not rename the project"

    def test_put_and_patch_agree(self, outsider_client, workspace, secret_project):
        """PUT and PATCH on the same URL must reach the same verdict.

        The defect was purely that they disagreed: PATCH 403, PUT 200.
        """
        put_status = outsider_client.put(
            project_detail_url(workspace.slug, secret_project.id),
            full_put_body(secret_project, workspace, name="X", network=2),
            format="json",
        ).status_code
        patch_status = outsider_client.patch(
            project_detail_url(workspace.slug, secret_project.id),
            {"network": 2},
            format="json",
        ).status_code

        put_allowed = put_status < 400
        patch_allowed = patch_status < 400
        assert put_allowed == patch_allowed, (
            f"PUT and PATCH disagree on the same URL: PUT={put_status}, PATCH={patch_status}"
        )

    def test_workspace_admin_put_still_works(self, session_client, workspace, secret_project):
        """Positive control: guarding PUT must not break the legitimate path."""
        response = session_client.put(
            project_detail_url(workspace.slug, secret_project.id),
            full_put_body(secret_project, workspace, name="Renamed By Admin"),
            format="json",
        )
        assert response.status_code < 400, f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        secret_project.refresh_from_db()
        assert secret_project.name == "Renamed By Admin"
