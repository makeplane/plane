# Automations Module

Rule-based workflow automation engine.

## Purpose

Event-driven automation system for automating issue operations based on triggers, conditions, and actions.

## Architecture

```
Event → Trigger Match → Condition Check → Sequential Actions → Result
```

## Node Types

### Triggers

| Node               | Purpose                  |
| ------------------ | ------------------------ |
| `record_created`   | When a record is created |
| `record_updated`   | When a record is updated |
| `state_changed`    | When issue state changes |
| `assignee_changed` | When assignee changes    |
| `comment_created`  | When comment is added    |

### Conditions

| Node          | Purpose                                   |
| ------------- | ----------------------------------------- |
| `json_filter` | Complex conditional logic with JSON rules |

### Actions

| Node              | Purpose                |
| ----------------- | ---------------------- |
| `add_comment`     | Add a comment to issue |
| `change_property` | Modify issue property  |

## Database Models

Located in `plane.ee.models.automation`:

- `Automation`: Automation definition
- `AutomationVersion`: Version tracking
- `AutomationNode`: Individual nodes
- `AutomationEdge`: Node connections
- `AutomationRun`: Execution instance
- `NodeExecution`: Individual node execution

## Key Components

### Registry

Registers and manages available node types for triggers, conditions, and actions.

### Engine

Core execution logic that processes automations:

1. Match triggers to events
2. Evaluate conditions
3. Execute actions sequentially
4. Track results

### Consumer

Consumes events and triggers matching automations.

## Features

- Multiple actions per automation (sequential execution)
- Full audit trail via AutomationRun and NodeExecution
- Pydantic-based schema validation
- Version control for automations
