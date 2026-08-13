from datetime import timedelta
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Cycle, Project, ProjectMember, User, Workspace, WorkspaceMember
from plane.license.models import Instance


ACTIVE_CYCLES_URL = "/api/workspaces/{slug}/active-cycles/"


def create_project(workspace, user, name="Project", identifier="PR", cycle_view=True, archived_at=None):
    project = Project.objects.create(
        name=name,
        identifier=identifier,
        workspace=workspace,
        created_by=user,
        cycle_view=cycle_view,
        archived_at=archived_at,
    )
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=20, is_active=True)
    return project


def create_cycle(workspace, project, user, name="Cycle", starts_in_days=-1, ends_in_days=1, archived_at=None):
    now = timezone.now()
    return Cycle.objects.create(
        name=name,
        workspace=workspace,
        project=project,
        owned_by=user,
        start_date=now + timedelta(days=starts_in_days),
        end_date=now + timedelta(days=ends_in_days),
        archived_at=archived_at,
    )


@pytest.fixture
def project(db, workspace, create_user):
    return create_project(workspace, create_user, "Alpha", "ALP")


@pytest.fixture
def member_user(db):
    unique_id = uuid4().hex[:8]
    return User.objects.create(
        email=f"active-member-{unique_id}@plane.so",
        username=f"active_member_{unique_id}",
        first_name="Active",
        last_name="Member",
    )


@pytest.fixture
def guest_user(db):
    unique_id = uuid4().hex[:8]
    return User.objects.create(
        email=f"active-guest-{unique_id}@plane.so",
        username=f"active_guest_{unique_id}",
        first_name="Active",
        last_name="Guest",
    )


@pytest.mark.contract
class TestWorkspaceActiveCycles:
    @pytest.mark.django_db
    def test_returns_accessible_active_cycle(self, session_client, workspace, project, create_user):
        cycle = create_cycle(workspace, project, create_user, "Current Cycle")

        response = session_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 20, "cursor": "20:0:0"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert str(response.data["results"][0]["id"]) == str(cycle.id)
        assert response.data["results"][0]["status"] == "CURRENT"
        assert response.data["results"][0]["project_detail"]["identifier"] == project.identifier

    @pytest.mark.django_db
    def test_aggregates_active_cycles_from_multiple_accessible_projects(self, session_client, workspace, project, create_user):
        second_project = create_project(workspace, create_user, "Beta", "BET")
        cycle_1 = create_cycle(workspace, project, create_user, "Alpha Current")
        cycle_2 = create_cycle(workspace, second_project, create_user, "Beta Current")

        response = session_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 20, "cursor": "20:0:0"})

        assert response.status_code == status.HTTP_200_OK
        cycle_ids = {str(cycle["id"]) for cycle in response.data["results"]}
        assert cycle_ids == {str(cycle_1.id), str(cycle_2.id)}

    @pytest.mark.django_db
    def test_excludes_future_and_completed_cycles(self, session_client, workspace, project, create_user):
        current_cycle = create_cycle(workspace, project, create_user, "Current")
        future_cycle = create_cycle(workspace, project, create_user, "Future", starts_in_days=1, ends_in_days=7)
        completed_cycle = create_cycle(workspace, project, create_user, "Completed", starts_in_days=-7, ends_in_days=-1)

        response = session_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 20, "cursor": "20:0:0"})

        assert response.status_code == status.HTTP_200_OK
        cycle_ids = {str(cycle["id"]) for cycle in response.data["results"]}
        assert str(current_cycle.id) in cycle_ids
        assert str(future_cycle.id) not in cycle_ids
        assert str(completed_cycle.id) not in cycle_ids

    @pytest.mark.django_db
    def test_excludes_project_with_cycles_disabled(self, session_client, workspace, create_user):
        disabled_project = create_project(workspace, create_user, "Disabled", "DIS", cycle_view=False)
        cycle = create_cycle(workspace, disabled_project, create_user, "Hidden Current")

        response = session_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 20, "cursor": "20:0:0"})

        assert response.status_code == status.HTTP_200_OK
        assert str(cycle.id) not in {str(row["id"]) for row in response.data["results"]}

    @pytest.mark.django_db
    def test_private_project_cycle_hidden_from_workspace_member_without_project_membership(
        self, api_client, workspace, project, create_user, member_user
    ):
        cycle = create_cycle(workspace, project, create_user, "Private Current")
        WorkspaceMember.objects.create(workspace=workspace, member=member_user, role=15, is_active=True)
        api_client.force_authenticate(user=member_user)

        response = api_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 20, "cursor": "20:0:0"})

        assert response.status_code == status.HTTP_200_OK
        assert str(cycle.id) not in {str(row["id"]) for row in response.data["results"]}

    @pytest.mark.django_db
    def test_guest_sees_only_project_cycles_they_belong_to(self, api_client, workspace, project, create_user, guest_user):
        visible_project = create_project(workspace, create_user, "Visible", "VIS")
        hidden_cycle = create_cycle(workspace, project, create_user, "Hidden")
        visible_cycle = create_cycle(workspace, visible_project, create_user, "Visible")
        WorkspaceMember.objects.create(workspace=workspace, member=guest_user, role=5, is_active=True)
        ProjectMember.objects.create(project=visible_project, member=guest_user, workspace=workspace, role=5, is_active=True)
        api_client.force_authenticate(user=guest_user)

        response = api_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 20, "cursor": "20:0:0"})

        assert response.status_code == status.HTTP_200_OK
        cycle_ids = {str(cycle["id"]) for cycle in response.data["results"]}
        assert str(visible_cycle.id) in cycle_ids
        assert str(hidden_cycle.id) not in cycle_ids

    @pytest.mark.django_db
    def test_cross_workspace_cycles_do_not_leak(self, session_client, workspace, project, create_user):
        visible_cycle = create_cycle(workspace, project, create_user, "Visible")
        other_workspace = Workspace.objects.create(name="Other Workspace", slug="other-workspace", owner=create_user)
        other_project = create_project(other_workspace, create_user, "Other", "OTH")
        other_cycle = create_cycle(other_workspace, other_project, create_user, "Other Current")

        response = session_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 20, "cursor": "20:0:0"})

        assert response.status_code == status.HTTP_200_OK
        cycle_ids = {str(cycle["id"]) for cycle in response.data["results"]}
        assert str(visible_cycle.id) in cycle_ids
        assert str(other_cycle.id) not in cycle_ids

    @pytest.mark.django_db
    def test_unauthorized_workspace_request_is_rejected(self, api_client, workspace, create_user):
        outsider = User.objects.create(email="active-outsider@plane.so", username="active-outsider")
        api_client.force_authenticate(user=outsider)

        response = api_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 20, "cursor": "20:0:0"})

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_pagination_is_bounded_and_stable(self, session_client, workspace, project, create_user):
        older_cycle = create_cycle(workspace, project, create_user, "Older", starts_in_days=-2, ends_in_days=1)
        newer_cycle = create_cycle(workspace, project, create_user, "Newer", starts_in_days=-1, ends_in_days=2)

        response = session_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 1, "cursor": "1:0:0"})
        next_response = session_client.get(
            ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 1, "cursor": response.data["next_cursor"]}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["next_page_results"] is True
        assert str(response.data["results"][0]["id"]) == str(older_cycle.id)
        assert next_response.status_code == status.HTTP_200_OK
        assert str(next_response.data["results"][0]["id"]) == str(newer_cycle.id)

    @pytest.mark.django_db
    def test_archived_cycles_and_projects_are_excluded(self, session_client, workspace, project, create_user):
        archived_cycle = create_cycle(workspace, project, create_user, "Archived Cycle", archived_at=timezone.now())
        archived_project = create_project(workspace, create_user, "Archived Project", "ARP", archived_at=timezone.now())
        cycle_in_archived_project = create_cycle(workspace, archived_project, create_user, "Archived Project Cycle")

        response = session_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 20, "cursor": "20:0:0"})

        assert response.status_code == status.HTTP_200_OK
        cycle_ids = {str(cycle["id"]) for cycle in response.data["results"]}
        assert str(archived_cycle.id) not in cycle_ids
        assert str(cycle_in_archived_project.id) not in cycle_ids

    @pytest.mark.django_db
    def test_date_boundaries_are_inclusive(self, session_client, workspace, project, create_user):
        now = timezone.now()
        starts_now = Cycle.objects.create(
            name="Starts Now",
            workspace=workspace,
            project=project,
            owned_by=create_user,
            start_date=now,
            end_date=now + timedelta(days=1),
        )
        ends_now = Cycle.objects.create(
            name="Ends Now",
            workspace=workspace,
            project=project,
            owned_by=create_user,
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(seconds=1),
        )

        response = session_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 20, "cursor": "20:0:0"})

        assert response.status_code == status.HTTP_200_OK
        cycle_ids = {str(cycle["id"]) for cycle in response.data["results"]}
        assert str(starts_now.id) in cycle_ids
        assert str(ends_now.id) in cycle_ids

    @pytest.mark.django_db
    def test_community_instance_member_can_access_active_cycles(
        self, api_client, workspace, create_user, member_user
    ):
        Instance.objects.update(edition="PLANE_COMMUNITY")
        project = create_project(workspace, create_user, "Community", "COM")
        cycle = create_cycle(workspace, project, create_user, "Community Current")
        WorkspaceMember.objects.create(workspace=workspace, member=member_user, role=15, is_active=True)
        ProjectMember.objects.create(project=project, member=member_user, workspace=workspace, role=15, is_active=True)
        api_client.force_authenticate(user=member_user)

        response = api_client.get(ACTIVE_CYCLES_URL.format(slug=workspace.slug), {"per_page": 20, "cursor": "20:0:0"})

        assert response.status_code == status.HTTP_200_OK
        assert str(cycle.id) in {str(row["id"]) for row in response.data["results"]}
