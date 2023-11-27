from django.urls import path
from plane.app.views import ApiTokenEndpoint

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
