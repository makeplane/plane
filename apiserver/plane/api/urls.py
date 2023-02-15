from django.urls import path


# Create your urls here.

from plane.api.views import (
    # Authentication
    SignInEndpoint,
    SignOutEndpoint,
    MagicSignInEndpoint,
    MagicSignInGenerateEndpoint,
    OauthEndpoint,
    ## End Authentication
    # Auth Extended
    ForgotPasswordEndpoint,
    VerifyEmailEndpoint,
    ResetPasswordEndpoint,
    RequestEmailVerificationEndpoint,
    ChangePasswordEndpoint,
    ## End Auth Extender
    # User
    UserEndpoint,
    UpdateUserOnBoardedEndpoint,
    ## End User
    # Workspaces
    WorkSpaceViewSet,
    UserWorkspaceInvitationsEndpoint,
    UserWorkSpacesEndpoint,
    InviteWorkspaceEndpoint,
    JoinWorkspaceEndpoint,
    WorkSpaceMemberViewSet,
    WorkspaceInvitationsViewset,
    UserWorkspaceInvitationsEndpoint,
    WorkspaceMemberUserEndpoint,
    WorkspaceMemberUserViewsEndpoint,
    WorkSpaceAvailabilityCheckEndpoint,
    TeamMemberViewSet,
    AddTeamToProjectEndpoint,
    UserLastProjectWithWorkspaceEndpoint,
    UserWorkspaceInvitationEndpoint,
    ## End Workspaces
    # File Assets
    FileAssetEndpoint,
    ## End File Assets
    # Projects
    ProjectViewSet,
    InviteProjectEndpoint,
    ProjectMemberViewSet,
    ProjectMemberInvitationsViewset,
    ProjectMemberUserEndpoint,
    AddMemberToProjectEndpoint,
    ProjectJoinEndpoint,
    UserProjectInvitationsViewset,
    ProjectIdentifierEndpoint,
    ## End Projects
    # Issues
    IssueViewSet,
    WorkSpaceIssuesEndpoint,
    IssueActivityEndpoint,
    IssueCommentViewSet,
    UserWorkSpaceIssues,
    BulkDeleteIssuesEndpoint,
    ProjectUserViewsEndpoint,
    TimeLineIssueViewSet,
    IssuePropertyViewSet,
    LabelViewSet,
    SubIssuesEndpoint,
    ## End Issues
    # States
    StateViewSet,
    ## End States
    # Shortcuts
    ShortCutViewSet,
    ## End Shortcuts
    # Views
    ViewViewSet,
    ## End Views
    # Cycles
    CycleViewSet,
    CycleIssueViewSet,
    ## End Cycles
    # Modules
    ModuleViewSet,
    ModuleIssueViewSet,
    ## End Modules
    # Api Tokens
    ApiTokenEndpoint,
    ## End Api Tokens
    # Integrations
    IntegrationViewSet,
    WorkspaceIntegrationViewSet,
    GithubRepositoriesEndpoint,
    GithubRepositorySyncViewSet,
    GithubIssueSyncViewSet,
    GithubCommentSyncViewSet,
    ## End Integrations
)


urlpatterns = [
    #  Social Auth
    path("social-auth/", OauthEndpoint.as_view(), name="oauth"),
    # Auth
    path("sign-in/", SignInEndpoint.as_view(), name="sign-in"),
    path("sign-out/", SignOutEndpoint.as_view(), name="sign-out"),
    # Magic Sign In/Up
    path(
        "magic-generate/", MagicSignInGenerateEndpoint.as_view(), name="magic-generate"
    ),
    path("magic-sign-in/", MagicSignInEndpoint.as_view(), name="magic-sign-in"),
    # Email verification
    path("email-verify/", VerifyEmailEndpoint.as_view(), name="email-verify"),
    path(
        "request-email-verify/",
        RequestEmailVerificationEndpoint.as_view(),
        name="request-reset-email",
    ),
    # Password Manipulation
    path(
        "password-reset/<uidb64>/<token>/",
        ResetPasswordEndpoint.as_view(),
        name="password-reset",
    ),
    path(
        "forgot-password/",
        ForgotPasswordEndpoint.as_view(),
        name="forgot-password",
    ),
    # User Profile
    path(
        "users/me/",
        UserEndpoint.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="users",
    ),
    path(
        "users/me/change-password/",
        ChangePasswordEndpoint.as_view(),
        name="change-password",
    ),
    path(
        "users/me/onboard/",
        UpdateUserOnBoardedEndpoint.as_view(),
        name="change-password",
    ),
    # user workspaces
    path(
        "users/me/workspaces/",
        UserWorkSpacesEndpoint.as_view(),
        name="user-workspace",
    ),
    # user workspace invitations
    path(
        "users/me/invitations/workspaces/",
        UserWorkspaceInvitationsEndpoint.as_view({"get": "list", "post": "create"}),
        name="user-workspace-invitations",
    ),
    # user workspace invitation
    path(
        "users/me/invitations/<uuid:pk>/",
        UserWorkspaceInvitationEndpoint.as_view(
            {
                "get": "retrieve",
            }
        ),
        name="workspace",
    ),
    # user join workspace
    path(
        "users/me/invitations/workspaces/<str:slug>/<uuid:pk>/join/",
        JoinWorkspaceEndpoint.as_view(),
        name="user-join-workspace",
    ),
    # user project invitations
    path(
        "users/me/invitations/projects/",
        UserProjectInvitationsViewset.as_view({"get": "list", "post": "create"}),
        name="user-project-invitaions",
    ),
    ## Workspaces ##
    path(
        "workspace-slug-check/",
        WorkSpaceAvailabilityCheckEndpoint.as_view(),
        name="workspace-availability",
    ),
    path(
        "workspaces/",
        WorkSpaceViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="workspace",
    ),
    path(
        "workspaces/<str:slug>/",
        WorkSpaceViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="workspace",
    ),
    path(
        "workspaces/<str:slug>/invite/",
        InviteWorkspaceEndpoint.as_view(),
        name="workspace",
    ),
    path(
        "workspaces/<str:slug>/invitations/",
        WorkspaceInvitationsViewset.as_view({"get": "list"}),
        name="workspace",
    ),
    path(
        "workspaces/<str:slug>/invitations/<uuid:pk>/",
        WorkspaceInvitationsViewset.as_view(
            {
                "delete": "destroy",
                "get": "retrieve",
                "get": "retrieve",
            }
        ),
        name="workspace",
    ),
    path(
        "workspaces/<str:slug>/members/",
        WorkSpaceMemberViewSet.as_view({"get": "list"}),
        name="workspace",
    ),
    path(
        "workspaces/<str:slug>/members/<uuid:pk>/",
        WorkSpaceMemberViewSet.as_view(
            {
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
                "get": "retrieve",
            }
        ),
        name="workspace",
    ),
    path(
        "workspaces/<str:slug>/teams/",
        TeamMemberViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="workspace",
    ),
    path(
        "workspaces/<str:slug>/teams/<uuid:pk>/",
        TeamMemberViewSet.as_view(
            {
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
                "get": "retrieve",
            }
        ),
        name="workspace",
    ),
    path(
        "users/last-visited-workspace/",
        UserLastProjectWithWorkspaceEndpoint.as_view(),
        name="workspace-project-details",
    ),
    path(
        "workspaces/<str:slug>/workspace-members/me/",
        WorkspaceMemberUserEndpoint.as_view(),
        name="workspace-member-details",
    ),
    path(
        "workspaces/<str:slug>/workspace-views/",
        WorkspaceMemberUserViewsEndpoint.as_view(),
        name="workspace-member-details",
    ),
    ## End Workspaces ##
    # Projects
    path(
        "workspaces/<str:slug>/projects/",
        ProjectViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:pk>/",
        ProjectViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/project-identifiers/",
        ProjectIdentifierEndpoint.as_view(),
        name="project-identifiers",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/invite/",
        InviteProjectEndpoint.as_view(),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/",
        ProjectMemberViewSet.as_view({"get": "list"}),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/<uuid:pk>/",
        ProjectMemberViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/members/add/",
        AddMemberToProjectEndpoint.as_view(),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/join/",
        ProjectJoinEndpoint.as_view(),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/team-invite/",
        AddTeamToProjectEndpoint.as_view(),
        name="projects",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/invitations/",
        ProjectMemberInvitationsViewset.as_view({"get": "list"}),
        name="workspace",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/invitations/<uuid:pk>/",
        ProjectMemberInvitationsViewset.as_view(
            {
                "get": "retrieve",
                "delete": "destroy",
            }
        ),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-views/",
        ProjectUserViewsEndpoint.as_view(),
        name="project-view",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-members/me/",
        ProjectMemberUserEndpoint.as_view(),
        name="project-view",
    ),
    # End Projects
    #  States
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/states/",
        StateViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-states",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/states/<uuid:pk>/",
        StateViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-state",
    ),
    # End States ##
    # Shortcuts
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/shortcuts/",
        ShortCutViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-shortcut",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/shortcuts/<uuid:pk>/",
        ShortCutViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-shortcut",
    ),
    ## End Shortcuts
    # Views
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/",
        ViewViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-view",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/",
        ViewViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-view",
    ),
    ## End Views
    ## Cycles
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/",
        CycleViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-cycle",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:pk>/",
        CycleViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-cycle",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/cycle-issues/",
        CycleIssueViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-cycle",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/cycle-issues/<uuid:pk>/",
        CycleIssueViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-cycle",
    ),
    ## End Cycles
    # Issue
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/",
        IssueViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:pk>/",
        IssueViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue",
    ),
    path(
        "workspaces/<str:slug>/issues/",
        WorkSpaceIssuesEndpoint.as_view(),
        name="workspace-issue",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-labels/",
        LabelViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-labels",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-labels/<uuid:pk>/",
        LabelViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue-labels",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-delete-issues/",
        BulkDeleteIssuesEndpoint.as_view(),
    ),
    path(
        "workspaces/<str:slug>/my-issues/",
        UserWorkSpaceIssues.as_view(),
        name="workspace-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/sub-issues/",
        SubIssuesEndpoint.as_view(),
        name="sub-issues",
    ),
    ## End Issues
    ## Issue Activity
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/history/",
        IssueActivityEndpoint.as_view(),
        name="project-issue-history",
    ),
    ## Issue Activity
    ## IssueComments
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/comments/",
        IssueCommentViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-comment",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/comments/<uuid:pk>/",
        IssueCommentViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue-comment",
    ),
    ## End IssueComments
    ## Roadmap
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/roadmaps/",
        TimeLineIssueViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-roadmap",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/roadmaps/<uuid:pk>/",
        TimeLineIssueViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue-roadmap",
    ),
    ## End Roadmap
    ## IssueProperty
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/",
        IssuePropertyViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-roadmap",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issue-properties/<uuid:pk>/",
        IssuePropertyViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue-roadmap",
    ),
    ## IssueProperty Ebd
    ## File Assets
    path(
        "workspaces/<str:slug>/file-assets/",
        FileAssetEndpoint.as_view(),
        name="File Assets",
    ),
    ## End File Assets
    ## Modules
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/modules/",
        ModuleViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-modules",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/modules/<uuid:pk>/",
        ModuleViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-modules",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/modules/<uuid:module_id>/module-issues/",
        ModuleIssueViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-module-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/modules/<uuid:module_id>/module-issues/<uuid:pk>/",
        ModuleIssueViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-module-issues",
    ),
    ## End Modules
    # API Tokens
    path("api-tokens/", ApiTokenEndpoint.as_view(), name="api-tokens"),
    path("api-tokens/<uuid:pk>/", ApiTokenEndpoint.as_view(), name="api-tokens"),
    ## End API Tokens
    # Integrations
    path(
        "integrations/",
        IntegrationViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="integrations",
    ),
    path(
        "integrations/<uuid:pk>/",
        IntegrationViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="integrations",
    ),
    path(
        "workspaces/<str:slug>/workspace-integrations/",
        WorkspaceIntegrationViewSet.as_view(
            {
                "get": "list",
            }
        ),
        name="workspace-integrations",
    ),
    path(
        "workspaces/<str:slug>/workspace-integrations/<str:provider>/",
        WorkspaceIntegrationViewSet.as_view(
            {
                "post": "create",
            }
        ),
        name="workspace-integrations",
    ),
    path(
        "workspaces/<str:slug>/workspace-integrations/<uuid:pk>/",
        WorkspaceIntegrationViewSet.as_view(
            {
                "get": "retrieve",
                "delete": "destroy",
            }
        ),
        name="workspace-integrations",
    ),
    # Github Integrations
    path(
        "workspaces/<str:slug>/workspace-integrations/<uuid:workspace_integration_id>/github-repositories/",
        GithubRepositoriesEndpoint.as_view(),
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workspace-integrations/<uuid:workspace_integration_id>/github-repository-sync/",
        GithubRepositorySyncViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/workspace-integrations/<uuid:workspace_integration_id>/github-repository-sync/<uuid:pk>/",
        GithubRepositorySyncViewSet.as_view(
            {
                "get": "retrieve",
                "delete": "destroy",
            }
        ),
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/github-repository-sync/<uuid:repo_sync_id>/github-issue-sync/",
        GithubIssueSyncViewSet.as_view(
            {
                "post": "create",
                "get": "list",
            }
        ),
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/github-repository-sync/<uuid:repo_sync_id>/github-issue-sync/<uuid:pk>/",
        GithubIssueSyncViewSet.as_view(
            {
                "get": "retrieve",
                "delete": "destroy",
            }
        ),
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/github-repository-sync/<uuid:repo_sync_id>/github-issue-sync/<uuid:issue_sync_id>/github-comment-sync/",
        GithubCommentSyncViewSet.as_view(
            {
                "post": "create",
                "get": "list",
            }
        ),
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/github-repository-sync/<uuid:repo_sync_id>/github-issue-sync/<uuid:issue_sync_id>/github-comment-sync/<uuid:pk>/",
        GithubCommentSyncViewSet.as_view(
            {
                "get": "retrieve",
                "delete": "destroy",
            }
        ),
    ),
    ## End Github Integrations
    ## End Integrations
]
