# Django imports
from django.urls import path

# Module imports
from plane.ee.views import (
    ViewsPublicEndpoint,
    IssueViewsPublicEndpoint,
    ViewsMetaDataEndpoint,
)

urlpatterns = [
    path(
        "anchor/<str:anchor>/views/meta/",
        ViewsMetaDataEndpoint.as_view(),
        name="views-public-meta",
    ),
    path(
        "anchor/<str:anchor>/views/", ViewsPublicEndpoint.as_view(), name="views-public"
    ),
    path(
        "anchor/<str:anchor>/view-issues/",
        IssueViewsPublicEndpoint.as_view(),
        name="view-issues-public",
    ),
]
