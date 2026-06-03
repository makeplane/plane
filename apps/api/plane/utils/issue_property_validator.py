# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Validation and coercion helpers for custom field (issue property) values.

Kept side-effect free so it can be unit tested without a database.
"""

# Python imports
from typing import Iterable

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.utils.dateparse import parse_date, parse_datetime

# Module imports
from plane.db.models import IssueProperty, IssuePropertyValue
from plane.db.models.issue_property import PropertyTypeEnum


def _as_list(value):
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return [v for v in value if v not in (None, "")]
    if value == "":
        return []
    return [value]


def parse_datetime_value(raw):
    """Accept ISO date or datetime strings; return a datetime/date or raise ValueError."""
    parsed = parse_datetime(str(raw))
    if parsed is None:
        parsed = parse_date(str(raw))
    if parsed is None:
        raise ValueError("Invalid date")
    return parsed


def validate_property_values(properties: Iterable[IssueProperty], values_map: dict) -> dict:
    """Validate a {property_id: [values]} payload against the given properties.

    Returns a dict {property_id: [error messages]}; empty dict means valid.
    """
    errors: dict = {}
    url_validator = URLValidator()

    for prop in properties:
        key = str(prop.id)
        raw_values = _as_list(values_map.get(key))
        prop_errors = []

        # Required check (booleans default to false, so are never "missing")
        if prop.is_required and prop.property_type != PropertyTypeEnum.BOOLEAN and not raw_values:
            prop_errors.append(f"{prop.display_name} is required")

        # Cardinality
        if not prop.is_multi and len(raw_values) > 1:
            prop_errors.append(f"{prop.display_name} accepts a single value")

        # Per-type coercion checks
        for raw in raw_values:
            if prop.property_type == PropertyTypeEnum.DECIMAL:
                try:
                    float(raw)
                except (TypeError, ValueError):
                    prop_errors.append(f"{prop.display_name} must be a number")
            elif prop.property_type == PropertyTypeEnum.DATETIME:
                try:
                    parse_datetime_value(raw)
                except ValueError:
                    prop_errors.append(f"{prop.display_name} must be a valid date")
            elif prop.property_type == PropertyTypeEnum.URL:
                try:
                    url_validator(str(raw))
                except ValidationError:
                    prop_errors.append(f"{prop.display_name} must be a valid URL")
            elif prop.property_type == PropertyTypeEnum.OPTION:
                valid_option_ids = {str(o.id) for o in prop.options.all()}
                if str(raw) not in valid_option_ids:
                    prop_errors.append(f"{prop.display_name} has an invalid option")

        if prop_errors:
            errors[key] = prop_errors

    return errors


def build_property_value(prop: IssueProperty, issue, project_id, raw) -> IssuePropertyValue:
    """Build (unsaved) an IssuePropertyValue row for one value of a property."""
    value = IssuePropertyValue(issue=issue, property=prop, project_id=project_id)

    if prop.property_type in (PropertyTypeEnum.TEXT, PropertyTypeEnum.URL):
        value.value_text = str(raw)
    elif prop.property_type == PropertyTypeEnum.DECIMAL:
        value.value_decimal = float(raw)
    elif prop.property_type == PropertyTypeEnum.BOOLEAN:
        value.value_boolean = bool(raw) if not isinstance(raw, str) else raw.lower() in ("true", "1", "yes")
    elif prop.property_type == PropertyTypeEnum.DATETIME:
        value.value_datetime = parse_datetime_value(raw)
    elif prop.property_type == PropertyTypeEnum.OPTION:
        value.value_option_id = raw
    elif prop.property_type == PropertyTypeEnum.RELATION:
        value.value_uuid = raw

    return value
