from django.urls import path

from .views import (
    SiloPingEndpoint,
    SiloCreateCommentEndpoint,
    SiloCreateWorkItemEndpoint,
    SiloProjectMappingsEndpoint,
    SiloSlackInstallEndpoint,
    SiloSlackPersistTokensEndpoint,
    SiloSlackTeamContextEndpoint,
    SiloSlackUserConnectEndpoint,
    SiloWorkItemLookupEndpoint,
    WorkspaceConnectionDetailEndpoint,
    WorkspaceConnectionListCreateEndpoint,
    WorkspaceCredentialDetailEndpoint,
    WorkspaceCredentialListCreateEndpoint,
    WorkspaceCredentialTokenVerifyEndpoint,
    WorkspaceEntityConnectionDetailEndpoint,
    WorkspaceEntityConnectionListCreateEndpoint,
    WorkspaceUserConnectionDetailEndpoint,
    WorkspaceUserConnectionListCreateEndpoint,
)

# Mounted at /api/v1/ via plane.api.urls (see plane/urls.py).
urlpatterns = [
    # silo HMAC channel liveness
    path(
        "silo/ping/",
        SiloPingEndpoint.as_view(http_method_names=["get"]),
        name="silo-ping",
    ),
    path(
        "silo/slack/install/",
        SiloSlackInstallEndpoint.as_view(http_method_names=["post"]),
        name="silo-slack-install",
    ),
    path(
        "silo/slack/team-context/",
        SiloSlackTeamContextEndpoint.as_view(http_method_names=["post"]),
        name="silo-slack-team-context",
    ),
    path(
        "silo/slack/user-connect/",
        SiloSlackUserConnectEndpoint.as_view(http_method_names=["post"]),
        name="silo-slack-user-connect",
    ),
    path(
        "silo/slack/persist-tokens/",
        SiloSlackPersistTokensEndpoint.as_view(http_method_names=["post"]),
        name="silo-slack-persist-tokens",
    ),
    path(
        "silo/project-mappings/",
        SiloProjectMappingsEndpoint.as_view(http_method_names=["post"]),
        name="silo-project-mappings",
    ),
    path(
        "silo/comments/",
        SiloCreateCommentEndpoint.as_view(http_method_names=["post"]),
        name="silo-create-comment",
    ),
    path(
        "silo/work-items/lookup/",
        SiloWorkItemLookupEndpoint.as_view(http_method_names=["post"]),
        name="silo-work-item-lookup",
    ),
    path(
        "silo/work-items/",
        SiloCreateWorkItemEndpoint.as_view(http_method_names=["post"]),
        name="silo-create-work-item",
    ),
    # workspace credentials
    path(
        "workspaces/<str:slug>/workspace-credentials/",
        WorkspaceCredentialListCreateEndpoint.as_view(http_method_names=["get", "post"]),
        name="workspace-credentials",
    ),
    path(
        "workspaces/<str:slug>/workspace-credentials/token-verify/",
        WorkspaceCredentialTokenVerifyEndpoint.as_view(http_method_names=["post"]),
        name="workspace-credentials-token-verify",
    ),
    path(
        "workspaces/<str:slug>/workspace-credentials/<uuid:pk>/",
        WorkspaceCredentialDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="workspace-credentials-detail",
    ),
    # workspace connections
    path(
        "workspaces/<str:slug>/workspace-connections/",
        WorkspaceConnectionListCreateEndpoint.as_view(http_method_names=["get", "post"]),
        name="workspace-connections",
    ),
    path(
        "workspaces/<str:slug>/workspace-connections/<uuid:pk>/",
        WorkspaceConnectionDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="workspace-connections-detail",
    ),
    # workspace user connections
    path(
        "workspaces/<str:slug>/workspace-user-connections/",
        WorkspaceUserConnectionListCreateEndpoint.as_view(http_method_names=["get", "post"]),
        name="workspace-user-connections",
    ),
    path(
        "workspaces/<str:slug>/workspace-user-connections/<uuid:pk>/",
        WorkspaceUserConnectionDetailEndpoint.as_view(http_method_names=["get", "delete"]),
        name="workspace-user-connections-detail",
    ),
    # workspace entity connections
    path(
        "workspaces/<str:slug>/workspace-entity-connections/",
        WorkspaceEntityConnectionListCreateEndpoint.as_view(http_method_names=["get", "post"]),
        name="workspace-entity-connections",
    ),
    path(
        "workspaces/<str:slug>/workspace-entity-connections/<uuid:pk>/",
        WorkspaceEntityConnectionDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="workspace-entity-connections-detail",
    ),
]