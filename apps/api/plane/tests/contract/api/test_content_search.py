# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Content search of the Liviere/plane fork (plane/liviere/search): POST /api/v1/workspaces/{slug}/liviere/search/
# with an API key. All texts are made up.

import os
import statistics
import time
from datetime import timedelta
from unittest import mock
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, IssueComment, Project, ProjectMember, State, User, WorkspaceMember
from plane.db.models.api import APIToken
from plane.liviere.search.queries import search

URL = "/api/v1/workspaces/{slug}/liviere/search/"


def _make_user(prefix):
    unique_id = uuid4().hex[:8]
    return User.objects.create(email=f"{prefix}-{unique_id}@plane.so", username=f"{prefix}_{unique_id}")


def _key_client(user):
    token = APIToken.objects.create(user=user, label="search", token=f"plane_api_{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _project(workspace, owner, identifier, **kwargs):
    project = Project.objects.create(
        name=f"Project {identifier}", identifier=identifier, workspace=workspace, created_by=owner, **kwargs
    )
    ProjectMember.objects.create(project=project, member=owner, workspace=workspace, role=20, is_active=True)
    State.objects.create(name="Todo", project=project, workspace=workspace, group="unstarted", default=True)
    return project


def _issue(project, name, description="", created_by=None, **kwargs):
    issue = Issue.objects.create(
        project=project,
        workspace=project.workspace,
        name=name,
        description_html=f"<p>{description}</p>" if description else "<p></p>",
        **kwargs,
    )
    if created_by is not None:
        # BaseModel.save takes the author from the request user, which tests do not have
        Issue.all_objects.filter(pk=issue.pk).update(created_by=created_by)
    return issue


def _comment(issue, text, actor=None):
    return IssueComment.objects.create(
        issue=issue,
        project=issue.project,
        workspace=issue.workspace,
        comment_html=f"<p>{text}</p>",
        actor=actor,
    )


def _touch(obj, minutes_ago):
    """Set the time the ordering reads: updated_at of a work item, created_at of a comment."""
    at = timezone.now() - timedelta(minutes=minutes_ago)
    field = "updated_at" if isinstance(obj, Issue) else "created_at"
    type(obj).all_objects.filter(pk=obj.pk).update(**{field: at})


def _search(client, workspace, **body):
    return client.post(URL.format(slug=workspace.slug), body, format="json")


def _ids(response):
    return [result["identifier"] for result in response.json()["results"]]


@pytest.fixture
def project(db, workspace, create_user):
    return _project(workspace, create_user, "SRC")


@pytest.mark.contract
class TestPlacesAndSnippets:
    def test_title_description_and_comment(self, api_key_client, workspace, project, create_user):
        in_title = _issue(project, "Rate limit of the API")
        in_description = _issue(project, "Backups", "Nightly copy. The rate limit is not relevant here.")
        in_comment = _issue(project, "Agents")
        comment = _comment(in_comment, "We agreed on a rate limit of 60 requests a minute, then wait after 429.")

        response = _search(api_key_client, workspace, q="rate limit")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 3 and data["has_more"] is False and data["query"] == "rate limit"
        by_id = {result["id"]: result for result in data["results"]}

        title = by_id[str(in_title.id)]
        assert title["match"] == "title"
        assert title["identifier"] == f"SRC-{in_title.sequence_id}"
        assert title["state"] == "Todo" and title["state_group"] == "unstarted"
        assert title["snippet"] == "Rate limit of the API"
        assert title["highlight"] == [0, 10]
        assert "comment_id" not in title

        description = by_id[str(in_description.id)]
        assert description["match"] == "description"
        start, end = description["highlight"]
        assert description["snippet"][start:end] == "rate limit"

        hit = by_id[str(in_comment.id)]
        assert hit["match"] == "comment"
        assert hit["comment_id"] == str(comment.id)
        assert hit["comment_created_at"]
        assert hit["comment_matches"] == 1
        start, end = hit["highlight"]
        assert hit["snippet"][start:end] == "rate limit"

    def test_snippet_is_cut_around_the_match(self, api_key_client, workspace, project):
        text = ("a" * 200) + " needle " + ("b" * 200)
        _issue(project, "Long", text)
        result = _search(api_key_client, workspace, q="needle").json()["results"][0]
        assert result["snippet"].startswith("…") and result["snippet"].endswith("…")
        assert len(result["snippet"]) <= 2 * 80 + len("needle") + 2
        start, end = result["highlight"]
        assert result["snippet"][start:end] == "needle"

    def test_case_and_polish_letters(self, api_key_client, workspace, project):
        issue = _issue(project, "Limity", "Limit 60 zapytań na minutę. Żółw idzie wolno.")
        for phrase in ("ZAPYTAŃ", "żółw", "ŻÓŁW", "Zapyta"):
            assert _ids(_search(api_key_client, workspace, q=phrase)) == [f"SRC-{issue.sequence_id}"], phrase

    def test_word_stem_finds_inflected_forms(self, api_key_client, workspace, project):
        issue = _issue(project, "Zgłoszenie", "Klient zgłosił oszustwo przy płatności.")
        assert _ids(_search(api_key_client, workspace, q="oszust")) == [f"SRC-{issue.sequence_id}"]

    def test_like_wildcards_are_literal(self, api_key_client, workspace, project):
        percent = _issue(project, "Discount", "Give 50% off")
        _issue(project, "Other", "Give 500 off")
        underscore = _issue(project, "Names", "Column a_b is new")
        _issue(project, "More names", "Column axb is old")
        assert _ids(_search(api_key_client, workspace, q="50%")) == [f"SRC-{percent.sequence_id}"]
        assert _ids(_search(api_key_client, workspace, q="a_b")) == [f"SRC-{underscore.sequence_id}"]

    def test_no_match(self, api_key_client, workspace, project):
        _issue(project, "Something", "Else")
        response = _search(api_key_client, workspace, q="nothing like this")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["results"] == [] and response.json()["total"] == 0


@pytest.mark.contract
class TestOrdering:
    def test_one_result_per_work_item_with_comment_count(self, api_key_client, workspace, project):
        issue = _issue(project, "Deploy checklist", "Run the deploy checklist first")
        _comment(issue, "deploy checklist updated")
        _comment(issue, "Deploy checklist again")
        _comment(issue, "unrelated")
        data = _search(api_key_client, workspace, q="deploy checklist").json()
        assert data["total"] == 1
        assert data["results"][0]["match"] == "title"
        assert data["results"][0]["comment_matches"] == 2

    def test_title_before_description_before_comment_then_newest(self, api_key_client, workspace, project):
        old_title = _issue(project, "Invoice export")
        new_title = _issue(project, "Invoice import")
        description = _issue(project, "Accounting", "invoice numbers")
        old_comment = _issue(project, "Talk 1")
        new_comment = _issue(project, "Talk 2")
        _touch(old_title, 60)
        _touch(new_title, 5)
        _touch(description, 1)
        _touch(_comment(old_comment, "invoice later"), 30)
        _touch(_comment(new_comment, "invoice now"), 2)
        # Comment hits follow the newest matching comment, not the update time of the work item
        _touch(old_comment, 0)
        _touch(new_comment, 0)

        expected = [new_title, old_title, description, new_comment, old_comment]
        assert _ids(_search(api_key_client, workspace, q="invoice")) == [f"SRC-{i.sequence_id}" for i in expected]


@pytest.mark.contract
class TestWhatIsLeftOut:
    def test_deleted_draft_and_triage_work_items_and_deleted_comments(
        self, api_key_client, workspace, project, create_user
    ):
        visible = _issue(project, "Visible kiwi")
        deleted = _issue(project, "Deleted kiwi")
        Issue.all_objects.filter(pk=deleted.pk).update(deleted_at=timezone.now())
        _issue(project, "Draft kiwi", is_draft=True)
        triage = State.objects.create(
            name="Triage", project=project, workspace=workspace, group="triage", is_triage=True
        )
        _issue(project, "Intake kiwi", state=triage)

        # A comment of a deleted work item whose comments are not soft-deleted yet (background task)
        gone = _issue(project, "Gone")
        _comment(gone, "kiwi in a comment")
        Issue.all_objects.filter(pk=gone.pk).update(deleted_at=timezone.now())

        removed = _issue(project, "Removed comment")
        comment = _comment(removed, "kiwi was here")
        IssueComment.all_objects.filter(pk=comment.pk).update(deleted_at=timezone.now())

        assert _ids(_search(api_key_client, workspace, q="kiwi")) == [f"SRC-{visible.sequence_id}"]

    def test_archived_work_items_are_found_and_flagged(self, api_key_client, workspace, project):
        archived = _issue(project, "Old mango decision")
        Issue.all_objects.filter(pk=archived.pk).update(archived_at=timezone.now())
        in_comment = _issue(project, "Old talk")
        _comment(in_comment, "mango agreed")
        Issue.all_objects.filter(pk=in_comment.pk).update(archived_at=timezone.now())
        current = _issue(project, "Current mango")

        data = _search(api_key_client, workspace, q="mango").json()
        flags = {result["id"]: result["archived"] for result in data["results"]}
        assert flags == {str(archived.id): True, str(in_comment.id): True, str(current.id): False}
        assert data["archived"] is True

        data = _search(api_key_client, workspace, q="mango", archived=False).json()
        assert [result["id"] for result in data["results"]] == [str(current.id)]
        assert data["archived"] is False

    def test_archived_project(self, api_key_client, workspace, project, create_user):
        other = _project(workspace, create_user, "ARC")
        _issue(other, "Papaya in an archived project")
        Project.objects.filter(pk=other.pk).update(archived_at=timezone.now())
        assert _search(api_key_client, workspace, q="papaya").json()["total"] == 0
        response = _search(api_key_client, workspace, q="papaya", project="ARC")
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestAccess:
    def test_only_projects_of_the_member(self, workspace, project, create_user):
        mine = _project(workspace, create_user, "MINE")
        member = _make_user("member")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
        ProjectMember.objects.create(project=mine, member=member, workspace=workspace, role=15, is_active=True)
        own = _issue(mine, "Shared lemon")
        _issue(project, "Secret lemon")
        _comment(_issue(project, "Secret talk"), "lemon")
        client = _key_client(member)

        assert _ids(_search(client, workspace, q="lemon")) == [f"MINE-{own.sequence_id}"]
        assert _ids(_search(client, workspace, q="lemon", project="mine")) == [f"MINE-{own.sequence_id}"]
        assert _ids(_search(client, workspace, q="lemon", project=str(mine.id))) == [f"MINE-{own.sequence_id}"]
        assert _search(client, workspace, q="lemon", project="SRC").status_code == status.HTTP_404_NOT_FOUND
        assert _search(client, workspace, q="lemon", project=str(project.id)).status_code == 404

    def test_inactive_member_sees_nothing(self, workspace, project):
        member = _make_user("left")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
        ProjectMember.objects.create(project=project, member=member, workspace=workspace, role=15, is_active=False)
        _issue(project, "Cherry")
        assert _search(_key_client(member), workspace, q="cherry").json()["total"] == 0

    def test_restricted_guest_sees_only_own_work_items(self, api_key_client, workspace, project, create_user):
        guest = _make_user("guest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)
        ProjectMember.objects.create(project=project, member=guest, workspace=workspace, role=5, is_active=True)
        own = _issue(project, "Guest plum", created_by=guest)
        others = _issue(project, "Team plum")
        _comment(_issue(project, "Team talk"), "plum")
        client = _key_client(guest)

        assert _ids(_search(client, workspace, q="plum")) == [f"SRC-{own.sequence_id}"]

        Project.objects.filter(pk=project.pk).update(guest_view_all_features=True)
        found = set(_ids(_search(client, workspace, q="plum")))
        assert {f"SRC-{own.sequence_id}", f"SRC-{others.sequence_id}"} <= found and len(found) == 3

    def test_outside_the_workspace(self, workspace, project):
        _issue(project, "Grape")
        response = _search(_key_client(_make_user("outsider")), workspace, q="grape")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_is_not_allowed(self, api_key_client, workspace, project):
        response = api_key_client.get(URL.format(slug=workspace.slug), {"q": "grape"})
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.contract
class TestParameters:
    @pytest.mark.parametrize(
        "body",
        [
            {},
            {"q": "ab"},
            {"q": "  ab  "},
            {"q": "x" * 201},
            {"q": 123},
            {"q": "valid", "limit": 0},
            {"q": "valid", "limit": 101},
            {"q": "valid", "limit": "many"},
            {"q": "valid", "limit": True},
            {"q": "valid", "archived": "no"},
            {"q": "valid", "project": 5},
        ],
    )
    def test_bad_parameters(self, api_key_client, workspace, project, body):
        response = api_key_client.post(URL.format(slug=workspace.slug), body, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["error"]

    def test_short_phrase_message(self, api_key_client, workspace, project):
        response = _search(api_key_client, workspace, q="ab")
        assert response.json() == {"error": "q must be at least 3 characters"}

    def test_non_object_body(self, api_key_client, workspace, project):
        response = api_key_client.post(URL.format(slug=workspace.slug), ["q"], format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_limit_default_and_has_more(self, api_key_client, workspace, project):
        for n in range(25):
            _issue(project, f"Melon {n}")
        data = _search(api_key_client, workspace, q="melon").json()
        assert data["limit"] == 20 and len(data["results"]) == 20
        assert data["total"] == 25 and data["has_more"] is True

        data = _search(api_key_client, workspace, q="melon", limit="5").json()
        assert len(data["results"]) == 5

        data = _search(api_key_client, workspace, q="melon", limit=100).json()
        assert len(data["results"]) == 25 and data["has_more"] is False


@pytest.mark.contract
class TestRequestLog:
    def test_search_is_logged_without_query_body_and_response(self, api_key_client, workspace, project):
        _issue(project, "Logged peach", "peach text")
        with mock.patch("plane.middleware.logger.process_logs") as process_logs:
            response = _search(api_key_client, workspace, q="peach")
        assert response.status_code == status.HTTP_200_OK
        log_data = process_logs.delay.call_args.kwargs["log_data"]
        assert log_data["path"] == URL.format(slug=workspace.slug)
        assert log_data["method"] == "POST" and log_data["response_code"] == 200
        assert log_data["query_params"] == "" and log_data["body"] is None and log_data["response_body"] is None

    def test_other_routes_are_logged_as_before(self, api_key_client, workspace, project):
        with mock.patch("plane.middleware.logger.process_logs") as process_logs:
            response = api_key_client.get(f"/api/v1/workspaces/{workspace.slug}/projects/", {"per_page": 5})
        assert response.status_code == status.HTTP_200_OK
        log_data = process_logs.delay.call_args.kwargs["log_data"]
        assert log_data["query_params"] == "per_page=5" and log_data["response_body"]


@pytest.mark.slow
@pytest.mark.contract
@pytest.mark.skipif(
    os.environ.get("LIVIERE_SEARCH_BENCH") != "1", reason="timing run; set LIVIERE_SEARCH_BENCH=1 to measure"
)
def test_timing_on_1000_work_items_and_3000_comments(api_key_client, workspace, project, create_user):
    """Response times, printed in ms (median of 5); the assertion is only a safety net."""
    state = State.objects.get(project=project, default=True)
    words = ["backup", "deploy", "invoice", "server", "review", "release", "client", "report", "login", "cache"]
    issues = Issue.objects.bulk_create(
        [
            Issue(
                project=project,
                workspace=workspace,
                state=state,
                sequence_id=n + 1,
                name=f"Task {n} {words[n % 10]}",
                description_html="<p>x</p>",
                description_stripped=(f"Notes about the {words[(n * 3) % 10]} work. " * 12)
                + ("rarebird" if n == 777 else ""),
                created_by=create_user,
            )
            for n in range(1000)
        ]
    )
    IssueComment.objects.bulk_create(
        [
            IssueComment(
                issue=issue,
                project=project,
                workspace=workspace,
                actor=create_user,
                comment_html="<p>x</p>",
                comment_stripped=(f"Comment {k} on the {words[(i + k) % 10]} part. " * 6)
                + ("only in a comment: kingfisher" if (i, k) == (500, 2) else ""),
            )
            for i, issue in enumerate(issues)
            for k in range(3)
        ]
    )

    def median_ms(call):
        runs = []
        for _ in range(5):
            started = time.perf_counter()
            result = call()
            runs.append((time.perf_counter() - started) * 1000)
        return round(statistics.median(runs)), result

    timings, query_timings = {}, {}
    for phrase in ("rarebird", "deploy", "kingfisher"):
        ms, response = median_ms(lambda: _search(api_key_client, workspace, q=phrase, limit=100))
        assert response.status_code == status.HTTP_200_OK
        timings[phrase] = (ms, response.json()["total"])
        # The queries alone, without authentication, middleware and rendering
        query_timings[phrase], _ = median_ms(lambda: search(workspace.slug, create_user, phrase, limit=100))

    print(
        f"\nLIVIERE_SEARCH_BENCH 1000 work items, 3000 comments: request {timings} (phrase: (median ms, total)), "
        f"queries only {query_timings} (median ms)"
    )
    assert timings["rarebird"][1] == 1 and timings["kingfisher"][1] == 1
    assert all(ms < 3000 for ms, _ in timings.values())
