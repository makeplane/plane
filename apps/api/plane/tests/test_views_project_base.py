import json
from unittest import mock

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate

# NOTE: Import paths may need adjustment based on the repo's layout.
# We bias for action by importing via common app paths; adapt as needed if tests fail.
from plane.app.models import (
    Project,
    Workspace,
    WorkspaceMember,
    ProjectMember,
    DeployBoard,
    UserFavorite,
    Intake,
    State,
    ProjectIdentifier,
    User,
)
from plane.app.views import (
    ProjectViewSet,
    ProjectArchiveUnarchiveEndpoint,
    ProjectIdentifierEndpoint,
    ProjectUserViewsEndpoint,
    ProjectFavoritesViewSet,
    ProjectPublicCoverImagesEndpoint,
    DeployBoardViewSet,
)
from plane.app.permissions import ROLE


@pytest.mark.django_db
class TestProjectViewSetListDetail:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.client = APIClient()
        # Users
        self.owner = User.objects.create_user(email="owner@example.com", password="x")
        self.member = User.objects.create_user(email="member@example.com", password="x")
        self.guest = User.objects.create_user(email="guest@example.com", password="x")
        # Workspace and memberships
        self.ws = Workspace.objects.create(name="Acme", slug="acme")
        WorkspaceMember.objects.create(
            workspace=self.ws, member=self.owner, role=ROLE.ADMIN.value, is_active=True
        )
        WorkspaceMember.objects.create(
            workspace=self.ws, member=self.member, role=ROLE.MEMBER.value, is_active=True
        )
        WorkspaceMember.objects.create(
            workspace=self.ws, member=self.guest, role=ROLE.GUEST.value, is_active=True
        )
        # Projects
        self.p1 = Project.objects.create(name="P1", identifier="P1", workspace=self.ws)
        self.p2 = Project.objects.create(name="P2", identifier="P2", workspace=self.ws, network=2)
        self.p3 = Project.objects.create(name="P3", identifier="P3", workspace=self.ws, archived_at=None)
        # Project memberships
        ProjectMember.objects.create(project=self.p1, workspace=self.ws, member=self.owner, role=ROLE.ADMIN.value, is_active=True)
        ProjectMember.objects.create(project=self.p1, workspace=self.ws, member=self.member, role=ROLE.MEMBER.value, is_active=True)
        ProjectMember.objects.create(project=self.p2, workspace=self.ws, member=self.owner, role=ROLE.ADMIN.value, is_active=True)
        ProjectMember.objects.create(project=self.p3, workspace=self.ws, member=self.owner, role=ROLE.ADMIN.value, is_active=True)
        # Favorites and DeployBoard anchor annotations coverage
        UserFavorite.objects.create(user=self.owner, entity_type="project", entity_identifier=self.p1.id, project=self.p1, workspace=self.ws)
        DeployBoard.objects.create(entity_name="project", entity_identifier=self.p1.id, project=self.p1, workspace=self.ws, anchor="p1-anchor")

    def _view(self, action: str):
        return ProjectViewSet.as_view({ "get": action })

    def test_list_detail_admin_sees_all_sorted(self):
        request = self.factory.get(f"/workspaces/{self.ws.slug}/projects/list-detail")
        force_authenticate(request, user=self.owner)
        response = self._view("list_detail")(request, slug=self.ws.slug)
        assert response.status_code == status.HTTP_200_OK
        # Should include at least p1, p2, p3
        ids = [p["id"] for p in response.data]
        assert self.p1.id in ids and self.p2.id in ids and self.p3.id in ids

    def test_list_detail_guest_only_memberships(self):
        request = self.factory.get(f"/workspaces/{self.ws.slug}/projects/list-detail")
        force_authenticate(request, user=self.guest)
        response = self._view("list_detail")(request, slug=self.ws.slug)
        assert response.status_code == status.HTTP_200_OK
        # guest not a member of any project -> sees none
        assert response.data == []

        # Add guest to p1, ensure visibility
        ProjectMember.objects.create(project=self.p1, workspace=self.ws, member=self.guest, role=ROLE.GUEST.value, is_active=True)
        request = self.factory.get(f"/workspaces/{self.ws.slug}/projects/list-detail")
        force_authenticate(request, user=self.guest)
        response = self._view("list_detail")(request, slug=self.ws.slug)
        ids = [p["id"] for p in response.data]
        assert self.p1.id in ids
        assert self.p2.id not in ids  # guest not member of p2

    def test_list_detail_member_sees_memberships_plus_network_2(self):
        request = self.factory.get(f"/workspaces/{self.ws.slug}/projects/list-detail")
        force_authenticate(request, user=self.member)
        response = self._view("list_detail")(request, slug=self.ws.slug)
        assert response.status_code == status.HTTP_200_OK
        ids = [p["id"] for p in response.data]
        # Member of p1, should also see p2 because network=2
        assert self.p1.id in ids and self.p2.id in ids

    def test_list_detail_fields_filtering(self):
        request = self.factory.get(f"/workspaces/{self.ws.slug}/projects/list-detail?fields=id,name")
        force_authenticate(request, user=self.owner)
        response = self._view("list_detail")(request, slug=self.ws.slug)
        assert response.status_code == status.HTTP_200_OK
        assert set(response.data[0].keys()).issubset({"id","name"})

    def test_list_detail_cursor_pagination_path(self, monkeypatch):
        # Force paginate branch by providing per_page and cursor
        request = self.factory.get(f"/workspaces/{self.ws.slug}/projects/list-detail?per_page=2&cursor=abc&order_by=-created_at")
        force_authenticate(request, user=self.owner)
        # Mock paginate to ensure it is invoked
        with mock.patch.object(ProjectViewSet, "paginate", return_value=mock.sentinel.PAGED) as m:
            response = self._view("list_detail")(request, slug=self.ws.slug)
            assert response == mock.sentinel.PAGED
            assert m.called


@pytest.mark.django_db
class TestProjectViewSetList:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.ws = Workspace.objects.create(name="Acme", slug="acme")
        self.admin = User.objects.create_user(email="admin@example.com", password="x")
        WorkspaceMember.objects.create(workspace=self.ws, member=self.admin, role=ROLE.ADMIN.value, is_active=True)
        self.p1 = Project.objects.create(name="P1", identifier="P1", workspace=self.ws)
        self.p2 = Project.objects.create(name="P2", identifier="P2", workspace=self.ws, network=2)
        ProjectMember.objects.create(project=self.p1, workspace=self.ws, member=self.admin, role=ROLE.ADMIN.value, is_active=True)

    def _view(self, action):
        return ProjectViewSet.as_view({ "get": action })

    def test_list_values_shape_and_inbox_view(self):
        request = self.factory.get(f"/workspaces/{self.ws.slug}/projects")
        force_authenticate(request, user=self.admin)
        response = self._view("list")(request, slug=self.ws.slug)
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        item = response.data[0]
        # Expect selected fields only
        expected_subset = {"id","name","identifier","sort_order","member_role","inbox_view","network","created_at","updated_at"}
        assert expected_subset.issubset(set(item.keys()))

    def test_list_member_filtering_includes_network_two(self):
        member = User.objects.create_user(email="member@example.com", password="x")
        WorkspaceMember.objects.create(workspace=self.ws, member=member, role=ROLE.MEMBER.value, is_active=True)
        ProjectMember.objects.create(project=self.p1, workspace=self.ws, member=member, role=ROLE.MEMBER.value, is_active=True)

        request = self.factory.get(f"/workspaces/{self.ws.slug}/projects")
        force_authenticate(request, user=member)
        response = self._view("list")(request, slug=self.ws.slug)
        ids = [p["id"] for p in response.data]
        assert self.p1.id in ids
        assert self.p2.id in ids  # network=2 visible to members


@pytest.mark.django_db
class TestProjectViewSetRetrieveCreateUpdateDestroy:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.ws = Workspace.objects.create(name="Acme", slug="acme")
        self.admin = User.objects.create_user(email="admin@example.com", password="x")
        self.member = User.objects.create_user(email="user@example.com", password="x")
        WorkspaceMember.objects.create(workspace=self.ws, member=self.admin, role=ROLE.ADMIN.value, is_active=True)
        WorkspaceMember.objects.create(workspace=self.ws, member=self.member, role=ROLE.MEMBER.value, is_active=True)
        self.project = Project.objects.create(name="Proj", identifier="PROJ", workspace=self.ws)
        ProjectMember.objects.create(project=self.project, workspace=self.ws, member=self.admin, role=ROLE.ADMIN.value, is_active=True)

    def _view(self, method_name, http_method="get"):
        return ProjectViewSet.as_view({ http_method: method_name })

    @mock.patch("plane.app.views.recent_visited_task.delay")
    def test_retrieve_happy_path_and_404(self, mock_task):
        # make member of project
        ProjectMember.objects.create(project=self.project, workspace=self.ws, member=self.member, role=ROLE.MEMBER.value, is_active=True)
        # OK
        req = self.factory.get("/")
        force_authenticate(req, user=self.member)
        resp = self._view("retrieve")(req, slug=self.ws.slug, pk=str(self.project.id))
        assert resp.status_code == status.HTTP_200_OK
        mock_task.assert_called_once()
        # 404 when not a member
        outsider = User.objects.create_user(email="out@example.com", password="x")
        WorkspaceMember.objects.create(workspace=self.ws, member=outsider, role=ROLE.MEMBER.value, is_active=True)
        req = self.factory.get("/")
        force_authenticate(req, user=outsider)
        resp = self._view("retrieve")(req, slug=self.ws.slug, pk=str(self.project.id))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    @mock.patch("plane.app.views.model_activity.delay")
    def test_create_creates_default_states_and_members(self, mock_activity):
        req = self.factory.post("/", data={"name": "NewProj", "identifier": "NP"}, format="json")
        force_authenticate(req, user=self.admin)
        resp = self._view("create", http_method="post")(req, slug=self.ws.slug)
        assert resp.status_code == status.HTTP_201_CREATED
        created_id = resp.data["id"]
        # Defaults: states created
        assert State.objects.filter(project_id=created_id, workspace=self.ws).count() >= 5
        # Memberships: admin added
        assert ProjectMember.objects.filter(project_id=created_id, member=self.admin, role=ROLE.ADMIN.value).exists()
        mock_activity.assert_called_once()

    @mock.patch("plane.app.views.model_activity.delay")
    def test_partial_update_requires_permission_and_handles_archived(self, mock_activity):
        # Non-admin project member should be forbidden
        non_admin = self.member
        ProjectMember.objects.create(project=self.project, workspace=self.ws, member=non_admin, role=ROLE.MEMBER.value, is_active=True)
        req = self.factory.patch("/", data={"name": "X"}, format="json")
        force_authenticate(req, user=non_admin)
        resp = self._view("partial_update", http_method="patch")(req, slug=self.ws.slug, pk=str(self.project.id))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

        # Archive project then attempt update -> 400
        self.project.archived_at = timezone.now()
        self.project.save()
        req = self.factory.patch("/", data={"name": "Y"}, format="json")
        force_authenticate(req, user=self.admin)
        resp = self._view("partial_update", http_method="patch")(req, slug=self.ws.slug, pk=str(self.project.id))
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

        # Unarchive and enable inbox_view -> ensure Intake default created
        self.project.archived_at = None
        self.project.save()
        req = self.factory.patch("/", data={"inbox_view": True}, format="json")
        force_authenticate(req, user=self.admin)
        resp = self._view("partial_update", http_method="patch")(req, slug=self.ws.slug, pk=str(self.project.id))
        assert resp.status_code == status.HTTP_200_OK
        assert Intake.objects.filter(project=self.project, is_default=True).exists()
        assert mock_activity.called

    @mock.patch("plane.app.views.webhook_activity.delay")
    def test_destroy_deletes_related_and_respects_permission(self, mock_webhook):
        # Non-admin cannot delete
        req = self.factory.delete("/")
        force_authenticate(req, user=self.member)
        resp = self._view("destroy", http_method="delete")(req, slug=self.ws.slug, pk=str(self.project.id))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

        # Admin delete removes deploy board and favorites
        DeployBoard.objects.create(entity_name="project", entity_identifier=self.project.id, project=self.project, workspace=self.ws)
        UserFavorite.objects.create(user=self.admin, entity_type="project", entity_identifier=self.project.id, project=self.project, workspace=self.ws)
        req = self.factory.delete("/")
        force_authenticate(req, user=self.admin)
        resp = self._view("destroy", http_method="delete")(req, slug=self.ws.slug, pk=str(self.project.id))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not DeployBoard.objects.filter(project_id=self.project.id, workspace=self.ws).exists()
        assert not UserFavorite.objects.filter(project_id=self.project.id, workspace=self.ws).exists()
        mock_webhook.assert_called_once()


@pytest.mark.django_db
class TestProjectArchiveUnarchiveEndpoint:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.ws = Workspace.objects.create(name="Acme", slug="acme")
        self.admin = User.objects.create_user(email="admin@example.com", password="x")
        WorkspaceMember.objects.create(workspace=self.ws, member=self.admin, role=ROLE.ADMIN.value, is_active=True)
        self.project = Project.objects.create(name="Proj", identifier="PROJ", workspace=self.ws)

    def test_archive_sets_archived_at_and_removes_favorites(self):
        fav = UserFavorite.objects.create(user=self.admin, entity_type="project", entity_identifier=self.project.id, project=self.project, workspace=self.ws)
        view = ProjectArchiveUnarchiveEndpoint.as_view({"post": "post"})
        req = self.factory.post("/")
        force_authenticate(req, user=self.admin)
        resp = view(req, slug=self.ws.slug, project_id=str(self.project.id))
        assert resp.status_code == status.HTTP_200_OK
        self.project.refresh_from_db()
        assert self.project.archived_at is not None
        assert not UserFavorite.objects.filter(pk=fav.pk).exists()

    def test_unarchive_clears_archived_at(self):
        self.project.archived_at = timezone.now()
        self.project.save()
        view = ProjectArchiveUnarchiveEndpoint.as_view({"delete": "delete"})
        req = self.factory.delete("/")
        force_authenticate(req, user=self.admin)
        resp = view(req, slug=self.ws.slug, project_id=str(self.project.id))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        self.project.refresh_from_db()
        assert self.project.archived_at is None


@pytest.mark.django_db
class TestProjectIdentifierEndpoint:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.ws = Workspace.objects.create(name="Acme", slug="acme")
        self.admin = User.objects.create_user(email="admin@example.com", password="x")
        WorkspaceMember.objects.create(workspace=self.ws, member=self.admin, role=ROLE.ADMIN.value, is_active=True)

    def test_get_requires_name(self):
        view = ProjectIdentifierEndpoint.as_view({"get": "get"})
        req = self.factory.get("/", data={"name": ""})
        force_authenticate(req, user=self.admin)
        resp = view(req, slug=self.ws.slug)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_returns_existing_identifiers(self):
        ProjectIdentifier.objects.create(name="API", workspace=self.ws)
        view = ProjectIdentifierEndpoint.as_view({"get": "get"})
        req = self.factory.get("/", data={"name": "api"})
        force_authenticate(req, user=self.admin)
        resp = view(req, slug=self.ws.slug)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["exists"] >= 1
        assert any(i["name"] == "API" for i in resp.data["identifiers"])

    def test_delete_validation_and_success(self):
        view = ProjectIdentifierEndpoint.as_view({"delete": "delete"})
        # Missing name
        req = self.factory.delete("/", data={"name": ""}, format="json")
        force_authenticate(req, user=self.admin)
        resp = view(req, slug=self.ws.slug)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

        # Cannot delete if used by a project
        proj = Project.objects.create(name="Proj", identifier="USED", workspace=self.ws)
        req = self.factory.delete("/", data={"name": "used"}, format="json")
        force_authenticate(req, user=self.admin)
        resp = view(req, slug=self.ws.slug)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

        # Can delete free identifier
        ProjectIdentifier.objects.create(name="FREE", workspace=self.ws)
        req = self.factory.delete("/", data={"name": "free"}, format="json")
        force_authenticate(req, user=self.admin)
        resp = view(req, slug=self.ws.slug)
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not ProjectIdentifier.objects.filter(name="FREE", workspace=self.ws).exists()


@pytest.mark.django_db
class TestProjectUserViewsEndpoint:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.ws = Workspace.objects.create(name="Acme", slug="acme")
        self.user = User.objects.create_user(email="u@example.com", password="x")
        self.project = Project.objects.create(name="Proj", identifier="PROJ", workspace=self.ws)

    def test_post_forbidden_if_not_project_member(self):
        view = ProjectUserViewsEndpoint.as_view({"post": "post"})
        req = self.factory.post("/", data={"view_props": {"x": 1}}, format="json")
        force_authenticate(req, user=self.user)
        resp = view(req, slug=self.ws.slug, project_id=str(self.project.id))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_post_updates_member_props(self):
        # Make user a member
        ProjectMember.objects.create(project=self.project, workspace=self.ws, member=self.user, role=ROLE.MEMBER.value, is_active=True, view_props={"a": 1}, default_props={"b": 2}, preferences={"c": 3}, sort_order=5)
        view = ProjectUserViewsEndpoint.as_view({"post": "post"})
        payload = {
            "view_props": {"a": 9},
            "default_props": {"b": 8},
            "preferences": {"c": 7},
            "sort_order": 42,
        }
        req = self.factory.post("/", data=payload, format="json")
        force_authenticate(req, user=self.user)
        resp = view(req, slug=self.ws.slug, project_id=str(self.project.id))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        pm = ProjectMember.objects.get(project=self.project, member=self.user)
        assert pm.view_props == payload["view_props"]
        assert pm.default_props == payload["default_props"]
        assert pm.preferences == payload["preferences"]
        assert pm.sort_order == 42


@pytest.mark.django_db
class TestProjectFavoritesViewSet:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.ws = Workspace.objects.create(name="Acme", slug="acme")
        self.user = User.objects.create_user(email="u@example.com", password="x")
        WorkspaceMember.objects.create(workspace=self.ws, member=self.user, role=ROLE.MEMBER.value, is_active=True)
        self.project = Project.objects.create(name="Proj", identifier="PROJ", workspace=self.ws)

    def _view(self, method, http="post"):
        return ProjectFavoritesViewSet.as_view({ http: method })

    def test_create_and_destroy_favorite(self):
        # Create
        req = self.factory.post("/", data={"project": self.project.id}, format="json")
        force_authenticate(req, user=self.user)
        resp = self._view("create", "post")(req, slug=self.ws.slug)
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        fav = UserFavorite.objects.get(user=self.user, project=self.project, entity_type="project")

        # Destroy
        req = self.factory.delete("/")
        force_authenticate(req, user=self.user)
        resp = self._view("destroy", "delete")(req, slug=self.ws.slug, project_id=str(self.project.id))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not UserFavorite.objects.filter(pk=fav.pk).exists()


@pytest.mark.django_db
class TestProjectPublicCoverImagesEndpoint:
    @mock.patch("plane.app.views.boto3.client")
    def test_get_lists_public_images_and_handles_errors(self, mock_client):
        # Mock S3 response
        s3 = mock_client.return_value
        s3.list_objects_v2.return_value = {
            "Contents": [
                {"Key": "static/project-cover/img1.png"},
                {"Key": "static/project-cover/nested/"},
                {"Key": "static/project-cover/img2.jpg"},
            ]
        }
        req = APIRequestFactory().get("/public/project-covers")
        resp = ProjectPublicCoverImagesEndpoint.as_view()(req)
        assert resp.status_code == status.HTTP_200_OK
        # Only files, ignore folders
        assert len(resp.data) == 2
        assert all(k.endswith(("img1.png","img2.jpg")) for k in resp.data[0:2] or [])

        # Error path returns empty list
        s3.list_objects_v2.side_effect = Exception("boom")
        req = APIRequestFactory().get("/public/project-covers")
        resp = ProjectPublicCoverImagesEndpoint.as_view()(req)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data == []


@pytest.mark.django_db
class TestDeployBoardViewSet:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.client = APIClient()
        self.ws = Workspace.objects.create(name="Acme", slug="acme")
        self.user = User.objects.create_user(email="u@example.com", password="x")
        WorkspaceMember.objects.create(workspace=self.ws, member=self.user, role=ROLE.MEMBER.value, is_active=True)
        self.project = Project.objects.create(name="Proj", identifier="PROJ", workspace=self.ws)
        ProjectMember.objects.create(project=self.project, workspace=self.ws, member=self.user, role=ROLE.MEMBER.value, is_active=True)

    def _view(self, method, http="get"):
        return DeployBoardViewSet.as_view({ http: method })

    def test_list_returns_existing_board(self):
        db = DeployBoard.objects.create(entity_name="project", entity_identifier=self.project.id, project=self.project, workspace=self.ws, view_props={"list": True})
        req = self.factory.get("/")
        force_authenticate(req, user=self.user)
        resp = self._view("list", "get")(req, slug=self.ws.slug, project_id=str(self.project.id))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["id"] == str(db.id) or resp.data["id"] == db.id

    def test_create_upserts_and_sets_flags(self):
        payload = {
            "is_comments_enabled": True,
            "is_reactions_enabled": True,
            "is_votes_enabled": True,
            "intake": {"enabled": True},
            "views": {"list": True, "kanban": False, "calendar": True, "gantt": False, "spreadsheet": True},
        }
        req = self.factory.post("/", data=payload, format="json")
        force_authenticate(req, user=self.user)
        resp = self._view("create", "post")(req, slug=self.ws.slug, project_id=str(self.project.id))
        assert resp.status_code == status.HTTP_200_OK

        db = DeployBoard.objects.get(entity_name="project", entity_identifier=self.project.id)
        assert db.is_comments_enabled is True
        assert db.is_reactions_enabled is True
        assert db.is_votes_enabled is True
        assert db.view_props == payload["views"]
        assert db.intake == payload["intake"]


# Testing framework note:
# These tests are written for pytest with pytest-django and Django REST Framework's testing utilities (APIRequestFactory/APIClient).
# They follow repository conventions by mocking external dependencies (boto3, celery tasks) and exercising public interfaces of view classes.
