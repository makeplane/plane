# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.api.serializers import ProjectPageCreateSerializer
from plane.api.views.page import PROJECT_PAGE_CREATE_EXAMPLE

PAGES_PATH = "/api/v1/workspaces/{slug}/projects/{project_id}/pages/"


def dereference(schema, document):
    reference = schema.get("$ref")
    if reference:
        return document["components"]["schemas"][reference.rsplit("/", 1)[-1]]
    return schema


@pytest.mark.contract
@pytest.mark.django_db
def test_project_pages_collection_is_discoverable_in_openapi_schema(api_client):
    response = api_client.get("/api/schema/?format=json")

    assert response.status_code == 200
    path = response.data["paths"][PAGES_PATH]
    assert set(path) == {"get", "post"}

    get_operation = path["get"]
    assert get_operation["operationId"] == "list_project_pages"
    assert get_operation["tags"] == ["Pages"]
    assert get_operation["security"] == [{"ApiKeyAuthentication": []}]
    assert {parameter["name"] for parameter in get_operation["parameters"]} >= {
        "slug",
        "project_id",
    }

    post_operation = path["post"]
    assert post_operation["operationId"] == "create_project_page"
    assert post_operation["security"] == [{"ApiKeyAuthentication": []}]
    request_schema = dereference(
        post_operation["requestBody"]["content"]["application/json"]["schema"], response.data
    )
    assert set(request_schema["properties"]) == {
        "name",
        "description_html",
        "access",
        "color",
    }
    assert "201" in post_operation["responses"]
    assert "400" in post_operation["responses"]


def test_project_page_openapi_create_example_validates_against_public_serializer():
    serializer = ProjectPageCreateSerializer(
        data=PROJECT_PAGE_CREATE_EXAMPLE,
        context={"project": None, "user": None},
    )

    assert serializer.is_valid(), serializer.errors
