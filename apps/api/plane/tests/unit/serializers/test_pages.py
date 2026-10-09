# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.api.serializers.page import ProjectPageCreateSerializer, ProjectPageListSerializer
from plane.db.models import Page, Project, ProjectPage


@pytest.fixture
def project(workspace, create_user):
    return Project.objects.create(
        name="Project Pages serializer",
        identifier="PPS",
        workspace=workspace,
        created_by=create_user,
    )


@pytest.mark.django_db
def test_project_page_list_serializer_exposes_only_public_metadata(workspace, create_user):
    page = Page.objects.create(
        name="Public API page",
        workspace=workspace,
        owned_by=create_user,
        access=Page.PUBLIC_ACCESS,
    )

    data = ProjectPageListSerializer(page).data

    assert set(data) == {
        "id",
        "name",
        "access",
        "color",
        "owned_by",
        "workspace",
        "parent",
        "is_locked",
        "archived_at",
        "created_at",
        "updated_at",
    }
    assert data["id"] == page.id
    assert data["name"] == "Public API page"
    assert data["access"] == Page.PUBLIC_ACCESS
    assert data["color"] == ""


@pytest.mark.django_db
def test_project_page_create_serializer_creates_only_the_url_project_relationship(
    workspace, project, create_user
):
    serializer = ProjectPageCreateSerializer(
        data={"name": "Created through public API", "color": "#123456"},
        context={"project": project, "user": create_user},
    )

    assert serializer.is_valid(), serializer.errors
    page = serializer.save()

    assert page.workspace_id == workspace.id
    assert page.owned_by_id == create_user.id
    assert page.name == "Created through public API"
    assert ProjectPage.objects.filter(project=project, page=page, deleted_at__isnull=True).exists()


@pytest.mark.django_db
def test_project_page_create_serializer_rejects_server_owned_fields(project, create_user):
    serializer = ProjectPageCreateSerializer(
        data={"name": "Attempted override", "owned_by": str(create_user.id)},
        context={"project": project, "user": create_user},
    )

    assert not serializer.is_valid()
    assert "owned_by" in serializer.errors
