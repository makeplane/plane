# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
from typing import List, Dict, Any, Optional
from uuid import UUID
import json

# Django imports
from django.db.models import Subquery

# Module imports
from plane.db.models import (
    Issue,
    IssueSubscriber,
    IssueMention,
    IssueAssignee,
    IssueComment,
    IssueActivity,
    ProjectMember,
    State,
    UserNotificationPreference,
)
from plane.utils.notifications.base import (
    SubscriberData,
    BaseNotificationHandler,
    ActivityData,
)


class WorkItemNotificationHandler(BaseNotificationHandler):
    """
    Notification handler for Issues and Epics.
    Handles all issue-related notifications including mentions, assignments, and property changes.
    """

    # Entity configuration
    ENTITY_NAME = "issue"
    ENTITY_MODEL = Issue
    SUBSCRIBER_MODEL = IssueSubscriber
    MENTION_MODEL = IssueMention
    ACTIVITY_MODEL = IssueActivity

    # Activity types that should not trigger notifications
    EXCLUDED_ACTIVITY_TYPES = [
        "cycle.activity.created",
        "cycle.activity.deleted",
        "module.activity.created",
        "module.activity.deleted",
        "issue_reaction.activity.created",
        "issue_reaction.activity.deleted",
        "comment_reaction.activity.created",
        "comment_reaction.activity.deleted",
        "issue_vote.activity.created",
        "issue_vote.activity.deleted",
        "issue_draft.activity.created",
        "issue_draft.activity.updated",
        "issue_draft.activity.deleted",
    ]

    # Cleaning methods
    @classmethod
    def normalize_activity_data(cls, activity_dict: Dict) -> Dict:
        """
        Normalize issue-specific activity keys to generic keys.
        Maps issue_comment -> entity_comment, issue_detail -> entity_detail
        """
        normalized = activity_dict.copy()

        # Map issue-specific keys to generic keys
        if "issue_comment" in normalized:
            normalized["entity_comment"] = normalized.pop("issue_comment")
        if "issue_detail" in normalized:
            normalized["entity_detail"] = normalized.pop("issue_detail")

        return normalized

    # ==================== Entity Loading ====================

    def load_entity(self):
        """Load the issue"""
        self.entity = Issue.objects.filter(pk=self.context.entity_id).first()

    def get_entity_display_name(self) -> str:
        """Get display name for the issue"""
        return self.entity.name if self.entity else ""

    def get_entity_data(self) -> Dict[str, Any]:
        """Get issue data for notification payload"""
        if not self.entity:
            return {}

        return {
            "id": str(self.context.entity_id),
            "name": str(self.entity.name),
            "identifier": str(self.entity.project.identifier),
            "sequence_id": self.entity.sequence_id,
            "state_name": self.entity.state.name,
            "state_group": self.entity.state.group,
            "type_id": str(self.entity.type_id),
        }

    def get_entity_type(self) -> str:
        """Return 'epic' if issue is an epic, otherwise 'issue'"""
        if self.entity and self.entity.type and self.entity.type.is_epic:
            return "epic"
        elif self.entity.issue_intake.exists():
            return "intake"
        return "issue"

    # ==================== Member & Subscriber Management ====================

    def get_active_members(self) -> List[UUID]:
        """Get list of active project members"""
        if not self.context.project_id:
            return []

        return list(
            ProjectMember.objects.filter(project_id=self.context.project_id, is_active=True).values_list(
                "member_id", flat=True
            )
        )

    def get_subscribers(self, exclude_users: List[str]) -> SubscriberData:
        """Get issue subscribers, assignees, and creator"""
        # Get subscribers (excluding mentioned users and actor)
        subscribers = list(
            IssueSubscriber.objects.filter(
                project_id=self.context.project_id,
                issue_id=self.context.entity_id,
                subscriber__in=Subquery(
                    ProjectMember.objects.filter(project_id=self.context.project_id, is_active=True).values("member_id")
                ),
            )
            .exclude(subscriber_id__in=exclude_users)
            .values_list("subscriber", flat=True)
        )

        # Get assignees
        assignees = list(
            IssueAssignee.objects.filter(
                issue_id=self.context.entity_id,
                project_id=self.context.project_id,
                assignee__in=Subquery(
                    ProjectMember.objects.filter(project_id=self.context.project_id, is_active=True).values("member_id")
                ),
            ).values_list("assignee", flat=True)
        )

        subscribers.extend(assignees)
        if self.entity and self.entity.created_by_id:
            subscribers.append(self.entity.created_by_id)

        # Remove duplicates and convert to UUIDs
        subscribers = list(set(subscribers))

        # Remove actor from the list
        subscribers = [subscriber for subscriber in subscribers if subscriber != UUID(self.context.actor_id)]

        return SubscriberData(
            subscribers=subscribers,
        )

    def create_subscribers(self, mentions: List[str]) -> List[IssueSubscriber]:
        """
        Create issue subscribers for mentioned users.
        Only creates if they're not already a subscriber, assignee, or creator.
        """
        if not mentions:
            return []

        bulk_subscribers = []

        for mention_id in mentions:
            # Only create subscriber if they're not already involved with the issue
            if (
                not IssueSubscriber.objects.filter(
                    issue_id=self.context.entity_id, subscriber_id=mention_id, project_id=self.context.project_id
                ).exists()
                and not IssueAssignee.objects.filter(
                    project_id=self.context.project_id, issue_id=self.context.entity_id, assignee_id=mention_id
                ).exists()
                and not Issue.objects.filter(
                    project_id=self.context.project_id, pk=self.context.entity_id, created_by_id=mention_id
                ).exists()
                and ProjectMember.objects.filter(
                    project_id=self.context.project_id, member_id=mention_id, is_active=True
                ).exists()
            ):
                bulk_subscribers.append(
                    IssueSubscriber(
                        workspace_id=self.project.workspace_id,
                        project_id=self.context.project_id,
                        issue_id=self.context.entity_id,
                        subscriber_id=mention_id,
                    )
                )

        return bulk_subscribers

    # ==================== Mention Processing ====================

    def process_entity_mentions(self) -> Dict[str, Dict[str, Any]]:
        """
        Process mentions for issue-specific fields (description and comments).
        Calls base class process_mentions() with field values.
        """
        results = {}

        # 1. Process description mentions (JSON format)
        if self.context.current_instance and self.context.requested_data:
            current_instance = json.loads(self.context.current_instance)
            requested_data = json.loads(self.context.requested_data)

            description_mentions = self.process_mentions(
                old_value=current_instance.get("description_html"),
                new_value=requested_data.get("description_html"),
                filter_to_active=True,
            )

            # Get all current mentions for subscriber creation
            current_mentions = self.extract_mentions(current_instance.get("description_html"))

            results["description"] = {
                "new_mentions": description_mentions.new_mentions,
                "removed_mentions": description_mentions.removed_mentions,
                "all_mentions": current_mentions,
                "notification_type": "description",
            }

        # 2. Process comment mentions (HTML format)
        comment_mentions_new = []
        comment_mentions_all = []

        for activity in self.context.activities:
            # Check if this activity has a comment
            if activity.entity_comment is not None:
                # Process mentions for this specific comment
                mention_data = self.process_mentions(
                    old_value=activity.old_value, new_value=activity.new_value, filter_to_active=True
                )

                # Collect new mentions from this comment
                comment_mentions_new.extend(mention_data.new_mentions)

                # Get all mentions from new value
                if activity.new_value:
                    all_mentions = self.extract_mentions(activity.new_value)
                    comment_mentions_all.extend(all_mentions)

        if comment_mentions_new or comment_mentions_all:
            results["comment"] = {
                "new_mentions": comment_mentions_new,
                "all_mentions": comment_mentions_all,
                "notification_type": "comment",
            }

        return results

    def update_all_mentions(self, mention_results: Dict[str, Dict[str, Any]]):
        """
        Update issue mention records.
        Only updates description mentions (comment mentions are not stored).
        """
        # Only update description mentions
        if "description" not in mention_results:
            return

        data = mention_results["description"]

        # Create new mentions
        bulk_mentions = []
        for mention_id in data.get("new_mentions", []):
            bulk_mentions.append(
                IssueMention(
                    mention_id=mention_id,
                    issue_id=self.context.entity_id,
                    project=self.project,
                    workspace_id=self.project.workspace_id,
                )
            )

        if bulk_mentions:
            IssueMention.objects.bulk_create(bulk_mentions, batch_size=100)

        # Delete removed mentions
        removed_mentions = data.get("removed_mentions", [])
        if removed_mentions:
            IssueMention.objects.filter(issue_id=self.context.entity_id, mention__in=removed_mentions).delete()

    # ==================== Email Preferences ====================

    def should_send_email(self, preference: UserNotificationPreference, activity: ActivityData) -> bool:
        """
        Determine if email should be sent based on user preferences and activity type.
        Implements issue-specific email preference logic.
        """
        # State changes
        if activity.field == "state":
            # Check if state change emails are enabled
            if preference.state_change:
                return True
            # Check if issue completion emails are enabled and issue was completed
            if (
                preference.issue_completed
                and activity.new_identifier
                and State.objects.filter(
                    project_id=self.context.project_id, pk=activity.new_identifier, group="completed"
                ).exists()
            ):
                return True
            return False

        # Comments
        elif activity.field == "comment":
            return preference.comment

        # Page links
        elif activity.field == "page":
            return True

        # All other property changes
        elif preference.property_change:
            return True

        return False

    # ==================== Notification Data Building ====================

    def build_notification_data(self, activity: ActivityData) -> Dict[str, Any]:
        """Build notification data with issue comment if available"""
        data = super().build_notification_data(activity)

        # Add comment content if available
        if activity.entity_comment:
            issue_comment = IssueComment.objects.filter(
                id=activity.entity_comment,
                issue_id=self.context.entity_id,
                project_id=self.context.project_id,
                workspace_id=self.workspace.id,
            ).first()

            if issue_comment:
                data["issue_activity"]["issue_comment"] = str(issue_comment.comment_stripped)
            else:
                data["issue_activity"]["issue_comment"] = ""

        return data

    def build_email_data(self, activity: ActivityData, field_override: Optional[str] = None) -> Dict[str, Any]:
        """Build email data with additional project and workspace info"""
        data = super().build_email_data(activity, field_override)

        # Add email-specific fields for issues
        if "issue" in data and self.project:
            data["issue"]["project_id"] = str(self.project.id)
            data["issue"]["workspace_slug"] = str(self.project.workspace.slug)

        # Add comment content if available
        if activity.entity_comment:
            issue_comment = IssueComment.objects.filter(
                id=activity.entity_comment,
                issue_id=self.context.entity_id,
                project_id=self.context.project_id,
                workspace_id=self.workspace.id,
            ).first()

            if issue_comment:
                data["issue_activity"]["issue_comment"] = str(issue_comment.comment_stripped)
            else:
                data["issue_activity"]["issue_comment"] = ""

        return data
