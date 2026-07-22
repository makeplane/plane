# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for undecorated fall-through route authorization (WEB-8333).

Regression coverage for GHSA-27v6-jc2m-x99w / GHSA-w83f-hr4p-3qhw (duplicates).

Per-project authorization on the app viewsets lives in the
``@allow_permission(..., level="PROJECT")`` *method* decorator, not in
``get_queryset`` (which only filters ``workspace__slug`` + ``project_id`` from the
URL, with no membership predicate). The project-wide default permission is bare
``IsAuthenticated`` and there is no ``has_object_permission``. So any routed
action that lacks the decorator falls through to the stock DRF ``ModelViewSet``
implementation under ``IsAuthenticated`` only, letting any authenticated user act
on objects in a project they are not a member of.

Three viewsets had undecorated fall-through routes before the fix:

* ``IssueViewSet``   -> ``PUT`` (``update``) was routed but never defined.
* ``ModuleViewSet``  -> ``PUT`` (``update``) was routed but never defined.
* ``IntakeViewSet``  -> ``GET`` (``retrieve``) and ``PATCH`` (``partial_update``)
  were routed but never defined.

The fix defines each handler and decorates it with the same role set as its
sibling actions, delegating to the authorized/stock implementation.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Intake,
    Issue,
    Module,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)


def _issue_detail_url(slug, project_id, pk):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{pk}/"


def _module_detail_url(slug, project_id, pk):
    return f"/api/workspaces/{slug}/projects/{project_id}/modules/{pk}/"


def _intake_detail_url(slug, project_id, pk):
    return f"/api/workspaces/{slug}/projects/{project_id}/intakes/{pk}/"


def _make_user(email):
    local_part = email.split("@")[0]
    user = User.objects.create(email=email, username=local_part, first_name=local_part)
    user.set_password("test-password")
    user.save()
    return user


@pytest.fixture
def project_b(db, workspace, create_user):
    """The victim project. ``create_user`` (workspace owner) is an active ADMIN member."""
    project = Project.objects.create(
        name="Project B",
        identifier="PB",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        workspace=workspace, project=project, member=create_user, role=20, is_active=True
    )
    return project


@pytest.fixture
def project_a(db, workspace, create_user):
    """A different project the attacker *is* a member of (but not project B)."""
    return Project.objects.create(
        name="Project A",
        identifier="PA",
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def state_b(db, workspace, project_b):
    return State.objects.create(
        name="Backlog",
        color="#000000",
        group="backlog",
        default=True,
        project=project_b,
        workspace=workspace,
    )


@pytest.fixture
def issue_b(db, workspace, project_b, state_b, create_user):
    return Issue.objects.create(
        name="Victim Issue",
        project=project_b,
        workspace=workspace,
        state=state_b,
        created_by=create_user,
    )


@pytest.fixture
def module_b(db, workspace, project_b):
    return Module.objects.create(
        name="Victim Module",
        project=project_b,
        workspace=workspace,
    )


@pytest.fixture
def intake_b(db, workspace, project_b):
    return Intake.objects.create(
        name="Victim Intake",
        project=project_b,
        workspace=workspace,
        is_default=True,
    )


@pytest.fixture
def attacker(db, workspace, project_a):
    """Workspace MEMBER (role 15) who belongs to project A but NOT project B.

    Deliberately not a workspace ADMIN so the workspace-admin bypass in
    ``allow_permission`` cannot mask the missing membership check.
    """
    user = _make_user(f"attacker-{uuid4().hex[:8]}@plane.so")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=True)
    ProjectMember.objects.create(
        workspace=workspace, project=project_a, member=user, role=20, is_active=True
    )
    return user


@pytest.fixture
def attacker_client(attacker):
    client = APIClient()
    client.force_authenticate(user=attacker)
    return client


@pytest.mark.contract
@pytest.mark.django_db
class TestUndecoratedRouteProjectScope:
    """A user who is not a member of project B must not act on project-B objects
    through the previously-undecorated fall-through routes."""

    # ---- IssueViewSet PUT (update) -------------------------------------------------

    def test_non_member_cannot_put_issue(self, attacker_client, workspace, project_b, issue_b):
        response = attacker_client.put(
            _issue_detail_url(workspace.slug, project_b.id, issue_b.id),
            {"name": "Hacked Issue"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        issue_b.refresh_from_db()
        assert issue_b.name == "Victim Issue"

    def test_member_can_put_issue(self, session_client, workspace, project_b, issue_b):
        """Positive control: a project-B member may PUT a project-B issue."""
        response = session_client.put(
            _issue_detail_url(workspace.slug, project_b.id, issue_b.id),
            {"name": "Renamed Issue"},
            format="json",
        )
        # PUT is routed through partial_update, which returns 204 on success.
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        issue_b.refresh_from_db()
        assert issue_b.name == "Renamed Issue"

    # ---- ModuleViewSet PUT (update) ------------------------------------------------

    def test_non_member_cannot_put_module(self, attacker_client, workspace, project_b, module_b):
        response = attacker_client.put(
            _module_detail_url(workspace.slug, project_b.id, module_b.id),
            {"name": "Hacked Module"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        module_b.refresh_from_db()
        assert module_b.name == "Victim Module"

    def test_member_can_put_module(self, session_client, workspace, project_b, module_b):
        """Positive control: a project-B member may PUT a project-B module."""
        response = session_client.put(
            _module_detail_url(workspace.slug, project_b.id, module_b.id),
            {"name": "Renamed Module"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        module_b.refresh_from_db()
        assert module_b.name == "Renamed Module"

    # ---- IntakeViewSet GET (retrieve) ----------------------------------------------

    def test_non_member_cannot_retrieve_intake(self, attacker_client, workspace, project_b, intake_b):
        response = attacker_client.get(_intake_detail_url(workspace.slug, project_b.id, intake_b.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_member_can_retrieve_intake(self, session_client, workspace, project_b, intake_b):
        """Positive control: a project-B member may retrieve a project-B intake."""
        response = session_client.get(_intake_detail_url(workspace.slug, project_b.id, intake_b.id))
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert str(response.data["id"]) == str(intake_b.id)

    # ---- IntakeViewSet PATCH (partial_update) --------------------------------------

    def test_non_member_cannot_patch_intake(self, attacker_client, workspace, project_b, intake_b):
        response = attacker_client.patch(
            _intake_detail_url(workspace.slug, project_b.id, intake_b.id),
            {"name": "Hacked Intake"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        intake_b.refresh_from_db()
        assert intake_b.name == "Victim Intake"

    def test_member_can_patch_intake(self, session_client, workspace, project_b, intake_b):
        """Positive control: a project-B member may patch a project-B intake."""
        response = session_client.patch(
            _intake_detail_url(workspace.slug, project_b.id, intake_b.id),
            {"name": "Renamed Intake"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        intake_b.refresh_from_db()
        assert intake_b.name == "Renamed Intake"
