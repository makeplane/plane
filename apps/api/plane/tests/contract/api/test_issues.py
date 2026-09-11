# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the requesting user as an active member."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin
        is_active=True,
    )
    return project


@pytest.fixture
def state(db, workspace, project):
    return State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
    )


@pytest.fixture
def issue(db, workspace, project, state, create_user):
    return Issue.objects.create(
        name="Test Issue",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )


@pytest.mark.contract
class TestIssueListOrderByInjection:
    """Regression tests for GHSA-p885-6jpg-cr2p on the work-item list
    endpoint: GET /api/v1/workspaces/{slug}/projects/{project_id}/issues/.

    The raw ``order_by`` query parameter fell through the endpoint's hardcoded
    branch logic to ``issue_queryset.order_by(order_by_param)``, letting an
    attacker order by sensitive related columns (blind oracle) or crash the
    endpoint with an unknown field (HTTP 500). The fix sanitizes the parameter
    against ISSUE_ORDER_BY_ALLOWLIST before the branch logic runs.
    """

    def get_url(self, workspace_slug, project_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/"

    @pytest.mark.django_db
    def test_invalid_order_by_does_not_500(self, api_key_client, workspace, project, issue):
        """Unknown field used to raise FieldError → HTTP 500; now sanitized to
        the safe default and returns 200 (DoS half of the advisory)."""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"order_by": "not_a_field"})

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_relational_order_by_injection_does_not_500(self, api_key_client, workspace, project, issue):
        """Ordering by a related-table column (``created_by__password``) used to
        reach ``.order_by()`` raw, forming a blind ordering oracle. It is now
        neutralized to the safe default. (Deterministic neutralization is
        asserted in tests/unit/utils/test_order_by_sanitize.py.)"""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"order_by": "created_by__password"})

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_legitimate_order_by_still_works(self, api_key_client, workspace, project, issue):
        """A valid, allowlisted ordering value continues to return 200 —
        the sanitizer must not break legitimate ordering."""
        url = self.get_url(workspace.slug, project.id)

        for value in ["-created_at", "priority", "state__group", "sequence_id"]:
            response = api_key_client.get(url, {"order_by": value})
            assert response.status_code == status.HTTP_200_OK, (
                f"order_by={value!r} got {response.status_code}: {response.data!r}"
            )


@pytest.mark.contract
class TestIssueListPerPageValidation:
    """Regression tests for the work-item list endpoint's ``per_page`` handling:
    GET /api/v1/workspaces/{slug}/projects/{project_id}/issues/.

    Non-numeric and oversized values already returned a clear 400, but zero and
    negative values fell through validation and crashed downstream with a 500.
    They should return a 400 like the other invalid cases.
    """

    def get_url(self, workspace_slug, project_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/"

    @pytest.mark.django_db
    @pytest.mark.parametrize("per_page", ["0", "-5"])
    def test_non_positive_per_page_returns_400(self, api_key_client, workspace, project, issue, per_page):
        """``per_page=0`` and negative values used to raise a 500; now a 400."""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"per_page": per_page})

        assert response.status_code == status.HTTP_400_BAD_REQUEST, (
            f"per_page={per_page!r} got {response.status_code}: {response.data!r}"
        )
        assert "positive integer" in str(response.data).lower()

    @pytest.mark.django_db
    def test_non_numeric_per_page_returns_400(self, api_key_client, workspace, project, issue):
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"per_page": "abc"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_oversized_per_page_returns_400(self, api_key_client, workspace, project, issue):
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"per_page": "100000"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_valid_per_page_still_works(self, api_key_client, workspace, project, issue):
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"per_page": "50"})

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
