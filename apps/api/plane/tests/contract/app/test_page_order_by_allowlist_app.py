# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for page order_by ORM injection (WEB-8110).

PageViewSet.get_queryset passed the raw order_by query param into .order_by(),
which resolves field names at call time — an unknown field raised FieldError
(500 DoS) and a relation path (e.g. owned_by__password) enabled ORM relational
traversal. The param is now sanitized against PAGE_ORDER_BY_ALLOWLIST.
"""

import pytest
from rest_framework import status

from plane.db.models import Page, Project, ProjectMember, ProjectPage


@pytest.fixture
def project_with_page(db, workspace, create_user):
    project = Project.objects.create(name="P", identifier="PRD", workspace=workspace)
    ProjectMember.objects.create(
        workspace=workspace, project=project, member=create_user, role=20, is_active=True
    )
    page = Page.objects.create(workspace=workspace, owned_by=create_user, access=Page.PUBLIC_ACCESS, name="pg")
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return project, page


def _pages_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/pages/"


@pytest.mark.contract
class TestPageOrderByAllowlist:
    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "order_by",
        [
            "password",            # invalid field → FieldError (500) pre-fix
            "bogus__field__x",     # invalid relation path → FieldError (500) pre-fix
            "owned_by__password",  # valid relation path → ORM traversal pre-fix
        ],
    )
    def test_malicious_order_by_is_rejected(self, session_client, workspace, project_with_page, order_by):
        project, _ = project_with_page

        response = session_client.get(_pages_url(workspace.slug, project.id), {"order_by": order_by})

        # Sanitized to the safe default — no 500, no traversal.
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    @pytest.mark.parametrize("order_by", ["name", "-name", "created_at", "-created_at", "updated_at", "sort_order"])
    def test_allowlisted_order_by_is_accepted(self, session_client, workspace, project_with_page, order_by):
        project, _ = project_with_page

        response = session_client.get(_pages_url(workspace.slug, project.id), {"order_by": order_by})

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_no_order_by_param_defaults_ok(self, session_client, workspace, project_with_page):
        project, _ = project_with_page

        response = session_client.get(_pages_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_allowlisted_order_by_actually_orders_results(self, session_client, workspace, create_user):
        """An allowlisted order_by must actually affect the result ordering —
        guards against the param being silently overridden by a later
        .order_by() call."""
        project = Project.objects.create(name="P2", identifier="ORD", workspace=workspace)
        ProjectMember.objects.create(
            workspace=workspace, project=project, member=create_user, role=20, is_active=True
        )
        # Non-favorite public pages so the favourite-first primary sort is a
        # no-op and the secondary (name) ordering is observable.
        for name in ("Gamma", "Alpha", "Beta"):
            page = Page.objects.create(
                workspace=workspace, owned_by=create_user, access=Page.PUBLIC_ACCESS, name=name
            )
            ProjectPage.objects.create(workspace=workspace, project=project, page=page)

        asc = session_client.get(_pages_url(workspace.slug, project.id), {"order_by": "name"})
        desc = session_client.get(_pages_url(workspace.slug, project.id), {"order_by": "-name"})

        assert asc.status_code == status.HTTP_200_OK
        assert [p["name"] for p in asc.json()] == ["Alpha", "Beta", "Gamma"]
        assert [p["name"] for p in desc.json()] == ["Gamma", "Beta", "Alpha"]
