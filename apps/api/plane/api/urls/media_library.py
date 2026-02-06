from django.urls import path

from plane.api.views import (
    MediaArtifactDetailAPIEndpoint,
    MediaArtifactsListAPIEndpoint,
    MediaLibraryInitAPIEndpoint,
    MediaManifestDetailAPIEndpoint,
    MediaPackageCreateAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/media-library/",
        MediaLibraryInitAPIEndpoint.as_view(http_method_names=["post"]),
        name="media-library-init",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/media-library/packages/",
        MediaPackageCreateAPIEndpoint.as_view(http_method_names=["post"]),
        name="media-library-packages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/media-library/packages/<str:package_id>/manifest/",
        MediaManifestDetailAPIEndpoint.as_view(http_method_names=["get"]),
        name="media-library-manifest",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/media-library/packages/<str:package_id>/artifacts/",
        MediaArtifactsListAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="media-library-artifacts",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/media-library/packages/<str:package_id>/artifacts/<str:artifact_id>/",
        MediaArtifactDetailAPIEndpoint.as_view(http_method_names=["get", "delete"]),
        name="media-library-artifact-detail",
    ),
]
