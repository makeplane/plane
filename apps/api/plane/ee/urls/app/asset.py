# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app import DuplicateAssetEndpoint


urlpatterns = [
    path(
        "assets/v2/workspaces/<slug:slug>/duplicate-assets/",
        DuplicateAssetEndpoint.as_view(),
        name="duplicate-assets",
    )
]
