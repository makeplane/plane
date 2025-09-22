from typing import Any, Dict, List

from plane.utils.filters.converters import LegacyToRichFiltersConverter


class ExtendedLegacyToRichFiltersConverter(LegacyToRichFiltersConverter):
    DEFAULT_FIELD_MAPPINGS = LegacyToRichFiltersConverter.DEFAULT_FIELD_MAPPINGS.copy()
    DEFAULT_FIELD_MAPPINGS.update(
        {
            "team_project": "team_project_id",
            "issue_type": "type_id",  # Issue type UUID (e.g., bug, feature, task)
        }
    )
    DEFAULT_UUID_FIELDS = LegacyToRichFiltersConverter.DEFAULT_UUID_FIELDS.copy()
    DEFAULT_UUID_FIELDS.update({"team_project_id", "type_id"})

    # Inherit _process_date_field from base class - no need to override

    def _handle_multiple_directional_dates(
        self, dates: List[str], direction: str, field_name: str, strict: bool
    ) -> str:
        """Handle multiple directional dates with proper error reporting."""
        if len(dates) <= 1:
            return dates[0] if dates else None

        if strict:
            logic = "max" if direction == "after" else "min"
            raise ValueError(
                f"Multiple '{direction}' date conditions for {field_name}: "
                f"{dates}. Use {logic} date for most restrictive filter."
            )

        return max(dates) if direction == "after" else min(dates)

    def _convert_date_value(
        self, field_name: str, values: List[str], strict: bool = False
    ) -> Dict[str, Any]:
        """
        Convert legacy date values to rich filter format with extended operators.

        First tries base converter logic for exact/range, then extends with
        additional operators.

        Extended operators: lte, gte (in addition to exact, range from base)
        """
        # First try the base converter implementation
        base_result = super()._convert_date_value(field_name, values, strict)

        # If base converter handled it (exact dates or basic ranges), return that result
        if base_result:
            return base_result

        # Base converter skipped it - handle extended functionality
        return self._convert_extended_date_value(field_name, values, strict)

    def _convert_extended_date_value(
        self, field_name: str, values: List[str], strict: bool = False
    ) -> Dict[str, Any]:
        """
        Handle extended date conversion for cases the base converter skips.

        Handles:
        - Individual gte/lte operations that aren't part of basic ranges
        """
        # Check for relative dates and skip the entire field if found
        for value in values:
            if ";" in value:
                parts = value.split(";")
                if len(parts) > 0 and self.DATE_PATTERN.match(parts[0]):
                    # Skip relative date patterns entirely
                    return {}

        # Process each date value and collect by type
        gte_dates = []
        lte_dates = []

        for value in values:
            converted = self._parse_extended_date_value(value, strict)
            if not converted:
                continue

            if converted["type"] == "gte":
                gte_dates.append(converted["value"])
            elif converted["type"] == "lte":
                lte_dates.append(converted["value"])

        # Handle multiple directional dates of the same type
        gte_date = self._handle_multiple_directional_dates(
            gte_dates, "after", field_name, strict
        )
        lte_date = self._handle_multiple_directional_dates(
            lte_dates, "before", field_name, strict
        )

        # Create filters based on bounds
        result = {}

        if gte_date:
            self._add_rich_filter(result, field_name, "gte", gte_date)

        if lte_date:
            self._add_rich_filter(result, field_name, "lte", lte_date)

        return result

    def _parse_extended_date_value(
        self, value: str, strict: bool = False
    ) -> Dict[str, Any]:
        """Parse a date value for extended functionality only.

        Only handles directional dates that the base converter doesn't support.

        Args:
            value: Date string (e.g., "2023-01-01;after_strict")
            strict: Whether to raise errors for invalid formats

        Returns:
            Dict with type and value, or None if should be skipped

        Raises:
            ValueError: If strict=True and date value is invalid
        """
        if ";" not in value:
            # Simple dates are handled by base converter
            return None

        parts = value.split(";")
        if len(parts) < 2:
            if strict:
                raise ValueError(f"Invalid date format: {value}")
            return None

        date_part = parts[0]
        direction = parts[1]

        # Validate the date part
        if not self._validate_date(date_part):
            if strict:
                raise ValueError(
                    f"Invalid date format in directional date: {date_part}"
                )
            return None

        # Handle individual directional operations (base converter handles ranges)
        if direction == "after":
            # Handle individual gte operations (not part of a basic range)
            return {"type": "gte", "value": date_part}
        elif direction == "before":
            # Handle individual lte operations (not part of a basic range)
            return {"type": "lte", "value": date_part}
        else:
            # Unknown direction - skip in non-strict mode
            if strict:
                raise ValueError(f"Invalid date direction: {direction} in {value}")
            return None
