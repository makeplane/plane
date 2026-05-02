# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file in details.

# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

# Module imports
from plane.db.models import (
    CycleIssue,
    Issue,
    IssueActivity,
    IssueAssignee,
    IssueBlocker,
    IssueComment,
    IssueLabel,
    IssueLink,
    IssueMention,
    IssueReaction,
    IssueRelation,
    IssueSequence,
    IssueSubscriber,
    IssueVote,
    Label,
    ModuleIssue,
    Project,
    ProjectMember,
    State,
    UserRecentVisit,
    CommentReaction,
    FileAsset,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.host import base_host


def check_user_project_permission(slug, project_id, user_id, required_role=15):
    """
    Check if a user has the required permission for a project.

    Args:
        slug: Workspace slug
        project_id: Project ID
        user_id: User ID
        required_role: Minimum required role (default: 15 = MEMBER)

    Returns:
        bool: True if user has permission, False otherwise
    """
    from plane.db.models import WorkspaceMember

    project_member = ProjectMember.objects.filter(
        workspace__slug=slug,
        project_id=project_id,
        member_id=user_id,
        role__gte=required_role,
        is_active=True,
    ).exists()

    if project_member:
        return True

    workspace_admin = (
        ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            member_id=user_id,
            is_active=True,
        ).exists()
        and WorkspaceMember.objects.filter(
            workspace__slug=slug,
            member_id=user_id,
            role=20,
            is_active=True,
        ).exists()
    )

    return workspace_admin


def transfer_issue(
    slug,
    source_project_id,
    target_project_id,
    issue_id,
    request,
    user_id,
):
    """
    Transfer an issue from one project to another within the same workspace.

    This function handles:
    1. State/label mapping by name, using target project default state if no match
    2. Clearing cycle/module if they don't exist in target project
    3. Migrating all related data (comments, attachments, sub-issues, relations, activity)
    4. Updating issue sequence for target project

    Args:
        slug: Workspace slug
        source_project_id: Source project ID
        target_project_id: Target project ID
        issue_id: Issue ID to transfer
        request: HTTP request object
        user_id: User ID performing the transfer

    Returns:
        dict: Response data with success or error message
    """
    try:
        with transaction.atomic():
            if not check_user_project_permission(slug, target_project_id, user_id):
                return {
                    "success": False,
                    "error": "You do not have permission to transfer issues to the target project",
                }

            target_project = Project.objects.filter(
                workspace__slug=slug,
                pk=target_project_id,
                archived_at__isnull=True,
            ).first()

            if not target_project:
                return {
                    "success": False,
                    "error": "Target project not found",
                }

            if str(source_project_id) == str(target_project_id):
                return {
                    "success": False,
                    "error": "Source and target projects are the same",
                }

            issue = Issue.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                pk=issue_id,
                archived_at__isnull=True,
            ).first()

            if not issue:
                return {
                    "success": False,
                    "error": "Issue not found in source project",
                }

            old_project_id = issue.project_id
            old_state_id = issue.state_id

            source_state = State.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                pk=issue.state_id,
            ).first()

            new_state = None
            if source_state:
                new_state = State.objects.filter(
                    workspace__slug=slug,
                    project_id=target_project_id,
                    name__iexact=source_state.name,
                ).first()

            if not new_state:
                new_state = State.objects.filter(
                    workspace__slug=slug,
                    project_id=target_project_id,
                    default=True,
                ).first()

            if not new_state:
                new_state = State.objects.filter(
                    workspace__slug=slug,
                    project_id=target_project_id,
                ).first()

            if not new_state:
                return {
                    "success": False,
                    "error": "Target project has no states",
                }

            source_labels = list(
                Label.objects.filter(
                    workspace__slug=slug,
                    label_issue__issue=issue,
                    label_issue__deleted_at__isnull=True,
                )
            )

            target_label_ids = []
            for source_label in source_labels:
                target_label = Label.objects.filter(
                    workspace__slug=slug,
                    Q(project_id=target_project_id) | Q(project__isnull=True),
                    name__iexact=source_label.name,
                ).first()

                if target_label:
                    target_label_ids.append(target_label.id)

            source_assignees = list(
                IssueAssignee.objects.filter(
                    workspace__slug=slug,
                    project_id=source_project_id,
                    issue=issue,
                    deleted_at__isnull=True,
                ).values_list("assignee_id", flat=True)
            )

            target_assignee_ids = []
            if source_assignees:
                target_assignee_ids = list(
                    ProjectMember.objects.filter(
                        workspace__slug=slug,
                        project_id=target_project_id,
                        member_id__in=source_assignees,
                        is_active=True,
                        role__gte=15,
                    ).values_list("member_id", flat=True)
                )

            CycleIssue.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).delete()

            ModuleIssue.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).delete()

            issue.project_id = target_project_id
            issue.state = new_state
            issue.sort_order = 65535.0
            issue.updated_at = timezone.now()
            issue.updated_by_id = user_id
            issue.save(update_fields=["project_id", "state", "sort_order", "updated_at", "updated_by_id"])

            IssueLabel.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).delete()

            if target_label_ids:
                new_issue_labels = []
                for label_id in target_label_ids:
                    if not IssueLabel.objects.filter(
                        workspace__slug=slug,
                        project_id=target_project_id,
                        issue=issue,
                        label_id=label_id,
                        deleted_at__isnull=True,
                    ).exists():
                        new_issue_labels.append(
                            IssueLabel(
                                workspace_id=target_project.workspace_id,
                                project_id=target_project_id,
                                issue=issue,
                                label_id=label_id,
                                created_by_id=user_id,
                                updated_by_id=user_id,
                            )
                        )
                if new_issue_labels:
                    IssueLabel.objects.bulk_create(new_issue_labels, batch_size=100)

            IssueAssignee.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).delete()

            if target_assignee_ids:
                new_issue_assignees = []
                for assignee_id in target_assignee_ids:
                    if not IssueAssignee.objects.filter(
                        workspace__slug=slug,
                        project_id=target_project_id,
                        issue=issue,
                        assignee_id=assignee_id,
                        deleted_at__isnull=True,
                    ).exists():
                        new_issue_assignees.append(
                            IssueAssignee(
                                workspace_id=target_project.workspace_id,
                                project_id=target_project_id,
                                issue=issue,
                                assignee_id=assignee_id,
                                created_by_id=user_id,
                                updated_by_id=user_id,
                            )
                        )
                if new_issue_assignees:
                    IssueAssignee.objects.bulk_create(new_issue_assignees, batch_size=100)

            IssueActivity.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).update(
                project_id=target_project_id,
            )

            IssueComment.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).update(
                project_id=target_project_id,
            )

            CommentReaction.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                comment__issue=issue,
            ).update(
                project_id=target_project_id,
            )

            IssueLink.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).update(
                project_id=target_project_id,
            )

            IssueMention.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).update(
                project_id=target_project_id,
            )

            IssueReaction.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).update(
                project_id=target_project_id,
            )

            IssueRelation.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).update(
                project_id=target_project_id,
            )

            IssueRelation.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                related_issue=issue,
            ).update(
                project_id=target_project_id,
            )

            IssueBlocker.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                block=issue,
            ).update(
                project_id=target_project_id,
            )

            IssueBlocker.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                blocked_by=issue,
            ).update(
                project_id=target_project_id,
            )

            IssueSubscriber.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).update(
                project_id=target_project_id,
            )

            IssueVote.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).update(
                project_id=target_project_id,
            )

            FileAsset.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue_id=issue.id,
                entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            ).update(
                project_id=target_project_id,
            )

            child_issues = Issue.issue_objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                parent=issue,
            )

            for child_issue in child_issues:
                transfer_issue(
                    slug=slug,
                    source_project_id=source_project_id,
                    target_project_id=target_project_id,
                    issue_id=str(child_issue.id),
                    request=request,
                    user_id=user_id,
                )

            IssueSequence.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                issue=issue,
            ).update(
                project_id=target_project_id,
            )

            UserRecentVisit.objects.filter(
                workspace__slug=slug,
                project_id=source_project_id,
                entity_identifier=str(issue.id),
                entity_name="issue",
            ).update(
                project_id=target_project_id,
            )

            activity_data = {
                "issue_id": str(issue.id),
                "old_project_id": str(old_project_id),
                "new_project_id": str(target_project_id),
                "old_state_id": str(old_state_id) if old_state_id else None,
                "new_state_id": str(new_state.id),
            }

            issue_activity.delay(
                type="issue.activity.transferred",
                requested_data=json.dumps(activity_data, cls=DjangoJSONEncoder),
                actor_id=str(user_id),
                issue_id=str(issue.id),
                project_id=str(target_project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

            return {
                "success": True,
                "issue_id": str(issue.id),
                "source_project_id": str(source_project_id),
                "target_project_id": str(target_project_id),
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def bulk_transfer_issues(
    slug,
    source_project_id,
    target_project_id,
    issue_ids,
    request,
    user_id,
):
    """
    Transfer multiple issues from one project to another.

    Args:
        slug: Workspace slug
        source_project_id: Source project ID
        target_project_id: Target project ID
        issue_ids: List of issue IDs to transfer
        request: HTTP request object
        user_id: User ID performing the transfer

    Returns:
        dict: Response data with success count and error details
    """
    results = []
    success_count = 0
    transferred_issues = []
    errors = []

    for issue_id in issue_ids:
        result = transfer_issue(
            slug=slug,
            source_project_id=source_project_id,
            target_project_id=target_project_id,
            issue_id=issue_id,
            request=request,
            user_id=user_id,
        )
        results.append(result)
        if result.get("success"):
            success_count += 1
            transferred_issues.append(result.get("issue_id", issue_id))
        else:
            errors.append(
                {
                    "issue_id": issue_id,
                    "error": result.get("error", "Unknown error"),
                }
            )

    return {
        "success": success_count == len(issue_ids),
        "total": len(issue_ids),
        "success_count": success_count,
        "transferred_count": success_count,
        "transferred_issues": transferred_issues,
        "errors": errors,
        "results": results,
    }
