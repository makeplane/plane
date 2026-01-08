from django.urls import path

from plane.app.views.media_library import (
    MediaArtifactFileAPIView,
    MediaArtifactsListAPIView,
    MediaLibraryInitAPIView,
    MediaManifestDetailAPIView,
    MediaPackageCreateAPIView,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/media-library/",
        MediaLibraryInitAPIView.as_view(),
        name="media-library-init",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/media-library/packages/",
        MediaPackageCreateAPIView.as_view(),
        name="media-library-packages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/media-library/packages/<str:package_id>/manifest/",
        MediaManifestDetailAPIView.as_view(),
        name="media-library-manifest",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/media-library/packages/<str:package_id>/artifacts/",
        MediaArtifactsListAPIView.as_view(),
        name="media-library-artifacts",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/media-library/packages/<str:package_id>/artifacts/<str:artifact_id>/file/",
        MediaArtifactFileAPIView.as_view(),
        name="media-library-artifact-file",
    ),
]
