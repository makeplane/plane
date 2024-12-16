from django.urls import path

from plane.api.views import UserAssetEndpoint, UserServerAssetEndpoint

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
]
