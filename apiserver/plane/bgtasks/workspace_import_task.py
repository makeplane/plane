# Python imports
import json

# Third party imports
from celery import shared_task

from plane.db.models import (
    APIToken,
    CommentReaction,
    Cycle,
    CycleFavorite,
    CycleIssue,
    CycleUserProperties,
    Estimate,
    EstimatePoint,
    FileAsset,
    Inbox,
    InboxIssue,
    Issue,
    IssueActivity,
    IssueAssignee,
    IssueAttachment,
    IssueComment,
    IssueLabel,
    IssueLink,
    IssueMention,
    IssueProperty,
    IssueReaction,
    IssueRelation,
    IssueSequence,
    IssueSubscriber,
    IssueView,
    IssueViewFavorite,
    IssueVote,
    Label,
    Module,
    ModuleFavorite,
    ModuleIssue,
    ModuleLink,
    ModuleMember,
    ModuleUserProperties,
    Notification,
    Page,
    PageFavorite,
    PageLabel,
    PageLog,
    Project,
    ProjectDeployBoard,
    ProjectFavorite,
    ProjectIdentifier,
    ProjectMember,
    ProjectMemberInvite,
    ProjectPublicMember,
    State,
    User,
    UserNotificationPreference,
    Webhook,
    Workspace,
    WorkspaceMember,
    WorkspaceMemberInvite,
    WorkspaceTheme,
    WorkspaceUserProperties,
)
from plane.utils.exception_logger import log_exception


@shared_task
def workspace_import(workspace_data):
    try:
        # Create Users
        users = workspace_data.get("users.json")
        User.objects.bulk_create(
            [User(**user) for user in json.loads(users)],
            batch_size=100,
            ignore_conflicts=True,
        )

        # Workspaces
        workspaces = workspace_data.get("workspaces.json")
        Workspace.objects.bulk_create(
            [Workspace(**workspace) for workspace in json.loads(workspaces)],
            batch_size=100,
            ignore_conflicts=True,
        )

        models = {
            # Workspace
            WorkspaceMemberInvite: "workspace_member_invites.json",
            WorkspaceMember: "workspace_members.json",
            WorkspaceTheme: "workspace_themes.json",
            WorkspaceUserProperties: "workspace_user_properties.json",
            # Projects
            Project: "projects.json",
            ProjectDeployBoard: "project_deploy_boards.json",
            ProjectFavorite: "project_favorites.json",
            ProjectIdentifier: "project_identifier.json",
            ProjectMember: "project_members.json",
            ProjectMemberInvite: "project_member_invites.json",
            ProjectPublicMember: "project_public_members.json",
            # States
            State: "states.json",
            # Labels
            Label: "labels.json",
            # Estimate
            Estimate: "estimates.json",
            EstimatePoint: "estimate_points.json",
            # Issues
            Issue: "issues.json",
            IssueComment: "issue_comments.json",
            IssueAssignee: "issue_assignees.json",
            IssueLabel: "issue_labels.json",
            IssueLink: "issue_links.json",
            IssueMention: "issue_mention.json",
            IssueVote: "issue_votes.json",
            IssueSubscriber: "issue_subscribers.json",
            IssueProperty: "issue_properties.json",
            IssueSequence: "issue_sequences.json",
            IssueReaction: "issue_reactions.json",
            IssueRelation: "issue_relations.json",
            IssueAttachment: "issue_attachments.json",
            IssueActivity: "issue_activities.json",
            # APIToken
            APIToken: "api_tokens.json",
            # Assets
            FileAsset: "file_assets.json",
            CommentReaction: "comment_reactions.json",
            # Cycles
            Cycle: "cycles.json",
            CycleIssue: "cycle_issues.json",
            CycleFavorite: "cycle_favorites.json",
            CycleUserProperties: "cycle_user_properties.json",
            # Modules
            Module: "modules.json",
            ModuleIssue: "module_issues.json",
            ModuleFavorite: "module_favorites.json",
            ModuleLink: "module_links.json",
            ModuleMember: "module_members.json",
            ModuleUserProperties: "module_user_properties",
            # Page
            Page: "pages.json",
            PageLog: "page_logs.json",
            PageLabel: "page_labels.json",
            PageFavorite: "page_favorites.json",
            # Webhook
            Webhook: "webhooks.json",
            # Views
            IssueView: "views.json",
            IssueViewFavorite: "view_favorites.json",
            # Notification
            Notification: "notifications.json",
            UserNotificationPreference: "user_notification_preferences.json",
            # Inbox
            Inbox: "inboxes.json",
            InboxIssue: "inbox_issues.json",
        }

        for model in models:
            file_name = models[model]
            data = workspace_data.get(file_name)
            model.objects.bulk_create(
                [model(**model_data) for model_data in json.loads(data)],
                batch_size=100,
                ignore_conflicts=True,
            )

        return
    except Exception as e:
        log_exception(e)
        return
