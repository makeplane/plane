from django.urls import path

from plane.ee.views import (
    MobileWorkspaceInvitationEndpoint,
)


urlpatterns = [
    path(
        "mobile/workspace-invitation/<str:invitation_id>/<str:email>/",
        MobileWorkspaceInvitationEndpoint.as_view(),
        name="mobile-workspace-invitation",
    ),
]
