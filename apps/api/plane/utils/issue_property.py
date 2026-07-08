# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import uuid
from decimal import Decimal, InvalidOperation

# Django imports
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.dateparse import parse_datetime

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import PropertyTypeEnum, RelationTypeEnum

# The set of value columns managed by the typed value store. Every cast resets
# all of them and only fills the one relevant to the property type.
VALUE_COLUMNS = (
    "value_text",
    "value_boolean",
    "value_decimal",
    "value_datetime",
    "value_uuid",
    "value_option_id",
)

# property_type -> the typed column that holds its value.
PROPERTY_TYPE_COLUMN = {
    PropertyTypeEnum.TEXT.value: "value_text",
    PropertyTypeEnum.URL.value: "value_text",
    PropertyTypeEnum.DECIMAL.value: "value_decimal",
    PropertyTypeEnum.BOOLEAN.value: "value_boolean",
    PropertyTypeEnum.DATETIME.value: "value_datetime",
    PropertyTypeEnum.OPTION.value: "value_option_id",
    PropertyTypeEnum.RELATION.value: "value_uuid",
}

# The property types exposed by the V1 API.
V1_PROPERTY_TYPES = {
    PropertyTypeEnum.TEXT.value,
    PropertyTypeEnum.DECIMAL.value,
    PropertyTypeEnum.BOOLEAN.value,
    PropertyTypeEnum.DATETIME.value,
    PropertyTypeEnum.OPTION.value,
    PropertyTypeEnum.RELATION.value,
    PropertyTypeEnum.URL.value,
}

_TRUTHY = {"true", "1", "yes", "on"}
_FALSY = {"false", "0", "no", "off", ""}

# Upper bound on the number of values accepted for an is_multi property, to
# prevent request amplification / resource exhaustion.
MAX_MULTI_VALUES = 100


def _empty_value_kwargs():
    """Return a dict with every typed value column reset to ``None``."""
    return {column: None for column in VALUE_COLUMNS}


def _parse_uuid(raw_value):
    """Parse ``raw_value`` into a ``uuid.UUID`` or raise a validation error."""
    try:
        return uuid.UUID(str(raw_value))
    except (ValueError, AttributeError, TypeError):
        raise serializers.ValidationError("The provided value is not a valid identifier.")


def cast_property_value(prop, raw_value, project_id):
    """Cast and validate a single raw value for ``prop`` within ``project_id``.

    Returns a dict of ``IssuePropertyValue`` field kwargs (all typed value
    columns present, only the relevant one populated). Raises
    ``rest_framework.serializers.ValidationError`` on any invalid input.

    Isolation: OPTION values must belong to ``prop`` and RELATION-user values
    must reference a member of ``project_id`` (no cross-project references).
    """
    property_type = prop.property_type
    kwargs = _empty_value_kwargs()

    if raw_value is None:
        raise serializers.ValidationError("A value is required.")

    if property_type == PropertyTypeEnum.TEXT.value:
        kwargs["value_text"] = str(raw_value)
        return kwargs

    if property_type == PropertyTypeEnum.URL.value:
        value = str(raw_value)
        try:
            URLValidator()(value)
        except DjangoValidationError:
            raise serializers.ValidationError("The provided value is not a valid URL.")
        kwargs["value_text"] = value
        return kwargs

    if property_type == PropertyTypeEnum.DECIMAL.value:
        try:
            decimal_value = Decimal(str(raw_value))
        except (InvalidOperation, ValueError):
            raise serializers.ValidationError("The provided value is not a valid number.")
        # Reject NaN / Infinity, which Decimal(str(...)) constructs happily.
        if not decimal_value.is_finite():
            raise serializers.ValidationError("The provided value is not a valid number.")
        kwargs["value_decimal"] = decimal_value
        return kwargs

    if property_type == PropertyTypeEnum.BOOLEAN.value:
        if isinstance(raw_value, bool):
            kwargs["value_boolean"] = raw_value
            return kwargs
        normalized = str(raw_value).strip().lower()
        if normalized in _TRUTHY:
            kwargs["value_boolean"] = True
        elif normalized in _FALSY:
            kwargs["value_boolean"] = False
        else:
            raise serializers.ValidationError("The provided value is not a valid boolean.")
        return kwargs

    if property_type == PropertyTypeEnum.DATETIME.value:
        parsed = parse_datetime(str(raw_value))
        if parsed is None:
            raise serializers.ValidationError("The provided value is not a valid ISO datetime.")
        kwargs["value_datetime"] = parsed
        return kwargs

    if property_type == PropertyTypeEnum.OPTION.value:
        # Local import to avoid circular imports at module load time.
        from plane.db.models import IssuePropertyOption

        option_id = _parse_uuid(raw_value)
        # Isolation: option must belong to this property (and therefore project).
        option = IssuePropertyOption.objects.filter(
            id=option_id,
            property_id=prop.id,
            project_id=project_id,
            is_active=True,
        ).first()
        if option is None:
            raise serializers.ValidationError("The selected option does not belong to this property.")
        kwargs["value_option_id"] = option.id
        return kwargs

    if property_type == PropertyTypeEnum.RELATION.value:
        from plane.db.models import Issue, ProjectMember

        related_id = _parse_uuid(raw_value)
        if prop.relation_type == RelationTypeEnum.USER.value:
            # Isolation: the referenced user must be an active member of the project.
            is_member = ProjectMember.objects.filter(
                member_id=related_id,
                project_id=project_id,
                is_active=True,
            ).exists()
            if not is_member:
                raise serializers.ValidationError("The referenced user is not a member of this project.")
        elif prop.relation_type == RelationTypeEnum.ISSUE.value:
            # Isolation: the referenced work item must belong to the same project.
            exists = Issue.objects.filter(id=related_id, project_id=project_id).exists()
            if not exists:
                raise serializers.ValidationError("The referenced work item does not belong to this project.")
        else:
            raise serializers.ValidationError("This relation property is misconfigured.")
        kwargs["value_uuid"] = related_id
        return kwargs

    raise serializers.ValidationError("This property type is not supported.")


def cast_property_values(prop, raw_values, project_id):
    """Cast a raw payload (single value or list for ``is_multi``) into rows.

    Returns a list of field-kwargs dicts, one per value row to persist.
    """
    if prop.is_multi:
        if raw_values is None:
            values = []
        elif isinstance(raw_values, (list, tuple)):
            values = list(raw_values)
        else:
            values = [raw_values]
        if len(values) > MAX_MULTI_VALUES:
            raise serializers.ValidationError(f"This property accepts at most {MAX_MULTI_VALUES} values.")
    else:
        if isinstance(raw_values, (list, tuple)):
            if len(raw_values) > 1:
                raise serializers.ValidationError("This property does not accept multiple values.")
            values = list(raw_values)
        elif raw_values is None:
            values = []
        else:
            values = [raw_values]

    return [cast_property_value(prop, value, project_id) for value in values]


def validate_required_value(prop, raw_values):
    """Raise if ``prop`` is required/active but ``raw_values`` is empty."""
    if not (prop.is_required and prop.is_active):
        return
    if raw_values is None:
        raise serializers.ValidationError("This property is required.")

    def _is_blank(v):
        return v is None or (isinstance(v, str) and v.strip() == "")

    if isinstance(raw_values, (list, tuple)):
        # Require at least one non-blank element (an all-empty list bypasses the check otherwise).
        if not any(not _is_blank(v) for v in raw_values):
            raise serializers.ValidationError("This property is required.")
        return
    if _is_blank(raw_values):
        raise serializers.ValidationError("This property is required.")
