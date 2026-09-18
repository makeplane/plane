# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ordinary Plane access to PI-private workspaces.

A historical ``WorkspaceMember`` or ``ProjectMember`` row is only a Plane
role.  For a PI-private workspace the caller must also hold an explicit
private-workspace seat: instance administrator, configured main PI, or an
active ``ResearchWorkspaceAccessGrant``.
"""

from unittest.mock import patch
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    ResearchWorkspaceAccessGrant,
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceResearchSetting,
)
from plane.license.models import Instance, InstanceAdmin


def _make_user(label):
    return User.objects.create(
        email=f"{label}-{uuid4().hex[:8]}@plane.so",
        username=f"{label}_{uuid4().hex[:8]}",
        first_name=label,
    )


def _client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _workspace_url(workspace):
    return f"/api/workspaces/{workspace.slug}/"


def _my_workspaces_url():
    return "/api/users/me/workspaces/"


def _projects_url(workspace):
    return f"/api/workspaces/{workspace.slug}/projects/"


def _pages_url(workspace, project):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/"


def _project_members_url(workspace, project):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/members/"


@pytest.fixture
def private_plane_env(db):
    owner = _make_user("owner")
    workspace = Workspace.objects.create(
        name="PI private workspace",
        slug=f"pi-private-{uuid4().hex[:8]}",
        owner=owner,
    )
    setting = WorkspaceResearchSetting.objects.create(
        workspace=workspace,
        purpose=WorkspaceResearchSetting.Purpose.PI_PRIVATE,
        module_enabled=False,
    )
    project = Project.objects.create(
        name="Private project",
        identifier=f"PI{uuid4().hex[:4].upper()}",
        workspace=workspace,
    )
    page = Page.objects.create(
        workspace=workspace,
        owned_by=owner,
        access=Page.PUBLIC_ACCESS,
        name="Private workspace page",
    )
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)

    return {
        "owner": owner,
        "workspace": workspace,
        "setting": setting,
        "project": project,
        "page": page,
    }


def _give_plane_seats(env, user):
    WorkspaceMember.objects.create(
        workspace=env["workspace"],
        member=user,
        role=20,
        is_active=True,
    )
    ProjectMember.objects.create(
        workspace=env["workspace"],
        project=env["project"],
        member=user,
        role=20,
        is_active=True,
    )


@pytest.mark.contract
@pytest.mark.django_db
def test_historical_active_membership_cannot_open_or_modify_a_pi_private_workspace(private_plane_env):
    env = private_plane_env
    historical_member = _make_user("historical-member")
    target = _make_user("target")
    _give_plane_seats(env, historical_member)
    WorkspaceMember.objects.create(
        workspace=env["workspace"],
        member=target,
        role=15,
        is_active=True,
    )
    client = _client_for(historical_member)

    responses = (
        client.get(_workspace_url(env["workspace"])),
        client.get(_projects_url(env["workspace"])),
        client.get(_pages_url(env["workspace"], env["project"])),
        client.post(
            _project_members_url(env["workspace"], env["project"]),
            {"members": [{"member_id": str(target.id), "role": 15}]},
            format="json",
        ),
    )

    assert [response.status_code for response in responses] == [
        status.HTTP_403_FORBIDDEN,
        status.HTTP_403_FORBIDDEN,
        status.HTTP_403_FORBIDDEN,
        status.HTTP_403_FORBIDDEN,
    ]
    assert not ProjectMember.objects.filter(project=env["project"], member=target).exists()


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("private_access_kind", ["main_pi", "grant", "instance_admin"])
@patch("plane.app.views.project.member.project_add_user_email.delay")
def test_explicit_private_workspace_principals_keep_standard_plane_access(
    mock_project_add_email,
    private_plane_env,
    private_access_kind,
):
    env = private_plane_env
    principal = _make_user(private_access_kind)
    target = _make_user(f"{private_access_kind}-target")
    _give_plane_seats(env, principal)
    WorkspaceMember.objects.create(
        workspace=env["workspace"],
        member=target,
        role=15,
        is_active=True,
    )

    if private_access_kind == "main_pi":
        env["setting"].main_pi = principal
        env["setting"].save(update_fields=["main_pi", "updated_at"])
    elif private_access_kind == "grant":
        ResearchWorkspaceAccessGrant.objects.create(
            setting=env["setting"],
            user=principal,
            granted_by=env["owner"],
        )
    else:
        instance = Instance.objects.create(
            instance_name="Test instance",
            instance_id=f"instance-{uuid4().hex[:8]}",
            current_version="test",
        )
        InstanceAdmin.objects.create(instance=instance, user=principal, role=20)

    client = _client_for(principal)
    responses = (
        client.get(_workspace_url(env["workspace"])),
        client.get(_projects_url(env["workspace"])),
        client.get(_pages_url(env["workspace"], env["project"])),
        client.post(
            _project_members_url(env["workspace"], env["project"]),
            {"members": [{"member_id": str(target.id), "role": 15}]},
            format="json",
        ),
    )

    assert [response.status_code for response in responses] == [
        status.HTTP_200_OK,
        status.HTTP_200_OK,
        status.HTTP_200_OK,
        status.HTTP_201_CREATED,
    ]
    assert ProjectMember.objects.filter(
        project=env["project"],
        member=target,
        is_active=True,
    ).exists()
    mock_project_add_email.assert_called_once()


@pytest.mark.contract
@pytest.mark.django_db
def test_revoking_a_private_access_grant_immediately_blocks_plane_apis(private_plane_env):
    env = private_plane_env
    grantee = _make_user("revoked-grantee")
    _give_plane_seats(env, grantee)
    grant = ResearchWorkspaceAccessGrant.objects.create(
        setting=env["setting"],
        user=grantee,
        granted_by=env["owner"],
    )
    client = _client_for(grantee)

    assert client.get(_workspace_url(env["workspace"])).status_code == status.HTTP_200_OK

    ResearchWorkspaceAccessGrant.objects.filter(pk=grant.pk).update(deleted_at=timezone.now())

    assert client.get(_workspace_url(env["workspace"])).status_code == status.HTTP_403_FORBIDDEN
    assert client.get(_projects_url(env["workspace"])).status_code == status.HTTP_403_FORBIDDEN
    assert client.get(_pages_url(env["workspace"], env["project"])).status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
@pytest.mark.django_db
def test_my_workspaces_hides_private_workspace_without_an_active_private_seat(private_plane_env):
    env = private_plane_env
    member = _make_user("workspace-list-member")
    _give_plane_seats(env, member)
    general_workspace = Workspace.objects.create(
        name="General workspace",
        slug=f"general-{uuid4().hex[:8]}",
        owner=env["owner"],
    )
    WorkspaceMember.objects.create(
        workspace=general_workspace,
        member=member,
        role=20,
        is_active=True,
    )
    client = _client_for(member)

    unauthorized_slugs = {item["slug"] for item in client.get(_my_workspaces_url()).json()}
    assert general_workspace.slug in unauthorized_slugs
    assert env["workspace"].slug not in unauthorized_slugs

    grant = ResearchWorkspaceAccessGrant.objects.create(
        setting=env["setting"],
        user=member,
        granted_by=env["owner"],
    )
    authorized_slugs = {item["slug"] for item in client.get(_my_workspaces_url()).json()}
    assert env["workspace"].slug in authorized_slugs

    ResearchWorkspaceAccessGrant.objects.filter(pk=grant.pk).update(deleted_at=timezone.now())
    revoked_slugs = {item["slug"] for item in client.get(_my_workspaces_url()).json()}
    assert env["workspace"].slug not in revoked_slugs


@pytest.mark.contract
@pytest.mark.django_db
def test_general_workspace_keeps_existing_plane_membership_behavior(private_plane_env):
    env = private_plane_env
    env["setting"].purpose = WorkspaceResearchSetting.Purpose.GENERAL
    env["setting"].save(update_fields=["purpose", "updated_at"])
    member = _make_user("general-member")
    _give_plane_seats(env, member)
    client = _client_for(member)

    assert client.get(_workspace_url(env["workspace"])).status_code == status.HTTP_200_OK
    assert client.get(_projects_url(env["workspace"])).status_code == status.HTTP_200_OK
    assert client.get(_pages_url(env["workspace"], env["project"])).status_code == status.HTTP_200_OK


@pytest.mark.contract
@pytest.mark.django_db
def test_private_principal_does_not_bypass_standard_plane_membership(private_plane_env):
    env = private_plane_env
    main_pi = _make_user("main-pi-without-plane-seat")
    env["setting"].main_pi = main_pi
    env["setting"].save(update_fields=["main_pi", "updated_at"])
    client = _client_for(main_pi)

    assert client.get(_workspace_url(env["workspace"])).status_code == status.HTTP_404_NOT_FOUND
    assert client.get(_projects_url(env["workspace"])).status_code == status.HTTP_403_FORBIDDEN
    assert client.get(_pages_url(env["workspace"], env["project"])).status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
@pytest.mark.django_db
def test_research_identity_hides_a_private_workspace_without_an_active_seat(
    private_plane_env,
    settings,
):
    settings.RESEARCH_MODULE_ENABLED = True
    env = private_plane_env
    member = _make_user("identity-workspace-member")
    _give_plane_seats(env, member)
    public_workspace = Workspace.objects.create(
        name="Public research",
        slug=f"public-research-{uuid4().hex[:8]}",
        owner=env["owner"],
    )
    WorkspaceResearchSetting.objects.create(
        workspace=public_workspace,
        purpose=WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH,
        module_enabled=True,
    )
    WorkspaceMember.objects.create(
        workspace=public_workspace,
        member=member,
        role=15,
        is_active=True,
    )

    response = _client_for(member).get(
        f"/api/research/workspaces/{public_workspace.slug}/identity/me/"
    )

    assert response.status_code == status.HTTP_200_OK
    assert public_workspace.slug in response.data["user"]["workspaces"]
    assert env["workspace"].slug not in response.data["user"]["workspaces"]
