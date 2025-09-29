"""
Trigger nodes for the Plane Automation Engine.

These nodes detect database events and decide whether an automation should be triggered.
"""

from pydantic import BaseModel

from plane.automations.registry import register_node, TriggerNode


class RecordCreatedParams(BaseModel):
    """Parameters for the record_created trigger."""

    pass  # No parameters needed - model type is determined by automation scope


@register_node("record_created", "trigger", RecordCreatedParams)
class RecordCreatedTrigger(TriggerNode):
    """
    Trigger that fires when a new record is created.

    This trigger matches against events with event_type ending in '.created'
    for the model type specified by the automation's scope.
    """

    schema = RecordCreatedParams
    name = "record_created"

    def execute(self, event: dict, context: dict) -> dict:
        """
        Check if the event represents a record creation.

        Args:
            event: The database event from the outbox system
            context: Additional execution context

        Returns:
            dict: Consistent format with success/action/result
        """
        # Check if this is a creation event
        event_type = event.get("event_type", "")
        if event_type == "issue.created":
            return {
                "success": True,
                "action": "record_created",
                "result": {
                    "matched": True,
                    "event_type": event_type,
                },
            }
        else:
            return {
                "success": False,
                "action": "record_created",
                "result": {
                    "matched": False,
                    "event_type": event_type,
                    "reason": "Not a creation event",
                },
            }


class RecordUpdatedParams(BaseModel):
    """Parameters for the record_updated trigger."""

    pass  # No parameters needed - model type is determined by automation scope


@register_node("record_updated", "trigger", RecordUpdatedParams)
class RecordUpdatedTrigger(TriggerNode):
    """
    Trigger that fires when a record is updated.

    This trigger handles ONLY generic update events (*.updated) for the model type
    specified by the automation's scope. For high-value specific events,
    use specialized triggers like state_changed or assignee_changed.
    """

    schema = RecordUpdatedParams
    name = "record_updated"

    def execute(self, event: dict, context: dict) -> dict:
        """
        Check if the event represents a record update.

        Args:
            event: The database event from the outbox system
            context: Additional execution context

        Returns:
            dict: Consistent format with success/action/result
        """
        # Check if this is an update event
        event_type = event.get("event_type", "")
        if event_type == "issue.updated":
            return {
                "success": True,
                "action": "record_updated",
                "result": {
                    "matched": True,
                    "event_type": event_type,
                },
            }
        else:
            return {
                "success": False,
                "action": "record_updated",
                "result": {
                    "matched": False,
                    "event_type": event_type,
                    "reason": "Not an update event",
                },
            }


class StateChangedParams(BaseModel):
    """Parameters for the state_changed trigger."""

    pass  # No parameters needed


@register_node("state_changed", "trigger", StateChangedParams)
class StateChangedTrigger(TriggerNode):
    """
    Trigger that fires when an issue's state changes.

    This specialized trigger handles ONLY the high-value specific event
    (issue.state.updated).
    It does NOT handle generic issue.updated events to avoid duplicate triggers.

    For generic field-level updates, use the record_updated trigger instead.
    """

    schema = StateChangedParams
    name = "state_changed"

    def execute(self, event: dict, context: dict) -> dict:
        """
        Check if the event represents a state change.

        Args:
            event: The database event from the outbox system
            context: Additional execution context

        Returns:
            dict: Consistent format with success/action/result
        """
        event_type = event.get("event_type", "")

        # ONLY handle high-value specific event: issue.state.updated
        if event_type == "issue.state.updated":
            return {
                "success": True,
                "action": "state_changed",
                "result": {
                    "matched": True,
                    "event_type": event_type,
                },
            }
        else:
            return {
                "success": False,
                "action": "state_changed",
                "result": {
                    "matched": False,
                    "event_type": event_type,
                    "reason": "Not a state change event",
                },
            }


class AssigneeChangedParams(BaseModel):
    """Parameters for the assignee_changed trigger."""

    pass  # No parameters needed


@register_node("assignee_changed", "trigger", AssigneeChangedParams)
class AssigneeChangedTrigger(TriggerNode):
    """
    Trigger that fires when an issue's assignees change.

    This specialized trigger handles ONLY the high-value specific events
    (issue.assignee.added and issue.assignee.removed).
    It does NOT handle generic issue.updated events to avoid duplicate triggers.

    For generic field-level updates, use the record_updated trigger instead.
    """

    schema = AssigneeChangedParams
    name = "assignee_changed"

    def execute(self, event: dict, context: dict) -> dict:
        """
        Check if the event represents an assignee change.

        Args:
            event: The database event from the outbox system
            context: Additional execution context

        Returns:
            dict: Consistent format with success/action/result
        """
        event_type = event.get("event_type", "")

        # ONLY handle high-value specific events: issue.assignee.added/removed
        if event_type in ["issue.assignee.added", "issue.assignee.removed"]:
            return {
                "success": True,
                "action": "assignee_changed",
                "result": {
                    "matched": True,
                    "event_type": event_type,
                },
            }
        else:
            return {
                "success": False,
                "action": "assignee_changed",
                "result": {
                    "matched": False,
                    "event_type": event_type,
                    "reason": "Not an assignee change event",
                },
            }


class CommentCreatedParams(BaseModel):
    """Parameters for the comment_created trigger."""

    pass  # No specific parameters needed for basic comment detection


@register_node("comment_created", "trigger", CommentCreatedParams)
class CommentCreatedTrigger(TriggerNode):
    """
    Trigger that fires when a comment is added to an issue.

    This trigger handles ONLY the high-value specific event (issue.comment.created).
    """

    schema = CommentCreatedParams
    name = "comment_created"

    def execute(self, event: dict, context: dict) -> dict:
        """
        Check if the event represents a comment being created.

        Args:
            event: The database event from the outbox system
            context: Additional execution context

        Returns:
            dict: Consistent format with success/action/result
        """
        event_type = event.get("event_type", "")

        # Only handle issue.comment.created events
        if event_type == "issue.comment.created":
            event_data = event.get("data", {})
            comment = event_data.get("comment", {})
            return {
                "success": True,
                "action": "comment_created",
                "result": {
                    "matched": True,
                    "event_type": event_type,
                    "comment": comment,
                },
            }
        else:
            return {
                "success": False,
                "action": "comment_created",
                "result": {
                    "matched": False,
                    "event_type": event_type,
                    "reason": "Not a comment created event",
                },
            }
