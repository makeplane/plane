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
Integration tests for the @can decorator.

Exercises the full DRF lifecycle: @can → engine.check → resolution → response,
using stub ViewSets dispatched via APIRequestFactory. No URL conf changes needed.
"""

import pytest

from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, force_authenticate

from plane.app.views.base import BaseViewSet
from plane.db.models import Issue
from plane.permissions import WorkitemPermissions, can, get_permission_conditions


# ---------------------------------------------------------------------------
# Stub ViewSets (test-only, not registered in any URL conf)
# ---------------------------------------------------------------------------


class StubWorkitemViewSet(BaseViewSet):
    model = Issue

    @can(WorkitemPermissions.VIEW, resource_param="project_id")
    def list(self, request, *args, **kwargs):
        return Response({"ok": True})

    @can(WorkitemPermissions.VIEW, resource_param="pk")
    def retrieve(self, request, *args, **kwargs):
        return Response({"ok": True})

    @can(WorkitemPermissions.CREATE, resource_param="project_id")
    def create(self, request, *args, **kwargs):
        return Response({"ok": True})

    @can(WorkitemPermissions.DELETE, resource_param="project_id", defer_conditions=True)
    def destroy(self, request, *args, **kwargs):
        # Intentionally does NOT consume conditions
        return Response({"ok": True})


class StubDeferConsumeViewSet(BaseViewSet):
    model = Issue

    @can(WorkitemPermissions.DELETE, resource_param="project_id", defer_conditions=True)
    def destroy(self, request, *args, **kwargs):
        conditions = get_permission_conditions(request)
        return Response({"ok": True, "conditions": list(conditions)})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_request(factory, method, user, workspace):
    """Create an authenticated DRF request with workspace_id set."""
    request = getattr(factory, method)("/fake/")
    request.workspace_id = str(workspace.id)
    if user is not None:
        force_authenticate(request, user=user)
    return request


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestCanDecoratorIntegration:
    """Integration tests for @can decorator → engine → response pipeline."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.factory = APIRequestFactory()

    # 1. Admin allowed (project scope)
    def test_admin_allowed_list(
        self, admin_user, perm_workspace, perm_project, project_admin
    ):
        request = _build_request(self.factory, "get", admin_user, perm_workspace)
        view = StubWorkitemViewSet.as_view({"get": "list"})
        response = view(
            request,
            slug=perm_workspace.slug,
            project_id=str(perm_project.id),
        )
        assert response.status_code == 200
        assert response.data == {"ok": True}

    # 2. Outsider denied (no membership)
    def test_outsider_denied_list(
        self, outsider_user, perm_workspace, perm_project
    ):
        request = _build_request(self.factory, "get", outsider_user, perm_workspace)
        view = StubWorkitemViewSet.as_view({"get": "list"})
        response = view(
            request,
            slug=perm_workspace.slug,
            project_id=str(perm_project.id),
        )
        assert response.status_code == 403

    # 3. Guest denied for create (role boundary)
    def test_guest_denied_create(
        self, guest_user, perm_workspace, perm_project, project_guest
    ):
        request = _build_request(self.factory, "post", guest_user, perm_workspace)
        view = StubWorkitemViewSet.as_view({"post": "create"})
        response = view(
            request,
            slug=perm_workspace.slug,
            project_id=str(perm_project.id),
        )
        assert response.status_code == 403

    # 4. Contributor allowed (resource-level pk)
    def test_contributor_allowed_retrieve(
        self,
        member_user,
        perm_workspace,
        perm_project,
        project_contributor,
        test_issue,
    ):
        request = _build_request(self.factory, "get", member_user, perm_workspace)
        view = StubWorkitemViewSet.as_view({"get": "retrieve"})
        response = view(
            request,
            slug=perm_workspace.slug,
            project_id=str(perm_project.id),
            pk=str(test_issue.id),
        )
        assert response.status_code == 200
        assert response.data == {"ok": True}

    # 5. Deferred conditions consumed correctly
    def test_deferred_conditions_consumed(
        self,
        member_user,
        perm_workspace,
        perm_project,
        project_contributor,
    ):
        request = _build_request(self.factory, "delete", member_user, perm_workspace)
        view = StubDeferConsumeViewSet.as_view({"delete": "destroy"})
        response = view(
            request,
            slug=perm_workspace.slug,
            project_id=str(perm_project.id),
        )
        assert response.status_code == 200
        assert "creator" in response.data["conditions"]

    # 6. Deferred conditions NOT consumed → PermissionDenied from finalize_response
    def test_deferred_conditions_not_consumed(
        self,
        member_user,
        perm_workspace,
        perm_project,
        project_contributor,
    ):
        request = _build_request(self.factory, "delete", member_user, perm_workspace)
        view = StubWorkitemViewSet.as_view({"delete": "destroy"})
        response = view(
            request,
            slug=perm_workspace.slug,
            project_id=str(perm_project.id),
        )
        # finalize_response raises PermissionDenied for unconsumed conditions;
        # dispatch catches it via handle_exception and returns a 403 Response
        assert response.status_code == 403

    # 7. Anonymous user blocked before @can
    def test_anonymous_blocked(self, perm_workspace, perm_project):
        request = self.factory.get("/fake/")
        request.workspace_id = str(perm_workspace.id)
        # No force_authenticate — anonymous user
        view = StubWorkitemViewSet.as_view({"get": "list"})
        response = view(
            request,
            slug=perm_workspace.slug,
            project_id=str(perm_project.id),
        )
        # DRF returns 401 (NotAuthenticated) or 403 depending on auth config
        assert response.status_code in (401, 403)

    # 8. Commenter denied for create
    def test_commenter_denied_create(
        self,
        commenter_user,
        perm_workspace,
        perm_project,
        project_commenter,
    ):
        request = _build_request(self.factory, "post", commenter_user, perm_workspace)
        view = StubWorkitemViewSet.as_view({"post": "create"})
        response = view(
            request,
            slug=perm_workspace.slug,
            project_id=str(perm_project.id),
        )
        assert response.status_code == 403
