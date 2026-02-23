# Management Commands

This directory contains all management commands for Plane AI, organized by functionality.

## Usage

All commands are accessed via the main `manage.py` entry point:

```bash
python -m pi.manage <command> [options]
```

## Command Categories

### Database Commands

**Wait for database:**

```bash
# Wait for database to be available (default timeout: 60s)
python -m pi.manage wait-for-db

# With custom timeout
python -m pi.manage wait-for-db --timeout 120
```

**Check migrations:**

```bash
# Check for pending migrations (shows warning but continues)
python -m pi.manage check-migrations
```

**Apply migrations:**

```bash
# Wait for database and apply all pending migrations
python -m pi.manage wait-for-migrations

# Apply migrations manually
python -m pi.manage migrate

# Apply specific revision
python -m pi.manage migrate --revision abc123
```

**Create migrations:**

```bash
# Auto-generate migration from model changes
python -m pi.manage makemigrations

# With custom message
python -m pi.manage makemigrations --message "add_new_index"
```

**Migration history:**

```bash
# Show current database revision
python -m pi.manage alembic-current

# Show full migration history
python -m pi.manage alembic-history

# Downgrade to previous revision
python -m pi.manage alembic-downgrade

# Downgrade to specific revision
python -m pi.manage alembic-downgrade --revision abc123
```

**Bootstrap database:**

```bash
# Complete database setup: wait + migrate + sync LLMs + sync pricing
python -m pi.manage bootstrap-db
```

**Sync LLM data:**

```bash
# Sync LLM models from fixtures
python -m pi.manage sync-llms

# Sync LLM pricing from fixtures
python -m pi.manage sync-llm-pricing
```

---

### Embedding Model Commands

**Check embedding model:**

```bash
# Check if embedding model is configured and available
python -m pi.manage check-embedding-model

# Check for specific model version
python -m pi.manage check-embedding-model --model-name embed-v4.0
```

**Initialize embedding model:**

```bash
# Initialize embedding model (auto-creates if needed)
# This runs automatically during migration
python -m pi.manage init-embedding-model

# Initialize with specific model version
python -m pi.manage init-embedding-model --model-name embed-v4.0
```

**Create embedding model manually:**

```bash
# List available models
python -m pi.manage create-embedding-model --list-models

# Create with default model (from EMBEDDING_MODEL env var)
python -m pi.manage create-embedding-model

# Create with specific model
python -m pi.manage create-embedding-model --model cohere/embed-v4.0
python -m pi.manage create-embedding-model --model openai/text-embedding-3-small

# Force recreation of model
python -m pi.manage create-embedding-model --force
python -m pi.manage create-embedding-model --model cohere/embed-v4.0 --force
```

---

### Vector Database Index & Pipeline Commands

**Pipeline Management:**

```bash
# Create specific pipeline
python -m pi.manage create-vector-pipeline --pipeline-name docs_pipeline
python -m pi.manage create-vector-pipeline -p docs_pipeline

# Check if pipeline exists
python -m pi.manage check-vector-pipeline --pipeline-name docs_pipeline
python -m pi.manage check-vector-pipeline -p docs_pipeline

# Initialize all pipelines (creates if missing)
python -m pi.manage init-vector-pipelines
```

**Legacy pipeline command (deprecated):**

```bash
# Create docs embedding pipeline (use create-vector-pipeline instead)
python -m pi.manage create-docs-embed-pipeline
```

**Index Management:**

```bash
# Create specific index
python -m pi.manage create-opensearch-index --index-name docs_semantic
python -m pi.manage create-opensearch-index --index-name pi_chat_messages
python -m pi.manage create-opensearch-index -i docs_semantic

# Check if index exists
python -m pi.manage check-opensearch-index --index-name docs_semantic
python -m pi.manage check-opensearch-index -i pi_chat_messages

# Initialize specific index (creates if missing, including required pipeline)
python -m pi.manage init-opensearch-index --index-name docs_semantic
python -m pi.manage init-opensearch-index -i pi_chat_messages

# Initialize all required indexes (runs during migration)
python -m pi.manage init-vector-indexes
```

---

### Celery Commands

**Worker:**

```bash
# Start Celery worker with defaults
python -m pi.manage celery-worker

# With custom options
python -m pi.manage celery-worker --concurrency 4 --queue celery --loglevel debug
python -m pi.manage celery-worker -c 2 -Q celery -l info
```

**Beat Scheduler:**

```bash
# Start Celery beat scheduler
python -m pi.manage celery-beat

# With custom options
python -m pi.manage celery-beat --loglevel info --schedule /app/celerybeat-schedule
python -m pi.manage celery-beat -l debug -s celerybeat-schedule
```

**Flower (Monitoring):**

```bash
# Start Flower monitoring interface (default: localhost:5555)
python -m pi.manage celery-flower

# With custom host/port
python -m pi.manage celery-flower --port 5555 --address 0.0.0.0
python -m pi.manage celery-flower -p 8080 -a 127.0.0.1
```

**Test:**

```bash
# Test vector sync task manually
python -m pi.manage test-vector-sync
```

---

### Vectorization Commands

**Feed documentation:**

```bash
# Feed all documentation from configured repositories
# Fetches and indexes docs into vector database
python -m pi.manage feed-docs
```

> **Note:** Incremental sync runs automatically via Celery beat (once per day).

**Chat search index:**

```bash
# Populate index for all workspaces
python -m pi.manage vectorize-chat-messages-index

# Populate for specific workspace with custom batch size
python -m pi.manage vectorize-chat-messages-index --workspace-id abc123 --batch-size 50
python -m pi.manage vectorize-chat-messages-index -w abc123 -b 100
```

> **Note:** Tasks run in background. Check logs for progress.

**Workspace vectorization:**

```bash
# Vectorize multiple workspaces
python -m pi.manage vectorize-workspace --workspace-ids abc123,def456

# Vectorize with custom options
python -m pi.manage vectorize-workspace -w abc123 --feed-issues --no-feed-pages --batch-size 64

# Check job status
python -m pi.manage vectorize-job-status <job_id>

# Check workspace progress
python -m pi.manage vectorize-workspace-progress abc123
```

**Remove vector data:**

```bash
# Remove from all entities (issues + pages)
python -m pi.manage remove-vectorized-data --workspace-ids abc123,def456

# Remove from specific entities only
python -m pi.manage remove-vectorized-data --workspace-ids abc123 --entities issues
python -m pi.manage remove-vectorized-data -w abc123,def456 -e pages
```

> **Note:** Tasks run in background. Check Celery worker logs for progress.

---

### LLM Commands

**Add pricing:**

```bash
# Add pricing for a model (at least one price must be provided)
python -m pi.manage add-llm-pricing --model-key gpt-4o --text-input-price 2.50 --text-output-price 10.00

# Using short flags with all pricing options
python -m pi.manage add-llm-pricing -m gpt-4o-mini --inp 0.15 --out 0.60 --cached 0.075

# Add only specific pricing
python -m pi.manage add-llm-pricing -m claude-3 --inp 3.00 --cached 1.50
```

---

### Validation Commands

**Validate LLM API keys:**

```bash
# Validate OpenAI API key
python -m pi.manage validate-llm-key --provider openai
python -m pi.manage validate-llm-key -p openai

# Validate Anthropic (Claude) API key
python -m pi.manage validate-llm-key --provider anthropic
python -m pi.manage validate-llm-key -p anthropic

# Validate Groq API key
python -m pi.manage validate-llm-key --provider groq

# Validate Cohere API key
python -m pi.manage validate-llm-key --provider cohere
```

**Validate embedding model:**

```bash
# Validate embedding model ID configuration
# Checks OPENSEARCH_ML_MODEL_ID env var or database
python -m pi.manage validate-embedding-model
```

---

### Server Commands

**Run server:**

```bash
# Start FastAPI development server
python -m pi.manage runserver
```

**Legacy command (deprecated):**

```bash
# Start with database wait + migration (use separate commands instead)
python -m pi.manage start-application
```

---

## Common Workflows

### Initial Setup (Development)

**Complete setup:**

```bash
# 1. Wait for database
python -m pi.manage wait-for-db

# 2. Run migrations
python -m pi.manage migrate

# 3. Sync LLM data
python -m pi.manage sync-llms
python -m pi.manage sync-llm-pricing

# 4. Initialize embedding model (requires COHERE_API_KEY)
python -m pi.manage init-embedding-model

# 5. Initialize vector pipelines
python -m pi.manage init-vector-pipelines

# 6. Initialize vector indexes
python -m pi.manage init-vector-indexes

# 7. Feed documentation
python -m pi.manage feed-docs
```

**Or use the bootstrap command:**

```bash
# Complete bootstrap (steps 1-3 above)
python -m pi.manage bootstrap-db

# Then initialize embedding model
python -m pi.manage init-embedding-model

# Then initialize vector infrastructure
python -m pi.manage init-vector-pipelines
python -m pi.manage init-vector-indexes

# Finally feed docs
python -m pi.manage feed-docs
```

---

### Production Deployment

The deployment uses separate entrypoint scripts for different containers:

**Migrator container** (runs once on deployment):

```bash
# Automatically runs:
python -m pi.manage bootstrap-db
python -m pi.manage init-embedding-model
python -m pi.manage init-vector-pipelines
python -m pi.manage init-vector-indexes
```

**API container** (long-running service):

```bash
# Automatically runs:
python -m pi.manage wait-for-db
python -m pi.manage check-migrations
python -m pi.manage runserver
```

**Celery worker container** (background tasks):

```bash
python -m pi.manage celery-worker --concurrency 2
```

**Celery beat container** (scheduled tasks):

```bash
python -m pi.manage celery-beat
```

---

### Daily Operations

**Running background services:**

```bash
# Start Celery worker (in one terminal)
python -m pi.manage celery-worker --concurrency 2

# Start Celery beat scheduler (in another terminal)
python -m pi.manage celery-beat

# Monitor with Flower (optional, in third terminal)
python -m pi.manage celery-flower
```

**Manual operations:**

```bash
# Feed documentation (force full re-index)
python -m pi.manage feed-docs

# Vectorize specific workspaces
python -m pi.manage vectorize-workspace --workspace-ids abc123,def456

# Check progress
python -m pi.manage vectorize-workspace-progress abc123

# Check job status
python -m pi.manage vectorize-job-status <job_id>
```

---

### OpenSearch Setup Workflow

**Method 1: Using init commands (recommended for production)**

```bash
# 1. Initialize embedding model (auto-creates or uses existing)
python -m pi.manage init-embedding-model

# 2. Initialize all pipelines (creates if missing)
python -m pi.manage init-vector-pipelines

# 3. Initialize all indices (creates if missing)
python -m pi.manage init-vector-indexes

# 4. Feed documentation
python -m pi.manage feed-docs
```

**Method 2: Manual setup (recommended for development)**

```bash
# 1. Create embedding model from scratch (requires COHERE_API_KEY)
python -m pi.manage create-embedding-model

# 2. Create specific pipelines
python -m pi.manage create-vector-pipeline --pipeline-name docs_pipeline

# 3. Create specific indices
python -m pi.manage create-opensearch-index --index-name docs_semantic
python -m pi.manage create-opensearch-index --index-name pi_chat_messages

# 4. Feed documentation
python -m pi.manage feed-docs
```

**Method 3: Individual index initialization**

```bash
# Initialize each index separately (creates pipelines as needed)
python -m pi.manage init-opensearch-index --index-name docs_semantic
python -m pi.manage init-opensearch-index --index-name pi_chat_messages

# Feed documentation
python -m pi.manage feed-docs
```

---

## Command Structure

Commands are organized in separate modules by functionality:

| Module             | Description                                       | Key Commands                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `database.py`      | Database and migration commands                   | `wait-for-db`, `migrate`, `bootstrap-db`, `check-migrations`, `makemigrations`, `alembic-current`, `alembic-history`, `alembic-downgrade`                                                                              |
| `embedding.py`     | OpenSearch embedding model setup commands         | `check-embedding-model`, `init-embedding-model`, `create-embedding-model`                                                                                                                                              |
| `vdb.py`           | Vector database index and pipeline setup commands | `create-vector-pipeline`, `check-vector-pipeline`, `init-vector-pipelines`, `create-opensearch-index`, `check-opensearch-index`, `init-opensearch-index`, `init-vector-indexes`, `create-docs-embed-pipeline` (legacy) |
| `celery.py`        | Celery worker and scheduler commands              | `celery-worker`, `celery-beat`, `celery-flower`, `test-vector-sync`                                                                                                                                                    |
| `vectorization.py` | Vectorization and data feed commands              | `feed-docs`, `vectorize-chat-messages-index`, `vectorize-workspace`, `remove-vectorized-data`, `vectorize-job-status`, `vectorize-workspace-progress`                                                                  |
| `llm.py`           | LLM model pricing and fixture sync commands       | `add-llm-pricing`, `sync-llms`, `sync-llm-pricing`                                                                                                                                                                     |
| `validation.py`    | API key and model validation commands             | `validate-llm-key`, `validate-embedding-model`                                                                                                                                                                         |
| `server.py`        | Server commands                                   | `runserver`, `start-application` (deprecated)                                                                                                                                                                          |

---

## Available Commands Reference

Here's a complete list of all available commands organized alphabetically:

<details>
<summary><b>Click to expand full command list</b></summary>

- `add-llm-pricing` - Add pricing for LLM models
- `alembic-current` - Show current migration revision
- `alembic-downgrade` - Downgrade to previous migration
- `alembic-history` - Show migration history
- `bootstrap-db` - Complete database setup
- `celery-beat` - Start Celery beat scheduler
- `celery-flower` - Start Flower monitoring UI
- `celery-worker` - Start Celery worker
- `check-embedding-model` - Check embedding model status
- `check-migrations` - Check for pending migrations
- `check-opensearch-index` - Check if OpenSearch index exists
- `check-vector-pipeline` - Check if vector pipeline exists
- `create-docs-embed-pipeline` - Create docs embedding pipeline (legacy)
- `create-embedding-model` - Setup embedding model from scratch
- `create-opensearch-index` - Create specific OpenSearch index
- `create-vector-pipeline` - Create specific vector pipeline
- `feed-docs` - Feed documentation to vector database
- `init-embedding-model` - Initialize embedding model
- `init-opensearch-index` - Initialize specific OpenSearch index
- `init-vector-indexes` - Initialize all vector indexes
- `init-vector-pipelines` - Initialize all vector pipelines
- `makemigrations` - Generate migration scripts
- `migrate` - Apply database migrations
- `remove-vectorized-data` - Remove vector embeddings
- `runserver` - Start FastAPI server
- `start-application` - Start server with setup (deprecated)
- `sync-llm-pricing` - Sync LLM pricing fixtures
- `sync-llms` - Sync LLM model fixtures
- `test-vector-sync` - Test vector sync task
- `validate-embedding-model` - Validate embedding model configuration
- `validate-llm-key` - Validate LLM provider API key
- `vectorize-chat-messages-index` - Populate chat search index
- `vectorize-job-status` - Check vectorization job status
- `vectorize-workspace` - Vectorize workspace data
- `vectorize-workspace-progress` - Check workspace vectorization progress
- `wait-for-db` - Wait for database availability
- `wait-for-migrations` - Apply all pending migrations

</details>

---

## Getting Help

**View all available commands:**

```bash
python -m pi.manage --help
```

**Get help for a specific command:**

```bash
python -m pi.manage <command> --help
```

**Examples:**

```bash
python -m pi.manage vectorize-workspace --help
python -m pi.manage create-embedding-model --help
python -m pi.manage check-migrations --help
python -m pi.manage create-vector-pipeline --help
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check database connectivity with default timeout (60s)
python -m pi.manage wait-for-db

# Check with custom timeout
python -m pi.manage wait-for-db --timeout 30
```

### Migration Issues

```bash
# Check current migration status
python -m pi.manage alembic-current

# View migration history
python -m pi.manage alembic-history

# Check for pending migrations
python -m pi.manage check-migrations

# Apply pending migrations
python -m pi.manage migrate
```

### Embedding Model Issues

```bash
# Check if embedding model is configured and available
python -m pi.manage check-embedding-model

# Check for specific model version
python -m pi.manage check-embedding-model --model-name embed-v4.0

# Initialize embedding model (auto-creates or uses existing)
python -m pi.manage init-embedding-model

# Manually recreate embedding model (requires COHERE_API_KEY)
python -m pi.manage create-embedding-model
```

### Vector Pipeline Issues

```bash
# Check if specific pipeline exists
python -m pi.manage check-vector-pipeline --pipeline-name docs_pipeline

# Initialize all pipelines (creates if missing)
python -m pi.manage init-vector-pipelines

# Create specific pipeline manually
python -m pi.manage create-vector-pipeline --pipeline-name docs_pipeline
```

### OpenSearch Index Issues

```bash
# Check if indices exist
python -m pi.manage check-opensearch-index --index-name docs_semantic
python -m pi.manage check-opensearch-index --index-name pi_chat_messages

# Re-initialize specific index (creates if missing)
python -m pi.manage init-opensearch-index --index-name docs_semantic
python -m pi.manage init-opensearch-index --index-name pi_chat_messages

# Initialize all required indices
python -m pi.manage init-vector-indexes
```

### Vectorization Issues

```bash
# Check workspace vectorization progress
python -m pi.manage vectorize-workspace-progress <workspace_id>

# Check specific job status
python -m pi.manage vectorize-job-status <job_id>

# Re-run documentation feed
python -m pi.manage feed-docs

# Remove and re-vectorize workspace
python -m pi.manage remove-vectorized-data --workspace-ids <workspace_id>
python -m pi.manage vectorize-workspace --workspace-ids <workspace_id>
```

### Celery Issues

```bash
# Test if Celery is working
python -m pi.manage test-vector-sync

# Check Celery worker logs for task execution details
# and ensure worker is running:
python -m pi.manage celery-worker --concurrency 2

# Start Celery beat if scheduled tasks aren't running
python -m pi.manage celery-beat
```

### API Key Validation Issues

```bash
# Validate OpenAI API key
python -m pi.manage validate-llm-key --provider openai

# Validate Anthropic (Claude) API key
python -m pi.manage validate-llm-key --provider anthropic

# Validate Groq API key
python -m pi.manage validate-llm-key --provider groq

# Validate Cohere API key
python -m pi.manage validate-llm-key --provider cohere

# Validate embedding model configuration
python -m pi.manage validate-embedding-model
```

---
