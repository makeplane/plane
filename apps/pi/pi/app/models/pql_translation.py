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

import uuid
from typing import Optional

from sqlmodel import Field

from pi.app.models.base import TimeAuditModel
from pi.app.models.base import UUIDModel


class PQLTranslation(UUIDModel, TimeAuditModel, table=True):
    """Audit log for PQL translation requests.

    Follows the same token-tracking pattern as DupesTracking:
    FK to llm_models + standardised token/price columns.
    """

    __tablename__ = "pql_translations"

    # Who / where
    user_id: uuid.UUID = Field(nullable=False, description="User who made the request")
    workspace_id: Optional[uuid.UUID] = Field(default=None, nullable=True, description="Optional workspace context")

    # Input / output
    query: str = Field(nullable=False, description="Original natural-language query")
    pql_output: Optional[str] = Field(default=None, nullable=True, description="Generated PQL string")

    # Status
    success: bool = Field(default=True, nullable=False, description="Whether the translation succeeded")
    error: Optional[str] = Field(default=None, nullable=True, description="Error message on failure")

    # Latency
    latency_ms: Optional[float] = Field(default=None, nullable=True, description="Wall-clock latency in milliseconds")
