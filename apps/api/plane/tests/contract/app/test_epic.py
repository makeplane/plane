# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from uuid import uuid4
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueType,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)
from plane.utils.issue_type import create_default_issue_types


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as an admin member"""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin role
        is_active=True,
    )
    return project


@pytest.fixture
def other_project(db, workspace, create_user):
    """Create a second project in the same workspace"""
    project = Project.objects.create(
        name="Other Project",
        identifier="OP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


@pytest.fixture
def epic_type(db, project):
    """Seed the default work item types and return the project's epic type"""
    create_default_issue_types(project)
    return IssueType.objects.get(project_issue_types__project=project, is_epic=True)


@pytest.fixture
def default_type(db, project, epic_type):
    """Return the project's default work item type"""
    return IssueType.objects.get(project_issue_types__project=project, is_default=True)


@pytest.fixture
def member_client(db, workspace, project):
    """Return a session client authenticated as a project member (role 15)"""
    member = User.objects.create(
        email=f"member-{uuid4().hex[:8]}@plane.so", username=f"member-{uuid4().hex[:12]}", first_name="Member"
    )
    WorkspaceMember.objects.create(workspace=workspace, member=member, role=15, is_active=True)
    ProjectMember.objects.create(project=project, member=member, role=15, is_active=True)
    client = APIClient()
    client.force_authenticate(user=member)
    return client


@pytest.fixture
def guest_client(db, workspace, project):
    """Return a session client authenticated as a project guest (role 5)"""
    guest = User.objects.create(
        email=f"guest-{uuid4().hex[:8]}@plane.so", username=f"guest-{uuid4().hex[:12]}", first_name="Guest"
    )
    WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
    ProjectMember.objects.create(project=project, member=guest, role=5, is_active=True)
    client = APIClient()
    client.force_authenticate(user=guest)
    return client


def epics_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/epics/"


def epic_detail_url(slug, project_id, epic_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/epics/{epic_id}/"


def epic_issues_url(slug, project_id, epic_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/epics/{epic_id}/issues/"


def issues_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/"


def make_epic(project, epic_type, name="Epic 1", **kwargs):
    return Issue.objects.create(name=name, project=project, type=epic_type, **kwargs)


def make_issue(project, issue_type=None, name="Issue 1", **kwargs):
    return Issue.objects.create(name=name, project=project, type=issue_type, **kwargs)


def result_ids(response):
    """Extract issue ids from a paginated listing response"""
    return {str(issue["id"]) for issue in response.data["results"]}


@pytest.mark.contract
class TestEpicCreate:
    @pytest.mark.django_db
    def test_create_epic_forces_epic_type(self, session_client, workspace, project, epic_type):
        response = session_client.post(
            epics_url(workspace.slug, project.id),
            {"name": "My Epic"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert str(response.data["type_id"]) == str(epic_type.id)
        assert Issue.objects.get(pk=response.data["id"]).type_id == epic_type.id

    @pytest.mark.django_db
    def test_create_epic_overrides_other_type_id(self, session_client, workspace, project, epic_type, default_type):
        response = session_client.post(
            epics_url(workspace.slug, project.id),
            {"name": "My Epic", "type_id": str(default_type.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert str(response.data["type_id"]) == str(epic_type.id)

    @pytest.mark.django_db
    def test_create_epic_without_epic_type_404(self, session_client, workspace, project):
        # The project has no seeded epic type — the feature is not enabled
        response = session_client.post(
            epics_url(workspace.slug, project.id),
            {"name": "My Epic"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_create_epic_with_parent_400(self, session_client, workspace, project, epic_type, default_type):
        issue = make_issue(project, default_type)
        response = session_client.post(
            epics_url(workspace.slug, project.id),
            {"name": "My Epic", "parent_id": str(issue.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_epic_member_allowed(self, member_client, workspace, project, epic_type):
        response = member_client.post(
            epics_url(workspace.slug, project.id),
            {"name": "Member Epic"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    @pytest.mark.django_db
    def test_create_epic_guest_forbidden(self, guest_client, workspace, project, epic_type):
        response = guest_client.post(
            epics_url(workspace.slug, project.id),
            {"name": "Guest Epic"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestEpicRetrieveUpdateDelete:
    @pytest.mark.django_db
    def test_retrieve_epic(self, session_client, workspace, project, epic_type):
        epic = make_epic(project, epic_type)
        response = session_client.get(epic_detail_url(workspace.slug, project.id, epic.id))
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(epic.id)

    @pytest.mark.django_db
    def test_retrieve_non_epic_via_epics_404(self, session_client, workspace, project, epic_type, default_type):
        issue = make_issue(project, default_type)
        response = session_client.get(epic_detail_url(workspace.slug, project.id, issue.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_retrieve_epic_cross_project_404(self, session_client, workspace, project, other_project, epic_type):
        epic = make_epic(project, epic_type)
        response = session_client.get(epic_detail_url(workspace.slug, other_project.id, epic.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_patch_epic(self, session_client, workspace, project, epic_type):
        epic = make_epic(project, epic_type)
        response = session_client.patch(
            epic_detail_url(workspace.slug, project.id, epic.id),
            {"name": "Renamed Epic"},
            format="json",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        epic.refresh_from_db()
        assert epic.name == "Renamed Epic"

    @pytest.mark.django_db
    def test_patch_epic_with_parent_400(self, session_client, workspace, project, epic_type, default_type):
        epic = make_epic(project, epic_type)
        issue = make_issue(project, default_type)
        response = session_client.patch(
            epic_detail_url(workspace.slug, project.id, epic.id),
            {"parent_id": str(issue.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        epic.refresh_from_db()
        assert epic.parent_id is None

    @pytest.mark.django_db
    def test_patch_epic_cannot_change_type(self, session_client, workspace, project, epic_type, default_type):
        epic = make_epic(project, epic_type)
        response = session_client.patch(
            epic_detail_url(workspace.slug, project.id, epic.id),
            {"type_id": str(default_type.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        epic.refresh_from_db()
        assert epic.type_id == epic_type.id

    @pytest.mark.django_db
    def test_delete_epic(self, session_client, workspace, project, epic_type):
        epic = make_epic(project, epic_type)
        response = session_client.delete(epic_detail_url(workspace.slug, project.id, epic.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Issue.objects.filter(pk=epic.id).exists()

    @pytest.mark.django_db
    def test_delete_non_epic_via_epics_404(self, session_client, workspace, project, epic_type, default_type):
        issue = make_issue(project, default_type)
        response = session_client.delete(epic_detail_url(workspace.slug, project.id, issue.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert Issue.objects.filter(pk=issue.id).exists()


@pytest.mark.contract
class TestEpicListings:
    @pytest.mark.django_db
    def test_epics_list_contains_only_epics(self, session_client, workspace, project, epic_type, default_type):
        epic = make_epic(project, epic_type)
        make_issue(project, default_type)
        response = session_client.get(epics_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        assert result_ids(response) == {str(epic.id)}

    @pytest.mark.django_db
    def test_standard_list_excludes_epics(self, session_client, workspace, project, epic_type, default_type):
        make_epic(project, epic_type)
        issue = make_issue(project, default_type)
        untyped = make_issue(project, None, name="Untyped")
        response = session_client.get(issues_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        assert result_ids(response) == {str(issue.id), str(untyped.id)}

    @pytest.mark.django_db
    def test_epics_bulk_list_endpoint(self, session_client, workspace, project, epic_type, default_type):
        epic = make_epic(project, epic_type)
        issue = make_issue(project, default_type)
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/epics/list/?issues={epic.id},{issue.id}"
        )
        assert response.status_code == status.HTTP_200_OK
        assert {str(item["id"]) for item in response.data} == {str(epic.id)}

    @pytest.mark.django_db
    def test_issues_bulk_list_endpoint_excludes_epics(
        self, session_client, workspace, project, epic_type, default_type
    ):
        epic = make_epic(project, epic_type)
        issue = make_issue(project, default_type)
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/list/?issues={epic.id},{issue.id}"
        )
        assert response.status_code == status.HTTP_200_OK
        assert {str(item["id"]) for item in response.data} == {str(issue.id)}

    @pytest.mark.django_db
    def test_v2_epics_paginated(self, session_client, workspace, project, epic_type, default_type):
        epic = make_epic(project, epic_type)
        make_issue(project, default_type)
        response = session_client.get(f"/api/workspaces/{workspace.slug}/projects/{project.id}/v2/epics/")
        assert response.status_code == status.HTTP_200_OK
        assert {str(item["id"]) for item in response.data["results"]} == {str(epic.id)}

    @pytest.mark.django_db
    def test_v2_issues_paginated_excludes_epics(self, session_client, workspace, project, epic_type, default_type):
        make_epic(project, epic_type)
        issue = make_issue(project, default_type)
        response = session_client.get(f"/api/workspaces/{workspace.slug}/projects/{project.id}/v2/issues/")
        assert response.status_code == status.HTTP_200_OK
        assert {str(item["id"]) for item in response.data["results"]} == {str(issue.id)}

    @pytest.mark.django_db
    def test_epics_detail_listing(self, session_client, workspace, project, epic_type, default_type):
        epic = make_epic(project, epic_type)
        make_issue(project, default_type)
        response = session_client.get(f"/api/workspaces/{workspace.slug}/projects/{project.id}/epics-detail/")
        assert response.status_code == status.HTTP_200_OK
        assert result_ids(response) == {str(epic.id)}

    @pytest.mark.django_db
    def test_issues_detail_listing_excludes_epics(self, session_client, workspace, project, epic_type, default_type):
        make_epic(project, epic_type)
        issue = make_issue(project, default_type)
        response = session_client.get(f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues-detail/")
        assert response.status_code == status.HTTP_200_OK
        assert result_ids(response) == {str(issue.id)}

    @pytest.mark.django_db
    def test_issue_retrieve_still_works_for_epic(self, session_client, workspace, project, epic_type):
        # Browsing an epic through the standard detail route must keep working
        epic = make_epic(project, epic_type)
        response = session_client.get(f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{epic.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(epic.id)


@pytest.mark.contract
class TestEpicChildren:
    @pytest.mark.django_db
    def test_get_children_with_state_distribution(self, session_client, workspace, project, epic_type, default_type):
        epic = make_epic(project, epic_type)
        child_1 = make_issue(project, default_type, name="Child 1", parent=epic)
        child_2 = make_issue(project, default_type, name="Child 2", parent=epic)
        response = session_client.get(epic_issues_url(workspace.slug, project.id, epic.id))
        assert response.status_code == status.HTTP_200_OK
        assert {str(item["id"]) for item in response.data["sub_issues"]} == {str(child_1.id), str(child_2.id)}
        distribution = response.data["state_distribution"]
        distributed_ids = {issue_id for ids in distribution.values() for issue_id in ids}
        assert distributed_ids == {str(child_1.id), str(child_2.id)}

    @pytest.mark.django_db
    def test_get_children_404_for_non_epic(self, session_client, workspace, project, epic_type, default_type):
        issue = make_issue(project, default_type)
        response = session_client.get(epic_issues_url(workspace.slug, project.id, issue.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_post_children_attaches_issues(self, session_client, workspace, project, epic_type, default_type):
        epic = make_epic(project, epic_type)
        child = make_issue(project, default_type)
        response = session_client.post(
            epic_issues_url(workspace.slug, project.id, epic.id),
            {"sub_issue_ids": [str(child.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        child.refresh_from_db()
        assert child.parent_id == epic.id
        assert "state_distribution" in response.data

    @pytest.mark.django_db
    def test_post_children_refuses_epic_child(self, session_client, workspace, project, epic_type):
        epic = make_epic(project, epic_type)
        other_epic = make_epic(project, epic_type, name="Epic 2")
        response = session_client.post(
            epic_issues_url(workspace.slug, project.id, epic.id),
            {"sub_issue_ids": [str(other_epic.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        other_epic.refresh_from_db()
        assert other_epic.parent_id is None

    @pytest.mark.django_db
    def test_post_children_refuses_cross_project(
        self, session_client, workspace, project, other_project, epic_type, default_type
    ):
        epic = make_epic(project, epic_type)
        foreign_issue = make_issue(other_project, None, name="Foreign")
        response = session_client.post(
            epic_issues_url(workspace.slug, project.id, epic.id),
            {"sub_issue_ids": [str(foreign_issue.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        foreign_issue.refresh_from_db()
        assert foreign_issue.parent_id is None

    @pytest.mark.django_db
    def test_post_children_404_when_target_not_epic(self, session_client, workspace, project, epic_type, default_type):
        issue = make_issue(project, default_type)
        child = make_issue(project, default_type, name="Child")
        response = session_client.post(
            epic_issues_url(workspace.slug, project.id, issue.id),
            {"sub_issue_ids": [str(child.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestEpicTransverseGuards:
    @pytest.mark.django_db
    def test_sub_issues_endpoint_refuses_epic_child(self, session_client, workspace, project, epic_type, default_type):
        issue = make_issue(project, default_type)
        epic = make_epic(project, epic_type)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/sub-issues/",
            {"sub_issue_ids": [str(epic.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        epic.refresh_from_db()
        assert epic.parent_id is None

    @pytest.mark.django_db
    def test_issue_create_epic_type_with_parent_400(self, session_client, workspace, project, epic_type, default_type):
        issue = make_issue(project, default_type)
        response = session_client.post(
            issues_url(workspace.slug, project.id),
            {"name": "Bad Epic", "type_id": str(epic_type.id), "parent_id": str(issue.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_cycle_add_refuses_epic(self, session_client, workspace, project, create_user, epic_type):
        epic = make_epic(project, epic_type)
        cycle = Cycle.objects.create(name="Cycle 1", project=project, workspace=workspace, owned_by=create_user)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/cycles/{cycle.id}/cycle-issues/",
            {"issues": [str(epic.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not CycleIssue.objects.filter(issue=epic).exists()

    @pytest.mark.django_db
    def test_module_add_refuses_epic(self, session_client, workspace, project, epic_type):
        epic = make_epic(project, epic_type)
        module = Module.objects.create(name="Module 1", project=project, workspace=workspace)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/modules/{module.id}/issues/",
            {"issues": [str(epic.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not ModuleIssue.objects.filter(issue=epic).exists()

    @pytest.mark.django_db
    def test_issue_modules_refuses_epic(self, session_client, workspace, project, epic_type):
        epic = make_epic(project, epic_type)
        module = Module.objects.create(name="Module 1", project=project, workspace=workspace)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{epic.id}/modules/",
            {"modules": [str(module.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not ModuleIssue.objects.filter(issue=epic).exists()

    @pytest.mark.django_db
    def test_archive_epic_400(self, session_client, workspace, project, epic_type):
        epic = make_epic(project, epic_type)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{epic.id}/archive/"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        epic.refresh_from_db()
        assert epic.archived_at is None

    @pytest.mark.django_db
    def test_bulk_archive_refuses_epics(self, session_client, workspace, project, epic_type):
        epic = make_epic(project, epic_type)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/bulk-archive-issues/",
            {"issue_ids": [str(epic.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        epic.refresh_from_db()
        assert epic.archived_at is None

    @pytest.mark.django_db
    def test_issue_type_create_strips_is_epic(self, session_client, workspace, project, epic_type):
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/issue-types/",
            {"name": "Fake Epic", "is_epic": True},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["is_epic"] is False
        # The seeded epic type remains the only epic type of the project
        assert IssueType.objects.filter(project_issue_types__project=project, is_epic=True).count() == 1

    @pytest.mark.django_db
    def test_no_archive_route_for_epics(self, session_client, workspace, project, epic_type):
        epic = make_epic(project, epic_type)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/epics/{epic.id}/archive/"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_epic_type_cannot_be_deleted(self, session_client, workspace, project, epic_type):
        make_epic(project, epic_type)
        response = session_client.delete(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/issue-types/{epic_type.id}/"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert IssueType.objects.filter(pk=epic_type.id).exists()
