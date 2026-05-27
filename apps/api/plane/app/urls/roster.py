from django.urls import path

from plane.app.views import RosterPlayerViewSet


urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/roster/import/",
        RosterPlayerViewSet.as_view({"post": "import_players"}),
        name="project-roster-import",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/roster/",
        RosterPlayerViewSet.as_view({"get": "list", "post": "create"}),
        name="project-roster",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/roster/<uuid:pk>/",
        RosterPlayerViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-roster-detail",
    ),
]
