# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for external-API guest visibility scoping (WEB-9423).

Split from WEB-9422 (the plane-ee fix). On the external API
(``apps/api/plane/api/views/issue.py``), a restricted guest -- a project
member with the GUEST role on a project where ``guest_view_all_features`` is
disabled -- could self-issue a Personal API Token and then read every work
item in the project (and its comments, links, activity, attachments,
relations) via the external API, including work items they did not create.
The app-side API already enforces ``guest_view_all_features`` in 6+ views
(see GHSA-32c7-84jc-4w67 / WEB-8074 for a near-identical, already-fixed gap on
the app API); the external API never did.

The fix adds two small helpers next to the existing
``user_has_issue_permission`` in ``issue.py`` -- ``is_restricted_guest`` and
``guest_cannot_view_issue`` -- and uses them to:

* row-filter issue-level queries (list/total_count, external-id lookup,
  detail, identifier lookup, search, cycle/module issue lists) to
  ``created_by=request.user`` for restricted guests;
* deny whole sub-resource requests (links, comments, activities,
  attachments, relations) with 404 -- not 403, which would leak that the
  parent issue exists -- when the restricted guest cannot view the parent
  issue.

Bundled in the same change: ``IssueAttachmentListCreateAPIEndpoint.get`` had
no permission check at all (not even project membership) for any
authenticated user. That endpoint now requires project membership (or
issue-creator) in addition to the guest scoping above.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import (
    APIToken,
    Cycle,
    CycleIssue,
    FileAsset,
    Issue,
    IssueActivity,
    IssueComment,
    IssueLink,
    IssueRelation,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def project(db, workspace, create_user):
    """A project (guest_view_all_features defaults to False); the token
    holder behind ``api_key_client`` (``create_user``) is an admin member."""
    project = Project.objects.create(
        name="Scoped Project",
        identifier="SP9423",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    return project


@pytest.fixture
def state(db, workspace, project):
    return State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)


@pytest.fixture
def guest_user(db, workspace, project):
    """An active restricted project GUEST (role=5)."""
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"guest-{unique_id}@plane.so",
        username=f"guest_{unique_id}",
        first_name="Guest",
        last_name="User",
    )
    user.set_password("test-password")
    user.save()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=5, is_active=True)
    return user


@pytest.fixture
def guest_token(db, guest_user):
    return APIToken.objects.create(user=guest_user, label="Guest API Token")


@pytest.fixture
def guest_client(api_client, guest_token):
    """External-API client authenticated as the restricted guest."""
    api_client.credentials(HTTP_X_API_KEY=guest_token.token)
    return api_client


@pytest.fixture
def own_issue(db, workspace, project, state, guest_user):
    """An issue authored by the guest."""
    issue = Issue(name="Guest's own issue", workspace=workspace, project=project, state=state)
    issue.save(created_by_id=guest_user.id)
    return issue


@pytest.fixture
def foreign_issue(db, workspace, project, state, create_user):
    """An issue authored by the admin, not the guest."""
    issue = Issue(name="Someone else's issue", workspace=workspace, project=project, state=state)
    issue.save(created_by_id=create_user.id)
    return issue


def _enable_guest_view_all(project):
    project.guest_view_all_features = True
    project.save(update_fields=["guest_view_all_features"])


# ---------------------------------------------------------------------------
# 1. Work item list -- IssueListCreateAPIEndpoint.get (list branch)
# ---------------------------------------------------------------------------


def _list_url(workspace, project):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/"


@pytest.mark.contract
class TestWorkItemListGuestScope:
    @pytest.mark.django_db
    def test_guest_list_excludes_foreign_issue(self, guest_client, workspace, project, own_issue, foreign_issue):
        response = guest_client.get(_list_url(workspace, project))
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        ids = {str(row["id"]) for row in response.data["results"]}
        assert str(own_issue.id) in ids
        assert str(foreign_issue.id) not in ids

    @pytest.mark.django_db
    def test_guest_list_total_count_reflects_guest_scope(
        self, guest_client, workspace, project, own_issue, foreign_issue
    ):
        """The reporter specifically flagged that total_count must reflect
        the narrowed count, not the project's full issue count."""
        response = guest_client.get(_list_url(workspace, project))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_count"] == 1, response.data

    @pytest.mark.django_db
    def test_guest_with_view_all_sees_everything(self, guest_client, workspace, project, own_issue, foreign_issue):
        _enable_guest_view_all(project)
        response = guest_client.get(_list_url(workspace, project))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data["results"]}
        assert {str(own_issue.id), str(foreign_issue.id)} <= ids
        assert response.data["total_count"] == 2

    @pytest.mark.django_db
    def test_admin_sees_everything(self, api_key_client, workspace, project, own_issue, foreign_issue):
        response = api_key_client.get(_list_url(workspace, project))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data["results"]}
        assert {str(own_issue.id), str(foreign_issue.id)} <= ids
        assert response.data["total_count"] == 2


# ---------------------------------------------------------------------------
# 2. Work item list by external_id/external_source -- same endpoint, other branch
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestWorkItemExternalIdLookupGuestScope:
    @pytest.fixture(autouse=True)
    def _tag_external_ids(self, own_issue, foreign_issue):
        own_issue.external_id = "own-ext-id"
        own_issue.external_source = "jira"
        own_issue.save(update_fields=["external_id", "external_source"])
        foreign_issue.external_id = "foreign-ext-id"
        foreign_issue.external_source = "jira"
        foreign_issue.save(update_fields=["external_id", "external_source"])

    def _url(self, workspace, project, external_id):
        return (
            f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/"
            f"?external_id={external_id}&external_source=jira"
        )

    @pytest.mark.django_db
    def test_guest_denied_foreign_issue_by_external_id(self, guest_client, workspace, project, foreign_issue):
        response = guest_client.get(self._url(workspace, project, "foreign-ext-id"))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_own_issue_by_external_id(self, guest_client, workspace, project, own_issue):
        response = guest_client.get(self._url(workspace, project, "own-ext-id"))
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(own_issue.id)

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_foreign_issue_by_external_id(
        self, guest_client, workspace, project, foreign_issue
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(self._url(workspace, project, "foreign-ext-id"))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_foreign_issue_by_external_id(self, api_key_client, workspace, project, foreign_issue):
        response = api_key_client.get(self._url(workspace, project, "foreign-ext-id"))
        assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# 3. Work item detail -- IssueDetailAPIEndpoint.get
# ---------------------------------------------------------------------------


def _detail_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/"


@pytest.mark.contract
class TestWorkItemDetailGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_foreign_issue_detail(self, guest_client, workspace, project, foreign_issue):
        response = guest_client.get(_detail_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_own_issue_detail(self, guest_client, workspace, project, own_issue):
        response = guest_client.get(_detail_url(workspace, project, own_issue))
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(own_issue.id)

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_foreign_issue_detail(
        self, guest_client, workspace, project, foreign_issue
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_detail_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_foreign_issue_detail(self, api_key_client, workspace, project, foreign_issue):
        response = api_key_client.get(_detail_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# 4. Work item by identifier -- WorkspaceIssueAPIEndpoint.get
# ---------------------------------------------------------------------------


def _by_identifier_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/issues/{project.identifier}-{issue.sequence_id}/"


@pytest.mark.contract
class TestWorkItemByIdentifierGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_foreign_issue_by_identifier(self, guest_client, workspace, project, foreign_issue):
        response = guest_client.get(_by_identifier_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_own_issue_by_identifier(self, guest_client, workspace, project, own_issue):
        response = guest_client.get(_by_identifier_url(workspace, project, own_issue))
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(own_issue.id)

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_foreign_issue_by_identifier(
        self, guest_client, workspace, project, foreign_issue
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_by_identifier_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_foreign_issue_by_identifier(self, api_key_client, workspace, project, foreign_issue):
        response = api_key_client.get(_by_identifier_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# 5. Work item search -- IssueSearchEndpoint.get
# ---------------------------------------------------------------------------


def _search_url(workspace, query):
    return f"/api/v1/workspaces/{workspace.slug}/issues/search/?search={query}"


@pytest.mark.contract
class TestWorkItemSearchGuestScope:
    @pytest.mark.django_db
    def test_guest_search_excludes_foreign_issue(self, guest_client, workspace, project, own_issue, foreign_issue):
        response = guest_client.get(_search_url(workspace, "issue"))
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        ids = {str(row["id"]) for row in response.data["issues"]}
        assert str(own_issue.id) in ids
        assert str(foreign_issue.id) not in ids

    @pytest.mark.django_db
    def test_guest_with_view_all_search_includes_foreign(
        self, guest_client, workspace, project, own_issue, foreign_issue
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_search_url(workspace, "issue"))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data["issues"]}
        assert {str(own_issue.id), str(foreign_issue.id)} <= ids

    @pytest.mark.django_db
    def test_admin_search_includes_foreign(self, api_key_client, workspace, project, own_issue, foreign_issue):
        response = api_key_client.get(_search_url(workspace, "issue"))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data["issues"]}
        assert {str(own_issue.id), str(foreign_issue.id)} <= ids

    @pytest.mark.django_db
    def test_mixed_member_and_restricted_guest_scopes_search_by_project(
        self, api_client, workspace, project, create_user, state, own_issue, foreign_issue
    ):
        """One user: Member on project A, restricted Guest on project B.
        Workspace-wide search must return every issue in A, only their own
        issue in B, and nothing from project C, where they aren't a member."""
        unique_id = uuid4().hex[:8]
        mixed_user = User.objects.create(email=f"mixed-{unique_id}@plane.so", username=f"mixed_{unique_id}")
        mixed_user.set_password("test-password")
        mixed_user.save()
        WorkspaceMember.objects.create(workspace=workspace, member=mixed_user, role=15)

        # Project A: mixed_user is a plain Member -- sees every issue there,
        # including ones authored by someone else.
        project_a = Project.objects.create(
            name="Member Project", identifier="MP9423", workspace=workspace, created_by=create_user
        )
        ProjectMember.objects.create(
            project=project_a, member=mixed_user, workspace=workspace, role=15, is_active=True
        )
        state_a = State.objects.create(
            name="Todo", project=project_a, workspace=workspace, group="backlog", default=True
        )
        project_a_issue = Issue(
            name="Project A issue authored by someone else", workspace=workspace, project=project_a, state=state_a
        )
        project_a_issue.save(created_by_id=create_user.id)

        # Project B: mixed_user is a restricted Guest (reuses the `project`
        # fixture, which defaults guest_view_all_features to False).
        ProjectMember.objects.create(project=project, member=mixed_user, workspace=workspace, role=5, is_active=True)
        own_issue_in_b = Issue(
            name="Project B issue authored by the mixed user", workspace=workspace, project=project, state=state
        )
        own_issue_in_b.save(created_by_id=mixed_user.id)

        # Project C: mixed_user is not a member at all.
        project_c = Project.objects.create(
            name="Outside Project", identifier="OP9423", workspace=workspace, created_by=create_user
        )
        state_c = State.objects.create(
            name="Todo", project=project_c, workspace=workspace, group="backlog", default=True
        )
        project_c_issue = Issue(
            name="Project C issue, not a member", workspace=workspace, project=project_c, state=state_c
        )
        project_c_issue.save(created_by_id=create_user.id)

        token = APIToken.objects.create(user=mixed_user, label="Mixed User Token")
        api_client.credentials(HTTP_X_API_KEY=token.token)

        response = api_client.get(_search_url(workspace, "issue"))
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        ids = {str(row["id"]) for row in response.data["issues"]}

        assert str(project_a_issue.id) in ids
        assert str(own_issue_in_b.id) in ids
        assert str(foreign_issue.id) not in ids
        assert str(project_c_issue.id) not in ids


# ---------------------------------------------------------------------------
# 6/7. Work item links -- IssueLinkListCreateAPIEndpoint / IssueLinkDetailAPIEndpoint
# ---------------------------------------------------------------------------


@pytest.fixture
def own_link(db, workspace, project, own_issue):
    return IssueLink.objects.create(
        workspace=workspace, project=project, issue=own_issue, url="https://example.com/own", title="Own link"
    )


@pytest.fixture
def foreign_link(db, workspace, project, foreign_issue):
    return IssueLink.objects.create(
        workspace=workspace,
        project=project,
        issue=foreign_issue,
        url="https://example.com/foreign",
        title="Foreign link",
    )


def _links_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/links/"


def _link_detail_url(workspace, project, issue, link):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/links/{link.id}/"


@pytest.mark.contract
class TestWorkItemLinksGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_links_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_link
    ):
        response = guest_client.get(_links_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_links_on_own_issue(self, guest_client, workspace, project, own_issue, own_link):
        response = guest_client.get(_links_url(workspace, project, own_issue))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data["results"]}
        assert str(own_link.id) in ids

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_links_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_link
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_links_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_links_on_foreign_issue(
        self, api_key_client, workspace, project, foreign_issue, foreign_link
    ):
        response = api_key_client.get(_links_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.contract
class TestWorkItemLinkDetailGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_link_detail_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_link
    ):
        response = guest_client.get(_link_detail_url(workspace, project, foreign_issue, foreign_link))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_link_detail_on_own_issue(self, guest_client, workspace, project, own_issue, own_link):
        response = guest_client.get(_link_detail_url(workspace, project, own_issue, own_link))
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(own_link.id)

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_link_detail_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_link
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_link_detail_url(workspace, project, foreign_issue, foreign_link))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_link_detail_on_foreign_issue(
        self, api_key_client, workspace, project, foreign_issue, foreign_link
    ):
        response = api_key_client.get(_link_detail_url(workspace, project, foreign_issue, foreign_link))
        assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# 8/9. Work item comments -- IssueCommentListCreateAPIEndpoint / IssueCommentDetailAPIEndpoint
# ---------------------------------------------------------------------------


@pytest.fixture
def own_comment(db, workspace, project, own_issue, guest_user):
    return IssueComment.objects.create(
        workspace=workspace,
        project=project,
        issue=own_issue,
        actor=guest_user,
        comment_html="<p>Guest's own comment</p>",
        access="INTERNAL",
    )


@pytest.fixture
def foreign_comment(db, workspace, project, foreign_issue, create_user):
    """An INTERNAL comment on the foreign issue -- the ticket specifically
    calls out INTERNAL comments as in-scope (IssueComment.access is not an
    ACL anywhere in this codebase; the guest-scoping here is per-issue, not
    per-comment-access)."""
    return IssueComment.objects.create(
        workspace=workspace,
        project=project,
        issue=foreign_issue,
        actor=create_user,
        comment_html="<p>Internal comment on someone else's issue</p>",
        access="INTERNAL",
    )


def _comments_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/comments/"


def _comment_detail_url(workspace, project, issue, comment):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/comments/{comment.id}/"


@pytest.mark.contract
class TestWorkItemCommentsGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_comments_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_comment
    ):
        response = guest_client.get(_comments_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_comments_on_own_issue(self, guest_client, workspace, project, own_issue, own_comment):
        response = guest_client.get(_comments_url(workspace, project, own_issue))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data["results"]}
        assert str(own_comment.id) in ids

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_comments_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_comment
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_comments_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_comments_on_foreign_issue(
        self, api_key_client, workspace, project, foreign_issue, foreign_comment
    ):
        response = api_key_client.get(_comments_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_404s_on_nonexistent_issue_id(self, api_key_client, workspace, project):
        """Incidental, reviewed behavior change (all roles): a syntactically
        valid but nonexistent issue_id now 404s instead of 200 + []."""
        bogus_issue_id = uuid4()
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{bogus_issue_id}/comments/"
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"


@pytest.mark.contract
class TestWorkItemCommentDetailGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_comment_detail_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_comment
    ):
        response = guest_client.get(_comment_detail_url(workspace, project, foreign_issue, foreign_comment))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_comment_detail_on_own_issue(
        self, guest_client, workspace, project, own_issue, own_comment
    ):
        response = guest_client.get(_comment_detail_url(workspace, project, own_issue, own_comment))
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(own_comment.id)

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_comment_detail_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_comment
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_comment_detail_url(workspace, project, foreign_issue, foreign_comment))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_comment_detail_on_foreign_issue(
        self, api_key_client, workspace, project, foreign_issue, foreign_comment
    ):
        response = api_key_client.get(_comment_detail_url(workspace, project, foreign_issue, foreign_comment))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_404s_on_nonexistent_issue_id(self, api_key_client, workspace, project, foreign_comment):
        """Incidental, reviewed behavior change (all roles): a syntactically
        valid but nonexistent issue_id now 404s instead of 200 + []."""
        bogus_issue_id = uuid4()
        url = (
            f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{bogus_issue_id}"
            f"/comments/{foreign_comment.id}/"
        )
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"


# ---------------------------------------------------------------------------
# 10/11. Work item activities -- IssueActivityListAPIEndpoint / IssueActivityDetailAPIEndpoint
# ---------------------------------------------------------------------------


@pytest.fixture
def own_activity(db, workspace, project, own_issue, guest_user):
    return IssueActivity.objects.create(
        workspace=workspace, project=project, issue=own_issue, actor=guest_user, field="name", verb="updated"
    )


@pytest.fixture
def foreign_activity(db, workspace, project, foreign_issue, create_user):
    return IssueActivity.objects.create(
        workspace=workspace, project=project, issue=foreign_issue, actor=create_user, field="name", verb="updated"
    )


def _activities_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/activities/"


def _activity_detail_url(workspace, project, issue, activity):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/activities/{activity.id}/"


@pytest.mark.contract
class TestWorkItemActivitiesGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_activities_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_activity
    ):
        response = guest_client.get(_activities_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_activities_on_own_issue(
        self, guest_client, workspace, project, own_issue, own_activity
    ):
        response = guest_client.get(_activities_url(workspace, project, own_issue))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data["results"]}
        assert str(own_activity.id) in ids

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_activities_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_activity
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_activities_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_activities_on_foreign_issue(
        self, api_key_client, workspace, project, foreign_issue, foreign_activity
    ):
        response = api_key_client.get(_activities_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.contract
class TestWorkItemActivityDetailGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_activity_detail_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_activity
    ):
        response = guest_client.get(_activity_detail_url(workspace, project, foreign_issue, foreign_activity))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_activity_detail_on_own_issue(
        self, guest_client, workspace, project, own_issue, own_activity
    ):
        response = guest_client.get(_activity_detail_url(workspace, project, own_issue, own_activity))
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(own_activity.id)

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_activity_detail_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_activity
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_activity_detail_url(workspace, project, foreign_issue, foreign_activity))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_activity_detail_on_foreign_issue(
        self, api_key_client, workspace, project, foreign_issue, foreign_activity
    ):
        response = api_key_client.get(_activity_detail_url(workspace, project, foreign_issue, foreign_activity))
        assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# 12/13. Work item attachments -- IssueAttachmentListCreateAPIEndpoint / IssueAttachmentDetailAPIEndpoint
# ---------------------------------------------------------------------------


def _make_attachment(workspace, project, issue, created_by):
    return FileAsset.objects.create(
        attributes={"name": "f.txt", "type": "text/plain", "size": 10},
        asset="f.txt",
        size=10,
        workspace=workspace,
        project=project,
        issue=issue,
        created_by=created_by,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        is_uploaded=True,
    )


@pytest.fixture
def own_attachment(db, workspace, project, own_issue, guest_user):
    return _make_attachment(workspace, project, own_issue, guest_user)


@pytest.fixture
def foreign_attachment(db, workspace, project, foreign_issue, create_user):
    return _make_attachment(workspace, project, foreign_issue, create_user)


def _attachments_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/issue-attachments/"


def _attachment_detail_url(workspace, project, issue, attachment):
    return (
        f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}"
        f"/issue-attachments/{attachment.id}/"
    )


@pytest.mark.contract
class TestWorkItemAttachmentsGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_attachments_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_attachment
    ):
        response = guest_client.get(_attachments_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_attachments_on_own_issue(
        self, guest_client, workspace, project, own_issue, own_attachment
    ):
        response = guest_client.get(_attachments_url(workspace, project, own_issue))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data}
        assert str(own_attachment.id) in ids

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_attachments_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_attachment
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_attachments_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_attachments_on_foreign_issue(
        self, api_key_client, workspace, project, foreign_issue, foreign_attachment
    ):
        response = api_key_client.get(_attachments_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_non_project_member_denied_attachments_list(self, api_client, db, workspace, project, foreign_issue):
        """Regression for the standalone finding: this endpoint previously had
        NO permission check at all -- any authenticated PAT holder, even a
        total stranger to the project, could list its attachments."""
        unique_id = uuid4().hex[:8]
        stranger = User.objects.create(email=f"stranger-{unique_id}@plane.so", username=f"stranger_{unique_id}")
        stranger.set_password("test-password")
        stranger.save()
        token = APIToken.objects.create(user=stranger, label="Stranger Token")
        api_client.credentials(HTTP_X_API_KEY=token.token)

        response = api_client.get(_attachments_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_403_FORBIDDEN, f"Got {response.status_code}: {response.data!r}"


@pytest.mark.contract
class TestWorkItemAttachmentDetailGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_attachment_detail_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_attachment
    ):
        response = guest_client.get(_attachment_detail_url(workspace, project, foreign_issue, foreign_attachment))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_guest_allowed_attachment_detail_on_own_issue(
        self, guest_client, workspace, project, own_issue, own_attachment
    ):
        response = guest_client.get(_attachment_detail_url(workspace, project, own_issue, own_attachment))
        assert response.status_code == status.HTTP_302_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_attachment_detail_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, foreign_attachment
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_attachment_detail_url(workspace, project, foreign_issue, foreign_attachment))
        assert response.status_code == status.HTTP_302_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_admin_allowed_attachment_detail_on_foreign_issue(
        self, api_key_client, workspace, project, foreign_issue, foreign_attachment
    ):
        response = api_key_client.get(_attachment_detail_url(workspace, project, foreign_issue, foreign_attachment))
        assert response.status_code == status.HTTP_302_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_denied_cross_parent_attachment(
        self, guest_client, workspace, project, own_issue, foreign_attachment
    ):
        """The asset lookup was bound to workspace/project only, not issue_id.
        A guest could pair their own authorized issue_id with a foreign
        issue's attachment pk in the same project and still get the download."""
        response = guest_client.get(_attachment_detail_url(workspace, project, own_issue, foreign_attachment))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_admin_denied_cross_parent_attachment(
        self, api_key_client, workspace, project, own_issue, foreign_attachment
    ):
        """Even a non-guest (admin/member) must not be able to download an
        attachment belonging to a different issue by pairing an authorized
        issue_id with a foreign attachment pk."""
        response = api_key_client.get(_attachment_detail_url(workspace, project, own_issue, foreign_attachment))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )


@pytest.mark.contract
class TestWorkItemAttachmentWriteGuestScope:
    """delete/patch had the same unbound FileAsset lookup as .get(): no
    issue_id/entity_type filter. A caller could pair an authorized issue_id
    with a foreign issue's attachment pk to delete or modify its metadata."""

    @pytest.mark.django_db
    def test_guest_denied_cross_parent_delete(self, guest_client, workspace, project, own_issue, foreign_attachment):
        response = guest_client.delete(_attachment_detail_url(workspace, project, own_issue, foreign_attachment))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        foreign_attachment.refresh_from_db()
        assert foreign_attachment.is_deleted is False

    @pytest.mark.django_db
    def test_guest_denied_cross_parent_patch(self, guest_client, workspace, project, own_issue, foreign_attachment):
        response = guest_client.patch(
            _attachment_detail_url(workspace, project, own_issue, foreign_attachment),
            data={"is_uploaded": True},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_admin_denied_cross_parent_delete(
        self, api_key_client, workspace, project, own_issue, foreign_attachment
    ):
        """Non-guest callers are affected too -- the unbound lookup was not a
        guest-only gap."""
        response = api_key_client.delete(_attachment_detail_url(workspace, project, own_issue, foreign_attachment))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        foreign_attachment.refresh_from_db()
        assert foreign_attachment.is_deleted is False

    @pytest.mark.django_db
    def test_admin_denied_cross_parent_patch(self, api_key_client, workspace, project, own_issue, foreign_attachment):
        response = api_key_client.patch(
            _attachment_detail_url(workspace, project, own_issue, foreign_attachment),
            data={"is_uploaded": True},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_guest_allowed_delete_on_own_issue_own_attachment(
        self, guest_client, workspace, project, own_issue, own_attachment
    ):
        """Positive control: same-issue delete still works after scoping."""
        response = guest_client.delete(_attachment_detail_url(workspace, project, own_issue, own_attachment))
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        own_attachment.refresh_from_db()
        assert own_attachment.is_deleted is True

    @pytest.mark.django_db
    def test_guest_allowed_patch_on_own_issue_own_attachment(
        self, guest_client, workspace, project, own_issue, own_attachment
    ):
        """Positive control: same-issue patch still works after scoping."""
        response = guest_client.patch(
            _attachment_detail_url(workspace, project, own_issue, own_attachment),
            data={"is_uploaded": True},
            format="json",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_admin_allowed_delete_on_foreign_issue_own_attachment(
        self, api_key_client, workspace, project, foreign_issue, foreign_attachment
    ):
        """Positive control, non-guest: a correctly-paired issue_id/pk on the
        same issue still works."""
        response = api_key_client.delete(
            _attachment_detail_url(workspace, project, foreign_issue, foreign_attachment)
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_admin_allowed_patch_on_foreign_issue_own_attachment(
        self, api_key_client, workspace, project, foreign_issue, foreign_attachment
    ):
        response = api_key_client.patch(
            _attachment_detail_url(workspace, project, foreign_issue, foreign_attachment),
            data={"is_uploaded": True},
            format="json",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_guest_denied_matching_foreign_parent_delete(
        self, guest_client, workspace, project, foreign_issue, foreign_attachment
    ):
        """A restricted guest supplying a foreign issue's own, correctly
        matched issue_id/attachment pair must still be denied -- guest
        visibility on the parent issue needs checking too."""
        response = guest_client.delete(_attachment_detail_url(workspace, project, foreign_issue, foreign_attachment))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        foreign_attachment.refresh_from_db()
        assert foreign_attachment.is_deleted is False

    @pytest.mark.django_db
    def test_guest_denied_matching_foreign_parent_patch(
        self, guest_client, workspace, project, foreign_issue, foreign_attachment
    ):
        response = guest_client.patch(
            _attachment_detail_url(workspace, project, foreign_issue, foreign_attachment),
            data={"is_uploaded": True},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_matching_foreign_parent_delete(
        self, guest_client, workspace, project, foreign_issue, foreign_attachment
    ):
        """Positive control: guest_view_all_features=True lifts the new
        check, same as everywhere else it's applied."""
        _enable_guest_view_all(project)
        response = guest_client.delete(_attachment_detail_url(workspace, project, foreign_issue, foreign_attachment))
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        foreign_attachment.refresh_from_db()
        assert foreign_attachment.is_deleted is True

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_matching_foreign_parent_patch(
        self, guest_client, workspace, project, foreign_issue, foreign_attachment
    ):
        _enable_guest_view_all(project)
        response = guest_client.patch(
            _attachment_detail_url(workspace, project, foreign_issue, foreign_attachment),
            data={"is_uploaded": True},
            format="json",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )


# ---------------------------------------------------------------------------
# 12b. Work item attachment create -- IssueAttachmentListCreateAPIEndpoint.post
# ---------------------------------------------------------------------------

# .post checked user_has_issue_permission (which admits GUEST) but never
# guest_cannot_view_issue -- a restricted guest could request an upload URL
# for a foreign issue by UUID.


def _attachment_create_payload():
    return {"name": "f.txt", "type": "text/plain", "size": 10}


@pytest.mark.contract
class TestWorkItemAttachmentCreateGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_create_on_foreign_issue(self, guest_client, workspace, project, foreign_issue):
        response = guest_client.post(
            _attachments_url(workspace, project, foreign_issue),
            data=_attachment_create_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not FileAsset.objects.filter(issue_id=foreign_issue.id).exists()

    @pytest.mark.django_db
    @mock.patch("plane.api.views.issue.S3Storage")
    def test_guest_allowed_create_on_own_issue(self, s3, guest_client, workspace, project, own_issue):
        s3.return_value.generate_presigned_post.return_value = {}
        response = guest_client.post(
            _attachments_url(workspace, project, own_issue),
            data=_attachment_create_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert FileAsset.objects.filter(
            issue_id=own_issue.id, entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT
        ).exists()

    @pytest.mark.django_db
    @mock.patch("plane.api.views.issue.S3Storage")
    def test_guest_with_view_all_allowed_create_on_foreign_issue(
        self, s3, guest_client, workspace, project, foreign_issue
    ):
        s3.return_value.generate_presigned_post.return_value = {}
        _enable_guest_view_all(project)
        response = guest_client.post(
            _attachments_url(workspace, project, foreign_issue),
            data=_attachment_create_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    @mock.patch("plane.api.views.issue.S3Storage")
    def test_admin_allowed_create_on_foreign_issue(self, s3, api_key_client, workspace, project, foreign_issue):
        s3.return_value.generate_presigned_post.return_value = {}
        response = api_key_client.post(
            _attachments_url(workspace, project, foreign_issue),
            data=_attachment_create_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )


# ---------------------------------------------------------------------------
# 14. Work item relations -- IssueRelationListCreateAPIEndpoint.get
# ---------------------------------------------------------------------------


@pytest.fixture
def issue_relation(db, workspace, project, own_issue, foreign_issue):
    return IssueRelation.objects.create(
        workspace=workspace,
        project=project,
        issue=foreign_issue,
        related_issue=own_issue,
        relation_type="relates_to",
    )


def _relations_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/relations/"


@pytest.mark.contract
class TestWorkItemRelationsGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_relations_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, issue_relation
    ):
        response = guest_client.get(_relations_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_relations_on_own_issue(
        self, guest_client, workspace, project, own_issue, issue_relation
    ):
        response = guest_client.get(_relations_url(workspace, project, own_issue))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_relations_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue, issue_relation
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_relations_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_relations_on_foreign_issue(
        self, api_key_client, workspace, project, foreign_issue, issue_relation
    ):
        response = api_key_client.get(_relations_url(workspace, project, foreign_issue))
        assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# 15. Cycle issue list -- CycleIssueListCreateAPIEndpoint.get
# ---------------------------------------------------------------------------


@pytest.fixture
def cycle(db, workspace, project, create_user):
    return Cycle.objects.create(name="Cycle 1", project=project, workspace=workspace, owned_by=create_user)


@pytest.fixture
def cycle_memberships(db, workspace, project, cycle, own_issue, foreign_issue):
    CycleIssue.objects.create(workspace=workspace, project=project, cycle=cycle, issue=own_issue)
    CycleIssue.objects.create(workspace=workspace, project=project, cycle=cycle, issue=foreign_issue)


def _cycle_issues_url(workspace, project, cycle):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/cycles/{cycle.id}/cycle-issues/"


@pytest.mark.contract
class TestCycleIssueListGuestScope:
    @pytest.mark.django_db
    def test_guest_excludes_foreign_issue(
        self, guest_client, workspace, project, cycle, cycle_memberships, own_issue, foreign_issue
    ):
        response = guest_client.get(_cycle_issues_url(workspace, project, cycle))
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        ids = {str(row["id"]) for row in response.data["results"]}
        assert str(own_issue.id) in ids
        assert str(foreign_issue.id) not in ids

    @pytest.mark.django_db
    def test_guest_with_view_all_sees_everything(
        self, guest_client, workspace, project, cycle, cycle_memberships, own_issue, foreign_issue
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_cycle_issues_url(workspace, project, cycle))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data["results"]}
        assert {str(own_issue.id), str(foreign_issue.id)} <= ids

    @pytest.mark.django_db
    def test_admin_sees_everything(
        self, api_key_client, workspace, project, cycle, cycle_memberships, own_issue, foreign_issue
    ):
        response = api_key_client.get(_cycle_issues_url(workspace, project, cycle))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data["results"]}
        assert {str(own_issue.id), str(foreign_issue.id)} <= ids


# ---------------------------------------------------------------------------
# 16. Module issue list -- ModuleIssueListCreateAPIEndpoint.get
# ---------------------------------------------------------------------------


@pytest.fixture
def module(db, workspace, project):
    return Module.objects.create(name="Module 1", project=project, workspace=workspace)


@pytest.fixture
def module_memberships(db, workspace, project, module, own_issue, foreign_issue):
    ModuleIssue.objects.create(workspace=workspace, project=project, module=module, issue=own_issue)
    ModuleIssue.objects.create(workspace=workspace, project=project, module=module, issue=foreign_issue)


def _module_issues_url(workspace, project, module):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/modules/{module.id}/module-issues/"


@pytest.mark.contract
class TestModuleIssueListGuestScope:
    @pytest.mark.django_db
    def test_guest_excludes_foreign_issue(
        self, guest_client, workspace, project, module, module_memberships, own_issue, foreign_issue
    ):
        response = guest_client.get(_module_issues_url(workspace, project, module))
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        ids = {str(row["id"]) for row in response.data["results"]}
        assert str(own_issue.id) in ids
        assert str(foreign_issue.id) not in ids

    @pytest.mark.django_db
    def test_guest_with_view_all_sees_everything(
        self, guest_client, workspace, project, module, module_memberships, own_issue, foreign_issue
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_module_issues_url(workspace, project, module))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data["results"]}
        assert {str(own_issue.id), str(foreign_issue.id)} <= ids

    @pytest.mark.django_db
    def test_admin_sees_everything(
        self, api_key_client, workspace, project, module, module_memberships, own_issue, foreign_issue
    ):
        response = api_key_client.get(_module_issues_url(workspace, project, module))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["id"]) for row in response.data["results"]}
        assert {str(own_issue.id), str(foreign_issue.id)} <= ids


# ---------------------------------------------------------------------------
# 17/18. Work item comment writes -- IssueCommentDetailAPIEndpoint.patch/delete
# ---------------------------------------------------------------------------
#
# ProjectLitePermission lets any active project member -- including a
# restricted guest -- reach patch/delete, which never checked
# guest_cannot_view_issue before mutating the comment.


def _comment_patch_payload():
    return {"comment_html": "<p>Edited by guest</p>"}


@pytest.mark.contract
class TestWorkItemCommentWriteGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_patch_on_foreign_issue_comment(
        self, guest_client, workspace, project, foreign_issue, foreign_comment
    ):
        response = guest_client.patch(
            _comment_detail_url(workspace, project, foreign_issue, foreign_comment),
            data=_comment_patch_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_denied_delete_on_foreign_issue_comment(
        self, guest_client, workspace, project, foreign_issue, foreign_comment
    ):
        response = guest_client.delete(_comment_detail_url(workspace, project, foreign_issue, foreign_comment))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"
        foreign_comment.refresh_from_db()

    @pytest.mark.django_db
    def test_guest_allowed_patch_on_own_issue_comment(self, guest_client, workspace, project, own_issue, own_comment):
        response = guest_client.patch(
            _comment_detail_url(workspace, project, own_issue, own_comment),
            data=_comment_patch_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        own_comment.refresh_from_db()
        assert "Edited by guest" in own_comment.comment_html

    @pytest.mark.django_db
    def test_guest_allowed_delete_on_own_issue_comment(
        self, guest_client, workspace, project, own_issue, own_comment
    ):
        response = guest_client.delete(_comment_detail_url(workspace, project, own_issue, own_comment))
        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"
        assert not IssueComment.objects.filter(pk=own_comment.pk).exists()

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_patch_on_foreign_issue_comment(
        self, guest_client, workspace, project, foreign_issue, foreign_comment
    ):
        _enable_guest_view_all(project)
        response = guest_client.patch(
            _comment_detail_url(workspace, project, foreign_issue, foreign_comment),
            data=_comment_patch_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_admin_allowed_patch_on_foreign_issue_comment(
        self, api_key_client, workspace, project, foreign_issue, foreign_comment
    ):
        response = api_key_client.patch(
            _comment_detail_url(workspace, project, foreign_issue, foreign_comment),
            data=_comment_patch_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_admin_allowed_delete_on_foreign_issue_comment(
        self, api_key_client, workspace, project, foreign_issue, foreign_comment
    ):
        response = api_key_client.delete(_comment_detail_url(workspace, project, foreign_issue, foreign_comment))
        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"


# ---------------------------------------------------------------------------
# 9b. Work item comment create -- IssueCommentListCreateAPIEndpoint.post
# ---------------------------------------------------------------------------

# .post never called get_queryset (the GET-side guest check) and
# ProjectLitePermission admits every active guest -- so a restricted guest
# could create a comment on a foreign issue by UUID.


def _comment_create_payload():
    return {"comment_html": "<p>New comment</p>"}


@pytest.mark.contract
class TestWorkItemCommentCreateGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_create_on_foreign_issue(self, guest_client, workspace, project, foreign_issue):
        response = guest_client.post(
            _comments_url(workspace, project, foreign_issue),
            data=_comment_create_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"
        assert not IssueComment.objects.filter(issue=foreign_issue).exists()

    @pytest.mark.django_db
    def test_guest_allowed_create_on_own_issue(self, guest_client, workspace, project, own_issue):
        response = guest_client.post(
            _comments_url(workspace, project, own_issue),
            data=_comment_create_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        assert IssueComment.objects.filter(issue=own_issue).exists()

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_create_on_foreign_issue(
        self, guest_client, workspace, project, foreign_issue
    ):
        _enable_guest_view_all(project)
        response = guest_client.post(
            _comments_url(workspace, project, foreign_issue),
            data=_comment_create_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_admin_allowed_create_on_foreign_issue(self, api_key_client, workspace, project, foreign_issue):
        response = api_key_client.post(
            _comments_url(workspace, project, foreign_issue),
            data=_comment_create_payload(),
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"


# ---------------------------------------------------------------------------
# 19. Module issue detail -- ModuleIssueDetailAPIEndpoint.get
# ---------------------------------------------------------------------------
#
# guest_cannot_view_issue was added here defensively, but the URL router
# for this path only ever exposes http_method_names=["delete"] -- GET is
# unreachable dead code, so the test below documents the 405 instead.


def _module_issue_detail_url(workspace, project, module, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/modules/{module.id}/module-issues/{issue.id}/"


@pytest.mark.contract
class TestModuleIssueDetailGuestScope:
    @pytest.mark.django_db
    def test_module_issue_detail_get_is_not_routed(
        self, guest_client, workspace, project, module, module_memberships, own_issue, foreign_issue
    ):
        """GET is not wired to module-issues-detail (only DELETE is), so this
        guarded method is not reachable and not an exploitable gap here."""
        own_response = guest_client.get(_module_issue_detail_url(workspace, project, module, own_issue))
        foreign_response = guest_client.get(_module_issue_detail_url(workspace, project, module, foreign_issue))
        assert own_response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED, own_response.data
        assert foreign_response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED, foreign_response.data


# ---------------------------------------------------------------------------
# 20. Cycle issue detail -- CycleIssueDetailAPIEndpoint.get
# ---------------------------------------------------------------------------


def _cycle_issue_detail_url(workspace, project, cycle, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/cycles/{cycle.id}/cycle-issues/{issue.id}/"


@pytest.mark.contract
class TestCycleIssueDetailGuestScope:
    @pytest.mark.django_db
    def test_guest_denied_foreign_cycle_issue_detail(
        self, guest_client, workspace, project, cycle, cycle_memberships, foreign_issue
    ):
        """CycleIssueDetailAPIEndpoint.get had no restricted-guest check at
        all -- only its list sibling was scoped."""
        response = guest_client.get(_cycle_issue_detail_url(workspace, project, cycle, foreign_issue))
        assert response.status_code == status.HTTP_404_NOT_FOUND, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_guest_allowed_own_cycle_issue_detail(
        self, guest_client, workspace, project, cycle, cycle_memberships, own_issue
    ):
        response = guest_client.get(_cycle_issue_detail_url(workspace, project, cycle, own_issue))
        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        assert str(response.data["issue"]) == str(own_issue.id)

    @pytest.mark.django_db
    def test_guest_with_view_all_allowed_foreign_cycle_issue_detail(
        self, guest_client, workspace, project, cycle, cycle_memberships, foreign_issue
    ):
        _enable_guest_view_all(project)
        response = guest_client.get(_cycle_issue_detail_url(workspace, project, cycle, foreign_issue))
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_admin_allowed_foreign_cycle_issue_detail(
        self, api_key_client, workspace, project, cycle, cycle_memberships, foreign_issue
    ):
        response = api_key_client.get(_cycle_issue_detail_url(workspace, project, cycle, foreign_issue))
        assert response.status_code == status.HTTP_200_OK
