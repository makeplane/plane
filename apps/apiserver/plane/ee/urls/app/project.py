# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.project import (
    WorkspaceProjectFeatureEndpoint,
    ProjectFeatureEndpoint,
    ProjectLinkViewSet,
    ProjectAnalyticsEndpoint,
    ProjectAttributesEndpoint,
    ProjectUpdatesViewSet,
    ProjectAttachmentV2Endpoint,
    ProjectReactionViewSet,
    ProjectActivityEndpoint,
    ProjectTemplateUseEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/links/",
        ProjectLinkViewSet.as_view({"get": "list", "post": "create"}),
        name="project-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/links/<uuid:pk>/",
        ProjectLinkViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/updates/",
        ProjectUpdatesViewSet.as_view({"get": "list", "post": "create"}),
        name="project-updates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/updates/<uuid:pk>/",
        ProjectUpdatesViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-updates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/updates/<uuid:pk>/comments/",
        ProjectUpdatesViewSet.as_view(
            {"get": "comments_list", "post": "comments_create"}
        ),
        name="project-updates-comments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/analytics/",
        ProjectAnalyticsEndpoint.as_view(),
        name="project-analytics",
    ),
    # V2 Attachments
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/attachments/",
        ProjectAttachmentV2Endpoint.as_view(),
        name="project-attachments",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/attachments/<uuid:pk>/",
        ProjectAttachmentV2Endpoint.as_view(),
        name="project-attachments",
    ),
    # Project Reactions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/reactions/",
        ProjectReactionViewSet.as_view({"get": "list", "post": "create"}),
        name="project-reactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/reactions/<str:reaction_code>/",
        ProjectReactionViewSet.as_view({"delete": "destroy"}),
        name="project-reactions",
    ),
    path(
        "workspaces/<str:slug>/workspace-project-features/",
        WorkspaceProjectFeatureEndpoint.as_view(),
        name="workspace-project-features",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/features/",
        ProjectFeatureEndpoint.as_view(),
        name="project-features",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/history/",
        ProjectActivityEndpoint.as_view(),
        name="project-activity",
    ),
    # project attributes
    path(
        "workspaces/<str:slug>/project-attributes/",
        ProjectAttributesEndpoint.as_view(),
        name="project-attributes",
    ),
    # project templates
    path(
        "workspaces/<str:slug>/projects/use-template/",
        ProjectTemplateUseEndpoint.as_view(),
        name="project-templates",
    ),
]
