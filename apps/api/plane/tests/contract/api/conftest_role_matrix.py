# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""Shared fixtures for external-API role-matrix contract tests.

Provides a workspace + project populated with users at every role level
(workspace owner/admin/member/guest, project admin/contributor/commenter/guest)
plus an outsider user with no workspace membership. Tests parametrize over
these to verify @can decorator allow/deny matches the role grants in
permission_schemes.py.
"""

from dataclasses import dataclass
from unittest.mock import patch
from uuid import uuid4

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    Issue,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.db.models.api import APIToken
from plane.db.models.permission import Role


# Project role slugs (per system_roles.py PROJECT_ROLE_MEMBER_VALUE).
# Note: commenter and guest both have legacy member.role=5 in the model;
# role_ref FK distinguishes them at the permission engine layer.
PROJECT_ROLE_LEVELS = {
    "admin": 20,
    "contributor": 15,
    "commenter": 5,  # role_ref distinguishes
    "guest": 5,
}

WORKSPACE_ROLE_LEVELS = {
    "owner": 20,
    "admin": 20,
    "member": 15,
    "guest": 5,
}


@dataclass
class RoleMatrix:
    workspace: Workspace
    project: Project
    users: dict[str, User]  # slug -> User
    clients: dict[str, APIClient]  # slug -> authenticated APIClient
    issue: Issue  # one issue in the project, owned by ws_owner


def _mk_user(prefix: str) -> User:
    uid = uuid4().hex[:8]
    user = User.objects.create(
        email=f"{prefix}-{uid}@role.test",
        username=f"{prefix}_{uid}",
        first_name=prefix.title(),
        last_name="User",
    )
    user.set_password("testpass")
    user.save(update_fields=["password"])
    return user


def _api_key_client(user: User) -> APIClient:
    """API client authenticated via X-API-Key, matching external API auth."""
    token = APIToken.objects.create(
        user=user,
        label=f"role-matrix-{uuid4().hex[:6]}",
        token=f"test-{uuid4().hex}",
    )
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _project_role(workspace: Workspace, slug: str) -> Role | None:
    """Look up the Role row for a project namespace slug, if it exists."""
    return Role.objects.filter(
        workspace=workspace,
        namespace="project",
        slug=slug,
    ).first()


def _workspace_role(workspace: Workspace, slug: str) -> Role | None:
    return Role.objects.filter(
        workspace=workspace,
        namespace="workspace",
        slug=slug,
    ).first()


@pytest.fixture
def role_matrix(db) -> RoleMatrix:
    """Build workspace/project with members at every role + an outsider.

    The workspace owner is created first; the workspace's post_create signal
    materializes per-workspace Role rows (admin/member/guest at workspace
    namespace; admin/contributor/commenter/guest at project namespace).
    Members are then created with role_ref set to the appropriate Role.
    """
    owner = _mk_user("ws_owner")
    workspace = Workspace.objects.create(
        name="Role Matrix Test",
        slug=f"role-matrix-{uuid4().hex[:8]}",
        owner=owner,
    )

    users: dict[str, User] = {"ws_owner": owner}
    for slug in (
        "ws_admin",
        "ws_member",
        "ws_guest",
        "proj_admin",
        "proj_contributor",
        "proj_commenter",
        "proj_guest",
        "outsider",
    ):
        users[slug] = _mk_user(slug)

    # Workspace memberships (with role_ref)
    WorkspaceMember.objects.create(
        workspace=workspace,
        member=owner,
        role=20,
        role_ref=_workspace_role(workspace, "admin"),
        is_active=True,
    )
    WorkspaceMember.objects.create(
        workspace=workspace,
        member=users["ws_admin"],
        role=20,
        role_ref=_workspace_role(workspace, "admin"),
        is_active=True,
    )
    WorkspaceMember.objects.create(
        workspace=workspace,
        member=users["ws_member"],
        role=15,
        role_ref=_workspace_role(workspace, "member"),
        is_active=True,
    )
    WorkspaceMember.objects.create(
        workspace=workspace,
        member=users["ws_guest"],
        role=5,
        role_ref=_workspace_role(workspace, "guest"),
        is_active=True,
    )
    # Project members must also be workspace members
    for slug in ("proj_admin", "proj_contributor", "proj_commenter", "proj_guest"):
        WorkspaceMember.objects.create(
            workspace=workspace,
            member=users[slug],
            role=15,
            role_ref=_workspace_role(workspace, "member"),
            is_active=True,
        )
    # outsider intentionally has no workspace membership

    project = Project.objects.create(
        name="Role Matrix Project",
        identifier=f"RM{uuid4().hex[:4].upper()}",
        workspace=workspace,
        network=2,
        created_by=owner,
    )

    # Project memberships (with role_ref distinguishing commenter from guest)
    ProjectMember.objects.create(
        project=project,
        workspace=workspace,
        member=users["proj_admin"],
        role=20,
        role_ref=_project_role(workspace, "admin"),
        is_active=True,
    )
    ProjectMember.objects.create(
        project=project,
        workspace=workspace,
        member=users["proj_contributor"],
        role=15,
        role_ref=_project_role(workspace, "contributor"),
        is_active=True,
    )
    ProjectMember.objects.create(
        project=project,
        workspace=workspace,
        member=users["proj_commenter"],
        role=5,
        role_ref=_project_role(workspace, "commenter"),
        is_active=True,
    )
    ProjectMember.objects.create(
        project=project,
        workspace=workspace,
        member=users["proj_guest"],
        role=5,
        role_ref=_project_role(workspace, "guest"),
        is_active=True,
    )

    clients = {slug: _api_key_client(user) for slug, user in users.items()}

    # Default state + one issue so endpoints that resolve issue_id chains pass
    state = State.objects.create(
        project=project,
        workspace=workspace,
        name="Backlog",
        group="backlog",
        default=True,
        created_by=owner,
    )
    issue = Issue.objects.create(
        project=project,
        workspace=workspace,
        state=state,
        name="Role Matrix Issue",
        created_by=owner,
    )

    return RoleMatrix(
        workspace=workspace,
        project=project,
        users=users,
        clients=clients,
        issue=issue,
    )


@pytest.fixture(autouse=True)
def _enable_feature_flags():
    """Make every @check_feature_flag(...) decorator pass through.

    The decorator calls FlagProvider().make_request() under the hood;
    patching it to return True ensures we exercise the @can permission
    decision (not the license/feature-flag layer) in role-matrix tests.
    """
    with patch(
        "plane.payment.flags.provider.FlagProvider.make_request",
        return_value=True,
    ):
        yield


# Standard role list used by parametrize. Tests assert per-role expected status.
ALL_ROLES = (
    "ws_owner",
    "ws_admin",
    "ws_member",
    "ws_guest",
    "proj_admin",
    "proj_contributor",
    "proj_commenter",
    "proj_guest",
    "outsider",
)
