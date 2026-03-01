# Silo - Integrations Engine

Node.js/TypeScript service for external integrations, data imports, and real-time sync with Jira, GitHub, Linear, Slack, and others.

See [docs/TYPESCRIPT.md](../../docs/TYPESCRIPT.md) for conventions.

## Service Types

- **API Server** (`api`): REST endpoints for integration configuration and webhooks
- **Import Tasks** (`imports`): Queue-based workers for data migration
- **Integration Tasks** (`integrations`): Real-time event processing and sync

## Commands

```bash
pnpm dev                         # Start all services
node dist/start.mjs api          # API server only
node dist/start.mjs imports      # Import workers only
node dist/start.mjs integrations # Integration workers only
pnpm build                       # Build for production
pnpm test                        # Run tests
```

## Environment Configuration

Key environment variable categories:

- **Database**: `DATABASE_URL`, `PG_SCHEMA`
- **Message Queue**: `AMQP_URL`, `REDIS_URL`
- **External APIs**: `API_BASE_URL`, `API_INTERNAL_BASE_URL`
- **Integration Keys**: Provider-specific OAuth client IDs/secrets
- **AWS S3**: Bucket name and access keys for file storage

## Key Patterns

- **Module Isolation**: Each integration in its own `apps/` directory
- **ETL Framework**: Common import pipeline for transforming external data
- **Queue-Based Processing**: RabbitMQ for background tasks
- **OAuth Strategy Pattern**: Pluggable OAuth providers

## Adding New OAuth Provider

1. Create strategy implementing `OAuthStrategy` interface
2. Register in oauth services with environment variable checks
3. Add provider-specific environment variables

## Adding New Importer

1. Create app directory with controllers, migrator, helpers, workers
2. Register controller in server
3. Extend ETL migrators for common entities

## Worker Development

- Import workers extend `BaseImportWorker`
- Integration workers use queue infrastructure from worker base
- All workers support graceful shutdown and error handling

## @plane/etl Package

Silo depends on `@plane/etl` for provider-specific ETL utilities:

```typescript
import { createJiraService } from "@plane/etl/jira";
import { E_JOB_STATUS } from "@plane/etl/core";
```

**Providers**: asana, clickup, flatfile, github, gitlab, jira, jira-server, linear, sentry, slack

**Key Exports**:

- Core Enums: `E_JOB_STATUS`, `E_IMPORTER_KEYS`, `E_SILO_ERROR_CODES`
- Type Definitions: `PlaneEntities`, provider-specific entity types
- API Services: Provider service builders (`createJiraService`, `createLinearService`)
- Authentication: OAuth service builders (`createGithubAuth`, `createLinearAuthService`)
- ETL Functions: Transform utilities (`transformIssue`, `transformUser`, `transformComment`)

## Performance

- Batch processing with configurable `BATCH_SIZE` (default 50)
- Redis caching for frequently accessed data
- Database connection pooling
- Message queue prefetch limits via `MQ_PREFETCH_COUNT`
