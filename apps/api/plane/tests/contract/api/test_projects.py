# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember, State, User, WorkspaceMember


@pytest.fixture
def other_workspace_member(db, workspace):
    """Create another user that is a member of the workspace, distinct from the creator."""
    unique_id = uuid4().hex[:8]
    other = User.objects.create(
        email=f"other-{unique_id}@plane.so",
        username=f"other_user_{unique_id}",
        first_name="Other",
        last_name="User",
    )
    other.set_password("test-password")
    other.save()
    WorkspaceMember.objects.create(workspace=workspace, member=other, role=20)
    return other


@pytest.fixture
def outsider_user(db):
    """Create a user that is NOT a member of any workspace under test."""
    unique_id = uuid4().hex[:8]
    outsider = User.objects.create(
        email=f"outsider-{unique_id}@plane.so",
        username=f"outsider_{unique_id}",
        first_name="Out",
        last_name="Sider",
    )
    outsider.set_password("test-password")
    outsider.save()
    return outsider


@pytest.mark.contract
class TestProjectListCreateAPIEndpoint:
    """Contract tests for POST /api/v1/workspaces/{slug}/projects/."""

    def get_url(self, workspace_slug):
        return f"/api/v1/workspaces/{workspace_slug}/projects/"

    @pytest.mark.django_db
    def test_create_project_with_lead_as_creator(self, api_key_client, workspace, create_user):
        """Regression for the ghost-create bug.

        When project_lead points to the creator's own user_id, the endpoint
        must return 201 and create a fully-populated project (single
        ProjectMember as admin, default workflow states).

        Before the fix, the endpoint returned 400 "Please provide valid detail"
        but had already persisted the Project row without states or members,
        leaving an unusable orphan.
        """
        url = self.get_url(workspace.slug)
        payload = {
            "name": "Self Lead Project",
            "identifier": "SL",
            "project_lead": str(create_user.id),
        }

        response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"

        # Look up the project we just created instead of relying on
        # ordering-sensitive Project.objects.first().
        project = Project.objects.get(id=response.data["id"])
        # Creator is registered as admin (single membership; lead == creator
        # should not produce a duplicate row).
        assert ProjectMember.objects.filter(project=project, member=create_user, role=20).count() == 1
        # Default workflow states must be created.
        assert State.objects.filter(project=project).count() == 5

    @pytest.mark.django_db
    def test_create_project_with_lead_as_other_user(
        self, api_key_client, workspace, create_user, other_workspace_member
    ):
        """When project_lead is a different workspace member, both creator
        and lead become admins of the project."""
        url = self.get_url(workspace.slug)
        payload = {
            "name": "Other Lead Project",
            "identifier": "OL",
            "project_lead": str(other_workspace_member.id),
        }

        response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        project = Project.objects.get(id=response.data["id"])

        # Both creator and other_workspace_member are admins.
        assert ProjectMember.objects.filter(project=project, member=create_user, role=20).exists()
        assert ProjectMember.objects.filter(project=project, member=other_workspace_member, role=20).exists()
        assert State.objects.filter(project=project).count() == 5

    @pytest.mark.django_db
    def test_create_project_without_lead(self, api_key_client, workspace, create_user):
        """Baseline regression: omitting project_lead must succeed and the
        creator becomes the sole admin."""
        url = self.get_url(workspace.slug)
        payload = {
            "name": "Basic Project",
            "identifier": "BP",
        }

        response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        project = Project.objects.get(id=response.data["id"])
        assert ProjectMember.objects.filter(project=project, member=create_user, role=20).count() == 1
        assert State.objects.filter(project=project).count() == 5

    @pytest.mark.django_db
    def test_create_project_with_lead_not_in_workspace_returns_400(self, api_key_client, workspace, outsider_user):
        """When project_lead refers to a user that is NOT a member of the
        target workspace, the endpoint must reject the request with a 400
        carrying a field-shaped error and must not persist the Project."""
        url = self.get_url(workspace.slug)
        payload = {
            "name": "Outsider Lead Project",
            "identifier": "OUT",
            "project_lead": str(outsider_user.id),
        }

        response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST, f"Got {response.status_code}: {response.data!r}"
        assert "project_lead" in response.data, (
            f"Expected field-shaped error under 'project_lead', got {response.data!r}"
        )
        # No project should have been persisted.
        assert Project.objects.count() == 0

    @pytest.mark.django_db
    def test_model_activity_not_called_on_rollback(self, api_key_client, workspace, create_user):
        """If anything inside the transaction.atomic() block raises, the
        whole creation must roll back (no Project, no ProjectMember, no
        State) and the deferred model_activity.delay() task must not fire,
        because it is registered with transaction.on_commit().

        Force the failure inside State.objects.bulk_create — past the point
        where the original ghost-create bug would have committed a partial
        Project — and verify the response is 500 with no side effects.
        """
        url = self.get_url(workspace.slug)
        payload = {
            "name": "Rollback Probe",
            "identifier": "RB",
            "project_lead": str(create_user.id),
        }

        forced_error = RuntimeError("forced failure for rollback test")

        with (
            mock.patch(
                "plane.api.views.project.State.objects.bulk_create",
                side_effect=forced_error,
            ),
            mock.patch("plane.api.views.project.model_activity") as mocked_activity,
        ):
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR, (
            f"Got {response.status_code}: {response.data!r}"
        )
        # Transaction must have rolled back: no Project, no ProjectMember,
        # no State persisted.
        assert Project.objects.count() == 0
        assert ProjectMember.objects.count() == 0
        assert State.objects.count() == 0
        # And the deferred Celery task must not have been dispatched —
        # transaction.on_commit() callbacks only fire on a successful commit.
        mocked_activity.delay.assert_not_called()

    @pytest.mark.django_db
    def test_list_invalid_order_by_does_not_500(self, api_key_client, workspace, create_user):
        """Regression for GHSA-p885-6jpg-cr2p (DoS half).

        An unknown ``order_by`` field used to reach Django's ``.order_by()``
        raw and raise a ``FieldError`` → HTTP 500. After the fix the value is
        sanitized to the safe default and the endpoint returns 200.
        """
        Project.objects.create(
            name="Ordered Project",
            identifier="OP",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=Project.objects.get(identifier="OP"), member=create_user, role=20)

        url = self.get_url(workspace.slug)
        response = api_key_client.get(url, {"order_by": "not_a_field"})

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db
    def test_list_relational_order_by_injection_does_not_500(self, api_key_client, workspace, create_user):
        """Regression for GHSA-p885-6jpg-cr2p (relational-traversal leak half).

        Ordering by a related-table column (``created_by__password``) used to
        reach ``.order_by()`` raw, forming a blind ordering oracle. After the
        fix the value is not in ``PROJECT_ORDER_BY_ALLOWLIST`` and is replaced
        with the safe default, so it can no longer influence SQL ordering.
        (That the payload maps to the default is asserted deterministically in
        tests/unit/utils/test_order_by_sanitize.py.)
        """
        project = Project.objects.create(
            name="Oracle Project",
            identifier="OR",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20)

        url = self.get_url(workspace.slug)
        response = api_key_client.get(url, {"order_by": "created_by__password"})

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"

    @pytest.mark.django_db(transaction=True)
    def test_response_still_201_when_broker_dispatch_fails(self, api_key_client, workspace, create_user):
        """If model_activity.delay raises *after* the atomic block has
        committed (e.g., the Celery broker is down), the project, member
        rows and states are already persisted — the response must remain
        201 and the failure must be absorbed by Django's robust=True
        on_commit handling, not surface as a 500.

        Uses ``transaction=True`` so the surrounding test transaction is
        actually committed and the ``on_commit`` callback fires (the
        default ``django_db`` wrapper would suppress it via rollback)."""
        url = self.get_url(workspace.slug)
        payload = {
            "name": "Broker Down",
            "identifier": "BD",
            "project_lead": str(create_user.id),
        }

        with mock.patch("plane.api.views.project.model_activity") as mocked_activity:
            mocked_activity.delay.side_effect = RuntimeError("broker unavailable")
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        # Project and its scaffolding are persisted (commit happened
        # before the on_commit callback fired).
        project = Project.objects.get(id=response.data["id"])
        assert ProjectMember.objects.filter(project=project).count() == 1
        assert State.objects.filter(project=project).count() == 5
        # The dispatch was attempted but its failure was swallowed by
        # transaction.on_commit(robust=True).
        mocked_activity.delay.assert_called_once()
