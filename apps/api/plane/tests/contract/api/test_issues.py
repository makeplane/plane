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
class TestIssueByIdentifier:
    """GET /api/v1/workspaces/{slug}/issues/{project_identifier}-{issue_identifier}/

    A non-numeric ``issue_identifier`` (e.g. the tail of a UUID) used to reach
    ``sequence_id=<str>`` and raise ValueError (HTTP 500).
    """

    @pytest.mark.django_db
    def test_non_numeric_identifier_returns_404(self, api_key_client, workspace, project, issue):
        response = api_key_client.get(f"/api/v1/workspaces/{workspace.slug}/issues/{project.identifier}-5263003e54ee/")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_non_decimal_digit_returns_404(self, api_key_client, workspace, project):
        # "²".isdigit() is True but int("²") raises ValueError
        response = api_key_client.get(f"/api/v1/workspaces/{workspace.slug}/issues/{project.identifier}-²/")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_identifier_still_resolves(self, api_key_client, workspace, project, issue):
        response = api_key_client.get(
            f"/api/v1/workspaces/{workspace.slug}/issues/{project.identifier}-{issue.sequence_id}/"
        )

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(issue.id)


@pytest.mark.contract
class TestIssueListUnsupportedParams:
    """Regression tests for unsupported query parameters on the work-item list
    endpoint: GET /api/v1/workspaces/{slug}/projects/{project_id}/issues/.

    Previously, unknown parameters (like ?parent= or ?unknown=1) were silently
    ignored, returning all work items. The endpoint now returns a 400 with
    a list of the unsupported parameters.
    """

    def get_url(self, workspace_slug, project_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/"

    @pytest.mark.django_db
    def test_unknown_parameter_returns_400(self, api_key_client, workspace, project, issue):
        """An unknown query parameter should result in a 400 Bad Request."""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"any_unknown_param": "1"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "unsupported_parameters" in response.data
        assert "any_unknown_param" in response.data["unsupported_parameters"]

    @pytest.mark.django_db
    def test_parent_parameter_returns_400(self, api_key_client, workspace, project, issue):
        """The ?parent= parameter is unsupported and should trigger a 400."""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"parent": str(issue.id)})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "unsupported_parameters" in response.data
        assert "parent" in response.data["unsupported_parameters"]

    @pytest.mark.django_db
    def test_supported_parameters_still_work(self, api_key_client, workspace, project, issue):
        """Valid parameters like cursor or order_by should still return 200."""
        url = self.get_url(workspace.slug, project.id)

        # Test a few supported parameters to ensure the allowlist doesn't block them
        response = api_key_client.get(url, {"order_by": "-created_at"})
        assert response.status_code == status.HTTP_200_OK

        response = api_key_client.get(url, {"per_page": "10"})
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_format_parameter_still_works(self, api_key_client, workspace, project, issue):
        """DRF's built-in ?format= override must not be rejected."""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"format": "json"})

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_list_parameters_together(self, api_key_client, workspace, project, issue):
        """All list-mode parameters are accepted together, so the allow-list is
        not stricter than the view, base class and paginator."""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(
            url,
            {
                "per_page": "10",
                "cursor": "10:0:0",
                "order_by": "-created_at",
                "fields": "id,name",
                "expand": "state",
            },
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_external_id_parameters_accepted(self, api_key_client, workspace, project, state, create_user):
        """external_id + external_source are allowed and resolve a single item."""
        external_issue = Issue.objects.create(
            name="External Issue",
            workspace=workspace,
            project=project,
            state=state,
            created_by=create_user,
            external_id="abc",
            external_source="github",
        )
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"external_id": "abc", "external_source": "github"})

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(external_issue.id)
        """Every parameter the endpoint reads is accepted, so the allow-list is
        not stricter than the view and paginator."""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(
            url,
            {
                "per_page": "10",
                "cursor": "10:0:0",
                "order_by": "-created_at",
                "fields": "id,name",
                "expand": "state",
                "external_id": "abc",
                "external_source": "github",
            },
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_multiple_unknown_parameters_are_all_listed(self, api_key_client, workspace, project, issue):
        """All unsupported names are reported, sorted, and valid ones are not."""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"zeta": "1", "alpha": "1", "per_page": "10"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["unsupported_parameters"] == ["alpha", "zeta"]

    @pytest.mark.django_db
    def test_pql_still_returns_existing_400(self, api_key_client, workspace, project, issue):
        """The pre-existing pql/filters branch keeps its own message and runs first."""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url, {"pql": "x"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "pql" in response.data
        assert response.data["unsupported_parameters"] == ["pql"]

    @pytest.mark.django_db
    def test_work_items_alias_rejects_unknown_parameter(self, api_key_client, workspace, project, issue):
        """The /work-items/ route is served by the same view and gets the same check."""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/"
        response = api_key_client.get(url, {"parent": str(issue.id)})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["unsupported_parameters"] == ["parent"]
