# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""High-level orchestrator for Work Item custom properties — spec §14.

The API / serializer layer should never reach into the validators
directly. The functions here wrap the low-level type checks with the
joins needed at runtime (load the type attachment, resolve the property
definition, look up the existing value row, etc.) so every caller
performs the same checks in the same order.

Public surface:

- ``validate_value_against_property(value, property, *, allow_blank=True)``
  — used by the value write API and the issue serializer on create.
- ``validate_required_properties(issue)`` — used on every
  state-mutating write surface (issue create, issue PATCH that changes
  type, and workflow transition).
- ``coerce_property_value(value)`` — normalise wire-format payloads
  (e.g. ``"42"`` → ``42`` for NUMBER, ``"true"`` → ``True`` for
  BOOLEAN) before persisting. Keeps the JSON column canonical.
- ``build_property_payload(...)`` — format an issue's values for the
  Work Item detail / form renderer. Returns a list shaped for the FE
  contract.
"""

# Python imports
from typing import Any, Iterable, List, Optional

# Django imports
from django.db import transaction
from django.db.models import Q

# Module imports
from plane.db.models import (
    Issue,
    IssuePropertyValue,
    IssueTypeProperty,
    WorkspaceProperty,
)

from .errors import (
    WorkflowPropertyInvalidValue,
    WorkflowPropertyRequiredMissing,
)
from .validators import (
    validate_required_properties as _check_required,
    validate_value,
)


def _attachments_for_type(project_id, issue_type_id) -> Iterable[IssueTypeProperty]:
    """Return the active property attachments for ``(project, type)``.

    Inactive attachments are skipped at the API level even before
    validation. Soft-deleted rows never appear here.
    """
    return (
        IssueTypeProperty.objects.filter(
            project_id=project_id,
            issue_type_id=issue_type_id,
            deleted_at__isnull=True,
            property__is_active=True,
            property__deleted_at__isnull=True,
        ).select_related("property")
    )


def _load_existing_values(issue_id) -> dict:
    """Return a ``{property_id: value_json}`` dict for ``issue_id``."""
    rows = IssuePropertyValue.objects.filter(
        issue_id=issue_id, deleted_at__isnull=True
    ).values_list("property_id", "value_json")
    return {str(pid): value for pid, value in rows}


def validate_value_against_property(
    value: Any,
    property_obj: WorkspaceProperty,
    *,
    allow_blank: bool = True,
) -> None:
    """Validate ``value`` against ``property_obj``'s type + config."""
    validate_value(
        value,
        property_obj.property_type,
        property_obj.config or {},
        allow_blank=allow_blank,
    )


def coerce_property_value(value: Any, property_type: str) -> Any:
    """Normalise wire-format payloads before they hit the JSON column.

    The goal is a stable shape per type so the FE / API don't see two
    ways to spell the same value (``"42"`` vs ``42``,
    ``"true"`` vs ``True``).
    """
    if value is None:
        return None
    if property_type == "NUMBER":
        from .validators import _as_number

        coerced = _as_number(value)
        if coerced is None:
            # Leave it untouched; ``validate_value`` will produce the
            # user-facing error. We don't want to mutate before the
            # type check has a chance to run.
            return value
        # Emit ``int`` when the float is whole so small integers stay
        # readable in JSON.
        if coerced.is_integer():
            return int(coerced)
        return coerced
    if property_type == "BOOLEAN":
        from .validators import _as_bool

        coerced = _as_bool(value)
        return coerced if coerced is not None else value
    return value


def validate_required_properties(
    project_id,
    issue_type_id: Optional[Any],
    values_by_property_id: dict,
    *,
    attachments: Optional[Iterable[IssueTypeProperty]] = None,
) -> List[str]:
    """Run the §30 P1.4 required-property check for a write attempt.

    ``values_by_property_id`` carries the full set of proposed values
    — keys missing from this dict are treated as missing properties.
    Returns the (empty) list of missing property names when the input
    is valid, or raises ``WorkflowPropertyRequiredMissing`` otherwise.
    """
    if not issue_type_id:
        return []
    if attachments is None:
        attachments = list(_attachments_for_type(project_id, issue_type_id))
    return _check_required(attachments, values_by_property_id)


def validate_required_properties_for_issue(issue: Issue) -> None:
    """Same as ``validate_required_properties`` but loaded from the DB.

    Used on the state-mutation path (transition service). Reads the
    property attachments + the existing values straight from the DB so
    callers cannot accidentally drift from the truth.
    """
    if issue.type_id is None:
        return
    attachments = list(_attachments_for_type(issue.project_id, issue.type_id))
    if not attachments:
        return
    values = _load_existing_values(issue.id)
    # values here are already coerced / validated at write time, so a
    # blanket run of the required check is sufficient.
    _check_required(attachments, values)


def persist_property_values(
    *,
    issue: Issue,
    project_id,
    workspace_id,
    actor_id: Optional[str],
    values_by_property_id: dict,
    attachments: Optional[Iterable[IssueTypeProperty]] = None,
) -> List[IssuePropertyValue]:
    """Persist ``values_by_property_id`` against ``issue``.

    Semantics: the caller is asserting "this is the full set after
    this write". Any existing value row whose property is *not* in
    the new value set is soft-deleted so the absence is durable.
    Type-checks fire on every supplied value before any row is
    written; the §30 P1.4 required-property check runs after the
    "drop missing" pass so a default-supplied value still satisfies
    the requirement.

    Properties that are *not* attached to the issue's type can still
    receive values — the schema is workspace-scoped and the value
    table is keyed on ``(issue, property)``. The required-property
    check only fires when the type actually declares attachments.
    """
    if attachments is None:
        attachments = list(
            _attachments_for_type(project_id, issue.type_id) if issue.type_id else []
        )

    # Resolve every property the caller is writing against so we can
    # type-check values that the type has no attachment for.
    referenced_property_ids = set(values_by_property_id.keys())
    attachment_property_ids = {
        str(attachment.property_id) for attachment in attachments
    }
    orphan_property_ids = referenced_property_ids - attachment_property_ids
    referenced_properties = {
        str(prop.id): prop
        for prop in WorkspaceProperty.objects.filter(
            id__in=referenced_property_ids, is_active=True
        )
    }

    with transaction.atomic():
        # Type-check every supplied value against its property. Missing
        # properties (uuid that does not resolve to an active property)
        # are rejected as ``WorkflowPropertyInvalidValue`` so the caller
        # cannot smuggle in dead references.
        for property_id, value in values_by_property_id.items():
            property_obj = referenced_properties.get(property_id)
            if property_obj is None:
                from .errors import WorkflowPropertyInvalidValue

                raise WorkflowPropertyInvalidValue(
                    f"Unknown property {property_id}.",
                    property_id=property_id,
                    property_type=None,
                )
            validate_value(
                value,
                property_obj.property_type,
                property_obj.config or {},
            )

        # Drop any pre-existing value rows that the caller is NOT
        # overwriting in this write — set semantics.
        IssuePropertyValue.objects.filter(
            issue=issue, deleted_at__isnull=True
        ).exclude(
            property_id__in=referenced_property_ids
        ).update(
            deleted_at=__import__("django.utils.timezone", fromlist=["now"]).now()
        )

        # Required-property check on the post-update state — covers
        # type attachments only (orphan properties are by definition
        # not part of the type's required set).
        if attachments:
            existing = {
                str(row.property_id): row.value_json
                for row in IssuePropertyValue.objects.filter(
                    issue=issue, deleted_at__isnull=True
                )
            }
            merged = {**existing, **values_by_property_id}
            _check_required(attachments, merged)

        persisted: List[IssuePropertyValue] = []
        for property_id, value in values_by_property_id.items():
            property_obj = referenced_properties[property_id]
            row, _ = IssuePropertyValue.objects.update_or_create(
                issue=issue,
                property=property_obj,
                defaults={
                    "value_json": value,
                    "project_id": project_id,
                    "workspace_id": workspace_id,
                    "updated_by_id": actor_id,
                    "deleted_at": None,
                },
            )
            if not row.created_by_id:
                row.created_by_id = actor_id
                row.save(update_fields=["created_by_id"])
            persisted.append(row)
        return persisted


def build_property_payload(issue: Issue) -> List[dict]:
    """Format an issue's property values for the FE renderer.

    Returns one entry per active property attached to the issue's
    type. Missing values are represented as ``{"value_json": null}``
    so the FE can render an empty input without a second round-trip.
    """
    if issue.type_id is None:
        return []
    attachments = _attachments_for_type(issue.project_id, issue.type_id)
    values = _load_existing_values(issue.id)
    payload: List[dict] = []
    for attachment in attachments:
        property_obj = attachment.property
        payload.append(
            {
                "id": str(attachment.id),
                "property_id": str(property_obj.id),
                "name": property_obj.name,
                "property_type": property_obj.property_type,
                "config": property_obj.config,
                "is_required": attachment.is_required,
                "sequence": attachment.sequence,
                "value_json": values.get(str(property_obj.id)),
            }
        )
    payload.sort(key=lambda row: (row["sequence"], row["name"]))
    return payload


__all__ = [
    "build_property_payload",
    "coerce_property_value",
    "persist_property_values",
    "validate_required_properties",
    "validate_required_properties_for_issue",
    "validate_value_against_property",
]
