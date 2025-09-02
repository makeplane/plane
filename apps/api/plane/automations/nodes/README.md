# Automation Trigger Nodes

This directory contains the implementation of trigger nodes for the Plane Automation Engine. These triggers detect database events and determine whether an automation should be triggered.

## Overview

The trigger nodes are designed with **exclusive event handling** to prevent duplicate automation runs:

- **High-Value Triggers**: Handle ONLY specific high-value events (e.g., `issue.state.changed`)
- **Generic Triggers**: Handle ONLY generic events (e.g., `issue.updated`)

This ensures that when high-value events are available, they are used exclusively, and generic events serve as fallbacks for broader coverage.

## Available Triggers

### Generic Triggers

#### `record_created`

Triggers when new records are created for specific models.

**Parameters:**

- `model_name` (required): Name of the Django model to monitor

**Supported Events:**

- `issue.created`
- `cycle.created`
- `module.created`
- `project.created`
- etc.

**Example Configuration:**

```json
{
  "handler_name": "record_created",
  "config": {
    "model_name": "Issue"
  }
}
```

#### `record_updated`

Triggers when records are updated, with optional field filtering.

**Parameters:**

- `model_name` (required): Name of the Django model to monitor
- `field_filters` (optional): Only trigger when these fields change
- `exclude_fields` (optional): Ignore changes to these fields

**Supported Events:**

- `issue.updated` (generic updates only)
- `cycle.updated`
- `module.updated`
- etc.

**Example Configuration:**

```json
{
  "handler_name": "record_updated",
  "config": {
    "model_name": "Issue",
    "field_filters": ["priority", "description"],
    "exclude_fields": ["updated_at", "updated_by"]
  }
}
```

**Note:** This trigger handles generic `.updated` events only. For specific state or assignee changes, use the specialized high-value triggers.

### High-Value Specific Triggers

#### `state_changed`

Triggers when an issue's state transitions.

**Parameters:**

- `from_state_id` (optional): Specific source state UUID
- `to_state_id` (optional): Specific target state UUID
- `from_state_group` (optional): Source state group (e.g., "backlog", "started")
- `to_state_group` (optional): Target state group (e.g., "completed", "cancelled")

**Supported Events:**

- `issue.state.changed` **ONLY** (high-value specific)

**Example Configuration:**

```json
{
  "handler_name": "state_changed",
  "config": {
    "from_state_group": "started",
    "to_state_group": "completed"
  }
}
```

**Event Example:**

```json
{
  "event_type": "issue.state.changed",
  "data": {
    "issue_id": "uuid",
    "old_state": {
      "id": "old-state-uuid",
      "name": "In Progress",
      "group": "started"
    },
    "new_state": {
      "id": "new-state-uuid",
      "name": "Done",
      "group": "completed"
    }
  }
}
```

#### `assignee_changed`

Triggers when an issue's assignees change.

**Parameters:**

- `change_type` (optional): "added", "removed", or "any" (default: "any")
- `user_id` (optional): Specific user UUID to monitor

**Supported Events:**

- `issue.assignee.added` **ONLY** (high-value specific)
- `issue.assignee.removed` **ONLY** (high-value specific)

**Example Configuration:**

```json
{
  "handler_name": "assignee_changed",
  "config": {
    "change_type": "added",
    "user_id": "specific-user-uuid"
  }
}
```

#### `issue_archived`

Triggers when an issue is archived.

**Parameters:**

- `archive_type` (optional): "manual" or "automatic"

**Supported Events:**

- `issue.archived` **ONLY** (high-value specific)

**Example Configuration:**

```json
{
  "handler_name": "issue_archived",
  "config": {
    "archive_type": "manual"
  }
}
```

#### `issue_restored`

Triggers when an archived issue is restored.

**Parameters:** None

**Supported Events:**

- `issue.restored` **ONLY** (high-value specific)

**Example Configuration:**

```json
{
  "handler_name": "issue_restored",
  "config": {}
}
```

#### `comment_created`

Triggers when a comment is added to an issue.

**Parameters:** None

**Supported Events:**

- `issue.comment.created` **ONLY** (high-value specific)

**Example Configuration:**

```json
{
  "handler_name": "comment_created",
  "config": {}
}
```

## Condition Nodes

Condition nodes enable sophisticated conditional logic in automation workflows using JSON filter expressions. They support complex nested logical operations with multiple field comparisons.

### JSON Filter Condition

The `json_filter` condition node evaluates complex filter expressions with nested logical operators and field comparisons.

#### Basic Syntax

**Simple Field Comparison:**

```json
{
  "handler_name": "json_filter",
  "config": {
    "filter_expression": {
      "field": "data.priority",
      "operator": "equals",
      "value": "high"
    }
  }
}
```

**Complex Nested Logic:**

```json
{
  "handler_name": "json_filter",
  "config": {
    "filter_expression": {
      "and": [
        {
          "field": "data.priority",
          "operator": "in",
          "value": ["high", "urgent"]
        },
        {
          "or": [
            { "field": "data.assignee_count", "operator": "gt", "value": 0 },
            {
              "field": "data.labels",
              "operator": "contains",
              "value": "critical"
            }
          ]
        },
        {
          "not": {
            "field": "data.archived",
            "operator": "equals",
            "value": true
          }
        }
      ]
    }
  }
}
```

### Field Operators

| Operator   | Description             | Example Value          | Use Case                          |
| ---------- | ----------------------- | ---------------------- | --------------------------------- |
| `equals`   | Exact equality match    | `"high"`, `42`, `true` | Priority, status, boolean flags   |
| `in`       | Value in list           | `["high", "urgent"]`   | Multiple allowed values           |
| `contains` | Text contains substring | `"bug"`, `"urgent"`    | Search within names, descriptions |
| `gt`       | Greater than            | `5`, `100.5`           | Numbers, dates                    |
| `gte`      | Greater than or equal   | `10`, `0`              | Min thresholds                    |
| `lt`       | Less than               | `50`, `1000`           | Max limits                        |
| `lte`      | Less than or equal      | `100`, `24`            | Upper bounds                      |

**Note:** Use the `not` logical operator to negate any condition instead of separate `not_*` operators.

### Logical Operators

#### `and` - All conditions must be true

```json
{
  "and": [
    { "field": "data.priority", "operator": "equals", "value": "high" },
    { "field": "data.assignee_count", "operator": "gt", "value": 2 },
    { "field": "data.archived", "operator": "equals", "value": false }
  ]
}
```

#### `or` - Any condition can be true

```json
{
  "or": [
    { "field": "data.priority", "operator": "equals", "value": "urgent" },
    { "field": "data.name", "operator": "contains", "value": "critical" },
    { "field": "data.labels", "operator": "contains", "value": "security" }
  ]
}
```

#### `not` - Condition must be false

```json
{
  "not": {
    "field": "data.archived",
    "operator": "equals",
    "value": true
  }
}
```

### Field Path Resolution

JSON filters support dot notation for accessing nested data:

- `data.priority` - Direct field access
- `data.state.group` - Nested object access
- `data.assignees.0.name` - Array element access

**Example Event Structure:**

```json
{
  "event_type": "issue.state.changed",
  "data": {
    "issue_id": "uuid",
    "priority": "high",
    "state": {
      "id": "state-uuid",
      "group": "completed"
    },
    "assignees": [
      { "id": "user1-uuid", "name": "John" },
      { "id": "user2-uuid", "name": "Jane" }
    ]
  }
}
```

### Common Use Cases

#### High Priority Issues with Assignees

```json
{
  "and": [
    {
      "field": "data.priority",
      "operator": "in",
      "value": ["high", "urgent", "critical"]
    },
    { "field": "data.assignee_count", "operator": "gt", "value": 0 },
    { "field": "data.archived", "operator": "equals", "value": false }
  ]
}
```

#### Security Issues in Active State

```json
{
  "and": [
    { "field": "data.labels", "operator": "contains", "value": "security" },
    {
      "field": "data.state.group",
      "operator": "in",
      "value": ["started", "unstarted"]
    },
    {
      "or": [
        {
          "field": "data.name",
          "operator": "contains",
          "value": "vulnerability"
        },
        {
          "field": "data.description",
          "operator": "contains",
          "value": "exploit"
        }
      ]
    }
  ]
}
```

#### Overdue Issues

```json
{
  "and": [
    { "field": "data.target_date", "operator": "lt", "value": "2024-01-01" },
    {
      "not": {
        "field": "data.state.group",
        "operator": "equals",
        "value": "completed"
      }
    },
    { "field": "data.archived", "operator": "equals", "value": false }
  ]
}
```

#### Issues by Specific User

```json
{
  "or": [
    {
      "field": "data.assignees.0.id",
      "operator": "equals",
      "value": "user-uuid"
    },
    {
      "field": "data.assignees.1.id",
      "operator": "equals",
      "value": "user-uuid"
    },
    { "field": "data.created_by", "operator": "equals", "value": "user-uuid" }
  ]
}
```

#### Complex Business Logic

```json
{
  "and": [
    {
      "or": [
        { "field": "data.priority", "operator": "equals", "value": "urgent" },
        {
          "and": [
            { "field": "data.priority", "operator": "equals", "value": "high" },
            { "field": "data.estimate", "operator": "lte", "value": 8 }
          ]
        }
      ]
    },
    {
      "field": "data.state.group",
      "operator": "in",
      "value": ["backlog", "unstarted"]
    },
    {
      "not": {
        "field": "data.labels",
        "operator": "contains",
        "value": "blocked"
      }
    },
    { "field": "data.created_at", "operator": "gte", "value": "2024-01-01" }
  ]
}
```

### Type Handling

The JSON filter condition automatically handles type conversions:

- **Strings**: Case-sensitive comparisons by default
- **Numbers**: Automatic conversion between integers, floats, and numeric strings
- **Booleans**: Strict boolean matching
- **Dates**: Supports ISO 8601 strings, Date objects, and relative comparisons
- **Arrays**: Element access via numeric indices
- **Null/None**: Explicit null value matching

### Performance Considerations

- **Field Path Optimization**: Shorter paths are faster to resolve
- **Operator Choice**: `equals` and `in` are generally fastest
- **Logical Complexity**: Deeply nested conditions may impact performance
- **Early Termination**: `and` stops on first false, `or` stops on first true

## Event Handling Strategy

### Exclusive Event Handling

To prevent duplicate automation runs, triggers use **exclusive event handling**:

1. **High-Value Triggers** handle ONLY their specific event types
2. **Generic Triggers** handle ONLY generic `.updated` and `.created` events
3. **No Overlap** ensures each event triggers exactly one automation type

### When to Use Which Trigger

| Use Case              | Recommended Trigger                | Why                                            |
| --------------------- | ---------------------------------- | ---------------------------------------------- |
| State transitions     | `state_changed`                    | Rich state context, group filtering            |
| Assignee changes      | `assignee_changed`                 | User-specific filtering, change type detection |
| Archive/restore       | `issue_archived`, `issue_restored` | Specific workflow events                       |
| New comments          | `comment_created`                  | Comment-specific automation                    |
| Generic field changes | `record_updated`                   | Flexible field filtering                       |
| Record creation       | `record_created`                   | Simple creation detection                      |

### Migration Strategy

If you're currently using generic events and want to switch to high-value events:

1. **Before**: Use `record_updated` with `field_filters: ["state_id"]`
2. **After**: Use `state_changed` with state group filtering

The high-value triggers provide:

- **Richer Context**: Full state objects instead of just IDs
- **Better Performance**: Pre-structured data, no field parsing needed
- **Enhanced Filtering**: State groups, user objects, archive types

## Implementation Details

### Base Classes

All triggers inherit from `TriggerNode` which provides:

- Pydantic parameter validation
- Common execution interface
- Registry integration

All conditions inherit from `ConditionNode` which provides:

- Field path resolution with dot notation
- JSON filter expression evaluation
- Registry integration

### Event Matching

- **Exact Type Matching**: High-value triggers match specific event types only
- **Field Change Detection**: Generic triggers analyze `old_values` for changes
- **No Fallbacks**: Each trigger handles its designated event types exclusively

### Performance Considerations

- High-value events provide pre-structured data for optimal performance
- Generic events require field-level analysis but offer broader compatibility
- State group filtering works directly from event data when available
- JSON filter conditions are optimized for complex logical expressions
- Field path resolution is cached for repeated evaluations

## Testing

All triggers and conditions are comprehensively tested with:

- Exclusive event type handling
- Parameter validation
- Edge cases and error conditions

Run tests with:

```bash
python manage.py test plane.automations.tests
```

## Usage in Automation Workflows

Triggers and conditions are used in automation workflows by specifying the handler name and configuration:

```json
{
  "node_id": "trigger_1",
  "name": "When Issue Completed",
  "node_type": "trigger",
  "handler_name": "state_changed",
  "config": {
    "to_state_group": "completed"
  }
}
```

```json
{
  "node_id": "condition_1",
  "name": "If High Priority",
  "node_type": "condition",
  "handler_name": "json_filter",
  "config": {
    "filter_expression": {
      "field": "data.priority",
      "operator": "equals",
      "value": "high"
    }
  }
}
```

The automation engine will:

1. Load the trigger configuration
2. Create a trigger instance with validated parameters
3. Execute the trigger for each relevant event
4. Start automation runs when triggers match (no duplicates)
5. Evaluate conditions during workflow execution
