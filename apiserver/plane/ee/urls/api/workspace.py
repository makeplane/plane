# Django imports
from django.urls import path

# Module imports
from plane.ee.views import (
    WorkspaceCredentialAPIView,
    WorkspaceConnectionAPIView,
    WorkspaceEntityConnectionAPIView,
    VerifyWorkspaceCredentialAPIView,
    WorkspaceUserConnectionAPIView
)

urlpatterns = [
    # workspace credential url patterns
    path(
        "workspaces/<str:slug>/credentials/<uuid:pk>/",
        WorkspaceCredentialAPIView.as_view(),
        name="workspace-credential",
    ),
    path(
        "workspaces/<str:slug>/credentials/",
        WorkspaceCredentialAPIView.as_view(),
        name="workspace-credential",
    ),
    path(
        "workspaces/<str:slug>/credentials/<uuid:pk>/token-verify/",
        VerifyWorkspaceCredentialAPIView.as_view(),
        name="workspace-credential-token-verify",
    ),
    # workspace connections url patterns
    path(
        "workspaces/<str:slug>/connections/<uuid:pk>/",
        WorkspaceConnectionAPIView.as_view(),
        name="workspace-connection-detail",
    ),
    path(
        "workspaces/<str:slug>/connections/",
        WorkspaceConnectionAPIView.as_view(),
        name="workspace-connection-detail",
    ),

    # List all user-specific connections for a workspace
    path(
        "workspaces/<str:slug>/user-connections/<uuid:user_id>/",
        WorkspaceUserConnectionAPIView.as_view(),
        name="workspace-user-connections",
    ),

    # workspace entity connection url patterns
    path(
        "workspaces/<str:slug>/entity-connections/<uuid:pk>/",
        WorkspaceEntityConnectionAPIView.as_view(),
        name="workspace-entity-connection-detail",
    ),
]
