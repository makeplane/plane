# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Type-aware validators for Work Item custom properties — spec §14.

Three validation surfaces:

- ``validate_value(value, property_type, config, *, entity_resolver)``
  — type-checks a single ``IssuePropertyValue.value_json`` against the
  property's type + config. ENTITY_REFERENCE defers to the entity
  provider registry (fail-closed).
- ``validate_config(config, property_type)`` — type-checks a property's
  ``config`` against its ``property_type``. DROPDOWN and MULTI_SELECT
  require ``choices``; ENTITY_REFERENCE requires ``entity_type``.
- ``validate_required_properties(attachments, values)`` — runs the §30
  P1.4 required-property check for a type, returning a list of
  missing required property names (empty list = OK).

Each function returns ``None`` on success and raises a
``WorkflowPropertyError`` subclass on failure. The caller (serializer
/ view) translates the error to an HTTP response via ``to_payload``.
"""

# Python imports
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Callable, Iterable, List, Optional, Sequence

# Module imports
from plane.db.models.workflow_property import (
    JSON_LIST_TYPES,
    JSON_OBJECT_TYPES,
    JSON_SCALAR_TYPES,
    WorkflowPropertyType,
)

from .entity_providers import resolve_entity
from .errors import (
    WorkflowPropertyInvalidConfig,
    WorkflowPropertyInvalidValue,
    WorkflowPropertyRequiredMissing,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


# Conservative email regex — enough to reject obviously malformed
# addresses. Full RFC 5322 conformance is not the goal here.
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _is_blank(value: Any) -> bool:
    """Treat ``None``, empty string, empty list, empty dict as missing."""
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    if isinstance(value, (list, dict)) and len(value) == 0:
        return True
    return False


def _as_number(value: Any) -> Optional[float]:
    if isinstance(value, bool):
        # ``bool`` is a subclass of ``int``; we must keep booleans out of
        # NUMBER values to avoid surprising clients.
        return None
    if isinstance(value, (int, float, Decimal)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except (ValueError, InvalidOperation):
            return None
    return None


def _as_bool(value: Any) -> Optional[bool]:
    if isinstance(value, bool):
        return value
    if isinstance(value, str) and value.lower() in {"true", "false"}:
        return value.lower() == "true"
    return None


def _as_iso_date(value: Any) -> Optional[str]:
    if isinstance(value, str) and re.match(r"^\d{4}-\d{2}-\d{2}$", value):
        # Confirm parse-ability so we reject "2024-13-40" early.
        try:
            date.fromisoformat(value)
        except ValueError:
            return None
        return value
    return None


def _as_iso_datetime(value: Any) -> Optional[str]:
    if not isinstance(value, str):
        return None
    candidate = value.replace("Z", "+00:00")
    try:
        datetime.fromisoformat(candidate)
    except ValueError:
        return None
    return value


def _choices_from_config(config: Any) -> Optional[List[str]]:
    if not isinstance(config, dict):
        return None
    choices = config.get("choices")
    if not isinstance(choices, list) or not choices:
        return None
    out: List[str] = []
    for c in choices:
        if not isinstance(c, str) or not c:
            return None
        out.append(c)
    return out


def _entity_type_from_config(config: Any) -> Optional[str]:
    if not isinstance(config, dict):
        return None
    et = config.get("entity_type")
    if not isinstance(et, str) or not et.strip():
        return None
    return et.strip()


# ---------------------------------------------------------------------------
# Per-type value validators
# ---------------------------------------------------------------------------


def _validate_text(value: Any) -> Optional[str]:
    if not isinstance(value, str):
        return "TEXT expects a string."
    return None


def _validate_paragraph(value: Any) -> Optional[str]:
    return _validate_text(value)


def _validate_number(value: Any) -> Optional[str]:
    if _as_number(value) is None:
        return "NUMBER expects a numeric value."
    return None


def _validate_boolean(value: Any) -> Optional[str]:
    if _as_bool(value) is None:
        return "BOOLEAN expects true or false."
    return None


def _validate_date(value: Any) -> Optional[str]:
    if _as_iso_date(value) is None:
        return "DATE expects an ISO-8601 date (YYYY-MM-DD)."
    return None


def _validate_datetime(value: Any) -> Optional[str]:
    if _as_iso_datetime(value) is None:
        return "DATETIME expects an ISO-8601 datetime."
    return None


def _validate_dropdown(value: Any, config: Any) -> Optional[str]:
    choices = _choices_from_config(config)
    if choices is None:
        return "DROPDOWN requires a non-empty 'choices' list in config."
    if not isinstance(value, str):
        return "DROPDOWN expects a single string."
    if value not in choices:
        return f"DROPDOWN value must be one of {choices!r}."
    return None


def _validate_multi_select(value: Any, config: Any) -> Optional[str]:
    choices = _choices_from_config(config)
    if choices is None:
        return "MULTI_SELECT requires a non-empty 'choices' list in config."
    if not isinstance(value, list):
        return "MULTI_SELECT expects a list of strings."
    for item in value:
        if not isinstance(item, str):
            return "MULTI_SELECT items must be strings."
        if item not in choices:
            return f"MULTI_SELECT item must be one of {choices!r}."
    return None


def _validate_member(value: Any, config: Any) -> Optional[str]:
    # MEMBER is a list of user ids. The list may be empty.
    if not isinstance(value, list):
        return "MEMBER expects a list of user ids."
    for item in value:
        if not isinstance(item, str):
            return "MEMBER items must be user id strings."
        if not item:
            return "MEMBER items must be non-empty."
    if config:
        choices = _choices_from_config(config)
        if choices is not None:
            for item in value:
                if item not in choices:
                    return f"MEMBER item must be one of {choices!r}."
    return None


def _validate_url(value: Any) -> Optional[str]:
    if not isinstance(value, str):
        return "URL expects a string."
    if not re.match(r"^https?://", value):
        return "URL must start with http:// or https://."
    return None


def _validate_email(value: Any) -> Optional[str]:
    if not isinstance(value, str):
        return "EMAIL expects a string."
    if not _EMAIL_RE.match(value):
        return "EMAIL is not a valid address."
    return None


def _validate_entity_reference(
    value: Any,
    config: Any,
    *,
    entity_resolver: Optional[Callable[[str, str], bool]] = None,
) -> Optional[str]:
    if not isinstance(value, dict):
        return "ENTITY_REFERENCE expects an object with entity_type and entity_id."
    entity_type = value.get("entity_type")
    entity_id = value.get("entity_id")
    if not isinstance(entity_type, str) or not entity_type.strip():
        return "ENTITY_REFERENCE.entity_type must be a non-empty string."
    if not isinstance(entity_id, str) or not entity_id.strip():
        return "ENTITY_REFERENCE.entity_id must be a non-empty string."
    configured_type = _entity_type_from_config(config)
    if configured_type is None:
        return "ENTITY_REFERENCE requires an 'entity_type' in config."
    if entity_type != configured_type:
        return (
            f"ENTITY_REFERENCE.entity_type must match config.entity_type "
            f"({configured_type!r})."
        )
    resolver = entity_resolver or (lambda et, eid: resolve_entity(et, eid)[0])
    if not resolver(entity_type, entity_id):
        return (
            f"ENTITY_REFERENCE does not resolve to a {entity_type} "
            "record."
        )
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def validate_value(
    value: Any,
    property_type: str,
    config: Any = None,
    *,
    allow_blank: bool = True,
    entity_resolver: Optional[Callable[[str, str], bool]] = None,
) -> None:
    """Validate a single ``IssuePropertyValue.value_json``.

    Raises ``WorkflowPropertyInvalidValue`` on failure. ``allow_blank``
    short-circuits empty values (the missing-required check lives in
    ``validate_required_properties``).
    """
    if allow_blank and _is_blank(value):
        return

    issue: Optional[str] = None
    pt = property_type
    if pt == WorkflowPropertyType.TEXT:
        issue = _validate_text(value)
    elif pt == WorkflowPropertyType.PARAGRAPH:
        issue = _validate_paragraph(value)
    elif pt == WorkflowPropertyType.NUMBER:
        issue = _validate_number(value)
    elif pt == WorkflowPropertyType.BOOLEAN:
        issue = _validate_boolean(value)
    elif pt == WorkflowPropertyType.DATE:
        issue = _validate_date(value)
    elif pt == WorkflowPropertyType.DATETIME:
        issue = _validate_datetime(value)
    elif pt == WorkflowPropertyType.DROPDOWN:
        issue = _validate_dropdown(value, config)
    elif pt == WorkflowPropertyType.MULTI_SELECT:
        issue = _validate_multi_select(value, config)
    elif pt == WorkflowPropertyType.MEMBER:
        issue = _validate_member(value, config)
    elif pt == WorkflowPropertyType.URL:
        issue = _validate_url(value)
    elif pt == WorkflowPropertyType.EMAIL:
        issue = _validate_email(value)
    elif pt == WorkflowPropertyType.ENTITY_REFERENCE:
        issue = _validate_entity_reference(
            value, config, entity_resolver=entity_resolver
        )
    else:
        issue = f"Unknown property_type '{pt}'."

    if issue:
        raise WorkflowPropertyInvalidValue(
            issue,
            property_type=pt,
        )


def validate_config(config: Any, property_type: str) -> None:
    """Validate a property's ``config`` JSON against its type."""
    config = config or {}
    if not isinstance(config, dict):
        raise WorkflowPropertyInvalidConfig(
            "Property config must be a JSON object."
        )
    pt = property_type
    if pt in (
        WorkflowPropertyType.DROPDOWN,
        WorkflowPropertyType.MULTI_SELECT,
    ):
        if _choices_from_config(config) is None:
            raise WorkflowPropertyInvalidConfig(
                f"{pt} requires a non-empty 'choices' list in config."
            )
    elif pt == WorkflowPropertyType.ENTITY_REFERENCE:
        if _entity_type_from_config(config) is None:
            raise WorkflowPropertyInvalidConfig(
                "ENTITY_REFERENCE requires a non-empty 'entity_type' in config."
            )
    elif pt == WorkflowPropertyType.MEMBER:
        # ``choices`` is optional for MEMBER (it can also mean "any active
        # project member"); unknown keys are still rejected so consumers
        # don't silently get ignored options.
        for key in config.keys():
            if key != "choices":
                raise WorkflowPropertyInvalidConfig(
                    f"MEMBER config does not support key '{key}'."
                )
        if "choices" in config and _choices_from_config(config) is None:
            raise WorkflowPropertyInvalidConfig(
                "MEMBER 'choices' must be a non-empty list of user ids."
            )


def validate_required_properties(
    attachments: Sequence,
    values_by_property_id: dict,
    *,
    values_resolver: Optional[Callable[[object], Any]] = None,
) -> List[str]:
    """Run the §30 P1.4 required-property check.

    ``attachments`` is an iterable of ``IssueTypeProperty`` rows.
    ``values_by_property_id`` is a ``{property_id: value_json}`` dict
    (only properties actually present on the issue need an entry; the
    rest are treated as missing). Returns a list of missing property
    *names* (empty list = OK).
    """
    missing: List[str] = []
    get_value = values_resolver or (lambda v: v)
    for attachment in attachments:
        if not getattr(attachment, "is_required", False):
            continue
        property_obj = getattr(attachment, "property", None)
        if property_obj is None:
            continue
        property_id = str(property_obj.id)
        if property_id not in values_by_property_id:
            missing.append(getattr(property_obj, "name", property_id))
            continue
        value = get_value(values_by_property_id[property_id])
        if _is_blank(value):
            missing.append(getattr(property_obj, "name", property_id))
    if missing:
        raise WorkflowPropertyRequiredMissing(missing=missing)
    return missing


__all__ = [
    "validate_value",
    "validate_config",
    "validate_required_properties",
]
