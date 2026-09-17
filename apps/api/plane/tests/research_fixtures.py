# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared helpers for research module tests."""

from uuid import uuid4

from plane.db.models import User, Workspace, WorkspaceMember, WorkspaceResearchSetting
from plane.license.models import Instance, InstanceAdmin, InstanceRoleAssignment

WORKSPACE_ADMIN_ROLE = 20
WORKSPACE_MEMBER_ROLE = 15
WORKSPACE_GUEST_ROLE = 5


def make_user(email=None, first_name="Research", last_name="User", is_active=True):
    email = email or f"user-{uuid4().hex[:8]}@example.com"
    user = User.objects.create(
        email=email,
        username=email,
        first_name=first_name,
        last_name=last_name,
        is_active=is_active,
    )
    user.set_password("test-password")
    user.save()
    return user


def make_workspace(owner, name="Research Workspace", slug=None, timezone="UTC"):
    slug = slug or f"ws-{uuid4().hex[:8]}"
    workspace = Workspace.objects.create(
        name=name,
        owner=owner,
        slug=slug,
        timezone=timezone,
    )
    WorkspaceMember.objects.create(
        workspace=workspace,
        member=owner,
        role=WORKSPACE_ADMIN_ROLE,
    )
    return workspace


def add_workspace_member(workspace, user, role=WORKSPACE_MEMBER_ROLE):
    return WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)


def org_units_url(workspace, suffix=""):
    return f"/api/research/workspaces/{workspace.slug}/org-units/{suffix}"


def mentors_url(workspace, suffix=""):
    return f"/api/research/workspaces/{workspace.slug}/mentors/{suffix}"


def enable_research(workspace, **overrides):
    """Turn the research module on for a workspace (P0-CFG-02)."""
    defaults = {
        "module_enabled": True,
        "org_enabled": True,
        "report_enabled": True,
        "approval_enabled": True,
    }
    defaults.update(overrides)
    setting, _ = WorkspaceResearchSetting.objects.update_or_create(
        workspace=workspace,
        defaults=defaults,
    )
    return setting


def make_instance(name="AI4MS Test Instance"):
    """Create (or reuse) the singleton instance row."""
    instance = Instance.objects.first()
    if instance is not None:
        return instance
    return Instance.objects.create(
        instance_name=name,
        instance_id=f"test-{uuid4().hex[:8]}",
        current_version="2.4.0",
        is_setup_done=True,
    )


def make_instance_admin(user=None, role=20):
    """Grant the god-mode instance administrator seat."""
    instance = make_instance()
    admin_user = user or make_user(email=f"instance-admin-{uuid4().hex[:6]}@example.com")
    InstanceAdmin.objects.get_or_create(instance=instance, user=admin_user, defaults={"role": role})
    return admin_user


def grant_admin_tag(user, role, actor=None):
    """Grant one of the three administrator tags."""
    instance = make_instance()
    return InstanceRoleAssignment.objects.create(
        instance=instance,
        user=user,
        role=role,
        assigned_by=actor,
    )


def invite_codes_url(workspace, suffix=""):
    return f"/api/research/workspaces/{workspace.slug}/invite-codes/{suffix}"


def user_imports_url(workspace, suffix=""):
    return f"/api/research/workspaces/{workspace.slug}/user-imports/{suffix}"


def pi_aggregate_url(workspace):
    return f"/api/research/workspaces/{workspace.slug}/aggregate/"


def public_workspace(owner=None, slug="public", name="公共工作区"):
    """Create the public workspace used by invite codes and imports."""
    owner = owner or make_user(email=f"public-owner-{uuid4().hex[:6]}@example.com")
    workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
    if workspace is not None:
        return workspace
    workspace = make_workspace(owner, name=name, slug=slug)
    enable_research(workspace, purpose=WorkspaceResearchSetting.Purpose.PUBLIC_RESEARCH)
    return workspace


def pi_workspace(owner=None, slug="pi", name="主PI工作区"):
    owner = owner or make_user(email=f"pi-owner-{uuid4().hex[:6]}@example.com")
    workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
    if workspace is not None:
        return workspace
    workspace = make_workspace(owner, name=name, slug=slug)
    enable_research(workspace, purpose=WorkspaceResearchSetting.Purpose.PI_PRIVATE)
    return workspace
