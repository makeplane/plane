from django.urls import path

from plane.license.api.views import (
    EmailCredentialCheckEndpoint,
    InstanceAdminEndpoint,
    InstanceAdminSignInEndpoint,
    InstanceAdminSignUpEndpoint,
    InstanceConfigurationEndpoint,
    DisableEmailFeatureEndpoint,
    InstanceEndpoint,
    SignUpScreenVisitedEndpoint,
    InstanceAdminUserMeEndpoint,
    InstanceAdminSignOutEndpoint,
    InstanceAdminUserSessionEndpoint,
    InstanceWorkSpaceAvailabilityCheckEndpoint,
    InstanceWorkSpaceEndpoint,
    InstanceWorkSpaceDetailEndpoint,
)

from plane.app.views import (
    GodModeAssignmentGroupEndpoint,
    GodModeAssignmentGroupDetailEndpoint,
    GodModeAssignmentGroupMemberEndpoint,
    GodModeAssignmentGroupMemberDetailEndpoint,
    GodModeCabGroupEndpoint,
    GodModeCabGroupDetailEndpoint,
    GodModeCabGroupMemberEndpoint,
    GodModeCabGroupMemberDetailEndpoint,
    GodModeDesignateCabGroupEndpoint,
    GodModeWorkspaceMembersEndpoint,
)

urlpatterns = [
    path("", InstanceEndpoint.as_view(), name="instance"),
    path("admins/", InstanceAdminEndpoint.as_view(), name="instance-admins"),
    path("admins/me/", InstanceAdminUserMeEndpoint.as_view(), name="instance-admins"),
    path(
        "admins/session/",
        InstanceAdminUserSessionEndpoint.as_view(),
        name="instance-admin-session",
    ),
    path(
        "admins/sign-out/",
        InstanceAdminSignOutEndpoint.as_view(),
        name="instance-admins",
    ),
    path("admins/<uuid:pk>/", InstanceAdminEndpoint.as_view(), name="instance-admins"),
    path(
        "configurations/",
        InstanceConfigurationEndpoint.as_view(),
        name="instance-configuration",
    ),
    path(
        "configurations/disable-email-feature/",
        DisableEmailFeatureEndpoint.as_view(),
        name="disable-email-configuration",
    ),
    path(
        "admins/sign-in/",
        InstanceAdminSignInEndpoint.as_view(),
        name="instance-admin-sign-in",
    ),
    path(
        "admins/sign-up/",
        InstanceAdminSignUpEndpoint.as_view(),
        name="instance-admin-sign-in",
    ),
    path(
        "admins/sign-up-screen-visited/",
        SignUpScreenVisitedEndpoint.as_view(),
        name="instance-sign-up",
    ),
    path(
        "email-credentials-check/",
        EmailCredentialCheckEndpoint.as_view(),
        name="email-credential-check",
    ),
    path(
        "workspace-slug-check/",
        InstanceWorkSpaceAvailabilityCheckEndpoint.as_view(),
        name="instance-workspace-availability",
    ),
    path("workspaces/", InstanceWorkSpaceEndpoint.as_view(), name="instance-workspace"),
    path(
        "workspaces/<str:slug>/",
        InstanceWorkSpaceDetailEndpoint.as_view(),
        name="instance-workspace-detail",
    ),

    # ------------------------------------------------------------------
    # God Mode — Assignment Groups
    # ------------------------------------------------------------------
    path(
        "workspaces/<str:slug>/assignment-groups/",
        GodModeAssignmentGroupEndpoint.as_view(),
        name="godmode-assignment-groups",
    ),
    path(
        "workspaces/<str:slug>/assignment-groups/<uuid:pk>/",
        GodModeAssignmentGroupDetailEndpoint.as_view(),
        name="godmode-assignment-group-detail",
    ),
    path(
        "workspaces/<str:slug>/assignment-groups/<uuid:group_id>/members/",
        GodModeAssignmentGroupMemberEndpoint.as_view(),
        name="godmode-assignment-group-members",
    ),
    path(
        "workspaces/<str:slug>/assignment-groups/<uuid:group_id>/members/<uuid:pk>/",
        GodModeAssignmentGroupMemberDetailEndpoint.as_view(),
        name="godmode-assignment-group-member-detail",
    ),

    # ------------------------------------------------------------------
    # God Mode — CAB Groups
    # ------------------------------------------------------------------
    path(
        "workspaces/<str:slug>/cab-groups/",
        GodModeCabGroupEndpoint.as_view(),
        name="godmode-cab-groups",
    ),
    path(
        "workspaces/<str:slug>/cab-groups/<uuid:pk>/",
        GodModeCabGroupDetailEndpoint.as_view(),
        name="godmode-cab-group-detail",
    ),
    path(
        "workspaces/<str:slug>/cab-groups/<uuid:pk>/designate/",
        GodModeDesignateCabGroupEndpoint.as_view(),
        name="godmode-cab-group-designate",
    ),
    path(
        "workspaces/<str:slug>/cab-groups/<uuid:group_id>/members/",
        GodModeCabGroupMemberEndpoint.as_view(),
        name="godmode-cab-group-members",
    ),
    path(
        "workspaces/<str:slug>/cab-groups/<uuid:group_id>/members/<uuid:pk>/",
        GodModeCabGroupMemberDetailEndpoint.as_view(),
        name="godmode-cab-group-member-detail",
    ),

    # ------------------------------------------------------------------
    # God Mode — Workspace Members (read-only for member selectors)
    # ------------------------------------------------------------------
    path(
        "workspaces/<str:slug>/members/",
        GodModeWorkspaceMembersEndpoint.as_view(),
        name="godmode-workspace-members",
    ),
]
