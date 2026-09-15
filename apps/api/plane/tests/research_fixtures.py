# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared helpers for research module tests."""

from uuid import uuid4

from plane.db.models import User, Workspace, WorkspaceMember, WorkspaceResearchSetting

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
