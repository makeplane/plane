from django.urls import path

from plane.api.views import WebhookEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/webhooks/",
        WebhookEndpoint.as_view(),
        name="webhooks",
    ),
    path(
        "workspaces/<str:slug>/webhooks/<uuid:pk>/",
        WebhookEndpoint.as_view(),
        name="webhooks",
    ),
]
