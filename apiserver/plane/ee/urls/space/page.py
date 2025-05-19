# Django imports
from django.urls import path

# Module imports
from plane.ee.views import (
    PagePublicEndpoint,
    PagePublicIssuesEndpoint,
    PageMetaDataEndpoint,
    SubPagePublicEndpoint,
)

urlpatterns = [
    path(
        "anchor/<str:anchor>/pages/meta/",
        PageMetaDataEndpoint.as_view(),
        name="page-public-meta",
    ),
    path(
        "anchor/<str:anchor>/pages/", PagePublicEndpoint.as_view(), name="page-public"
    ),
    path(
        "anchor/<str:anchor>/sub-pages/", SubPagePublicEndpoint.as_view(), name="sub-pages"
    ),
    path(
        "anchor/<str:anchor>/page-issues/",
        PagePublicIssuesEndpoint.as_view(),
        name="page-public-issues",
    ),
]
