# Python imports
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from uuid import UUID
import json

# Module imports
from plane.db.models import Notification, EmailNotificationLog, User, UserNotificationPreference



@dataclass
class ActivityData:
    """Represents a single activity/event"""

    id: str
    verb: str
    field: str
    actor_id: str
    new_value: Any
    old_value: Any
    new_identifier: Optional[str] = None
    old_identifier: Optional[str] = None
    created_at: Optional[str] = None
    comment: Optional[str] = None
    entity_comment: Optional[str] = None
    entity_detail: Optional[Dict] = None

    @classmethod
    def from_dict(cls, data: Dict) -> "ActivityData":
        """Create ActivityData from dictionary"""
        return cls(
            id=data.get("id"),
            verb=data.get("verb"),
            field=data.get("field"),
            actor_id=data.get("actor_id"),
            new_value=data.get("new_value"),
            old_value=data.get("old_value"),
            new_identifier=data.get("new_identifier"),
            old_identifier=data.get("old_identifier"),
            created_at=data.get("created_at"),
            comment=data.get("comment"),
            entity_comment=data.get("entity_comment"),
            entity_detail=data.get("entity_detail"),
        )


@dataclass
class NotificationContext:
    """Context data for notification processing"""

    entity_id: str
    project_id: Optional[str]
    workspace_id: str
    actor_id: str
    activities: List[ActivityData]
    requested_data: Optional[str] = None
    current_instance: Optional[str] = None
    subscriber: bool = False
    notification_type: str = ""


@dataclass
class NotificationPayload:
    """Container for processed notification data"""

    in_app_notifications: List[Notification] = field(default_factory=list)
    email_logs: List[EmailNotificationLog] = field(default_factory=list)
    push_notifications: List[Dict[str, Any]] = field(default_factory=list)
    entity_data: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MentionData:
    """Data related to mentions in entity"""

    new_mentions: List[str] = field(default_factory=list)
    removed_mentions: List[str] = field(default_factory=list)


@dataclass
class SubscriberData:
    """Data related to entity subscribers"""

    subscribers: List[UUID] = field(default_factory=list)


class BaseNotificationHandler(ABC):
    """
    Abstract base class for entity-specific notification handlers.
    Each entity type (Issue) should implement this.
    """

    # Entity-specific configurations (must be overridden)
    ENTITY_NAME: str = "entity"
    ENTITY_MODEL = None
    SUBSCRIBER_MODEL = None
    MENTION_MODEL = None
    ACTIVITY_MODEL = None

    @classmethod
    def normalize_activity_data(cls, activity_dict: Dict) -> Dict:
        """
        Normalize entity-specific activity keys to generic keys.
        Subclasses should override this to map their specific keys.

        Default implementation does nothing (assumes already normalized).
        """
        return activity_dict

    @classmethod
    def parse_activities(cls, activities_data: str) -> List[ActivityData]:
        """
        Parse and normalize activities from JSON string.
        Uses the subclass's normalize_activity_data method.
        """
        parsed_activities = json.loads(activities_data)
        normalized = [cls.normalize_activity_data(a) for a in parsed_activities]
        return [ActivityData.from_dict(a) for a in normalized]

    # Notification filters (can be overridden)
    EXCLUDED_ACTIVITY_TYPES: List[str] = []

    def __init__(self, context: NotificationContext):
        """Initialize the notification handler"""
        self.context = context
        self.entity = None
        self.project = None
        self.workspace = None
        self.active_members = []
        self.actor = None
        self.payload = NotificationPayload()

    def process(self) -> NotificationPayload:
        """
        Main entry point to process notifications for an entity.
        Orchestrates the entire notification flow.
        """
        # 1. Load entity and related data
        self.load_entity()
        self.load_project()
        self.load_workspace()
        self.load_actor()
        self.active_members = self.get_active_members()

        # 2. Filter activities that should trigger notifications
        if self.should_skip_notification():
            return self.payload

        # 3. Process mentions - subclasses provide the specific field values
        mention_results = self.process_entity_mentions()

        # 4. Create subscribers from mentions
        all_mention_subscribers = []
        for mention_type, mention_data in mention_results.items():
            subscribers = self.create_subscribers(mention_data.get("all_mentions", []))
            all_mention_subscribers.extend(subscribers)
            mention_data["subscribers"] = subscribers

        # 5. Bulk create all mention subscribers
        if all_mention_subscribers and self.SUBSCRIBER_MODEL:
            self.SUBSCRIBER_MODEL.objects.bulk_create(all_mention_subscribers, batch_size=100, ignore_conflicts=True)

        # 6. Update mention records (for description mentions, not comments)
        self.update_all_mentions(mention_results)

        # 7. Handle subscriber opt-in if requested
        if self.context.subscriber:
            self.add_actor_as_subscriber()

        # 8. Get all subscribers (excluding mentioned users to avoid duplicate notifications)
        all_new_mentions = []
        for mention_data in mention_results.values():
            all_new_mentions.extend(mention_data.get("new_mentions", []))

        excluded_users = all_new_mentions + [self.context.actor_id]
        subscriber_data = self.get_subscribers(excluded_users)

        # 9. Create notifications for subscribers
        self.create_subscriber_notifications(subscriber_data)

        # 10. Create mention notifications
        self.create_all_mention_notifications(mention_results)

        # 11. Persist all notifications
        self.save_notifications()

        return self.payload

    # ==================== Abstract Methods (Must Implement) ====================

    @abstractmethod
    def load_entity(self):
        """Load the main entity (issue, initiative, teamspace, etc.)"""
        pass

    @abstractmethod
    def get_entity_display_name(self) -> str:
        """Get display name for the entity"""
        pass

    @abstractmethod
    def get_active_members(self) -> List[UUID]:
        """Get list of active members who can receive notifications"""
        pass

    @abstractmethod
    def get_subscribers(self, exclude_users: List[str]) -> SubscriberData:
        """Get subscribers for this entity"""
        pass

    @abstractmethod
    def create_subscribers(self, mentions: List[str]) -> List:
        """Create new subscribers for mentions"""
        pass

    @abstractmethod
    def process_entity_mentions(self) -> Dict[str, Dict[str, Any]]:
        """
        Process mentions for entity-specific fields.
        Subclasses call self.process_mentions() with appropriate field values.

        Returns:
            Dict mapping mention types to their data:
            {
                'description': {
                    'new_mentions': [...],
                    'removed_mentions': [...],
                    'all_mentions': [...]
                },
                'comment': {
                    'new_mentions': [...],
                    'all_mentions': [...]
                }
            }
        """
        pass

    @abstractmethod
    def update_all_mentions(self, mention_results: Dict[str, Dict[str, Any]]):
        """Update mention records for this entity (usually only description mentions)"""
        pass

    @abstractmethod
    def should_send_email(self, preference: UserNotificationPreference, activity: ActivityData) -> bool:
        """Determine if email should be sent for this activity"""
        pass

    # ==================== Entity Loading Methods ====================

    def load_project(self):
        """Load project (can be overridden for project-less entities)"""
        from plane.db.models import Project

        if self.context.project_id:
            self.project = Project.objects.get(pk=self.context.project_id)

    def load_workspace(self):
        """Load workspace"""
        from plane.db.models import Workspace

        self.workspace = self.project.workspace if self.project else None
        if not self.workspace:
            from plane.db.models import Workspace

            self.workspace = Workspace.objects.get(pk=self.context.workspace_id)

    def load_actor(self):
        """Load the user who triggered the activity"""
        self.actor = User.objects.get(pk=self.context.actor_id)

    # ==================== Mention Processing Methods ====================

    def extract_mentions(self, content: str) -> List[str]:
        """
        Extract mentions from HTML content.
        """
        try:
            from bs4 import BeautifulSoup

            # Extract mentions from HTML
            soup = BeautifulSoup(content, "html.parser")
            mention_tags = soup.find_all("mention-component", attrs={"entity_name": "user_mention"})

            mentions = [
                mention_tag["entity_identifier"] for mention_tag in mention_tags if mention_tag.get("entity_identifier")
            ]

            return list(set(mentions))
        except Exception:
            return []

    def process_mentions(
        self, old_value: Optional[str] = None, new_value: Optional[str] = None, filter_to_active: bool = True
    ) -> MentionData:
        """
        Generic mention processing that works for any field.
        Subclasses call this method with their specific field values.

        Args:
            old_value: Old content to extract mentions from
            new_value: New content to extract mentions from
            filter_to_active: Whether to filter mentions to active members only

        Returns:
            MentionData with new and removed mentions
        """
        if not old_value and not new_value:
            return MentionData()

        # Extract mentions from both versions
        mentions_older = self.extract_mentions(old_value) if old_value else []
        mentions_newer = self.extract_mentions(new_value) if new_value else []

        # Calculate differences
        new_mentions = [m for m in mentions_newer if m not in mentions_older]
        removed_mentions = [m for m in mentions_older if m not in mentions_newer]

        # Filter to active members if requested
        if filter_to_active and self.active_members:
            active_member_ids = {str(m) for m in self.active_members}
            new_mentions = [m for m in new_mentions if m in active_member_ids]

        return MentionData(
            new_mentions=new_mentions,
            removed_mentions=removed_mentions,
        )

    # ==================== Notification Creation Methods ====================

    def create_subscriber_notifications(self, subscriber_data: SubscriberData):
        """Create notifications for all subscribers"""
        for subscriber_id in subscriber_data.subscribers:
            # Get user preferences
            try:
                preference = UserNotificationPreference.objects.get(user_id=subscriber_id)
            except UserNotificationPreference.DoesNotExist:
                continue

            # Determine sender type based on relationship
            sender = self.get_sender_type(subscriber_id, subscriber_data)

            # Create notifications for each activity
            for activity in self.context.activities:
                # Skip if activity is for a different entity
                if not self.is_activity_for_this_entity(activity):
                    continue

                # Skip description updates
                if activity.field == "description":
                    continue

                # Create in-app notification
                self.create_in_app_notification(
                    receiver_id=subscriber_id, activity=activity, sender=sender, message=activity.comment
                )

                # Create email notification if preference allows
                if self.should_send_email(preference, activity):
                    self.create_email_notification(receiver_id=subscriber_id, activity=activity)

    def create_all_mention_notifications(self, mention_results: Dict[str, Dict[str, Any]]):
        """Create notifications for all mention types"""
        for mention_type, data in mention_results.items():
            new_mentions = data.get("new_mentions", [])
            notification_type = data.get("notification_type", mention_type)

            for mention_id in new_mentions:
                # Skip self-mentions
                if mention_id == self.context.actor_id:
                    continue

                # Get user preferences
                try:
                    preference = UserNotificationPreference.objects.get(user_id=mention_id)
                except UserNotificationPreference.DoesNotExist:
                    continue

                # Create notification message
                entity_name = self.get_entity_display_name()
                if notification_type == "comment":
                    message = (
                        f"{self.actor.display_name} has mentioned you in a comment in {self.ENTITY_NAME} {entity_name}"
                    )
                else:
                    message = f"You have been mentioned in the {self.ENTITY_NAME} {entity_name}"

                # Create notifications for each activity
                for activity in self.context.activities:
                    # Create in-app notification
                    self.create_in_app_notification(
                        receiver_id=mention_id,
                        activity=activity,
                        sender=f"in_app:{self.ENTITY_NAME}_activities:mentioned",
                        message=message,
                    )

                    # Create email notification if preference allows
                    if preference.mention:
                        self.create_email_notification(
                            receiver_id=mention_id, activity=activity, field_override="mention"
                        )

    def create_in_app_notification(
        self, receiver_id: str, activity: ActivityData, sender: str, message: Optional[str] = None
    ):
        """Create an in-app notification"""
        notification = Notification(
            workspace=self.workspace,
            sender=sender,
            triggered_by_id=self.context.actor_id,
            receiver_id=receiver_id,
            entity_identifier=self.context.entity_id,
            entity_name=self.get_entity_type(),
            project=self.project,
            title=message or activity.comment,
            data=self.build_notification_data(activity),
        )
        self.payload.in_app_notifications.append(notification)

    def create_email_notification(self, receiver_id: str, activity: ActivityData, field_override: Optional[str] = None):
        """Create an email notification log"""
        email_log = EmailNotificationLog(
            triggered_by_id=self.context.actor_id,
            receiver_id=receiver_id,
            entity_identifier=self.context.entity_id,
            entity_name=self.get_entity_type(),
            data=self.build_email_data(activity, field_override),
        )
        self.payload.email_logs.append(email_log)

    # ==================== Notification Data Builders ====================

    def build_notification_data(self, activity: ActivityData) -> Dict[str, Any]:
        """Build notification data dictionary (can be overridden for entity-specific data)"""
        return {
            self.ENTITY_NAME: self.get_entity_data(),
            f"{self.ENTITY_NAME}_activity": {
                "id": str(activity.id),
                "verb": str(activity.verb),
                "field": str(activity.field),
                "actor": str(activity.actor_id),
                "new_value": str(activity.new_value),
                "old_value": str(activity.old_value),
                "old_identifier": str(activity.old_identifier) if activity.old_identifier else None,
                "new_identifier": str(activity.new_identifier) if activity.new_identifier else None,
            },
        }

    def build_email_data(self, activity: ActivityData, field_override: Optional[str] = None) -> Dict[str, Any]:
        """Build email notification data dictionary (can be overridden)"""
        data = self.build_notification_data(activity)

        # Add email-specific fields
        activity_key = f"{self.ENTITY_NAME}_activity"
        if activity_key in data:
            data[activity_key]["activity_time"] = activity.created_at

            # Override field if provided (e.g., for mention notifications)
            if field_override:
                data[activity_key]["field"] = field_override

        return data

    # ==================== Helper Methods ====================
    def get_sender_type(self, subscriber_id: UUID, subscriber_data: SubscriberData) -> str:
        """Determine sender type based on subscriber relationship"""
        # Check if subscriber is the creator
        if self.entity and hasattr(self.entity, "created_by_id"):
            if self.entity.created_by_id == subscriber_id:
                return f"in_app:{self.ENTITY_NAME}_activities:created"

        # Check if subscriber is an assignee (if entity supports assignees)
        if self.is_assignee(subscriber_id):
            # Only use "assigned" if creator is not also an assignee
            if not (
                self.entity and hasattr(self.entity, "created_by_id") and self.entity.created_by_id == subscriber_id
            ):
                return f"in_app:{self.ENTITY_NAME}_activities:assigned"

        return f"in_app:{self.ENTITY_NAME}_activities:subscribed"

    def is_assignee(self, user_id: UUID) -> bool:
        """Check if user is an assignee (can be overridden for entities without assignees)"""
        return False  # Default: no assignees

    def get_entity_type(self) -> str:
        """Get entity type string (can be overridden for special cases like epics)"""
        return self.ENTITY_NAME

    def should_skip_notification(self) -> bool:
        """Check if notification should be skipped for this activity type"""
        return self.context.notification_type in self.EXCLUDED_ACTIVITY_TYPES

    def should_send_push_notifications(self) -> bool:
        """Determine if push notifications should be sent (can be overridden)"""
        return True

    def is_activity_for_this_entity(self, activity: ActivityData) -> bool:
        """Check if activity is for this entity (for blocking/blocked_by scenarios)"""
        if activity.entity_detail:
            return activity.entity_detail.get("id") == self.context.entity_id
        return True

    def add_actor_as_subscriber(self):
        """Add the actor as a subscriber if requested"""
        if not self.SUBSCRIBER_MODEL:
            return

        try:
            subscriber_data = {"subscriber_id": self.context.actor_id}

            if self.project:
                subscriber_data["project_id"] = self.context.project_id

            subscriber_data["workspace_id"] = self.context.workspace_id
            subscriber_data[f"{self.ENTITY_NAME}_id"] = self.context.entity_id

            self.SUBSCRIBER_MODEL.objects.get_or_create(**subscriber_data)
        except Exception:
            pass

    # ==================== Persistence Methods ====================

    def save_notifications(self):
        """Persist all notifications to the database"""
        # Bulk create in-app notifications
        if self.payload.in_app_notifications:
            notifications = Notification.objects.bulk_create(self.payload.in_app_notifications, batch_size=100)
            # Update payload with saved notifications (with IDs)
            self.payload.in_app_notifications = notifications

        # Bulk create email logs
        if self.payload.email_logs:
            EmailNotificationLog.objects.bulk_create(self.payload.email_logs, batch_size=100, ignore_conflicts=True)

    # ==================== External Notification send methods ====================
    def send_email_notification(self, template_name: str, context: Dict[str, Any], receiver_data: Dict[str, Any]):
        """Send an email notification"""
        pass
