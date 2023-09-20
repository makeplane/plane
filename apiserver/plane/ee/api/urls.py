from django.urls import path

from plane.ee.api.views import (
    # Issue Properties
    PropertyViewSet,
    PropertyValueViewSet,
    ## End Issue Properties
)

urlpatterns = [
    # Issue Property
    path(
        "workspaces/<str:slug>/properties/",
        PropertyViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="properties",
    ),
    path(
        "workspaces/<str:slug>/properties/<uuid:pk>/",
        PropertyViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="properties",
    ),
    path(
        "workspaces/<str:slug>/entity-properties/",
        PropertyViewSet.as_view(
            {
                "get": "list_objects",
            }
        ),
        name="properties",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/<str:entity>/<uuid:entity_uuid>/property-values/",
        PropertyValueViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="property-values",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/<str:entity>/<uuid:entity_uuid>/property-values/<uuid:property_id>/",
        PropertyValueViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="property-values",
    ),
    ## End Issue Property
]
