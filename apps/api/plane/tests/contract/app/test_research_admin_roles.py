# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Administrator tags: who may grant them and what they open (SYS-ROLE-*)."""

import pytest
from rest_framework.test import APIClient

from plane.db.models import UserImportAccountSource, UserImportBatch, WorkspaceMember
from plane.license.models import InstanceRoleAssignment
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    grant_admin_tag,
    invite_codes_url,
    make_instance_admin,
    make_user,
    make_workspace,
    pi_workspace,
    public_workspace,
)

pytestmark = pytest.mark.contract


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def env(db):
    instance_admin = make_instance_admin()
    workspace = make_workspace(instance_admin, slug="public-ws")
    member = make_user(first_name="Member")
    add_workspace_member(workspace, member)
    return {"instance_admin": instance_admin, "workspace": workspace, "member": member}


def users_url(suffix=""):
    return f"/api/instances/users/{suffix}"


def test_only_instance_admin_can_grant_tags(env):
    """A normal member (even a workspace admin) cannot hand out a tag."""
    target = make_user(first_name="Target")
    client = client_for(env["member"])
    response = client.post(users_url(f"{target.id}/roles/"), {"role": "DEV_ADMIN"}, format="json")
    assert response.status_code == 403
    assert not InstanceRoleAssignment.objects.filter(user=target).exists()


def test_instance_admin_grants_and_revokes_tag(env):
    target = make_user(first_name="Target")
    client = client_for(env["instance_admin"])

    created = client.post(users_url(f"{target.id}/roles/"), {"role": "DEV_ADMIN"}, format="json")
    assert created.status_code == 201
    assert created.data["roles"] == ["DEV_ADMIN"]

    duplicate = client.post(users_url(f"{target.id}/roles/"), {"role": "DEV_ADMIN"}, format="json")
    assert duplicate.status_code == 200
    assert duplicate.data["created"] is False

    revoked = client.delete(users_url(f"{target.id}/roles/"), {"role": "DEV_ADMIN"}, format="json")
    assert revoked.status_code == 200
    assert revoked.data["revoked"] is True
    assert revoked.data["roles"] == []
    assert (
        InstanceRoleAssignment.objects.filter(user=target, deleted_at__isnull=True).count() == 0
    )


def test_ops_tag_does_not_grant_research_configuration_or_content(env):
    workspace = env["workspace"]
    enable_research(workspace)
    tag_holder = make_user(first_name="TagHolder")
    add_workspace_member(workspace, tag_holder)
    grant_admin_tag(tag_holder, "OPS_ADMIN", actor=env["instance_admin"])

    client = client_for(tag_holder)
    settings_response = client.patch(
        f"/api/research/workspaces/{workspace.slug}/settings/",
        {"report_enabled": True},
        format="json",
    )
    assert settings_response.status_code == 403

    audit_response = client.get(f"/api/research/workspaces/{workspace.slug}/audit-events/")
    assert audit_response.status_code == 403

    member_client = client_for(env["member"])
    member_settings = member_client.patch(
        f"/api/research/workspaces/{workspace.slug}/settings/",
        {"report_enabled": True},
        format="json",
    )
    assert member_settings.status_code == 403

    # Data surfaces keep the organisation boundary: the tag holder is not a
    # workspace administrator, so the report list stays scoped to them.
    reports = client.get(f"/api/research/workspaces/{workspace.slug}/reports/")
    assert reports.status_code == 403


def test_identity_me_exposes_tags(env, settings):
    settings.RESEARCH_MODULE_ENABLED = True
    workspace = env["workspace"]
    enable_research(workspace)
    tag_holder = make_user(first_name="TagHolder")
    add_workspace_member(workspace, tag_holder)
    grant_admin_tag(tag_holder, "MAIN_PI", actor=env["instance_admin"])

    response = client_for(tag_holder).get(f"/api/research/workspaces/{workspace.slug}/identity/me/")
    assert response.status_code == 200
    user_payload = response.data["user"]
    assert user_payload["is_system_admin"] is False
    assert user_payload["admin_roles"] == ["MAIN_PI"]
    assert user_payload["is_research_admin"] is False
    assert user_payload["is_workspace_admin"] is False
    assert response.data["capabilities"]["management"]["accounts"] is True
    assert "system" in response.data["capabilities"]["nav"]


def test_tag_holder_only_opens_account_lifecycle_surface(env):
    workspace = env["workspace"]
    enable_research(workspace)
    tag_holder = make_user(first_name="TagHolder")
    add_workspace_member(workspace, tag_holder)
    grant_admin_tag(tag_holder, "OPS_ADMIN", actor=env["instance_admin"])

    client = client_for(tag_holder)
    assert client.get(invite_codes_url(workspace)).status_code == 200
    assert client.get(f"/api/research/workspaces/{workspace.slug}/org-units/").status_code == 200
    assert (
        client.post(
            f"/api/research/workspaces/{workspace.slug}/org-units/",
            {"name": "Forbidden", "unit_type": "GROUP"},
            format="json",
        ).status_code
        == 403
    )
    assert client.get(f"/api/research/workspaces/{workspace.slug}/audit-events/").status_code == 403


def test_tag_assignment_does_not_create_workspace_seats(env):
    public = public_workspace(owner=env["instance_admin"])
    pi = pi_workspace(owner=env["instance_admin"])
    target = make_user(first_name="Target")
    client = client_for(env["instance_admin"])

    client.post(users_url(f"{target.id}/roles/"), {"role": "MAIN_PI"}, format="json")
    assert not WorkspaceMember.objects.filter(workspace=public, member=target, is_active=True).exists()
    assert not WorkspaceMember.objects.filter(workspace=pi, member=target, is_active=True).exists()

    client.delete(users_url(f"{target.id}/roles/"), {"role": "MAIN_PI"}, format="json")
    assert not WorkspaceMember.objects.filter(workspace=pi, member=target, is_active=True).exists()


def test_user_list_reports_tags(env):
    target = make_user(first_name="Target")
    client = client_for(env["instance_admin"])
    client.post(users_url(f"{target.id}/roles/"), {"role": "OPS_ADMIN"}, format="json")

    response = client.get(users_url())
    assert response.status_code == 200
    rows = response.data["results"] if isinstance(response.data, dict) else response.data
    row = next(item for item in rows if str(item["id"]) == str(target.id))
    assert row["admin_roles"] == ["OPS_ADMIN"]


def test_import_created_account_can_be_deactivated_and_reactivated(env):
    target = make_user(first_name="Imported")
    membership = add_workspace_member(env["workspace"], target)
    batch = UserImportBatch.objects.create(workspace=env["workspace"], status="IMPORTED")
    UserImportAccountSource.objects.create(user=target, batch=batch, kind="ROSTER")
    client = client_for(env["instance_admin"])

    deactivated = client.delete(users_url(f"{target.id}/"))
    assert deactivated.status_code == 200
    target.refresh_from_db()
    membership.refresh_from_db()
    assert target.is_active is False
    assert membership.is_active is False

    reactivated = client.post(users_url(f"{target.id}/reactivate/"), {}, format="json")
    assert reactivated.status_code == 200
    target.refresh_from_db()
    membership.refresh_from_db()
    assert target.is_active is True
    assert membership.is_active is True


def test_manual_and_instance_admin_accounts_are_protected(env):
    client = client_for(env["instance_admin"])
    manual = make_user(first_name="Manual")
    manual_response = client.delete(users_url(f"{manual.id}/"))
    assert manual_response.status_code == 409
    assert manual_response.data["code"] == "NOT_IMPORTED"

    batch = UserImportBatch.objects.create(workspace=env["workspace"], status="IMPORTED")
    UserImportAccountSource.objects.create(user=env["instance_admin"], batch=batch, kind="ROSTER")
    self_response = client.delete(users_url(f"{env['instance_admin'].id}/"))
    assert self_response.status_code == 409
    assert self_response.data["code"] == "CURRENT_OPERATOR"


def test_bulk_and_batch_clear_return_per_item_results(env):
    batch = UserImportBatch.objects.create(workspace=env["workspace"], status="IMPORTED")
    imported = [make_user(first_name=f"Imported {index}") for index in range(2)]
    for user in imported:
        add_workspace_member(env["workspace"], user)
        UserImportAccountSource.objects.create(user=user, batch=batch, kind="ROSTER")
    client = client_for(env["instance_admin"])

    bulk = client.post(users_url("bulk-deactivate/"), {"user_ids": [str(imported[0].id)]}, format="json")
    assert bulk.status_code == 200
    assert [item["id"] for item in bulk.data["success"]] == [str(imported[0].id)]
    cleared = client.post(users_url("clear-imported/"), {"batch_id": str(batch.id)}, format="json")
    assert cleared.status_code == 200
    assert [item["id"] for item in cleared.data["success"]] == [str(imported[1].id)]
    assert [item["id"] for item in cleared.data["skipped"]] == [str(imported[0].id)]
