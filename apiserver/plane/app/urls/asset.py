from django.urls import path


from plane.app.views import (
    FileAssetEndpoint,
    UserAssetsEndpoint,
    FileAssetViewSet,
    # V2 Endpoints
    WorkspaceFileAssetEndpoint,
    UserAssetsV2Endpoint,
    StaticFileAssetEndpoint,
    AssetRestoreEndpoint,
    ProjectAssetEndpoint,
    ProjectBulkAssetEndpoint,
    AssetCheckEndpoint,
    DuplicateAssetEndpoint,
    WorkspaceAssetDownloadEndpoint,
    ProjectAssetDownloadEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/file-assets/",
        FileAssetEndpoint.as_view(),
        name="file-assets",
    ),
    path(
        "workspaces/file-assets/<uuid:workspace_id>/<str:asset_key>/",
        FileAssetEndpoint.as_view(),
        name="file-assets",
    ),
    path("users/file-assets/", UserAssetsEndpoint.as_view(), name="user-file-assets"),
    path(
        "users/file-assets/<str:asset_key>/",
        UserAssetsEndpoint.as_view(),
        name="user-file-assets",
    ),
    path(
        "workspaces/file-assets/<uuid:workspace_id>/<str:asset_key>/restore/",
        FileAssetViewSet.as_view({"post": "restore"}),
        name="file-assets-restore",
    ),
    # V2 Endpoints
    path(
        "assets/v2/workspaces/<str:slug>/",
        WorkspaceFileAssetEndpoint.as_view(),
        name="workspace-file-assets",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/<uuid:asset_id>/",
        WorkspaceFileAssetEndpoint.as_view(),
        name="workspace-file-assets",
    ),
    path(
        "assets/v2/user-assets/",
        UserAssetsV2Endpoint.as_view(),
        name="user-file-assets",
    ),
    path(
        "assets/v2/user-assets/<uuid:asset_id>/",
        UserAssetsV2Endpoint.as_view(),
        name="user-file-assets",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/restore/<uuid:asset_id>/",
        AssetRestoreEndpoint.as_view(),
        name="asset-restore",
    ),
    path(
        "assets/v2/static/<uuid:asset_id>/",
        StaticFileAssetEndpoint.as_view(),
        name="static-file-asset",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/",
        ProjectAssetEndpoint.as_view(),
        name="bulk-asset-update",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/<uuid:pk>/",
        ProjectAssetEndpoint.as_view(),
        name="bulk-asset-update",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/<uuid:entity_id>/bulk/",
        ProjectBulkAssetEndpoint.as_view(),
        name="bulk-asset-update",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/check/<uuid:asset_id>/",
        AssetCheckEndpoint.as_view(),
        name="asset-check",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/duplicate-assets/<uuid:asset_id>/",
        DuplicateAssetEndpoint.as_view(),
        name="duplicate-assets",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/download/<uuid:asset_id>/",
        WorkspaceAssetDownloadEndpoint.as_view(),
        name="workspace-asset-download",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/download/<uuid:asset_id>/",
        ProjectAssetDownloadEndpoint.as_view(),
        name="project-asset-download",
    ),
]
