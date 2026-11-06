# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""URL routes for the work_item_type feature group, mounted under /api/v1/."""

from django.urls import path

from plane.nexus.views import work_item_type as v

WS = "workspaces/<str:slug>/"
PROJECT = WS + "projects/<uuid:project_id>/"


def _route(suffix, view, methods, name):
    return path(suffix, view.as_view(http_method_names=[*methods, "options"]), name=f"nexus-{name}")


urlpatterns = [
    # Work item types: the workspace catalogue, and the types imported into a project.
    _route(WS + "work-item-types/", v.WorkspaceWorkItemTypeListEndpoint, ["get", "post"], "work-item-types"),
    _route(
        WS + "work-item-types/<uuid:type_id>/",
        v.WorkspaceWorkItemTypeDetailEndpoint,
        ["get", "patch", "delete"],
        "work-item-type",
    ),
    _route(
        WS + "work-item-types/<uuid:type_id>/properties/",
        v.WorkspaceTypePropertyLinkEndpoint,
        ["get", "post"],
        "work-item-type-properties",
    ),
    _route(
        WS + "work-item-types/<uuid:type_id>/properties/<uuid:property_id>/",
        v.WorkspaceTypePropertyLinkDetailEndpoint,
        ["delete"],
        "work-item-type-property",
    ),
    _route(PROJECT + "work-item-types/", v.ProjectWorkItemTypeListEndpoint, ["get", "post"], "project-work-item-types"),
    _route(
        PROJECT + "work-item-types/<uuid:type_id>/",
        v.ProjectWorkItemTypeDetailEndpoint,
        ["get", "patch", "delete"],
        "project-work-item-type",
    ),
    _route(
        PROJECT + "import-work-item-types/",
        v.ProjectWorkItemTypeImportEndpoint,
        ["post"],
        "project-import-work-item-types",
    ),
    _route(
        PROJECT + "work-item-types/<uuid:type_id>/properties/",
        v.ProjectTypePropertyLinkEndpoint,
        ["post"],
        "project-work-item-type-properties",
    ),
    _route(
        PROJECT + "work-item-types/<uuid:type_id>/properties/<uuid:property_id>/",
        v.ProjectTypePropertyLinkDetailEndpoint,
        ["delete"],
        "project-work-item-type-property",
    ),
    # Custom properties and their options.
    _route(WS + "work-item-properties/", v.WorkspacePropertyListEndpoint, ["get", "post"], "work-item-properties"),
    _route(
        WS + "work-item-properties/<uuid:property_id>/",
        v.WorkspacePropertyDetailEndpoint,
        ["get", "patch", "delete"],
        "work-item-property",
    ),
    _route(
        WS + "work-item-properties/<uuid:property_id>/options/",
        v.WorkspaceOptionListEndpoint,
        ["get", "post"],
        "work-item-property-options",
    ),
    _route(
        WS + "work-item-properties/<uuid:property_id>/options/<uuid:option_id>/",
        v.WorkspaceOptionDetailEndpoint,
        ["get", "patch", "delete"],
        "work-item-property-option",
    ),
    _route(
        PROJECT + "work-item-properties/",
        v.ProjectPropertyListEndpoint,
        ["get", "post"],
        "project-work-item-properties",
    ),
    _route(
        PROJECT + "work-item-properties/<uuid:property_id>/",
        v.ProjectPropertyDetailEndpoint,
        ["get", "patch", "delete"],
        "project-work-item-property",
    ),
    _route(
        PROJECT + "work-item-types/<uuid:type_id>/work-item-properties/",
        v.ProjectTypePropertyListEndpoint,
        ["get", "post"],
        "project-type-work-item-properties",
    ),
    _route(
        PROJECT + "work-item-types/<uuid:type_id>/work-item-properties/<uuid:property_id>/",
        v.ProjectTypePropertyDetailEndpoint,
        ["get", "patch", "delete"],
        "project-type-work-item-property",
    ),
    _route(
        PROJECT + "work-item-properties/<uuid:property_id>/options/",
        v.ProjectOptionListEndpoint,
        ["get", "post"],
        "project-work-item-property-options",
    ),
    _route(
        PROJECT + "work-item-properties/<uuid:property_id>/options/<uuid:option_id>/",
        v.ProjectOptionDetailEndpoint,
        ["get", "patch", "delete"],
        "project-work-item-property-option",
    ),
    # A property's value on one work item.
    _route(
        PROJECT + "work-items/<uuid:issue_id>/work-item-properties/<uuid:property_id>/values/",
        v.WorkItemPropertyValueEndpoint,
        ["get", "post", "patch", "delete"],
        "work-item-property-values",
    ),
    # Work item templates.
    _route(WS + "workitems/templates/", v.WorkspaceTemplateListEndpoint, ["get", "post"], "work-item-templates"),
    _route(
        WS + "workitems/templates/<uuid:template_id>/",
        v.WorkspaceTemplateDetailEndpoint,
        ["get", "patch", "delete"],
        "work-item-template",
    ),
    _route(
        PROJECT + "workitems/templates/",
        v.ProjectTemplateListEndpoint,
        ["get", "post"],
        "project-work-item-templates",
    ),
    _route(
        PROJECT + "workitems/templates/<uuid:template_id>/",
        v.ProjectTemplateDetailEndpoint,
        ["get", "patch", "delete"],
        "project-work-item-template",
    ),
    # Page templates, at the workspace and in a project.
    _route(WS + "pages/templates/", v.WorkspacePageTemplateListEndpoint, ["get", "post"], "page-templates"),
    _route(
        WS + "pages/templates/<uuid:template_id>/",
        v.WorkspacePageTemplateDetailEndpoint,
        ["get", "patch", "delete"],
        "page-template",
    ),
    _route(
        PROJECT + "pages/templates/",
        v.ProjectPageTemplateListEndpoint,
        ["get", "post"],
        "project-page-templates",
    ),
    _route(
        PROJECT + "pages/templates/<uuid:template_id>/",
        v.ProjectPageTemplateDetailEndpoint,
        ["get", "patch", "delete"],
        "project-page-template",
    ),
    # Project templates, which live only at the workspace.
    _route(WS + "projects/templates/", v.WorkspaceProjectTemplateListEndpoint, ["get", "post"], "project-templates"),
    _route(
        WS + "projects/templates/<uuid:template_id>/",
        v.WorkspaceProjectTemplateDetailEndpoint,
        ["get", "patch", "delete"],
        "project-template",
    ),
    # Relation definitions.
    _route(
        WS + "work-item-relation-definitions/",
        v.RelationDefinitionListEndpoint,
        ["get", "post"],
        "work-item-relation-definitions",
    ),
    _route(
        WS + "work-item-relation-definitions/<uuid:definition_id>/",
        v.RelationDefinitionDetailEndpoint,
        ["get", "patch", "delete"],
        "work-item-relation-definition",
    ),
]
