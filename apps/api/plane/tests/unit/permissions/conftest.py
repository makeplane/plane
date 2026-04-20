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

"""
Permission-specific test fixtures.

Key: WorkspaceMember.objects.create() and ProjectMember.objects.create() auto-sync
to ResourcePermission via PermissionSyncMixin, so fixtures don't need to manually
create permission tuples.
"""

import pytest
from uuid import uuid4

from crum import impersonate

from plane.db.models import (
    User,
    Workspace,
    WorkspaceMember,
    Project,
    ProjectMember,
    Issue,
    IssueComment,
    State,
)
from plane.ee.models import Teamspace, TeamspaceMember, TeamspaceProject
from plane.permissions.engine import PermissionEngine


# ---------------------------------------------------------------------------
# Helper to create unique users
# ---------------------------------------------------------------------------
def _make_user(email_prefix="user"):
    uid = uuid4().hex[:8]
    user = User.objects.create(
        email=f"{email_prefix}-{uid}@test.plane.so",
        username=f"{email_prefix}_{uid}",
        first_name=email_prefix.title(),
        last_name="Test",
    )
    user.set_password("testpass123")
    user.save(update_fields=["password"])
    return user


# ---------------------------------------------------------------------------
# Users with different roles
# ---------------------------------------------------------------------------
@pytest.fixture
def owner_user(db):
    """User who will be workspace owner."""
    return _make_user("owner")


@pytest.fixture
def admin_user(db):
    """User who will be workspace admin."""
    return _make_user("admin")


@pytest.fixture
def member_user(db):
    """User who will be workspace member / project contributor."""
    return _make_user("member")


@pytest.fixture
def guest_user(db):
    """User who will be workspace/project guest."""
    return _make_user("guest")


@pytest.fixture
def commenter_user(db):
    """User who will be project commenter."""
    return _make_user("commenter")


@pytest.fixture
def outsider_user(db):
    """User with no membership anywhere — should always be denied."""
    return _make_user("outsider")


# ---------------------------------------------------------------------------
# Workspace + members at all role levels
# ---------------------------------------------------------------------------
@pytest.fixture
def perm_workspace(db, owner_user):
    """Workspace with owner FK set. On Business/Enterprise plans, owner_user gets 'owner' relation."""
    ws = Workspace.objects.create(
        name="Perm Test Workspace",
        slug=f"perm-test-{uuid4().hex[:8]}",
        owner=owner_user,
    )
    # Create workspace member for owner (role=20)
    # On Business/Enterprise, _get_permission_relation checks Workspace.owner FK
    WorkspaceMember.objects.create(
        workspace=ws,
        member=owner_user,
        role=20,
        is_active=True,
    )
    return ws


@pytest.fixture
def ws_admin_member(db, perm_workspace, admin_user):
    """WorkspaceMember with role=20 (maps to admin, not owner, on Business/Enterprise)."""
    return WorkspaceMember.objects.create(
        workspace=perm_workspace,
        member=admin_user,
        role=20,
        is_active=True,
    )


@pytest.fixture
def ws_owner_member(db, perm_workspace, owner_user):
    """Workspace owner with role_ref pointing to the owner system role."""
    from plane.db.models.permission import Role

    owner_role = Role.objects.filter(
        workspace=perm_workspace,
        namespace="workspace",
        slug="owner",
        is_system=True,
        deleted_at__isnull=True,
    ).first()
    member = WorkspaceMember.objects.filter(
        workspace=perm_workspace, member=owner_user
    ).first()
    if member:
        # Use updated_by_id so the management authority guard can
        # identify the actor.  The owner is bootstrapping their own
        # role, so set them as the actor.
        member.role = 25
        member.role_ref = owner_role
        member.updated_by_id = owner_user.id
        member.save()
        return member
    return WorkspaceMember.objects.create(
        workspace=perm_workspace,
        member=owner_user,
        role=25,
        role_ref=owner_role,
        is_active=True,
    )


@pytest.fixture
def ws_member(db, perm_workspace, member_user):
    """WorkspaceMember with role=15 (member)."""
    return WorkspaceMember.objects.create(
        workspace=perm_workspace,
        member=member_user,
        role=15,
        is_active=True,
    )


@pytest.fixture
def ws_guest(db, perm_workspace, guest_user):
    """WorkspaceMember with role=5 (guest)."""
    return WorkspaceMember.objects.create(
        workspace=perm_workspace,
        member=guest_user,
        role=5,
        is_active=True,
    )


# ---------------------------------------------------------------------------
# Project + members at all project roles
# ---------------------------------------------------------------------------
@pytest.fixture
def perm_project(db, perm_workspace, owner_user):
    """Project inside perm_workspace."""
    with impersonate(owner_user):
        return Project.objects.create(
            name="Perm Test Project",
            identifier=f"PT{uuid4().hex[:4].upper()}",
            workspace=perm_workspace,
            network=2,  # SECRET
        )


@pytest.fixture
def project_admin(db, perm_project, admin_user, ws_admin_member):
    """ProjectMember with role=20 (admin)."""
    return ProjectMember.objects.create(
        project=perm_project,
        workspace=perm_project.workspace,
        member=admin_user,
        role=20,
        is_active=True,
    )


@pytest.fixture
def project_contributor(db, perm_project, member_user, ws_member):
    """ProjectMember with role=15 (contributor)."""
    return ProjectMember.objects.create(
        project=perm_project,
        workspace=perm_project.workspace,
        member=member_user,
        role=15,
        is_active=True,
    )


@pytest.fixture
def project_commenter(db, perm_project, commenter_user, perm_workspace):
    """ProjectMember with role=10 (commenter)."""
    # Commenter needs workspace membership first
    WorkspaceMember.objects.create(
        workspace=perm_workspace,
        member=commenter_user,
        role=15,
        is_active=True,
    )
    return ProjectMember.objects.create(
        project=perm_project,
        workspace=perm_project.workspace,
        member=commenter_user,
        role=10,
        is_active=True,
    )


@pytest.fixture
def project_guest(db, perm_project, guest_user, ws_guest):
    """ProjectMember with role=5 (guest)."""
    return ProjectMember.objects.create(
        project=perm_project,
        workspace=perm_project.workspace,
        member=guest_user,
        role=5,
        is_active=True,
    )


# ---------------------------------------------------------------------------
# Resources (issue, comment, state)
# ---------------------------------------------------------------------------
@pytest.fixture
def default_state(db, perm_project, owner_user):
    """Default state for the project."""
    with impersonate(owner_user):
        return State.objects.create(
            project=perm_project,
            workspace=perm_project.workspace,
            name="Backlog",
            group="backlog",
            default=True,
        )


@pytest.fixture
def test_issue(db, perm_project, member_user, default_state):
    """Issue created by member_user in perm_project."""
    with impersonate(member_user):
        return Issue.objects.create(
            project=perm_project,
            workspace=perm_project.workspace,
            name="Test Issue",
            state=default_state,
        )


@pytest.fixture
def test_comment(db, test_issue, member_user):
    """Comment on test_issue by member_user."""
    with impersonate(member_user):
        return IssueComment.objects.create(
            issue=test_issue,
            project=test_issue.project,
            workspace=test_issue.workspace,
            actor=member_user,
            comment_html="<p>Test comment</p>",
        )


# ---------------------------------------------------------------------------
# Teamspace with linked project (for link relation tests)
# ---------------------------------------------------------------------------
@pytest.fixture
def perm_teamspace(db, perm_workspace, owner_user):
    """A teamspace in perm_workspace."""
    with impersonate(owner_user):
        return Teamspace.objects.create(
            name="Perm Test Teamspace",
            workspace=perm_workspace,
            lead=owner_user,
        )


@pytest.fixture
def teamspace_member_fixture(db, perm_teamspace, member_user, ws_member, perm_workspace):
    """TeamspaceMember: member_user is a member of the teamspace."""
    with impersonate(member_user):
        return TeamspaceMember.objects.create(
            workspace=perm_workspace,
            team_space=perm_teamspace,
            member=member_user,
        )


@pytest.fixture
def teamspace_project_link(db, perm_teamspace, perm_project, perm_workspace, owner_user):
    """
    Link teamspace to project with contributor-level access.
    This creates a ResourcePermission tuple:
    (subject_type=teamspace, subject_id=teamspace_id, resource_type=project,
     resource_id=project_id, relation=contributor)
    """
    with impersonate(owner_user):
        return TeamspaceProject.objects.create(
            workspace=perm_workspace,
            team_space=perm_teamspace,
            project=perm_project,
        )


# ---------------------------------------------------------------------------
# Permission engine instances
# ---------------------------------------------------------------------------
@pytest.fixture
def engine():
    """PermissionEngine with cache disabled for deterministic tests."""
    return PermissionEngine(use_cache=False)


@pytest.fixture
def cached_engine():
    """PermissionEngine with cache enabled for cache tests."""
    return PermissionEngine(use_cache=True)


# ---------------------------------------------------------------------------
# Workspace in a different context (for IDOR tests)
# ---------------------------------------------------------------------------
@pytest.fixture
def other_workspace(db, owner_user):
    """A different workspace for IDOR / cross-workspace tests."""
    ws = Workspace.objects.create(
        name="Other Workspace",
        slug=f"other-ws-{uuid4().hex[:8]}",
        owner=owner_user,
    )
    return ws


@pytest.fixture
def other_project(db, other_workspace, owner_user):
    """A project in other_workspace for cross-project tests."""
    with impersonate(owner_user):
        return Project.objects.create(
            name="Other Project",
            identifier=f"OP{uuid4().hex[:4].upper()}",
            workspace=other_workspace,
            network=2,
        )
