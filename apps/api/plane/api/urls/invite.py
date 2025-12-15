# Django imports
from django.urls import path, include

# Third party imports
from rest_framework.routers import DefaultRouter

# Module imports
from plane.api.views import WorkspaceInvitationsViewset


# Create router with just the invitations prefix (no workspace slug)
router = DefaultRouter()
router.register(r"invitations", WorkspaceInvitationsViewset, basename="workspace-invitations")

# Wrap the router URLs with the workspace slug path
urlpatterns = [
    path("workspaces/<str:slug>/", include(router.urls)),
]
