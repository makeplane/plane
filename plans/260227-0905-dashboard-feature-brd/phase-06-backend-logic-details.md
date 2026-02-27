---
status: COMPLETE
---

# Phase 6: Detailed Backend Logic & Aggregation Specs

## Overview

This document enforces the strict translation of widget interactions into Django ORM behavior and SQL aggregations, ensuring accurate chart data yields.

Chart data must be centrally resolved through: `GET /api/v1/workspaces/{slug}/dashboards/{id}/widgets/{widget_id}/charts/`

## 1. Y-axis Metrics (Core Aggregations)

The interface "Metric" translates directly to a Django database aggregation function executed across an Issue QuerySet.

| UI Metric Name             | Constant Payload         | SQL / ORM Logic Directive                                                                         | Return Field          |
| :------------------------- | :----------------------- | :------------------------------------------------------------------------------------------------ | :-------------------- |
| **Work item count**        | `WORK_ITEM_COUNT`        | `Count("id")` on Issue model.                                                                     | `{"count": <number>}` |
| **Estimate points**        | `ESTIMATE_POINTS`        | `Sum("estimate_point")` handling SQL nulls via `Coalesce(_, 0)`.                                  | `{"count": <number>}` |
| **Pending work items**     | `PENDING_WORK_ITEMS`     | Query `Issue.issue_objects` AND `state__group__in=["unstarted", "backlog"]`. Yield `Count("id")`. | `{"count": <number>}` |
| **Completed work items**   | `COMPLETED_WORK_ITEMS`   | Query `Issue` AND `state__group="completed"`. Yield `Count("id")`.                                | `{"count": <number>}` |
| **In progress work items** | `IN_PROGRESS_WORK_ITEMS` | Query `Issue` AND `state__group="started"`. Yield `Count("id")`.                                  | `{"count": <number>}` |

<!-- Updated: Validation Session 1 - All metrics in scope. Verify IssueRelation model exists in CE. Use target_date__range with user timezone for date metrics -->

| **Blocked work items** | `BLOCKED_WORK_ITEMS` | Query `Issue` linking via related `issue_relation` where `relation_type=IssueRelationChoices.BLOCKED_BY` (val: `'blocked_by'`). Verify IssueRelation model exists in CE. Yield `Count("id", distinct=True)`. | `{"count": <number>}` |
| **Work items due today** | `WORK_ITEMS_DUE_TODAY` | Query `Issue` where `target_date == timezone.now().date()` and `state__group != "completed"`. Yield `Count("id")`. | `{"count": <number>}` |
| **Work items due this week** | `WORK_ITEMS_DUE_THIS_WEEK` | Query `Issue` where `target_date__range=(start_of_week, end_of_week)` and `state__group != "completed"`. Evaluate timezone dynamically via standard user context. Yield `Count("id")`. | `{"count": <number>}` |

_Note: Regardless of the metric (e.g. Estimate sum), Recharts standardizes around extracting `payload.count` for raw amplitude, hence the standardized dict key `count`._

## 2. X-axis / Group By Properties (Grouping Modifiers)

Grouping relies directly on Django's `.values()` method combined with `.annotate()`.

### Global Grouping Pattern

Computing **Work item count** segmented by **State**:

```python
Issue.issue_objects.filter(project_id__in=dashboard.project_ids).values('state_id', 'state__name').annotate(count=Count('id'))
```

### X-Axis Property Mappings

| UI Property Name | Payload ID     | ORM `values` Directive    | Expected Output Attributes                                                                                       |
| :--------------- | :------------- | :------------------------ | :--------------------------------------------------------------------------------------------------------------- |
| **State**        | `STATES`       | `state_id`                | Join `state__name`, `state__color`.                                                                              |
| **State Group**  | `STATE_GROUPS` | `state__group`            | Return enum string constants ('unstarted', 'started', etc).                                                      |
| **Assignee**     | `ASSIGNEES`    | `assignees__id`           | Output `assignees__avatar_url`, `assignees__display_name`. Ensure `distinct=True` inside `Count` over M2M joins. |
| **Project**      | `PROJECTS`     | `project_id`              | Inherited from dashboard context. Output `project__name`, `project__identifier`.                                 |
| **Priority**     | `PRIORITIES`   | `priority`                | String permutations ('urgent', 'high', 'normal', 'low', 'none').                                                 |
| **Labels**       | `LABELS`       | `labels__id`              | M2M join. Output `labels__name`, `labels__color`.                                                                |
| **Created by**   | `CREATED_BY`   | `created_by_id`           | Foreign Key reference.                                                                                           |
| **Module**       | `MODULES`      | `issue_module__module_id` | Intersect via `IssueModule` junction.                                                                            |
| **Cycle**        | `CYCLES`       | `issue_cycle__cycle_id`   | Intersect via `IssueCycle` junction.                                                                             |

## 3. Multi-dimensional Workflows (Stacked / Multi-line series)

When widgets engage both an **X-axis** (`STATES`) and a **Group By** (`PRIORITY`) parameter, two-level dimensional structuring is triggered.

1.  **Context Constraint Evaluation:**
    ```python
    base_qs = Issue.issue_objects.filter(
        workspace__slug=slug,
        project_id__in=dashboard.project_ids
    )
    # Plus widget.filters kwargs application
    ```
2.  **Dual Aggregation Pipeline:**
    Issue query is grouped recursively: `.values('state_id', 'priority')`.
3.  **Data Structure Normalization:**
    API responses must flatten the aggregated dictionary array into the format natively demanded by Frontend Recharts components. Pivot secondary dimensions into top-level properties:
    ```json
    {
      "data": [
        {
          "name": "Todo", // Extracted X-axis reference
          "urgent": 10, // Flattened sub-group 1
          "high": 5, // Flattened sub-group 2
          "low": 0
        },
        {
          "name": "In Progress",
          "urgent": 2,
          "high": 12
        }
      ]
    }
    ```

## 4. Query Filter Injection Handling

Widgets support localized filters (`widget.filters`), representing parameter dictionaries e.g. `{"priority": ["urgent", "high"]}`.

**Safe ORM Parameter Construction:**

```python
# Whitelisted mapping table prevents user arbitrary injection
filter_mapping = {
    "priority": "priority__in",
    "assignees": "assignees__id__in",
    "labels": "labels__id__in",
    "state": "state_id__in",
    "state_group": "state__group__in",
    "created_by": "created_by_id__in"
}

query_kwargs = {}
for rule_key, rules in widget.filters.items():
    if rule_key in filter_mapping and rules:
        # Prevents KeyError crashes on unknown payload values
        query_kwargs[filter_mapping[rule_key]] = rules

# Strictly isolated application
base_qs = base_qs.filter(**query_kwargs)
```

_(Crucial Security Note: DO NOT ever pass `**widget.filters` directly to Django's `.filter()` method. Bypassing the whitelist opens SQL Injection vectors mapped via double-underscore exploits)._
