"""Backlog URL routes for FamilyFlow"""

# Django imports
from django.urls import path

# Module imports
from plane.app.views.backlog import BacklogItemViewSet

urlpatterns = [
    # Backlog routes
    path(
        "families/<uuid:family_id>/backlog/",
        BacklogItemViewSet.as_view({"get": "list", "post": "create"}),
        name="backlog-list-create",
    ),
    path(
        "families/<uuid:family_id>/backlog/<uuid:pk>/",
        BacklogItemViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="backlog-detail-update-delete",
    ),
    path(
        "families/<uuid:family_id>/backlog/reorder/",
        BacklogItemViewSet.as_view({"post": "reorder"}),
        name="backlog-reorder",
    ),
]

