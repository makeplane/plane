# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Work Item custom-property services — spec §14.

Layered as:

- ``errors``  — structured errors mirroring the workflow convention
  (``WorkflowError`` family); see ``plane.services.workflow.errors`` for
  the established pattern.
- ``entity_providers`` — §14.4 registry. Each provider owns
  validation + display for one ``entity_type``; unknown types fail
  closed.
- ``validators`` — type-aware value + config + required-property
  validation. This is the only module the API/serializer layer talks
  to directly.
- ``service`` — high-level orchestrator used by the issue serializer
  on create/update and by the transition service on state changes.
"""

from .errors import (
    WORKFLOW_PROPERTY_INVALID_CONFIG,
    WORKFLOW_PROPERTY_INVALID_VALUE,
    WORKFLOW_PROPERTY_NOT_FOUND,
    WORKFLOW_PROPERTY_REQUIRED_MISSING,
    WORKFLOW_PROPERTY_TYPE_IMMUTABLE,
    WorkflowPropertyError,
    WorkflowPropertyInvalidConfig,
    WorkflowPropertyInvalidValue,
    WorkflowPropertyNotFound,
    WorkflowPropertyRequiredMissing,
    WorkflowPropertyTypeImmutable,
)
from .entity_providers import (
    EntityReferenceProvider,
    display_entity,
    get_entity_provider,
    register_entity_provider,
    reset_entity_providers,
    resolve_entity,
)
from .service import (
    build_property_payload,
    coerce_property_value,
    persist_property_values,
    validate_required_properties,
    validate_required_properties_for_issue,
    validate_value_against_property,
)
from .validators import (
    validate_config,
    validate_value,
)

__all__ = [
    # errors
    "WORKFLOW_PROPERTY_INVALID_CONFIG",
    "WORKFLOW_PROPERTY_INVALID_VALUE",
    "WORKFLOW_PROPERTY_NOT_FOUND",
    "WORKFLOW_PROPERTY_REQUIRED_MISSING",
    "WORKFLOW_PROPERTY_TYPE_IMMUTABLE",
    "WorkflowPropertyError",
    "WorkflowPropertyInvalidConfig",
    "WorkflowPropertyInvalidValue",
    "WorkflowPropertyNotFound",
    "WorkflowPropertyRequiredMissing",
    "WorkflowPropertyTypeImmutable",
    # entity providers
    "EntityReferenceProvider",
    "display_entity",
    "get_entity_provider",
    "register_entity_provider",
    "reset_entity_providers",
    "resolve_entity",
    # service
    "build_property_payload",
    "coerce_property_value",
    "persist_property_values",
    "validate_required_properties",
    "validate_required_properties_for_issue",
    "validate_value_against_property",
    # validators
    "validate_config",
    "validate_value",
]
