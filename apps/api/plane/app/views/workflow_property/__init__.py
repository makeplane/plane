# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workflow custom-property API — spec §14, §17, §30 P1.4.

Endpoints:

- §17 admin surface — ``WorkspaceProperty`` CRUD;
- §14.3 associations — ``IssueTypeProperty`` CRUD;
- §14.3 values — per-issue read + bulk write of property values;
- §14.4 / §29.7 form renderer — composite payload for the Work Item
  detail endpoint.

The serializer layer enforces all type-aware validation; the view
layer is purely CRUD + permission gating.
"""

from .base import (
    WorkspacePropertyDetailEndpoint,
    WorkspacePropertyListEndpoint,
)
from .issue_type_property import (
    IssueTypePropertyDetailEndpoint,
    IssueTypePropertyListEndpoint,
)
from .issue_value import (
    IssuePropertyPayloadEndpoint,
    IssuePropertyValueBulkEndpoint,
    IssuePropertyValueListEndpoint,
)

__all__ = [
    "WorkspacePropertyDetailEndpoint",
    "WorkspacePropertyListEndpoint",
    "IssueTypePropertyDetailEndpoint",
    "IssueTypePropertyListEndpoint",
    "IssuePropertyPayloadEndpoint",
    "IssuePropertyValueBulkEndpoint",
    "IssuePropertyValueListEndpoint",
]
