# Python
from uuid import uuid4, UUID
from dataclasses import dataclass, asdict
from typing import Union, Dict, Any, Optional
from datetime import datetime
import json

# Django
from django.db import models
from django.utils import timezone


class InitiatorTypes(models.TextChoices):
    USER = "USER"
    SYSTEM_IMPORT = "SYSTEM.IMPORT"
    SYSTEM_AUTOMATION = "SYSTEM.AUTOMATION"


class Outbox(models.Model):
    # Primary identifier
    id = models.BigAutoField(primary_key=True)
    event_id = models.UUIDField(default=uuid4, editable=False, unique=True)

    # What event occurred (e.g. "issue.created", "issue.updated", "issue.deleted")
    event_type = models.CharField(max_length=255)

    # entity type -- like issue, project, etc.
    entity_type = models.CharField(max_length=255)
    # the id of the entity that was affected by the event
    entity_id = models.UUIDField()

    # The actual payload to send (JSON structure)
    payload = models.JSONField()

    # The date and time the event was processed (if it was processed)
    processed_at = models.DateTimeField(null=True, blank=True)

    # Audit fields
    created_at = models.DateTimeField(default=timezone.now)

    # The date and time the event was claimed (if it was claimed)
    claimed_at = models.DateTimeField(null=True, blank=True)

    # The workspace ID that the event belongs to
    workspace_id = models.UUIDField()
    # The project ID that the event belongs to
    project_id = models.UUIDField()

    # The user ID that the event belongs to
    initiator_id = models.UUIDField(
        help_text="The user ID who triggered the event", null=True, blank=True
    )

    # The type of initiator that triggered the event
    initiator_type = models.CharField(max_length=255, default=InitiatorTypes.USER)

    class Meta:
        db_table = "outbox"
        indexes = [
            # live queue → tiny, always‑cached
            models.Index(
                fields=["claimed_at", "processed_at", "id"],
                name="outbox_unclaimed_unprocessed",
                condition=models.Q(claimed_at__isnull=True, processed_at__isnull=True),
            ),
            # analytics dashboards
            models.Index(
                fields=["processed_at"],
                name="outbox_processed_idx",
                condition=models.Q(processed_at__isnull=False),
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"Outbox<{self.event_type}:{self.entity_type}:{self.entity_id}> {self.id}"
        )


@dataclass
class OutboxEvent:
    """
    Represents an event from the outbox table.

    This dataclass provides a type-safe representation of outbox events
    that can be used consistently across the publisher and poller components.
    """

    # Database fields
    id: int
    event_id: Union[UUID, str]
    event_type: str
    entity_type: str
    entity_id: Union[UUID, str]
    payload: Dict[str, Any]
    created_at: datetime
    workspace_id: Union[UUID, str]
    project_id: Union[UUID, str]
    initiator_id: Union[UUID, str]
    initiator_type: str

    # Optional fields
    processed_at: Optional[datetime] = None
    claimed_at: Optional[datetime] = None

    @classmethod
    def from_db_row(cls, row: tuple) -> "OutboxEvent":
        """
        Create an OutboxEvent from a database row tuple.

        Expected row format from database query:
        (id, event_id, event_type, entity_type, entity_id, payload, processed_at, created_at, claimed_at)

        Args:
            row: Tuple containing database row data

        Returns:
            OutboxEvent instance
        """
        (
            id,
            event_id,
            event_type,
            entity_type,
            entity_id,
            payload,
            processed_at,
            created_at,
            claimed_at,
            workspace_id,
            project_id,
            initiator_id,
            initiator_type,
        ) = row

        return cls(
            id=id,
            event_id=event_id,
            event_type=event_type,
            entity_type=entity_type,
            entity_id=str(entity_id),  # Convert UUID to string for consistency
            payload=payload,
            processed_at=processed_at,
            created_at=created_at,
            claimed_at=claimed_at,
            workspace_id=workspace_id,
            project_id=project_id,
            initiator_id=initiator_id,
            initiator_type=initiator_type,
        )

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "OutboxEvent":
        """
        Create an OutboxEvent from a dictionary.

        Args:
            data: Dictionary containing event data

        Returns:
            OutboxEvent instance
        """
        return cls(
            id=data["id"],
            event_id=data["event_id"],
            event_type=data["event_type"],
            entity_type=data["entity_type"],
            entity_id=str(data["entity_id"]),
            payload=data["payload"],
            processed_at=data.get("processed_at"),
            created_at=data["created_at"],
            claimed_at=data.get("claimed_at"),
            workspace_id=data["workspace_id"],
            project_id=data["project_id"],
            initiator_id=data["initiator_id"],
            initiator_type=data["initiator_type"],
        )

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the OutboxEvent to a dictionary.

        Returns:
            Dictionary representation of the event
        """
        return asdict(self)

    def to_publisher_format(self) -> Dict[str, Any]:
        """
        Convert to the format expected by the event stream publisher.

        Returns:
            Dictionary formatted for publishing
        """
        return {
            "event_id": str(self.event_id),
            "event_type": self.event_type,
            "entity_type": self.entity_type,
            "entity_id": str(self.entity_id),
            "payload": self.payload,
            "workspace_id": str(self.workspace_id),
            "project_id": str(self.project_id),
            "initiator_id": str(self.initiator_id),
            "initiator_type": self.initiator_type,
        }

    def to_json(self) -> str:
        """
        Convert the OutboxEvent to a JSON string.

        Returns:
            JSON string representation
        """

        def json_serializer(obj):
            """Custom JSON serializer for datetime and UUID objects."""
            if isinstance(obj, datetime):
                return obj.isoformat()
            elif isinstance(obj, UUID):
                return str(obj)
            raise TypeError(
                f"Object of type {type(obj).__name__} is not JSON serializable"
            )

        return json.dumps(self.to_dict(), default=json_serializer)

    def get_metadata(self) -> Dict[str, Any]:
        """
        Get metadata about this event for logging/monitoring.

        Returns:
            Dictionary containing event metadata
        """
        return {
            "source": "outbox-poller",
            "outbox_id": self.id,
            "event_id": str(self.event_id),
            "event_type": self.event_type,
            "entity_type": self.entity_type,
            "entity_id": str(self.entity_id),
            "created_at": (
                self.created_at.isoformat()
                if isinstance(self.created_at, datetime)
                else self.created_at
            ),
            "workspace_id": str(self.workspace_id),
            "project_id": str(self.project_id),
            "initiator_id": str(self.initiator_id),
            "initiator_type": self.initiator_type,
        }

    def __str__(self) -> str:
        return f"OutboxEvent<{self.event_type}:{self.entity_type}:{self.entity_id}> {self.id}"

    def __repr__(self) -> str:
        return (
            f"OutboxEvent("
            f"id={self.id}, "
            f"event_id='{self.event_id}', "
            f"event_type='{self.event_type}', "
            f"entity_type='{self.entity_type}', "
            f"entity_id='{self.entity_id}', "
            f"workspace_id='{self.workspace_id}', "
            f"project_id='{self.project_id}', "
            f"initiator_id='{self.initiator_id}', "
            f"initiator_type='{self.initiator_type}'"
            f")"
        )
