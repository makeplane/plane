# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for cross-workspace privilege escalation and
authorization-bypass forgery via WorkSpaceMemberViewSet.partial_update.

Root cause: WorkSpaceMemberSerializer (and its read-only-in-practice siblings
WorkspaceMemberMeSerializer / WorkspaceMemberAdminSerializer) declared
fields = "__all__" with no read_only_fields, so DRF auto-generated writable
fields for everything on the model. WorkSpaceMemberViewSet.partial_update
passes raw request.data straight into the serializer with no scrubbing, so a
workspace ADMIN could:

- PATCH `workspace` on any other active member's row to a foreign workspace's
  UUID — moving that row (and whatever role was also in the body) into the
  foreign workspace with no invitation, no consent from its owner, and no
  audit trail.
- PATCH `is_active`/`deleted_at` directly, as a side channel around
  WorkSpaceMemberViewSet.destroy()'s own checks (can't remove yourself, can't
  remove someone outranking you, can't orphan a project's last admin) and its
  ProjectMember deactivation cascade — every legitimate place that flips
  these fields does so via direct model-field assignment, never through this
  serializer.

Fixed by adding workspace/member/is_active/deleted_at (plus the usual
created_by/updated_by/created_at/updated_at) to read_only_fields on all
three serializers.
"""

import uuid

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import User, Workspace, WorkspaceMember

pytestmark = pytest.mark.contract


def _member_detail_url(slug: str, pk: uuid.UUID) -> str:
    return f"/api/workspaces/{slug}/members/{pk}/"


def _make_user(email: str) -> User:
    local_part = email.split("@")[0]
    user = User.objects.create(email=email, username=local_part, first_name=local_part)
    user.set_password("test-password")
    user.save()
    return user


@pytest.fixture
def foreign_workspace(db):
    """Workspace B — the attacker's escalation target, unrelated to `workspace` (A)."""
    owner = _make_user(f"foreign-owner-{uuid.uuid4().hex[:8]}@plane.so")
    return Workspace.objects.create(name="Foreign Workspace", owner=owner, slug=f"foreign-ws-{uuid.uuid4().hex[:8]}")


@pytest.fixture
def victim_member(db, workspace):
    """A second, active, non-bot member of workspace A — the row being attacked."""
    victim = _make_user(f"victim-{uuid.uuid4().hex[:8]}@plane.so")
    return WorkspaceMember.objects.create(workspace=workspace, member=victim, role=15, is_active=True)


@pytest.mark.django_db
class TestWorkspaceMemberCrossTenantReassignment:
    def test_admin_cannot_move_member_into_foreign_workspace(
        self, workspace, foreign_workspace, victim_member, create_user
    ):
        """create_user is workspace A's admin (via the `workspace` fixture). They
        must not be able to move victim_member's row into foreign_workspace by
        PATCHing `workspace` in the body, even though they're a legitimate admin
        of A and the request also carries an otherwise-valid `role`."""
        client = APIClient()
        client.force_authenticate(user=create_user)

        response = client.patch(
            _member_detail_url(workspace.slug, victim_member.id),
            {"workspace": str(foreign_workspace.id), "role": 20},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, f"got {response.status_code}: {response.data!r}"

        victim_member.refresh_from_db()
        assert victim_member.workspace_id == workspace.id, (
            f"workspace must stay A regardless of what the body requested — got moved to {victim_member.workspace_id!r}"
        )
        foreign_row_exists = WorkspaceMember.objects.filter(
            workspace=foreign_workspace, member_id=victim_member.member_id
        ).exists()
        assert not foreign_row_exists, "no row should have been created/moved in the foreign workspace"
        # The legitimate part of the same request (role) must still apply —
        # proves this isn't just silently rejecting the whole PATCH.
        assert victim_member.role == 20

    def test_admin_can_still_change_role_without_workspace_in_body(self, workspace, victim_member, create_user):
        """Positive control: the fix must not break the legitimate role-only PATCH."""
        client = APIClient()
        client.force_authenticate(user=create_user)

        response = client.patch(
            _member_detail_url(workspace.slug, victim_member.id),
            {"role": 5},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, f"got {response.status_code}: {response.data!r}"
        victim_member.refresh_from_db()
        assert victim_member.role == 5
        assert victim_member.workspace_id == workspace.id


@pytest.mark.django_db
class TestWorkspaceMemberIsActiveDeletedAtBypass:
    """is_active/deleted_at must not be settable through this PATCH — that would
    let an admin route around WorkSpaceMemberViewSet.destroy()'s own safety
    checks (self-removal, role-outranking, last-project-admin orphaning) and
    skip its ProjectMember deactivation cascade entirely."""

    def test_admin_cannot_deactivate_member_via_patch(self, workspace, victim_member, create_user):
        client = APIClient()
        client.force_authenticate(user=create_user)

        response = client.patch(
            _member_detail_url(workspace.slug, victim_member.id),
            {"is_active": False},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, f"got {response.status_code}: {response.data!r}"
        victim_member.refresh_from_db()
        assert victim_member.is_active is True, "is_active must not be settable through this PATCH at all"

    def test_admin_cannot_soft_delete_member_via_patch(self, workspace, victim_member, create_user):
        """deleted_at is worse than is_active: the default manager filters on it,
        so setting it directly would silently vanish the row from every normal
        queryset, forgeable to an arbitrary timestamp with no audit trail."""
        client = APIClient()
        client.force_authenticate(user=create_user)

        response = client.patch(
            _member_detail_url(workspace.slug, victim_member.id),
            {"deleted_at": timezone.now().isoformat()},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, f"got {response.status_code}: {response.data!r}"
        assert WorkspaceMember.objects.filter(pk=victim_member.id).exists(), (
            "the row must still be visible through the default (non-deleted) manager"
        )
        victim_member.refresh_from_db()
        assert victim_member.deleted_at is None, "deleted_at must not be settable through this PATCH at all"
