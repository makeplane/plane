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

"""Role-matrix contract tests for the external-API permission audit fixes.

Each test parametrizes over the full set of workspace + project roles plus
an outsider, asserting the @can decorator allows or denies as expected per
the grants in plane/permissions/permission_schemes.py. Coverage focuses on
endpoints that were newly migrated or had decorators added/changed in this
PR; pre-existing migrated endpoints already have their own tests.

Pattern: each endpoint gets one test method per HTTP verb, parametrized by
(role, expected_status). Tests do not exercise full business logic — they
verify the permission boundary only. Successful (allow) requests assert the
status code is NOT 403; we don't assert 200 specifically because some
endpoints return 404 (resource not found) when they reach the body without
the test fixture data, which still proves the permission gate passed.
"""

from unittest.mock import patch
from uuid import uuid4

import pytest
from django.urls import reverse


# Status codes:
#   200/201/204 = allowed (varies by endpoint)
#   403         = denied by @can / scope-membership
#   404         = allowed past @can but resource not found (also proves allow)
#   400         = allowed past @can but business validation failed (also proves allow)
ALLOWED = "ALLOWED"
DENIED = "DENIED"
FEATURE_FLAG_PATCH = "plane.payment.flags.flag_decorator.check_workspace_feature_flag"


def _is_permission_denial(response) -> bool:
    """True if the 403 came from @can / DRF PermissionDenied (vs inline 403)."""
    if response.status_code != 403:
        return False
    data = getattr(response, "data", None) or {}
    # DRF PermissionDenied → {"detail": "..."}.
    # Inline business 403s use {"error": "..."}, which we treat as ALLOWED-but-blocked.
    return "detail" in data


def _assert_response(response, expectation: str):
    """DENIED iff @can returned PermissionDenied; otherwise ALLOWED.

    ALLOWED tolerates non-403 responses AND 403s from inline business logic
    (feature flags, missing project setup, etc.) — those prove @can let the
    request through.
    """
    is_perm_denial = _is_permission_denial(response)
    if expectation == DENIED:
        assert is_perm_denial, (
            f"Expected @can permission denial (403 with 'detail'), "
            f"got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
    else:
        assert not is_perm_denial, f"Expected @can to allow, got permission denial: {getattr(response, 'data', None)!r}"


# ---------------------------------------------------------------------------
# Workflow endpoints (migrated in Phase D)
# ---------------------------------------------------------------------------
# WorkflowPermissions grants:
#   workspace owner/admin: wildcard (full)
#   project admin: wildcard (full)
#   project contributor/commenter/guest: VIEW only
#   workspace member/guest, outsider: no access (no project membership)


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkflowListCreateRoleMatrix:
    @pytest.mark.parametrize(
        "role,expected",
        [
            ("ws_owner", ALLOWED),
            ("ws_admin", ALLOWED),
            ("ws_member", DENIED),
            ("ws_guest", DENIED),
            ("proj_admin", ALLOWED),
            ("proj_contributor", ALLOWED),  # has WorkflowPermissions.VIEW
            ("proj_commenter", ALLOWED),
            ("proj_guest", ALLOWED),
            ("outsider", DENIED),
        ],
    )
    def test_get_role_matrix(self, role_matrix, role, expected):
        url = reverse(
            "project-workflows",
            kwargs={"slug": role_matrix.workspace.slug, "project_id": role_matrix.project.id},
        )
        with patch(FEATURE_FLAG_PATCH, return_value=True):
            response = role_matrix.clients[role].get(url)
        _assert_response(response, expected)

    @pytest.mark.parametrize(
        "role,expected",
        [
            ("ws_owner", ALLOWED),
            ("ws_admin", ALLOWED),
            ("ws_member", DENIED),
            ("ws_guest", DENIED),
            ("proj_admin", ALLOWED),
            ("proj_contributor", DENIED),  # CREATE not granted to contributor
            ("proj_commenter", DENIED),
            ("proj_guest", DENIED),
            ("outsider", DENIED),
        ],
    )
    def test_post_role_matrix(self, role_matrix, role, expected):
        url = reverse(
            "project-workflows",
            kwargs={"slug": role_matrix.workspace.slug, "project_id": role_matrix.project.id},
        )
        with patch(FEATURE_FLAG_PATCH, return_value=True):
            response = role_matrix.clients[role].post(url, {"name": "Test"}, format="json")
        _assert_response(response, expected)


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkflowDetailRoleMatrix:
    @pytest.mark.parametrize(
        "role,expected",
        [
            ("proj_admin", ALLOWED),
            ("proj_contributor", DENIED),  # PATCH = EDIT, contributor doesn't have it
            ("proj_commenter", DENIED),
            ("proj_guest", DENIED),
            ("outsider", DENIED),
        ],
    )
    def test_patch_role_matrix(self, role_matrix, role, expected):
        url = reverse(
            "project-workflow-detail",
            kwargs={
                "slug": role_matrix.workspace.slug,
                "project_id": role_matrix.project.id,
                "pk": uuid4(),
            },
        )
        with patch(FEATURE_FLAG_PATCH, return_value=True):
            response = role_matrix.clients[role].patch(url, {"name": "Updated"}, format="json")
        _assert_response(response, expected)

    @pytest.mark.parametrize(
        "role,expected",
        [
            ("proj_admin", ALLOWED),
            ("proj_contributor", DENIED),  # DELETE not granted
            ("proj_commenter", DENIED),
            ("proj_guest", DENIED),
            ("outsider", DENIED),
        ],
    )
    def test_delete_role_matrix(self, role_matrix, role, expected):
        url = reverse(
            "project-workflow-detail",
            kwargs={
                "slug": role_matrix.workspace.slug,
                "project_id": role_matrix.project.id,
                "pk": uuid4(),
            },
        )
        with patch(FEATURE_FLAG_PATCH, return_value=True):
            response = role_matrix.clients[role].delete(url)
        _assert_response(response, expected)


# ---------------------------------------------------------------------------
# IssueVoteAPIEndpoint (migrated in Phase E)
# ---------------------------------------------------------------------------
# WorkitemPermissions.REACT grants:
#   admin: wildcard
#   contributor, commenter: REACT
#   guest: no REACT
#   outsider: 403 (scope gate)


@pytest.mark.contract
@pytest.mark.django_db
class TestIssueVoteRoleMatrix:
    @pytest.mark.parametrize(
        "role,expected",
        [
            ("proj_admin", ALLOWED),
            ("proj_contributor", ALLOWED),
            ("proj_commenter", ALLOWED),
            ("proj_guest", DENIED),  # REACT not granted to guest
            ("outsider", DENIED),
        ],
    )
    def test_get_role_matrix(self, role_matrix, role, expected):
        # Direct path; "issue-vote" name conflicts with "work-item-vote" alias.
        url = (
            f"/api/v1/workspaces/{role_matrix.workspace.slug}"
            f"/projects/{role_matrix.project.id}/issues/{role_matrix.issue.id}/votes/"
        )
        response = role_matrix.clients[role].get(url)
        _assert_response(response, expected)

    @pytest.mark.parametrize(
        "role,expected",
        [
            ("proj_admin", ALLOWED),
            ("proj_contributor", ALLOWED),
            ("proj_commenter", ALLOWED),
            ("proj_guest", DENIED),
            ("outsider", DENIED),
        ],
    )
    def test_delete_role_matrix(self, role_matrix, role, expected):
        url = (
            f"/api/v1/workspaces/{role_matrix.workspace.slug}"
            f"/projects/{role_matrix.project.id}/issues/{role_matrix.issue.id}/votes/"
        )
        response = role_matrix.clients[role].delete(url)
        _assert_response(response, expected)


# ---------------------------------------------------------------------------
# WorkspaceMemberRemoveEndpoint (migrated in Phase E)
# ---------------------------------------------------------------------------
# WorkspaceMemberPermissions.REMOVE: workspace owner/admin only.


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceMemberRemoveRoleMatrix:
    @pytest.mark.parametrize(
        "role,expected",
        [
            ("ws_owner", ALLOWED),
            ("ws_admin", ALLOWED),
            ("ws_member", DENIED),
            ("ws_guest", DENIED),
            ("proj_admin", DENIED),  # not a workspace admin
            ("outsider", DENIED),
        ],
    )
    def test_post_role_matrix(self, role_matrix, role, expected):
        url = f"/api/v1/workspaces/{role_matrix.workspace.slug}/members/remove/"
        response = role_matrix.clients[role].post(url, {"email": "nonexistent@example.com"}, format="json")
        _assert_response(response, expected)


# ---------------------------------------------------------------------------
# ProjectSummaryAPIEndpoint (migrated in Phase E - changed from ws-admin to project-admin via MANAGE)
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectSummaryRoleMatrix:
    @pytest.mark.parametrize(
        "role,expected",
        [
            ("ws_owner", ALLOWED),  # workspace admin wildcards include PROJECT
            ("ws_admin", ALLOWED),
            ("proj_admin", ALLOWED),  # project admin has MANAGE
            ("proj_contributor", DENIED),  # contributor doesn't have MANAGE
            ("proj_commenter", DENIED),
            ("proj_guest", DENIED),
            ("outsider", DENIED),
        ],
    )
    def test_get_role_matrix(self, role_matrix, role, expected):
        url = reverse(
            "project-summary",
            kwargs={
                "slug": role_matrix.workspace.slug,
                "project_id": role_matrix.project.id,
            },
        )
        response = role_matrix.clients[role].get(url)
        _assert_response(response, expected)


# ---------------------------------------------------------------------------
# Workspace Work Item Type / Custom Property endpoints (migrated in Phase G)
# ---------------------------------------------------------------------------
# Grants added in Phase G.1:
#   workspace owner/admin: wildcard
#   workspace member: full CRUD
#   workspace guest: no access
#   outsider: 403


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceWorkItemTypeRoleMatrix:
    @pytest.mark.parametrize(
        "role,expected",
        [
            ("ws_owner", ALLOWED),
            ("ws_admin", ALLOWED),
            ("ws_member", ALLOWED),  # workspace member granted in Phase G.1
            ("ws_guest", DENIED),
            ("outsider", DENIED),
        ],
    )
    def test_list_get_role_matrix(self, role_matrix, role, expected):
        url = reverse(
            "workspace-work-item-type",
            kwargs={"slug": role_matrix.workspace.slug},
        )
        with patch(FEATURE_FLAG_PATCH, return_value=True):
            response = role_matrix.clients[role].get(url)
        _assert_response(response, expected)

    @pytest.mark.parametrize(
        "role,expected",
        [
            ("ws_owner", ALLOWED),
            ("ws_admin", ALLOWED),
            ("ws_member", ALLOWED),
            ("ws_guest", DENIED),
            ("outsider", DENIED),
        ],
    )
    def test_list_post_role_matrix(self, role_matrix, role, expected):
        url = reverse(
            "workspace-work-item-type",
            kwargs={"slug": role_matrix.workspace.slug},
        )
        with patch(FEATURE_FLAG_PATCH, return_value=True):
            response = role_matrix.clients[role].post(url, {"name": "Bug"}, format="json")
        _assert_response(response, expected)


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceWorkItemPropertyRoleMatrix:
    @pytest.mark.parametrize(
        "role,expected",
        [
            ("ws_owner", ALLOWED),
            ("ws_admin", ALLOWED),
            ("ws_member", ALLOWED),
            ("ws_guest", DENIED),
            ("outsider", DENIED),
        ],
    )
    def test_list_get_role_matrix(self, role_matrix, role, expected):
        url = reverse(
            "workspace-work-item-property",
            kwargs={"slug": role_matrix.workspace.slug},
        )
        with patch(FEATURE_FLAG_PATCH, return_value=True):
            response = role_matrix.clients[role].get(url)
        _assert_response(response, expected)


# ---------------------------------------------------------------------------
# Page list endpoints (Phase A — added @can decorator that was missing)
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectPageListRoleMatrix:
    @pytest.mark.parametrize(
        "role,expected",
        [
            ("proj_admin", ALLOWED),
            ("proj_contributor", ALLOWED),  # PagePermissions.VIEW granted
            ("proj_commenter", ALLOWED),
            ("proj_guest", ALLOWED),
            ("outsider", DENIED),
        ],
    )
    def test_get_role_matrix(self, role_matrix, role, expected):
        url = reverse(
            "project-pages",
            kwargs={
                "slug": role_matrix.workspace.slug,
                "project_id": role_matrix.project.id,
            },
        )
        response = role_matrix.clients[role].get(url)
        _assert_response(response, expected)


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspacePageListRoleMatrix:
    @pytest.mark.parametrize(
        "role,expected",
        [
            ("ws_owner", ALLOWED),
            ("ws_admin", ALLOWED),
            ("ws_member", ALLOWED),  # WikiPermissions.VIEW granted to workspace member
            ("ws_guest", DENIED),  # workspace guest has no WikiPermissions.VIEW
            ("outsider", DENIED),
        ],
    )
    def test_get_role_matrix(self, role_matrix, role, expected):
        url = reverse(
            "workspace-pages",
            kwargs={"slug": role_matrix.workspace.slug},
        )
        response = role_matrix.clients[role].get(url)
        _assert_response(response, expected)


# ---------------------------------------------------------------------------
# Epic endpoints — newly added @can on POST/PATCH/DELETE (Phase A) and
# EpicIssuesAPIEndpoint migration (Phase E)
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestEpicCreateRoleMatrix:
    @pytest.mark.parametrize(
        "role,expected",
        [
            ("proj_admin", ALLOWED),
            ("proj_contributor", ALLOWED),  # EpicPermissions.CREATE granted
            ("proj_commenter", DENIED),
            ("proj_guest", DENIED),
            ("outsider", DENIED),
        ],
    )
    def test_post_role_matrix(self, role_matrix, role, expected):
        url = reverse(
            "epic-list-create",
            kwargs={
                "slug": role_matrix.workspace.slug,
                "project_id": role_matrix.project.id,
            },
        )
        with patch(FEATURE_FLAG_PATCH, return_value=True):
            response = role_matrix.clients[role].post(url, {"name": "Test Epic"}, format="json")
        _assert_response(response, expected)


# NOTE: InitiativeLabelViewSet.destroy verb fix (Phase F EDIT → DELETE) is
# verified by code review; a dedicated role-matrix test would require
# instantiating an Initiative + InitiativeLabel + InitiativesFeatureFlag,
# which is out of scope for this audit-fix PR. The verb fix is mechanical
# (one literal change) and grant equivalence is asserted in unit tests on
# permission_schemes.
