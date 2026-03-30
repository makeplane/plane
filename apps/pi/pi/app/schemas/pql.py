# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.


from pydantic import UUID4
from pydantic import BaseModel
from pydantic import Field


class TextToPQLRequest(BaseModel):
    """Request schema for natural-language to PQL translation."""

    query: str = Field(..., min_length=1, description="Natural language query to translate into PQL")
    workspace_slug: str | None = Field(default=None, description="Workspace slug for entity context resolution")
    project_id: UUID4 | None = Field(default=None, description="Project ID to scope entity context (fewer tokens)")
    workspace_id: UUID4 | None = Field(default=None, description="Optional workspace UUID for audit tracking")


class PQLEntity(BaseModel):
    """Metadata for a resolved entity referenced by UUID in the PQL output."""

    type: str = Field(..., description="Singular entity type, e.g. 'user', 'cycle', 'label'")
    name: str = Field(..., description="Human-readable display name")


class TextToPQLResponse(BaseModel):
    """Response schema containing the generated PQL string and entity metadata."""

    pql: str = Field(..., description="Generated PQL query string")
    entities: dict[str, PQLEntity] = Field(
        default_factory=dict,
        description="Mapping of UUID -> entity metadata for UUIDs appearing in the PQL output",
    )
