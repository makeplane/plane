# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Endpoint-level coverage for work item search.

The unit tests next door assert the shape of the ``Q`` tree. These drive the
real endpoints against real rows, which is the only way to catch the things
that actually broke: a field that is never populated, a permission filter that
widens along with the search, or a projection that leaks markup.

Modelled on the case that motivated the change: a title about a payment
gateway whose body is the only place the vendor's name appears.
"""

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import (
    Issue,
    Project,
    ProjectMember,
    User,
    Workspace,
    WorkspaceMember,
)

GLOBAL_SEARCH = "/api/workspaces/{slug}/search/"
PROJECT_ISSUE_SEARCH = "/api/workspaces/{slug}/projects/{project_id}/search-issues/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Payments",
        identifier="PAY",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def _issue(project, name, body=""):
    return Issue.objects.create(
        name=name,
        project=project,
        workspace=project.workspace,
        description_html=f"<p>{body}</p>" if body else "<p></p>",
    )


@pytest.fixture
def issues(db, project):
    """The motivating case, plus neighbours that must not be swept up."""
    return {
        "gateway": _issue(
            project,
            "Select the payment gateway on Level 3 capability and effective rate",
            "Northwind is the incumbent gateway. Compare Northwind-Meridian Level 3 rates before the review.",
        ),
        "unrelated": _issue(project, "Ship the marketing site", "Nothing to do with payments."),
        "decoy": _issue(project, "Rate limit the public API", "Throttling, not billing."),
    }


def _search(client, slug, term, **params):
    response = client.get(
        GLOBAL_SEARCH.format(slug=slug),
        {"search": term, "workspace_search": "true", "entities": "issue", **params},
    )
    assert response.status_code == status.HTTP_200_OK
    return response.json()["results"]["issue"]


def _names(results):
    return {row["name"] for row in results}


@pytest.mark.contract
class TestWorkItemSearchFindsBodies:
    def test_a_word_only_in_the_body_is_found(self, session_client, workspace, issues):
        """The case the old search could not reach by any phrasing."""
        results = _search(session_client, workspace.slug, "northwind")
        assert _names(results) == {issues["gateway"].name}

    def test_search_is_case_insensitive_in_the_body(self, session_client, workspace, issues):
        assert len(_search(session_client, workspace.slug, "NORTHWIND")) == 1

    def test_body_matching_does_not_match_the_markup(self, session_client, workspace, issues):
        """Bodies are searched as stripped text, so tag names are not matchable."""
        assert _search(session_client, workspace.slug, "<p>") == []

    def test_titles_still_match(self, session_client, workspace, issues):
        results = _search(session_client, workspace.slug, "marketing")
        assert _names(results) == {issues["unrelated"].name}


@pytest.mark.contract
class TestWorkItemSearchMatchesWords:
    def test_words_need_not_be_adjacent(self, session_client, workspace, issues):
        """ "payment" and "gateway" from the title, "review" from the body."""
        results = _search(session_client, workspace.slug, "payment gateway review")
        assert _names(results) == {issues["gateway"].name}

    def test_word_order_does_not_matter(self, session_client, workspace, issues):
        assert len(_search(session_client, workspace.slug, "gateway payment")) == 1

    def test_every_word_must_match(self, session_client, workspace, issues):
        """Tokens are AND-ed, so one unmatched word rules the record out."""
        assert _search(session_client, workspace.slug, "payment gateway alpaca") == []

    def test_words_from_different_records_do_not_combine(self, session_client, workspace, issues):
        """ "rate" is in the decoy's title, "payment" is not."""
        results = _search(session_client, workspace.slug, "rate payment")
        assert _names(results) == {issues["gateway"].name}


@pytest.mark.contract
class TestSequenceIdLookup:
    def test_a_bare_number_finds_the_work_item(self, session_client, workspace, issues):
        target = issues["gateway"]
        results = _search(session_client, workspace.slug, str(target.sequence_id))
        assert target.name in _names(results)

    def test_identifier_and_number_together_find_it(self, session_client, workspace, issues):
        target = issues["gateway"]
        results = _search(session_client, workspace.slug, f"PAY-{target.sequence_id}")
        assert target.name in _names(results)

    def test_a_number_inside_a_phrase_still_matches_by_id(self, session_client, workspace, issues):
        """Unchanged behaviour, pinned deliberately.

        A number anywhere in the query matches by sequence id, OR-ed onto the
        whole predicate, so the work item carrying it comes back even though
        neither word matches it. Noisy, but narrowing it would drop results
        that match today and this change is a strict superset.
        """
        decoy = issues["decoy"]
        results = _search(session_client, workspace.slug, f"payment gateway {decoy.sequence_id}")
        assert decoy.name in _names(results)


@pytest.mark.contract
class TestSearchDoesNotWidenVisibility:
    """Searching more fields must not surface more records than the caller may see."""

    def test_another_tenants_work_item_is_not_returned(self, session_client, workspace, issues):
        uid = uuid4().hex[:8]
        # username is unique and not auto-populated, so it has to be set here
        other_user = User.objects.create(email=f"other-{uid}@plane.so", username=f"other_{uid}")
        other_ws = Workspace.objects.create(name="Other WS", owner=other_user, slug=f"other-{uid}")
        WorkspaceMember.objects.create(workspace=other_ws, member=other_user, role=20)
        other_project = Project.objects.create(
            name="Other", identifier="OTH", workspace=other_ws, created_by=other_user
        )
        _issue(other_project, "Their gateway work", "Northwind everywhere in this body too.")

        results = _search(session_client, workspace.slug, "northwind")
        assert _names(results) == {issues["gateway"].name}

    def test_a_project_the_caller_left_is_not_searched(self, session_client, workspace, project, issues, create_user):
        ProjectMember.objects.filter(project=project, member=create_user).update(is_active=False)
        assert _search(session_client, workspace.slug, "northwind") == []


@pytest.mark.contract
class TestProjectScopedIssueSearch:
    """The other endpoint, which goes through plane.utils.issue_search."""

    def test_body_search_applies_here_too(self, session_client, workspace, project, issues):
        response = session_client.get(
            PROJECT_ISSUE_SEARCH.format(slug=workspace.slug, project_id=project.id),
            {"search": "northwind"},
        )
        assert response.status_code == status.HTTP_200_OK
        assert _names(response.json()) == {issues["gateway"].name}

    def test_multi_word_applies_here_too(self, session_client, workspace, project, issues):
        response = session_client.get(
            PROJECT_ISSUE_SEARCH.format(slug=workspace.slug, project_id=project.id),
            {"search": "payment gateway review"},
        )
        assert response.status_code == status.HTTP_200_OK
        assert _names(response.json()) == {issues["gateway"].name}
