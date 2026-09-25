# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for viewset actions whose authorization lives outside a decorator.

These actions are *defined* on their viewset, so a scan for routes falling
through to a DRF generic mixin cannot see them, and neither carries an
``@allow_permission`` decorator. That makes them easy to misread in both
directions — one of the two turned out to be guarded after all.

1. **Fix.** ``WorkspaceViewViewSet.retrieve``
   (``/workspaces/<slug>/views/<pk>/``) had no check at all, and its queryset
   supplied none either: it filters on ``workspace__slug`` and then
   ``Q(owned_by=request.user) | Q(access=1)``. That second clause reads like a
   visibility predicate but is vacuous — ``access`` sits in the serializer's
   ``read_only_fields`` so the API never sets it, and the model defaults it to
   ``1`` (Public), so every row matches. A user with no membership in the
   workspace could read any global view in it by id. It now requires workspace
   membership, matching ``list`` — and, like ``list``, restricts a GUEST to
   views they own, since guests pass the membership check too.

2. **Regression coverage only, no fix.** ``IssueDetailIdentifierEndpoint``
   (``/workspaces/<slug>/work-items/<PROJ>-<n>/``) resolves a work item by its
   human-readable sequence number, which makes it an enumeration surface. It was
   reported as missing the guest restriction. **It is not.** The membership check
   near the top of ``get`` is followed, after the issue is fetched, by an
   explicit role-5 / ``guest_view_all_features`` / ``created_by`` check that
   returns 403. That guard had no test, so the disclosure it prevents was one
   refactor away from being lost silently. These tests pin it.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Issue,
    IssueView,
    Project,
    ProjectMember,
    User,
    Workspace,
    WorkspaceMember,
)

WORK_ITEM_BY_IDENTIFIER_URL = "/api/workspaces/{slug}/work-items/{project_identifier}-{sequence_id}/"
WORKSPACE_VIEW_DETAIL_URL = "/api/workspaces/{slug}/views/{pk}/"


def _make_user(prefix):
    """A saved, active user with a unique email."""
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


def _client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def project(db, workspace, create_user):
    """A project with guest_view_all_features at its default of False."""
    project = Project.objects.create(
        name="Scoped Project",
        identifier="SP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def guest(db, workspace, project):
    """An active project GUEST (role=5)."""
    user = _make_user("guest")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=5)
    return user


@pytest.fixture
def guest_client(guest):
    return _client_for(guest)


def _make_issue(name, project, workspace, author):
    """Create an issue with a deterministic ``created_by``.

    ``BaseModel.save`` sets ``created_by`` from the current request user, which
    is anonymous under tests, so a ``created_by=`` kwarg to ``create`` is
    discarded. Passing ``created_by_id`` to ``save`` sets it explicitly.
    """
    issue = Issue(name=name, project=project, workspace=workspace)
    issue.save(created_by_id=author.id)
    return issue


@pytest.fixture
def own_issue(db, workspace, project, guest):
    return _make_issue("Guest's own work item", project, workspace, guest)


@pytest.fixture
def foreign_issue(db, workspace, project, create_user):
    return _make_issue("Someone else's work item", project, workspace, create_user)


@pytest.mark.contract
class TestWorkItemByIdentifierGuestScope:
    """A restricted guest must not resolve work items they did not author.

    Pins an existing guard rather than covering a new fix. This endpoint resolves
    by sequence number, so losing the guard would let a guest walk
    ``PROJ-1..PROJ-N`` and read every work item's full detail — including
    ``description_html`` — plus the project and issue UUIDs that every other
    endpoint keys on.
    """

    @pytest.mark.django_db
    def test_guest_cannot_read_foreign_work_item(self, guest_client, workspace, project, foreign_issue):
        url = WORK_ITEM_BY_IDENTIFIER_URL.format(
            slug=workspace.slug,
            project_identifier=project.identifier,
            sequence_id=foreign_issue.sequence_id,
        )
        response = guest_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Restricted guest resolved a foreign work item: {response.status_code} {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_guest_can_read_their_own_work_item(self, guest_client, workspace, project, own_issue):
        """Positive control: the guard must not lock a guest out of their own item."""
        url = WORK_ITEM_BY_IDENTIFIER_URL.format(
            slug=workspace.slug,
            project_identifier=project.identifier,
            sequence_id=own_issue.sequence_id,
        )
        response = guest_client.get(url)

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert str(response.data["id"]) == str(own_issue.id)

    @pytest.mark.django_db
    def test_full_member_can_read_any_work_item(self, session_client, workspace, project, foreign_issue):
        """Positive control: a full member is unaffected."""
        url = WORK_ITEM_BY_IDENTIFIER_URL.format(
            slug=workspace.slug,
            project_identifier=project.identifier,
            sequence_id=foreign_issue.sequence_id,
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert str(response.data["id"]) == str(foreign_issue.id)

    @pytest.mark.django_db
    def test_guest_with_view_all_features_can_read_any_work_item(self, guest_client, workspace, project, foreign_issue):
        """Positive control: the guard is conditional on the project setting."""
        project.guest_view_all_features = True
        project.save(update_fields=["guest_view_all_features"])

        url = WORK_ITEM_BY_IDENTIFIER_URL.format(
            slug=workspace.slug,
            project_identifier=project.identifier,
            sequence_id=foreign_issue.sequence_id,
        )
        response = guest_client.get(url)

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_non_member_is_refused(self, workspace, project, foreign_issue):
        """A user with no project membership must still be refused outright."""
        outsider = _make_user("outsider")
        WorkspaceMember.objects.create(workspace=workspace, member=outsider, role=15)

        url = WORK_ITEM_BY_IDENTIFIER_URL.format(
            slug=workspace.slug,
            project_identifier=project.identifier,
            sequence_id=foreign_issue.sequence_id,
        )
        response = _client_for(outsider).get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )


@pytest.fixture
def workspace_view(db, workspace, create_user):
    """A global (project-less) workspace view owned by the workspace owner."""
    view = IssueView(name="Global view", workspace=workspace, owned_by=create_user, access=1)
    view.save()
    return view


@pytest.mark.contract
class TestWorkspaceViewRetrieveRequiresMembership:
    """Reading a global view must require membership of its workspace."""

    @pytest.mark.django_db
    def test_outsider_cannot_read_a_global_view(self, workspace, workspace_view):
        """A user in a different workspace entirely, holding only the view id."""
        outsider = _make_user("outsider")
        other_workspace = Workspace.objects.create(
            name="Outsider Workspace",
            owner=outsider,
            slug=f"outsider-{uuid4().hex[:8]}",
        )
        WorkspaceMember.objects.create(workspace=other_workspace, member=outsider, role=20)

        url = WORKSPACE_VIEW_DETAIL_URL.format(slug=workspace.slug, pk=workspace_view.id)
        response = _client_for(outsider).get(url)

        assert response.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ), f"Non-member read a global view: {response.status_code} {getattr(response, 'data', None)!r}"

    @pytest.mark.django_db
    def test_workspace_member_can_read_a_global_view(self, session_client, workspace, workspace_view):
        """Positive control: a member of the workspace still reads it."""
        url = WORKSPACE_VIEW_DETAIL_URL.format(slug=workspace.slug, pk=workspace_view.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert str(response.data["id"]) == str(workspace_view.id)

    @pytest.mark.django_db
    def test_missing_view_is_a_404_not_an_empty_200(self, session_client, workspace):
        """A member asking for a view id that does not exist must get 404.

        get_queryset() is scoped to the URL workspace, so this also covers a real
        view id belonging to a different workspace.
        """
        url = WORKSPACE_VIEW_DETAIL_URL.format(slug=workspace.slug, pk=uuid4())
        response = session_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_workspace_guest_cannot_read_a_global_view_they_do_not_own(self, workspace, workspace_view):
        """The role set matches list(), which permits guests as members — but list()
        also restricts a GUEST to views they own. retrieve() must reapply that
        same restriction: this guest owns no views, so a view owned by someone
        else must not be readable by id even though guests may pass the
        workspace-membership check above."""
        guest_user = _make_user("wsguest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest_user, role=5)

        url = WORKSPACE_VIEW_DETAIL_URL.format(slug=workspace.slug, pk=workspace_view.id)
        response = _client_for(guest_user).get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_workspace_guest_can_read_a_global_view_they_own(self, workspace):
        """Positive control: a guest reading a view they own themselves must
        still succeed — the fix must not over-restrict."""
        guest_user = _make_user("wsguest-owner")
        WorkspaceMember.objects.create(workspace=workspace, member=guest_user, role=5)
        own_view = IssueView(name="Guest's own view", workspace=workspace, owned_by=guest_user, access=1)
        own_view.save()

        url = WORKSPACE_VIEW_DETAIL_URL.format(slug=workspace.slug, pk=own_view.id)
        response = _client_for(guest_user).get(url)

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert str(response.data["id"]) == str(own_view.id)
