from django.urls import path

from plane.ee.views.app.oauth import (
    OAuthApplicationEndpoint,
    OAuthApplicationRegenerateSecretEndpoint,
    OAuthApplicationCheckSlugEndpoint,
    OAuthApplicationInstallEndpoint,
    OAuthApplicationPublishEndpoint,
    OAuthApplicationClientIdEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/applications/",
        OAuthApplicationEndpoint.as_view(),
        name="application",
    ),
    path(
        "workspaces/<str:slug>/applications/<uuid:pk>/",
        OAuthApplicationEndpoint.as_view(),
        name="application-detail",
    ),
    path(
        "workspaces/<str:slug>/applications/<uuid:pk>/regenerate-secret/",
        OAuthApplicationRegenerateSecretEndpoint.as_view(),
        name="application-regenerate-secret",
    ),
    path(
        "workspaces/<str:slug>/applications/check-slug/",
        OAuthApplicationCheckSlugEndpoint.as_view(),
        name="application-check-slug",
    ),
    path(
        "workspaces/<str:slug>/applications/<uuid:pk>/install/",
        OAuthApplicationInstallEndpoint.as_view(),
        name="application-install",
    ),
    path(
        "workspaces/<str:slug>/applications/<uuid:pk>/publish/",
        OAuthApplicationPublishEndpoint.as_view(),
        name="application-publish",
    ),
    path(
        "applications/<str:client_id>/",
        OAuthApplicationClientIdEndpoint.as_view(),
        name="application-client-id",
    ),
]
