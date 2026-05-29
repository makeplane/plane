from django.urls import path

from plane.app.views import SupportTicketViewSet

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/support-tickets/",
        SupportTicketViewSet.as_view({"get": "list", "post": "create"}),
        name="project-support-tickets",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/support-tickets/<uuid:pk>/",
        SupportTicketViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-support-ticket-detail",
    ),
]
