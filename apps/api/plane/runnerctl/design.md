# RunnerCtl System Design

## Overview

RunnerCtl provides a **Scripts** feature - reusable code entities that can be executed by various triggers:

- **Manual** - Direct script testing from the UI
- **Automation** - Triggered by automation rules (e.g., when `issue.created`)
- **Future triggers** - Cron jobs, webhooks, etc. (each feature owns its own "task" model)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Triggers                              │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│   Manual    │ Automation  │  Cron Job   │   Future...      │
│   (UI)      │  (Rules)    │ (Scheduler) │                  │
└──────┬──────┴──────┬──────┴──────┬──────┴────────┬─────────┘
       │             │             │               │
       └─────────────┴─────────────┴───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Script     │  ← Reusable code entity
                    └───────┬───────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  ScriptExecution    │  ← Universal execution log
                 │  (trigger_type,     │
                 │   trigger_id)       │
                 └─────────────────────┘
```

Each trigger system (Automations, Cron Jobs, etc.) stores a reference to `script_id` in its own model and creates `ScriptExecution` records when triggered.

## Data Models

All models inherit from `BaseModel` which provides workspace relationships and audit fields.

### Script Model

Represents a reusable script that can be executed by various triggers.

| Field             | Type         | Description                                 | Required |
| ----------------- | ------------ | ------------------------------------------- | -------- |
| `id`              | UUID         | Primary key identifier                      | ✓        |
| `name`            | VARCHAR(255) | Script name                                 | ✓        |
| `description`     | TEXT         | Script description                          | ✗        |
| `workspace`       | FK           | Workspace reference                         | ✓        |
| `project`         | FK           | Project reference (optional)                | ✗        |
| `platform`        | VARCHAR(30)  | Runtime platform (default: node22)          | ✓        |
| `code`            | TEXT         | Script source code                          | ✓        |
| `build`           | TEXT         | Build configuration/dependencies            | ✗        |
| `env_variables`   | JSON         | Environment variables for execution         | ✗        |
| `allowed_domains` | JSON         | Permitted external domains for fetch calls  | ✗        |
| `credential`      | VARCHAR(255) | API key or credential for external services | ✗        |
| `created_at`      | DATETIME     | Creation timestamp                          | ✓        |
| `updated_at`      | DATETIME     | Last update timestamp                       | ✓        |

### ScriptExecution Model

Tracks individual script execution instances with their results and status.

| Field             | Type        | Description                                                        | Required |
| ----------------- | ----------- | ------------------------------------------------------------------ | -------- |
| `id`              | UUID        | Primary key identifier                                             | ✓        |
| `workspace`       | FK          | Workspace reference                                                | ✓        |
| `project`         | FK          | Project reference (inherited from script)                          | ✗        |
| `script`          | FK          | Reference to Script                                                | ✓        |
| `trigger_type`    | VARCHAR(30) | Trigger source: `manual`, `automation`, `cron_job`, etc.           | ✓        |
| `trigger_id`      | UUID        | ID of triggering entity (automation rule, cron job, etc.)          | ✗        |
| `trigger_context` | JSON        | Additional context (event payload, cron schedule, etc.)            | ✗        |
| `status`          | ENUM        | Execution status: `pending`, `in_progress`, `completed`, `errored` | ✓        |
| `input_data`      | JSON        | Input parameters for execution                                     | ✗        |
| `output_data`     | JSON        | Execution results/output                                           | ✗        |
| `error_data`      | JSON        | Error details if execution failed                                  | ✗        |
| `started_at`      | DATETIME    | Execution start time                                               | ✗        |
| `completed_at`    | DATETIME    | Execution end time                                                 | ✗        |
| `created_at`      | DATETIME    | Creation timestamp                                                 | ✓        |
| `updated_at`      | DATETIME    | Last update timestamp                                              | ✓        |

## API Endpoints

### Script Management

#### List/Create Scripts

- **Method:** `GET`, `POST`
- **Endpoint:** `/api/runnerctl/workspaces/{slug}/runnerctl/scripts/`
- **Description:** List all scripts or create a new script
- **Query Params:** `project_id`, `platform`

#### Get/Update/Delete Script

- **Method:** `GET`, `PATCH`, `DELETE`
- **Endpoint:** `/api/runnerctl/workspaces/{slug}/runnerctl/scripts/{script_id}/`
- **Description:** Retrieve, update, or delete a specific script

#### Execute Script (Manual)

- **Method:** `POST`
- **Endpoint:** `/api/runnerctl/workspaces/{slug}/runnerctl/scripts/{script_id}/execute/`
- **Description:** Manually execute a script for testing
- **Request Body:** `{ "input_data": {...} }`
- **Response:** Created execution details

#### Get Script Stats

- **Method:** `GET`
- **Endpoint:** `/api/runnerctl/workspaces/{slug}/runnerctl/scripts/{script_id}/stats/`
- **Description:** Get execution statistics for a script
- **Response:** Total executions, success/failure counts, breakdown by trigger type

### Execution Management

#### List All Executions

- **Method:** `GET`
- **Endpoint:** `/api/workspaces/{slug}/runnerctl/executions/`
- **Description:** List all executions in workspace (across all scripts, including test runs)
- **Query Params:** `trigger_type`, `status`, `script_id`

#### Get Execution Details

- **Method:** `GET`
- **Endpoint:** `/api/workspaces/{slug}/runnerctl/executions/{execution_id}/`
- **Description:** Get details of a specific execution (works for both test and script runs)

#### List Script Executions

- **Method:** `GET`
- **Endpoint:** `/api/workspaces/{slug}/runnerctl/scripts/{script_id}/executions/`
- **Description:** List all executions for a specific script
- **Query Params:** `trigger_type`, `status`

## Integration Pattern

When another feature (e.g., Automations) wants to use Scripts:

```python
# In Automations app - use the execute_sync service
from plane.runnerctl.services import execute_sync

# When automation triggers:
def execute_automation_action(action, event_context):
    if action.action_type == "run_script":
        result = execute_sync(
            script_id=str(action.script.id),
            input_data={"event": event_context},
            trigger_type="automation",
            trigger_id=str(action.automation_rule.id),
        )
        return result.success
```

## Execution Flow (Synchronous)

```
1. Trigger (Test/Manual/Automation/etc.)
   ↓
2. Call execute_sync() service
   ↓
3. Create ScriptExecution record (status: pending)
   ↓
4. Update status to in_progress, set started_at
   ↓
5. Call Node Runner /execute-sync endpoint with code
   ↓
6. Node Runner builds and executes script
   ↓
7. Node Runner returns result directly
   ↓
8. Update ScriptExecution with result (completed/errored)
   ↓
9. Return ScriptExecutionResult to caller
```

## Status Flow

```
Pending → In Progress → Completed
                     ↘ Errored
```

## Security Considerations

- **Domain Restrictions:** `allowed_domains` field limits external API calls
- **Credential Management:** Simple string-based credential storage for API keys
- **Environment Isolation:** Environment variables scoped per script
- **Project-based Access:** All data isolated by project/workspace membership
