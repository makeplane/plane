# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app.initiative import (
    InitiativeEndpoint,
    InitiativeProjectEndpoint,
    InitiativeLabelEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/initiatives/",
        InitiativeEndpoint.as_view(),
        name="initiatives",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:pk>/",
        InitiativeEndpoint.as_view(),
        name="initiatives",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/projects/",
        InitiativeProjectEndpoint.as_view(),
        name="initiative-projects",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/projects/<uuid:pk>/",
        InitiativeProjectEndpoint.as_view(),
        name="initiative-projects",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/labels/",
        InitiativeLabelEndpoint.as_view(),
        name="initiative-labels",
    ),
    path(
        "workspaces/<str:slug>/initiatives/<uuid:initiative_id>/labels/<uuid:pk>/",
        InitiativeLabelEndpoint.as_view(),
        name="initiative-labels",
    ),
]
