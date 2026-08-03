# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for issue sub-resource scoping on comment + relation endpoints.

Regression coverage for GHSA-hvx3-58mp-5fpx (SECUR-243).

``ProjectEntityPermission`` / ``allow_permission`` validate only that the caller is
an active member of the URL's ``project_id``. Neither validates that the sibling
``issue_id`` path parameter belongs to that project or workspace, and four handlers
then used ``issue_id`` unscoped:

* ``IssueCommentViewSet.create`` — ``Issue.objects.get(pk=issue_id)``. The 201
  response serializes the foreign issue's full ``issue_detail`` (name, description,
  priority, dates, ``sequence_id``) back to the caller, so this is a cross-tenant
  *read* as well as a write.
* ``IssueRelationViewSet.create`` — the request-body ``issues`` were workspace-scoped
  but the URL ``issue_id`` used as the other side of the relation was not.
* ``IssueRelationViewSet.remove_relation`` — same gap on the delete path, found while
  reviewing the two above: workspace-scoped only, so a member of one project could
  delete relations belonging to a sibling project in the same workspace.
* ``IssueRelationViewSet.list`` — same gap on the read path, raised by Copilot on
  PR #9531: a member of project A could list the relations of an issue in project B of
  the same workspace and receive its ``name``, ``priority``, ``assignee_ids`` and
  ``label_ids``.

All four bind the lookup to ``workspace__slug`` + ``project_id`` (via
``relation.issue_in_project``) and 404 otherwise.
"""

from unittest import mock
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Issue,
    IssueComment,
    IssueRelation,
    Project,
    ProjectMember,
    User,
    Workspace,
    WorkspaceMember,
)


def comments_url(slug, project_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/comments/"


def relation_url(slug, project_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/issue-relation/"


def remove_relation_url(slug, project_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/remove-relation/"


@pytest.fixture(autouse=True)
def _no_activity(db):
    """Stub the deferred activity tasks (broker) and base_host (needs APP_BASE_URL /
    WEB_URL, unset in the test env) so the success paths run cleanly."""
    with (
        mock.patch("plane.app.views.issue.comment.issue_activity"),
        mock.patch("plane.app.views.issue.comment.model_activity"),
        mock.patch("plane.app.views.issue.comment.base_host", return_value="http://testserver"),
        mock.patch("plane.app.views.issue.relation.issue_activity"),
        mock.patch("plane.app.views.issue.relation.base_host", return_value="http://testserver"),
    ):
        yield


def _make_user(prefix):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"{prefix}-{unique_id}@plane.so",
        username=f"{prefix}_{unique_id}",
        first_name=prefix.title(),
        last_name="User",
    )
    user.set_password("test-password")
    user.save()
    return user


def _make_project(name, identifier, workspace, owner, members=()):
    project = Project.objects.create(name=name, identifier=identifier, workspace=workspace, created_by=owner)
    for member in members:
        ProjectMember.objects.create(project=project, member=member, workspace=workspace, role=20)
    return project


@pytest.fixture
def attacker(db):
    """A user with a workspace and project of their very own."""
    return _make_user("attacker")


@pytest.fixture
def attacker_workspace(db, attacker):
    workspace = Workspace.objects.create(
        name="Attacker Workspace", owner=attacker, slug=f"attacker-ws-{uuid4().hex[:8]}"
    )
    WorkspaceMember.objects.create(workspace=workspace, member=attacker, role=20)
    return workspace


@pytest.fixture
def attacker_project(db, attacker_workspace, attacker):
    return _make_project("Attacker Project", "ATK", attacker_workspace, attacker, [attacker])


@pytest.fixture
def attacker_issue(db, attacker_workspace, attacker_project):
    return Issue.objects.create(name="Attacker's own issue", project=attacker_project, workspace=attacker_workspace)


@pytest.fixture
def victim_workspace(db):
    """A completely separate tenant. The attacker is not a member."""
    owner = _make_user("victim")
    workspace = Workspace.objects.create(name="Victim Workspace", owner=owner, slug=f"victim-ws-{uuid4().hex[:8]}")
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20)
    workspace.owner_user = owner
    return workspace


@pytest.fixture
def victim_issue(db, victim_workspace):
    project = _make_project(
        "Victim Project",
        "VIC",
        victim_workspace,
        victim_workspace.owner_user,
        [victim_workspace.owner_user],
    )
    return Issue.objects.create(
        name="Confidential victim issue",
        description_html="<p>Secret roadmap detail</p>",
        priority="urgent",
        project=project,
        workspace=victim_workspace,
    )


@pytest.fixture
def sibling_project_issue(db, attacker_workspace, attacker):
    """An issue in a *different project of the attacker's own workspace* that the
    attacker is not a member of — the intra-workspace case."""
    other_owner = _make_user("colleague")
    WorkspaceMember.objects.create(workspace=attacker_workspace, member=other_owner, role=20)
    project = _make_project("Sibling Project", "SIB", attacker_workspace, other_owner, [other_owner])
    return Issue.objects.create(name="Sibling project issue", project=project, workspace=attacker_workspace)


@pytest.fixture
def attacker_client(attacker):
    client = APIClient()
    client.force_authenticate(user=attacker)
    return client


@pytest.mark.contract
class TestIssueCommentCreateScope:
    """``issue_id`` must belong to the URL project, or the request 404s."""

    @pytest.mark.django_db
    def test_rejects_cross_workspace_issue(self, attacker_client, attacker_workspace, attacker_project, victim_issue):
        url = comments_url(attacker_workspace.slug, attacker_project.id, victim_issue.id)
        response = attacker_client.post(url, {"comment_html": "<p>hi</p>"}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        # No comment may be planted on the foreign issue...
        assert not IssueComment.objects.filter(issue_id=victim_issue.id).exists()
        # ...and none of its private detail may leak back in the response.
        assert "Confidential victim issue" not in str(getattr(response, "data", ""))
        assert "Secret roadmap detail" not in str(getattr(response, "data", ""))

    @pytest.mark.django_db
    def test_rejects_same_workspace_other_project_issue(
        self, attacker_client, attacker_workspace, attacker_project, sibling_project_issue
    ):
        url = comments_url(attacker_workspace.slug, attacker_project.id, sibling_project_issue.id)
        response = attacker_client.post(url, {"comment_html": "<p>hi</p>"}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not IssueComment.objects.filter(issue_id=sibling_project_issue.id).exists()

    @pytest.mark.django_db
    def test_allows_own_project_issue(self, attacker_client, attacker_workspace, attacker_project, attacker_issue):
        """Positive control: commenting on an issue in the URL project still works."""
        url = comments_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.post(url, {"comment_html": "<p>hi</p>"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert IssueComment.objects.filter(issue_id=attacker_issue.id).exists()


@pytest.mark.contract
class TestIssueRelationCreateScope:
    """The URL side of the relation must belong to the URL project too."""

    @pytest.mark.django_db
    def test_rejects_cross_workspace_url_issue(
        self, attacker_client, attacker_workspace, attacker_project, attacker_issue, victim_issue
    ):
        url = relation_url(attacker_workspace.slug, attacker_project.id, victim_issue.id)
        response = attacker_client.post(
            url, {"relation_type": "blocking", "issues": [str(attacker_issue.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not IssueRelation.objects.filter(related_issue_id=victim_issue.id).exists()
        assert not IssueRelation.objects.filter(issue_id=victim_issue.id).exists()

    @pytest.mark.django_db
    def test_rejects_same_workspace_other_project_url_issue(
        self,
        attacker_client,
        attacker_workspace,
        attacker_project,
        attacker_issue,
        sibling_project_issue,
    ):
        url = relation_url(attacker_workspace.slug, attacker_project.id, sibling_project_issue.id)
        response = attacker_client.post(
            url, {"relation_type": "blocking", "issues": [str(attacker_issue.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not IssueRelation.objects.filter(related_issue_id=sibling_project_issue.id).exists()

    @pytest.mark.django_db
    def test_allows_relation_within_project(
        self, attacker_client, attacker_workspace, attacker_project, attacker_issue
    ):
        """Positive control: relating two issues inside the URL project still works."""
        other = Issue.objects.create(name="Second own issue", project=attacker_project, workspace=attacker_workspace)
        url = relation_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.post(url, {"relation_type": "blocking", "issues": [str(other.id)]}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert IssueRelation.objects.filter(issue_id=other.id, related_issue_id=attacker_issue.id).exists()


@pytest.mark.contract
class TestIssueRelationRemoveScope:
    """``remove_relation`` needs the same participant binding as ``create``.

    The relation row itself stays workspace-scoped — relations legitimately span
    projects and either participant may remove them — but the URL ``issue_id`` must
    belong to the URL project.
    """

    @pytest.mark.django_db
    def test_rejects_same_workspace_other_project_url_issue(
        self, attacker_client, attacker_workspace, attacker_project, sibling_project_issue
    ):
        """A relation wholly inside a sibling project must not be deletable."""
        sibling_project = sibling_project_issue.project
        other_sibling_issue = Issue.objects.create(
            name="Second sibling issue", project=sibling_project, workspace=attacker_workspace
        )
        relation = IssueRelation.objects.create(
            issue=other_sibling_issue,
            related_issue=sibling_project_issue,
            relation_type="blocked_by",
            project=sibling_project,
            workspace=attacker_workspace,
        )

        url = remove_relation_url(attacker_workspace.slug, attacker_project.id, sibling_project_issue.id)
        response = attacker_client.post(url, {"related_issue": str(other_sibling_issue.id)}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        relation.refresh_from_db()
        assert relation.deleted_at is None, "Deleted a sibling project's relation"

    @pytest.mark.django_db
    def test_missing_relation_404s_rather_than_500(
        self, attacker_client, attacker_workspace, attacker_project, attacker_issue
    ):
        """No matching relation used to hit ``None.delete()`` -> AttributeError -> 500."""
        url = remove_relation_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.post(url, {"related_issue": str(uuid4())}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_allows_removal_within_project(self, attacker_client, attacker_workspace, attacker_project, attacker_issue):
        """Positive control: removing a relation inside the URL project still works."""
        other = Issue.objects.create(name="Second own issue", project=attacker_project, workspace=attacker_workspace)
        relation = IssueRelation.objects.create(
            issue=other,
            related_issue=attacker_issue,
            relation_type="blocked_by",
            project=attacker_project,
            workspace=attacker_workspace,
        )

        url = remove_relation_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.post(url, {"related_issue": str(other.id)}, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        relation.refresh_from_db()
        assert relation.deleted_at is not None


@pytest.mark.contract
class TestIssueRelationListScope:
    """The read path needs the same binding as the writes.

    Raised by Copilot on PR #9531: ``list`` filtered relations on ``workspace__slug``
    only, so a member of project A could read the relations of an issue in project B of
    the same workspace — returning that issue's ``name``, ``priority``, ``assignee_ids``
    and ``label_ids``.
    """

    @pytest.mark.django_db
    def test_rejects_same_workspace_other_project_url_issue(
        self, attacker_client, attacker_workspace, attacker_project, sibling_project_issue
    ):
        sibling_project = sibling_project_issue.project
        related = Issue.objects.create(
            name="Sibling relation target", project=sibling_project, workspace=attacker_workspace
        )
        IssueRelation.objects.create(
            issue=related,
            related_issue=sibling_project_issue,
            relation_type="blocked_by",
            project=sibling_project,
            workspace=attacker_workspace,
        )

        url = relation_url(attacker_workspace.slug, attacker_project.id, sibling_project_issue.id)
        response = attacker_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {str(getattr(response, 'data', None))[:300]}"
        )
        assert "Sibling relation target" not in str(getattr(response, "data", ""))

    @pytest.mark.django_db
    def test_allows_listing_within_project(self, attacker_client, attacker_workspace, attacker_project, attacker_issue):
        """Positive control: listing an in-project issue's relations still works."""
        other = Issue.objects.create(name="Second own issue", project=attacker_project, workspace=attacker_workspace)
        IssueRelation.objects.create(
            issue=other,
            related_issue=attacker_issue,
            relation_type="blocked_by",
            project=attacker_project,
            workspace=attacker_workspace,
        )

        url = relation_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.get(url)

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert "Second own issue" in str(response.data), "In-project relation went missing"


@pytest.mark.contract
class TestIssueManagerBoundary:
    """Pin the one axis on which the two fixes deliberately differ.

    ``comment.py`` scopes with ``Issue.objects`` and ``relation.py`` with
    ``Issue.issue_objects``. ``IssueManager`` additionally excludes triage-state,
    archived and draft issues, so the choice is behavioural, not cosmetic: intake
    (triage) and archived issues must stay commentable, while the relation endpoints
    follow the ``issue_objects`` convention already used for the body ``issues`` list
    and by ``SubIssuesEndpoint``. Without these tests, "tidying" the two to match
    would silently break commenting on intake items.
    """

    @pytest.mark.django_db
    def test_comment_allowed_on_archived_issue(
        self, attacker_client, attacker_workspace, attacker_project, attacker_issue
    ):
        attacker_issue.archived_at = timezone.now().date()
        attacker_issue.save(update_fields=["archived_at"])

        url = comments_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.post(url, {"comment_html": "<p>hi</p>"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, (
            f"Archived issue must stay commentable, got {response.status_code}"
        )

    @pytest.mark.django_db
    def test_comment_allowed_on_draft_issue(
        self, attacker_client, attacker_workspace, attacker_project, attacker_issue
    ):
        attacker_issue.is_draft = True
        attacker_issue.save(update_fields=["is_draft"])

        url = comments_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.post(url, {"comment_html": "<p>hi</p>"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, (
            f"Draft issue must stay commentable, got {response.status_code}"
        )

    @pytest.mark.django_db
    def test_relation_create_excludes_archived_url_issue(
        self, attacker_client, attacker_workspace, attacker_project, attacker_issue
    ):
        """Documents the narrowing: ``issue_objects`` excludes archived issues."""
        other = Issue.objects.create(name="Second own issue", project=attacker_project, workspace=attacker_workspace)
        attacker_issue.archived_at = timezone.now().date()
        attacker_issue.save(update_fields=["archived_at"])

        url = relation_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.post(url, {"relation_type": "blocking", "issues": [str(other.id)]}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_relation_remove_excludes_archived_url_issue(
        self, attacker_client, attacker_workspace, attacker_project, attacker_issue
    ):
        """Same narrowing on the delete path (raised by Copilot on PR #9531)."""
        other = Issue.objects.create(name="Second own issue", project=attacker_project, workspace=attacker_workspace)
        IssueRelation.objects.create(
            issue=other,
            related_issue=attacker_issue,
            relation_type="blocked_by",
            project=attacker_project,
            workspace=attacker_workspace,
        )
        attacker_issue.archived_at = timezone.now().date()
        attacker_issue.save(update_fields=["archived_at"])

        url = remove_relation_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.post(url, {"related_issue": str(other.id)}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_relation_list_excludes_archived_url_issue(
        self, attacker_client, attacker_workspace, attacker_project, attacker_issue
    ):
        """And on the read path, so all three handlers are pinned to the same manager."""
        attacker_issue.archived_at = timezone.now().date()
        attacker_issue.save(update_fields=["archived_at"])

        url = relation_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_non_uuid_related_issue_is_400_not_500(
        self, attacker_client, attacker_workspace, attacker_project, attacker_issue
    ):
        """``related_issue`` goes straight into an ORM filter.

        Copilot flagged this as a 500 risk on PR #9531. It is not: Django raises
        ``ValidationError`` on the UUID coercion and ``BaseViewSet.handle_exception``
        converts that to a 400. Pinned so a future change to that handler can't
        silently turn malformed input into a 500.
        """
        url = remove_relation_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.post(url, {"related_issue": "not-a-uuid"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
