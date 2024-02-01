from django.urls import path


from plane.app.views import (
    FileAssetEndpoint,
    UserAssetsEndpoint,
    FileAssetViewSet,
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
        "workspaces/file-assets/<uuid:workspace_id>/<str:asset_key>/restore/",
        FileAssetViewSet.as_view(
            {
                "post": "restore",
            }
        ),
        name="file-assets-restore",
    ),
]
