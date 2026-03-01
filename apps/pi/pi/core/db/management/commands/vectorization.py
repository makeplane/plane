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
from uuid import UUID

import typer
from sqlalchemy import desc
from sqlmodel import select

from pi import logger
from pi import settings
from pi.app.models.workspace_vectorization import WorkspaceVectorization
from pi.celery_app import celery_app
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.core.db.plane_pi.lifecycle import init_async_db
from pi.core.vectordb import VectorStore
from pi.vectorizer.docs.document_processor import fetch_and_process_files
from pi.vectorizer.docs.document_processor import get_all_files_for_full_feed

log = logger.getChild(__name__)

app = typer.Typer()


# ============================================================================
# Documentation Feed Command
# ============================================================================


@app.command("feed-docs")
def feed_docs_command():
    """
    Feed all documentation from configured repositories to vector database.

    This command fetches all documentation from configured repositories
    and indexes them into the vector database. This is a one-time operation
    for initial setup or manual re-indexing.

    Repositories are configured via DOCS_REPO_NAME environment variable.

    Example:
        python -m pi.manage feed-docs
    """

    async def run():
        # Get repository names from config
        repos = [repo.strip() for repo in settings.vector_db.DOCS_REPO_NAME.split(",") if repo.strip()]
        branch = settings.vector_db.DOCS_BRANCH

        if not repos:
            typer.echo("No repositories configured. Set DOCS_REPO_NAME environment variable.")
            raise typer.Exit(code=1)

        typer.echo(f"Starting documentation feed for {len(repos)} repository(ies)...")
        typer.echo(f"Repositories: {", ".join(repos)}")
        typer.echo(f"Branch: {branch}")
        typer.echo("")

        total_success = 0
        total_failed = 0

        async with VectorStore() as vector_db:
            for i, repo in enumerate(repos, 1):
                typer.echo(f"[{i}/{len(repos)}] Processing repository: {repo}")

                try:
                    # Get all files from repository
                    typer.echo(f"Fetching file list from {repo}...")
                    all_files, error = get_all_files_for_full_feed(repo, branch)

                    if error:
                        # Error occurred
                        typer.echo(f"Error: {error}")
                        log.error(f"Failed to get files for {repo}: {error}")
                        total_failed += 1
                        continue

                    if not all_files:
                        typer.echo(f"⚠ No documentation files found in {repo}")
                        continue

                    typer.echo(f"Found {len(all_files)} documentation files")

                    # Fetch and process files
                    typer.echo(f"Fetching and processing {len(all_files)} files...")
                    docs_to_index, failed_files = fetch_and_process_files(repo, all_files, branch)
                    typer.echo(f"Processed: {len(docs_to_index)} documents ready for indexing")

                    if not docs_to_index:
                        typer.echo(f"⚠ No valid documents to index from {repo}")
                        continue

                    # Index documents
                    typer.echo(f"Indexing {len(docs_to_index)} documents to vector database...")
                    success_count, failures = await vector_db.async_feed(index_name=settings.vector_db.DOCS_INDEX, docs=docs_to_index)

                    total_success += success_count
                    total_failed += len(failures) + len(failed_files)

                    typer.echo(f"Indexed {success_count}/{len(docs_to_index)} documents successfully")
                    if failures or failed_files:
                        typer.echo(f"Failed: {len(failures) + len(failed_files)} documents")
                    typer.echo("")

                except Exception as e:
                    error_msg = str(e) or f"Unknown error: {type(e).__name__}"
                    typer.echo(f"Error processing {repo}: {error_msg}")
                    log.error(f"Error in feed-docs for {repo}: {e}", exc_info=True)
                    total_failed += 1
                    typer.echo("")

        # Summary
        typer.echo("")
        typer.echo("=" * 60)
        typer.echo("Summary:")
        typer.echo(f"  Total indexed: {total_success} documents")
        if total_failed > 0:
            typer.echo(f"  Failed: {total_failed} documents")
        typer.echo("=" * 60)

        if total_failed > 0:
            typer.echo("⚠ Some documents failed to index. Check logs for details.")
            raise typer.Exit(code=1)
        typer.echo("All documents indexed successfully!")

    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        typer.echo("Feed interrupted by user")
        raise typer.Exit(code=130)
    except typer.Exit:
        # Re-raise typer exits (they already have proper error messages)
        raise
    except Exception as e:
        error_msg = str(e) or f"Unknown error: {type(e).__name__}"
        typer.echo(f"Feed failed: {error_msg}")
        if not error_msg or error_msg == "Unknown error: Exit":
            typer.echo("  Check logs above for detailed error information.")
        log.error(f"Feed docs command failed: {e}", exc_info=True)
        raise typer.Exit(code=1)


@app.command("vectorize-chat-messages-index")
def trigger_chat_search_index(
    workspace_id: str = typer.Option(None, "--workspace-id", "-w", help="Workspace ID. If not provided, processes all workspaces."),
    batch_size: int = typer.Option(100, "--batch-size", "-b", help="Batch size for processing"),
):
    """
    Trigger chat search index population as a Celery background task.

    This queues a background job to populate the search index with existing
    chats and messages. The job runs asynchronously to avoid timeouts.

    Example:
        python -m pi.manage vectorize-chat-messages-index
        python -m pi.manage vectorize-chat-messages-index --workspace-id abc123 --batch-size 50
    """
    try:
        task_config = {"workspace_id": workspace_id, "batch_size": batch_size}

        # Queue Celery task
        task = celery_app.send_task("pi.celery_app.populate_chat_search_index", args=[task_config])

        log.info("Queued chat search index population task: %s", task.id)

        typer.echo("Chat search index population task queued successfully")
        typer.echo(f"  Workspace ID: {workspace_id or "all workspaces"}")
        typer.echo(f"  Batch size: {batch_size}")
        typer.echo("  Task is running in background. Check logs for progress.")

    except Exception as exc:
        log.error("Failed to queue chat search index population: %s", exc)
        typer.echo(f"Failed to queue task: {exc}")
        raise typer.Exit(code=1)


@app.command("remove-vectorized-data")
def remove_vector_data(
    workspace_ids: str = typer.Option(..., "--workspace-ids", "-w", help="Comma-separated list of workspace IDs"),
    entities: str = typer.Option(None, "--entities", "-e", help="Comma-separated entity types: issues,pages. If not provided, removes from both."),
):
    """
    Queue background task to remove vector embeddings from specified indices.

    This operation can take several minutes for large workspaces, so it runs
    asynchronously via Celery. Use the returned task_id to check progress.

    Args:
        workspace_ids: Comma-separated list of workspace IDs
        entities: Optional comma-separated entity types (issues, pages). If not provided, removes from both.

    Example:
        python -m pi.manage remove-vectorized-data --workspace-ids abc123,def456
        python -m pi.manage remove-vectorized-data --workspace-ids abc123 --entities issues
    """
    # Parse workspace IDs
    workspace_list = [ws.strip() for ws in workspace_ids.split(",") if ws.strip()]

    if not workspace_list:
        typer.echo("Error: No workspace IDs provided")
        raise typer.Exit(code=1)

    # Parse entities if provided
    entity_list = None
    if entities:
        entity_list = [e.strip() for e in entities.split(",") if e.strip()]
        valid_entities = ["issues", "pages"]
        for entity in entity_list:
            if entity not in valid_entities:
                typer.echo(f"Error: Invalid entity type: {entity}. Valid types: {valid_entities}")
                raise typer.Exit(code=1)

    try:
        # Queue Celery task for background processing
        task = celery_app.send_task("pi.celery_app.remove_vector_data_task", args=[workspace_list, entity_list])

        log.info("Queued vector data removal task %s for %d workspaces", task.id, len(workspace_list))

        typer.echo("Vector data removal task queued successfully")
        typer.echo(f"  Workspace IDs: {", ".join(workspace_list)}")
        typer.echo(f"  Entities: {", ".join(entity_list) if entity_list else "issues, pages"}")
        typer.echo("  Task is running in background. Check logs for progress.")

    except Exception as exc:
        log.error("Failed to queue vector data removal task: %s", exc)
        typer.echo(f"Failed to queue task: {exc}")
        raise typer.Exit(code=1)


@app.command("vectorize-job-status")
def get_job_status(job_id: str):
    """
    Get details of a vectorization job including progress.

    Example:
        python -m pi.manage vectorize-job-status abc123-def456-...
    """

    async def run():
        await init_async_db()
        async for db in get_async_session():
            try:
                job_uuid = UUID(job_id)
                stmt = select(WorkspaceVectorization).where(WorkspaceVectorization.id == job_uuid)
                job = (await db.exec(stmt)).first()

                if not job:
                    typer.echo(f"Job {job_id} not found")
                    raise typer.Exit(code=1)

                status_value = job.status.value if hasattr(job.status, "value") else job.status

                typer.echo(f"Job ID: {job.id}")
                typer.echo(f"Workspace ID: {job.workspace_id}")
                typer.echo(f"Status: {status_value}")
                typer.echo(f"Progress: {job.progress_pct}%")
                typer.echo(f"Feed Issues: {job.feed_issues}")
                typer.echo(f"Feed Pages: {job.feed_pages}")
                typer.echo(f"Feed Slices: {job.feed_slices}")
                typer.echo(f"Batch Size: {job.batch_size}")
                typer.echo(f"Live Sync Enabled: {job.live_sync_enabled}")
                if job.created_at:
                    typer.echo(f"Created At: {job.created_at.isoformat()}")
                if job.started_at:
                    typer.echo(f"Started At: {job.started_at.isoformat()}")
                if job.finished_at:
                    typer.echo(f"Finished At: {job.finished_at.isoformat()}")
                if job.last_error:
                    typer.echo(f"Last Error: {job.last_error}")

            except ValueError:
                typer.echo(f"Invalid job ID format: {job_id}")
                raise typer.Exit(code=1)
            except Exception as exc:
                log.error("Failed to get job status for %s: %s", job_id, exc)
                typer.echo(f"Failed to get job status: {exc}")
                raise typer.Exit(code=1)

    try:
        asyncio.run(run())
    except SystemExit:
        raise
    except Exception as exc:
        typer.echo(f"Error: {exc}")
        raise typer.Exit(code=1)


@app.command("vectorize-workspace-progress")
def get_workspace_progress(workspace_id: str):
    """
    Get the most recent vectorization progress for a workspace.

    Example:
        python -m pi.manage vectorize-workspace-progress abc123
    """

    async def run():
        await init_async_db()
        async for db in get_async_session():
            try:
                stmt = (
                    select(WorkspaceVectorization)
                    .where(WorkspaceVectorization.workspace_id == workspace_id)
                    .order_by(desc(WorkspaceVectorization.created_at))  # type: ignore[arg-type]
                )
                job = (await db.exec(stmt)).first()

                if not job:
                    typer.echo(f"No vectorization jobs found for workspace {workspace_id}")
                    raise typer.Exit(code=1)

                status_value = job.status.value if hasattr(job.status, "value") else job.status

                typer.echo(f"Workspace ID: {workspace_id}")
                typer.echo(f"Job ID: {job.id}")
                typer.echo(f"Status: {status_value}")
                typer.echo(f"Progress: {job.progress_pct}%")
                if job.created_at:
                    typer.echo(f"Created At: {job.created_at.isoformat()}")
                if job.started_at:
                    typer.echo(f"Started At: {job.started_at.isoformat()}")
                if job.finished_at:
                    typer.echo(f"Finished At: {job.finished_at.isoformat()}")
                if job.last_error:
                    typer.echo(f"\nError: {job.last_error}")

            except Exception as exc:
                log.error("Failed to get progress for workspace %s: %s", workspace_id, exc)
                typer.echo(f"Failed to get workspace progress: {exc}")
                raise typer.Exit(code=1)

    try:
        asyncio.run(run())
    except SystemExit:
        raise
    except Exception as exc:
        typer.echo(f"Error: {exc}")
        raise typer.Exit(code=1)


@app.command("vectorize-workspace")
def trigger_workspace_vectorization(
    workspace_ids: str = typer.Option(..., "--workspace-ids", "-w", help="Comma-separated list of workspace IDs"),
    feed_issues: bool = typer.Option(True, "--feed-issues/--no-feed-issues", help="Feed issues data"),
    feed_pages: bool = typer.Option(True, "--feed-pages/--no-feed-pages", help="Feed pages data"),
    feed_slices: int = typer.Option(4, "--feed-slices", help="Number of feed slices"),
    batch_size: int = typer.Option(32, "--batch-size", "-b", help="Batch size for processing"),
):
    """
    Trigger vectorization for multiple workspaces.
    Creates database records and queues Celery tasks for each workspace.

    Example:
        python -m pi.manage vectorize-workspace --workspace-ids abc123,def456
        python -m pi.manage vectorize-workspace -w abc123 --feed-issues --no-feed-pages
    """
    from pi.app.models.workspace_vectorization import VectorizationStatus

    workspace_list = [ws.strip() for ws in workspace_ids.split(",") if ws.strip()]

    if not workspace_list:
        typer.echo("Error: No workspace IDs provided")
        raise typer.Exit(code=1)

    async def run():
        await init_async_db()
        accepted = []
        skipped = []

        async for db in get_async_session():
            for ws in workspace_list:
                # Check if workspace already has a running/queued job
                stmt = select(WorkspaceVectorization).where(
                    WorkspaceVectorization.workspace_id == ws,
                    (WorkspaceVectorization.status == VectorizationStatus.queued) | (WorkspaceVectorization.status == VectorizationStatus.running),
                )
                existing_job = (await db.exec(stmt)).first()

                if existing_job:
                    skipped.append(ws)
                    typer.echo(f"  Skipped {ws} - job already exists (ID: {existing_job.id})")
                    continue

                # Create new job record
                job = WorkspaceVectorization(
                    workspace_id=ws,
                    status=VectorizationStatus.queued,
                    feed_issues=feed_issues,
                    feed_pages=feed_pages,
                    feed_slices=feed_slices,
                    batch_size=batch_size,
                )
                db.add(job)
                await db.commit()
                await db.refresh(job)

                # Queue Celery task
                job_config = {
                    "workspace_id": ws,
                    "job_id": str(job.id),
                    "feed_issues": feed_issues,
                    "feed_pages": feed_pages,
                    "feed_slices": feed_slices,
                    "batch_size": batch_size,
                }
                celery_app.send_task("pi.celery_app.vectorize_workspace", args=[job_config])
                accepted.append(ws)
                typer.echo(f"  Queued {ws} (Job ID: {job.id})")

        typer.echo("")
        typer.echo(f"Accepted: {len(accepted)} workspace(s)")
        if skipped:
            typer.echo(f"Skipped: {len(skipped)} workspace(s)")

    try:
        asyncio.run(run())
    except Exception as exc:
        log.error("Failed to trigger workspace vectorization: %s", exc, exc_info=True)
        typer.echo(f"Failed to trigger vectorization: {exc}")
        raise typer.Exit(code=1)
