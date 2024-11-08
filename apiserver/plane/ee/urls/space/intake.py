# Django imports
from django.urls import path

# Module imports
from plane.ee.views import IntakePublishedIssueEndpoint

urlpatterns = [
    path(
        "anchor/<str:anchor>/intake/",
        IntakePublishedIssueEndpoint.as_view(),
        name="intake-public",
    ),
]
