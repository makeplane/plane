from django.urls import path

from plane.ee.views.app import (
    EpicPropertyEndpoint,
    EpicPropertyOptionEndpoint,
    EpicPropertyValueEndpoint,
    EpicPropertyActivityEndpoint,
)

urlpatterns = [
    # Epic properties
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epic-properties/",
        EpicPropertyEndpoint.as_view(),
        name="epic-properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epic-properties/<uuid:pk>/",
        EpicPropertyEndpoint.as_view(),
        name="epic-properties",
    ),
    # End of Epic properties
    # Epic property options
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epic-property-options/",
        EpicPropertyOptionEndpoint.as_view(),
        name="epic-property-options",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epic-properties/<uuid:epic_property_id>/options/",
        EpicPropertyOptionEndpoint.as_view(),
        name="epic-property-options",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epic-properties/<uuid:epic_property_id>/options/<uuid:pk>/",
        EpicPropertyOptionEndpoint.as_view(),
        name="epic-property-options",
    ),
    # Epic property values
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/values/",
        EpicPropertyValueEndpoint.as_view(),
        name="epic-property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/values/<uuid:pk>/",
        EpicPropertyValueEndpoint.as_view(),
        name="epic-property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/epic-properties/<uuid:property_id>/values/",
        EpicPropertyValueEndpoint.as_view(),
        name="epic-property-values",
    ),
    ## Epic property activity
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/epics/<uuid:epic_id>/property-activity/",
        EpicPropertyActivityEndpoint.as_view(),
        name="epic-property-activity",
    ),
]
