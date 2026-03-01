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

import asyncio
from typing import Any

import typer

from pi import settings
from pi.core.db.fixtures import sync_llm_pricing
from pi.core.db.fixtures import sync_llms
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.core.db.plane_pi.lifecycle import init_async_db
from pi.services.retrievers.pg_store.model import add_llm_pricing_by_id
from pi.services.retrievers.pg_store.model import get_llm_model_id_from_key

app = typer.Typer()


@app.command("add-llm-pricing")
def add_llm_pricing_command(
    model_key: str = typer.Option(..., "--model-key", "-m", help="The model key from the llm_models table"),
    text_input_price: float = typer.Option(None, "--text-input-price", "--inp", help="Text input price (USD per 1M tokens)"),
    text_output_price: float = typer.Option(None, "--text-output-price", "--out", help="Text output price (USD per 1M tokens)"),
    cached_text_input_price: float = typer.Option(None, "--cached-text-input-price", "--cached", help="Cached text input price (USD per 1M tokens)"),
):
    """
    Add LLM pricing data for a specific model.
    At least one pricing option must be provided.

    Example usage:
    python manage.py add-llm-pricing --model-key gpt-4o --text-input-price 0.50 --text-output-price 1.00 --cached-text-input-price 0.25
    python manage.py add-llm-pricing -m gpt-4o-mini --inp 0.15 --out 0.60 --cached 0.075
    python manage.py add-llm-pricing -m gpt-4o --inp 2.50 --cached 1.25
    """

    if all(p is None for p in (text_input_price, text_output_price, cached_text_input_price)):
        typer.echo("Error: At least one pricing option must be provided...")
        raise typer.Exit(code=1)

    async def run():
        await init_async_db()

        async for session in get_async_session():
            # First get the model ID using existing function
            model_id = await get_llm_model_id_from_key(model_key, session)

            if not model_id:
                typer.echo(f"No model found with key '{model_key}'")
                raise typer.Exit(code=1)

            # Then add pricing using the model ID
            success, message = await add_llm_pricing_by_id(
                llm_model_id=model_id,
                db=session,
                text_input_price=text_input_price,
                text_output_price=text_output_price,
                cached_text_input_price=cached_text_input_price,
            )

            if success:
                typer.echo(f"Added pricing for '{model_key}':")
                if text_input_price is not None:
                    typer.echo(f"Text Input Price: ${text_input_price}/1M tokens")
                if text_output_price is not None:
                    typer.echo(f"Text Output Price: ${text_output_price}/1M tokens")
                if cached_text_input_price is not None:
                    typer.echo(f"Cached Text Input Price: ${cached_text_input_price}/1M tokens")
            else:
                typer.echo(message)
                raise typer.Exit(code=1)

    asyncio.run(run())


@app.command("sync-llms")
def sync_llms_fixture():
    """Sync the LLMs table with fixture data."""

    async def run():
        await init_async_db()
        await sync_llms()

    asyncio.run(run())


@app.command("sync-llm-pricing")
def sync_llm_pricing_fixture():
    """Sync the LLM pricing table with fixture data."""

    async def run():
        await init_async_db()
        await sync_llm_pricing()

    asyncio.run(run())


@app.command("validate-llm-key")
def validate_llm_key(provider: str = typer.Option(..., "--provider", "-p", help="Provider name: openai, anthropic, groq, cohere")):
    """
    Validate LLM provider API key by making a test API call.

    This command checks if the API key is configured and valid by making
    a minimal test call to the provider's API.

    Example usage:
        python -m pi.manage validate-llm-key --provider openai
        python -m pi.manage validate-llm-key -p anthropic
        python -m pi.manage validate-llm-key -p groq
        python -m pi.manage validate-llm-key -p cohere
    """
    from pi.services.llm.validators import validate_anthropic_key
    from pi.services.llm.validators import validate_cohere_key
    from pi.services.llm.validators import validate_custom_llm
    from pi.services.llm.validators import validate_groq_key
    from pi.services.llm.validators import validate_openai_key

    provider = provider.lower()

    # Map provider names to validation functions and config
    provider_map: dict[str, dict[str, Any]] = {
        "openai": {
            "validator": validate_openai_key,
            "api_key": settings.llm_config.OPENAI_API_KEY,
            "base_url": settings.llm_config.OPENAI_BASE_URL,
            "env_var": "OPENAI_API_KEY",
        },
        "anthropic": {
            "validator": validate_anthropic_key,
            "api_key": settings.llm_config.CLAUDE_API_KEY,
            "base_url": settings.llm_config.CLAUDE_BASE_URL,
            "env_var": "CLAUDE_API_KEY",
        },
        "groq": {
            "validator": validate_groq_key,
            "api_key": settings.llm_config.GROQ_API_KEY,
            "base_url": settings.llm_config.GROQ_BASE_URL,
            "env_var": "GROQ_API_KEY",
        },
        "cohere": {
            "validator": validate_cohere_key,
            "api_key": settings.llm_config.COHERE_API_KEY,
            "base_url": settings.llm_config.COHERE_BASE_URL,
            "env_var": "COHERE_API_KEY",
        },
        "custom": {
            "validator": validate_custom_llm,
            "api_key": settings.llm_config.CUSTOM_LLM_API_KEY,
            "base_url": settings.llm_config.CUSTOM_LLM_BASE_URL,
            "env_var": "CUSTOM_LLM_API_KEY",
        },
    }

    if provider not in provider_map:
        typer.echo(f"❌ Error: Unknown provider '{provider}'")
        typer.echo(f"   Supported providers: {", ".join(provider_map.keys())}")
        raise typer.Exit(code=1)

    config = provider_map[provider]

    typer.echo(f"Validating {provider.upper()} API key...")
    typer.echo(f"Environment variable: {config["env_var"]}")

    # Check if API key is configured (skip for custom provider — key is optional)
    api_key = str(config["api_key"]) if config["api_key"] else ""
    if provider != "custom" and (not api_key or not api_key.strip()):
        typer.echo(f"❌ {provider.upper()} API key not configured")
        typer.echo(f"   Please set {config["env_var"]} environment variable")
        raise typer.Exit(code=1)

    # Show base URL if configured
    base_url = str(config["base_url"]) if config["base_url"] else None
    if base_url:
        typer.echo(f"Custom base URL: {base_url}")

    # Validate the key
    validator_func = config["validator"]
    is_valid, message = validator_func(api_key=api_key, base_url=base_url)

    if is_valid:
        typer.echo(f"✅ {message}")
    else:
        typer.echo(f"❌ {message}")
        raise typer.Exit(code=1)
