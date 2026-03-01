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

"""Token tracking utilities for LLM usage monitoring and cost calculation."""

from typing import Any
from typing import Dict
from typing import Optional
from uuid import UUID

from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.models.enums import MessageMetaStepType
from pi.services.llm.llms import _is_custom_model
from pi.services.retrievers.pg_store.message import upsert_message_meta
from pi.services.retrievers.pg_store.model import get_llm_model_id_from_key
from pi.services.retrievers.pg_store.model import get_llm_pricing

log = logger.getChild(__name__)


class TokenTracker:
    """Utility class for tracking LLM token usage and costs."""

    def __init__(self, db: AsyncSession, message_id: Optional[UUID] = None):
        """
        Initialize token tracker.

        Args:
            db: Database session
            message_id: Optional message ID to associate with token usage
        """
        self.db = db
        self.message_id = message_id

    def extract_token_usage(self, llm_response: Any) -> Dict[str, int]:
        """
        Extract token usage from LLM response.

        Args:
            llm_response: The response from LLM invoke() call or streaming chunk with usage_metadata

        Returns:
            Dictionary with input_tokens, output_tokens, and cached_input_tokens, defaults to 0 if not found
        """
        try:
            # Handle common structured-output pattern: {"raw": <AIMessage or dict>, "parsed": ...}
            if isinstance(llm_response, dict) and "raw" in llm_response:
                candidate = llm_response.get("raw")
                # If raw is an object (e.g., AIMessage), try attributes first
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
                # If raw is a dict, check common locations there as well
                if isinstance(candidate, dict):
                    usage = candidate.get("usage_metadata") or {}
                    if usage:
                        input_token_details = usage.get("input_token_details", {}) if isinstance(usage, dict) else {}
                        return {
                            "input_tokens": usage.get("input_tokens", 0),
                            "output_tokens": usage.get("output_tokens", 0),
                            "cached_input_tokens": input_token_details.get("cache_read", 0) if isinstance(input_token_details, dict) else 0,
                        }
                    metadata = candidate.get("response_metadata") or {}
                    token_usage = metadata.get("token_usage", {}) if isinstance(metadata, dict) else {}
                    if token_usage:
                        return {
                            "input_tokens": token_usage.get("prompt_tokens", 0),
                            "output_tokens": token_usage.get("completion_tokens", 0),
                            "cached_input_tokens": 0,
                        }

            # Check for usage_metadata directly on the response (non-dict objects)
            if not isinstance(llm_response, dict) and hasattr(llm_response, "usage_metadata") and getattr(llm_response, "usage_metadata"):
                usage = llm_response.usage_metadata
                input_token_details = usage.get("input_token_details", {})
                return {
                    "input_tokens": usage.get("input_tokens", 0),
                    "output_tokens": usage.get("output_tokens", 0),
                    "cached_input_tokens": input_token_details.get("cache_read", 0),
                }

            # Check if response is a dict with usage_metadata key
            if isinstance(llm_response, dict) and "usage_metadata" in llm_response:
                usage = llm_response["usage_metadata"]
                input_token_details = usage.get("input_token_details", {})
                return {
                    "input_tokens": usage.get("input_tokens", 0),
                    "output_tokens": usage.get("output_tokens", 0),
                    "cached_input_tokens": input_token_details.get("cache_read", 0),
                }

            # Check for response_metadata (alternative location in some LangChain responses)
            if not isinstance(llm_response, dict) and hasattr(llm_response, "response_metadata") and getattr(llm_response, "response_metadata"):
                metadata = getattr(llm_response, "response_metadata")
                token_usage = metadata.get("token_usage", {})
                if token_usage:
                    return {
                        "input_tokens": token_usage.get("prompt_tokens", 0),
                        "output_tokens": token_usage.get("completion_tokens", 0),
                        "cached_input_tokens": 0,
                    }

        except Exception as e:
            log.error(f"Error extracting token usage: {e}")

        return {"input_tokens": 0, "output_tokens": 0, "cached_input_tokens": 0}

    def extract_actual_model_used(self, llm_response: Any) -> Optional[str]:
        """
        Extract the actual model name used from LLM response metadata.

        Args:
            llm_response: The response from LLM invoke() call

        Returns:
            String with actual model name used, or None if not found
        """
        try:
            # Handle common structured-output pattern: {"raw": <AIMessage or dict>, "parsed": ...}
            if isinstance(llm_response, dict) and "raw" in llm_response:
                candidate = llm_response.get("raw")
                # If raw is an object (e.g., AIMessage), try attributes first
                if candidate is not None and not isinstance(candidate, dict):
                    if hasattr(candidate, "response_metadata") and getattr(candidate, "response_metadata"):
                        metadata = getattr(candidate, "response_metadata", {})
                        # Check different locations where model name might be stored
                        actual_model = metadata.get("model", None) or metadata.get("model_name", None) or metadata.get("model_id", None)
                        if actual_model:
                            return actual_model
                # If raw is a dict, check common locations there as well
                if isinstance(candidate, dict):
                    metadata = candidate.get("response_metadata") or {}
                    actual_model = metadata.get("model", None) or metadata.get("model_name", None) or metadata.get("model_id", None)
                    if actual_model:
                        return actual_model

            # Check for response_metadata directly on the response (non-dict objects)
            if not isinstance(llm_response, dict) and hasattr(llm_response, "response_metadata") and getattr(llm_response, "response_metadata"):
                metadata = getattr(llm_response, "response_metadata")
                actual_model = metadata.get("model", None) or metadata.get("model_name", None) or metadata.get("model_id", None)
                if actual_model:
                    return actual_model

            # Check if response is a dict with response_metadata key
            if isinstance(llm_response, dict) and "response_metadata" in llm_response:
                metadata = llm_response["response_metadata"]
                actual_model = metadata.get("model", None) or metadata.get("model_name", None) or metadata.get("model_id", None)
                if actual_model:
                    return actual_model

        except Exception as e:
            log.error(f"Error extracting actual model used: {e}")

        return None

    async def calculate_token_costs(
        self,
        non_cached_input_tokens: int,
        output_tokens: int,
        cached_input_tokens: int,
        llm_model_id: UUID,
    ) -> Dict[str, Any]:
        """
        Calculate USD costs for input, output, and cached input tokens based on pricing data.

        Args:
            non_cached_input_tokens: Number of non-cached input tokens
            output_tokens: Number of output tokens
            cached_input_tokens: Number of cached input tokens
            llm_model_id: The LLM model UUID

        Returns:
            Dictionary with input_price, output_price, cached_input_price, and pricing_id
        """
        try:
            # Fetch pricing data from database
            pricing = await get_llm_pricing(llm_model_id, self.db)

            if not pricing:
                log.warning(f"No pricing data found for LLM model ID: {llm_model_id}")
                return {"input_price": 0.0, "output_price": 0.0, "cached_input_price": 0.0, "pricing_id": None}

            # Pricing is stored per-million tokens
            input_price_per_million = pricing.text_input_price or 0.0
            output_price_per_million = pricing.text_output_price or 0.0
            cached_input_price_per_million = pricing.cached_text_input_price or 0.0

            # Calculate costs and round to 6 decimal places
            non_cached_input_cost_usd = round((non_cached_input_tokens / 1_000_000) * input_price_per_million, 6)
            cached_input_cost_usd = round((cached_input_tokens / 1_000_000) * cached_input_price_per_million, 6)
            output_cost_usd = round((output_tokens / 1_000_000) * output_price_per_million, 6)

            return {
                "input_price": non_cached_input_cost_usd,
                "output_price": output_cost_usd,
                "cached_input_price": cached_input_cost_usd,
                "pricing_id": pricing.id,
            }

        except Exception as e:
            log.error(f"Error calculating token costs: {e}")
            return {"input_price": 0.0, "output_price": 0.0, "cached_input_price": 0.0, "pricing_id": None}

    async def track_llm_usage(
        self,
        llm_response: Any,
        model_key: str,
        step_type: MessageMetaStepType,
        message_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Track LLM usage and store in database.

        Args:
            llm_response: The response from LLM invoke() call
            model_key: The model key (e.g., "gpt-4o", "gpt-4.1")
            step_type: The type of step (e.g., MessageMetaStepType.SQL_GENERATION)
            message_id: Optional message ID (uses instance default if not provided)

        Returns:
            Dictionary with tracking results
        """
        try:
            # Use provided message_id or instance default
            msg_id = message_id or self.message_id
            if not msg_id:
                log.warning("No message ID provided for token tracking")
                return {"message": "error", "error": "No message ID provided"}

            # Extract token usage from response
            token_usage = self.extract_token_usage(llm_response)
            total_input_tokens = token_usage["input_tokens"]
            output_tokens = token_usage["output_tokens"]
            cached_input_tokens = token_usage["cached_input_tokens"]
            non_cached_input_tokens = total_input_tokens - cached_input_tokens

            # Extract and verify actual model used from response metadata
            actual_model_used = self.extract_actual_model_used(llm_response)
            if settings.llm_config.ENABLE_MODEL_VERIFICATION_LOGGING:
                if actual_model_used:
                    if actual_model_used != model_key:
                        log.info(f"MODEL VERIFICATION: Expected '{model_key}', Actually used '{actual_model_used}' (Step: {step_type.value})")
                    else:
                        log.info(f"MODEL VERIFICATION: Confirmed model '{model_key}' used correctly (Step: {step_type.value})")
                else:
                    log.warning(
                        f"MODEL VERIFICATION: Could not extract actual model used from response metadata for '{model_key}' (Step: {step_type.value})"
                    )
            log.info(
                f"Tracking LLM usage for message: {msg_id} (Step: {step_type.value}, Model: {model_key}) - Total input tokens: {total_input_tokens}, Output tokens: {output_tokens}, Cached input tokens: {cached_input_tokens}"  # noqa: E501
            )

            # Get LLM model ID
            llm_model_id = await get_llm_model_id_from_key(model_key, self.db)
            if not llm_model_id:
                if _is_custom_model(model_key):
                    log.warning(f"Custom model '{model_key}' not found in DB — run 'sync-llms'. Skipping tracking.")
                    return {"message": "skipped", "reason": "custom model not synced"}
                log.error(f"Could not find LLM model ID for key: {model_key}")
                return {"message": "error", "error": f"LLM model not found: {model_key}"}

            # Calculate token costs and get pricing ID
            costs = await self.calculate_token_costs(non_cached_input_tokens, output_tokens, cached_input_tokens, llm_model_id)
            input_price = costs["input_price"]
            output_price = costs["output_price"]
            cached_input_price = costs["cached_input_price"]
            pricing_id = costs["pricing_id"]

            # Store in database with tokens, prices, and pricing ID
            result = await upsert_message_meta(
                db=self.db,
                message_id=msg_id,
                llm_model_id=llm_model_id,
                step_type=step_type,
                input_text_tokens=non_cached_input_tokens,
                output_text_tokens=output_tokens,
                cached_input_text_tokens=cached_input_tokens,
                input_text_price=input_price,
                output_text_price=output_price,
                cached_input_text_price=cached_input_price,
                llm_model_pricing_id=pricing_id,
            )

            return result

        except Exception as e:
            log.error(f"Error tracking LLM usage: {e}")
            return {"message": "error", "error": str(e)}

    async def track_entity_llm_usage(
        self,
        llm_response: Any,
        model_key: str,
        entity_type: str,
        entity_id: UUID,
        workspace_id: UUID,
        user_id: UUID,
        usage_type: Optional[str] = None,
        usage_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Track LLM usage for entities (pages, wikis, etc.) and store in LlmModelUsageTracking table.

        Args:
            llm_response: The response from LLM invoke() call
            model_key: The model key (e.g., "gpt-4o", "gpt-4.1")
            entity_type: Type of entity (e.g., "page", "wiki")
            entity_id: ID of the entity
            workspace_id: Workspace ID
            user_id: User ID
            usage_type: Optional usage type (e.g., "ai_block", "summarize")
            usage_id: Optional usage ID (e.g., block_id)

        Returns:
            Dictionary with tracking results
        """
        try:
            # Import here to avoid circular dependency
            from pi.services.retrievers.pg_store.model import upsert_llm_model_usage_tracking

            # Extract token usage from response
            token_usage = self.extract_token_usage(llm_response)
            total_input_tokens = token_usage["input_tokens"]
            output_tokens = token_usage["output_tokens"]
            cached_input_tokens = token_usage["cached_input_tokens"]
            non_cached_input_tokens = total_input_tokens - cached_input_tokens

            # Get LLM model ID
            llm_model_id = await get_llm_model_id_from_key(model_key, self.db)
            if not llm_model_id:
                if _is_custom_model(model_key):
                    log.warning(f"Custom model '{model_key}' not found in DB — run 'sync-llms'. Skipping entity tracking.")
                    return {"success": True, "message": "skipped", "reason": "custom model not synced"}
                log.error(f"Could not find LLM model ID for key: {model_key}")
                return {"success": False, "error": f"LLM model not found: {model_key}"}

            # Calculate token costs
            costs = await self.calculate_token_costs(non_cached_input_tokens, output_tokens, cached_input_tokens, llm_model_id)

            # Store in database
            result = await upsert_llm_model_usage_tracking(
                db=self.db,
                entity_type=entity_type,
                entity_id=entity_id,
                usage_type=usage_type,
                usage_id=usage_id,
                workspace_id=workspace_id,
                user_id=user_id,
                llm_model_id=llm_model_id,
                input_text_tokens=total_input_tokens,
                input_text_price=costs["input_price"],
                output_text_tokens=output_tokens,
                output_text_price=costs["output_price"],
                cached_input_text_tokens=cached_input_tokens,
                cached_input_text_price=costs["cached_input_price"],
            )

            return result

        except Exception as e:
            log.error(f"Error tracking entity LLM usage: {e}")
            return {"success": False, "error": str(e)}

    async def track_web_search_usage(
        self,
        *,
        model_key: str,
        input_tokens: int,
        output_tokens: int,
        cached_input_tokens: int = 0,
        message_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Track web search usage and store in MessageMeta with WEB_SEARCH step type.

        Args:
            model_key: Model key used for the web search call
            input_tokens: Total input tokens
            output_tokens: Output tokens
            cached_input_tokens: Cached input tokens (if any)
            message_id: Optional message ID (uses instance default if not provided)

        Returns:
            Dictionary with tracking results
        """
        try:
            msg_id = message_id or self.message_id
            if not msg_id:
                log.warning("No message ID provided for web search tracking")
                return {"message": "error", "error": "No message ID provided"}

            llm_model_id = await get_llm_model_id_from_key(model_key, self.db)
            if not llm_model_id:
                log.warning(f"Web search model not found in llm_models: {model_key}")
                return {"message": "error", "error": f"LLM model not found: {model_key}"}

            non_cached_input_tokens = max(0, int(input_tokens or 0) - int(cached_input_tokens or 0))

            costs = await self.calculate_token_costs(
                non_cached_input_tokens,
                int(output_tokens or 0),
                int(cached_input_tokens or 0),
                llm_model_id,
            )

            input_price = costs["input_price"]
            output_price = costs["output_price"]
            cached_input_price = costs["cached_input_price"]
            pricing_id = costs["pricing_id"]

            pricing = await get_llm_pricing(llm_model_id, self.db)
            if pricing and pricing.web_search_call_price:
                input_price += float(pricing.web_search_call_price)
                if pricing_id is None:
                    pricing_id = pricing.id

            result = await upsert_message_meta(
                db=self.db,
                message_id=msg_id,
                llm_model_id=llm_model_id,
                step_type=MessageMetaStepType.WEB_SEARCH,
                input_text_tokens=int(input_tokens or 0),
                output_text_tokens=int(output_tokens or 0),
                cached_input_text_tokens=int(cached_input_tokens or 0),
                input_text_price=input_price,
                output_text_price=output_price,
                cached_input_text_price=cached_input_price,
                llm_model_pricing_id=pricing_id,
            )

            return result
        except Exception as e:
            log.error(f"Error tracking web search usage: {e}")
            return {"message": "error", "error": str(e)}


async def track_llm_call(
    llm_response: Any,
    model_key: str,
    step_type: MessageMetaStepType,
    message_id: UUID,
    db: AsyncSession,
) -> None:
    """
    Convenience function to track a single LLM call.

    Args:
        llm_response: The response from LLM invoke() call
        model_key: The model key (e.g., "gpt-4o", "gpt-4.1")
        step_type: The type of step
        message_id: Message ID to associate with usage
        db: Database session
    """
    tracker = TokenTracker(db, message_id)
    await tracker.track_llm_usage(llm_response, model_key, step_type)
