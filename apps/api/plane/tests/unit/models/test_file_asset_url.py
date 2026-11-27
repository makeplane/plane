# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for ``FileAsset.asset_url``.

Regression coverage for #9564: description assets uploaded through
``WorkspaceFileAssetEndpoint`` are created without a ``project_id`` (the
endpoint only maps the entity id, and workspace-level pages have no project at
all), so ``asset_url`` used to build ``.../projects/None/<id>/``, which 404s.
Those assets must fall back to the workspace-scoped route.
"""

import pytest

from plane.db.models import FileAsset, Project

DESCRIPTION_ENTITY_TYPES = [
    FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
    FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
    FileAsset.EntityTypeContext.PAGE_DESCRIPTION,
    FileAsset.EntityTypeContext.DRAFT_ISSUE_DESCRIPTION,
]


@pytest.fixture
def project(workspace, create_user):
    """A project inside the fixture workspace."""
    return Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )


@pytest.mark.unit
class TestFileAssetUrl:
    """Test the ``asset_url`` property of the FileAsset model"""

    @pytest.mark.django_db
    @pytest.mark.parametrize("entity_type", DESCRIPTION_ENTITY_TYPES)
    def test_description_asset_without_project_uses_workspace_route(self, workspace, entity_type):
        """Description assets with no project resolve to the workspace-scoped route"""
        asset = FileAsset.objects.create(
            attributes={"name": "image.png", "type": "image/png", "size": 1024},
            asset=f"{workspace.id}/image.png",
            size=1024,
            workspace=workspace,
            entity_type=entity_type,
        )

        assert asset.project_id is None
        assert asset.asset_url == f"/api/assets/v2/workspaces/{workspace.slug}/{asset.id}/"
        assert "None" not in asset.asset_url

    @pytest.mark.django_db
    @pytest.mark.parametrize("entity_type", DESCRIPTION_ENTITY_TYPES)
    def test_description_asset_with_project_uses_project_route(self, workspace, project, entity_type):
        """Description assets bound to a project keep the project-scoped route"""
        asset = FileAsset.objects.create(
            attributes={"name": "image.png", "type": "image/png", "size": 1024},
            asset=f"{workspace.id}/image.png",
            size=1024,
            workspace=workspace,
            project=project,
            entity_type=entity_type,
        )

        assert asset.asset_url == f"/api/assets/v2/workspaces/{workspace.slug}/projects/{project.id}/{asset.id}/"

    @pytest.mark.django_db
    def test_workspace_level_asset_uses_static_route(self, workspace):
        """Workspace-level assets are unaffected by the project fallback"""
        asset = FileAsset.objects.create(
            attributes={"name": "logo.png", "type": "image/png", "size": 1024},
            asset=f"{workspace.id}/logo.png",
            size=1024,
            workspace=workspace,
            entity_type=FileAsset.EntityTypeContext.WORKSPACE_LOGO,
        )

        assert asset.asset_url == f"/api/assets/v2/static/{asset.id}/"
