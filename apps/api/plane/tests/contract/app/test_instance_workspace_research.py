# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

import pytest
from rest_framework.test import APIClient

from plane.db.models import ResearchWorkspaceAccessGrant, WorkspaceMember, WorkspaceResearchSetting
from plane.tests.research_fixtures import make_instance_admin, make_user

pytestmark = pytest.mark.contract


@pytest.mark.django_db
def test_instance_admin_creates_a_workspace_with_research_disabled_by_default():
    admin = make_instance_admin()
    client = APIClient()
    client.force_authenticate(user=admin)

    response = client.post(
        "/api/instances/workspaces/",
        {"name": "新工作空间", "slug": "new-research-space", "organization_size": "51-100"},
        format="json",
    )

    assert response.status_code == 201
    setting = WorkspaceResearchSetting.objects.get(workspace_id=response.data["id"])
    assert setting.purpose == WorkspaceResearchSetting.Purpose.GENERAL
    assert setting.module_enabled is False


@pytest.mark.django_db
def test_instance_admin_configures_main_pi_without_a_legacy_tag():
    admin = make_instance_admin()
    main_pi = make_user(first_name="MainPI")
    client = APIClient()
    client.force_authenticate(user=admin)
    created = client.post(
        "/api/instances/workspaces/",
        {
            "name": "主PI工作空间",
            "slug": "private-pi-space",
            "organization_size": "1-10",
            "research_purpose": "PI_PRIVATE",
        },
        format="json",
    )

    configured = client.patch(
        f"/api/instances/workspaces/{created.data['id']}/research/",
        {"main_pi": str(main_pi.id)},
        format="json",
    )

    assert configured.status_code == 200
    setting = WorkspaceResearchSetting.objects.get(workspace_id=created.data["id"])
    assert setting.main_pi_id == main_pi.id
    assert main_pi.member_workspace.filter(workspace_id=created.data["id"], is_active=True).exists()


@pytest.mark.django_db
def test_instance_admin_can_configure_main_pi_by_email():
    admin = make_instance_admin()
    main_pi = make_user(email="configured-pi@example.com", first_name="ConfiguredPI")
    client = APIClient()
    client.force_authenticate(user=admin)
    created = client.post(
        "/api/instances/workspaces/",
        {
            "name": "邮箱任命空间",
            "slug": "email-main-pi-space",
            "organization_size": "1-10",
            "research_purpose": "PUBLIC_RESEARCH",
        },
        format="json",
    )

    configured = client.patch(
        f"/api/instances/workspaces/{created.data['id']}/research/",
        {"main_pi": main_pi.email},
        format="json",
    )

    assert configured.status_code == 200
    assert configured.data["main_pi"] == str(main_pi.id)


@pytest.mark.django_db
def test_instance_admin_configures_private_access_without_updating_main_pi():
    admin = make_instance_admin()
    private_user = make_user(first_name="PrivateMember")
    client = APIClient()
    client.force_authenticate(user=admin)
    created = client.post(
        "/api/instances/workspaces/",
        {
            "name": "仅私有成员工作空间",
            "slug": "private-access-only-space",
            "organization_size": "1-10",
            "research_purpose": "PI_PRIVATE",
        },
        format="json",
    )

    configured = client.patch(
        f"/api/instances/workspaces/{created.data['id']}/research/",
        {"private_access_users": [str(private_user.id)]},
        format="json",
    )

    assert configured.status_code == 200
    setting = WorkspaceResearchSetting.objects.get(workspace_id=created.data["id"])
    assert setting.main_pi_id is None
    assert ResearchWorkspaceAccessGrant.objects.filter(setting=setting, user=private_user).exists()
    assert private_user.member_workspace.filter(workspace_id=created.data["id"], is_active=True).exists()
    assert configured.data["private_access_users"] == [str(private_user.id)]

    listed = client.get("/api/instances/workspaces/")
    listed_workspace = next(item for item in listed.data["results"] if item["id"] == created.data["id"])
    assert listed_workspace["private_access_users"] == [str(private_user.id)]


@pytest.mark.django_db
def test_instance_admin_rejects_non_boolean_module_enabled():
    admin = make_instance_admin()
    client = APIClient()
    client.force_authenticate(user=admin)
    created = client.post(
        "/api/instances/workspaces/",
        {"name": "严格布尔工作空间", "slug": "strict-boolean-space", "organization_size": "1-10"},
        format="json",
    )

    configured = client.patch(
        f"/api/instances/workspaces/{created.data['id']}/research/",
        {"module_enabled": "false"},
        format="json",
    )

    assert configured.status_code == 400
    assert configured.data == {"error": "`module_enabled` must be a boolean"}
    setting = WorkspaceResearchSetting.objects.get(workspace_id=created.data["id"])
    assert setting.module_enabled is False


@pytest.mark.django_db
def test_instance_admin_accepts_json_boolean_module_enabled():
    admin = make_instance_admin()
    client = APIClient()
    client.force_authenticate(user=admin)
    created = client.post(
        "/api/instances/workspaces/",
        {"name": "JSON 布尔工作空间", "slug": "json-boolean-space", "organization_size": "1-10"},
        format="json",
    )
    url = f"/api/instances/workspaces/{created.data['id']}/research/"

    enabled = client.patch(url, {"module_enabled": True}, format="json")
    assert enabled.status_code == 200
    setting = WorkspaceResearchSetting.objects.get(workspace_id=created.data["id"])
    assert setting.module_enabled is True

    disabled = client.patch(url, {"module_enabled": False}, format="json")
    assert disabled.status_code == 200
    setting.refresh_from_db()
    assert setting.module_enabled is False


@pytest.mark.django_db
def test_switching_to_pi_private_forces_research_off():
    admin = make_instance_admin()
    client = APIClient()
    client.force_authenticate(user=admin)
    created = client.post(
        "/api/instances/workspaces/",
        {"name": "用途切换空间", "slug": "purpose-switch-space", "organization_size": "1-10"},
        format="json",
    )
    url = f"/api/instances/workspaces/{created.data['id']}/research/"
    assert client.patch(url, {"module_enabled": True}, format="json").status_code == 200

    switched = client.patch(url, {"purpose": "PI_PRIVATE", "module_enabled": False}, format="json")

    assert switched.status_code == 200
    assert switched.data["research_purpose"] == "PI_PRIVATE"
    assert switched.data["research_enabled"] is False


@pytest.mark.django_db
def test_non_instance_admin_cannot_create_a_workspace_through_the_regular_api():
    user = make_user(first_name="Member")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        "/api/workspaces/",
        {"name": "Forbidden workspace", "slug": "forbidden-workspace", "organization_size": "1-10"},
        format="json",
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_general_workspace_rejects_private_access_grants_and_clears_main_pi():
    admin = make_instance_admin()
    main_pi = make_user(first_name="MainPI")
    client = APIClient()
    client.force_authenticate(user=admin)
    created = client.post(
        "/api/instances/workspaces/",
        {
            "name": "General workspace",
            "slug": "general-purpose-invariants",
            "organization_size": "1-10",
        },
        format="json",
    )
    url = f"/api/instances/workspaces/{created.data['id']}/research/"

    main_pi_response = client.patch(url, {"main_pi": str(main_pi.id)}, format="json")
    grant_response = client.patch(
        url,
        {"private_access_users": [str(main_pi.id)]},
        format="json",
    )

    assert main_pi_response.status_code == 422
    assert grant_response.status_code == 422
    setting = WorkspaceResearchSetting.objects.get(workspace_id=created.data["id"])
    assert setting.main_pi_id is None
    assert not ResearchWorkspaceAccessGrant.objects.filter(setting=setting).exists()


@pytest.mark.django_db
def test_leaving_pi_private_revokes_grants_and_deactivates_private_seats():
    admin = make_instance_admin()
    grantee = make_user(first_name="Grantee")
    client = APIClient()
    client.force_authenticate(user=admin)
    created = client.post(
        "/api/instances/workspaces/",
        {
            "name": "Temporary private workspace",
            "slug": "temporary-private-workspace",
            "organization_size": "1-10",
            "research_purpose": "PI_PRIVATE",
        },
        format="json",
    )
    url = f"/api/instances/workspaces/{created.data['id']}/research/"
    assert client.patch(
        url,
        {"private_access_users": [str(grantee.id)]},
        format="json",
    ).status_code == 200

    switched = client.patch(url, {"purpose": "GENERAL"}, format="json")

    assert switched.status_code == 200
    setting = WorkspaceResearchSetting.objects.get(workspace_id=created.data["id"])
    assert not ResearchWorkspaceAccessGrant.objects.filter(setting=setting).exists()
    assert not WorkspaceMember.objects.filter(
        workspace_id=created.data["id"],
        member=grantee,
        is_active=True,
    ).exists()


@pytest.mark.django_db
def test_public_main_pi_appointment_syncs_public_and_private_workspace_seats():
    admin = make_instance_admin()
    main_pi = make_user(first_name="MainPI")
    client = APIClient()
    client.force_authenticate(user=admin)
    public = client.post(
        "/api/instances/workspaces/",
        {
            "name": "Public research",
            "slug": "public-main-pi-sync",
            "organization_size": "1-10",
            "research_purpose": "PUBLIC_RESEARCH",
        },
        format="json",
    )
    private = client.post(
        "/api/instances/workspaces/",
        {
            "name": "PI private",
            "slug": "private-main-pi-sync",
            "organization_size": "1-10",
            "research_purpose": "PI_PRIVATE",
        },
        format="json",
    )

    configured = client.patch(
        f"/api/instances/workspaces/{public.data['id']}/research/",
        {"main_pi": str(main_pi.id)},
        format="json",
    )

    assert configured.status_code == 200
    assert WorkspaceMember.objects.filter(
        workspace_id=public.data["id"], member=main_pi, is_active=True
    ).exists()
    assert WorkspaceMember.objects.filter(
        workspace_id=private.data["id"], member=main_pi, is_active=True
    ).exists()
