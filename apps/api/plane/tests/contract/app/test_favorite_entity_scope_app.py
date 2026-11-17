# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Favorites only point at entities the user can see.

Every favorite endpoint requires the favorited project, cycle, module, view or
page to belong to the URL workspace (and URL project) and to be visible to the
caller: an active project member, with private pages and views owner-only.
Workspace views (no project) need active workspace membership and follow the
workspace view list: own or public views only.
Favorites resolve their entity_data under the same rule, so a row that points
elsewhere carries no entity data.
"""

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import (
    Cycle,
    IssueView,
    Module,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    User,
    UserFavorite,
    Workspace,
    WorkspaceMember,
)

ENTITY_TYPES = ["cycle", "module", "view", "page"]


def _user(prefix):
    suffix = uuid4().hex[:8]
    return User.objects.create(email=f"{prefix}-{suffix}@plane.so", username=f"{prefix}_{suffix}")


def _project(workspace, identifier, members):
    project = Project.objects.create(name=f"{identifier} project", identifier=identifier, workspace=workspace)
    for member in members:
        ProjectMember.objects.create(workspace=workspace, project=project, member=member, role=20)
    return project


def _entities(project, owner, label, private=False):
    """One cycle, module, view and page in project, named after label."""
    workspace = project.workspace
    page = Page.objects.create(
        workspace=workspace,
        owned_by=owner,
        name=f"{label} page",
        access=Page.PRIVATE_ACCESS if private else Page.PUBLIC_ACCESS,
    )
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return {
        "cycle": Cycle.objects.create(name=f"{label} cycle", project=project, workspace=workspace, owned_by=owner),
        "module": Module.objects.create(name=f"{label} module", project=project, workspace=workspace),
        "view": IssueView.objects.create(
            name=f"{label} view",
            project=project,
            workspace=workspace,
            owned_by=owner,
            query={},
            access=0 if private else 1,
        ),
        "page": page,
    }


@pytest.fixture
def scope(db, workspace, create_user):
    other = _user("other")
    own_project = _project(workspace, "OWN", [create_user, other])
    secret_project = _project(workspace, "SEC", [other])
    foreign_workspace = Workspace.objects.create(name="Foreign", owner=other, slug=f"foreign-{uuid4().hex[:8]}")
    foreign_project = _project(foreign_workspace, "FOR", [other])
    return {
        "other": other,
        "own_project": own_project,
        "secret_project": secret_project,
        "foreign_project": foreign_project,
        "own": _entities(own_project, create_user, "Own"),
        "private": _entities(own_project, other, "Private", private=True),
        "secret": _entities(secret_project, other, "Secret"),
        "foreign": _entities(foreign_project, other, "Foreign"),
    }


def _favorite_exists(user, entity):
    return UserFavorite.objects.filter(user=user, entity_identifier=entity.id).exists()


def _workspace_favorite(client, workspace, entity_type, entity_id, project_id):
    return client.post(
        f"/api/workspaces/{workspace.slug}/user-favorites/",
        {
            "entity_type": entity_type,
            "entity_identifier": str(entity_id),
            "project_id": str(project_id) if project_id else None,
        },
        format="json",
    )


def _entity_favorite(client, workspace, entity_type, entity, project):
    base = f"/api/workspaces/{workspace.slug}"
    if entity_type == "page":
        return client.post(f"{base}/projects/{project.id}/favorite-pages/{entity.id}/", format="json")
    if entity_type == "project":
        return client.post(f"{base}/user-favorite-projects/", {"project": str(entity.id)}, format="json")
    return client.post(
        f"{base}/projects/{project.id}/user-favorite-{entity_type}s/",
        {entity_type: str(entity.id)},
        format="json",
    )


@pytest.mark.contract
class TestWorkspaceFavoriteEntityScope:
    @pytest.mark.django_db
    @pytest.mark.parametrize("entity_type", ENTITY_TYPES)
    def test_own_entity_can_be_favorited(self, session_client, workspace, create_user, scope, entity_type):
        entity = scope["own"][entity_type]
        response = _workspace_favorite(session_client, workspace, entity_type, entity.id, scope["own_project"].id)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["entity_data"]["name"] == entity.name
        assert _favorite_exists(create_user, entity)

    @pytest.mark.django_db
    @pytest.mark.parametrize("entity_type", ENTITY_TYPES)
    @pytest.mark.parametrize("source", ["foreign", "secret"])
    def test_entity_outside_visible_projects_is_not_found(
        self, session_client, workspace, create_user, scope, entity_type, source
    ):
        entity = scope[source][entity_type]
        # Neither the entity's own project nor a project the user belongs to is accepted
        for project in (scope[f"{source}_project"], scope["own_project"]):
            response = _workspace_favorite(session_client, workspace, entity_type, entity.id, project.id)
            assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not _favorite_exists(create_user, entity)

    @pytest.mark.django_db
    @pytest.mark.parametrize("entity_type", ["view", "page"])
    def test_private_entity_of_another_member_is_not_found(
        self, session_client, workspace, create_user, scope, entity_type
    ):
        entity = scope["private"][entity_type]
        response = _workspace_favorite(session_client, workspace, entity_type, entity.id, scope["own_project"].id)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not _favorite_exists(create_user, entity)

    @pytest.mark.django_db
    def test_project_favorite_requires_membership(self, session_client, workspace, create_user, scope):
        for key in ("secret_project", "foreign_project"):
            project = scope[key]
            response = _workspace_favorite(session_client, workspace, "project", project.id, project.id)
            assert response.status_code == status.HTTP_404_NOT_FOUND
            assert not _favorite_exists(create_user, project)

        own = scope["own_project"]
        response = _workspace_favorite(session_client, workspace, "project", own.id, own.id)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["entity_data"]["name"] == own.name

    @pytest.mark.django_db
    def test_guest_only_favorites_own_pages_and_views(self, session_client, workspace, create_user, scope):
        project = scope["own_project"]
        ProjectMember.objects.filter(project=project, member=create_user).update(role=5)
        others = _entities(project, scope["other"], "Shared")

        for entity_type in ("view", "page"):
            response = _workspace_favorite(session_client, workspace, entity_type, others[entity_type].id, project.id)
            assert response.status_code == status.HTTP_404_NOT_FOUND
            response = _workspace_favorite(
                session_client, workspace, entity_type, scope["own"][entity_type].id, project.id
            )
            assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_patch_keeps_favorited_entity(self, session_client, workspace, create_user, scope):
        own_cycle = scope["own"]["cycle"]
        response = _workspace_favorite(session_client, workspace, "cycle", own_cycle.id, scope["own_project"].id)
        favorite_id = response.json()["id"]

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/user-favorites/{favorite_id}/",
            {"entity_type": "module", "entity_identifier": str(scope["secret"]["cycle"].id), "sequence": 1000},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        favorite = UserFavorite.objects.get(pk=favorite_id)
        assert (favorite.entity_type, favorite.entity_identifier) == ("cycle", own_cycle.id)
        assert favorite.sequence == 1000

    @pytest.mark.django_db
    def test_folder_favorite_still_works(self, session_client, workspace, create_user):
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/user-favorites/",
            {"entity_type": "folder", "is_folder": True, "name": "Folder", "project_id": None},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert UserFavorite.objects.filter(user=create_user, is_folder=True, name="Folder").exists()


@pytest.mark.contract
class TestWorkspaceViewFavorites:
    @pytest.fixture
    def other(self, db, workspace):
        other = _user("other")
        WorkspaceMember.objects.create(workspace=workspace, member=other, role=15)
        return other

    def _view(self, workspace, owner, access):
        return IssueView.objects.create(
            name=f"Workspace view {access}", workspace=workspace, owned_by=owner, query={}, access=access
        )

    @pytest.mark.django_db
    def test_public_workspace_view_can_be_favorited(self, session_client, workspace, create_user, other):
        view = self._view(workspace, other, access=1)
        response = _workspace_favorite(session_client, workspace, "view", view.id, None)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["entity_data"]["name"] == view.name

        response = session_client.get(f"/api/workspaces/{workspace.slug}/user-favorites/")
        assert response.status_code == status.HTTP_200_OK
        rows = {row["entity_identifier"]: row for row in response.json()}
        assert rows[str(view.id)]["entity_data"]["name"] == view.name

    @pytest.mark.django_db
    def test_private_workspace_view_of_another_user_is_not_found(self, session_client, workspace, create_user, other):
        view = self._view(workspace, other, access=0)
        response = _workspace_favorite(session_client, workspace, "view", view.id, None)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not _favorite_exists(create_user, view)


@pytest.mark.contract
class TestEntityFavoriteEndpointScope:
    @pytest.mark.django_db
    @pytest.mark.parametrize("entity_type", ENTITY_TYPES)
    def test_entity_from_another_project_is_not_found(self, session_client, workspace, create_user, scope, entity_type):
        for source in ("foreign", "secret"):
            entity = scope[source][entity_type]
            response = _entity_favorite(session_client, workspace, entity_type, entity, scope["own_project"])
            assert response.status_code == status.HTTP_404_NOT_FOUND
            assert not _favorite_exists(create_user, entity)

    @pytest.mark.django_db
    @pytest.mark.parametrize("entity_type", ["view", "page"])
    def test_private_entity_of_another_member_is_not_found(
        self, session_client, workspace, create_user, scope, entity_type
    ):
        entity = scope["private"][entity_type]
        response = _entity_favorite(session_client, workspace, entity_type, entity, scope["own_project"])

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not _favorite_exists(create_user, entity)

    @pytest.mark.django_db
    @pytest.mark.parametrize("entity_type", ENTITY_TYPES)
    def test_own_entity_can_be_favorited(self, session_client, workspace, create_user, scope, entity_type):
        entity = scope["own"][entity_type]
        response = _entity_favorite(session_client, workspace, entity_type, entity, scope["own_project"])

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert _favorite_exists(create_user, entity)

    @pytest.mark.django_db
    def test_project_favorite_requires_membership(self, session_client, workspace, create_user, scope):
        for key in ("secret_project", "foreign_project"):
            response = _entity_favorite(session_client, workspace, "project", scope[key], None)
            assert response.status_code == status.HTTP_404_NOT_FOUND
            assert not _favorite_exists(create_user, scope[key])

        response = _entity_favorite(session_client, workspace, "project", scope["own_project"], None)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert _favorite_exists(create_user, scope["own_project"])


@pytest.mark.contract
class TestFavoriteListEntityData:
    @pytest.mark.django_db
    def test_rows_pointing_at_unseen_entities_carry_no_entity_data(self, session_client, workspace, create_user, scope):
        unseen = [
            ("project", scope["secret_project"]),
            ("project", scope["foreign_project"]),
            ("view", scope["private"]["view"]),
            ("page", scope["private"]["page"]),
            *[(t, scope[source][t]) for source in ("foreign", "secret") for t in ENTITY_TYPES],
        ]
        own_cycle = scope["own"]["cycle"]
        # Rows written directly, bypassing the endpoints' checks
        for entity_type, entity in [*unseen, ("cycle", own_cycle)]:
            UserFavorite.objects.create(
                user=create_user,
                project=scope["own_project"],
                entity_type=entity_type,
                entity_identifier=entity.id,
            )

        response = session_client.get(f"/api/workspaces/{workspace.slug}/user-favorites/")

        assert response.status_code == status.HTTP_200_OK
        rows = {row["entity_identifier"]: row for row in response.json()}
        assert rows[str(own_cycle.id)]["entity_data"]["name"] == own_cycle.name
        for _, entity in unseen:
            assert rows[str(entity.id)]["entity_data"] is None
            assert entity.name not in response.content.decode()

    @pytest.mark.django_db
    def test_page_in_several_projects_reports_favorite_project(self, session_client, workspace, create_user, scope):
        page = scope["own"]["page"]
        own_project = scope["own_project"]
        # Linked to a second, newer project as well
        second_project = _project(workspace, "TWO", [create_user])
        ProjectPage.objects.create(workspace=workspace, project=second_project, page=page)

        response = _workspace_favorite(session_client, workspace, "page", page.id, own_project.id)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["entity_data"]["project_id"] == str(own_project.id)

        response = session_client.get(f"/api/workspaces/{workspace.slug}/user-favorites/")
        rows = {row["entity_identifier"]: row for row in response.json()}
        assert rows[str(page.id)]["entity_data"]["project_id"] == str(own_project.id)
