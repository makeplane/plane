from django.urls import path


from plane.api.views import ReleaseNotesEndpoint


urlpatterns = [
    path(
        "release-notes/",
        ReleaseNotesEndpoint.as_view(),
        name="release-notes",
    ),
]
