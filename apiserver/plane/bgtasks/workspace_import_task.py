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


def replace_model_data(fields, model_data, user_maps):
    for field in fields:
        model_data[field] = user_maps.get(
            model_data.get(field), model_data.get(field)
        )
    return model_data


def data_transformer(model, model_data, user_maps):
    # model name mapper
    mapper = {
        "workspace": [
            "created_by_id",
            "updated_by_id",
            "owner_id",
        ],
        "workspacememberinvite": [
            "created_by_id",
            "updated_by_id",
        ],
        "workspacetheme": [
            "created_by_id",
            "updated_by_id",
        ],
        "workspacemember": [
            "created_by_id",
            "updated_by_id",
            "member_id",
        ],
        "workspaceuserproperties": [
            "created_by_id",
            "updated_by_id",
            "user_id",
        ],
        "project": [
            "created_by_id",
            "updated_by_id",
            "default_assignee_id",
            "project_lead_id",
        ],
        "projectdeployboard": [
            "created_by_id",
            "updated_by_id",
        ],
        "projectfavorite": [
            "user_id",
            "created_by_id",
            "updated_by_id",
        ],
        "projectmember": [
            "created_by_id",
            "updated_by_id",
            "member_id",
        ],
        "projectidentifier": [
            "created_by_id",
            "updated_by_id",
        ],
        "projectmemberinvite": [
            "created_by_id",
            "updated_by_id",
        ],
        "projectpublicmember": [
            "created_by_id",
            "updated_by_id",
            "member_id",
        ],
        "state": [
            "created_by_id",
            "updated_by_id",
        ],
        "label": [
            "created_by_id",
            "updated_by_id",
        ],
        "estimate": [
            "created_by_id",
            "updated_by_id",
        ],
        "estimatepoint": [
            "created_by_id",
            "updated_by_id",
        ],
        "issue": [
            "created_by_id",
            "updated_by_id",
        ],
        "issuecomment": [
            "created_by_id",
            "updated_by_id",
            "actor_id",
        ],
        "issueassignee": [
            "created_by_id",
            "updated_by_id",
            "assignee_id",
        ],
        "issuelabel": [
            "created_by_id",
            "updated_by_id",
        ],
        "issuelink": [
            "created_by_id",
            "updated_by_id",
        ],
        "issuemention": [
            "created_by_id",
            "updated_by_id",
            "mention_id",
        ],
        "issuevote": [
            "created_by_id",
            "updated_by_id",
            "actor_id",
        ],
        "issuesubscriber": [
            "created_by_id",
            "updated_by_id",
            "subscriber_id",
        ],
        "issueproperty": [
            "created_by_id",
            "updated_by_id",
            "user_id",
        ],
        "issuesequence": [
            "created_by_id",
            "updated_by_id",
        ],
        "issuereaction": [
            "created_by_id",
            "updated_by_id",
            "actor_id",
        ],
        "issuerelation": [
            "created_by_id",
            "updated_by_id",
        ],
        "issueattachment": [
            "created_by_id",
            "updated_by_id",
        ],
        "issueactivity": [
            "created_by_id",
            "updated_by_id",
            "actor_id",
        ],
        "apitoken": [
            "created_by_id",
            "updated_by_id",
            "user_id",
        ],
        "fileasset": [
            "created_by_id",
            "updated_by_id",
        ],
        "commentreaction": [
            "created_by_id",
            "updated_by_id",
            "actor_id",
        ],
        "cycle": [
            "created_by_id",
            "updated_by_id",
            "owned_by_id",
        ],
        "cycleissue": [
            "created_by_id",
            "updated_by_id",
        ],
        "cyclefavorite": [
            "user_id",
            "created_by_id",
            "updated_by_id",
        ],
        "cycleuserproperties": [
            "user_id",
            "created_by_id",
            "updated_by_id",
        ],
        "module": [
            "created_by_id",
            "updated_by_id",
            "lead_id",
        ],
        "moduleissue": [
            "created_by_id",
            "updated_by_id",
        ],
        "modulefavorite": [
            "user_id",
            "created_by_id",
            "updated_by_id",
        ],
        "modulelink": [
            "created_by_id",
            "updated_by_id",
        ],
        "modulemember": [
            "created_by_id",
            "updated_by_id",
            "member_id",
        ],
        "moduleuserproperties": [
            "user_id",
            "created_by_id",
            "updated_by_id",
        ],
        "page": [
            "created_by_id",
            "updated_by_id",
            "owned_by_id",
        ],
        "pagelog": [
            "created_by_id",
            "updated_by_id",
        ],
        "pagelabel": [
            "created_by_id",
            "updated_by_id",
        ],
        "pagefavorite": [
            "user_id",
            "created_by_id",
            "updated_by_id",
        ],
        "webhook": [
            "created_by_id",
            "updated_by_id",
        ],
        "issueview": [
            "created_by_id",
            "updated_by_id",
        ],
        "issueviewfavorite": [
            "user_id",
            "created_by_id",
            "updated_by_id",
        ],
        "notification": [
            "created_by_id",
            "updated_by_id",
            "triggered_by_id",
            "receiver_id",
        ],
        "usernotificationpreference": [
            "user_id",
            "created_by_id",
            "updated_by_id",
        ],
        "inbox": [
            "created_by_id",
            "updated_by_id",
        ],
        "inboxissue": [
            "created_by_id",
            "updated_by_id",
        ],
    }

    # Get all the fields for the current model
    fields = mapper[model._meta.model_name]
    if fields:
        model_data = replace_model_data(
            fields=fields, model_data=model_data, user_maps=user_maps
        )
        # return modified model data
        return model_data
    # return model data
    return model_data


@shared_task
def workspace_import(workspace_data):
    try:
        # Create Users
        users = json.loads(workspace_data.get("users.json"))

        # get user emails
        user_emails = [user.get("email") for user in users]
        imported_users = {user.get("email"): user.get("id") for user in users}
        existing_users = User.objects.filter(email__in=user_emails).values(
            "id", "email"
        )

        user_maps = {
            imported_users.get(exuser.get("email")): str(exuser.get("id"))
            for exuser in existing_users
            if imported_users.get(exuser.get("email"))
        }

        User.objects.bulk_create(
            [User(**user) for user in (users)],
            batch_size=100,
            ignore_conflicts=True,
        )

        # Workspaces
        workspaces = workspace_data.get("workspaces.json")
        Workspace.objects.bulk_create(
            [
                Workspace(
                    **data_transformer(
                        model=Workspace,
                        model_data=workspace,
                        user_maps=user_maps,
                    )
                )
                for workspace in json.loads(workspaces)
            ],
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
            # Loop through all the models and create the records accordingly
            model.objects.bulk_create(
                [
                    model(
                        **data_transformer(
                            model=model,
                            model_data=model_data,
                            user_maps=user_maps,
                        )
                    )
                    for model_data in json.loads(data)
                ],
                batch_size=100,
                ignore_conflicts=True,
            )

        return

    except Exception as e:
        log_exception(e)
        return
