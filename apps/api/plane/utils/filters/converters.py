import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Union

from dateutil.parser import parse as dateutil_parse


class LegacyToRichFiltersConverter:
    # Default mapping from legacy filter names to new rich filter field names
    DEFAULT_FIELD_MAPPINGS = {
        "state": "state_id",
        "labels": "label_id",
        "cycle": "cycle_id",
        "module": "module_id",
        "assignees": "assignee_id",
        "mentions": "mention_id",
        "created_by": "created_by_id",
        "state_group": "state_group",
        "priority": "priority",
        "project": "project_id",
        "start_date": "start_date",
        "target_date": "target_date",
    }

    # Default fields that expect UUID values
    DEFAULT_UUID_FIELDS = {
        "state_id",
        "label_id",
        "cycle_id",
        "module_id",
        "assignee_id",
        "mention_id",
        "created_by_id",
        "project_id",
    }

    # Default valid choices for choice fields
    DEFAULT_VALID_CHOICES = {
        "state_group": ["backlog", "unstarted", "started", "completed", "cancelled"],
        "priority": ["urgent", "high", "medium", "low", "none"],
    }

    # Default date fields
    DEFAULT_DATE_FIELDS = {"start_date", "target_date"}

    # Pattern for relative date strings like "2_weeks" or "3_months"
    DATE_PATTERN = re.compile(r"(\d+)_(weeks|months)$")

    def __init__(
        self,
        field_mappings: Dict[str, str] = None,
        uuid_fields: set = None,
        valid_choices: Dict[str, List[str]] = None,
        date_fields: set = None,
        extend_defaults: bool = True,
    ):
        """
        Initialize the converter with optional custom configurations.

        Args:
            field_mappings: Custom field mappings (legacy_key -> rich_field_name)
            uuid_fields: Set of field names that should be validated as UUIDs
            valid_choices: Dict of valid choices for choice fields
            date_fields: Set of field names that should be treated as dates
            extend_defaults: If True, merge with defaults; if False, replace defaults

        Examples:
            # Use defaults
            converter = LegacyToRichFiltersConverter()

            # Add custom field mapping
            converter = LegacyToRichFiltersConverter(
                field_mappings={"custom_field": "custom_field_id"}
            )

            # Override priority choices
            converter = LegacyToRichFiltersConverter(
                valid_choices={"priority": ["critical", "high", "medium", "low"]}
            )

            # Complete replacement (not extending defaults)
            converter = LegacyToRichFiltersConverter(
                field_mappings={"state": "status_id"},
                extend_defaults=False
            )
        """
        if extend_defaults:
            # Merge with defaults
            self.FIELD_MAPPINGS = {**self.DEFAULT_FIELD_MAPPINGS}
            if field_mappings:
                self.FIELD_MAPPINGS.update(field_mappings)

            self.UUID_FIELDS = {*self.DEFAULT_UUID_FIELDS}
            if uuid_fields:
                self.UUID_FIELDS.update(uuid_fields)

            self.VALID_CHOICES = {**self.DEFAULT_VALID_CHOICES}
            if valid_choices:
                self.VALID_CHOICES.update(valid_choices)

            self.DATE_FIELDS = {*self.DEFAULT_DATE_FIELDS}
            if date_fields:
                self.DATE_FIELDS.update(date_fields)
        else:
            # Replace defaults entirely
            self.FIELD_MAPPINGS = field_mappings or {}
            self.UUID_FIELDS = uuid_fields or set()
            self.VALID_CHOICES = valid_choices or {}
            self.DATE_FIELDS = date_fields or set()

    def add_field_mapping(self, legacy_key: str, rich_field_name: str) -> None:
        """Add or update a single field mapping."""
        self.FIELD_MAPPINGS[legacy_key] = rich_field_name

    def add_uuid_field(self, field_name: str) -> None:
        """Add a field that should be validated as UUID."""
        self.UUID_FIELDS.add(field_name)

    def add_choice_field(self, field_name: str, choices: List[str]) -> None:
        """Add or update valid choices for a choice field."""
        self.VALID_CHOICES[field_name] = choices

    def add_date_field(self, field_name: str) -> None:
        """Add a field that should be treated as a date field."""
        self.DATE_FIELDS.add(field_name)

    def update_mappings(
        self,
        field_mappings: Dict[str, str] = None,
        uuid_fields: set = None,
        valid_choices: Dict[str, List[str]] = None,
        date_fields: set = None,
    ) -> None:
        """
        Update multiple configurations at once.

        Args:
            field_mappings: Additional field mappings to add/update
            uuid_fields: Additional UUID fields to add
            valid_choices: Additional choice fields to add/update
            date_fields: Additional date fields to add
        """
        if field_mappings:
            self.FIELD_MAPPINGS.update(field_mappings)
        if uuid_fields:
            self.UUID_FIELDS.update(uuid_fields)
        if valid_choices:
            self.VALID_CHOICES.update(valid_choices)
        if date_fields:
            self.DATE_FIELDS.update(date_fields)

    def _validate_uuid(self, value: str) -> bool:
        """Validate if a string is a valid UUID"""
        try:
            uuid.UUID(str(value))
            return True
        except (ValueError, TypeError):
            return False

    def _validate_choice(self, field_name: str, value: str) -> bool:
        """Validate if a value is valid for a choice field"""
        if field_name not in self.VALID_CHOICES:
            return True  # No validation needed for this field
        return value in self.VALID_CHOICES[field_name]

    def _validate_date(self, value: Union[str, datetime]) -> bool:
        """Validate if a value is a valid date using dateutil parser"""
        if isinstance(value, datetime):
            return True
        if isinstance(value, str):
            try:
                # Use dateutil for flexible date parsing
                dateutil_parse(value)
                return True
            except (ValueError, TypeError):
                return False
        return False

    def _validate_value(self, rich_field_name: str, value: Any) -> bool:
        """Validate a single value based on field type"""
        if rich_field_name in self.UUID_FIELDS:
            return self._validate_uuid(value)
        elif rich_field_name in self.VALID_CHOICES:
            return self._validate_choice(rich_field_name, value)
        elif rich_field_name in self.DATE_FIELDS:
            return self._validate_date(value)
        return True  # No specific validation needed

    def _filter_valid_values(self, rich_field_name: str, values: List[Any]) -> List[Any]:
        """Filter out invalid values from a list and return only valid ones"""
        valid_values = []
        for value in values:
            if self._validate_value(rich_field_name, value):
                valid_values.append(value)
        return valid_values

    def _add_validation_error(self, strict: bool, validation_errors: List[str], message: str) -> None:
        """Add validation error if in strict mode."""
        if strict:
            validation_errors.append(message)

    def _add_rich_filter(self, rich_filters: Dict[str, Any], field_name: str, operator: str, value: Any) -> None:
        """Add a rich filter with proper field name formatting."""
        # Convert lists to comma-separated strings for 'in' and 'range' operations
        if operator in ("in", "range") and isinstance(value, list):
            value = ",".join(str(v) for v in value)
        rich_filters[f"{field_name}__{operator}"] = value

    def _handle_value_error(self, e: ValueError, strict: bool, validation_errors: List[str]) -> None:
        """Handle ValueError with consistent strict/non-strict behavior."""
        if strict:
            validation_errors.append(str(e))
        # In non-strict mode, we just skip (no action needed)

    def _process_date_field(
        self,
        rich_field_name: str,
        values: List[str],
        strict: bool,
        validation_errors: List[str],
        rich_filters: Dict[str, Any],
    ) -> bool:
        """Process date field with basic functionality (exact, range)."""
        if rich_field_name not in self.DATE_FIELDS:
            return False

        try:
            date_filter_result = self._convert_date_value(rich_field_name, values, strict)
            if date_filter_result:
                rich_filters.update(date_filter_result)
            return True
        except ValueError as e:
            self._handle_value_error(e, strict, validation_errors)
            return True

    def _convert_date_value(self, field_name: str, values: List[str], strict: bool = False) -> Dict[str, Any]:
        """
        Convert legacy date values to rich filter format - basic implementation.

        Supports:
        - Simple dates: "2023-01-01" -> __exact
        - Basic ranges: ["2023-01-01;after", "2023-12-31;before"] -> __range
        - Skips complex or relative date patterns

        Args:
            field_name: Name of the rich filter field
            values: List of legacy date values
            strict: If True, raise errors for validation failures

        Raises:
            ValueError: For malformed date patterns (strict mode)
        """
        # Check for relative dates and skip the entire field if found
        for value in values:
            if ";" in value:
                parts = value.split(";")
                if len(parts) > 0 and self.DATE_PATTERN.match(parts[0]):
                    # Skip relative date patterns entirely
                    return {}

        # Skip complex conditions (more than 2 values)
        if len(values) > 2:
            return {}

        # Process each date value
        exact_dates = []
        after_dates = []
        before_dates = []

        for value in values:
            if ";" not in value:
                # Simple date string
                if not self._validate_date(value):
                    if strict:
                        raise ValueError(f"Invalid date format: {value}")
                    continue
                exact_dates.append(value)
            else:
                # Directional date - only handle basic after/before
                parts = value.split(";")
                if len(parts) < 2:
                    if strict:
                        raise ValueError(f"Invalid date format: {value}")
                    continue

                date_part = parts[0]
                direction = parts[1]

                if not self._validate_date(date_part):
                    if strict:
                        raise ValueError(f"Invalid date format: {date_part}")
                    continue

                if direction == "after":
                    after_dates.append(date_part)
                elif direction == "before":
                    before_dates.append(date_part)
                # Skip unsupported directions

        # Determine return format
        result = {}
        if len(after_dates) == 1 and len(before_dates) == 1 and len(exact_dates) == 0:
            # Simple range: one after and one before
            start_date = min(after_dates[0], before_dates[0])
            end_date = max(after_dates[0], before_dates[0])
            self._add_rich_filter(result, field_name, "range", [start_date, end_date])
        elif len(exact_dates) == 1 and len(after_dates) == 0 and len(before_dates) == 0:
            # Single exact date
            self._add_rich_filter(result, field_name, "exact", exact_dates[0])
        # Skip all other combinations

        return result

    def convert(self, legacy_filters: dict, strict: bool = False) -> Dict[str, Any]:
        """
        Convert legacy filters to rich filters format with validation

        Args:
            legacy_filters: Dictionary of legacy filters
            strict: If True, raise exception on validation errors.
                   If False, skip invalid values (default behavior)

        Returns:
            Dictionary of rich filters

        Raises:
            ValueError: If strict=True and validation fails
        """
        rich_filters = {}
        validation_errors = []

        for legacy_key, value in legacy_filters.items():
            # Skip if value is None or empty
            if value is None or (isinstance(value, list) and len(value) == 0):
                continue

            # Skip if legacy key is not in our mappings (not supported in filterset)
            if legacy_key not in self.FIELD_MAPPINGS:
                self._add_validation_error(strict, validation_errors, f"Unsupported filter key: {legacy_key}")
                continue

            # Get the new field name
            rich_field_name = self.FIELD_MAPPINGS[legacy_key]

            # Handle list values
            if isinstance(value, list):
                # Process date fields with helper method
                if self._process_date_field(rich_field_name, value, strict, validation_errors, rich_filters):
                    continue

                # Regular non-date field processing
                # Filter out invalid values
                valid_values = self._filter_valid_values(rich_field_name, value)

                if not valid_values:
                    self._add_validation_error(
                        strict,
                        validation_errors,
                        f"No valid values found for {legacy_key}: {value}",
                    )
                    continue

                # Check for invalid values if in strict mode
                if strict and len(valid_values) != len(value):
                    invalid_values = [v for v in value if v not in valid_values]
                    self._add_validation_error(
                        strict,
                        validation_errors,
                        f"Invalid values for {legacy_key}: {invalid_values}",
                    )

                # For list values, always use __in operator for non-date fields
                self._add_rich_filter(rich_filters, rich_field_name, "in", valid_values)

            else:
                # Handle single values
                # Process date fields with helper method
                if self._process_date_field(rich_field_name, [value], strict, validation_errors, rich_filters):
                    continue

                # For non-list values, use __exact operator for non-date fields
                if self._validate_value(rich_field_name, value):
                    self._add_rich_filter(rich_filters, rich_field_name, "exact", value)
                else:
                    error_msg = f"Invalid value for {legacy_key}: {value}"
                    self._add_validation_error(strict, validation_errors, error_msg)

        # Raise validation errors if in strict mode
        if strict and validation_errors:
            error_message = f"Filter validation errors: {'; '.join(validation_errors)}"
            raise ValueError(error_message)

        # Convert flat dict to rich filter format
        return self._format_as_rich_filter(rich_filters)

    def _format_as_rich_filter(self, flat_filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert a flat dictionary of filters to the proper rich filter format.

        Args:
            flat_filters: Dictionary with field__lookup keys and values

        Returns:
            Rich filter format using logical operators (and/or/not)
        """
        if not flat_filters:
            return {}

        # If only one filter, return as leaf node
        if len(flat_filters) == 1:
            key, value = next(iter(flat_filters.items()))
            return {key: value}

        # Multiple filters: wrap in 'and' operator
        filter_conditions = []
        for key, value in flat_filters.items():
            filter_conditions.append({key: value})

        return {"and": filter_conditions}
