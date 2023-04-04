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
    UserActivityEndpoint,
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
    UserActivityGraphEndpoint,
    UserIssueCompletedGraphEndpoint,
    UserWorkspaceDashboardEndpoint,
    ## End Workspaces
    # File Assets
    FileAssetEndpoint,
    UserAssetsEndpoint,
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
    ProjectFavoritesViewSet,
    ## End Projects
    # Issues
    IssueViewSet,
    WorkSpaceIssuesEndpoint,
    IssueActivityEndpoint,
    IssueCommentViewSet,
    UserWorkSpaceIssues,
    BulkDeleteIssuesEndpoint,
    BulkImportIssuesEndpoint,
    ProjectUserViewsEndpoint,
    TimeLineIssueViewSet,
    IssuePropertyViewSet,
    LabelViewSet,
    SubIssuesEndpoint,
    IssueLinkViewSet,
    BulkCreateIssueLabelsEndpoint,
    IssueAttachmentEndpoint,
    ## End Issues
    # States
    StateViewSet,
    ## End States
    # Estimates
    EstimateViewSet,
    EstimatePointViewSet,
    ProjectEstimatePointEndpoint,
    ## End Estimates
    # Shortcuts
    ShortCutViewSet,
    ## End Shortcuts
    # Views
    IssueViewViewSet,
    ViewIssuesEndpoint,
    IssueViewFavoriteViewSet,
    ## End Views
    # Cycles
    CycleViewSet,
    CycleIssueViewSet,
    CycleDateCheckEndpoint,
    CurrentUpcomingCyclesEndpoint,
    CompletedCyclesEndpoint,
    CycleFavoriteViewSet,
    DraftCyclesEndpoint,
    TransferCycleIssueEndpoint,
    InCompleteCyclesEndpoint,
    ## End Cycles
    # Modules
    ModuleViewSet,
    ModuleIssueViewSet,
    ModuleFavoriteViewSet,
    ModuleLinkViewSet,
    BulkImportModulesEndpoint,
    ## End Modules
    # Pages
    PageViewSet,
    PageBlockViewSet,
    PageFavoriteViewSet,
    CreateIssueFromPageBlockEndpoint,
    RecentPagesEndpoint,
    FavoritePagesEndpoint,
    MyPagesEndpoint,
    CreatedbyOtherPagesEndpoint,
    ## End Pages
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
    BulkCreateGithubIssueSyncEndpoint,
    ## End Integrations
    # Importer
    ServiceIssueImportSummaryEndpoint,
    ImportServiceEndpoint,
    UpdateServiceImportStatusEndpoint,
    ## End importer
    # Search
    GlobalSearchEndpoint,
    IssueSearchEndpoint,
    ## End Search
    # Gpt
    GPTIntegrationEndpoint,
    ## End Gpt
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
    path("users/activities/", UserActivityEndpoint.as_view(), name="user-activities"),
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
    # User Graphs
    path(
        "users/me/workspaces/<str:slug>/activity-graph/",
        UserActivityGraphEndpoint.as_view(),
        name="user-activity-graph",
    ),
    path(
        "users/me/workspaces/<str:slug>/issues-completed-graph/",
        UserIssueCompletedGraphEndpoint.as_view(),
        name="completed-graph",
    ),
    path(
        "users/me/workspaces/<str:slug>/dashboard/",
        UserWorkspaceDashboardEndpoint.as_view(),
        name="user-workspace-dashboard",
    ),
    ## User  Graph
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
    path(
        "workspaces/<str:slug>/user-favorite-projects/",
        ProjectFavoritesViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project",
    ),
    path(
        "workspaces/<str:slug>/user-favorite-projects/<uuid:project_id>/",
        ProjectFavoritesViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="project",
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
    #  States
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/",
        EstimateViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-estimates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:pk>/",
        EstimateViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-estimates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:estimate_id>/estimate-points/",
        EstimatePointViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-estimate-points",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:estimate_id>/estimate-points/<uuid:pk>/",
        EstimatePointViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-estimates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-estimates/",
        ProjectEstimatePointEndpoint.as_view(),
        name="project-estimate-points",
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
        IssueViewViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-view",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:pk>/",
        IssueViewViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-view",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/views/<uuid:view_id>/issues/",
        ViewIssuesEndpoint.as_view(),
        name="project-view-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-views/",
        IssueViewFavoriteViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="user-favorite-view",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-views/<uuid:view_id>/",
        IssueViewFavoriteViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="user-favorite-view",
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
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/date-check/",
        CycleDateCheckEndpoint.as_view(),
        name="project-cycle",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/current-upcoming-cycles/",
        CurrentUpcomingCyclesEndpoint.as_view(),
        name="project-cycle-upcoming",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/completed-cycles/",
        CompletedCyclesEndpoint.as_view(),
        name="project-cycle-completed",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/draft-cycles/",
        DraftCyclesEndpoint.as_view(),
        name="project-cycle-draft",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-cycles/",
        CycleFavoriteViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="user-favorite-cycle",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-cycles/<uuid:cycle_id>/",
        CycleFavoriteViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="user-favorite-cycle",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/transfer-issues/",
        TransferCycleIssueEndpoint.as_view(),
        name="transfer-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/incomplete-cycles/",
        InCompleteCyclesEndpoint.as_view(),
        name="transfer-issues",
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
        "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-create-labels/",
        BulkCreateIssueLabelsEndpoint.as_view(),
        name="project-bulk-labels",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-delete-issues/",
        BulkDeleteIssuesEndpoint.as_view(),
        name="project-issues-bulk",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-import-issues/<str:service>/",
        BulkImportIssuesEndpoint.as_view(),
        name="project-issues-bulk",
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
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-links/",
        IssueLinkViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-links/<uuid:pk>/",
        IssueLinkViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-attachments/",
        IssueAttachmentEndpoint.as_view(),
        name="project-issue-attachments",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/issue-attachments/<uuid:pk>/",
        IssueAttachmentEndpoint.as_view(),
        name="project-issue-attachments",
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
        name="file-assets",
    ),
    path(
        "workspaces/file-assets/<uuid:workspace_id>/<str:asset_key>/",
        FileAssetEndpoint.as_view(),
        name="file-assets",
    ),
    path(
        "users/file-assets/",
        UserAssetsEndpoint.as_view(),
        name="user-file-assets",
    ),
    path(
        "users/file-assets/<str:asset_key>/",
        UserAssetsEndpoint.as_view(),
        name="user-file-assets",
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
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/modules/<uuid:module_id>/module-links/",
        ModuleLinkViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-issue-module-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/modules/<uuid:module_id>/module-links/<uuid:pk>/",
        ModuleLinkViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-issue-module-links",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-modules/",
        ModuleFavoriteViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="user-favorite-module",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-modules/<uuid:module_id>/",
        ModuleFavoriteViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="user-favorite-module",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/bulk-import-modules/<str:service>/",
        BulkImportModulesEndpoint.as_view(),
        name="bulk-modules-create",
    ),
    ## End Modules
    # Pages
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/",
        PageViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/page-blocks/",
        PageBlockViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="project-page-blocks",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/page-blocks/<uuid:pk>/",
        PageBlockViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="project-page-blocks",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-pages/",
        PageFavoriteViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="user-favorite-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/user-favorite-pages/<uuid:page_id>/",
        PageFavoriteViewSet.as_view(
            {
                "delete": "destroy",
            }
        ),
        name="user-favorite-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/page-blocks/<uuid:page_block_id>/issues/",
        CreateIssueFromPageBlockEndpoint.as_view(),
        name="page-block-issues",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/recent-pages/",
        RecentPagesEndpoint.as_view(),
        name="recent-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/favorite-pages/",
        FavoritePagesEndpoint.as_view(),
        name="recent-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/my-pages/",
        MyPagesEndpoint.as_view(),
        name="user-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/created-by-other-pages/",
        CreatedbyOtherPagesEndpoint.as_view(),
        name="created-by-other-pages",
    ),
    ## End Pages
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
        "workspaces/<str:slug>/workspace-integrations/<uuid:pk>/provider/",
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
        "workspaces/<str:slug>/projects/<uuid:project_id>/github-repository-sync/<uuid:repo_sync_id>/bulk-create-github-issue-sync/",
        BulkCreateGithubIssueSyncEndpoint.as_view(),
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
    # Importer
    path(
        "workspaces/<str:slug>/importers/<str:service>/",
        ServiceIssueImportSummaryEndpoint.as_view(),
        name="importer",
    ),
    path(
        "workspaces/<str:slug>/projects/importers/<str:service>/",
        ImportServiceEndpoint.as_view(),
        name="importer",
    ),
    path(
        "workspaces/<str:slug>/importers/",
        ImportServiceEndpoint.as_view(),
        name="importer",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/service/<str:service>/importers/<uuid:importer_id>/",
        UpdateServiceImportStatusEndpoint.as_view(),
        name="importer",
    ),
    ##  End Importer
    # Search
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/search/",
        GlobalSearchEndpoint.as_view(),
        name="global-search",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/search-issues/",
        IssueSearchEndpoint.as_view(),
        name="project-issue-search",
    ),
    ## End Search
    # Gpt
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/ai-assistant/",
        GPTIntegrationEndpoint.as_view(),
        name="importer",
    ),
    ## End Gpt
]
