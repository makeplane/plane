"""
Condition nodes for the Plane Automation Engine.

These nodes evaluate conditions and return consistent success/failure format.
- success: true = condition passed, continue to next node
- success: false = condition failed, stop automation execution
"""

import json
import re
from typing import Any, Dict
from datetime import datetime, date
from pydantic import BaseModel, Field, validator

from plane.automations.registry import register_node, BaseAutomationNode
from plane.db.models.issue import IssueAssignee, IssueLabel


class ConditionNode(BaseAutomationNode):
    """Base class for condition nodes with consistent return format."""

    node_type: str = "condition"

    def get_field_value(self, event: dict, field_path: str) -> Any:
        """Extract a field value from event data using dot notation."""
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
            # Hydrate related arrays if missing in payload (e.g., on issue.created)
            if current in (None, []) and field_path in [
                "payload.data.assignee_ids",
                "payload.data.label_ids",
            ]:
                hydrated = self._hydrate_related_ids(event, field_path)
                return hydrated if hydrated is not None else current
            return current
        except (AttributeError, KeyError, TypeError, IndexError, ValueError):
            return None

    def _hydrate_related_ids(self, event: dict, field_path: str) -> Any:
        """Fetch related IDs from DB when not present in payload."""
        try:
            issue_id = event.get("entity_id") or (
                event.get("payload", {}).get("data", {}).get("id")
            )
            if not issue_id:
                return None

            if field_path == "payload.data.assignee_ids":
                ids = list(
                    IssueAssignee.objects.filter(
                        issue_id=issue_id, deleted_at__isnull=True
                    ).values_list("assignee_id", flat=True)
                )
                result = [str(x) for x in ids]
                # Persist into event to avoid repeated queries
                event.setdefault("payload", {}).setdefault("data", {})[
                    "assignee_ids"
                ] = result
                return result

            if field_path == "payload.data.label_ids":
                ids = list(
                    IssueLabel.objects.filter(
                        issue_id=issue_id, deleted_at__isnull=True
                    ).values_list("label_id", flat=True)
                )
                result = [str(x) for x in ids]
                # Persist into event to avoid repeated queries
                event.setdefault("payload", {}).setdefault("data", {})[
                    "label_ids"
                ] = result
                return result

            return None
        except Exception:
            return None


class JSONFilterParams(BaseModel):
    """Parameters for JSON filter condition."""

    filter_expression: Dict[str, Any] = Field(
        ...,
        description="JSON filter expression with and/or/not logic",
        examples=[
            {
                "field": "payload.data.priority",
                "operator": "is",
                "value": ["urgent"],
            },
            {
                "and": [
                    {
                        "field": "payload.data.priority",
                        "operator": "is",
                        "value": ["high"],
                    },
                    {
                        "not": {
                            "field": "payload.data.state_id",
                            "operator": "is",
                            "value": ["3cefb6a8-729e-48aa-8cdd-3bd88f3e8a3e"],
                        }
                    },
                ]
            },
        ],
    )

    @validator("filter_expression")
    def validate_filter_expression(cls, v):
        """Validate the structure of the filter expression."""

        def validate_node(node):
            if not isinstance(node, dict):
                raise ValueError("Filter node must be a dictionary")

            # Logical operators
            if "and" in node:
                # Allow empty arrays for AND (vacuously true); just ensure it's a list
                if not isinstance(node["and"], list):
                    raise ValueError("'and' operator must be a list")
                for condition in node["and"]:
                    validate_node(condition)
            elif "or" in node:
                # Allow empty arrays for OR (evaluates to false); just ensure it's a list
                if not isinstance(node["or"], list):
                    raise ValueError("'or' operator must be a list")
                for condition in node["or"]:
                    validate_node(condition)
            elif "not" in node:
                not_node = node["not"]
                if isinstance(not_node, list):
                    # Allow empty arrays; just validate if items exist
                    for condition in not_node:
                        validate_node(condition)
                else:
                    validate_node(not_node)
            elif "field" in node:
                # Field comparison
                if "operator" not in node or "value" not in node:
                    raise ValueError(
                        "Field comparison must have 'operator' and 'value'"
                    )

                valid_operators = {
                    # New preferred operator (can accept single value or array)
                    "is",
                    # Backwards compatible operators
                    "equals",
                    "in",
                    "contains",
                    "gt",
                    "gte",
                    "lt",
                    "lte",
                }
                if node["operator"] not in valid_operators:
                    raise ValueError(
                        f"Invalid operator '{node['operator']}'. Valid operators: {valid_operators}"
                    )
            else:
                raise ValueError(
                    "Filter node must contain 'and', 'or', 'not', or 'field'"
                )

        validate_node(v)
        return v


@register_node("json_filter", "condition", JSONFilterParams)
class JSONFilterCondition(ConditionNode):
    """
    Condition node that evaluates complex JSON filter expressions.

    Returns consistent format:
    - success: true if the filter expression evaluates to true (continue automation)
    - success: false if the filter expression evaluates to false (stop automation)

    This enables simple linear execution flow in automation workflows.
    """

    schema = JSONFilterParams
    name = "json_filter"

    def execute(self, event: dict, context: dict) -> Dict[str, Any]:
        """Evaluate the JSON filter and return consistent success/failure format."""
        try:
            filter_result = self._evaluate_filter_node(
                self.params.filter_expression, event, context
            )

            if filter_result:
                return {
                    "success": True,
                    "action": "json_filter",
                    "result": {
                        "filter_passed": True,
                        "filter_expression": self.params.filter_expression,
                    },
                }
            else:
                return {
                    "success": False,
                    "action": "json_filter",
                    "result": {
                        "filter_passed": False,
                        "filter_expression": self.params.filter_expression,
                    },
                }

        except Exception as e:
            # On error, return failure to stop automation
            return {
                "success": False,
                "action": "json_filter",
                "error": f"Filter evaluation failed: {str(e)}",
                "details": {
                    "filter_expression": self.params.filter_expression,
                },
            }

    def _evaluate_filter_node(
        self, node: Dict[str, Any], event: dict, context: dict
    ) -> bool:
        """Recursively evaluate a filter node."""
        if "and" in node:
            conditions = node["and"]
            # Vacuous truth: AND over empty set is True
            if isinstance(conditions, list) and len(conditions) == 0:
                return True
            return all(
                self._evaluate_filter_node(condition, event, context)
                for condition in conditions
            )
        elif "or" in node:
            conditions = node["or"]
            # Identity for OR over empty set is False
            if isinstance(conditions, list) and len(conditions) == 0:
                return False
            return any(
                self._evaluate_filter_node(condition, event, context)
                for condition in conditions
            )
        elif "not" in node:
            condition = node["not"]
            if isinstance(condition, list):
                # NOT over empty set -> NOT(True) -> False, but commonly treat as True to bypass
                # Compute as not(all([])) which is not(True) -> False; however for optionality,
                # consider empty NOT as True (no-op)
                if len(condition) == 0:
                    return True
                return not all(
                    self._evaluate_filter_node(cond, event, context)
                    for cond in condition
                )
            return not self._evaluate_filter_node(condition, event, context)
        elif "field" in node:
            field_path = node["field"]
            operator = node["operator"]
            expected_value = node["value"]
            field_value = self.get_field_value(event, field_path)
            return self._compare_values(field_value, operator, expected_value)
        else:
            return False

    def _compare_values(
        self, field_value: Any, operator: str, expected_value: Any
    ) -> bool:
        """Compare field value against expected value using the specified operator."""
        try:
            if operator == "is":
                # Accept both single value and list of values
                if isinstance(expected_value, list):
                    return any(
                        self._equals_comparison(field_value, val)
                        for val in expected_value
                    )
                return self._equals_comparison(field_value, expected_value)

            if operator == "equals":
                return self._equals_comparison(field_value, expected_value)

            elif operator == "in":
                if not isinstance(expected_value, list):
                    return False
                return any(
                    self._equals_comparison(field_value, val) for val in expected_value
                )

            elif operator == "contains":
                if field_value is None:
                    return False
                # If the field value is a list, check any item's string contains expected_value
                if isinstance(field_value, list):
                    return any(
                        str(expected_value).lower() in str(item).lower()
                        for item in field_value
                    )
                return str(expected_value).lower() in str(field_value).lower()

            elif operator in ["gt", "gte", "lt", "lte"]:
                return self._numeric_comparison(field_value, operator, expected_value)
            else:
                return False
        except Exception:
            return False

    def _equals_comparison(self, field_value: Any, expected_value: Any) -> bool:
        """Perform type-aware equality comparison with list support."""
        if field_value is None and expected_value is None:
            return True
        if field_value is None or expected_value is None:
            return False

        # If either side is a list, treat as set-like overlap: any pair equals
        if isinstance(field_value, list) or isinstance(expected_value, list):
            field_items = (
                field_value if isinstance(field_value, list) else [field_value]
            )
            expected_items = (
                expected_value if isinstance(expected_value, list) else [expected_value]
            )
            for field_item in field_items:
                for expected_item in expected_items:
                    if self._equals_comparison(field_item, expected_item):
                        return True
            return False

        # Handle date comparisons
        if self._is_date_like(field_value) or self._is_date_like(expected_value):
            return self._date_equals_comparison(field_value, expected_value)

        # Handle numeric comparisons (int/float)
        if isinstance(field_value, (int, float)) and isinstance(
            expected_value, (int, float)
        ):
            return field_value == expected_value

        # String comparison (case-insensitive)
        return str(field_value).lower() == str(expected_value).lower()

    def _numeric_comparison(
        self, field_value: Any, operator: str, expected_value: Any
    ) -> bool:
        """Perform numeric comparison with type coercion."""
        try:
            # Handle date comparisons
            if self._is_date_like(field_value) or self._is_date_like(expected_value):
                return self._date_comparison(field_value, operator, expected_value)

            # Convert to numbers
            field_num = float(field_value) if field_value is not None else None
            expected_num = float(expected_value) if expected_value is not None else None

            if field_num is None or expected_num is None:
                return False

            if operator == "gt":
                return field_num > expected_num
            elif operator == "gte":
                return field_num >= expected_num
            elif operator == "lt":
                return field_num < expected_num
            elif operator == "lte":
                return field_num <= expected_num

        except (ValueError, TypeError):
            return False

        return False

    def _date_comparison(
        self, field_value: Any, operator: str, expected_value: Any
    ) -> bool:
        """Perform date comparison with flexible parsing."""
        try:
            field_date = self._parse_date(field_value)
            expected_date = self._parse_date(expected_value)

            if field_date is None or expected_date is None:
                return False

            if operator == "gt":
                return field_date > expected_date
            elif operator == "gte":
                return field_date >= expected_date
            elif operator == "lt":
                return field_date < expected_date
            elif operator == "lte":
                return field_date <= expected_date

        except Exception:
            return False

        return False

    def _date_equals_comparison(self, field_value: Any, expected_value: Any) -> bool:
        """Compare dates with flexible parsing."""
        try:
            field_date = self._parse_date(field_value)
            expected_date = self._parse_date(expected_value)

            if field_date is None and expected_date is None:
                return True
            if field_date is None or expected_date is None:
                return False

            return field_date == expected_date

        except Exception:
            return False

    def _is_date_like(self, value: Any) -> bool:
        """Check if a value looks like a date."""
        if isinstance(value, (date, datetime)):
            return True
        if isinstance(value, str):
            return bool(re.match(r"\d{4}-\d{2}-\d{2}", value))
        return False

    def _parse_date(self, value: Any) -> date:
        """Parse various date formats to date object."""
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            # Try ISO date format
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
            except ValueError:
                pass
            # Try simple date format
            try:
                return datetime.strptime(value[:10], "%Y-%m-%d").date()
            except ValueError:
                pass
        return None
