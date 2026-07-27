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
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework import status

from plane.api.rate_limit import ApiKeyRateThrottle
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
def _reset_api_key_throttle(api_token):
    """Keep these tests isolated from the API-key rate-limit counter, which is
    keyed on the (shared) test token and otherwise accumulates across the suite
    in the backing cache — producing spurious HTTP 429s here.

    Only this token's throttle key is dropped; flushing the whole cache would
    reach into unrelated tests sharing the backend."""
    from django.core.cache import cache

    throttle_key = f"{ApiKeyRateThrottle.scope}:{api_token.token}"
    cache.delete(throttle_key)
    yield
    cache.delete(throttle_key)


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

    def test_multi_keyword_query_matches_tokens_in_different_sentences(
        self, api_key_client, workspace, project, create_user
    ):
        """Callers send keyword queries. The tokens need not appear together, or
        even in the same sentence — matching the query as one literal phrase
        would find none of these."""
        scattered = _make_page(
            workspace,
            project,
            create_user,
            name="Untitled",
            content=(
                "We saw a latency regression on Tuesday. A spike in error rates followed. "
                "The rollback was clean and the incident is closed."
            ),
        )
        # Tokens split across the name and the body.
        across_name_and_body = _make_page(
            workspace,
            project,
            create_user,
            name="Rollback runbook",
            content="Mitigation for a latency spike during an incident.",
        )

        response = api_key_client.get(_url(workspace.slug), {"query": "latency spike rollback incident"})

        assert response.status_code == status.HTTP_200_OK, response.data
        assert {r["id"] for r in response.data["results"]} == {
            str(scattered.id),
            str(across_name_and_body.id),
        }

    def test_page_with_only_some_tokens_does_not_match(self, api_key_client, workspace, project, create_user):
        """Tokens are ANDed: a page missing any one of them is not a result.
        OR-ing would flood the response with single-common-word matches."""
        _make_page(
            workspace,
            project,
            create_user,
            name="Untitled",
            content="A latency spike happened, but this page never mentions the other terms.",
        )

        response = api_key_client.get(_url(workspace.slug), {"query": "latency spike rollback incident"})

        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["results"] == []

    def test_snippet_anchors_on_first_matching_token(self, api_key_client, workspace, project, create_user):
        """With the phrase absent, the excerpt is anchored on the first query
        token so the reader sees something they searched for."""
        filler = "z" * 400
        page = _make_page(
            workspace,
            project,
            create_user,
            name="Untitled",
            content=f"{filler} a latency regression appeared. {filler} and later a spike followed.",
        )

        response = api_key_client.get(_url(workspace.slug), {"query": "latency spike"})

        assert response.status_code == status.HTTP_200_OK, response.data
        snippet = next(r for r in response.data["results"] if r["id"] == str(page.id))["snippet"]
        assert "latency" in snippet.lower()
        # 'spike' sits ~400 characters later, outside the 200-character budget.
        assert "spike" not in snippet.lower()

    def test_whitespace_only_query_returns_400(self, api_key_client, workspace, project):
        """A query that is empty once tokenised is rejected, as before."""
        for value in ("   ", "\t", "\n "):
            response = api_key_client.get(_url(workspace.slug), {"query": value})
            assert response.status_code == status.HTTP_400_BAD_REQUEST, (value, response.data)

    def test_multi_keyword_results_ordered_by_updated_at_desc(self, api_key_client, workspace, project, create_user):
        """Ordering is unchanged by tokenisation: most recently updated first."""
        content = "latency spike rollback incident notes"
        first = _make_page(workspace, project, create_user, name="First", content=content)
        second = _make_page(workspace, project, create_user, name="Second", content=content)
        third = _make_page(workspace, project, create_user, name="Third", content=content)

        # Touch them in a known order; updated_at is auto_now.
        for page in (first, third, second):
            page.save()

        response = api_key_client.get(_url(workspace.slug), {"query": "latency spike rollback incident"})

        assert response.status_code == status.HTTP_200_OK, response.data
        assert [r["id"] for r in response.data["results"]] == [
            str(second.id),
            str(third.id),
            str(first.id),
        ]

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

    def test_guest_without_view_all_sees_only_own_pages(self, api_key_client, workspace, create_user, other_user):
        """A guest in a project that has not opted guests into full visibility
        may only see the pages they own — the rule PageViewSet enforces."""
        project = _make_project(workspace, other_user, "GP", member=other_user)
        project.guest_view_all_features = False
        project.save()
        ProjectMember.objects.create(project=project, member=create_user, role=5, is_active=True)

        _make_page(workspace, project, other_user, name="Roadmap Owned By Other")
        own = _make_page(workspace, project, create_user, name="Roadmap Owned By Me")

        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap"})

        assert response.status_code == status.HTTP_200_OK, response.data
        assert {r["id"] for r in response.data["results"]} == {str(own.id)}

    def test_guest_with_view_all_sees_project_pages(self, api_key_client, workspace, create_user, other_user):
        """When the project opts guests into full visibility, a guest sees the
        project's public pages like any other member."""
        project = _make_project(workspace, other_user, "GV", member=other_user)
        project.guest_view_all_features = True
        project.save()
        ProjectMember.objects.create(project=project, member=create_user, role=5, is_active=True)

        others = _make_page(workspace, project, other_user, name="Roadmap Owned By Other")
        own = _make_page(workspace, project, create_user, name="Roadmap Owned By Me")

        response = api_key_client.get(_url(workspace.slug), {"query": "roadmap"})

        assert response.status_code == status.HTTP_200_OK, response.data
        assert {r["id"] for r in response.data["results"]} == {str(others.id), str(own.id)}

    def test_unknown_workspace_returns_400(self, api_key_client, workspace, project, create_user):
        """An unrecognised slug is reported, not silently returned as an empty
        result set — matching the other token-API workspace endpoints."""
        _make_page(workspace, project, create_user, name="Roadmap")

        response = api_key_client.get(_url("no-such-workspace"), {"query": "roadmap"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data
        assert "error" in response.data

    def test_error_responses_use_a_consistent_envelope(self, api_key_client, workspace, project, create_user):
        """Every 400 from this endpoint uses {"error": ...}, including the ones
        the paginator raises (which are DRF's {"detail": ...} by default)."""
        _make_page(workspace, project, create_user, name="Roadmap")

        cases = [
            {},  # missing query
            {"query": "roadmap", "projects": "not-a-uuid"},
            {"query": "roadmap", "per_page": 0},
            {"query": "roadmap", "per_page": 101},  # above this endpoint's max
            {"query": "roadmap", "cursor": "not-a-cursor"},
        ]
        for params in cases:
            response = api_key_client.get(_url(workspace.slug), params)
            assert response.status_code == status.HTTP_400_BAD_REQUEST, (params, response.data)
            assert "error" in response.data, (params, response.data)
            assert "detail" not in response.data, (params, response.data)

    def test_heavy_page_columns_are_not_loaded(self, api_key_client, workspace, project, create_user):
        """The response only needs identity fields plus the stripped text, so the
        large description columns must never reach the SELECT.

        Asserted against the SQL the request actually runs — checking a queryset
        built here instead would only prove that Django's .only() works, and
        would keep passing if the endpoint stopped deferring anything."""
        page = _make_page(workspace, project, create_user, name="Roadmap", content="Some body text")
        page.description_json = {"big": "payload"}
        page.save()

        with CaptureQueriesContext(connection) as captured:
            response = api_key_client.get(_url(workspace.slug), {"query": "roadmap"})

        assert response.status_code == status.HTTP_200_OK, response.data
        assert {r["id"] for r in response.data["results"]} == {str(page.id)}

        page_selects = [
            entry["sql"]
            for entry in captured.captured_queries
            if entry["sql"].lstrip().upper().startswith("SELECT") and '"pages"."description_stripped"' in entry["sql"]
        ]
        assert page_selects, "no page SELECT captured — the assertions below would be vacuous"

        for sql in captured.captured_queries:
            for heavy_column in ("description_html", "description_binary", "description_json"):
                assert heavy_column not in sql["sql"], f"{heavy_column} was selected: {sql['sql']}"

    def test_page_linked_to_project_in_another_workspace_is_not_exposed(
        self, api_key_client, workspace, create_user, other_user
    ):
        """Access is decided strictly within the searched workspace: a stray
        ProjectPage row pointing at a project elsewhere must not grant access."""
        # Caller is NOT a member of the project holding the page in this workspace.
        foreign_project = _make_project(workspace, other_user, "FW", member=other_user)
        page = _make_page(workspace, foreign_project, other_user, name="Roadmap")

        # ...but is an admin of a project in a different workspace, which is then
        # linked to the same page (the corrupted/cross-workspace row).
        other_workspace = Workspace.objects.create(name="Other WS", owner=create_user, slug="other-ws")
        WorkspaceMember.objects.create(workspace=other_workspace, member=create_user, role=20)
        elsewhere = _make_project(other_workspace, create_user, "EW", member=create_user)
        ProjectPage.objects.create(page=page, project=elsewhere, workspace=other_workspace)

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
