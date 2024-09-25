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
    path(
        "users/file-assets/",
        UserAssetsEndpoint.as_view(),
        name="user-file-assets",
    ),
    path(
        "users/file-assets/<str:asset_key>/",
        UserAssetsEndpoint.as_view(),
        name="user-file-assets",
    ),
    path(
        "workspaces/file-assets/<uuid:workspace_id>/<str:asset_key>/restore/",
        FileAssetViewSet.as_view(
            {
                "post": "restore",
            }
        ),
        name="file-assets-restore",
    ),
    path(
        "assets/workspaces/<str:slug>/assets/",
        WorkspaceFileAssetEndpoint.as_view(),
        name="workspace-file-assets",
    ),
    path(
        "assets/workspaces/<str:slug>/workspace-assets/<uuid:asset_id>/",
        WorkspaceFileAssetEndpoint.as_view(),
        name="workspace-file-assets",
    ),
    path(
        "assets/user-assets/",
        UserAssetsV2Endpoint.as_view(),
        name="user-file-assets",
    ),
    path(
        "assets/user-assets/<uuid:asset_id>/",
        UserAssetsV2Endpoint.as_view(),
        name="user-file-assets",
    ),
    path(
        "assets/<uuid:asset_id>/restore/",
        AssetRestoreEndpoint.as_view(),
        name="asset-restore",
    ),
    path(
        "assets/static/<uuid:asset_id>/",
        StaticFileAssetEndpoint.as_view(),
        name="static-file-asset",
    ),
]
