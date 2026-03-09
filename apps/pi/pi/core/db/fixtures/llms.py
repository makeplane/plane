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
import uuid

import typer

# Third-party imports
from sqlmodel import select

from pi.app.models import LlmModel
from pi.config import settings

# Module imports
from pi.core.db.plane_pi.lifecycle import get_async_session

llm_id_map = {
    "gpt-4o": "46812713-ca2d-4411-ac21-838b553501f0",
    "gpt-4o-search-preview": "9f7d3f1e-3b1d-4a5c-9a8f-1a6f0d8d2c3b",
    "gpt-4o-mini": "059fdc71-75b5-4897-93d5-b61e0ed11b7e",
    "gpt-4.1": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "gpt-4.1-nano": "fa8e33df-7130-4d3d-b4d8-ca627d3208af",
    "gpt-5-standard": "c5d6e7f8-a9b0-1234-5678-90abcdef1234",
    "gpt-5-fast": "d7e8f9a0-b1c2-3456-7890-abcdef123456",
    "gpt-5.1": "e8f9a0b1-c2d3-4567-8901-abcdef123456",
    "gpt-5.2": "f9a0b1c2-d3e4-5678-9012-bcdef2345678",
    "claude-sonnet-4-0": "60cf738d-3f6b-4fe4-b088-8c902528657f",
    "gpt-5-mini": "5e5d7fa1-0a75-4318-87c6-7595c7b7133d",
    "gpt-5-nano": "0394e887-8140-4505-b4f9-5e9c59b40396",
    "claude-sonnet-4-5": "6a14a494-dc87-42cc-9d7c-1f82faa3d018",
    "claude-sonnet-4-6": "d8e3f2a1-4b5c-6d7e-8f9a-0b1c2d3e4f5a",
    "claude-haiku-4-5": "b7c25e8f-9d41-4a3b-8e6f-2c7d4a5b6e3f",
}

# Data for sync.
LLMS_DATA = [
    {
        "id": llm_id_map["gpt-4o"],
        "name": "GPT-4o",
        "description": "OpenAI's GPT-4o model.",
        "provider": "OpenAI",
        "model_key": "gpt-4o",
        "max_tokens": 128000,
    },
    {
        "id": llm_id_map["gpt-4o-search-preview"],
        "name": "GPT-4o Search Preview",
        "description": "OpenAI's GPT-4o search preview model for web search.",
        "provider": "OpenAI",
        "model_key": "gpt-4o-search-preview",
        "max_tokens": 128000,
    },
    {
        "id": llm_id_map["gpt-4o-mini"],
        "name": "GPT-4o mini",
        "description": "OpenAI's GPT-4o mini model.",
        "provider": "OpenAI",
        "model_key": "gpt-4o-mini",
        "max_tokens": 128000,
    },
    {
        "id": llm_id_map["gpt-4.1"],
        "name": "GPT-4.1",
        "description": "OpenAI's GPT-4.1 model.",
        "provider": "OpenAI",
        "model_key": "gpt-4.1",
        "max_tokens": 128000,
    },
    {
        "id": llm_id_map["gpt-4.1-nano"],
        "name": "GPT-4.1 nano",
        "description": "OpenAI's GPT-4.1 nano model - ultra-fast and cost-efficient.",
        "provider": "OpenAI",
        "model_key": "gpt-4.1-nano",
        "max_tokens": 1000000,
    },
    {
        "id": llm_id_map["gpt-5-standard"],
        "name": "GPT-5 Standard",
        "description": "OpenAI's GPT-5 model with medium reasoning capabilities - balanced performance and speed.",
        "provider": "OpenAI",
        "model_key": "gpt-5-standard",
        "max_tokens": 200000,
    },
    {
        "id": llm_id_map["gpt-5-fast"],
        "name": "GPT-5 Fast",
        "description": "OpenAI's GPT-5 model with low reasoning capabilities - optimized for speed and cost efficiency.",
        "provider": "OpenAI",
        "model_key": "gpt-5-fast",
        "max_tokens": 200000,
    },
    {
        "id": llm_id_map["gpt-5.1"],
        "name": "GPT-5.1",
        "description": "OpenAI's GPT-5.1 model - latest standard model.",
        "provider": "OpenAI",
        "model_key": "gpt-5.1",
        "max_tokens": 200000,
    },
    {
        "id": llm_id_map["gpt-5.2"],
        "name": "GPT-5.2",
        "description": "OpenAI's GPT-5.2 model - enhanced reasoning with extended context.",
        "provider": "OpenAI",
        "model_key": "gpt-5.2",
        "max_tokens": 400000,
    },
    {
        "id": llm_id_map["claude-sonnet-4-0"],
        "name": "Claude Sonnet 4.0",
        "description": "Anthropic's Claude Sonnet 4.0 model.",
        "provider": "Anthropic",
        "model_key": "claude-sonnet-4-0",
        "max_tokens": 200000,
    },
    {
        "id": llm_id_map["gpt-5-mini"],
        "name": "GPT-5 Mini",
        "description": "A faster, cheaper version of GPT-5 for well-defined tasks.",
        "provider": "OpenAI",
        "model_key": "gpt-5-mini",
        "max_tokens": 400000,
    },
    {
        "id": llm_id_map["gpt-5-nano"],
        "name": "GPT-5 Nano",
        "description": "The fastest, cheapest version of GPT-5",
        "provider": "OpenAI",
        "model_key": "gpt-5-nano",
        "max_tokens": 400000,
    },
    {
        "id": llm_id_map["claude-sonnet-4-5"],
        "name": "Claude Sonnet 4.5",
        "description": "Anthropic's Claude Sonnet 4.5 model.",
        "provider": "Anthropic",
        "model_key": "claude-sonnet-4-5",
        "max_tokens": 200000,
    },
    {
        "id": llm_id_map["claude-sonnet-4-6"],
        "name": "Claude Sonnet 4.6",
        "description": "Anthropic's Claude Sonnet 4.6 model - combination of speed and intelligence.",
        "provider": "Anthropic",
        "model_key": "claude-sonnet-4-6",
        "max_tokens": 200000,
    },
    {
        "id": llm_id_map["claude-haiku-4-5"],
        "name": "Claude Haiku 4.5",
        "description": "Anthropic's Claude Haiku 4.5 model - fast and cost-efficient.",
        "provider": "Anthropic",
        "model_key": "claude-haiku-4-5",
        "max_tokens": 200000,
    },
]

# Dynamically add custom model if configured

if settings.llm_config.CUSTOM_LLM_ENABLED and settings.llm_config.CUSTOM_LLM_MODEL_KEY:
    _custom_key = settings.llm_config.CUSTOM_LLM_MODEL_KEY
    if _custom_key and _custom_key not in llm_id_map:
        # Deterministic UUID from model key for idempotent sync
        llm_id_map[_custom_key] = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"plane-custom-llm-{_custom_key}"))
        LLMS_DATA.append({
            "id": llm_id_map[_custom_key],
            "name": settings.llm_config.CUSTOM_LLM_NAME,
            "description": settings.llm_config.CUSTOM_LLM_DESCRIPTION,
            "provider": settings.llm_config.CUSTOM_LLM_PROVIDER,
            "model_key": _custom_key,
            "max_tokens": int(settings.llm_config.CUSTOM_LLM_MAX_TOKENS),
        })

tracked_fields = ["name", "description", "provider", "model_key", "max_tokens"]


async def sync_llms():
    async for session in get_async_session():
        try:
            for llm_data in LLMS_DATA:
                llm_id = llm_data.get("id")

                statement = select(LlmModel).where(LlmModel.id == llm_id)  # type: ignore[var-annotated]
                execution = await session.exec(statement)
                llm = execution.first()

                if llm:
                    updated = False
                    for key in tracked_fields:
                        old_val = getattr(llm, key)
                        new_val = llm_data.get(key)

                        if old_val != new_val:
                            setattr(llm, key, new_val)
                            updated = True

                    if updated:
                        typer.echo(f"Updated LLM: {llm.name}")
                    else:
                        typer.echo(f"Unchanged LLM: {llm.name}")
                else:
                    new_llm_model = LlmModel(**llm_data)
                    session.add(new_llm_model)
                    typer.echo(f"Created LLM: {llm_data["name"]}")

            await session.commit()
            typer.echo("LLMs synced successfully.")
            typer.echo("-" * 60)
        except Exception as e:
            await session.rollback()
            typer.echo(f"An error occurred during sync: {e}")


if __name__ == "__main__":
    asyncio.run(sync_llms())
