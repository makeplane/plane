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

import json

import typer

from pi import logger
from pi import settings
from pi.core.vectordb import VectorStore
from pi.core.vectordb.management.index_configs import INDEX_CONFIGS
from pi.core.vectordb.management.index_configs import PIPELINE_CONFIGS
from pi.core.vectordb.management.index_configs import get_pipeline_body
from pi.services.retrievers.pg_store import get_ml_model_id_sync

log = logger.getChild(__name__)

app = typer.Typer()
ML_MODEL_ID = get_ml_model_id_sync()


def confirm_action(prompt: str) -> bool:
    """Get user confirmation (y/n)."""
    while True:
        response = input(f"{prompt} [y/n]: ").strip().lower()
        if response in ("y", "yes"):
            return True
        elif response in ("n", "no"):
            return False
        else:
            typer.echo("Please enter 'y' for yes or 'n' for no")


@app.command("create-docs-embed-pipeline")
def create_docs_embed_pipeline(force: bool = typer.Option(False, "--force", "-f", help="Force overwrite pipeline even if it exists")):
    """
    Create the docs embedding pipeline in OpenSearch.

    This pipeline uses the ML model configured in OPENSEARCH_ML_MODEL_ID
    to automatically generate embeddings for document content.

    Example:
        python -m pi.manage create-docs-embed-pipeline
    """
    ml_model_id = ML_MODEL_ID
    pipeline_name = settings.vector_db.DOCS_PIPELINE_NAME

    if not ml_model_id:
        typer.echo("Error: OPENSEARCH_ML_MODEL_ID not configured")
        typer.echo("  Please set OPENSEARCH_ML_MODEL_ID environment variable")
        raise typer.Exit(code=1)

    pipeline_body = get_pipeline_body(ml_model_id)

    try:
        vdb = VectorStore()

        # Check if pipeline already exists unless forced
        try:
            vdb.os.ingest.get_pipeline(id=pipeline_name)
            if force:
                typer.echo(f"Pipeline '{pipeline_name}' already exists. Overwriting due to --force...")
            else:
                typer.echo(f"Pipeline '{pipeline_name}' already exists")
                typer.echo("  Use --force to overwrite it with the current OPENSEARCH_ML_MODEL_ID")
                return
        except Exception:
            # Pipeline doesn't exist, create it
            pass

        # Show what will be created
        typer.echo("")
        typer.echo("=" * 60)
        typer.echo("Pipeline Configuration:")
        typer.echo("=" * 60)
        typer.echo(f"Pipeline Name: {pipeline_name}")
        typer.echo(f"ML Model ID: {ml_model_id}")
        typer.echo(f"Description: {pipeline_body['description']}")
        typer.echo("")
        typer.echo("Pipeline Body:")
        typer.echo(json.dumps(pipeline_body, indent=2))
        typer.echo("")
        typer.echo("=" * 60)

        # Get confirmation
        if not confirm_action("Create this pipeline?"):
            typer.echo("Pipeline creation cancelled")
            raise typer.Exit(code=0)

        # Create the pipeline
        vdb.os.ingest.put_pipeline(id=pipeline_name, body=pipeline_body)

        typer.echo(f"Created docs embedding pipeline: {pipeline_name}")
        typer.echo(f"  ML Model ID: {ml_model_id}")

        log.info("Created docs embedding pipeline %s with model %s", pipeline_name, ml_model_id)

    except Exception as exc:
        log.error("Failed to create docs embedding pipeline: %s", exc, exc_info=True)
        typer.echo(f"Failed to create pipeline: {exc}")
        raise typer.Exit(code=1)


@app.command("create-vector-pipeline")
def create_vector_pipeline(
    pipeline_name: str = typer.Option(..., "--pipeline-name", "-p", help="Pipeline identifier (e.g., docs_pipeline)"),
    force: bool = typer.Option(False, "--force", "-f", help="Force overwrite pipeline even if it exists"),
):
    """
    Create an OpenSearch ingest pipeline by name.

    Example:
        python -m pi.manage create-vector-pipeline --pipeline-name docs_pipeline
    """
    if pipeline_name not in PIPELINE_CONFIGS:
        available = ", ".join(PIPELINE_CONFIGS.keys())
        typer.echo(f"Error: Unknown pipeline '{pipeline_name}'")
        typer.echo(f"Available pipelines: {available}")
        raise typer.Exit(code=1)

    ml_model_id = ML_MODEL_ID
    if not ml_model_id:
        typer.echo("Error: OPENSEARCH_ML_MODEL_ID not configured")
        typer.echo("  Please set OPENSEARCH_ML_MODEL_ID environment variable")
        raise typer.Exit(code=1)

    config = PIPELINE_CONFIGS[pipeline_name]
    actual_pipeline_name: str = config["name"]  # type: ignore[assignment]
    get_body_fn = config["get_body"]
    pipeline_body: dict = get_body_fn(ml_model_id)  # type: ignore[operator]

    try:
        vdb = VectorStore()

        # Check if pipeline already exists unless forced
        try:
            vdb.os.ingest.get_pipeline(id=actual_pipeline_name)
            if force:
                typer.echo(f"Pipeline '{actual_pipeline_name}' already exists. Overwriting due to --force...")
            else:
                typer.echo(f"Pipeline '{actual_pipeline_name}' already exists")
                typer.echo("  Use --force to overwrite it with the current OPENSEARCH_ML_MODEL_ID")
                return
        except Exception:
            pass

        # Show what will be created
        typer.echo("")
        typer.echo("=" * 60)
        typer.echo("Pipeline Configuration:")
        typer.echo("=" * 60)
        typer.echo(f"Pipeline Name: {actual_pipeline_name}")
        typer.echo(f"ML Model ID: {ml_model_id}")
        typer.echo(f"Description: {config['description']}")
        typer.echo("")
        typer.echo("Pipeline Body:")
        typer.echo(json.dumps(pipeline_body, indent=2))
        typer.echo("")
        typer.echo("=" * 60)

        # Get confirmation
        if not confirm_action("Create this pipeline?"):
            typer.echo("Pipeline creation cancelled")
            raise typer.Exit(code=0)

        # Create the pipeline
        vdb.os.ingest.put_pipeline(id=actual_pipeline_name, body=pipeline_body)

        typer.echo(f"Created pipeline: {actual_pipeline_name}")
        log.info("Created pipeline %s", actual_pipeline_name)

    except Exception as exc:
        log.error("Failed to create pipeline: %s", exc, exc_info=True)
        typer.echo(f"Failed to create pipeline: {exc}")
        raise typer.Exit(code=1)


@app.command("check-vector-pipeline")
def check_vector_pipeline(pipeline_name: str = typer.Option(..., "--pipeline-name", "-p", help="Pipeline identifier (e.g., docs_pipeline)")):
    """
    Check if an OpenSearch pipeline exists.

    Example:
        python -m pi.manage check-vector-pipeline --pipeline-name docs_pipeline
    """
    if pipeline_name not in PIPELINE_CONFIGS:
        available = ", ".join(PIPELINE_CONFIGS.keys())
        typer.echo(f"Error: Unknown pipeline '{pipeline_name}'")
        typer.echo(f"Available pipelines: {available}")
        raise typer.Exit(code=1)

    config = PIPELINE_CONFIGS[pipeline_name]
    actual_pipeline_name = config["name"]

    try:
        vdb = VectorStore()

        try:
            vdb.os.ingest.get_pipeline(id=actual_pipeline_name)
            typer.echo(f"Pipeline '{actual_pipeline_name}' exists")
        except Exception:
            typer.echo(f"Pipeline '{actual_pipeline_name}' does not exist")

    except Exception as exc:
        log.error("Failed to check pipeline: %s", exc, exc_info=True)
        typer.echo(f"Failed to check pipeline: {exc}")
        raise typer.Exit(code=1)


@app.command("init-vector-pipelines")
def init_vector_pipelines(force: bool = typer.Option(False, "--force", "-f", help="(Deprecated) Pipelines now always overwrite")):
    """
    Initialize all required OpenSearch pipelines (creates or updates them).

    Example:
        python -m pi.manage init-vector-pipelines
    """
    ml_model_id = ML_MODEL_ID
    if not ml_model_id:
        typer.echo("Error: OPENSEARCH_ML_MODEL_ID not configured")
        raise typer.Exit(code=1)

    typer.echo("Starting OpenSearch pipelines initialization...")
    typer.echo("-" * 40)

    total_pipelines = len(PIPELINE_CONFIGS)
    for i, (pipeline_key, config) in enumerate(PIPELINE_CONFIGS.items(), 1):
        typer.echo(f"\n[{i}/{total_pipelines}] Initializing '{pipeline_key}'...")
        actual_pipeline_name = config["name"]

        try:
            vdb = VectorStore()
            get_body_fn = config["get_body"]
            pipeline_body = get_body_fn(ml_model_id)
            vdb.os.ingest.put_pipeline(id=actual_pipeline_name, body=pipeline_body)
            typer.echo(f"  ✅ Synced pipeline '{actual_pipeline_name}'")

        except Exception as e:
            typer.echo(f"  ❌ Failed to initialize {pipeline_key}: {e}")
            # Continue with other pipelines

    typer.echo("-" * 40)
    typer.echo("OpenSearch pipelines initialization completed")


@app.command("create-opensearch-index")
def create_opensearch_index(
    index_name: str = typer.Option(..., "--index-name", "-i", help="Index identifier (e.g., docs_semantic, pi_chat_messages)"),
):
    """
    Create an OpenSearch index by name.

    Example:
        python -m pi.manage create-opensearch-index --index-name docs_semantic
        python -m pi.manage create-opensearch-index --index-name pi_chat_messages
    """
    if index_name not in INDEX_CONFIGS:
        available = ", ".join(INDEX_CONFIGS.keys())
        typer.echo(f"Error: Unknown index '{index_name}'")
        typer.echo(f"Available indices: {available}")
        raise typer.Exit(code=1)

    config = INDEX_CONFIGS[index_name]
    actual_index_name: str = config["name"]  # type: ignore[assignment]
    index_body: dict = config["body"]  # type: ignore[assignment]

    try:
        vdb = VectorStore()

        # Check if index already exists
        if vdb.os.indices.exists(index=actual_index_name):
            typer.echo(f"Index '{actual_index_name}' already exists")
            typer.echo("  Use OpenSearch API to delete and recreate if needed")
            return

        # Show what will be created
        typer.echo("")
        typer.echo("=" * 60)
        typer.echo("Index Configuration:")
        typer.echo("=" * 60)
        typer.echo(f"Index Name: {actual_index_name}")
        if config.get("requires_pipeline"):
            typer.echo(f"Pipeline: {config.get('pipeline_name')}")
        typer.echo("")
        typer.echo("Index Body:")
        typer.echo(json.dumps(index_body, indent=2))
        typer.echo("")
        typer.echo("=" * 60)

        # Get confirmation
        if not confirm_action("Create this index?"):
            typer.echo("Index creation cancelled")
            raise typer.Exit(code=0)

        # Create the index
        vdb.create_index(index_name=actual_index_name, body=index_body)

        typer.echo(f"Created index: {actual_index_name}")

        log.info("Created index %s", actual_index_name)

    except Exception as exc:
        log.error("Failed to create index: %s", exc, exc_info=True)
        typer.echo(f"Failed to create index: {exc}")
        raise typer.Exit(code=1)


@app.command("check-opensearch-index")
def check_opensearch_index(
    index_name: str = typer.Option(..., "--index-name", "-i", help="Index identifier (e.g., docs_semantic, pi_chat_messages)"),
):
    """
    Check if an OpenSearch index exists.

    Example:
        python -m pi.manage check-opensearch-index --index-name docs_semantic
        python -m pi.manage check-opensearch-index --index-name pi_chat_messages
    """
    if index_name not in INDEX_CONFIGS:
        available = ", ".join(INDEX_CONFIGS.keys())
        typer.echo(f"Error: Unknown index '{index_name}'")
        typer.echo(f"Available indices: {available}")
        raise typer.Exit(code=1)

    config = INDEX_CONFIGS[index_name]
    actual_index_name = config["name"]

    try:
        vdb = VectorStore()

        if vdb.os.indices.exists(index=actual_index_name):
            typer.echo(f"Index '{actual_index_name}' exists")
        else:
            typer.echo(f"Index '{actual_index_name}' does not exist")

    except Exception as exc:
        log.error("Failed to check index: %s", exc, exc_info=True)
        typer.echo(f"Failed to check index: {exc}")
        raise typer.Exit(code=1)


@app.command("init-opensearch-index")
def init_opensearch_index(index_name: str = typer.Option(..., "--index-name", "-i", help="Index identifier (e.g., docs_semantic, pi_chat_messages)")):
    """
    Initialize an OpenSearch index (create if not present).

    This checks if the index exists and creates it if missing.
    For docs_semantic, it also ensures the pipeline exists.

    Example:
        python -m pi.manage init-opensearch-index --index-name docs_semantic
        python -m pi.manage init-opensearch-index --index-name pi_chat_messages
    """
    if index_name not in INDEX_CONFIGS:
        available = ", ".join(INDEX_CONFIGS.keys())
        typer.echo(f"Error: Unknown index '{index_name}'")
        typer.echo(f"Available indices: {available}")
        raise typer.Exit(code=1)

    config = INDEX_CONFIGS[index_name]
    actual_index_name: str = config["name"]  # type: ignore[assignment]
    index_body: dict = config["body"]  # type: ignore[assignment]

    try:
        vdb = VectorStore()

        # 1. Setup Pipeline if needed
        if config.get("requires_pipeline"):
            pipeline_name = config["pipeline_name"]
            ml_model_id = ML_MODEL_ID

            if not ml_model_id:
                typer.echo("Error: OPENSEARCH_ML_MODEL_ID not configured")
                raise typer.Exit(code=1)

            typer.echo(f"Checking pipeline '{pipeline_name}'...")
            try:
                vdb.os.ingest.get_pipeline(id=pipeline_name)
                typer.echo(f"Pipeline '{pipeline_name}' already exists")
            except Exception:
                typer.echo(f"Creating pipeline '{pipeline_name}'...")
                pipeline_body = get_pipeline_body(ml_model_id)
                vdb.os.ingest.put_pipeline(id=pipeline_name, body=pipeline_body)
                typer.echo(f"Created pipeline '{pipeline_name}'")

        # 2. Setup Index
        typer.echo(f"Checking index '{actual_index_name}'...")
        if vdb.os.indices.exists(index=actual_index_name):
            typer.echo(f"Index '{actual_index_name}' already exists")
        else:
            typer.echo(f"Creating index '{actual_index_name}'...")
            vdb.create_index(index_name=actual_index_name, body=index_body)
            typer.echo(f"Created index '{actual_index_name}'")

        typer.echo(f"\nIndex '{index_name}' initialization complete")

    except Exception as exc:
        log.error("Failed to initialize index: %s", exc, exc_info=True)
        typer.echo(f"Failed to initialize index: {exc}")
        raise typer.Exit(code=1)


@app.command("check-opensearch-connectivity")
def check_opensearch_connectivity():
    """
    Check OpenSearch database connectivity.

    Tests the connection to OpenSearch and displays cluster health information.

    Example:
        python -m pi.manage check-opensearch-connectivity
    """
    typer.echo("Checking OpenSearch connectivity...")
    typer.echo("-" * 60)

    try:
        vdb = VectorStore()

        typer.echo("Testing connection...")
        from pi.core.vectordb.management.index_configs import INDEX_CONFIGS

        test_index = INDEX_CONFIGS.get("docs_semantic", {}).get("name", "plane-docs-semantic")
        vdb.os.indices.exists(index=test_index)

        typer.echo("✓ OpenSearch is reachable")
        typer.echo("-" * 60)
        typer.echo("✓ OpenSearch connectivity check PASSED")

        log.info("OpenSearch connectivity check successful")

    except Exception as exc:
        log.error("OpenSearch connectivity check failed: %s", exc, exc_info=True)
        typer.echo("-" * 60)
        typer.echo("✗ OpenSearch connectivity check FAILED")
        typer.echo(f"Error: {exc}")
        typer.echo("")
        typer.echo("Please verify:")
        typer.echo("  - OPENSEARCH_HOST is correctly configured")
        typer.echo("  - OPENSEARCH_PORT is correctly configured")
        typer.echo("  - OpenSearch service is running")
        typer.echo("  - Network connectivity is available")
        raise typer.Exit(code=1)


@app.command("init-vector-indexes")
def init_vector_indexes():
    """
    Initialize all required OpenSearch indices.

    This command checks and creates all configured indices.

    Example:
        python -m pi.manage init-vector-indexes
    """
    typer.echo("Starting OpenSearch indices initialization...")
    typer.echo("-" * 40)

    total_indices = len(INDEX_CONFIGS)
    for i, index_key in enumerate(INDEX_CONFIGS.keys(), 1):
        typer.echo(f"\n[{i}/{total_indices}] Initializing '{index_key}'...")
        try:
            # Call init for each index
            init_opensearch_index(index_name=index_key)
        except Exception as e:
            typer.echo(f"Failed to initialize {index_key}: {e}")
            # Continue with other indices

    typer.echo("-" * 40)
    typer.echo("OpenSearch indices initialization completed")
