# Django imports
from django.urls import path

# Module imports
from plane.ee.views import (
    IntakePublishedIssueEndpoint,
    IntakeMetaPublishedIssueEndpoint,
)

urlpatterns = [
    path(
        "anchor/<str:anchor>/intake/meta/",
        IntakeMetaPublishedIssueEndpoint.as_view(),
        name="intake-public-meta",
    ),
    path(
        "anchor/<str:anchor>/intake/",
        IntakePublishedIssueEndpoint.as_view(),
        name="intake-public",
    ),
]
