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

# python imports
from typing import Optional

# Third-party imports
from sqlmodel import Field

# Module imports
from pi.app.models.base import BaseModel


class EmbeddingModel(BaseModel, table=True):
    """
    Model to store OpenSearch embedding model configurations.
    Supports multiple providers (Cohere, Azure, OpenAI, etc.) for extensibility.
    """

    __tablename__ = "embedding_models"

    model_config = {"protected_namespaces": ()}

    # Provider information
    provider: str = Field(nullable=False, max_length=100, description="Embedding provider (e.g., 'cohere', 'azure', 'openai')")
    model_name: str = Field(nullable=False, max_length=255, description="Model identifier (e.g., 'embed-v4.0')")
    base_api_url: str = Field(nullable=False, description="API endpoint URL for the provider")

    # Model metadata
    dimension: Optional[int] = Field(default=None, nullable=True, description="Embedding dimension (e.g., 1536, 384, 3072)")

    # OpenSearch identifiers (populated after setup)
    connector_id: Optional[str] = Field(default=None, nullable=True, max_length=255, description="OpenSearch connector ID")
    model_id: Optional[str] = Field(default=None, nullable=True, max_length=255, description="OpenSearch ML model ID")

    # Status tracking
    deployment_status: str = Field(
        default="pending",
        nullable=False,
        max_length=50,
        description="Current deployment status: 'pending', 'deployed', 'failed'",
    )

    # Active flag - only one model should be active at a time
    is_active: bool = Field(default=False, nullable=False, description="Whether this is the currently active embedding model")
