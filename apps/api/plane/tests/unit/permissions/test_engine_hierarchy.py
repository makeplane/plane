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
Tests for hierarchy traversal, IDOR protection, single-query optimization,
and bridge model support.
"""

import pytest

from django.test.utils import CaptureQueriesContext
from django.db import connection
from rest_framework.exceptions import PermissionDenied

from plane.permissions.context import PermissionContext
from plane.permissions.inheritance import build_chain_config
from plane.permissions.definitions import (
    WorkitemPermissions,
    CommentPermissions,
    ProjectPermissions,
)


@pytest.mark.django_db
class TestHierarchyTraversal:
    """Test that permissions inherit down the resource hierarchy."""

    def test_workspace_admin_can_access_project_issues(
        self, engine, perm_project, perm_workspace, admin_user, ws_admin_member
    ):
        """Workspace admin (with project:* bypass) can view issues in any project."""
        result = engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

    def test_workspace_owner_can_manage_projects(
        self, engine, perm_project, perm_workspace, owner_user
    ):
        """Workspace owner (with '*' wildcard) can manage any project."""
        result = engine.check(
            user=owner_user,
            permission=ProjectPermissions.MANAGE,
            resource_id=perm_project.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is True

    def test_comment_inherits_from_project_tuple(
        self, engine, test_comment, perm_workspace, admin_user, project_admin
    ):
        """User with project tuple can access comment on issue in that project."""
        result = engine.check(
            user=admin_user,
            permission=CommentPermissions.EDIT,
            resource_id=test_comment.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is True

    def test_hierarchy_chain_workspace_project_issue(
        self, engine, test_issue, perm_workspace
    ):
        """Verify hierarchy chain: issue -> project -> workspace."""
        chain = engine._build_hierarchy_chain(
            "workitem", test_issue.id, perm_workspace.id
        )
        types = [t for t, _ in chain]
        assert types == ["workitem", "project", "workspace"]

    def test_hierarchy_chain_comment(
        self, engine, test_comment, perm_workspace
    ):
        """Verify hierarchy chain: comment -> workitem -> project -> workspace."""
        chain = engine._build_hierarchy_chain(
            "comment", test_comment.id, perm_workspace.id
        )
        types = [t for t, _ in chain]
        assert types == ["comment", "workitem", "project", "workspace"]

    def test_hierarchy_stops_at_workspace(self, engine, perm_workspace):
        """Workspace has no parent, chain is just [workspace]."""
        chain = engine._build_hierarchy_chain(
            "workspace", perm_workspace.id, perm_workspace.id
        )
        assert len(chain) == 1
        assert chain[0][0] == "workspace"

    def test_project_contributor_can_view_issues(
        self, engine, test_issue, perm_workspace, member_user, project_contributor
    ):
        """User with project contributor role can view issues via hierarchy."""
        result = engine.check(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            resource_id=test_issue.id,
            workspace_id=perm_workspace.id,
        )
        assert result.allowed is True


@pytest.mark.django_db
class TestIDORProtection:
    """Test that IDOR (Insecure Direct Object Reference) attacks are prevented."""

    def test_idor_workspace_mismatch_raises_403(
        self, engine, test_issue, other_workspace, perm_workspace
    ):
        """Issue in workspace A, URL says workspace B -> PermissionDenied."""
        with pytest.raises(PermissionDenied, match="workspace"):
            engine._build_hierarchy_chain(
                "workitem",
                test_issue.id,
                other_workspace.id,  # Wrong workspace
            )

    def test_idor_project_mismatch_raises_403(
        self, engine, test_issue, perm_workspace, other_project
    ):
        """Issue in project A, URL says project B -> PermissionDenied."""
        with pytest.raises(PermissionDenied, match="project"):
            engine._build_hierarchy_chain(
                "workitem",
                test_issue.id,
                perm_workspace.id,
                project_id=other_project.id,  # Wrong project
            )

    def test_idor_check_denies_cross_workspace(
        self, engine, test_issue, other_workspace, admin_user, ws_admin_member
    ):
        """Full check() with wrong workspace_id raises PermissionDenied."""
        with pytest.raises(PermissionDenied):
            engine.check(
                user=admin_user,
                permission=WorkitemPermissions.VIEW,
                resource_id=test_issue.id,
                workspace_id=other_workspace.id,
            )


@pytest.mark.django_db
class TestSingleQueryHierarchy:
    """Test single-query hierarchy chain optimization."""

    def test_single_query_chain_comment(self, engine, test_comment, perm_workspace):
        """Comment chain (comment→workitem→project→workspace) uses 1 hierarchy query."""
        # Warm up any lazy imports / caches
        engine._build_hierarchy_chain("comment", test_comment.id, perm_workspace.id)

        with CaptureQueriesContext(connection) as ctx:
            chain = engine._build_hierarchy_chain("comment", test_comment.id, perm_workspace.id)

        types = [t for t, _ in chain]
        assert types == ["comment", "workitem", "project", "workspace"]
        # Single query for the entire hierarchy
        assert len(ctx) == 1, f"Expected 1 query, got {len(ctx)}: {[q['sql'] for q in ctx]}"

    def test_single_query_chain_workitem(self, engine, test_issue, perm_workspace):
        """Workitem chain (workitem→project→workspace) uses 1 hierarchy query."""
        # Warm up
        engine._build_hierarchy_chain("workitem", test_issue.id, perm_workspace.id)

        with CaptureQueriesContext(connection) as ctx:
            chain = engine._build_hierarchy_chain("workitem", test_issue.id, perm_workspace.id)

        types = [t for t, _ in chain]
        assert types == ["workitem", "project", "workspace"]
        assert len(ctx) == 1, f"Expected 1 query, got {len(ctx)}: {[q['sql'] for q in ctx]}"

    def test_single_query_batch_chains(
        self, engine, test_issue, perm_workspace, perm_project, member_user, default_state
    ):
        """Batch chains for multiple workitems use 1 query."""
        from crum import impersonate
        from plane.db.models import Issue

        with impersonate(member_user):
            issue2 = Issue.objects.create(
                project=perm_project,
                workspace=perm_workspace,
                name="Test Issue 2",
                state=default_state,
            )

        ids = [test_issue.id, issue2.id]

        # Warm up
        engine._batch_build_hierarchy_chains("workitem", ids, perm_workspace.id)

        with CaptureQueriesContext(connection) as ctx:
            chains = engine._batch_build_hierarchy_chains("workitem", ids, perm_workspace.id)

        assert len(chains) == 2
        for rid in ids:
            types = [t for t, _ in chains[rid]]
            assert types == ["workitem", "project", "workspace"]
        assert len(ctx) == 1, f"Expected 1 query, got {len(ctx)}: {[q['sql'] for q in ctx]}"


@pytest.mark.django_db
class TestBuildChainConfig:
    """Test build_chain_config() for correctness and caching."""

    @pytest.fixture(autouse=True)
    def clear_chain_cache(self):
        build_chain_config.cache_clear()

    def test_config_comment(self):
        """Comment has 3-level chain: workitem, project, workspace."""
        config = build_chain_config("comment")
        assert config is not None
        chain = config["chain"]
        fields = config["fields"]
        assert len(chain) == 3
        # Check types
        assert chain[0][0] == "workitem"
        assert chain[1][0] == "project"
        assert chain[2][0] == "workspace"
        # Check direct field names (not ORM join paths)
        assert chain[0][1] == "issue_id"
        assert chain[1][1] == "project_id"
        assert chain[2][1] == "workspace_id"
        # Check validation types
        assert chain[0][2] is None
        assert chain[1][2] == "project"
        assert chain[2][2] == "workspace"
        # Check fields tuple
        assert fields == ("issue_id", "project_id", "workspace_id")

    def test_config_workitem(self):
        """Workitem has 2-level chain: project, workspace."""
        config = build_chain_config("workitem")
        assert config is not None
        chain = config["chain"]
        assert len(chain) == 2
        assert chain[0] == ("project", "project_id", "project")
        assert chain[1] == ("workspace", "workspace_id", "workspace")
        assert config["fields"] == ("project_id", "workspace_id")

    def test_config_workspace(self):
        """Workspace (root) returns empty chain."""
        config = build_chain_config("workspace")
        assert config is not None
        assert config["chain"] == ()
        assert config["fields"] == ()

    def test_config_page_returns_none(self):
        """Page (bridge type) returns None — must use iterative fallback."""
        config = build_chain_config("page")
        assert config is None

    def test_config_teamspace_page_returns_none(self):
        """Teamspace page (bridge type) returns None."""
        config = build_chain_config("teamspace_page")
        assert config is None

    def test_config_teamspace_comment_has_direct_chain(self):
        """Teamspace comment has direct FK chain (no bridge)."""
        config = build_chain_config("teamspace_comment")
        assert config is not None
        chain = config["chain"]
        assert len(chain) == 2
        assert chain[0][0] == "teamspace"
        assert chain[0][1] == "team_space_id"
        assert chain[1][0] == "workspace"
        assert chain[1][1] == "workspace_id"

    def test_config_cached(self):
        """lru_cache returns same object on repeated calls."""
        config1 = build_chain_config("comment")
        config2 = build_chain_config("comment")
        assert config1 is config2


@pytest.mark.django_db
class TestBridgeModelSupport:
    """Test bridge table support for page, teamspace_page, teamspace_workitem_view."""

    def test_bridge_lookup_page(self, engine, perm_workspace, perm_project, owner_user):
        """_get_parent_id for 'page' type uses ProjectPage bridge."""
        from crum import impersonate
        from plane.db.models import Page, ProjectPage

        with impersonate(owner_user):
            page = Page.objects.create(
                name="Test Page",
                workspace=perm_workspace,
                owned_by=owner_user,
            )
            ProjectPage.objects.create(
                project=perm_project,
                page=page,
                workspace=perm_workspace,
            )

        parent_id = engine._get_parent_id("page", page.id, "project_id")
        assert parent_id == perm_project.id

    def test_iterative_fallback_for_bridge_type(self, engine, perm_workspace, perm_project, owner_user):
        """_build_hierarchy_chain falls back to iterative for bridge types."""
        from crum import impersonate
        from plane.db.models import Page, ProjectPage

        with impersonate(owner_user):
            page = Page.objects.create(
                name="Test Page 2",
                workspace=perm_workspace,
                owned_by=owner_user,
            )
            ProjectPage.objects.create(
                project=perm_project,
                page=page,
                workspace=perm_workspace,
            )

        chain = engine._build_hierarchy_chain("page", page.id, perm_workspace.id)
        types = [t for t, _ in chain]
        assert types == ["page", "project", "workspace"]
