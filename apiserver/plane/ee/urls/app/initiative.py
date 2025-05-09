# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.initiative import (
    InitiativeEndpoint,
    InitiativeProjectEndpoint,
    InitiativeLabelEndpoint,
    InitiativeAnalyticsEndpoint,
    InitiativeLinkViewSet,
    InitiativeCommentViewSet,
    InitiativeAttachmentEndpoint,
    InitiativeCommentReactionViewSet,
    InitiativeReactionViewSet,
    InitiativeActivityEndpoint,
    InitiativeEpicViewSet,
    WorkspaceInitiativeAnalytics,
    InitiativeEpicAnalytics,
    InitiativeUpdateViewSet,
    InitiativeUpdateCommentsViewSet,
    InitiativeUpdatesReactionViewSet,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/initiatives/",
        InitiativeEndpoint.as_view(),
        name="initiatives",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:pk>/",
        InitiativeEndpoint.as_view(),
        name="initiatives",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/projects/",
        InitiativeProjectEndpoint.as_view(),
        name="initiative-projects",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/projects/<uuid:project_id>/",
        InitiativeProjectEndpoint.as_view(),
        name="initiative-projects",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/labels/",
        InitiativeLabelEndpoint.as_view(),
        name="initiative-labels",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/labels/<uuid:pk>/",
        InitiativeLabelEndpoint.as_view(),
        name="initiative-labels",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/analytics/",
        InitiativeAnalyticsEndpoint.as_view(),
        name="initiative-analytics",
    ),
    path(
        "workspaces/<str:slug>/initiatives/analytics/",
        WorkspaceInitiativeAnalytics.as_view(),
        name="workspace-analytics",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/links/",
        InitiativeLinkViewSet.as_view({"get": "list", "post": "create"}),
        name="initiative-links",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/links/<uuid:pk>/",
        InitiativeLinkViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="initiative-links",
    ),
    # Initiative Attachment
    path(
        "assets/v2/workspaces/<str:slug>/initiatives/<uuid:initiative_id>/attachments/",
        InitiativeAttachmentEndpoint.as_view(),
        name="initiative-attachments",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/initiatives/<uuid:initiative_id>/attachments/<uuid:pk>/",
        InitiativeAttachmentEndpoint.as_view(),
        name="initiative-attachments",
    ),
    # End Initiative Attachment
    # Initiative Comment
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/comments/",
        InitiativeCommentViewSet.as_view({"get": "list", "post": "create"}),
        name="initiative-comments",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/comments/<uuid:pk>/",
        InitiativeCommentViewSet.as_view(
            {"patch": "partial_update", "delete": "destroy"}
        ),
        name="initiative-comments",
    ),
    # End Initiative Comment
    # Initiative Comment Reactions
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/comments/<uuid:comment_id>/reactions/",
        InitiativeCommentReactionViewSet.as_view({"get": "list", "post": "create"}),
        name="initiative-comment-reactions",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/comments/<uuid:comment_id>/reactions/<str:reaction_code>/",
        InitiativeCommentReactionViewSet.as_view({"delete": "destroy"}),
        name="initiative-comment-reactions",
    ),
    ## End Comment Reactions
    # Initiative Reactions
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/reactions/",
        InitiativeReactionViewSet.as_view({"get": "list", "post": "create"}),
        name="initiative-reactions",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/reactions/<str:reaction_code>/",
        InitiativeReactionViewSet.as_view({"delete": "destroy"}),
        name="initiative-reactions",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/activities/",
        InitiativeActivityEndpoint.as_view(),
        name="initiative-activities",
    ),
    # Initiative Epics
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/epics/",
        InitiativeEpicViewSet.as_view({"get": "list", "post": "create"}),
        name="initiative-epics",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/epics/<uuid:epic_id>/",
        InitiativeEpicViewSet.as_view({"delete": "destroy"}),
        name="initiative-epics",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/epic-analytics/",
        InitiativeEpicAnalytics.as_view(),
        name="initiative-epic-analytics",
    ),
    # Initiative Updates
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/updates/",
        InitiativeUpdateViewSet.as_view(),
        name="initiative-updates",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/updates/<uuid:update_id>/",
        InitiativeUpdateViewSet.as_view(),
        name="initiative-updates",
    ),
    # End Initiative Updates
    # InitIative Update comments
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/updates/<uuid:update_id>/comments/",
        InitiativeUpdateCommentsViewSet.as_view(),
        name="initiative-update-comments",
    ),
    # End InitIative Update comments
    # InitIative Update Reactions
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/updates/<uuid:update_id>/reactions/",
        InitiativeUpdatesReactionViewSet.as_view(),
        name="initiative-update-comments",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/updates/<uuid:update_id>/reactions/<str:reaction_code>/",
        InitiativeUpdatesReactionViewSet.as_view(),
        name="initiative-update-comments",
    ),
    # End InitIative Update Reactions
]
