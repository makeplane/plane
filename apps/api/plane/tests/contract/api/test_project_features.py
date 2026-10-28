# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for GET/PATCH /api/v1/workspaces/<slug>/projects/<project_id>/features/."""

from unittest import mock
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import APIToken, Intake, Project, ProjectMember, User, Workspace, WorkspaceMember

ADMIN, MEMBER, GUEST = 20, 15, 5

PROJECT_FEATURE_KEYS = {
    "epics",
    "modules",
    "cycles",
    "views",
    "pages",
    "intakes",
    "work_item_types",
    "workflows",
    "parallel_cycles",
    "project_updates",
}


@pytest.fixture(autouse=True)
def _no_side_effects(db):
    with (
        mock.patch("plane.api.views.project.model_activity") as mock_activity,
        mock.patch("plane.api.views.project.base_host", return_value="http://testserver"),
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
        name="Features Project",
        identifier="FP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=proj, member=create_user, workspace=workspace, role=ADMIN, is_active=True)
    return proj


@pytest.fixture
def sibling_project(db, workspace):
    colleague = _make_user(workspace, None, ADMIN)
    proj = Project.objects.create(
        name="Sibling Project",
        identifier="SIB",
        workspace=workspace,
        created_by=colleague,
        network=0,
    )
    ProjectMember.objects.create(project=proj, member=colleague, workspace=workspace, role=ADMIN, is_active=True)
    return proj


@pytest.fixture
def other_tenant_project(db):
    uid = uuid4().hex[:8]
    owner = User.objects.create(email=f"o-{uid}@plane.so", username=f"o_{uid}")
    other_ws = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uid}")
    WorkspaceMember.objects.create(workspace=other_ws, member=owner, role=ADMIN, is_active=True)
    proj = Project.objects.create(name="OtherProj", identifier="OTP", workspace=other_ws, created_by=owner)
    ProjectMember.objects.create(project=proj, member=owner, workspace=other_ws, role=ADMIN, is_active=True)
    return proj


def _features_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/features/"


@pytest.mark.contract
@pytest.mark.django_db
def test_get_project_features_returns_sdk_shape(api_key_client, workspace, project):
    response = api_key_client.get(_features_url(workspace.slug, project.id))

    assert response.status_code == status.HTTP_200_OK, response.content
    assert set(response.data.keys()) == PROJECT_FEATURE_KEYS
    assert response.data == {
        "epics": False,
        "modules": False,
        "cycles": False,
        "views": False,
        "pages": True,
        "intakes": False,
        "work_item_types": False,
        "workflows": False,
        "parallel_cycles": False,
        "project_updates": False,
    }


@pytest.mark.contract
@pytest.mark.django_db
def test_patch_project_features_updates_columns_creates_intake_and_fires_activity(
    api_key_client, workspace, project, _no_side_effects
):
    payload = {
        "modules": True,
        "cycles": True,
        "views": True,
        "pages": False,
        "intakes": True,
        "work_item_types": True,
        "epics": False,
    }
    response = api_key_client.patch(_features_url(workspace.slug, project.id), payload, format="json")

    assert response.status_code == status.HTTP_200_OK, response.content
    assert set(response.data.keys()) == PROJECT_FEATURE_KEYS
    assert response.data["modules"] is True
    assert response.data["cycles"] is True
    assert response.data["views"] is True
    assert response.data["pages"] is False
    assert response.data["intakes"] is True
    assert response.data["work_item_types"] is True
    assert response.data["epics"] is False

    project.refresh_from_db()
    assert project.module_view is True
    assert project.cycle_view is True
    assert project.issue_views_view is True
    assert project.page_view is False
    assert project.intake_view is True
    assert project.is_issue_type_enabled is True
    assert Intake.objects.filter(project=project, is_default=True).count() == 1
    _no_side_effects.delay.assert_called_once()


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("feature", ["epics", "workflows", "parallel_cycles", "project_updates"])
def test_patch_unsupported_feature_true_returns_400(api_key_client, workspace, project, feature, _no_side_effects):
    response = api_key_client.patch(
        _features_url(workspace.slug, project.id),
        {feature: True, "modules": True},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.content
    assert response.data == {"error": f"{feature} is not available on this edition"}
    project.refresh_from_db()
    assert project.module_view is False
    _no_side_effects.delay.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("feature", ["epics", "workflows", "parallel_cycles", "project_updates"])
def test_patch_unsupported_feature_false_is_accepted_noop(api_key_client, workspace, project, feature):
    response = api_key_client.patch(
        _features_url(workspace.slug, project.id),
        {feature: False},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK, response.content
    assert response.data[feature] is False


@pytest.mark.contract
@pytest.mark.django_db
def test_patch_archived_project_returns_400(api_key_client, workspace, project, _no_side_effects):
    Project.objects.filter(pk=project.pk).update(archived_at=timezone.now())

    response = api_key_client.patch(
        _features_url(workspace.slug, project.id),
        {"modules": True},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.content
    assert response.data == {"error": "Archived project cannot be updated"}
    project.refresh_from_db()
    assert project.module_view is False
    _no_side_effects.delay.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
def test_patch_invalid_boolean_payload_returns_400(api_key_client, workspace, project):
    response = api_key_client.patch(
        _features_url(workspace.slug, project.id),
        {"modules": "not-a-boolean"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.content


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize(
    "ws_role,proj_role,expected_get,expected_patch",
    [
        (ADMIN, ADMIN, status.HTTP_200_OK, status.HTTP_200_OK),
        (ADMIN, MEMBER, status.HTTP_200_OK, status.HTTP_200_OK),
        (MEMBER, MEMBER, status.HTTP_200_OK, status.HTTP_403_FORBIDDEN),
        (GUEST, GUEST, status.HTTP_200_OK, status.HTTP_403_FORBIDDEN),
        (MEMBER, None, status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN),
        (None, None, status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN),
    ],
)
def test_project_features_permission_matrix(workspace, project, ws_role, proj_role, expected_get, expected_patch):
    user = _make_user(workspace, project, ws_role, proj_role)
    client = _client_for(user)
    url = _features_url(workspace.slug, project.id)

    get_resp = client.get(url)
    patch_resp = client.patch(url, {"modules": True}, format="json")

    assert get_resp.status_code == expected_get, get_resp.content
    assert patch_resp.status_code == expected_patch, patch_resp.content


@pytest.mark.contract
@pytest.mark.django_db
def test_cross_project_and_cross_workspace_ids(
    api_key_client, workspace, project, sibling_project, other_tenant_project
):
    # Sibling project in same workspace where caller is not a member -> 403
    sib_url = _features_url(workspace.slug, sibling_project.id)
    assert api_key_client.get(sib_url).status_code == status.HTTP_403_FORBIDDEN
    assert api_key_client.patch(sib_url, {"modules": True}, format="json").status_code == status.HTTP_403_FORBIDDEN
    sibling_project.refresh_from_db()
    assert sibling_project.module_view is False

    # Cross-workspace project id under caller's workspace -> 404
    cross_ws_url = _features_url(workspace.slug, other_tenant_project.id)
    assert api_key_client.get(cross_ws_url).status_code == status.HTTP_404_NOT_FOUND
    assert api_key_client.patch(cross_ws_url, {"modules": True}, format="json").status_code == status.HTTP_404_NOT_FOUND
    other_tenant_project.refresh_from_db()
    assert other_tenant_project.module_view is False

    # Own project id under other workspace slug -> 404
    wrong_slug_url = _features_url(other_tenant_project.workspace.slug, project.id)
    assert api_key_client.get(wrong_slug_url).status_code == status.HTTP_404_NOT_FOUND
    assert (
        api_key_client.patch(wrong_slug_url, {"modules": True}, format="json").status_code == status.HTTP_404_NOT_FOUND
    )
    project.refresh_from_db()
    assert project.module_view is False
