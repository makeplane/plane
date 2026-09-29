# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Structured errors for Work Item custom properties — spec §14.

Mirrors the workflow error convention (``WorkflowError``) so the API
surface speaks the same shape. Codes are stable — never rename.
"""

# Python imports
from dataclasses import dataclass
from typing import Optional


WORKFLOW_PROPERTY_INVALID_VALUE = "WORKFLOW_PROPERTY_INVALID_VALUE"
WORKFLOW_PROPERTY_INVALID_CONFIG = "WORKFLOW_PROPERTY_INVALID_CONFIG"
WORKFLOW_PROPERTY_REQUIRED_MISSING = "WORKFLOW_PROPERTY_REQUIRED_MISSING"
WORKFLOW_PROPERTY_TYPE_IMMUTABLE = "WORKFLOW_PROPERTY_TYPE_IMMUTABLE"
WORKFLOW_PROPERTY_NOT_FOUND = "WORKFLOW_PROPERTY_NOT_FOUND"


@dataclass
class WorkflowPropertyError(Exception):
    """Base class for all custom-property service errors.

    Subclasses are mapped to HTTP status codes by the API/serializer
    layer. ``extra`` carries structured payload (property id, value,
    issues list, etc.) for client error rendering (§23.5 convention).
    """

    code: str
    detail: str
    status_code: int = 400
    extra: Optional[dict] = None

    def to_payload(self) -> dict:
        body = {"code": self.code, "detail": self.detail}
        if self.extra:
            body.update(self.extra)
        return body

    def __str__(self) -> str:  # pragma: no cover - debug aid
        return f"[{self.code}] {self.detail}"


class WorkflowPropertyInvalidValue(WorkflowPropertyError):
    """A value does not match its property's type / config."""

    def __init__(
        self,
        detail: str,
        *,
        property_id: Optional[str] = None,
        property_name: Optional[str] = None,
        property_type: Optional[str] = None,
        issues: Optional[list] = None,
    ):
        super().__init__(
            code=WORKFLOW_PROPERTY_INVALID_VALUE,
            detail=detail,
            status_code=422,
            extra={
                "property_id": str(property_id) if property_id else None,
                "property_name": property_name,
                "property_type": property_type,
                "issues": issues or [],
            },
        )


class WorkflowPropertyInvalidConfig(WorkflowPropertyError):
    """A property's ``config`` is not valid for its ``property_type``."""

    def __init__(self, detail: str, *, issues: Optional[list] = None):
        super().__init__(
            code=WORKFLOW_PROPERTY_INVALID_CONFIG,
            detail=detail,
            status_code=422,
            extra={"issues": issues or []},
        )


class WorkflowPropertyRequiredMissing(WorkflowPropertyError):
    """§30 P1.4 — a required property has no value."""

    def __init__(
        self,
        property_id: Optional[str] = None,
        property_name: Optional[str] = None,
        *,
        missing: Optional[list] = None,
    ):
        super().__init__(
            code=WORKFLOW_PROPERTY_REQUIRED_MISSING,
            detail=(
                f"Required property '{property_name or property_id}' is missing."
                if (property_id or property_name)
                else "One or more required properties are missing."
            ),
            status_code=422,
            extra={
                "property_id": str(property_id) if property_id else None,
                "property_name": property_name,
                "missing": missing or [],
            },
        )


class WorkflowPropertyTypeImmutable(WorkflowPropertyError):
    """A property's ``property_type`` cannot change after creation."""

    def __init__(self, property_id: str):
        super().__init__(
            code=WORKFLOW_PROPERTY_TYPE_IMMUTABLE,
            detail=(
                "Workflow property type cannot be changed after creation."
            ),
            status_code=409,
            extra={"property_id": str(property_id)},
        )


class WorkflowPropertyNotFound(WorkflowPropertyError):
    def __init__(self, detail: str = "Workflow property not found."):
        super().__init__(
            code=WORKFLOW_PROPERTY_NOT_FOUND,
            detail=detail,
            status_code=404,
        )
