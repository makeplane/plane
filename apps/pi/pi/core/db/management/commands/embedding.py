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
import os
import sys
from copy import deepcopy

import typer
from opensearchpy import NotFoundError
from opensearchpy import RequestError

from pi import logger
from pi import settings
from pi.app.models.embedding_model import EmbeddingModel
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.core.db.plane_pi.lifecycle import init_async_db
from pi.core.embedding_config import get_available_embedding_models
from pi.core.embedding_config import get_embedding_model_config
from pi.core.vectordb.client import VectorStore
from pi.services.retrievers.pg_store import create_embedding_model as create_embedding_model_db
from pi.services.retrievers.pg_store import deactivate_embedding_model
from pi.services.retrievers.pg_store import get_active_embedding_model
from pi.services.retrievers.pg_store import get_all_active_embedding_models
from pi.services.retrievers.pg_store import get_ml_model_id_sync

log = logger.getChild(__name__)

app = typer.Typer()
ML_MODEL_ID = get_ml_model_id_sync()


def _build_connector_config(model_key: str, custom_base_url: str = "") -> dict:
    """
    Build connector configuration for any supported embedding model.

    Args:
        model_key: Key from EMBEDDING_MODELS (e.g., "cohere/embed-v4.0")
        custom_base_url: Optional override for base URL

    Returns:
        dict: Connector configuration for OpenSearch
    """
    config = get_embedding_model_config(model_key)

    # Get API key from environment
    api_key = os.getenv(config["api_key_env"], "")
    if not api_key and config["provider"] != "bedrock":
        raise ValueError(f"{config['api_key_env']} environment variable not set")

    # Build credentials based on provider
    if config["provider"] == "bedrock":
        credential = {
            "access_key": settings.BR_AWS_ACCESS_KEY_ID,
            "secret_key": settings.BR_AWS_SECRET_ACCESS_KEY,
        }
        # Only include session token if it's set
        session_token = settings.BR_AWS_SESSION_TOKEN or None
        if session_token:
            credential["session_token"] = session_token
    else:
        credential = {config["credential_key"]: api_key.strip()}

    # Use custom URL or default
    embed_url = custom_base_url.rstrip("/") if custom_base_url else config["base_url"]

    return {
        "name": f"{config['provider'].title()} {config['model_name']} Embed Model",
        "description": f"Connector to {config['provider']} {config['model_name']} embedding API",
        "version": "1",
        "protocol": config["protocol"],
        "credential": credential,
        "parameters": config["parameters"],
        "actions": [
            {
                "action_type": "predict",
                "method": "POST",
                "url": embed_url,
                "headers": config["headers"],
                "request_body": config["request_body"],
                "pre_process_function": config["pre_process"],
                "post_process_function": config["post_process"],
            }
        ],
    }


def _build_model_registration_config(connector_id: str, model_key: str) -> dict:
    """
    Build ML model registration configuration.

    Args:
        connector_id: OpenSearch connector ID
        model_key: Key from EMBEDDING_MODELS (e.g., "cohere/embed-v4.0")

    Returns:
        dict: Model registration configuration
    """
    config = get_embedding_model_config(model_key)
    # Create a safe name: replace slashes, dots, and dashes
    safe_name = model_key.replace("/", "_").replace(".", "_").replace("-", "_")
    return {
        "name": safe_name,
        "function_name": "remote",
        "connector_id": connector_id,
        "description": f"{config['provider'].title()} {config['model_name']} embedding model",
    }


def _log_connector_payload(connector_config: dict) -> None:
    """
    Log the connector payload with the credential redacted so it can be
    copy–pasted into Dev Tools for debugging.
    """
    try:
        redacted = deepcopy(connector_config)

        # Redact API key from headers in actions
        for action in redacted.get("actions", []):
            headers = action.get("headers", {})
            if isinstance(headers, dict) and "Authorization" in headers:
                auth_value = str(headers["Authorization"])
                if auth_value.startswith("Bearer "):
                    key_len = len(auth_value) - 7  # subtract "Bearer " prefix
                    headers["Authorization"] = f"Bearer ***REDACTED (len={key_len})***"
    except Exception as e:
        log.warning("Failed to serialize connector payload for debug: %s", e)


@app.command("check-embedding-model")
def check_embedding_model(model_name: str = typer.Option("embed-v4.0", "--model-name", help="Model name to check for (e.g., 'embed-v4.0')")):
    """
    Check if embedding model is configured.

    This command checks:
    1. If OPENSEARCH_ML_MODEL_ID is set
    2. If active model exists in database and OpenSearch

    Example:
        python -m pi.manage check-embedding-model
        python -m pi.manage check-embedding-model --model-name embed-v4.0
    """

    async def run():
        try:
            await init_async_db()

            # Check if OPENSEARCH_ML_MODEL_ID is set
            ml_model_id = ML_MODEL_ID
            if ml_model_id and ml_model_id.strip():
                typer.echo(f"Model ID configured: {ml_model_id}")
                return

            typer.echo(f"Checking for active embedding models (model_name: {model_name})...")

            # Check for existing active models in database
            async for session in get_async_session():
                active_models = await get_all_active_embedding_models(session, model_name=model_name)

                if not active_models:
                    typer.echo(f"No active embedding models found for model_name: {model_name}")
                    return

                typer.echo(f"Found {len(active_models)} active model(s) in database")
                for model in active_models:
                    typer.echo(f"  - Model ID: {model.model_id}")

                break

        except Exception as e:
            log.error("Failed to check embedding model: %s", e, exc_info=True)
            typer.echo(f"Failed to check embedding model: {e}")
            sys.exit(1)

    asyncio.run(run())


@app.command("init-embedding-model")
def init_embedding_model(
    model_name: str = typer.Option("embed-v4.0", "--model-name", help="Model name to check for in database (e.g., 'embed-v4.0')"),
    model: str = typer.Option("", "--model", help="Embedding model to use (e.g., 'cohere/embed-v4.0'). Defaults to EMBEDDING_MODEL env var."),
):
    """
    Check and ensure embedding model is configured for the application.

    This command checks in order:
    1. If OPENSEARCH_ML_MODEL_ID is set -> use it (do nothing)
    2. If active model exists in DB -> verify it exists in OpenSearch
    3. If required API key is set -> auto-create model
    4. Otherwise -> exit with error

    This is meant to be run at application startup.

    Examples:
        python -m pi.manage init-embedding-model
        python -m pi.manage init-embedding-model --model cohere/embed-v4.0
        python -m pi.manage init-embedding-model --model openai/text-embedding-3-small
    """

    async def run():
        try:
            # Initialize database
            await init_async_db()

            # Step 1: Check if OPENSEARCH_ML_MODEL_ID is already set
            ml_model_id = ML_MODEL_ID
            if ml_model_id and ml_model_id.strip():
                log.info("OPENSEARCH_ML_MODEL_ID already set: %s", ml_model_id)
                typer.echo(f"Using configured model ID: {ml_model_id}")
                return

            log.info("OPENSEARCH_ML_MODEL_ID not set, checking for active embedding models in database...")
            log.info("Filtering by model_name: %s", model_name)

            # Step 2: Check for existing active models in database (with parallel validation)
            async for session in get_async_session():
                # Get ALL active models for this model_name (ordered by updated_at DESC)
                active_models = await get_all_active_embedding_models(session, model_name=model_name)

                if not active_models:
                    log.info("No active embedding models found in database for model_name=%s", model_name)
                    break

                log.info("Found %d active model(s) in database for model_name=%s", len(active_models), model_name)

                # Helper function to check a single model in OpenSearch
                async def check_model(model_record: EmbeddingModel) -> tuple[EmbeddingModel, bool, str]:
                    """
                    Check if a model exists in OpenSearch.
                    Returns: (model, exists, error_msg)
                    """
                    # Skip models without model_id
                    if not model_record.model_id:
                        return (model_record, False, "Model ID is not set")

                    try:
                        vs = VectorStore()
                        try:
                            model_status = vs.get_ml_model_status(model_record.model_id)
                            log.info("Model %s exists in OpenSearch with state: %s", model_record.model_id, model_status.get("model_state"))
                            return (model_record, True, "")
                        finally:
                            vs.os.close()
                    except (NotFoundError, RequestError) as e:
                        error_msg = str(e)
                        log.warning("Model %s not found in OpenSearch: %s", model_record.model_id, error_msg)
                        return (model_record, False, error_msg)
                    except Exception as e:
                        error_msg = str(e)
                        log.error("Error checking model %s in OpenSearch: %s", model_record.model_id, error_msg)
                        return (model_record, False, error_msg)

                # Check all models in parallel
                typer.echo(f"Checking {len(active_models)} model(s) in OpenSearch...")
                check_tasks = [check_model(model_record) for model_record in active_models]
                results = await asyncio.gather(*check_tasks)

                # Process results: find first valid model, deactivate invalid ones
                valid_model = None
                models_to_deactivate = []

                for model_record, exists, error_msg in results:
                    if exists:
                        if valid_model is None:
                            # Use the first valid model (already sorted by updated_at DESC)
                            valid_model = model_record
                            typer.echo(f"Model {model_record.model_id} verified in OpenSearch")
                            typer.echo(f"Provider: {model_record.provider}")
                            typer.echo(f"Model: {model_record.model_name}")
                        else:
                            # Multiple valid models exist, deactivate the older ones
                            log.info("Model %s is valid but not the newest, will deactivate", model_record.model_id)  # type: ignore[unreachable]
                            models_to_deactivate.append(model_record)
                    else:
                        # Model doesn't exist, mark for deactivation
                        typer.echo(f"⚠ Model {model_record.model_id} not found in OpenSearch")
                        models_to_deactivate.append(model_record)

                # Deactivate invalid/extra models in parallel
                if models_to_deactivate:
                    typer.echo(f"Deactivating {len(models_to_deactivate)} stale model(s)...")
                    deactivate_tasks = [
                        deactivate_embedding_model(session, model_record.model_id) for model_record in models_to_deactivate if model_record.model_id
                    ]
                    await asyncio.gather(*deactivate_tasks)
                    log.info("Deactivated %d models", len(models_to_deactivate))

                # If we found a valid model, use it
                if valid_model and valid_model.model_id:
                    log.info(f"Using embedding model: {valid_model.model_id}")
                    return

            log.info("No valid embedding model found in OpenSearch, checking if we can auto-create one...")

            # Step 3: Determine which model to use and validate it
            model_key = model or settings.vector_db.EMBEDDING_MODEL
            log.info("Using embedding model: %s", model_key)

            # Validate model key
            try:
                config = get_embedding_model_config(model_key)
            except ValueError as e:
                typer.echo(f"Error: {e}")
                typer.echo(f"Available models: {', '.join(get_available_embedding_models())}")
                sys.exit(1)

            # Step 4: Check if we can auto-create a model (check API key based on provider)
            api_key = os.getenv(config["api_key_env"], "")
            if not api_key or not api_key.strip():
                log.error("Cannot setup embedding model: %s not configured", config["api_key_env"])
                typer.echo("Error: No embedding model configured")
                typer.echo("OPENSEARCH_ML_MODEL_ID is not set")
                typer.echo("No active embedding model found in database")
                typer.echo(f"{config['api_key_env']} is not set (needed to auto-create model)")
                typer.echo("")
                typer.echo("Please either:")
                typer.echo("  1. Set OPENSEARCH_ML_MODEL_ID environment variable, OR")
                typer.echo(f"  2. Set {config['api_key_env']} and run: python -m pi.manage create-embedding-model --model {model_key}")
                sys.exit(1)

            # Step 5: Auto-create the model
            log.info("%s found, auto-creating embedding model...", config["api_key_env"])
            typer.echo(f"Creating embedding model ({model_key}) automatically...")

            # Call the setup function
            await _setup_embedding_model_internal(model_key)

        except Exception as e:
            log.error("Failed to ensure embedding model: %s", e, exc_info=True)
            typer.echo(f"Failed to ensure embedding model: {e}")
            sys.exit(1)

    asyncio.run(run())


async def _setup_embedding_model_internal(model_key: str | None = None):
    """
    Internal function to setup embedding model (shared by both commands).

    Args:
        model_key: Optional model key (e.g., "cohere/embed-v4.0"). If not provided,
                   uses EMBEDDING_MODEL from settings.
    """
    vector_store = None
    try:
        # Use provided model_key or fall back to settings
        if not model_key:
            model_key = settings.vector_db.EMBEDDING_MODEL
        log.info("Setting up embedding model: %s", model_key)

        # Get model config
        config = get_embedding_model_config(model_key)

        # Initialize VectorStore client
        vector_store = VectorStore()

        # Step 2: Configure trusted endpoints from model config
        log.info("Configuring trusted endpoints...")
        try:
            _ = vector_store.configure_trusted_endpoints([config["trusted_endpoint_regex"]])
        except Exception as e:
            log.error("Failed to configure trusted endpoints: %s", e, exc_info=True)
            typer.echo(f"Failed to configure trusted endpoints: {e}")
            sys.exit(1)
        log.info("Trusted endpoints configured")

        # Step 3: Create connector using dynamic config
        log.info("Creating connector...")
        connector_config = _build_connector_config(model_key)

        _log_connector_payload(connector_config)

        try:
            connector_response = vector_store.create_ml_connector(connector_config)
        except Exception as e:
            log.error("Failed to create connector: %s", e, exc_info=True)
            typer.echo(f"Failed to create connector: {e}")
            sys.exit(1)

        connector_id = connector_response.get("connector_id")
        if not connector_id:
            log.error("No connector_id in response: %s", connector_response)
            typer.echo(f"No connector_id in response: {connector_response}")
            sys.exit(1)
        log.info("Connector created: %s", connector_id)

        # Step 4: Register model
        log.info("Registering model...")
        model_registration_config = _build_model_registration_config(connector_id, model_key)

        try:
            model_response = vector_store.register_ml_model(model_registration_config)
        except Exception as e:
            log.error("Failed to register model: %s", e, exc_info=True)
            typer.echo(f"Failed to register model: {e}")
            sys.exit(1)

        model_id = model_response.get("model_id")
        if not model_id:
            log.error("No model_id in response: %s", model_response)
            typer.echo(f"No model_id in response: {model_response}")
            sys.exit(1)
        log.info("Model registered: %s", model_id)

        # Step 5: Deploy model
        log.info("Deploying model...")
        try:
            _ = vector_store.deploy_ml_model(model_id)
        except Exception as e:
            log.error("Failed to deploy model: %s", e, exc_info=True)
            typer.echo(f"Failed to deploy model: {e}")
            sys.exit(1)

        log.info("Model deployment initiated: %s", model_id)

        # Step 6: Save to database using config values
        log.info("Saving configuration to database...")
        async for session in get_async_session():
            saved_model = await create_embedding_model_db(
                db=session,
                provider=config["provider"],
                model_name=config["model_name"],
                base_api_url=config["base_url"],
                connector_id=connector_id,
                model_id=model_id,
                deployment_status="deployed",
                is_active=True,
                dimension=config["dimension"],
            )
            if not saved_model:
                log.error("Failed to save model configuration to database")
                typer.echo("Failed to save model configuration to database")
                sys.exit(1)
        log.info("Configuration saved to database")

        log.info("SUCCESS! Embedding model setup complete.")
        log.info("OpenSearch Model ID: %s", model_id)
        log.info("Connector ID: %s", connector_id)
        log.info("Provider: %s", config["provider"])
        log.info("Model: %s", config["model_name"])
        log.info("Dimension: %s", config["dimension"])

        typer.echo(f"Embedding model created successfully: {model_id}")

    finally:
        # Clean up VectorStore client
        if vector_store:
            vector_store.os.close()


@app.command("create-embedding-model")
def create_embedding_model(
    model: str = typer.Option("", "--model", help="Embedding model to use (e.g., 'cohere/embed-v4.0'). Defaults to EMBEDDING_MODEL env var."),
    list_models: bool = typer.Option(False, "--list-models", help="List all available embedding models and exit."),
    force: bool = typer.Option(False, "--force", help="Force creation even if an active model already exists."),
):
    """
    Setup OpenSearch embedding model.

    This command will:
    1. Check for required API key environment variable
    2. Check for existing active model (skip if --force is used)
    3. Configure ML Commons and trusted endpoints
    4. Create connector, register and deploy model
    5. Save configuration to database

    Examples:
        # List available models
        python -m pi.manage create-embedding-model --list-models

        # Create with default model (EMBEDDING_MODEL env var or cohere/embed-v4.0)
        python -m pi.manage create-embedding-model

        # Create with specific model
        python -m pi.manage create-embedding-model --model openai/text-embedding-3-small

        # Force recreation of model
        python -m pi.manage create-embedding-model --force
    """
    # Handle --list-models
    if list_models:
        typer.echo("Available embedding models:")
        typer.echo("")
        for model_key in get_available_embedding_models():
            config = get_embedding_model_config(model_key)
            typer.echo(f"  {model_key}")
            typer.echo(f"    Provider: {config['provider']}")
            typer.echo(f"    Dimension: {config['dimension']}")
            typer.echo(f"    API Key Env: {config['api_key_env']}")
            typer.echo("")
        return

    async def run():
        try:
            # Initialize database
            await init_async_db()

            # Determine which model to use
            model_key = model or settings.vector_db.EMBEDDING_MODEL
            log.info("Using embedding model: %s", model_key)
            typer.echo(f"Setting up embedding model: {model_key}")

            # Validate model key
            try:
                config = get_embedding_model_config(model_key)
            except ValueError as e:
                typer.echo(f"Error: {e}")
                typer.echo("Use --list-models to see available models.")
                sys.exit(1)

            # Step 1: Check API key
            log.info("Step 1/7: Checking %s...", config["api_key_env"])
            api_key = os.getenv(config["api_key_env"], "")
            if not api_key or not api_key.strip():
                log.error("%s not configured", config["api_key_env"])
                typer.echo(f"Error: {config['api_key_env']} not configured")
                typer.echo(f"  Please set {config['api_key_env']} environment variable")
                sys.exit(1)
            log.info("%s found (length: %s)", config["api_key_env"], len(api_key.strip()))

            # Step 2: Check for existing active model
            if not force:
                log.info("Step 2/7: Checking for existing active model...")
                async for session in get_async_session():
                    existing_model = await get_active_embedding_model(session)
                    if existing_model:
                        log.info("Active model already exists with ID: %s", existing_model.model_id)
                        log.info("  Provider: %s", existing_model.provider)
                        log.info("  Model: %s", existing_model.model_name)
                        log.info("  Status: %s", existing_model.deployment_status)
                        typer.echo(f"Active model already exists: {existing_model.model_id}")
                        typer.echo("Use --force to create a new model anyway.")
                        return

            log.info("No active model found (or --force used). Proceeding with setup...")

            # Steps 3-7: Use the internal setup function
            await _setup_embedding_model_internal(model_key)

        except Exception as e:
            log.error("Unexpected error during setup: %s", e, exc_info=True)
            typer.echo(f"Unexpected error during setup: {e}")
            sys.exit(1)

    asyncio.run(run())


@app.command("validate-embedding-model")
def validate_embedding_model():
    """
    Validate embedding model ID configuration.

    This command checks if the embedding model ID is configured and valid
    by verifying it exists in OpenSearch and is properly deployed.

    Checks OPENSEARCH_ML_MODEL_ID environment variable first, then falls back to database.
    Tests actual embedding generation to ensure the model is working correctly.
    """
    from pi.services.llm.validators import validate_embedding_model_id
    from pi.services.retrievers.pg_store import get_ml_model_id_sync

    typer.echo("Validating embedding model configuration...")

    # Check environment variable first
    ml_model_id = get_ml_model_id_sync()
    if ml_model_id and ml_model_id.strip():
        typer.echo(f"Using OPENSEARCH_ML_MODEL_ID: {ml_model_id}")
    else:
        typer.echo("OPENSEARCH_ML_MODEL_ID not set, checking database...")

    # Validate the model
    is_valid, message = validate_embedding_model_id(model_id=ml_model_id or None)

    if is_valid:
        typer.echo(f"✅ {message}")
    else:
        typer.echo(f"❌ {message}")
        typer.echo("")
        typer.echo("To fix this issue:")
        typer.echo("  1. Set OPENSEARCH_ML_MODEL_ID environment variable, OR")
        typer.echo("  2. Create an embedding model: python -m pi.manage create-embedding-model")
        raise typer.Exit(code=1)


def _extract_embedding_from_predict(response: dict) -> list[float] | None:
    """Walk the _predict response to find the first embedding vector (list of floats).

    OpenSearch ML _predict responses vary by model / connector but common shapes are:
        - inference_results[0].output[0].data  (list of floats)
        - inference_results[0].output[0].dataAsMap.embedding (list)
    We do a recursive search for the first ``list[float]`` with length > 1.
    """

    def _find_float_list(obj, depth: int = 0) -> list[float] | None:
        if depth > 10:
            return None
        if isinstance(obj, list):
            # Check if this is a list of numbers (the embedding)
            if len(obj) > 1 and all(isinstance(v, (int, float)) for v in obj[:5]):
                return obj
            # Otherwise recurse into list items
            for item in obj:
                result = _find_float_list(item, depth + 1)
                if result is not None:
                    return result
        elif isinstance(obj, dict):
            for value in obj.values():
                result = _find_float_list(value, depth + 1)
                if result is not None:
                    return result
        return None

    return _find_float_list(response)


@app.command("check-embedding-dimension")
def check_embedding_dimension():
    configured_dim = settings.vector_db.EMBEDDING_DIMENSION

    typer.echo("")
    typer.echo("=" * 60)
    typer.echo("Checking embedding dimension consistency...")
    typer.echo("=" * 60)

    typer.echo("")
    typer.echo("[ Step 1 ] Config")
    typer.echo(f"  OPENSEARCH_EMBEDDING_DIMENSION: {configured_dim}")

    knn_indices = [
        settings.vector_db.ISSUE_INDEX,
        settings.vector_db.PAGES_INDEX,
        settings.vector_db.DOCS_INDEX,
    ]

    try:
        vdb = VectorStore()
    except Exception as exc:
        log.error("Could not connect to OpenSearch for dimension check: %s", exc, exc_info=True)
        typer.echo("")
        typer.echo("[ Error ] Could not connect to OpenSearch")
        typer.echo(f"  {exc}")
        typer.echo("")
        typer.echo("  Please verify:")
        typer.echo("    - OPENSEARCH_URL is correctly configured")
        typer.echo("    - OpenSearch service is running and reachable")
        raise typer.Exit(code=1)

    mismatches: list[str] = []
    checked = 0
    model_check_skipped = False

    # ── Step 2: Index mapping dimensions ──
    typer.echo("")
    typer.echo("[ Step 2 ] Index mapping dimensions")

    for index_name in knn_indices:
        try:
            if not vdb.os.indices.exists(index=index_name):
                typer.echo(f"  {index_name}: does not exist (skipping)")
                continue

            checked += 1

            mapping = vdb.os.indices.get_mapping(index=index_name)
            properties = mapping[index_name]["mappings"].get("properties", {})

            for field_name, field_def in properties.items():
                if field_def.get("type") == "knn_vector":
                    index_dim = field_def.get("dimension")
                    if index_dim and int(index_dim) != configured_dim:
                        msg = f"{index_name}.{field_name}: index has dimension={index_dim}, config has {configured_dim}"
                        mismatches.append(msg)
                        typer.echo(f"  {index_name}: MISMATCH — index dimension={index_dim}, config={configured_dim}")

        except Exception as exc:
            log.warning("Failed to check dimension for index %s: %s", index_name, exc)
            typer.echo(f"  {index_name}: could not read mapping ({exc})")

    if checked == 0:
        typer.echo("  No KNN indices exist yet")
    elif len(mismatches) == 0:
        typer.echo(f"  Result: {checked} index(es) match configured dimension")

    # ── Step 3: ML model dimension ──
    typer.echo("")
    typer.echo("[ Step 3 ] ML model output dimension")

    embedding_model_key = settings.vector_db.EMBEDDING_MODEL
    ml_model_id = ML_MODEL_ID

    if not embedding_model_key or not embedding_model_key.strip():
        model_check_skipped = True
        log.warning("EMBEDDING_MODEL is not set")
        typer.echo("  ❌ EMBEDDING_MODEL is required")
        raise typer.Exit(code=1)

    if not ml_model_id:
        model_check_skipped = True
        log.warning("No ML model ID available")

        typer.echo("  ⚠ No ML model ID found")

        typer.echo("  You must either:")
        typer.echo("    - Set OPENSEARCH_ML_MODEL_ID (required for Cloud OpenSearch)")
        typer.echo("    - OR run: python -m pi.manage create-embedding-model --force (self-hosted OpenSearch)")

    else:
        typer.echo(f"  ML Model ID: {ml_model_id}")
        try:
            predict_response = vdb.test_ml_model(ml_model_id, test_input=["hi"])
            embedding = _extract_embedding_from_predict(predict_response)

            if embedding is not None:
                model_dim = len(embedding)
                if model_dim != configured_dim:
                    msg = f"ML model {ml_model_id}: model produces dimension={model_dim}, config has {configured_dim}"
                    mismatches.append(msg)
                    typer.echo(f"  Result: MISMATCH — model dimension={model_dim}, config={configured_dim}")
                else:
                    typer.echo(f"  Result: OK (dimension={model_dim})")
            else:
                typer.echo("  Warning: Could not extract embedding vector")

        except Exception as exc:
            typer.echo(f"  Warning: Could not run model inference ({exc})")

    vdb.os.close()

    typer.echo("")
    typer.echo("=" * 60)
    typer.echo("[ Result ]")
    typer.echo("=" * 60)

    if mismatches:
        typer.echo("  DIMENSION MISMATCH DETECTED")
        for m in mismatches:
            typer.echo(f"    - {m}")

    elif model_check_skipped:
        typer.echo(f"  Index dimensions match config ({configured_dim})")
        typer.echo("  Model dimension check skipped")

    else:
        typer.echo(f"  All checks passed — dimension={configured_dim}")

    raise typer.Exit(code=0)


@app.command("list-supported-embedding-models")
def list_supported_embedding_models():
    """
    List all supported embedding models from the registry.
    """

    from pi.core.embedding_config import EMBEDDING_MODELS

    typer.echo("")
    typer.echo("Supported Embedding Models")
    typer.echo("=" * 60)

    for key, cfg in sorted(EMBEDDING_MODELS.items()):
        typer.echo(f"{key}")
        typer.echo(f"  dimension:       {cfg['dimension']}")
        typer.echo("")
