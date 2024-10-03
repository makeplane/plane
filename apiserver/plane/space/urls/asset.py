# Django imports
from django.urls import path

# Module imports
from plane.space.views import (
    EntityAssetEndpoint,
    AssetRestoreEndpoint,
    EntityBulkAssetEndpoint,
)

urlpatterns = [
    path(
        "assets/v2/anchor/<str:anchor>/",
        EntityAssetEndpoint.as_view(),
        name="entity-asset",
    ),
    path(
        "assets/v2/anchor/<str:anchor>/<uuid:pk>/",
        EntityAssetEndpoint.as_view(),
        name="entity-asset",
    ),
    path(
        "assets/v2/anchor/<str:anchor>/restore/<uuid:pk>/",
        AssetRestoreEndpoint.as_view(),
        name="asset-restore",
    ),
    path(
        "assets/v2/anchor/<str:anchor>/<uuid:entity_id>/bulk/",
        EntityBulkAssetEndpoint.as_view(),
        name="entity-bulk-asset",
    ),
]
