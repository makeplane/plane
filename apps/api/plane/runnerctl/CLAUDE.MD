# Plane RunnerCtl API

Script execution engine for Plane automations.

## Technology Stack
- **Backend Framework:** Django
- **API Framework:** Django REST Framework (DRF)
- **Script Runtime:** Node.js 22 (node-runner service)

## Directory Structure

```
runnerctl/
├── fixtures/           # Django fixtures for seed data
│   ├── system_functions.json   # 15 built-in functions
│   └── system_scripts.json     # 20 built-in scripts
├── migrations/         # Database migrations
├── models/             # Django models (Script, ScriptFunction, ScriptExecution)
├── serializers/        # DRF serializers
├── services/           # Business logic
│   ├── script_builder.py    # Build scripts and validate functions
│   └── script_executor.py   # Execute scripts via node-runner
├── schemas/            # Pydantic schemas for validation
├── urls/               # URL routing
└── views/
    ├── app/            # Internal APIs (web app)
    └── api/            # External APIs (third-party)
```

## Key Models

### Script
- `name`, `description` - Script metadata
- `platform` - Runtime platform (currently `node22`)
- `code_type` - Code structure (`main_fn`, `raw`)
- `code` - Source code
- `build` - Compiled/bundled code (generated)
- `variables` - JSON array of variable definitions
- `function_names` - Detected `Functions.*` calls (generated during build)
- `is_system` - System scripts are read-only for all workspaces
- `workspace` - Nullable (null for system scripts)

### ScriptFunction
- `name` - Function name (used as `Functions.<name>`)
- `code` - Function implementation
- `parameters`, `return_type` - Type definitions
- `usage_example` - Example code
- `is_system` - System functions available to all workspaces
- `workspace` - Nullable (null for system functions)

### ScriptExecution
- Tracks execution history, status, logs, duration

## Function Dependency Detection

When scripts are saved or tested:
1. Code is sent to node-runner `/build` endpoint
2. AST parsing detects `Functions.*` calls
3. Function names are validated against available functions
4. Only required functions are sent during execution

This optimizes execution by not sending all functions to the runner.

## System Scripts & Functions

Built-in scripts and functions are stored as Django fixtures:

```bash
# Load system data
python manage.py loaddata system_functions system_scripts
```

| Fixture | Count | Categories |
|---------|-------|------------|
| `system_functions.json` | 15 | http, data, notifications, utils |
| `system_scripts.json` | 20 | notifications, work-items, integrations, reports, utilities |

System resources:
- Are read-only (cannot be edited or deleted via API)
- Have `is_system=True` and `workspace=None`
- Are included in list queries for all workspaces

## API Routing Convention

### Internal APIs (`/api/runnerctl/`)
- **Purpose:** Backend-for-frontend APIs
- **Usage:** Web application integration
- **Location:** `views/app/`

### External APIs (`/api/v1/runnerctl/`)
- **Purpose:** Public/external API endpoints
- **Usage:** Third-party integrations
- **Location:** `views/api/`

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/scripts/` | GET | List scripts (includes system scripts) |
| `/scripts/` | POST | Create workspace script |
| `/scripts/<id>/` | GET/PUT/DELETE | Manage script (403 for system scripts) |
| `/scripts/test/` | POST | Test script code without saving |
| `/functions/` | GET | List functions (includes system functions) |

## Node Runner Service

Located at `apps/runners/node-runner/`, this is the script execution runtime.

### Directory Structure

```
node-runner/
├── src/
│   ├── server.ts           # Express server with /build, /validate, /execute-sync
│   ├── isolate-executor.ts # Isolated script execution
│   ├── npm-installer.ts    # Build scripts with dependencies
│   ├── env.ts              # Environment validation (Zod)
│   ├── types.ts            # TypeScript interfaces
│   └── index.ts            # Entry point
├── package.json
└── tsconfig.json
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /build` | Build code, return bundle + detected `function_names` |
| `POST /validate` | Validate code syntax without execution |
| `POST /execute-sync` | Execute script and return result |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `EXECUTION_TIMEOUT_MS` | 20000 | Script execution timeout |
| `INIT_TIMEOUT_MS` | 5000 | Initialization timeout |
| `ISOLATE_MEMORY_MB` | 128 | Memory limit per execution |
| `API_BASE_URL` | required | Plane API URL for SDK |
| `RUNNER_HMAC_SECRET_KEY` | required | HMAC secret for auth |
| `CONTROL_SERVICE_BASE_URL` | required | Control service URL |

### Execution Context

Scripts receive these objects:

```javascript
async function main({ event, context }, { Plane, Functions, ENV, Variables }) {
  // event - Trigger event data
  // context - Execution metadata (automation_id, etc.)
  // Plane - Plane SDK client (workItems, projects, etc.)
  // Functions - Reusable functions (httpRequest, sendSlackMessage, etc.)
  // ENV - Environment variables from workspace settings
  // Variables - Script-specific variables configured in UI
}
```

### Development Commands

```bash
cd apps/runners/node-runner

# Development (with hot reload)
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start
```

### Key Dependencies

- `express` - HTTP server
- `acorn` + `acorn-walk` - AST parsing for function detection
- `@makeplane/plane-node-sdk` - Plane API client
- `zod` - Environment validation

## Development Guidelines

- Follow Django and DRF best practices
- Use `serializer.is_valid()` then `serializer.errors` for 400 responses
- System scripts/functions cannot be modified via API
- Script builds are triggered on create/update when code changes
- Function validation happens during build, not execution
