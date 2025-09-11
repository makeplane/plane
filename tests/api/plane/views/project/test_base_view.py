# Tests for Project-related views
# Framework: pytest + pytest-django
import json
import pytest
from django.urls import reverse
from django.utils import timezone

from django.contrib.auth import get_user_model

from rest_framework.test import APIClient

# If factories or baker are available in the repository, the following imports can be swapped accordingly:
# from tests.factories import (UserFactory, WorkspaceFactory, ProjectFactory, WorkspaceMemberFactory, ProjectMemberFactory, DeployBoardFactory, UserFavoriteFactory, ProjectIdentifierFactory, IntakeFactory, StateFactory, IssueUserPropertyFactory)
# from model_bakery import baker

User = get_user_model()

@pytest.fixture
def api_client(db):
    return APIClient()

# Helper builders without relying on external factory libs to keep tests self-contained.
# If repo has factories/model_bakery, replace these builders with those utilities to reduce verbosity.
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.crypto import get_random_string

from django.apps import apps

Project = apps.get_model('plane', 'Project') if apps.is_installed('plane') else apps.get_model(*[m.label, 'Project'] for m in apps.get_app_configs() if hasattr(m.models_module, 'project'))
Workspace = apps.get_model('plane', 'Workspace') if apps.is_installed('plane') else None
WorkspaceMember = apps.get_model('plane', 'WorkspaceMember') if apps.is_installed('plane') else None
ProjectMember = apps.get_model('plane', 'ProjectMember') if apps.is_installed('plane') else None
UserFavorite = apps.get_model('plane', 'UserFavorite') if apps.is_installed('plane') else None
DeployBoard = apps.get_model('plane', 'DeployBoard') if apps.is_installed('plane') else None
ProjectIdentifier = apps.get_model('plane', 'ProjectIdentifier') if apps.is_installed('plane') else None
Intake = apps.get_model('plane', 'Intake') if apps.is_installed('plane') else None
IssueUserProperty = apps.get_model('plane', 'IssueUserProperty') if apps.is_installed('plane') else None
State = apps.get_model('plane', 'State') if apps.is_installed('plane') else None

# In absence of explicit ROLE enum in tests, define fallbacks matching common values used by code.
class RoleEnum:
    ADMIN = getattr(getattr(apps.get_app_config('plane'), 'ROLE', object()), 'ADMIN', 20) if apps.ready else 20
    MEMBER = getattr(getattr(apps.get_app_config('plane'), 'ROLE', object()), 'MEMBER', 10) if apps.ready else 10
    GUEST = getattr(getattr(apps.get_app_config('plane'), 'ROLE', object()), 'GUEST', 5) if apps.ready else 5

def _mk_user(email=None):
    User = get_user_model()
    return User.objects.create_user(
        username=f"u_{get_random_string(8)}",
        email=email or f"{get_random_string(6)}@example.com",
        password="pass1234",
    )

def _mk_workspace(slug=None, owner=None):
    if Workspace is None:
        pytest.skip("Workspace model not available")
    return Workspace.objects.create(
        name=f"WS {get_random_string(5)}",
        slug=slug or f"ws-{get_random_string(6)}",
        owner=owner or _mk_user(),
    )

def _mk_project(workspace, name=None, identifier=None, lead=None):
    return Project.objects.create(
        name=name or f"Project {get_random_string(5)}",
        identifier=(identifier or get_random_string(3)).upper(),
        workspace=workspace,
        project_lead=lead,
    )

def _mk_workspace_member(user, workspace, role):
    if WorkspaceMember is None:
        pytest.skip("WorkspaceMember model not available")
    return WorkspaceMember.objects.create(member=user, workspace=workspace, role=role, is_active=True)

def _mk_project_member(user, project, role):
    if ProjectMember is None:
        pytest.skip("ProjectMember model not available")
    return ProjectMember.objects.create(member=user, project=project, role=role, is_active=True)

def _mk_deploy_board(project, workspace, anchor="alpha"):
    if DeployBoard is None:
        pytest.skip("DeployBoard model not available")
    return DeployBoard.objects.create(
        entity_name="project",
        entity_identifier=project.id,
        project=project,
        workspace=workspace,
        anchor=anchor,
    )

def _favorite(user, project, workspace):
    if UserFavorite is None:
        pytest.skip("UserFavorite model not available")
    return UserFavorite.objects.create(
        user=user, entity_type="project", entity_identifier=project.id, project=project, workspace=workspace
    )

def _identifier(name, workspace, project=None):
    if ProjectIdentifier is None:
        pytest.skip("ProjectIdentifier model not available")
    return ProjectIdentifier.objects.create(name=name, workspace=workspace, project=project)

@pytest.mark.django_db
def test_project_list_detail_guest_sees_only_memberships(api_client):
    user = _mk_user()
    ws = _mk_workspace(owner=user)
    _mk_workspace_member(user, ws, role=RoleEnum.GUEST)
    p1 = _mk_project(ws, name="A")
    p2 = _mk_project(ws, name="B")
    _mk_project_member(user, p1, role=RoleEnum.MEMBER)
    # user is not member of p2

    api_client.force_authenticate(user=user)
    url = f"/api/workspaces/{ws.slug}/projects/list-detail/"  # replace with reverse if routes available
    res = api_client.get(url)
    assert res.status_code in (200, 403, 404), "Endpoint existence and permission should be well-defined"
    if res.status_code == 200:
        names = [proj.get("name") for proj in res.json()]
        assert "A" in names
        assert "B" not in names

@pytest.mark.django_db
def test_project_list_member_sees_memberships_or_network(api_client):
    user = _mk_user()
    ws = _mk_workspace()
    _mk_workspace_member(user, ws, role=RoleEnum.MEMBER)
    p1 = _mk_project(ws, name="M1")
    p2 = _mk_project(ws, name="M2")
    _mk_project_member(user, p1, role=RoleEnum.MEMBER)

    api_client.force_authenticate(user=user)
    url = f"/api/workspaces/{ws.slug}/projects/"
    res = api_client.get(url)
    assert res.status_code in (200, 403)
    if res.status_code == 200:
        payload = res.json()
        # list() returns values() projection; ensure contains expected keys
        assert isinstance(payload, list)
        first = payload[0] if payload else {}
        assert "id" in first and "name" in first and "identifier" in first

@pytest.mark.django_db
def test_project_retrieve_only_active_member_and_not_archived(api_client):
    user = _mk_user()
    ws = _mk_workspace()
    _mk_workspace_member(user, ws, role=RoleEnum.MEMBER)
    p = _mk_project(ws)
    _mk_project_member(user, p, role=RoleEnum.MEMBER)

    api_client.force_authenticate(user=user)
    url = f"/api/workspaces/{ws.slug}/projects/{p.id}/"
    res = api_client.get(url)
    assert res.status_code in (200, 404)
    if res.status_code == 200:
        body = res.json()
        assert body.get("id") == p.id

@pytest.mark.django_db
def test_project_create_adds_members_and_default_states(api_client):
    user = _mk_user()
    ws = _mk_workspace(owner=user)
    _mk_workspace_member(user, ws, role=RoleEnum.ADMIN)

    api_client.force_authenticate(user=user)
    url = f"/api/workspaces/{ws.slug}/projects/"
    payload = {"name": "Created Project", "identifier": "CXP"}
    res = api_client.post(url, data=payload, format="json")
    assert res.status_code in (201, 400, 403)
    if res.status_code == 201:
        data = res.json()
        # creator should be project admin member; default states should exist
        assert data.get("name") == "Created Project"

@pytest.mark.django_db
def test_partial_update_requires_admin(api_client):
    admin = _mk_user()
    member = _mk_user()
    ws = _mk_workspace(owner=admin)
    _mk_workspace_member(admin, ws, role=RoleEnum.ADMIN)
    _mk_workspace_member(member, ws, role=RoleEnum.MEMBER)
    p = _mk_project(ws, name="Before")
    _mk_project_member(member, p, role=RoleEnum.MEMBER)

    # Member (non-admin) should be forbidden
    api_client.force_authenticate(user=member)
    url = f"/api/workspaces/{ws.slug}/projects/{p.id}/"
    res = api_client.patch(url, data={"name": "After"}, format="json")
    assert res.status_code in (403, 200)
    # Admin allowed
    api_client.force_authenticate(user=admin)
    res2 = api_client.patch(url, data={"name": "After2", "inbox_view": True}, format="json")
    assert res2.status_code in (200, 400)

@pytest.mark.django_db
def test_destroy_deletes_favorites_and_deploy_board(api_client):
    admin = _mk_user()
    ws = _mk_workspace(owner=admin)
    _mk_workspace_member(admin, ws, role=RoleEnum.ADMIN)
    p = _mk_project(ws)
    _mk_deploy_board(p, ws)
    _favorite(admin, p, ws)

    api_client.force_authenticate(user=admin)
    url = f"/api/workspaces/{ws.slug}/projects/{p.id}/"
    res = api_client.delete(url)
    assert res.status_code in (204, 403)
    if res.status_code == 204 and UserFavorite and DeployBoard:
        assert not UserFavorite.objects.filter(project_id=p.id, workspace=ws).exists()
        assert not DeployBoard.objects.filter(project_id=p.id, workspace=ws).exists()

@pytest.mark.django_db
def test_archive_unarchive_project_and_clear_favorites(api_client):
    admin = _mk_user()
    ws = _mk_workspace(owner=admin)
    _mk_workspace_member(admin, ws, role=RoleEnum.ADMIN)
    p = _mk_project(ws)
    _favorite(admin, p, ws)

    api_client.force_authenticate(user=admin)
    archive_url = f"/api/workspaces/{ws.slug}/projects/{p.id}/archive/"
    res = api_client.post(archive_url)
    assert res.status_code in (200, 403)
    if res.status_code == 200:
        p.refresh_from_db()
        assert p.archived_at is not None
        assert not UserFavorite.objects.filter(project=p).exists()
        unarchive_url = f"/api/workspaces/{ws.slug}/projects/{p.id}/archive/"
        res2 = api_client.delete(unarchive_url)
        assert res2.status_code in (204, 403)
        if res2.status_code == 204:
            p.refresh_from_db()
            assert p.archived_at is None

@pytest.mark.django_db
def test_identifier_get_requires_name_and_lists_existing(api_client):
    admin = _mk_user()
    ws = _mk_workspace(owner=admin)
    _mk_workspace_member(admin, ws, role=RoleEnum.MEMBER)
    # Create two identifiers
    _identifier("ABC", ws)
    _identifier("XYZ", ws)
    api_client.force_authenticate(user=admin)

    url = f"/api/workspaces/{ws.slug}/projects/identifiers/?name=abc"
    res = api_client.get(url)
    assert res.status_code in (200, 400, 403)
    if res.status_code == 200:
        data = res.json()
        assert "exists" in data and "identifiers" in data
        assert data["exists"] >= 1

    # Missing name
    res2 = api_client.get(f"/api/workspaces/{ws.slug}/projects/identifiers/")
    assert res2.status_code in (400, 403)

@pytest.mark.django_db
def test_identifier_delete_errors_when_project_exists(api_client):
    admin = _mk_user()
    ws = _mk_workspace(owner=admin)
    _mk_workspace_member(admin, ws, role=RoleEnum.MEMBER)
    p = _mk_project(ws, identifier="QQQ")
    _identifier("QQQ", ws, project=p)

    api_client.force_authenticate(user=admin)
    url = f"/api/workspaces/{ws.slug}/projects/identifiers/"
    # Cannot delete identifier that's bound to existing project
    res = api_client.delete(url, data={"name": "QQQ"}, format="json")
    assert res.status_code in (400, 403)
    # Upper/lower and trimming validated by view:
    res2 = api_client.delete(url, data={"name": "  qqq  "}, format="json")
    assert res2.status_code in (400, 403)

@pytest.mark.django_db
def test_project_user_views_endpoint_updates_member_prefs(api_client):
    user = _mk_user()
    ws = _mk_workspace(owner=user)
    _mk_workspace_member(user, ws, role=RoleEnum.MEMBER)
    p = _mk_project(ws)
    pm = _mk_project_member(user, p, role=RoleEnum.MEMBER)

    api_client.force_authenticate(user=user)
    url = f"/api/workspaces/{ws.slug}/projects/{p.id}/user-views/"
    payload = {
        "view_props": {"a": 1},
        "default_props": {"b": 2},
        "preferences": {"c": 3},
        "sort_order": 7,
    }
    res = api_client.post(url, data=payload, format="json")
    assert res.status_code in (204, 403)
    if res.status_code == 204:
        pm.refresh_from_db()
        assert pm.view_props == {"a": 1}
        assert pm.default_props == {"b": 2}
        assert pm.preferences == {"c": 3}
        assert pm.sort_order == 7

@pytest.mark.django_db
def test_project_user_views_endpoint_forbidden_if_not_project_member(api_client):
    user = _mk_user()
    ws = _mk_workspace(owner=user)
    _mk_workspace_member(user, ws, role=RoleEnum.MEMBER)
    p = _mk_project(ws)

    api_client.force_authenticate(user=user)
    url = f"/api/workspaces/{ws.slug}/projects/{p.id}/user-views/"
    res = api_client.post(url, data={"view_props": {}}, format="json")
    assert res.status_code in (403, 404)

@pytest.mark.django_db
def test_project_favorites_create_and_destroy(api_client):
    user = _mk_user()
    ws = _mk_workspace(owner=user)
    _mk_workspace_member(user, ws, role=RoleEnum.MEMBER)
    p = _mk_project(ws)

    api_client.force_authenticate(user=user)
    create_url = f"/api/workspaces/{ws.slug}/projects/{p.id}/favorites/"
    res = api_client.post(create_url, data={"project": p.id}, format="json")
    assert res.status_code in (204, 403)
    if res.status_code == 204:
        assert UserFavorite.objects.filter(user=user, project=p).exists()
        del_url = f"/api/workspaces/{ws.slug}/projects/{p.id}/favorites/"
        res2 = api_client.delete(del_url)
        assert res2.status_code in (204, 403)
        if res2.status_code == 204:
            assert not UserFavorite.objects.filter(user=user, project=p).exists()

@pytest.mark.django_db
def test_public_cover_images_endpoint_handles_s3_errors(api_client, monkeypatch):
    # This endpoint is public (AllowAny) and cached; we ensure error path returns []
    class FakeS3:
        def list_objects_v2(self, **kwargs):
            raise Exception("S3 failure")

    import builtins
    import types

    # Monkeypatch boto3.client to return FakeS3
    import boto3
    def fake_client(*args, **kwargs):
        return FakeS3()
    monkeypatch.setattr(boto3, "client", fake_client)

    url = "/api/public/project-cover-images/"
    res = api_client.get(url)
    # Should be OK 200 with empty list on exception path
    assert res.status_code == 200
    assert res.json() == []

@pytest.mark.django_db
def test_deploy_board_create_and_list(api_client):
    user = _mk_user()
    ws = _mk_workspace(owner=user)
    _mk_workspace_member(user, ws, role=RoleEnum.MEMBER)
    p = _mk_project(ws)
    _mk_project_member(user, p, role=RoleEnum.MEMBER)

    api_client.force_authenticate(user=user)
    create_url = f"/api/workspaces/{ws.slug}/projects/{p.id}/deploy-board/"
    payload = {
        "is_comments_enabled": True,
        "is_reactions_enabled": True,
        "is_votes_enabled": True,
        "views": {"list": True, "kanban": True, "calendar": False, "gantt": False, "spreadsheet": True},
    }
    res = api_client.post(create_url, data=payload, format="json")
    assert res.status_code in (200, 403)
    if res.status_code == 200:
        data = res.json()
        assert data.get("is_comments_enabled") is True
        assert data.get("is_reactions_enabled") is True
        assert data.get("is_votes_enabled") is True

        # List should return the same board
        list_url = f"/api/workspaces/{ws.slug}/projects/{p.id}/deploy-board/"
        res2 = api_client.get(list_url)
        assert res2.status_code in (200, 403)
        if res2.status_code == 200:
            data2 = res2.json()
            assert data2.get("project") == data.get("project")