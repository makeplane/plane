# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
P6 self-hosted unlimited policy regression tests.

The self-hosted Community edition applies no subscription-based feature gates
and no seat caps. These tests pin the centralized policy surfaced by
``GET /api/instances/`` and prove that workspaces can grow beyond the
historical 12-user "Free plan" seat cap end to end, while RBAC role
constraints and workspace tenant isolation remain intact.
"""

import uuid

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch

from plane.db.models import Estimate, Project, ProjectMember, User, Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.license.models import Instance, InstanceEdition


def _create_user(email, first_name="Member", last_name="User"):
    username = email.split("@")[0]
    user = User.objects.create(
        email=email,
        username=username,
        first_name=first_name,
        last_name=last_name,
    )
    user.set_password("member@123")
    user.save()
    return user


def _create_instance(edition=None):
    instance_id = uuid.uuid4() if not Instance.objects.exists() else Instance.objects.first().id
    defaults = {
        "instance_name": "Community Instance",
        "instance_id": str(uuid.uuid4()),
        "current_version": "1.0.0",
        "last_checked_at": timezone.now(),
        "is_setup_done": True,
    }
    if edition is not None:
        defaults["edition"] = edition
    return Instance.objects.update_or_create(id=instance_id, defaults=defaults)[0]


def _create_workspace(slug, owner):
    workspace = Workspace.objects.create(name=f"Workspace {slug}", owner=owner, slug=slug)
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20)
    return workspace


@pytest.fixture
def workspace_with_twelve_members(db):
    """A workspace with exactly 12 active members (owner/admin + 11 members)."""
    owner = _create_user("seat-owner@plane.so", "Owner", "User")
    workspace = _create_workspace("seat-unlimited", owner)
    for index in range(11):
        member = _create_user(f"seat-{index}@plane.so")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
    return workspace, owner


@pytest.mark.contract
class TestSelfHostedPolicyEndpoint:
    """The centralized policy block reported by GET /api/instances/."""

    @pytest.mark.django_db
    def test_policy_reports_unlimited_for_self_hosted(self, api_client):
        """Without any instance row the policy must already report the
        self-hosted unlimited posture and must never fabricate billing state."""
        response = api_client.get(reverse("instance"))
        assert response.status_code == status.HTTP_200_OK

        policy = response.data.get("capabilities", {}).get("policy", {})
        assert policy.get("self_hosted") is True
        assert policy.get("commercial_gating") is False
        assert policy.get("feature_tier") == "unlimited"
        # Semantic unlimited: null limits, never a fabricated high number.
        assert policy.get("seat_limit") is None
        assert policy.get("member_limit") is None
        assert policy.get("project_limit") is None
        # No fake subscription / invoice / billing artifacts.
        assert not any(key in policy for key in ("subscription", "invoice", "billing_seats"))
        assert isinstance(response.data.get("build_revision"), str)

    @pytest.mark.django_db
    def test_policy_uses_default_community_edition(self, api_client):
        """A historical default Community edition instance still reports the
        unlimited self-hosted policy and never blocks on the edition value."""
        _create_instance()
        response = api_client.get(reverse("instance"))
        assert response.status_code == status.HTTP_200_OK

        policy = response.data.get("capabilities", {}).get("policy", {})
        assert policy.get("edition") == InstanceEdition.PLANE_COMMUNITY.value
        assert policy.get("commercial_gating") is False
        assert policy.get("seat_limit") is None

    @pytest.mark.django_db
    def test_policy_is_sanitized_and_public(self, api_client):
        """The policy block must not leak configuration secrets."""
        response = api_client.get(reverse("instance"))
        assert response.status_code == status.HTTP_200_OK
        policy = response.data.get("capabilities", {}).get("policy", {})
        serialized = str(policy).lower()
        assert "secret" not in serialized
        assert "api_key" not in serialized
        assert "token" not in serialized


@pytest.mark.contract
class TestWorkspaceSeatUnlimited:
    """Removal of the historical 12-user Free-plan seat cap end to end."""

    @pytest.mark.django_db
    @patch("plane.bgtasks.workspace_invitation_task.workspace_invitation.delay")
    @patch("plane.bgtasks.event_tracking_task.track_event.delay")
    def test_invite_thirteenth_member_succeeds(
        self, mock_track, mock_invite, api_client, workspace_with_twelve_members
    ):
        """Workspaces already at the old 12-user cap accept a 13th invite."""
        workspace, owner = workspace_with_twelve_members
        assert WorkspaceMember.objects.filter(workspace=workspace, is_active=True).count() == 12

        api_client.force_authenticate(user=owner)
        url = reverse("workspace-invitations", args=[workspace.slug])
        response = api_client.post(
            url,
            {"emails": [{"email": "seat-12@plane.so", "role": 15}]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert WorkspaceMemberInvite.objects.filter(workspace=workspace, email="seat-12@plane.so").exists()

    @pytest.mark.django_db
    @patch("plane.bgtasks.workspace_invitation_task.workspace_invitation.delay")
    @patch("plane.bgtasks.event_tracking_task.track_event.delay")
    def test_invite_far_beyond_twelve_succeeds(
        self, mock_track, mock_invite, api_client, workspace_with_twelve_members
    ):
        """No seat cap exists anywhere in the invite path: 15 members is fine."""
        workspace, owner = workspace_with_twelve_members
        for index in (12, 13):
            member = _create_user(f"seat-extra-{index}@plane.so")
            WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
        assert WorkspaceMember.objects.filter(workspace=workspace, is_active=True).count() == 14

        api_client.force_authenticate(user=owner)
        url = reverse("workspace-invitations", args=[workspace.slug])
        response = api_client.post(
            url,
            {"emails": [{"email": "seat-14@plane.so", "role": 15}]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert WorkspaceMemberInvite.objects.filter(workspace=workspace, email="seat-14@plane.so").exists()

    @pytest.mark.django_db
    @patch("plane.bgtasks.event_tracking_task.track_event.delay")
    def test_acceptance_above_old_limit_succeeds(self, mock_track, workspace_with_twelve_members):
        """Accepting an invitation pushes the workspace past the old 12-user cap."""
        workspace, owner = workspace_with_twelve_members
        invitee = _create_user("seat-accept@plane.so", "Accept", "User")

        invite = WorkspaceMemberInvite.objects.create(
            email="seat-accept@plane.so",
            workspace=workspace,
            token="valid-accept-token",
            role=15,
            created_by=owner,
        )

        client = APIClient()
        client.force_authenticate(user=invitee)
        url = reverse("workspace-join", args=[workspace.slug, invite.id])
        response = client.post(url, {"token": "valid-accept-token", "accepted": True}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert WorkspaceMember.objects.filter(workspace=workspace, member=invitee, is_active=True).exists()
        assert WorkspaceMember.objects.filter(workspace=workspace, is_active=True).count() == 13


@pytest.mark.contract
class TestInvitationAuthorizationPreserved:
    """Removing the seat cap must not weaken RBAC or tenant isolation."""

    @pytest.mark.django_db
    @patch("plane.bgtasks.workspace_invitation_task.workspace_invitation.delay")
    @patch("plane.bgtasks.event_tracking_task.track_event.delay")
    def test_member_cannot_invite_higher_role(self, mock_track, mock_invite, api_client, workspace_with_twelve_members):
        """A member (role 15) cannot invite an admin (role 20)."""
        workspace, owner = workspace_with_twelve_members
        member = _create_user("seat-member@plane.so", "Member", "Role")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)

        api_client.force_authenticate(user=member)
        url = reverse("workspace-invitations", args=[workspace.slug])
        response = api_client.post(
            url,
            {"emails": [{"email": "higher-role@plane.so", "role": 20}]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    @patch("plane.bgtasks.workspace_invitation_task.workspace_invitation.delay")
    @patch("plane.bgtasks.event_tracking_task.track_event.delay")
    def test_guest_cannot_invite(self, mock_track, mock_invite, api_client, workspace_with_twelve_members):
        """A guest (role 5) is denied by workspace permission entirely."""
        workspace, owner = workspace_with_twelve_members
        guest = _create_user("seat-guest@plane.so", "Guest", "Role")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)

        api_client.force_authenticate(user=guest)
        url = reverse("workspace-invitations", args=[workspace.slug])
        response = api_client.post(
            url,
            {"emails": [{"email": "guest-invite@plane.so", "role": 15}]},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_unauthenticated_acceptance_rejected(self, api_client, workspace_with_twelve_members):
        """Accepting an invite still requires an authenticated session."""
        workspace, owner = workspace_with_twelve_members
        invite = WorkspaceMemberInvite.objects.create(
            email="anon@plane.so",
            workspace=workspace,
            token="anon-token",
            role=15,
            created_by=owner,
        )

        url = reverse("workspace-join", args=[workspace.slug, invite.id])
        response = api_client.post(url, {"token": "anon-token", "accepted": True}, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_wrong_email_acceptance_rejected(self, workspace_with_twelve_members):
        """The accepting user must be the invited email (email-squat guard)."""
        workspace, owner = workspace_with_twelve_members
        invite = WorkspaceMemberInvite.objects.create(
            email="real-invitee@plane.so",
            workspace=workspace,
            token="email-token",
            role=15,
            created_by=owner,
        )

        squatter = _create_user("squatter@plane.so", "Squatter", "User")
        client = APIClient()
        client.force_authenticate(user=squatter)
        url = reverse("workspace-join", args=[workspace.slug, invite.id])
        response = client.post(url, {"token": "email-token", "accepted": True}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not WorkspaceMember.objects.filter(workspace=workspace, member=squatter).exists()

    @pytest.mark.django_db
    def test_cross_workspace_acceptance_rejected(self, workspace_with_twelve_members):
        """An invite can only be accepted through its own workspace slug."""
        workspace_a, owner = workspace_with_twelve_members
        workspace_b = _create_workspace("other-tenant", owner)
        invite = WorkspaceMemberInvite.objects.create(
            email="cross@plane.so",
            workspace=workspace_a,
            token="cross-token",
            role=15,
            created_by=owner,
        )

        invitee = _create_user("cross@plane.so", "Cross", "Tenant")
        client = APIClient()
        client.force_authenticate(user=invitee)
        # Attempt to accept via the wrong (tenant B) workspace slug.
        url = reverse("workspace-join", args=[workspace_b.slug, invite.id])
        response = client.post(url, {"token": "cross-token", "accepted": True}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not WorkspaceMember.objects.filter(workspace=workspace_a, member=invitee).exists()


@pytest.mark.contract
class TestCommunityEditionNeutrality:
    """The historical default Community edition identity never blocks membership."""

    @pytest.mark.django_db
    @patch("plane.bgtasks.workspace_invitation_task.workspace_invitation.delay")
    @patch("plane.bgtasks.event_tracking_task.track_event.delay")
    def test_default_community_instance_allows_thirteenth_invite(
        self, mock_track, mock_invite, api_client, workspace_with_twelve_members
    ):
        """A workspace under the default PLANE_COMMUNITY instance accepts a 13th
        invite — the edition value itself is not a membership gate."""
        _create_instance(edition=InstanceEdition.PLANE_COMMUNITY.value)

        workspace, owner = workspace_with_twelve_members
        api_client.force_authenticate(user=owner)
        url = reverse("workspace-invitations", args=[workspace.slug])
        response = api_client.post(
            url,
            {"emails": [{"email": "seat-edition@plane.so", "role": 15}]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert WorkspaceMemberInvite.objects.filter(workspace=workspace, email="seat-edition@plane.so").exists()


@pytest.mark.contract
class TestEstimateTimeSystem:
    """The TIME estimate system (previously EE-gated) works for self-hosted."""

    @pytest.mark.django_db
    def test_time_estimate_creation_and_retrieval(self, db):
        """Creating an estimate with type 'time' succeeds and round-trips."""
        owner = _create_user("estimate-owner@plane.so", "Estimate", "Owner")
        workspace = _create_workspace("estimate-time", owner)
        project = Project.objects.create(
            name="Estimate Project", identifier="ET", workspace=workspace, created_by=owner, updated_by=owner
        )
        ProjectMember.objects.create(project=project, member=owner, role=20)

        client = APIClient()
        client.force_authenticate(user=owner)
        url = reverse("bulk-create-estimate-points", args=[workspace.slug, project.id])
        response = client.post(
            url,
            {
                "estimate": {"name": "Hours", "type": "time"},
                "estimate_points": [
                    {"key": 1, "value": "1"},
                    {"key": 2, "value": "2"},
                ],
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        estimate = Estimate.objects.get(name="Hours", project=project)
        assert estimate.type == "time"

        retrieve_url = reverse("bulk-create-estimate-points", args=[workspace.slug, project.id, estimate.id])
        retrieved = client.get(retrieve_url)
        assert retrieved.status_code == status.HTTP_200_OK
        assert retrieved.data.get("type") == "time"
