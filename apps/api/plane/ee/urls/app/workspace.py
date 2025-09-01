# Django imports
from django.urls import path

# Module imports
from plane.ee.views import (
    WorkspaceWorkLogsEndpoint,
    WorkspaceExportWorkLogsEndpoint,
    WorkspaceFeaturesEndpoint,
    WorkspaceProjectStatesEndpoint,
    WorkspaceProjectStatesDefaultEndpoint,
    WorkspaceInviteCheckEndpoint,
    WorkspaceCredentialView,
    VerifyWorkspaceCredentialView,
    WorkspaceConnectionView,
    WorkspaceUserConnectionView,
    WorkspaceEntityConnectionView,
    WorkspaceBulkAssetEndpoint,
    WorkspaceIssueDetailEndpoint,
    WorkspaceIssueBulkUpdateDateEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/worklogs/",
        WorkspaceWorkLogsEndpoint.as_view(),
        name="workspace-work-logs",
    ),
    path(
        "workspaces/<str:slug>/export-worklogs/",
        WorkspaceExportWorkLogsEndpoint.as_view(),
        name="workspace-work-logs",
    ),
    path(
        "workspaces/<str:slug>/features/",
        WorkspaceFeaturesEndpoint.as_view(),
        name="workspace-features",
    ),
    path(
        "workspaces/<str:slug>/project-states/",
        WorkspaceProjectStatesEndpoint.as_view(),
        name="workspace-project-states",
    ),
    path(
        "workspaces/<str:slug>/project-states/<uuid:pk>/",
        WorkspaceProjectStatesEndpoint.as_view(),
        name="workspace-project-states",
    ),
    path(
        "workspaces/<str:slug>/project-states/<uuid:pk>/default/",
        WorkspaceProjectStatesDefaultEndpoint.as_view(),
        name="workspace-project-states-default",
    ),
    path(
        "workspaces/<str:slug>/invite-check/",
        WorkspaceInviteCheckEndpoint.as_view(),
        name="workspace-invite-check",
    ),
    # workspace credential url patterns
    path(
        "workspaces/<str:slug>/credentials/<uuid:pk>/",
        WorkspaceCredentialView.as_view(),
        name="workspace-credential",
    ),
    path(
        "workspaces/<str:slug>/credentials/",
        WorkspaceCredentialView.as_view(),
        name="workspace-credential",
    ),
    path(
        "workspaces/<str:slug>/credentials/<uuid:pk>/token-verify/",
        VerifyWorkspaceCredentialView.as_view(),
        name="workspace-credential-token-verify",
    ),
    path(
        "workspaces/<str:slug>/credentials/token-verify/",
        VerifyWorkspaceCredentialView.as_view(),
        name="workspace-credential-token-verify",
    ),
    # workspace connections url patterns
    path(
        "workspaces/<str:slug>/connections/<uuid:pk>/",
        WorkspaceConnectionView.as_view(),
        name="workspace-connection-detail",
    ),
    path(
        "workspaces/<str:slug>/connections/",
        WorkspaceConnectionView.as_view(),
        name="workspace-connection-detail",
    ),
    # List all user-specific connections for a workspace
    path(
        "workspaces/<str:slug>/user-connections/<uuid:user_id>/",
        WorkspaceUserConnectionView.as_view(),
        name="workspace-user-connections",
    ),
    # workspace entity connection url patterns
    path(
        "workspaces/<str:slug>/entity-connections/",
        WorkspaceEntityConnectionView.as_view(),
        name="workspace-entity-connections-list-create",
    ),
    path(
        "workspaces/<str:slug>/entity-connections/<uuid:pk>/",
        WorkspaceEntityConnectionView.as_view(),
        name="workspace-entity-connection-detail",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/<uuid:entity_id>/bulk/",
        WorkspaceBulkAssetEndpoint.as_view(),
        name="bulk-asset-update",
    ),
    path(
        "workspaces/<str:slug>/issues-detail/",
        WorkspaceIssueDetailEndpoint.as_view(),
        name="workspace-issue-detail",
    ),
    path(
        "workspaces/<str:slug>/issue-dates/",
        WorkspaceIssueBulkUpdateDateEndpoint.as_view(),
        name="workspace-issue-dates",
    ),
]
