# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for the created_by/created_at forgery class on the
external API — authorship and audit-trail forgery via body-controlled fields
on issue, comment and issue-link create/update endpoints.

Root cause: view-level code re-fetched a just-created row (turning it into an
update, where BaseModel.save()'s auto-created_by protection does not apply)
and then wrote created_by/created_at straight from request.data. Separately,
IssueSerializer never marked created_by read-only, so a plain PATCH on an
existing issue could set it directly via the serializer.

Fixed by: removing the four view-level override blocks (issue POST, issue PUT
upsert-create branch, comment POST, issue-link POST) entirely — the initial
serializer.save() already produces the correct created_by via BaseModel's
crum-based auto-set on create, which needs no help — and adding created_by to
IssueSerializer.Meta.read_only_fields, closing the PATCH vector directly.

The escalation chain: forge created_by via PATCH, then pass
IssueDetailAPIEndpoint.delete's "admin OR creator" gate as a plain member.
Test `test_patch_then_delete_is_still_403_for_a_plain_member` exercises the
whole chain end to end, not just the individual forgery.
"""

from datetime import timedelta
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import APIToken, Issue, IssueComment, IssueLink, Project, ProjectMember, State

FORGED_CREATED_AT = timezone.now() - timedelta(days=3650)  # 10 years back — unmistakably not "now"


def _create_issue_as(creator, **kwargs):
    """BaseModel.save() sets created_by from crum's current request/user, and
    there is no active request in a fixture — get_current_user() returns None
    there, and the model then *nulls* created_by regardless of what the
    constructor was given. save(created_by_id=...) is the documented escape
    hatch for exactly this case (see BaseModel.save's signature)."""
    obj = Issue(**kwargs)
    obj.save(created_by_id=creator.id)
    return obj

pytestmark = pytest.mark.contract


@pytest.fixture
def admin_user(db, create_user):
    """The project admin and original creator of everything in these tests."""
    return create_user


@pytest.fixture
def member_user(db):
    """A second, lower-privileged account — the attacker in every test here."""
    from plane.db.models import User

    unique = uuid4().hex[:8]
    user = User.objects.create(email=f"member-{unique}@plane.so", username=f"member_{unique}")
    user.set_password("member-password")
    user.save()
    return user


@pytest.fixture
def project(db, workspace, admin_user, member_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TPF",
        workspace=workspace,
        created_by=admin_user,
    )
    ProjectMember.objects.create(project=project, member=admin_user, role=20, is_active=True)
    ProjectMember.objects.create(project=project, member=member_user, role=15, is_active=True)
    return project


@pytest.fixture
def state(db, workspace, project):
    return State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)


@pytest.fixture
def issue(db, workspace, project, state, admin_user):
    """An issue created by the admin — member_user must never be able to
    reattribute this to themselves."""
    return _create_issue_as(
        admin_user,
        name="Admin's issue",
        workspace=workspace,
        project=project,
        state=state,
    )


@pytest.fixture
def member_api_client(api_client, member_user):
    """External-API client authenticated as the low-privilege member."""
    token = APIToken.objects.create(user=member_user, label="Member Token", token=f"member-token-{uuid4().hex}")
    api_client.credentials(HTTP_X_API_KEY=token.token)
    return api_client


def _issues_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/issues/"


def _issue_detail_url(slug, project_id, pk):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/issues/{pk}/"


def _links_url(slug, project_id, issue_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/links/"


def _comments_url(slug, project_id, issue_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/comments/"


@pytest.mark.django_db
class TestIssueCreateIgnoresBodyCreatedBy:
    def test_post_sets_created_by_to_the_caller_not_the_body(
        self, member_api_client, workspace, project, state, admin_user, member_user
    ):
        url = _issues_url(workspace.slug, project.id)
        response = member_api_client.post(
            url,
            {
                "name": "Spoofed issue",
                "state": str(state.id),
                "created_by": str(admin_user.id),
                "created_at": FORGED_CREATED_AT.isoformat(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"got {response.status_code}: {response.data!r}"

        created = Issue.objects.get(pk=response.data["id"])
        assert created.created_by_id == member_user.id, (
            "created_by must be the authenticated caller regardless of what the body requested"
        )
        assert created.created_by_id != admin_user.id
        assert created.created_at > FORGED_CREATED_AT + timedelta(days=1), (
            "created_at must not be backdated by a body-supplied value"
        )

    # No test for IssueDetailAPIEndpoint.put's external_id-upsert create branch:
    # confirmed against apps/api/plane/api/urls/work_item.py that
    # IssueListCreateAPIEndpoint is only ever mounted with
    # http_method_names=["get", "post"] (both old_url_patterns and
    # new_url_patterns) — put() is unreachable dead code. Cleaned up the same
    # override there anyway for consistency, but there's no route to test it
    # through.


@pytest.mark.django_db
class TestIssuePatchCannotForgeCreatedBy:
    def test_patch_cannot_reattribute_to_the_caller(
        self, member_api_client, workspace, project, issue, admin_user, member_user
    ):
        """A project member may edit fields on an issue they don't own, but
        created_by must remain the original creator (admin_user here) — it is
        not a field this endpoint's contract lets anyone change. Targets
        member_user specifically (not admin_user, the value already in place)
        so a no-op forgery attempt can't masquerade as a passing test."""
        url = _issue_detail_url(workspace.slug, project.id, issue.id)
        response = member_api_client.patch(
            url, {"name": "Edited by member", "created_by": str(member_user.id)}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK, f"got {response.status_code}: {response.data!r}"

        issue.refresh_from_db()
        assert issue.created_by_id == admin_user.id, (
            "created_by must be immutable after creation — a PATCH must never reattribute an issue"
        )
        assert issue.name == "Edited by member", "the legitimate field in the same request must still apply"


@pytest.mark.django_db
class TestForgeryThenDeleteChainIsBlocked:
    def test_patch_then_delete_is_still_403_for_a_plain_member(
        self, member_api_client, workspace, project, issue, admin_user, member_user
    ):
        """The full escalation chain: forge created_by via PATCH, then rely on
        the DELETE handler's "creator can delete" gate. Since the PATCH no
        longer forges anything, the DELETE must still refuse a plain member.
        """
        patch_url = _issue_detail_url(workspace.slug, project.id, issue.id)
        member_api_client.patch(patch_url, {"created_by": str(member_user.id)}, format="json")
        issue.refresh_from_db()
        assert issue.created_by_id != member_user.id, "forgery must not have landed before we even try the delete"

        delete_url = _issue_detail_url(workspace.slug, project.id, issue.id)
        response = member_api_client.delete(delete_url)

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"a plain member who is not the real creator must not be able to delete; got {response.status_code}"
        )
        assert Issue.objects.filter(pk=issue.id).exists(), "the issue must not have been deleted"

    def test_real_creator_can_still_delete_their_own_issue(
        self, member_api_client, workspace, project, state, member_user
    ):
        """Positive control: the fix must not break the legitimate creator-delete path."""
        own_issue = _create_issue_as(
            member_user, name="Member's own issue", workspace=workspace, project=project, state=state
        )
        url = _issue_detail_url(workspace.slug, project.id, own_issue.id)
        response = member_api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT, f"got {response.status_code}: {response.data!r}"


@pytest.mark.django_db
class TestCommentCreateIgnoresBodyCreatedBy:
    def test_post_comment_sets_created_by_to_the_caller(
        self, member_api_client, workspace, project, issue, admin_user, member_user
    ):
        url = _comments_url(workspace.slug, project.id, issue.id)
        response = member_api_client.post(
            url,
            {
                "comment_html": "<p>please approve the payment</p>",
                "created_by": str(admin_user.id),
                "created_at": FORGED_CREATED_AT.isoformat(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"got {response.status_code}: {response.data!r}"

        comment = IssueComment.objects.get(pk=response.data["id"])
        assert comment.created_by_id == member_user.id
        assert comment.created_by_id != admin_user.id
        assert comment.actor_id == member_user.id, "actor (the audit-log identity) must also be the real caller"
        assert comment.created_at > FORGED_CREATED_AT + timedelta(days=1), (
            "created_at must not be backdated by a body-supplied value"
        )


@pytest.mark.django_db
class TestIssueLinkCreateIgnoresBodyCreatedBy:
    def test_post_link_sets_created_by_to_the_caller_not_null_or_forged(
        self, member_api_client, workspace, project, issue, admin_user, member_user
    ):
        url = _links_url(workspace.slug, project.id, issue.id)
        response = member_api_client.post(
            url,
            {"title": "Spec doc", "url": "https://example.com/spec", "created_by": str(admin_user.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"got {response.status_code}: {response.data!r}"

        link = IssueLink.objects.get(pk=response.data["id"])
        assert link.created_by_id == member_user.id, "must be the real caller, not forged and not NULL"
        assert link.created_by_id != admin_user.id
