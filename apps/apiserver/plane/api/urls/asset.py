from django.urls import path

from plane.api.views import (
    UserAssetEndpoint,
    UserServerAssetEndpoint,
    GenericAssetEndpoint,
)

urlpatterns = [
    path("assets/user-assets/", UserAssetEndpoint.as_view(), name="users"),
    path(
        "assets/user-assets/<uuid:asset_id>/", UserAssetEndpoint.as_view(), name="users"
    ),
    path("assets/user-assets/server/", UserServerAssetEndpoint.as_view(), name="users"),
    path(
        "assets/user-assets/<uuid:asset_id>/server/",
        UserServerAssetEndpoint.as_view(),
        name="users",
    ),
    path(
        "workspaces/<str:slug>/assets/",
        GenericAssetEndpoint.as_view(),
        name="generic-asset",
    ),
    path(
        "workspaces/<str:slug>/assets/<uuid:asset_id>/",
        GenericAssetEndpoint.as_view(),
        name="generic-asset-detail",
    ),
]
