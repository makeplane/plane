"""
Action nodes for the Plane Automation Engine.

These nodes perform actions as part of automation workflows,
such as adding comments and updating issue properties.
"""

import json
import re
import uuid
import logging
from typing import Any, Dict, List, Literal
from pydantic import BaseModel, Field, field_validator

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone
from django.db.models import Q, Value
from django.contrib.postgres.fields import ArrayField
from django.db.models.fields import UUIDField
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models.functions import Coalesce


from plane.ee.models import Automation
from plane.automations.registry import register_node, ActionNode
from plane.db.models import (
    Issue,
    IssueComment,
    User,
    State,
    IssueAssignee,
    IssueLabel,
    FileAsset,
)
from plane.bgtasks.copy_s3_object import copy_assets, sync_with_external_service
from plane.bgtasks.issue_activities_task import issue_activity
from plane.app.serializers import IssueSerializer, IssueCommentSerializer
from plane.utils.exception_logger import log_exception


class AddCommentParams(BaseModel):
    """Parameters for the add_comment action."""

    comment_text: str = Field(
        ...,
        description=(
            "Comment text to add (supports template variables like {{payload.data.priority}})"
        ),
        examples=[
            "Issue priority changed to {{payload.data.priority}}",
            "Issue assigned to user ID: {{payload.data.assignee_ids.0}}",
            (
                "State changed from {{payload.previous_attributes.state_id}} "
                "to {{payload.data.state_id}}"
            ),
        ],
    )


@register_node("add_comment", "action", AddCommentParams)
class AddCommentAction(ActionNode):
    """
    Action that adds a comment to an issue.

    Supports template variables in the comment text for dynamic content.
    Template variables use {{variable}} syntax and can access event data.

    Example template variables:
    - {{payload.data.priority}} - Issue priority
    - {{payload.data.state_id}} - State ID
    - {{payload.data.assignee_ids.0}} - First assignee ID
    - {{event_type}} - Type of event that triggered the automation

    The comment will be created as if posted by the automation system.
    """

    schema = AddCommentParams
    name = "add_comment"

    def get_field_value(self, event: dict, field_path: str) -> Any:
        """Extract a field value from the event data using dot notation."""
        if not field_path:
            return event

        current = event
        parts = field_path.split(".")

        for i, part in enumerate(parts):
            if current is None:
                return None

            try:
                if isinstance(current, dict):
                    current = current.get(part)
                elif isinstance(current, list) and part.isdigit():
                    idx = int(part)
                    if 0 <= idx < len(current):
                        current = current[idx]
                    else:
                        return None  # Index out of bounds
                else:
                    # Current value is neither dict nor list, can't traverse further
                    return None

            except (ValueError, TypeError) as e:
                # Only catch specific errors we expect (like int conversion)
                # logger.warning(
                #     f"Error processing field path '{field_path}' at part '{part}': {e}"
                # )
                return None

        return current

    def render_template(self, template: str, event: dict, context: dict) -> str:
        """Render a template string with variable substitution."""
        if not template:
            return ""

        pattern = r"\{\{([^}]+)\}\}"
        matches = re.findall(pattern, template)

        rendered = template
        for match in matches:
            variable_path = match.strip()

            if variable_path.startswith("context."):
                value = self.get_field_value(context, variable_path[8:])
            elif variable_path.startswith("event."):
                value = self.get_field_value(event, variable_path[6:])
            else:
                value = self.get_field_value(event, variable_path)

            if value is None:
                value = ""
            elif isinstance(value, (dict, list)):
                value = json.dumps(value)
            else:
                value = str(value)

            rendered = rendered.replace(f"{{{{{match}}}}}", value)

        return rendered

    def execute(self, event: dict, context: dict) -> Dict[str, Any]:
        """Add a comment to the issue from the event."""
        try:
            # Extract issue ID from event
            issue_id = self.get_field_value(event, "entity_id")
            if not issue_id:
                return {
                    "success": False,
                    "error": "No entity_id found in event data",
                    "action": "add_comment",
                }

            # Get the issue
            try:
                issue = Issue.issue_objects.get(id=issue_id)
            except Issue.DoesNotExist:
                return {
                    "success": False,
                    "error": f"Issue with ID {issue_id} not found",
                    "action": "add_comment",
                }

            # Render the comment template
            rendered_comment = self.render_template(
                self.params.comment_text, event, context
            )

            if not rendered_comment.strip():
                return {
                    "success": False,
                    "error": "Rendered comment is empty",
                    "action": "add_comment",
                }

            # Get or create automation system user
            automation_user_id = self._get_automation_user(context)

            # call the live server to get the new assets for the comment
            # get the assets for the comment from file asset model
            # assets = self._get_assets_for_comment(issue, context, automation_user_id)

            # copy the assets in the s3

            # Create the comment (automation comments are always internal)
            comment = IssueComment.objects.create(
                issue=issue,
                project=issue.project,
                workspace=issue.workspace,
                comment_html=f"<p>{rendered_comment}</p>",
                comment_stripped=rendered_comment,
                actor_id=automation_user_id,
                created_by_id=automation_user_id,
                access="INTERNAL",
            )
            requested_data = IssueCommentSerializer(comment).data

            issue_activity.delay(
                type="comment.activity.created",
                requested_data=json.dumps(requested_data, cls=DjangoJSONEncoder),
                actor_id=str(automation_user_id),
                issue_id=str(issue_id),
                project_id=str(issue.project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=None,
            )

            return {
                "success": True,
                "action": "add_comment",
                "result": {
                    "comment_id": str(comment.id),
                    "comment_text": rendered_comment,
                },
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to add comment: {str(e)}",
                "action": "add_comment",
            }

    def _get_assets_for_comment(
        self, issue: Issue, context: dict, automation_user_id: str
    ) -> None:
        """
        Step 1: Extract asset ids from the FileAsset model
        Step 2: Duplicate the assets
        Step 3: Update the FileAsset model with the new asset ids (change the src of img tag)
        Step 4: Request the live server to generate the description_binary and description for the entity

        """
        try:
            file_assets = FileAsset.objects.filter(
                issue_id=issue.id,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                entity_type="automation_comment",
                entity_id=str(context.get("automation_id")),
            ).values_list("asset_id", flat=True)

            duplicated_assets = copy_assets(
                entity_name="automation_comment",
                entity_identifier=str(context.get("automation_id")),
                project_id=issue.project_id,
                slug=issue.workspace.slug,
                user_id=str(automation_user_id),
            )

            if duplicated_assets:
                external_data = sync_with_external_service(
                    "automation_comment", duplicated_assets
                )

                return {
                    "comment_html": external_data.get("comment_html"),
                    "comment_json": external_data.get("comment_json"),
                }

            return
        except Exception as e:
            log_exception(e)
            return []

    def _get_automation_user(self, context: dict) -> User:
        """Get system user for automation actions."""
        return Automation.objects.get(id=context.get("automation_id")).bot_user_id


class ChangePropertyParams(BaseModel):
    """Parameters for the change_property action."""

    change_type: Literal["add", "remove", "update"] = Field(
        ...,
        description="Type of change operation to perform",
        examples=["add", "remove", "update"],
    )

    property_name: str = Field(
        ...,
        description="Name of the property to change",
        examples=[
            "priority",
            "state",
            "assignee_ids",
            "label_ids",
            "start_date",
            "target_date",
        ],
    )

    property_value: List[Any] = Field(
        ...,
        description="Array of values for the property (supports template variables)",
        examples=[
            ["urgent"],  # Set priority to urgent
            ["state-uuid-123"],  # Set to specific state
            ["2024-12-31"],  # Set target date
            ["value1", "value2"],  # Multiple values
        ],
    )

    @field_validator("property_name")
    def validate_property_name(cls, v):
        """Validate that property name is safe to update."""
        allowed_properties = {
            "priority",
            "start_date",
            "target_date",
            "state_id",
            "assignee_ids",
            "label_ids",
        }

        if v not in allowed_properties:
            raise ValueError(
                f"Property '{v}' is not allowed. "
                f"Allowed properties: {allowed_properties}"
            )
        return v


@register_node("change_property", "action", ChangePropertyParams)
class ChangePropertyAction(ActionNode):
    """
    Action that changes workflow properties on an issue.

    Supports add, remove, and update operations with template variables
    in property values for dynamic content. Each property type has custom
    logic for handling different change operations.

    Allowed properties:
    - priority: Issue priority (urgent/high/medium/low/none)
    - state: Issue state (supports state transitions)
    - assignee_ids: Issue assignee IDs (supports multiple users)
    - label_ids: Issue label IDs (supports multiple labels)
    - start_date: Issue start date (YYYY-MM-DD)
    - target_date: Issue target date (YYYY-MM-DD)

    Change types:
    - add: Add values to multi-value properties (assignee_ids, label_ids)
    - remove: Remove values from properties
    - update: Replace/set property values
    """

    schema = ChangePropertyParams
    name = "change_property"

    def get_field_value(self, event: dict, field_path: str) -> Any:
        """Extract a field value from the event data using dot notation."""
        try:
            current = event
            for part in field_path.split("."):
                if isinstance(current, dict):
                    current = current.get(part)
                elif isinstance(current, list) and part.isdigit():
                    idx = int(part)
                    current = current[idx] if 0 <= idx < len(current) else None
                else:
                    return None
            return current
        except (AttributeError, KeyError, TypeError, IndexError, ValueError):
            return None

    def render_template(self, template: str, event: dict, context: dict) -> str:
        """Render a template string with variable substitution."""
        if not template:
            return ""

        pattern = r"\{\{([^}]+)\}\}"
        matches = re.findall(pattern, template)

        rendered = template
        for match in matches:
            variable_path = match.strip()

            if variable_path.startswith("context."):
                value = self.get_field_value(context, variable_path[8:])
            elif variable_path.startswith("event."):
                value = self.get_field_value(event, variable_path[6:])
            else:
                value = self.get_field_value(event, variable_path)

            if value is None:
                value = ""
            elif isinstance(value, (dict, list)):
                value = json.dumps(value)
            else:
                value = str(value)

            rendered = rendered.replace(f"{{{{{match}}}}}", value)

        return rendered

    def _handle_priority_property(
        self, issue: Issue, change_type: str, values: List[Any]
    ) -> Any:
        """Handle priority property changes."""
        valid_priorities = ["urgent", "high", "medium", "low", "none"]

        if change_type in ["update", "add"]:
            if not values:
                raise ValueError("Priority value is required")

            new_priority = str(values[0]) if values[0] is not None else None
            if new_priority and new_priority not in valid_priorities:
                raise ValueError(
                    f"Invalid priority '{new_priority}'. "
                    f"Must be one of: {valid_priorities}"
                )
            return new_priority

        elif change_type == "remove":
            return None

        return issue.priority

    def _handle_state_property(
        self, issue: Issue, change_type: str, values: List[Any]
    ) -> Any:
        """Handle state property changes."""
        if change_type in ["update", "add"]:
            if not values:
                raise ValueError("State value is required")

            state_value = str(values[0]) if values[0] is not None else None
            if not state_value:
                raise ValueError("State value cannot be empty")

            uuid.UUID(state_value)

            state = State.objects.filter(
                id=state_value,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
            ).first()

            if state:
                return state
            else:
                raise ValueError(f"State with ID '{state_value}' not found in project")

        elif change_type == "remove":
            raise ValueError("Cannot remove state from issue - state is required")

        return issue.state

    def _handle_assignees_property(
        self, issue: Issue, change_type: str, values: List[Any]
    ) -> Any:
        """Handle assignees property changes."""
        current_assignees = [
            str(a) for a in issue.assignees.values_list("id", flat=True)
        ]
        current_set = set(current_assignees)
        provided_set = {str(v) for v in values if v is not None}

        if change_type == "add":
            assignee_ids_to_add = list(provided_set - current_set)
            assignee_ids_to_remove = []
        elif change_type == "remove":
            assignee_ids_to_add = []
            assignee_ids_to_remove = list(provided_set & current_set)

        return {
            "assignee_ids_to_add": assignee_ids_to_add,
            "assignee_ids_to_remove": assignee_ids_to_remove,
        }

    def _handle_labels_property(
        self, issue: Issue, change_type: str, values: List[Any]
    ) -> Any:
        """Handle labels property changes."""
        current_labels = list(issue.labels.values_list("id", flat=True))

        if change_type == "add":
            # Add new labels to existing ones
            new_labels = [str(v) for v in values if v is not None]
            combined_labels = list(set(current_labels + new_labels))
            return combined_labels

        elif change_type == "remove":
            # Remove specified labels
            labels_to_remove = [str(v) for v in values if v is not None]
            remaining_labels = [
                label for label in current_labels if str(label) not in labels_to_remove
            ]
            return remaining_labels

        elif change_type == "update":
            # Replace all labels
            new_labels = [str(v) for v in values if v is not None]
            return new_labels

        return current_labels

    def _handle_date_property(
        self, issue: Issue, change_type: str, values: List[Any], property_name: str
    ) -> Any:
        """Handle date property changes (start_date, due_date)."""
        if change_type in ["update", "add"]:
            if not values:
                return None

            date_value = values[0]
            if date_value is None:
                return None

            if isinstance(date_value, str):
                try:
                    from datetime import datetime

                    if len(date_value) == 10:  # YYYY-MM-DD
                        parsed_date = datetime.strptime(date_value, "%Y-%m-%d").date()
                        return parsed_date
                    else:  # ISO datetime
                        parsed_date = datetime.fromisoformat(
                            date_value.replace("Z", "+00:00")
                        ).date()
                        return parsed_date
                except ValueError as e:
                    raise ValueError(
                        f"Invalid date format '{date_value}'. "
                        "Use YYYY-MM-DD or ISO datetime"
                    )
            else:
                logging.info(
                    f"Date value is not string, returning as-is: {date_value} (type: {type(date_value)})"
                )

            return date_value

        elif change_type == "remove":
            return None

        return getattr(issue, property_name, None)

    def _get_issue_queryset(self, using: str = "default"):
        """Base queryset with relations and annotations needed for serialization.

        Note: We default to the write DB alias ('default') so that instances fetched
        from this queryset will save back to the primary, avoiding read-replica issues.
        """
        issue_queryset = (
            Issue.objects.using(using)
            .select_related("state", "project", "workspace")
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(
                            ~Q(labels__id__isnull=True)
                            & Q(label_issue__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=Q(
                            ~Q(assignees__id__isnull=True)
                            & Q(assignees__member_project__is_active=True)
                            & Q(issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
        )
        return issue_queryset

    def execute(self, event: dict, context: dict) -> Dict[str, Any]:
        """Change a property on the issue from the event."""
        try:
            # Extract issue ID from event
            issue_id = self.get_field_value(event, "entity_id")
            if not issue_id:
                return {
                    "success": False,
                    "error": "No entity_id found in event data",
                    "action": "change_property",
                }

            # Get the issue
            try:
                # Use different query strategies based on property type
                property_name = self.params.property_name

                # For relational fields, we need the annotated query to get current IDs
                issue = self._get_issue_queryset().filter(id=issue_id).first()

                current_instance = IssueSerializer(issue).data
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Failed to fetch issue: {str(e)}",
                    "action": "change_property",
                }

            automation_bot_user_id = Automation.objects.get(
                id=context.get("automation_id")
            ).bot_user_id
            issue.updated_by_id = automation_bot_user_id

            # Render property values if they contain templates
            rendered_values = []
            for value in self.params.property_value:
                if isinstance(value, str):
                    rendered_value = self.render_template(value, event, context)
                    rendered_values.append(rendered_value)
                else:
                    rendered_values.append(value)

            # Get current value for comparison
            if property_name in ["assignee_ids", "label_ids"]:
                # For relational fields, get the current IDs
                if property_name == "assignee_ids":
                    old_value = list(issue.assignees.values_list("id", flat=True))
                elif property_name == "label_ids":
                    old_value = list(issue.labels.values_list("id", flat=True))
            elif property_name == "state_id":
                # For state, return the ID for comparison
                old_value = str(issue.state_id) if issue.state_id else None
            else:
                old_value = getattr(issue, property_name, None)

            # Dispatch to appropriate property handler
            if property_name == "priority":
                new_value = self._handle_priority_property(
                    issue, self.params.change_type, rendered_values
                )
                issue.priority = new_value
                update_fields = ["priority", "updated_at"]

            elif property_name == "state_id":
                new_state = self._handle_state_property(
                    issue, self.params.change_type, rendered_values
                )
                # Set the state object, not just the ID
                issue.state = new_state
                new_value = str(new_state.id) if new_state else None
                update_fields = ["state_id", "updated_at"]

            elif property_name == "assignee_ids":
                changes = self._handle_assignees_property(
                    issue, self.params.change_type, rendered_values
                )
                assignees_to_add = set(changes.get("assignee_ids_to_add", []))
                assignees_to_remove = set(changes.get("assignee_ids_to_remove", []))
                current_assignees_set = {str(a) for a in (old_value or [])}

                if assignees_to_remove:
                    IssueAssignee.objects.using("default").filter(
                        issue=issue, assignee_id__in=list(assignees_to_remove)
                    ).delete()

                if assignees_to_add:
                    IssueAssignee.objects.bulk_create(
                        [
                            IssueAssignee(
                                assignee_id=assignee_id,
                                issue=issue,
                                project_id=issue.project_id,
                                workspace_id=issue.workspace_id,
                                created_by_id=automation_bot_user_id,
                                updated_by_id=automation_bot_user_id,
                            )
                            for assignee_id in assignees_to_add
                        ],
                        batch_size=10,
                        ignore_conflicts=True,
                    )

                final_assignees = list(
                    (current_assignees_set - assignees_to_remove) | assignees_to_add
                )

                old_value = str(old_value) if old_value else None
                new_value = str(final_assignees) if final_assignees else None
                update_fields = ["updated_at"]

            elif property_name == "label_ids":
                new_label_ids = self._handle_labels_property(
                    issue, self.params.change_type, rendered_values
                )

                current_label_ids_set = {str(l) for l in (old_value or [])}
                desired_label_ids_set = {str(l) for l in (new_label_ids or [])}

                labels_to_remove = list(current_label_ids_set - desired_label_ids_set)
                labels_to_add = list(desired_label_ids_set - current_label_ids_set)

                if labels_to_remove:
                    IssueLabel.objects.using("default").filter(
                        issue=issue, label_id__in=labels_to_remove
                    ).delete()

                if labels_to_add:
                    IssueLabel.objects.bulk_create(
                        [
                            IssueLabel(
                                label_id=label_id,
                                issue=issue,
                                project_id=issue.project_id,
                                workspace_id=issue.workspace_id,
                                created_by_id=automation_bot_user_id,
                                updated_by_id=automation_bot_user_id,
                            )
                            for label_id in labels_to_add
                        ],
                        batch_size=10,
                        ignore_conflicts=True,
                    )

                old_value = str(old_value) if old_value else None
                new_value = (
                    str(list(desired_label_ids_set)) if desired_label_ids_set else None
                )
                update_fields = ["updated_at"]

            elif property_name == "start_date":
                new_value = self._handle_date_property(
                    issue, self.params.change_type, rendered_values, property_name
                )
                issue.start_date = new_value
                old_value = str(old_value) if old_value else None
                new_value = str(new_value) if new_value else None
                update_fields = ["start_date", "updated_at"]

            elif property_name == "target_date":
                new_value = self._handle_date_property(
                    issue, self.params.change_type, rendered_values, property_name
                )
                issue.target_date = new_value
                old_value = str(old_value) if old_value else None
                new_value = str(new_value) if new_value else None
                update_fields = ["target_date", "updated_at"]

            else:
                return {
                    "success": False,
                    "error": f"Unsupported property: {property_name}",
                    "action": "change_property",
                }

            update_fields.append("updated_by_id")

            issue.save(update_fields=update_fields)

            # Re-fetch the issue with the same annotated queryset to get updated values
            updated_issue = self._get_issue_queryset().filter(id=issue_id).first()

            requested_data = IssueSerializer(updated_issue).data

            # Get the automation ID from context and fetch the bot user
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps(requested_data, cls=DjangoJSONEncoder),
                actor_id=str(automation_bot_user_id),
                issue_id=str(issue.id),
                project_id=str(issue.project_id),
                current_instance=json.dumps(current_instance, cls=DjangoJSONEncoder),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=None,
            )

            return {
                "success": True,
                "action": "change_property",
                "result": {
                    "property_name": property_name,
                    "change_type": self.params.change_type,
                    "old_value": old_value,
                    "new_value": new_value,
                    "issue_id": str(issue.id),
                },
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to change property: {str(e)}",
                "action": "change_property",
            }
