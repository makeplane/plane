"""Family URL routes for FamilyFlow"""

# Django imports
from django.urls import path

# Module imports
from plane.app.views.family import FamilyViewSet, FamilyMemberViewSet

urlpatterns = [
    # Family routes
    path(
        "families/",
        FamilyViewSet.as_view({"get": "list", "post": "create"}),
        name="family",
    ),
    path(
        "families/<uuid:pk>/",
        FamilyViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="family",
    ),
    # Family Member routes
    path(
        "families/<uuid:family_id>/members/",
        FamilyMemberViewSet.as_view({"get": "list", "post": "create"}),
        name="family-member",
    ),
    path(
        "families/<uuid:family_id>/members/<uuid:pk>/",
        FamilyMemberViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="family-member",
    ),
]

