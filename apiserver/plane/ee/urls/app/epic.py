from django.urls import path

from plane.ee.views.app.epic import (
    EpicViewSet,
    EpicLinkViewSet,
    EpicCommentViewSet,
    EpicActivityEndpoint,
    EpicArchiveViewSet,
    EpicAttachmentEndpoint,
    EpicReactionViewSet,
    EpicUserDisplayPropertyEndpoint,
    EpicAnalyticsEndpoint,
    EpicIssuesEndpoint,
    EpicDetailEndpoint,
    WorkspaceEpicEndpoint,
)
from plane.ee.views.app.epic_property import WorkspaceEpicTypeEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/epic-types/",
        WorkspaceEpicTypeEndpoint.as_view(),
        name="epics",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/",
        EpicViewSet.as_view({"get": "list", "post": "create"}),
        name="project-epics",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epic-status/",
        EpicViewSet.as_view({"post": "epic_status"}),
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics-detail/",
        EpicDetailEndpoint.as_view(),
        name="epics-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:pk>/",
        EpicViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-epics",
    ),
    # Epic links
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/links/",
        EpicLinkViewSet.as_view({"get": "list", "post": "create"}),
        name="project-epic-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/links/<uuid:pk>/",
        EpicLinkViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-epic-links",
    ),
    # End Epic links
    ## Epic Activity
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/history/",
        EpicActivityEndpoint.as_view(),
        name="project-epic-history",
    ),
    ## Epic Activity
    ## Epic Comments
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/comments/",
        EpicCommentViewSet.as_view({"get": "list", "post": "create"}),
        name="project-epic-comment",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/comments/<uuid:pk>/",
        EpicCommentViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-epic-comment",
    ),
    ## End Epic Comments
    ## Epic Attachment
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/attachments/",
        EpicAttachmentEndpoint.as_view(),
        name="epic-attachments",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/attachments/<uuid:pk>/",
        EpicAttachmentEndpoint.as_view(),
        name="epic-attachments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics-user-properties/",
        EpicUserDisplayPropertyEndpoint.as_view(),
        name="epic-user-property",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/archived-epics/",
        EpicArchiveViewSet.as_view({"get": "list"}),
        name="project-epic-archive",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:pk>/archive/",
        EpicArchiveViewSet.as_view(
            {"get": "retrieve", "post": "archive", "delete": "unarchive"}
        ),
        name="project-epic-archive-unarchive",
    ),
    # Issue Reactions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/reactions/",
        EpicReactionViewSet.as_view({"get": "list", "post": "create"}),
        name="project-epic-reactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/reactions/<str:reaction_code>/",
        EpicReactionViewSet.as_view({"delete": "destroy"}),
        name="project-epic-reactions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/analytics/",
        EpicAnalyticsEndpoint.as_view(),
        name="project-epic-analytics",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/issues/",
        EpicIssuesEndpoint.as_view(),
        name="project-epic-issues",
    ),
    path(
        "workspaces/<str:slug>/epics/",
        WorkspaceEpicEndpoint.as_view(),
        name="workspace-epics",
    ),
]
