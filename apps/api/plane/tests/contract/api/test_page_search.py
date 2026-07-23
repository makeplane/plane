# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the token-API page search endpoint.

    GET /api/v1/workspaces/{slug}/pages/search/

Covers matching (name and text content), the security-critical scoping rules
(project membership, private-page ownership, archived exclusion), the optional
project filter, and cursor pagination.
"""

import pytest
from rest_framework import status

from plane.db.models import Page, Project, ProjectMember, ProjectPage, User, Workspace, WorkspaceMember


def _url(slug):
    return f"/api/v1/workspaces/{slug}/pages/search/"


def _make_project(workspace, creator, identifier, member=None, is_active=True, archived_at=None):
    """Create a project; optionally add ``member`` (active or not) as an admin member."""
    project = Project.objects.create(
        name=f"Project {identifier}",
        identifier=identifier,
        workspace=workspace,
        created_by=creator,
        archived_at=archived_at,
    )
    if member is not None:
        ProjectMember.objects.create(project=project, member=member, role=20, is_active=is_active)
    return project


def _make_page(workspace, project, owner, name="", content="", access=0, archived_at=None):
    """Create a page in ``project``. ``content`` is stored as HTML so the model's
    ``save()`` populates ``description_stripped`` exactly like production."""
    page = Page.objects.create(
        name=name,
        workspace=workspace,
        owned_by=owner,
        description_html=f"<p>{content}</p>" if content else "<p></p>",
        access=access,
        archived_at=archived_at,
    )
    ProjectPage.objects.create(page=page, project=project, workspace=workspace)
    return page


@pytest.fixture(autouse=True)
def _reset_api_key_throttle():
    """Keep these tests isolated from the API-key rate-limit counter, which is
    keyed on the (shared) test token and otherwise accumulates across the suite
    in the backing cache — producing spurious HTTP 429s here."""
    from django.core.cache import cache

    cache.clear()
    yield


@pytest.fixture
def other_user(db):
    """A second user who is never the API caller."""
    user = User.objects.create(
        email="other@plane.so",
        username="other-user",
        first_name="Other",
        last_name="User",
    )
    user.set_password("other-password")
    user.save()
    return user


@pytest.fixture
def project(db, workspace, create_user):
    """A project the requesting user (``create_user``) is an active member of."""
    return _make_project(workspace, create_user, "TP", member=create_user)


@pytest.mark.contract
@pytest.mark.django_db
class TestPageSearch:
    def test_missing_query_returns_400(self, api_key_client, workspace, project):
        response = api_key_client.get(_url(workspace.slug))
        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data

    def test_name_match(self, api_key_client, workspace, project, create_user):
        match = _make_page(workspace, project, create_user, name="Quarterly Roadmap")
        _make_page(workspace, project, create_user, name="Team Lunch Notes")

        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap"})

        assert response.status_code == status.HTTP_200_OK, response.data
        ids = {r["id"] for r in response.data["results"]}
        assert ids == {str(match.id)}

    def test_content_match(self, api_key_client, workspace, project, create_user):
        # Name does NOT contain the term; the body does.
        match = _make_page(
            workspace,
            project,
            create_user,
            name="Untitled",
            content="Remember to renew the SSL certificate before it expires.",
        )
        _make_page(workspace, project, create_user, name="Untitled", content="Nothing relevant here.")

        response = api_key_client.get(_url(workspace.slug), {"query": "ssl certificate"})

        assert response.status_code == status.HTTP_200_OK, response.data
        ids = {r["id"] for r in response.data["results"]}
        assert ids == {str(match.id)}

    def test_case_insensitive(self, api_key_client, workspace, project, create_user):
        match = _make_page(workspace, project, create_user, name="ONBOARDING Guide")

        response = api_key_client.get(_url(workspace.slug), {"query": "onboarding"})

        assert response.status_code == status.HTTP_200_OK, response.data
        assert {r["id"] for r in response.data["results"]} == {str(match.id)}

    def test_membership_scoping_non_member_sees_nothing(self, api_key_client, workspace, create_user, other_user):
        # A project the caller is NOT a member of, holding a matching page.
        foreign_project = _make_project(workspace, other_user, "FP", member=other_user)
        _make_page(workspace, foreign_project, other_user, name="Secret Roadmap")

        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap"})

        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["results"] == []

    def test_private_page_excluded_for_non_owner_but_visible_to_owner(
        self, api_key_client, workspace, project, create_user, other_user
    ):
        # Private page owned by someone else, in a project the caller can access.
        _make_page(workspace, project, other_user, name="Private Roadmap", access=Page.PRIVATE_ACCESS)
        # Private page owned by the caller.
        own_private = _make_page(workspace, project, create_user, name="My Private Roadmap", access=Page.PRIVATE_ACCESS)
        # Public page, visible to any member.
        public = _make_page(workspace, project, other_user, name="Public Roadmap", access=Page.PUBLIC_ACCESS)

        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap"})

        assert response.status_code == status.HTTP_200_OK, response.data
        ids = {r["id"] for r in response.data["results"]}
        assert ids == {str(own_private.id), str(public.id)}

    def test_project_filter(self, api_key_client, workspace, create_user):
        project_a = _make_project(workspace, create_user, "PA", member=create_user)
        project_b = _make_project(workspace, create_user, "PB", member=create_user)
        page_a = _make_page(workspace, project_a, create_user, name="Roadmap A")
        _make_page(workspace, project_b, create_user, name="Roadmap B")

        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap", "projects": str(project_a.id)})

        assert response.status_code == status.HTTP_200_OK, response.data
        ids = {r["id"] for r in response.data["results"]}
        assert ids == {str(page_a.id)}
        # The reported project id is the accessible project the page belongs to.
        assert response.data["results"][0]["project_id"] == str(project_a.id)

    def test_invalid_projects_filter_returns_400(self, api_key_client, workspace, project):
        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap", "projects": "not-a-uuid"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data

    def test_archived_excluded_by_default_and_included_with_flag(self, api_key_client, workspace, project, create_user):
        from django.utils import timezone

        active = _make_page(workspace, project, create_user, name="Active Roadmap")
        archived = _make_page(
            workspace, project, create_user, name="Archived Roadmap", archived_at=timezone.now().date()
        )

        # Default: archived excluded.
        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap"})
        assert response.status_code == status.HTTP_200_OK, response.data
        assert {r["id"] for r in response.data["results"]} == {str(active.id)}

        # With archived=true both are returned.
        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap", "archived": "true"})
        assert response.status_code == status.HTTP_200_OK, response.data
        assert {r["id"] for r in response.data["results"]} == {str(active.id), str(archived.id)}

    def test_result_shape_and_snippet(self, api_key_client, workspace, project, create_user):
        parent = _make_page(workspace, project, create_user, name="Parent Page")
        page = _make_page(
            workspace,
            project,
            create_user,
            name="Untitled",
            content="The quarterly budget review covers spend across every team this period.",
        )
        page.parent = parent
        page.save()

        response = api_key_client.get(_url(workspace.slug), {"query": "budget review"})

        assert response.status_code == status.HTTP_200_OK, response.data
        result = next(r for r in response.data["results"] if r["id"] == str(page.id))
        assert set(result.keys()) == {"id", "name", "project_id", "parent_id", "updated_at", "snippet"}
        assert result["project_id"] == str(project.id)
        assert result["parent_id"] == str(parent.id)
        assert "budget review" in result["snippet"].lower()

    def test_pagination(self, api_key_client, workspace, project, create_user):
        created = {str(_make_page(workspace, project, create_user, name=f"Roadmap {i}").id) for i in range(3)}

        # First page of 2.
        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap", "per_page": 2})
        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["count"] == 2
        assert response.data["total_count"] == 3
        assert response.data["next_page_results"] is True
        seen = {r["id"] for r in response.data["results"]}

        # Follow the cursor for the remainder.
        response = api_key_client.get(
            _url(workspace.slug),
            {"query": "roadmap", "per_page": 2, "cursor": response.data["next_cursor"]},
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["count"] == 1
        assert response.data["next_page_results"] is False
        seen |= {r["id"] for r in response.data["results"]}

        assert seen == created

    def test_inactive_membership_sees_nothing(self, api_key_client, workspace, create_user):
        # The caller once belonged to the project but the membership is deactivated.
        project = _make_project(workspace, create_user, "IA", member=create_user, is_active=False)
        _make_page(workspace, project, create_user, name="Roadmap")

        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap"})

        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["results"] == []

    def test_archived_project_pages_excluded(self, api_key_client, workspace, create_user):
        from django.utils import timezone

        # Page lives in an archived project the caller is an active member of.
        archived_project = _make_project(workspace, create_user, "AP", member=create_user, archived_at=timezone.now())
        _make_page(workspace, archived_project, create_user, name="Roadmap")

        # Excluded by default and even when archived pages are requested — the
        # ?archived flag controls page archival, not project archival.
        for params in ({"query": "roadmap"}, {"query": "roadmap", "archived": "true"}):
            response = api_key_client.get(_url(workspace.slug), params)
            assert response.status_code == status.HTTP_200_OK, response.data
            assert response.data["results"] == [], params

    def test_cross_workspace_isolation(self, api_key_client, workspace, create_user):
        # A second workspace the caller is fully a member of, with a matching page.
        other_workspace = Workspace.objects.create(name="Other Workspace", owner=create_user, slug="other-workspace")
        WorkspaceMember.objects.create(workspace=other_workspace, member=create_user, role=20)
        other_project = _make_project(other_workspace, create_user, "OW", member=create_user)
        _make_page(other_workspace, other_project, create_user, name="Roadmap")

        # Searching the first workspace must not surface the other workspace's page.
        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap"})
        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["results"] == []

    def test_per_page_zero_returns_400(self, api_key_client, workspace, project, create_user):
        _make_page(workspace, project, create_user, name="Roadmap")
        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap", "per_page": 0})
        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data

    def test_per_page_over_max_returns_400(self, api_key_client, workspace, project, create_user):
        _make_page(workspace, project, create_user, name="Roadmap")
        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap", "per_page": 1000})
        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data

    def test_snippet_alignment_with_unicode(self, api_key_client, workspace, project, create_user):
        # A leading character that expands when lowercased ("İ".lower() has length 2)
        # must not shift the snippet window off the match.
        page = _make_page(
            workspace,
            project,
            create_user,
            name="Untitled",
            content="İ office note. The budget review happens on Friday afternoon here.",
        )

        response = api_key_client.get(_url(workspace.slug), {"query": "budget review"})
        assert response.status_code == status.HTTP_200_OK, response.data
        result = next(r for r in response.data["results"] if r["id"] == str(page.id))
        assert "budget review" in result["snippet"].lower()
