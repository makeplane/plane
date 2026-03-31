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

# Python imports
import asyncio

import typer

# Third-party imports
from sqlmodel import select

from pi.app.models import LlmModel
from pi.app.models import LlmModelPricing
from pi.core.db.fixtures.llms import llm_id_map
from pi.core.db.plane_pi.lifecycle import get_async_session

# Pricing data with unique IDs for consistency
# https://platform.openai.com/docs/pricing
PRICING_DATA = [
    {
        "id": "85c2f113-0c4e-4ad3-b5f9-1bada9e0ad24",
        "llm_model_id": llm_id_map["gpt-4o"],
        "text_input_price": 2.50,
        "text_output_price": 10.00,
        "cached_text_input_price": 1.25,
        "web_search_call_price": None,
    },
    {
        "id": "1c8f3b5e-6f4a-4b8e-9d2b-7c1e8f9a0d1b",
        "llm_model_id": llm_id_map["gpt-4o-search-preview"],
        "text_input_price": 2.50,
        "text_output_price": 10.00,
        "cached_text_input_price": None,
        "web_search_call_price": 0.025,
    },
    {
        "id": "b6f5e0de-4c21-4f32-82d6-5a99c0d1aee4",
        "llm_model_id": llm_id_map["gpt-4o-mini"],
        "text_input_price": 0.15,
        "text_output_price": 0.60,
        "cached_text_input_price": 0.075,
        "web_search_call_price": None,
    },
    {
        "id": "e9a95f3d-f54e-4a83-8f0b-18f084e4120d",
        "llm_model_id": llm_id_map["gpt-4.1"],
        "text_input_price": 2.00,
        "text_output_price": 8.00,
        "cached_text_input_price": 0.50,
        "web_search_call_price": None,
    },
    {
        "id": "4c880df9-0b57-4dec-b511-6fd40ea85308",
        "llm_model_id": llm_id_map["gpt-4.1-nano"],
        "text_input_price": 0.10,
        "text_output_price": 0.40,
        "cached_text_input_price": 0.025,
        "web_search_call_price": None,
    },
    {
        "id": "f1e2d3c4-b5a6-9780-1234-567890abcdef",
        "llm_model_id": llm_id_map["gpt-5-standard"],
        "text_input_price": 1.25,
        "text_output_price": 10.00,
        "cached_text_input_price": 0.125,
        "web_search_call_price": None,
    },
    {
        "id": "a2b3c4d5-e6f7-8901-2345-6789abcdef01",
        "llm_model_id": llm_id_map["gpt-5-fast"],
        "text_input_price": 1.25,
        "text_output_price": 10.00,
        "cached_text_input_price": 0.125,
        "web_search_call_price": None,
    },
    {
        "id": "4d83f706-b085-417b-ad65-ffd66cc34d34",
        "llm_model_id": llm_id_map["gpt-5.1"],
        "text_input_price": 1.25,
        "text_output_price": 10.00,
        "cached_text_input_price": 0.125,
        "web_search_call_price": None,
    },
    {
        "id": "39bdcf93-feec-4fb6-813d-b8168abcf127",
        "llm_model_id": llm_id_map["gpt-5.2"],
        "text_input_price": 1.75,
        "text_output_price": 14.00,
        "cached_text_input_price": 0.175,
        "web_search_call_price": None,
    },
    {
        "id": "5800b210-c13c-49ea-9563-0d07fd380701",
        "llm_model_id": llm_id_map["gpt-5.4"],
        "text_input_price": 2.50,
        "text_output_price": 15.00,
        "cached_text_input_price": 0.25,
        "web_search_call_price": None,
    },
    {
        "id": "0344a9f5-92f6-40f8-8cb0-288cf13b0a96",
        "llm_model_id": llm_id_map["claude-sonnet-4-0"],
        "text_input_price": 3.00,
        "text_output_price": 15.00,
        "cached_text_input_price": 1.50,
        "web_search_call_price": 0.01,
    },
    {
        "id": "23b1da39-603e-4963-bbe9-945576a33645",
        "llm_model_id": llm_id_map["gpt-5-mini"],
        "text_input_price": 0.25,
        "text_output_price": 2,
        "cached_text_input_price": 0.025,
        "web_search_call_price": None,
    },
    {
        "id": "07b6902b-2dae-4baf-b701-86cea826364d",
        "llm_model_id": llm_id_map["gpt-5-nano"],
        "text_input_price": 0.05,
        "text_output_price": 0.4,
        "cached_text_input_price": 0.005,
        "web_search_call_price": None,
    },
    {
        "id": "b3b17125-1ef2-4bb1-8dda-d57c4575ef90",
        "llm_model_id": llm_id_map["claude-sonnet-4-5"],
        "text_input_price": 3.00,
        "text_output_price": 15.00,
        "cached_text_input_price": 1.50,
        "web_search_call_price": 0.01,
    },
    {
        "id": "a4c8e2f1-7b3d-4e9a-8f5c-6d1a2b3c4d5e",
        "llm_model_id": llm_id_map["claude-sonnet-4-6"],
        "text_input_price": 3.00,
        "text_output_price": 15.00,
        "cached_text_input_price": 1.50,
        "web_search_call_price": 0.01,
    },
    {
        "id": "c5d6e7f8-9a0b-1c2d-3e4f-5a6b7c8d9e0f",
        "llm_model_id": llm_id_map["kimi-k2"],
        "text_input_price": 1.00,
        "text_output_price": 3.00,
        "cached_text_input_price": 0.50,
        "web_search_call_price": None,
    },
]

tracked_fields = ["text_input_price", "text_output_price", "cached_text_input_price", "web_search_call_price"]


async def sync_llm_pricing():
    """Sync LLM pricing data with pricing IDs."""
    async for session in get_async_session():
        try:
            for pricing in PRICING_DATA:
                model_id = pricing["llm_model_id"]

                # Get model
                stmt_model = select(LlmModel).where(LlmModel.id == model_id)  # type: ignore[union-attr]
                result_model = await session.execute(stmt_model)
                llm_model = result_model.scalar_one_or_none()

                if not llm_model:
                    typer.echo(f"LLM model not found for key: {model_id}")
                    continue

                # Check for existing pricing
                stmt_pricing = select(LlmModelPricing).where(LlmModelPricing.id == pricing["id"]).where(LlmModelPricing.deleted_at.is_(None))  # type: ignore[union-attr]
                result_pricing = await session.execute(stmt_pricing)
                existing_pricing = result_pricing.scalar_one_or_none()

                if existing_pricing:
                    updated = False
                    for field in tracked_fields:
                        if getattr(existing_pricing, field) != pricing[field]:
                            setattr(existing_pricing, field, pricing[field])
                            updated = True

                    if updated:
                        typer.echo(f"Updated pricing for {llm_model.name}")
                    else:
                        typer.echo(f"Pricing unchanged for {llm_model.name}")
                else:
                    new_pricing = LlmModelPricing(
                        id=pricing["id"],
                        llm_model_id=llm_model.id,
                        text_input_price=pricing["text_input_price"],
                        text_output_price=pricing["text_output_price"],
                        cached_text_input_price=pricing["cached_text_input_price"],
                        web_search_call_price=pricing["web_search_call_price"],
                    )
                    session.add(new_pricing)
                    typer.echo(f"Created pricing for {llm_model.name}")

            await session.commit()
            typer.echo("LLM pricing synced successfully.")
            typer.echo("-" * 60)

        except Exception as e:
            await session.rollback()
            typer.echo(f"Error syncing pricing: {e}")


if __name__ == "__main__":
    asyncio.run(sync_llm_pricing())
