# Plane Automations App

## 0. Overview

This Django app powers Plane's **Automation Engine**. It provides:

1. A lightweight **registry system** for Trigger, Action, and Condition nodes.
2. Base classes / decorators so new nodes can be added in one file.
3. Auto-discovery at Django start-up so nodes self-register.
4. Database models (see `plane.ee.models.automation`) that store published workflows and execution history.
5. **Linear workflow execution**: Trigger → Condition (optional) → Action(s)
6. **Event-driven architecture** with RabbitMQ integration and Celery task processing.

---

## 1. Database Models (summary)

| Model                 | Purpose                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| **Automation**        | User-visible workflow container (`scope`, status, version pointer)      |
| **AutomationVersion** | Immutable snapshot incl. nodes/edges (JSON configuration)               |
| **AutomationNode**    | Trigger / Action / Condition definition                                 |
| **AutomationEdge**    | Directed edges with optional JSON `condition`                           |
| **AutomationRun**     | Execution instance; stores `trigger_event`, `result`, status lifecycle. |
| **NodeExecution**     | Per-node audit inside a run, with retries and I/O JSON                  |

Detailed ER diagram: `automation_models.md`.

---

## 2. Automation Execution Flow

The automation engine follows a **linear execution model**:

```
Event → Trigger Match → [Condition Check] → Action 1 → Action 2 → ... → Action N → Result
```

**Multiple Action Support**: Automations can have multiple action nodes that execute sequentially. If any action fails, execution stops immediately and the automation is marked as failed.

### Key Components

1. **Event Processing**: RabbitMQ events from `plane_event_stream` are consumed and processed
2. **Trigger Evaluation**: Check if automation triggers match the incoming event
3. **Condition Filtering**: Optional conditional logic to further filter when actions run
4. **Action Execution**: Perform the actual automation work - each action does a single operation, supports multiple actions executed sequentially
5. **Audit Trail**: Full execution history stored in `AutomationRun` and `NodeExecution`

### Event Structure

All events follow this standardized structure:

```json
{
  "timestamp": 1754043667,
  "event_id": "aeb02eb8-c074-4af8-bed1-4846dac62dc6",
  "event_type": "issue.state.updated",
  "entity_type": "issue",
  "entity_id": "4b207c80-66e3-48c7-85fc-1986d52cd866",
  "workspace_id": "cd4ab5a2-1a5f-4516-a6c6-8da1a9fa5be4",
  "project_id": "02c3e1d5-d7e2-401d-a773-45ecba45d745",
  "payload": {
    "data": {
      "id": "4b207c80-66e3-48c7-85fc-1986d52cd866",
      "priority": "high",
      "state_id": "8baf36f0-2740-4e43-8485-40a9fad7f216",
      "assignee_ids": ["f8e6743d-cf23-4c16-a74b-a7b60b2b596a"],
      "label_ids": ["11d87069-4ca8-4d55-86b9-decb0b010b38"],
      "target_date": "2024-12-31",
      "start_date": null
    },
    "previous_attributes": {
      "state_id": "3cefb6a8-729e-48aa-8cdd-3bd88f3e8a3e",
      "completed_at": null
    }
  }
}
```

**Template Variable Access**: Use `{{payload.data.priority}}`, `{{payload.data.assignee_ids.0}}`, etc.

---

## 3. Available Node Types

### Triggers

- **`record_created`**: Fires when records are created (\*.created events)
- **`record_updated`**: Fires on generic updates (\*.updated events)
- **`state_changed`**: Fires on state transitions (issue.state.updated)
- **`assignee_changed`**: Fires on assignee changes (issue.assignee.added/removed)
- **`comment_created`**: Fires when comments are added (issue.comment.created)

### Conditions

- **`json_filter`**: Complex JSON-based conditional logic with `and`/`or`/`not` operators

### Actions

Each action performs a single, focused operation:

- **`add_comment`**: Add automated comments to issues
- **`change_property`**: Modify a single issue property (priority, state, assignees, labels, or dates)

**Design Principle**: Use multiple action nodes for complex workflows rather than combining operations in a single action.

---

## 4. Quick Start

```bash
# Add a new automation node
$ touch plane/automations/nodes/my_node.py
```

```python
# my_node.py – simple “Hello World” Action
from pydantic import BaseModel
from plane.automations.registry import register_node, ActionNode

class Params(BaseModel):
    message: str = "Hello World"

@register_node("hello_world", "action", Params)
class HelloWorld(ActionNode):
    schema = Params
    name = "hello_world"

    def execute(self, event: dict, context: dict):
        print(self.params.message)
        return {"printed": self.params.message}
```

Start Plane → Django loads the module → the node is instantly available in the registry.

```python
from plane.automations.registry import NodeRegistry
print(NodeRegistry().all().keys())  # dict_keys(['hello_world'])
```

---

## 5. Registry Internals

| Item                       | Location      | Purpose                                        |
| -------------------------- | ------------- | ---------------------------------------------- |
| `NodeRegistry`             | `registry.py` | Singleton `name → NodeMeta` mapping            |
| `register_node`            | `registry.py` | Decorator for effortless registration          |
| `BaseAutomationNode`       | `registry.py` | Optional OO helper with Pydantic param parsing |
| `TriggerNode / ActionNode` | `registry.py` | Concrete base classes presetting `node_type`   |

### NodeMeta

```text
name        – unique key used in DB (AutomationNode.handler_name)
node_type   – trigger / action / condition
handler     – function or class implementing execute()
schema      – pydantic.BaseModel for params
```

---

## 6. Developing Nodes

1. Create a **Pydantic schema** describing parameters.
2. Derive from `TriggerNode` / `ActionNode` _or_ supply a plain function.
3. Decorate with `@register_node("name", "node_type", Schema)`.
4. Drop the file inside `plane/automations/nodes/`.

> No manual import needed – discovery happens automatically during `AppConfig.ready()`.

Example snippets are at the end of this document for copy-paste convenience.

---

## 7. Autodiscovery Flow

1. `AutomationConfig.ready()` imports **every** module under `plane/automations/nodes/`.
2. Import side-effects fire the decorator → registry populated.
3. API/catalogue endpoints use `NodeRegistry().all()` to generate JSON Schema.

---

## 8. Versioning & Backward Compatibility

- Database references nodes **by name** – keep names stable.
- Breaking changes → register under a new name (e.g., `send_email_v2`).
- Old automation versions continue to resolve to the handler they were published with.

---

## 9. Practical Examples

### 9.1 Single Action Node Example

**Use Case**: When an issue is marked as high priority, add an urgent comment.

**Note**: Each action node should perform a single, focused operation. For complex workflows requiring multiple operations, use multiple action nodes that execute sequentially.

```python
# Trigger: Priority change detection
@register_node("priority_changed", "trigger", PriorityChangedParams)
class PriorityChangedTrigger(TriggerNode):
    def execute(self, event: dict, context: dict):
        event_type = event.get("event_type", "")
        if event_type == "issue.updated":
            payload = event.get("payload", {})
            previous = payload.get("previous_attributes", {})
            current_priority = payload.get("data", {}).get("priority")

            return {
                "success": "priority" in previous and current_priority == "high",
                "action": "priority_changed",
                "result": {"new_priority": current_priority}
            }
        return {"success": False, "action": "priority_changed"}

# Condition: Only during business hours
@register_node("business_hours", "condition", BusinessHoursParams)
class BusinessHoursCondition(ConditionNode):
    def execute(self, event: dict, context: dict):
        from datetime import datetime
        now = datetime.now()
        is_business_hours = 9 <= now.hour <= 17 and now.weekday() < 5

        return {
            "success": is_business_hours,
            "action": "business_hours",
            "result": {"current_hour": now.hour, "is_weekday": now.weekday() < 5}
        }

# Action: Add urgent comment (single operation)
@register_node("add_urgent_comment", "action", AddUrgentCommentParams)
class AddUrgentCommentAction(ActionNode):
    def execute(self, event: dict, context: dict):
        issue_id = event.get("entity_id")
        # Add urgent priority comment
        comment_result = self._add_urgent_comment(issue_id)

        return {
            "success": True,
            "action": "add_urgent_comment",
            "result": {
                "comment_id": comment_result.get("id"),
                "comment_text": "🚨 Issue marked as HIGH priority - requires immediate attention"
            }
        }
```

### 9.2 Multiple Action Nodes Example

**Use Case**: When an issue is marked as high priority, execute a sequence of single-purpose actions that must all succeed.

**Design Principle**: Each action node performs one focused operation. Complex workflows are built by chaining multiple single-purpose actions.

**Workflow Structure**:

1. **Action 1**: Add urgent comment (single operation)
2. **Action 2**: Change assignee to team lead (single operation)
3. **Action 3**: Update priority level (single operation)
4. **Action 4**: Set urgent due date (single operation)

**Execution Behavior**:

- Actions execute in order based on `execution_order` field
- Each action performs exactly one operation
- If any action fails, remaining actions are skipped
- The entire automation is marked as failed
- Each action's execution is tracked individually in `NodeExecution`

```python
# Action 1: Add urgent comment
@register_node("add_urgent_comment", "action", AddCommentParams)
class AddUrgentComment(ActionNode):
    def execute(self, event: dict, context: dict):
        # Add comment logic
        return {"success": True, "comment_id": "comment-uuid"}

# Action 2: Change assignee
@register_node("assign_team_lead", "action", ChangeAssigneeParams)
class AssignTeamLead(ActionNode):
    def execute(self, event: dict, context: dict):
        # Change assignee logic
        return {"success": True, "new_assignee": "team-lead-uuid"}

# Action 3: Update priority level (single operation)
@register_node("update_priority", "action", ChangePriorityParams)
class UpdatePriority(ActionNode):
    def execute(self, event: dict, context: dict):
        # Update only priority level
        return {"success": True, "property": "priority", "new_value": "urgent"}

# Action 4: Set urgent due date (single operation)
@register_node("set_urgent_due_date", "action", SetDueDateParams)
class SetUrgentDueDate(ActionNode):
    def execute(self, event: dict, context: dict):
        # Set only due date
        return {"success": True, "property": "target_date", "new_value": "2024-12-31"}
```

### 9.3 Real-World Template Usage

**Add Comment Action with Dynamic Content**:

```python
class AddCommentParams(BaseModel):
    comment_text: str = Field(
        description="Comment text with template variables",
        examples=[
            "Issue priority changed to {{payload.data.priority}}",
            "Assigned to user: {{payload.data.assignee_ids.0}}",
            "State changed from {{payload.previous_attributes.state_id}} to {{payload.data.state_id}}"
        ]
    )
```

**JSON Filter Condition Examples**:

```python
# High priority issues assigned to specific user
{
    "and": [
        {"field": "payload.data.priority", "operator": "equals", "value": "high"},
        {"field": "payload.data.assignee_ids.0", "operator": "equals", "value": "user-uuid"}
    ]
}

# Issues with security labels that are overdue
{
    "and": [
        {"field": "payload.data.label_ids", "operator": "contains", "value": "security-label-id"},
        {"field": "payload.data.target_date", "operator": "lt", "value": "2024-01-01"},
        {"not": {"field": "payload.data.state_id", "operator": "equals", "value": "completed-state-id"}}
    ]
}
```

### 9.4 Property Change Examples

**Change Issue Properties**:

```python
# Set priority to urgent
{
    "handler_name": "change_property",
    "config": {
        "change_type": "update",
        "property_name": "priority",
        "property_value": ["urgent"]
    }
}

# Add assignee (keeping existing ones)
{
    "handler_name": "change_property",
    "config": {
        "change_type": "add",
        "property_name": "assignee_ids",
        "property_value": ["new-user-uuid"]
    }
}

# Set target date with template
{
    "handler_name": "change_property",
    "config": {
        "change_type": "update",
        "property_name": "target_date",
        "property_value": ["{{context.calculated_deadline}}"]
    }
}
```

---

## 10. Deployment & Operations

### 10.1 Running the Consumer

The automation system requires a background consumer to process events:

```bash
# Start the automation consumer
python manage.py run_automation_consumer

# With custom settings
python manage.py run_automation_consumer --queue automation_events --prefetch 20
```

### 10.2 Management Commands

**Create Automations Interactively**:

```bash
# Interactive automation creation wizard
python manage.py create_automation

# With pre-specified workspace/project
python manage.py create_automation --workspace-id uuid --project-id uuid
```

**Health Checks**:

```bash
# Check consumer health (planned)
python manage.py check_automation_consumer
```

### 10.3 Configuration Settings

Add to your Django settings:

```python
# RabbitMQ Configuration
AMQP_URL = "amqp://user:pass@host:port/vhost"  # Or individual settings
RABBITMQ_HOST = "localhost"
RABBITMQ_PORT = 5672
RABBITMQ_USER = "guest"
RABBITMQ_PASSWORD = "guest"
RABBITMQ_VHOST = "/"

# Automation Settings
AUTOMATION_QUEUE_NAME = "automation_events"
AUTOMATION_EXCHANGE_NAME = "plane_event_stream"
AUTOMATION_EVENT_TYPES = ["issue."]  # Event prefixes to process

# Celery Task Settings (for async processing)
CELERY_BROKER_URL = "redis://localhost:6379/0"
```

### 10.4 Monitoring & Debugging

**Check Automation Status**:

```python
from plane.automations.engine import get_automation_status
status = get_automation_status("automation-run-uuid")
```

**View Execution History**:

- `AutomationRun` table shows each automation execution
- `NodeExecution` table shows per-node execution details
- All JSON fields are GIN-indexed for fast queries

**Common Debugging**:

1. Check trigger matching in automation run logs
2. Verify condition logic with JSON filter syntax
3. Review action execution results and error messages
4. Monitor consumer health and message processing

---

## 11. Architecture Notes

### 11.1 Event Flow

```
Database Change → Outbox Pattern → RabbitMQ → Consumer → Celery Task → Automation Engine
```

### 11.2 Scalability

- **Horizontal Scaling**: Run multiple consumer instances
- **Event Deduplication**: Built-in exactly-once processing via `ProcessedAutomationEvent`
- **Retry Logic**: Exponential backoff for failed tasks
- **Resource Isolation**: Separate Celery queues for automation processing

### 11.3 Performance Considerations

- Triggers are evaluated BEFORE creating `AutomationRun` records
- JSON filter conditions use GIN indexes for fast nested queries
- Template rendering is cached per execution context
- Dead letter queues prevent infinite retry loops
- Multiple action nodes execute sequentially within a single automation run for data consistency
- Failed actions immediately halt execution to prevent cascading issues

---

Happy automating! 🎉
