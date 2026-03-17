# Celery Tasks Documentation

This document explains the Celery background tasks used in Plane AI for vectorization, search indexing, and workspace management.

## Overview

Celery handles asynchronous background processing for:

- **Vector Embeddings**: Generating and syncing semantic embeddings for issues, pages, and documentation
- **Search Indexing**: Maintaining searchable indices for chats and messages
- **Workspace Management**: Managing vectorization based on workspace billing plans
- **Maintenance**: Health checks, cleanup, and monitoring

## Architecture

- **Broker**: RabbitMQ (default: `pyamqp://guest@localhost:5672//`)
- **Result Backend**: None (tasks are fire-and-forget, progress tracked via logs)
- **Queue**: `plane_pi_queue`
- **Task Timeout**: 3 hours (hard limit), 2 hours (soft limit)

## Periodic Tasks (Celery Beat)

These tasks run automatically on a schedule:

### 1. `trigger-live-sync`

**Task**: `pi.celery_app.trigger_live_sync`  
**Schedule**: Every 30 seconds (configurable)  
**Environment Control**: `CELERY_VECTOR_SYNC_ENABLED` (default: enabled)

**Purpose**: Periodically syncs missing vector embeddings for workspaces that have live sync enabled.

**How it works**:

1. Queries database for workspaces with `status='success'` and `live_sync_enabled=True`
2. Filters workspaces using OpenSearch to find those with any (>0) missing vectors
3. Dispatches `process_workspace_live_sync` tasks for each eligible workspace
4. Conflict with stale recovery is avoided via the `status` column — stale recovery sets status to `queued`, which excludes the workspace from live sync eligibility

**When to disable**: Set `CELERY_VECTOR_SYNC_ENABLED=0` when running heavy backfill jobs that saturate ML model capacity.

---

### 2. `sync-docs-periodic`

**Task**: `pi.celery_app.sync_docs_periodic_task`  
**Schedule**: Every 24 hours (configurable)  
**Environment Control**: `CELERY_DOCS_SYNC_ENABLED` (default: enabled)

**Purpose**: Incrementally syncs documentation from GitHub repositories.

**How it works**:

1. Fetches latest commit SHA from GitHub for each configured repository
2. Compares with last processed commit in database
3. If commits differ:
   - Uses GitHub compare API to get changed files (added/modified/removed)
   - Processes only changed `.mdx` and `.txt` files
   - Updates vector embeddings for modified/added files
   - Removes deleted files from index
4. If commits match: skips processing (up-to-date)

**First Run**: Performs full feed if no previous commit exists.

**API Optimization**: Uses only 2 API calls per repo (commit SHA + compare), then fetches files via `raw.githubusercontent.com`.

---

### 3. `workspace-plan-sync`

**Task**: `pi.celery_app.workspace_plan_sync`  
**Schedule**: Every 24 hours (configurable)  
**Environment Control**: `CELERY_WORKSPACE_PLAN_SYNC_ENABLED` (default: enabled)

**Purpose**: Manages workspace vectorization based on billing plan changes.

**Three Operations**:

1. **Downgrade Handling**: Removes vector data and disables live sync for workspaces downgraded from Pro/Business to FREE
2. **Stale Workspace Recovery**: Re-feeds workspaces with >0 missing vectors (sets status to `queued`, which prevents live sync overlap)
3. **New Pro/Business Onboarding**: Creates initial vectorization jobs for new Pro/Business workspaces

**How it works**:

- Queries Plane database for workspace plans
- Compares with AI database to identify changes
- Queues appropriate vectorization or removal tasks

---

### 4. `reap-stuck-vectorization-jobs`

**Task**: `pi.celery_app.reap_stuck_vectorization_jobs`  
**Schedule**: Every 24 hours  
**Timeout**: 4 days (5760 minutes)

**Purpose**: Cleans up vectorization jobs stuck in `queued` or `running` status.

**How it works**:

- Finds jobs in `queued` or `running` status older than 4 days
- Marks them as `failed` with appropriate error message
- Prevents jobs from being stuck indefinitely

---

## Environment Variables

### Core Configuration

- `CELERY_BROKER_URL`: RabbitMQ broker URL (default: `pyamqp://guest@localhost:5672//`)
- **Note**: No result backend configured - tasks run asynchronously and progress is tracked via logs only

### AmazonMQ / Secrets Manager (credential injection)
- If `AMQP_URL`/`CELERY_BROKER_URL` is provided **without embedded credentials** (for example `b-...mq.us-east-1.on.aws:5671`), and `AMAZONMQ_SECRET_ARN` is configured, PI will fetch the username/password from AWS Secrets Manager and construct a full broker URL.

### Vector Sync

- `CELERY_VECTOR_SYNC_ENABLED`: Enable/disable live sync (default: `1`)
- `CELERY_VECTOR_SYNC_INTERVAL`: Sync interval in seconds (default: `30`)
- `CELERY_VECTOR_SYNC_MAX_RETRIES`: Max retries for failed syncs (default: `3`)
- `CELERY_VECTOR_SYNC_RETRY_DELAY`: Retry delay in seconds (default: `30`)

### Documentation Sync

- `CELERY_DOCS_SYNC_ENABLED`: Enable/disable docs sync (default: `1`)
- `CELERY_DOCS_SYNC_INTERVAL`: Sync interval in seconds (default: `86400` = 24 hours)

### Workspace Plan Sync

- `CELERY_WORKSPACE_PLAN_SYNC_ENABLED`: Enable/disable plan sync (default: `1`)
- `CELERY_WORKSPACE_PLAN_SYNC_INTERVAL`: Sync interval in seconds (default: `86400` = 24 hours)

## Task Flow Examples

### Initial Workspace Vectorization

1. User upgrades to Pro/Business plan
2. `workspace_plan_sync` detects new Pro workspace
3. Creates `WorkspaceVectorization` job with `status='queued'`
4. Dispatches `vectorize_workspace` task
5. Task processes issues and pages, generates embeddings
6. Validates completion, marks job as `success`
7. Workspace becomes eligible for `trigger_live_sync`

### Live Sync Flow

1. `trigger_live_sync` runs every 30 seconds
2. Finds eligible workspaces (status=`success` + `live_sync_enabled=True`)
3. Filters to workspaces with any (>0) missing vectors via OpenSearch
4. Dispatches `process_workspace_live_sync` for each
5. Each task processes all missing vectors for the workspace and updates index

### Documentation Sync Flow

1. `sync_docs_periodic_task` runs daily
2. Fetches latest commit SHA from GitHub
3. Compares with stored commit SHA
4. If different: gets changed files, processes them, updates index
5. Updates stored commit SHA

## Database Connection Management

- **Shared Engine**: Each worker process maintains a shared database engine to avoid connection churn
- **Connection Pool**: Optimized pool sizes for Celery workloads
- **Circuit Breaker**: Protects against database failures with automatic retry
- **Cleanup**: Automatic engine disposal on worker shutdown

## Monitoring

- Task progress tracked via Celery task states
- Database circuit breaker status available via `health_check`
- Detailed logging for all operations
- Task retries configured with exponential backoff

## Common Operations

### Disable Live Sync Temporarily

```bash
export CELERY_VECTOR_SYNC_ENABLED=0
# Restart Celery worker
```

### Manually Feed Documentation

```bash
# Full feed of all documentation from configured repositories
python -m pi.manage feed-docs
```

### Check Health

```python
from pi.celery_app import celery_app
result = celery_app.send_task("pi.celery_app.health_check").get()
print(result)
```
