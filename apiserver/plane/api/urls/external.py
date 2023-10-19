from django.urls import path


from plane.api.views import GPTIntegrationEndpoint
from plane.api.views import ReleaseNotesEndpoint
from plane.api.views import UnsplashEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/ai-assistant/",
        GPTIntegrationEndpoint.as_view(),
        name="importer",
    ),
    path(
        "release-notes/",
        ReleaseNotesEndpoint.as_view(),
        name="release-notes",
    ),
    path(
        "unsplash/",
        UnsplashEndpoint.as_view(),
        name="unsplash",
    ),
]