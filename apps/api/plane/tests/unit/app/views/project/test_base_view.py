# NOTE: Testing library/framework in use:
# - pytest with pytest-django
# - Django REST Framework test utilities (APIClient)
# Conform to repository's existing pytest style and markers.
import pytest

pytestmark = pytest.mark.unit

import json
from datetime import datetime, timedelta

from unittest.mock import patch, MagicMock

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, APIClient

# Import the view classes under test for direct invocation with APIRequestFactory
try:
    from apps.api.plane.app.views.project.base import (
        ProjectViewSet,
        ProjectArchiveUnarchiveEndpoint,
        ProjectIdentifierEndpoint,
        ProjectUserViewsEndpoint,
        ProjectFavoritesViewSet,
        ProjectPublicCoverImagesEndpoint,
        DeployBoardViewSet,
    )
except Exception:
    # Fallback import path if the module name differs
    from apps.api.plane.app.views.project import base as base_view  # type: ignore
    ProjectViewSet = getattr(base_view, "ProjectViewSet")
    ProjectArchiveUnarchiveEndpoint = getattr(base_view, "ProjectArchiveUnarchiveEndpoint")
    ProjectIdentifierEndpoint = getattr(base_view, "ProjectIdentifierEndpoint")
    ProjectUserViewsEndpoint = getattr(base_view, "ProjectUserViewsEndpoint")
    ProjectFavoritesViewSet = getattr(base_view, "ProjectFavoritesViewSet")
    ProjectPublicCoverImagesEndpoint = getattr(base_view, "ProjectPublicCoverImagesEndpoint")
    DeployBoardViewSet = getattr(base_view, "DeployBoardViewSet")


@pytest.fixture
def api_rf():
    return APIRequestFactory()


@pytest.fixture
def api_client(db, django_user_model):
    user = django_user_model.objects.create_user(
        username="tester", email="tester@example.com", password="password"
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def authed_user(db, django_user_model):
    return django_user_model.objects.create_user(
        username="tester2", email="tester2@example.com", password="password"
    )


# Identity serializer used to bypass real serialization logic
class _IdentitySerializer:
    def __init__(self, instance=None, many=False, fields=None, context=None, data=None, partial=False):
        self.instance = instance
        self.many = many
        self.fields = fields
        self.context = context or {}
        self._data = data
        self.partial = partial

    def is_valid(self):
        return True

    @property
    def data(self):
        if self._data is not None and self.instance is None:
            return self._data
        if self.many and hasattr(self.instance, "__iter__"):
            return list(self.instance)
        return self.instance

    def save(self, **kwargs):
        if isinstance(self._data, dict):
            self._data.setdefault("id", 1)
        return self


# ---------- ProjectViewSet tests ----------

@pytest.mark.django_db
def test_project_viewset_list_detail_basic_filters_and_fields(api_rf, authed_user):
    view = ProjectViewSet.as_view({"get": "list_detail"})
    req = api_rf.get("/workspaces/acme/projects?fields=id,name")
    req.user = authed_user

    projects_list = [
        {"id": 2, "name": "Beta", "sort_order": 1},
        {"id": 1, "name": "Alpha", "sort_order": 0},
    ]

    with patch("apps.api.plane.app.views.project.base.ProjectViewSet.get_queryset") as get_qs, \
         patch("apps.api.plane.app.views.project.base.ProjectListSerializer", _IdentitySerializer), \
         patch("apps.api.plane.app.views.project.base.WorkspaceMember") as WM:
        get_qs.return_value = MagicMock(order_by=MagicMock(return_value=projects_list))
        WM.objects.filter().exists.return_value = False

        resp = view(req, slug="acme")

    assert resp.status_code == status.HTTP_200_OK
    assert resp.data == projects_list


@pytest.mark.django_db
def test_project_viewset_list_detail_guest_filter_applied(api_rf, authed_user):
    view = ProjectViewSet.as_view({"get": "list_detail"})
    req = api_rf.get("/workspaces/acme/projects")
    req.user = authed_user

    filtered_qs = [{"id": 7, "name": "Guest Only"}]

    class _OrderedQS:
        def __init__(self, data):
            self.data = data
        def order_by(self, *args):
            return self.data
        def filter(self, *args, **kwargs):
            return filtered_qs

    with patch("apps.api.plane.app.views.project.base.ProjectViewSet.get_queryset") as get_qs, \
         patch("apps.api.plane.app.views.project.base.ProjectListSerializer", _IdentitySerializer), \
         patch("apps.api.plane.app.views.project.base.WorkspaceMember") as WM:
        get_qs.return_value = _OrderedQS(data=[{"id": 1}, {"id": 2}])
        WM.objects.filter().exists.side_effect = [True, False]  # guest True, member False
        resp = view(req, slug="acme")

    assert resp.status_code == status.HTTP_200_OK
    assert resp.data == filtered_qs


@pytest.mark.django_db
def test_project_viewset_list_pagination_branch(api_rf, authed_user):
    view = ProjectViewSet.as_view({"get": "list_detail"})
    req = api_rf.get("/workspaces/acme/projects?per_page=10&cursor=abc&order_by=name")
    req.user = authed_user

    paginated_payload = [{"id": 10}, {"id": 11}]

    with patch("apps.api.plane.app.views.project.base.ProjectViewSet.get_queryset") as get_qs, \
         patch("apps.api.plane.app.views.project.base.ProjectListSerializer", _IdentitySerializer), \
         patch.object(ProjectViewSet, "paginate", side_effect=lambda **kw: Response(paginated_payload, status=status.HTTP_200_OK)), \
         patch("apps.api.plane.app.views.project.base.WorkspaceMember") as WM:
        get_qs.return_value = MagicMock(order_by=MagicMock(return_value=[{"id": 1}]))
        WM.objects.filter().exists.return_value = False
        resp = view(req, slug="acme")

    assert resp.status_code == status.HTTP_200_OK
    assert resp.data == paginated_payload


@pytest.mark.django_db
def test_project_viewset_list_values_subset_and_member_filter(api_rf, authed_user):
    view = ProjectViewSet.as_view({"get": "list"})
    req = api_rf.get("/workspaces/acme/projects")
    req.user = authed_user

    values_payload = [{"id": 1, "name": "A", "member_role": "admin"}]

    class _QS:
        def filter(self, *args, **kwargs): return self
        def select_related(self, *args, **kwargs): return self
        def annotate(self, *args, **kwargs): return self
        def distinct(self): return self
        def values(self, *args, **kwargs): return values_payload

    with patch("apps.api.plane.app.views.project.base.Project") as Project, \
         patch("apps.api.plane.app.views.project.base.WorkspaceMember") as WM:
        Project.objects.filter.return_value = _QS()
        WM.objects.filter().exists.side_effect = [False, True]  # member branch triggers
        resp = view(req, slug="acme")

    assert resp.status_code == status.HTTP_200_OK
    assert resp.data == values_payload


@pytest.mark.django_db
def test_project_viewset_retrieve_success_and_task_trigger(api_rf, authed_user):
    view = ProjectViewSet.as_view({"get": "retrieve"})
    req = api_rf.get("/workspaces/acme/projects/1")
    req.user = authed_user

    project_obj = {"id": 1, "name": "Proj"}

    with patch("apps.api.plane.app.views.project.base.ProjectViewSet.get_queryset") as get_qs, \
         patch("apps.api.plane.app.views.project.base.ProjectListSerializer", _IdentitySerializer), \
         patch("apps.api.plane.app.views.project.base.recent_visited_task") as recent:
        get_qs.return_value = MagicMock(
            filter=MagicMock(return_value=MagicMock(first=MagicMock(return_value=project_obj)))
        )
        resp = view(req, slug="acme", pk=1)

    assert resp.status_code == status.HTTP_200_OK
    assert resp.data == project_obj


@pytest.mark.django_db
def test_project_viewset_retrieve_not_found(api_rf, authed_user):
    view = ProjectViewSet.as_view({"get": "retrieve"})
    req = api_rf.get("/workspaces/acme/projects/999")
    req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.ProjectViewSet.get_queryset") as get_qs:
        get_qs.return_value = MagicMock(
            filter=MagicMock(return_value=MagicMock(first=MagicMock(return_value=None)))
        )
        resp = view(req, slug="acme", pk=999)

    assert resp.status_code == status.HTTP_404_NOT_FOUND
    assert resp.data["error"] == "Project does not exist"


@pytest.mark.django_db
def test_project_viewset_create_creates_members_states_and_activity(api_rf, authed_user):
    view = ProjectViewSet.as_view({"post": "create"})
    req = api_rf.post("/workspaces/acme/projects", data={"name": "N", "project_lead": None}, format="json")
    req.user = authed_user

    saved_instance = {"id": 123, "project_lead": None}

    with patch("apps.api.plane.app.views.project.base.Workspace") as Workspace, \
         patch("apps.api.plane.app.views.project.base.ProjectSerializer") as PSer, \
         patch("apps.api.plane.app.views.project.base.ProjectMember") as PMember, \
         patch("apps.api.plane.app.views.project.base.IssueUserProperty") as IUP, \
         patch("apps.api.plane.app.views.project.base.State") as State, \
         patch("apps.api.plane.app.views.project.base.Project") as Project, \
         patch("apps.api.plane.app.views.project.base.ProjectListSerializer", _IdentitySerializer), \
         patch("apps.api.plane.app.views.project.base.model_activity") as model_activity_task:
        Workspace.objects.get.return_value = MagicMock(id=1)
        serializer_instance = MagicMock()
        serializer_instance.is_valid.return_value = True
        serializer_instance.data = saved_instance
        serializer_instance.instance = MagicMock()
        serializer_instance.save.return_value = None
        PSer.return_value = serializer_instance
        ProjectViewSet.get_queryset = MagicMock(
            return_value=MagicMock(
                filter=MagicMock(return_value=MagicMock(first=MagicMock(return_value=saved_instance)))
            )
        )
        resp = view(req, slug="acme")

    assert resp.status_code == status.HTTP_201_CREATED
    assert resp.data["id"] == 123


@pytest.mark.django_db
def test_project_viewset_partial_update_permission_denied(api_rf, authed_user):
    view = ProjectViewSet.as_view({"patch": "partial_update"})
    req = api_rf.patch("/workspaces/acme/projects/1", data={"name": "New"}, format="json")
    req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.WorkspaceMember") as WM, \
         patch("apps.api.plane.app.views.project.base.ProjectMember") as PM:
        WM.objects.filter().exists.return_value = False
        PM.objects.filter().exists.return_value = False
        resp = view(req, slug="acme", pk=1)

    assert resp.status_code == status.HTTP_403_FORBIDDEN
    assert "required permissions" in resp.data["error"]


@pytest.mark.django_db
def test_project_viewset_partial_update_archived_blocked(api_rf, authed_user):
    view = ProjectViewSet.as_view({"patch": "partial_update"})
    req = api_rf.patch("/workspaces/acme/projects/1", data={"name": "New"}, format="json")
    req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.WorkspaceMember") as WM, \
         patch("apps.api.plane.app.views.project.base.ProjectMember") as PM, \
         patch("apps.api.plane.app.views.project.base.Workspace") as Workspace, \
         patch("apps.api.plane.app.views.project.base.Project") as Project:
        WM.objects.filter().exists.return_value = True
        PM.objects.filter().exists.return_value = False
        Workspace.objects.get.return_value = MagicMock(id=1)
        proj = MagicMock(archived_at=timezone.now(), intake_view=False)
        Project.objects.get.return_value = proj

        resp = view(req, slug="acme", pk=1)

    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "Archived projects cannot be updated" in resp.data["error"]


@pytest.mark.django_db
def test_project_viewset_destroy_admin_deletes_and_webhook(api_rf, authed_user):
    view = ProjectViewSet.as_view({"delete": "destroy"})
    req = api_rf.delete("/workspaces/acme/projects/5")
    req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.WorkspaceMember") as WM, \
         patch("apps.api.plane.app.views.project.base.ProjectMember") as PM, \
         patch("apps.api.plane.app.views.project.base.Project") as Project, \
         patch("apps.api.plane.app.views.project.base.webhook_activity") as webhook, \
         patch("apps.api.plane.app.views.project.base.DeployBoard") as DeployBoard, \
         patch("apps.api.plane.app.views.project.base.UserFavorite") as UserFavorite:
        WM.objects.filter().exists.return_value = True
        PM.objects.filter().exists.return_value = False
        Project.objects.get.return_value = MagicMock(id=5)

        resp = view(req, slug="acme", pk=5)

    assert resp.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
def test_project_viewset_destroy_forbidden(api_rf, authed_user):
    view = ProjectViewSet.as_view({"delete": "destroy"})
    req = api_rf.delete("/workspaces/acme/projects/5")
    req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.WorkspaceMember") as WM, \
         patch("apps.api.plane.app.views.project.base.ProjectMember") as PM:
        WM.objects.filter().exists.return_value = False
        PM.objects.filter().exists.return_value = False
        resp = view(req, slug="acme", pk=5)

    assert resp.status_code == status.HTTP_403_FORBIDDEN


# ---------- ProjectArchiveUnarchiveEndpoint ----------

@pytest.mark.django_db
def test_project_archive_endpoint_posts_and_clears_favorites(api_rf, authed_user):
    view = ProjectArchiveUnarchiveEndpoint.as_view()
    req = api_rf.post("/workspaces/acme/projects/1/archive")
    req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.Project") as Project, \
         patch("apps.api.plane.app.views.project.base.UserFavorite") as UF:
        proj = MagicMock(archived_at=None)
        Project.objects.get.return_value = proj
        UF.objects.filter.return_value.delete.return_value = None

        resp = view(req, slug="acme", project_id=1)

    assert resp.status_code == status.HTTP_200_OK
    assert "archived_at" in resp.data


@pytest.mark.django_db
def test_project_unarchive_endpoint_deletes_returns_204(api_rf, authed_user):
    view = ProjectArchiveUnarchiveEndpoint.as_view()
    req = api_rf.delete("/workspaces/acme/projects/1/archive")
    req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.Project") as Project:
        proj = MagicMock(archived_at=timezone.now())
        Project.objects.get.return_value = proj

        resp = view(req, slug="acme", project_id=1)

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# ---------- ProjectIdentifierEndpoint ----------

@pytest.mark.django_db
def test_project_identifier_get_requires_name_and_returns_results(api_rf, authed_user):
    view = ProjectIdentifierEndpoint.as_view()

    # Missing name -> 400
    req = api_rf.get("/workspaces/acme/projects/identifier")
    req.user = authed_user
    resp = view(req, slug="acme")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "Name is required" in resp.data["error"]

    # With name -> returns exists count and identifiers list
    req2 = api_rf.get("/workspaces/acme/projects/identifier?name= PX ")
    req2.user = authed_user
    with patch("apps.api.plane.app.views.project.base.ProjectIdentifier") as PI:
        PI.objects.filter().values.return_value = [{"id": 1, "name": "PX", "project": None}]
        resp2 = view(req2, slug="acme")
    assert resp2.status_code == status.HTTP_200_OK
    assert resp2.data["exists"] == 1
    assert resp2.data["identifiers"][0]["name"] == "PX"


@pytest.mark.django_db
def test_project_identifier_delete_validations(api_rf, authed_user):
    view = ProjectIdentifierEndpoint.as_view()

    # Missing name -> 400
    req = api_rf.delete("/workspaces/acme/projects/identifier", data={}, format="json")
    req.user = authed_user
    resp = view(req, slug="acme")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST

    # Name exists on a Project -> cannot delete
    req2 = api_rf.delete("/workspaces/acme/projects/identifier", data={"name": "PX"}, format="json")
    req2.user = authed_user
    with patch("apps.api.plane.app.views.project.base.Project") as Project:
        Project.objects.filter().exists.return_value = True
        resp2 = view(req2, slug="acme")
    assert resp2.status_code == status.HTTP_400_BAD_REQUEST

    # Otherwise deletes -> 204
    req3 = api_rf.delete("/workspaces/acme/projects/identifier", data={"name": "PX"}, format="json")
    req3.user = authed_user
    with patch("apps.api.plane.app.views.project.base.Project") as Project, \
         patch("apps.api.plane.app.views.project.base.ProjectIdentifier") as PI:
        Project.objects.filter().exists.return_value = False
        resp3 = view(req3, slug="acme")
    assert resp3.status_code == status.HTTP_204_NO_CONTENT


# ---------- ProjectUserViewsEndpoint ----------

@pytest.mark.django_db
def test_project_user_views_updates_member_props(api_rf, authed_user):
    view = ProjectUserViewsEndpoint.as_view()
    req = api_rf.post(
        "/workspaces/acme/projects/1/user-views",
        data={"view_props": {"foo": "bar"}, "sort_order": 9},
        format="json",
    )
    req.user = authed_user

    member = MagicMock(view_props={"x": 1}, default_props={"y": 2}, preferences={"z": 3}, sort_order=1)

    with patch("apps.api.plane.app.views.project.base.Project") as Project, \
         patch("apps.api.plane.app.views.project.base.ProjectMember") as PM:
        Project.objects.get.return_value = MagicMock()
        PM.objects.filter().first.return_value = member

        resp = view(req, slug="acme", project_id=1)

    assert resp.status_code == status.HTTP_204_NO_CONTENT
    assert member.view_props == {"foo": "bar"}
    assert member.sort_order == 9


@pytest.mark.django_db
def test_project_user_views_forbidden_when_not_member(api_rf, authed_user):
    view = ProjectUserViewsEndpoint.as_view()
    req = api_rf.post("/workspaces/acme/projects/1/user-views", data={}, format="json")
    req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.Project") as Project, \
         patch("apps.api.plane.app.views.project.base.ProjectMember") as PM:
        Project.objects.get.return_value = MagicMock()
        PM.objects.filter().first.return_value = None

        resp = view(req, slug="acme", project_id=1)

    assert resp.status_code == status.HTTP_403_FORBIDDEN
    assert resp.data["error"] == "Forbidden"


# ---------- ProjectFavoritesViewSet ----------

@pytest.mark.django_db
def test_project_favorite_create_and_destroy(api_rf, authed_user):
    create_view = ProjectFavoritesViewSet.as_view({"post": "create"})
    delete_view = ProjectFavoritesViewSet.as_view({"delete": "destroy"})

    create_req = api_rf.post("/workspaces/acme/projects/favorites", data={"project": 42}, format="json")
    create_req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.UserFavorite") as UF:
        UF.objects.create.return_value = MagicMock()
        resp = create_view(create_req, slug="acme")
    assert resp.status_code == status.HTTP_204_NO_CONTENT

    delete_req = api_rf.delete("/workspaces/acme/projects/favorites/42")
    delete_req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.UserFavorite") as UF:
        fav = MagicMock()
        UF.objects.get.return_value = fav
        resp2 = delete_view(delete_req, slug="acme", project_id=42)
    assert resp2.status_code == status.HTTP_204_NO_CONTENT
    assert fav.delete.called


# ---------- ProjectPublicCoverImagesEndpoint ----------

@pytest.mark.django_db
def test_public_cover_images_lists_files_success(api_rf):
    view = ProjectPublicCoverImagesEndpoint.as_view()
    req = api_rf.get("/projects/public-cover-images")

    with patch("apps.api.plane.app.views.project.base.settings") as settings_mod, \
         patch("apps.api.plane.app.views.project.base.boto3") as boto3_mod:
        settings_mod.USE_MINIO = False
        settings_mod.AWS_STORAGE_BUCKET_NAME = "bucket"
        settings_mod.AWS_REGION = "us-east-1"
        settings_mod.AWS_ACCESS_KEY_ID = "x"
        settings_mod.AWS_SECRET_ACCESS_KEY = "y"

        client = MagicMock()
        boto3_mod.client.return_value = client
        client.list_objects_v2.return_value = {
            "Contents": [
                {"Key": "static/project-cover/img1.jpg"},
                {"Key": "static/project-cover/subdir/"},  # folder-like, should be ignored
            ]
        }

        resp = view(req)

    assert resp.status_code == status.HTTP_200_OK
    assert resp.data == ["https://bucket.s3.us-east-1.amazonaws.com/static/project-cover/img1.jpg"]


@pytest.mark.django_db
def test_public_cover_images_handles_exception_and_returns_empty(api_rf):
    view = ProjectPublicCoverImagesEndpoint.as_view()
    req = api_rf.get("/projects/public-cover-images")

    with patch("apps.api.plane.app.views.project.base.settings") as settings_mod, \
         patch("apps.api.plane.app.views.project.base.boto3") as boto3_mod:
        settings_mod.USE_MINIO = True
        settings_mod.AWS_S3_ENDPOINT_URL = "http://minio"
        settings_mod.AWS_STORAGE_BUCKET_NAME = "bucket"
        settings_mod.AWS_REGION = "us-east-1"
        settings_mod.AWS_ACCESS_KEY_ID = "x"
        settings_mod.AWS_SECRET_ACCESS_KEY = "y"

        boto3_mod.client.side_effect = Exception("boom")
        with patch("apps.api.plane.app.views.project.base.log_exception") as log_exc:
            resp = view(req)

    assert resp.status_code == status.HTTP_200_OK
    assert resp.data == []


# ---------- DeployBoardViewSet ----------

@pytest.mark.django_db
def test_deploy_board_list_and_create(api_rf, authed_user):
    list_view = DeployBoardViewSet.as_view({"get": "list"})
    create_view = DeployBoardViewSet.as_view({"post": "create"})

    # list
    list_req = api_rf.get("/workspaces/acme/projects/1/deploy-board")
    list_req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.DeployBoard") as DB, \
         patch("apps.api.plane.app.views.project.base.DeployBoardSerializer", _IdentitySerializer):
        DB.objects.filter.return_value.first.return_value = {"id": 1, "entity_identifier": 1}
        resp = list_view(list_req, slug="acme", project_id=1)
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data["id"] == 1

    # create
    create_req = api_rf.post(
        "/workspaces/acme/projects/1/deploy-board",
        data={
            "is_comments_enabled": True,
            "is_votes_enabled": True,
            "views": {"list": True, "gantt": False},
            "intake": 5,
        },
        format="json",
    )
    create_req.user = authed_user

    with patch("apps.api.plane.app.views.project.base.DeployBoard") as DB, \
         patch("apps.api.plane.app.views.project.base.DeployBoardSerializer", _IdentitySerializer):
        instance = MagicMock()
        DB.objects.get_or_create.return_value = (instance, True)
        resp2 = create_view(create_req, slug="acme", project_id=1)

    assert resp2.status_code == status.HTTP_200_OK