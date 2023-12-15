from django.urls import path


from plane.app.views import UnsplashEndpoint
from plane.app.views import ReleaseNotesEndpoint
from plane.app.views import GPTIntegrationEndpoint


urlpatterns = [
    path(
        "unsplash/",
        UnsplashEndpoint.as_view(),
        name="unsplash",
    ),
    path(
        "release-notes/",
        ReleaseNotesEndpoint.as_view(),
        name="release-notes",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/ai-assistant/",
        GPTIntegrationEndpoint.as_view(),
        name="importer",
    ),
]
