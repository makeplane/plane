from django.urls import path

from plane.ee.views.api.asset import (
    ImportAssetEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/import-assets/",
        ImportAssetEndpoint.as_view(http_method_names=["post"]),
        name="generic-asset",
    ),
    path(
        "workspaces/<str:slug>/import-assets/<uuid:asset_id>/",
        ImportAssetEndpoint.as_view(http_method_names=["get", "patch"]),
        name="generic-asset-detail",
    ),
]
