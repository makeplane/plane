from django.urls import path
from plane.app.views import ApiTokenEndpoint, ServiceApiTokenEndpoint

urlpatterns = [
    # API Tokens
    path(
        "workspaces/<str:slug>/api-tokens/",
        ApiTokenEndpoint.as_view(),
        name="api-tokens",
    ),
    path(
        "workspaces/<str:slug>/api-tokens/<uuid:pk>/",
        ApiTokenEndpoint.as_view(),
        name="api-tokens",
    ),
    path(
        "workspaces/<str:slug>/service-api-tokens/",
        ServiceApiTokenEndpoint.as_view(),
        name="service-api-tokens",
    ),
    ## End API Tokens
]
