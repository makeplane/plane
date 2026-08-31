# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path


from plane.app.views import (
    ProjectCustomFieldOptionViewSet,
    ProjectCustomFieldViewSet,
    ProjectCustomFieldValueViewSet,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-fields/",
        ProjectCustomFieldViewSet.as_view({"get": "list", "post": "create"}),
        name="project-custom-fields",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-fields/<uuid:pk>/",
        ProjectCustomFieldViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-custom-field",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-fields/<uuid:custom_field_id>/options/",
        ProjectCustomFieldOptionViewSet.as_view({"get": "list", "post": "create"}),
        name="project-custom-field-options",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-fields/<uuid:custom_field_id>/options/<uuid:pk>/",
        ProjectCustomFieldOptionViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-custom-field-option",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-field-values/",
        ProjectCustomFieldValueViewSet.as_view({"get": "list"}),
        name="project-custom-field-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/custom-field-values/<uuid:custom_field_id>/",
        ProjectCustomFieldValueViewSet.as_view({"patch": "partial_update"}),
        name="project-custom-field-value",
    ),
]
