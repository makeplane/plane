# Agents Module

AI agent orchestration system for automated interactions.

## Purpose

Manages AI agent execution for automated issue interactions and responses triggered by user mentions.

## Models

### AgentRun

Tracks individual agent execution instances.

**Status Lifecycle**:

- `created`: Initial state
- `in_progress`: Agent executing
- `awaiting`: Waiting for user input
- `completed`: Successfully finished
- `stopped`: Manually stopped
- `failed`: Execution failed
- `stale`: Timed out (5 minutes)

**Key Fields**:

- `agent`: Reference to the agent
- `issue`: Related issue
- `status`: Current status
- `metadata`: Execution metadata
- `error_info`: Error details if failed

### AgentRunActivity

Activities within an agent run.

**Activity Types**:

- `action`: Agent action
- `elicitation`: User prompt
- `error`: Error occurred

## Workflow

1. User mentions agent in issue comment
2. Background task triggered
3. AgentRun created with `created` status
4. Webhook sent to external agent service
5. Agent processes and responds
6. Activities logged as AgentRunActivity
7. Status updated to `completed`/`failed`

## Integration

- Event-driven via comment mentions
- Webhook-based communication with external agents
- Multi-turn conversation support
- Stale timeout detection (5 minutes)

## Background Tasks

Located in `bgtasks/`:

- Webhook trigger processing
- Activity handling
- Status updates
