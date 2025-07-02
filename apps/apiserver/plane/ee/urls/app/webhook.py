from django.urls import path

from plane.ee.views import InternalWebhookEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/internal-webhooks/",
        InternalWebhookEndpoint.as_view(),
        name="internal-webhook-create-or-get",
    ),
    path(
        "workspaces/<str:slug>/internal-webhooks/<uuid:pk>/",
        InternalWebhookEndpoint.as_view(),
        name="internal-webhook-delete",
    ),
]
