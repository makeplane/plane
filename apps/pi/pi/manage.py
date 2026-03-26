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
# External imports

"""
Management command interface.

This module provides the main entry point for all management commands.
Commands are organized into separate modules in pi/core/db/management/commands/

Usage:
    python -m pi.manage <command> [options]
"""

import logging

import typer

# Suppress noisy logs for management commands
# logging.getLogger().setLevel(logging.WARNING)
logging.getLogger("pi.celery_app").setLevel(logging.WARNING)
logging.getLogger("pi.core.db.plane_pi.lifecycle").setLevel(logging.WARNING)
logging.getLogger("langchain_cohere.utils").setLevel(logging.ERROR)
logging.getLogger("tests.test_providers").setLevel(logging.CRITICAL)

# Import command modules
from pi.core.db.management.commands import celery
from pi.core.db.management.commands import database
from pi.core.db.management.commands import embedding
from pi.core.db.management.commands import llm
from pi.core.db.management.commands import server
from pi.core.db.management.commands import vdb
from pi.core.db.management.commands import vectorization

# Create main Typer app
app = typer.Typer()

# Database commands
app.command("wait-for-db")(database.wait_for_db)
app.command("wait-for-migrations")(database.wait_for_migrations)
app.command("check-migrations")(database.check_migrations)
app.command("check-db-connectivity")(database.check_db_connectivity)
app.command()(database.makemigrations)
app.command()(database.migrate)
app.command()(database.alembic_current)
app.command()(database.alembic_history)
app.command()(database.alembic_downgrade)
app.command("bootstrap-db")(database.bootstrap_db)

# Celery commands
app.command("celery-worker")(celery.run_celery_worker)
app.command("celery-beat")(celery.run_celery_beat)
app.command("celery-flower")(celery.run_celery_flower)
app.command("test-vector-sync")(celery.test_vector_sync)

# Embedding model commands
app.command("check-embedding-model")(embedding.check_embedding_model)
app.command("init-embedding-model")(embedding.init_embedding_model)
app.command("create-embedding-model")(embedding.create_embedding_model)
app.command("validate-embedding-model")(embedding.validate_embedding_model)
app.command("check-embedding-dimension")(embedding.check_embedding_dimension)
app.command("list-supported-embedding-models")(embedding.list_supported_embedding_models)


# LLM commands
app.command("add-llm-pricing")(llm.add_llm_pricing_command)
app.command("sync-llms")(llm.sync_llms_fixture)
app.command("sync-llm-pricing")(llm.sync_llm_pricing_fixture)
app.command("validate-llm-key")(llm.validate_llm_key)

# Vector database setup commands
app.command("check-opensearch-connectivity")(vdb.check_opensearch_connectivity)
app.command("create-docs-embed-pipeline")(vdb.create_docs_embed_pipeline)
app.command("create-vector-pipeline")(vdb.create_vector_pipeline)
app.command("check-vector-pipeline")(vdb.check_vector_pipeline)
app.command("init-vector-pipelines")(vdb.init_vector_pipelines)
app.command("create-opensearch-index")(vdb.create_opensearch_index)
app.command("check-opensearch-index")(vdb.check_opensearch_index)
app.command("init-opensearch-index")(vdb.init_opensearch_index)
app.command("init-vector-indexes")(vdb.init_vector_indexes)

# Vectorization commands (trigger, remove)
app.command("feed-docs")(vectorization.feed_docs_command)
app.command("vectorize-chat-messages-index")(vectorization.trigger_chat_search_index)
app.command("remove-vectorized-data")(vectorization.remove_vector_data)
app.command("vectorize-job-status")(vectorization.get_job_status)
app.command("vectorize-workspace-progress")(vectorization.get_workspace_progress)

# Workspace vectorization commands
app.command("vectorize-workspace")(vectorization.trigger_workspace_vectorization)

# Server commands (deprecated)
app.command()(server.runserver)
app.command()(server.start_application)


if __name__ == "__main__":
    app()
