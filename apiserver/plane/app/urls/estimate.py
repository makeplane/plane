from django.urls import path


from plane.app.views import (
    ProjectEstimatePointEndpoint,
    BulkEstimatePointEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-estimates/",
        ProjectEstimatePointEndpoint.as_view(),
        name="project-estimate-points",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/",
        BulkEstimatePointEndpoint.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="bulk-create-estimate-points",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:estimate_id>/",
        BulkEstimatePointEndpoint.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="bulk-create-estimate-points",
    ),
]
