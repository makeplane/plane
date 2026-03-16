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
from typing import Any
from typing import Dict
from typing import Optional

from sqlalchemy import desc
from sqlmodel import Session
from sqlmodel import select

from pi import logger
from pi.app.models.dupes_tracking import DupesTracking
from pi.app.models.llm import LlmModel
from pi.app.models.llm import LlmModelPricing

log = logger.getChild(__name__)


class DupesTracker:
    """Utility class for tracking dupes operations and LLM token usage."""

    def __init__(self, db: Session):
        """
        Initialize DupesTracker with synchronous database session.

        Args:
            db: Synchronous database session
        """
        self.db = db

    def extract_token_usage(self, llm_response: Any) -> Dict[str, int]:
        """
        Extract token usage from LLM response (dupes-specific implementation).

        Args:
            llm_response: The response from LLM invoke() call

        Returns:
            Dictionary with input_tokens, output_tokens, and cached_input_tokens
        """
        try:
            # Handle common structured-output pattern: {"raw": <AIMessage or dict>, "parsed": ...}
            if isinstance(llm_response, dict) and "raw" in llm_response:
                candidate = llm_response.get("raw")
                if candidate is not None and not isinstance(candidate, dict):
                    if hasattr(candidate, "usage_metadata") and getattr(candidate, "usage_metadata"):
                        usage = getattr(candidate, "usage_metadata", {})
                        input_token_details = usage.get("input_token_details", {}) if isinstance(usage, dict) else {}
                        return {
                            "input_tokens": usage.get("input_tokens", 0),
                            "output_tokens": usage.get("output_tokens", 0),
                            "cached_input_tokens": input_token_details.get("cache_read", 0) if isinstance(input_token_details, dict) else 0,
                        }
                    if hasattr(candidate, "response_metadata") and getattr(candidate, "response_metadata"):
                        metadata = getattr(candidate, "response_metadata", {})
                        token_usage = metadata.get("token_usage", {}) if isinstance(metadata, dict) else {}
                        if token_usage:
                            return {
                                "input_tokens": token_usage.get("prompt_tokens", 0),
                                "output_tokens": token_usage.get("completion_tokens", 0),
                                "cached_input_tokens": 0,
                            }

            # Check for usage_metadata directly on the response
            if not isinstance(llm_response, dict) and hasattr(llm_response, "usage_metadata"):
                usage = llm_response.usage_metadata
                input_token_details = usage.get("input_token_details", {})
                return {
                    "input_tokens": usage.get("input_tokens", 0),
                    "output_tokens": usage.get("output_tokens", 0),
                    "cached_input_tokens": input_token_details.get("cache_read", 0),
                }

        except Exception as e:
            log.error(f"Error extracting token usage from dupes LLM response: {e}")

        return {"input_tokens": 0, "output_tokens": 0, "cached_input_tokens": 0}

    def get_llm_model_id(self, model_key: str) -> Optional[uuid.UUID]:
        """
        Get LLM model ID from model key (synchronous).

        Args:
            model_key: The model key (e.g., "gpt-4o-mini")

        Returns:
            UUID of the model or None if not found
        """
        try:
            stmt = select(LlmModel).where(LlmModel.model_key == model_key)
            result = self.db.exec(stmt)
            model = result.first()
            return model.id if model else None
        except Exception as e:
            log.error(f"Error getting LLM model ID for key {model_key}: {e}")
            return None

    def calculate_token_costs(
        self,
        non_cached_input_tokens: int,
        output_tokens: int,
        cached_input_tokens: int,
        llm_model_id: uuid.UUID,
    ) -> Dict[str, Any]:
        """
        Calculate token costs based on pricing (synchronous).

        Args:
            non_cached_input_tokens: Number of non-cached input tokens
            output_tokens: Number of output tokens
            cached_input_tokens: Number of cached input tokens
            llm_model_id: LLM model UUID

        Returns:
            Dictionary with prices and pricing_id
        """
        try:
            # Get the most recent pricing for this model (there's no is_active on pricing)
            stmt = select(LlmModelPricing).where(LlmModelPricing.llm_model_id == llm_model_id).order_by(desc(LlmModelPricing.created_at))  # type: ignore[arg-type]

            result = self.db.exec(stmt)
            pricing = result.first()

            if not pricing:
                log.warning(f"No pricing found for model {llm_model_id}")
                return {
                    "input_price": 0.0,
                    "output_price": 0.0,
                    "cached_input_price": 0.0,
                    "pricing_id": None,
                }

            # Calculate costs using correct field names
            input_price = (non_cached_input_tokens / 1_000_000) * float(pricing.text_input_price or 0)
            output_price = (output_tokens / 1_000_000) * float(pricing.text_output_price or 0)

            # Use cached pricing if available
            cached_input_price = 0.0
            if cached_input_tokens > 0 and pricing.cached_text_input_price:
                cached_input_price = (cached_input_tokens / 1_000_000) * float(pricing.cached_text_input_price)

            return {
                "input_price": input_price,
                "output_price": output_price,
                "cached_input_price": cached_input_price,
                "pricing_id": pricing.id,
            }

        except Exception as e:
            log.error(f"Error calculating token costs: {e}")
            return {
                "input_price": 0.0,
                "output_price": 0.0,
                "cached_input_price": 0.0,
                "pricing_id": None,
            }

    def track_dupes_operation(
        self,
        workspace_id: str,  # Changed to string for Celery compatibility
        project_id: Optional[str] = None,
        issue_id: Optional[str] = None,
        user_id: Optional[str] = None,
        workspace_slug: Optional[str] = None,
        query_title: Optional[str] = None,
        query_description_length: Optional[int] = None,
        input_workitems: Optional[list] = None,
        output_duplicates: Optional[list] = None,
        vector_candidates_count: Optional[int] = None,
        vector_search_duration_ms: Optional[float] = None,
        llm_candidates_count: Optional[int] = None,
        llm_identified_dupes_count: Optional[int] = None,
        llm_duration_ms: Optional[float] = None,
        llm_success: bool = True,
        llm_error: Optional[str] = None,
        token_usage: Optional[Dict[str, int]] = None,  # Pre-extracted token usage
        model_key: Optional[str] = None,
        total_duration_ms: Optional[float] = None,
    ) -> Optional[DupesTracking]:
        """
        Track a complete dupes operation with LLM token usage (synchronous).

        Args:
            workspace_id: Workspace UUID as string
            project_id: Optional project UUID as string
            issue_id: Optional issue UUID as string
            user_id: Optional user UUID as string
            workspace_slug: Optional workspace slug
            query_title: Optional query title
            query_description_length: Optional description length
            input_workitems: List of work items sent to LLM
            output_duplicates: List of identified duplicates
            vector_candidates_count: Number of vector search candidates
            vector_search_duration_ms: Vector search duration
            llm_candidates_count: Number of candidates sent to LLM
            llm_identified_dupes_count: Number of duplicates identified
            llm_duration_ms: LLM processing duration
            llm_success: Whether LLM call was successful
            llm_error: Optional error message
            token_usage: Pre-extracted token usage dict with input_tokens, output_tokens, cached_input_tokens
            model_key: Optional model key for token tracking
            total_duration_ms: Total operation duration

        Returns:
            DupesTracking record or None if creation failed
        """
        try:
            # Process token usage if provided
            llm_model_id = None
            input_text_tokens = None
            output_text_tokens = None
            cached_input_text_tokens = None
            input_text_price = None
            output_text_price = None
            cached_input_text_price = None
            llm_model_pricing_id = None

            if token_usage and model_key:
                try:
                    # Use pre-extracted tokens
                    total_input_tokens = token_usage.get("input_tokens", 0)
                    output_text_tokens = token_usage.get("output_tokens", 0)
                    cached_input_text_tokens = token_usage.get("cached_input_tokens", 0)
                    input_text_tokens = total_input_tokens - cached_input_text_tokens

                    # Get model ID
                    llm_model_id = self.get_llm_model_id(model_key)

                    if llm_model_id:
                        # Calculate costs
                        costs = self.calculate_token_costs(
                            input_text_tokens,
                            output_text_tokens,
                            cached_input_text_tokens,
                            llm_model_id,
                        )
                        input_text_price = costs["input_price"]
                        output_text_price = costs["output_price"]
                        cached_input_text_price = costs["cached_input_price"]
                        llm_model_pricing_id = costs["pricing_id"]

                        log.debug(
                            f"Tracked dupes LLM usage: model={model_key}, "
                            f"input_tokens={input_text_tokens}, output_tokens={output_text_tokens}, "
                            f"cached_tokens={cached_input_text_tokens}, "
                            f"total_cost=${(input_text_price or 0) + (output_text_price or 0) + (cached_input_text_price or 0):.6f}"
                        )
                    else:
                        log.warning(f"Could not find LLM model for key: {model_key}")

                except Exception as e:
                    log.error(f"Failed to track LLM tokens for dupes: {e}")
                    # Continue with None values

            # Convert string UUIDs back to UUID objects for database
            workspace_uuid = uuid.UUID(workspace_id)
            project_uuid = uuid.UUID(project_id) if project_id else None
            issue_uuid = uuid.UUID(issue_id) if issue_id else None
            user_uuid = uuid.UUID(user_id) if user_id else None

            # Create DupesTracking record (JSONB fields accept dict/list directly)
            dupes_tracking = DupesTracking(
                workspace_id=workspace_uuid,
                project_id=project_uuid,
                issue_id=issue_uuid,
                user_id=user_uuid,
                workspace_slug=workspace_slug,
                query_title=query_title,
                query_description_length=query_description_length,
                input_workitems_text=input_workitems,  # JSONB field - no serialization needed
                output_duplicates_text=output_duplicates,  # JSONB field - no serialization needed
                vector_candidates_count=vector_candidates_count,
                vector_search_duration_ms=vector_search_duration_ms,
                llm_candidates_count=llm_candidates_count,
                llm_identified_dupes_count=llm_identified_dupes_count,
                llm_duration_ms=llm_duration_ms,
                llm_success=llm_success,
                llm_error=llm_error,
                total_duration_ms=total_duration_ms,
                # Token data from LLM response
                llm_model_id=llm_model_id,
                input_text_tokens=input_text_tokens,
                input_text_price=input_text_price,
                output_text_tokens=output_text_tokens,
                output_text_price=output_text_price,
                cached_input_text_tokens=cached_input_text_tokens,
                cached_input_text_price=cached_input_text_price,
                llm_model_pricing_id=llm_model_pricing_id,
            )

            # Add to session and commit
            self.db.add(dupes_tracking)
            self.db.commit()
            self.db.refresh(dupes_tracking)

            return dupes_tracking

        except Exception as e:
            self.db.rollback()
            log.error(f"Failed to create dupes tracking record: {e}", exc_info=True)
            return None
