from django.urls import path
from plane.api.views import ApiTokenEndpoint

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
    ## End API Tokens
]
