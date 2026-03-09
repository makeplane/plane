# PQL (Plane Query Language) — QA Test Plan

A comprehensive manual test plan covering all PQL features, edge cases, and expected outputs. Designed for QA testers to verify correctness of the PQL parser, transformer, and API integration end-to-end.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Supported Endpoints](#supported-endpoints)
- [How to Test](#how-to-test)
- [Test Matrix](#test-matrix)
  - [1. Empty and Invalid Input](#1-empty-and-invalid-input)
  - [2. String Quoting](#2-string-quoting)
  - [3. Value Types](#3-value-types)
  - [4. Equality Operator (=)](#4-equality-operator-)
  - [5. Not-Equal Operator (!=)](#5-not-equal-operator-)
  - [6. Comparison Operators (>, >=, <, <=)](#6-comparison-operators----)
  - [7. Contains Operator (~)](#7-contains-operator-)
  - [8. IN Operator](#8-in-operator)
  - [9. NOT IN Operator](#9-not-in-operator)
  - [10. IS NULL / IS NOT NULL](#10-is-null--is-not-null)
  - [11. IS EMPTY / IS NOT EMPTY](#11-is-empty--is-not-empty)
  - [12. BETWEEN Operator](#12-between-operator)
  - [13. Field Aliases](#13-field-aliases)
  - [14. Logical Operator: AND](#14-logical-operator-and)
  - [15. Logical Operator: OR](#15-logical-operator-or)
  - [16. Logical Operator: NOT](#16-logical-operator-not)
  - [17. Operator Precedence and Parentheses](#17-operator-precedence-and-parentheses)
  - [18. Text Pseudo-Field](#18-text-pseudo-field)
  - [19. Date Functions](#19-date-functions)
  - [20. User Functions](#20-user-functions)
  - [21. Cycle Functions](#21-cycle-functions)
  - [22. State Functions](#22-state-functions)
  - [23. Predicate Functions](#23-predicate-functions)
  - [24. Relation Functions](#24-relation-functions)
  - [25. History: Field Change Functions](#25-history-field-change-functions)
  - [26. History: Actor Functions](#26-history-actor-functions)
  - [27. History: Time-Scoped Functions](#27-history-time-scoped-functions)
  - [28. IN with Function Values](#28-in-with-function-values)
  - [29. Complex Compound Queries](#29-complex-compound-queries)
  - [30. Case Insensitivity](#30-case-insensitivity)
  - [31. Error Cases](#31-error-cases)
  - [32. End-to-End API Verification](#32-end-to-end-api-verification)

---

## Prerequisites

1. **Running instance** of Plane with API accessible (local or staging).
2. **Authenticated user** with access to at least one workspace and project.
3. **Test data** — create the following before testing:
   - Issues with varied priorities: `urgent`, `high`, `medium`, `low`, `none`
   - Issues in different state groups: `backlog`, `unstarted`, `started`, `completed`, `cancelled`
   - Issues with and without: assignees, labels, modules, cycles, start dates, target dates
   - Issues with parent/child relationships
   - At least one issue with a past target date and open state (overdue)
   - At least one draft issue
   - Issues with known names/descriptions for text search
   - At least one active cycle, one completed cycle, one upcoming cycle
   - Some issue relations (blocked by, linked to, etc.)
   - Issue activity history (change priority, reassign, add comments)
4. **API tool** — curl, Postman, or browser dev tools to send requests.
5. Record UUIDs of test entities (user, project, states, labels, cycles, issues) for use in queries.

---

## Supported Endpoints

PQL is enabled on the following API endpoints via the `?pql=` query parameter:

| Endpoint                                                                                 | Description              |
| ---------------------------------------------------------------------------------------- | ------------------------ |
| `GET /api/v1/workspaces/{slug}/projects/{project_id}/issues/`                            | Project issues list      |
| `GET /api/v1/workspaces/{slug}/projects/{project_id}/issues/list/`                       | Project issues list view |
| `GET /api/v1/workspaces/{slug}/projects/{project_id}/archived-issues/`                   | Archived issues          |
| `GET /api/v1/workspaces/{slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/`    | Cycle issues             |
| `GET /api/v1/workspaces/{slug}/projects/{project_id}/modules/{module_id}/module-issues/` | Module issues            |
| `GET /api/v1/workspaces/{slug}/issues/`                                                  | Workspace-level issues   |
| `GET /api/v1/workspaces/{slug}/projects/{project_id}/views/{view_id}/issues/`            | View issues              |
| `GET /api/v1/workspaces/{slug}/projects/{project_id}/epics/`                             | Epics (EE)               |
| `GET /api/v1/workspaces/{slug}/projects/{project_id}/archived-epics/`                    | Archived epics (EE)      |
| `GET /api/v1/workspaces/{slug}/teamspaces/{teamspace_id}/issues/`                        | Teamspace issues (EE)    |
| `GET /api/v1/workspaces/{slug}/initiatives/{initiative_id}/epics/`                       | Initiative epics (EE)    |
| `GET /api/v1/workspaces/{slug}/teamspaces/{teamspace_id}/analytics/`                     | Teamspace analytics (EE) |
| Space (public) issue endpoints                                                           | Public project space     |

---

## How to Test

### Via API (recommended)

```bash
# URL-encode the PQL string and pass as ?pql= query param
curl -H "Authorization: Bearer <token>" \
  "https://<host>/api/v1/workspaces/<slug>/projects/<project_id>/issues/?pql=priority%20%3D%20%22high%22"
```

### Via Browser DevTools

1. Open the Plane web app and navigate to an issue list.
2. Open Network tab in DevTools.
3. Manually construct a request with `?pql=<encoded-query>` appended to the list API URL.
4. Inspect the response.

### Verification approach

For each test case:

1. **Send** the PQL query to the API.
2. **Check HTTP status** — should be `200` for valid queries, `400` for invalid.
3. **Verify results** — issues returned match the filter criteria.
4. **Cross-check** — compare with the equivalent UI filter or rich filter JSON to confirm correctness.

Where this document shows **Expected Rich Filter**, that is the intermediate JSON the parser produces. The API response is the actual filtered issue list — verify the returned issues match the filter semantics.

---

## Test Matrix

### 1. Empty and Invalid Input

| #   | PQL Input                                           | Expected Status | Expected Behavior                            |
| --- | --------------------------------------------------- | --------------- | -------------------------------------------- |
| 1.1 | _(empty — no `pql` param)_                          | `200`           | Returns unfiltered results (PQL not applied) |
| 1.2 | `?pql=` (empty string)                              | `200`           | Returns unfiltered results                   |
| 1.3 | `?pql=%20%20%20` (whitespace only)                  | `200`           | Returns unfiltered results                   |
| 1.4 | `?pql=???%20broken`                                 | `400`           | Error: `{"pql": "Invalid PQL syntax: ..."}`  |
| 1.5 | `?pql=priority%20IN%20(%22high%22` (unclosed paren) | `400`           | Error: Invalid PQL syntax                    |
| 1.6 | `?pql=%22high%22` (bare value, no field)            | `400`           | Error: Invalid PQL syntax                    |
| 1.7 | `?pql=priority` (field name alone)                  | `400`           | Error: Invalid PQL syntax                    |
| 1.8 | `?pql=priority%20%3D` (field + operator, no value)  | `400`           | Error: Invalid PQL syntax                    |

---

### 2. String Quoting

| #   | PQL Input                              | Expected Rich Filter                     | Notes                  |
| --- | -------------------------------------- | ---------------------------------------- | ---------------------- |
| 2.1 | `priority = "high"`                    | `{"priority": "high"}`                   | Double-quoted string   |
| 2.2 | `priority = 'high'`                    | `{"priority": "high"}`                   | Single-quoted string   |
| 2.3 | `priority IN ("high", 'urgent')`       | `{"priority__in": "high,urgent"}`        | Mixed quotes in list   |
| 2.4 | `stateGroup IN ('backlog', 'started')` | `{"state_group__in": "backlog,started"}` | All single quotes      |
| 2.5 | `name ~ 'login'`                       | `{"name__icontains": "login"}`           | Single-quoted contains |

**Verify:** Both quote styles produce identical results. Issues returned are the same regardless of quoting.

---

### 3. Value Types

| #   | PQL Input           | Expected Rich Filter   | Notes                  |
| --- | ------------------- | ---------------------- | ---------------------- |
| 3.1 | `priority = "high"` | `{"priority": "high"}` | String value           |
| 3.2 | `priority = 3`      | `{"priority": 3}`      | Integer value          |
| 3.3 | `priority = 3.5`    | `{"priority": 3.5}`    | Float value            |
| 3.4 | `priority = -1`     | `{"priority": -1}`     | Negative integer       |
| 3.5 | `isDraft = true`    | `{"is_draft": true}`   | Boolean true           |
| 3.6 | `isDraft = false`   | `{"is_draft": false}`  | Boolean false          |
| 3.7 | `priority = null`   | `{"priority": null}`   | Null value             |
| 3.8 | `isDraft = TRUE`    | `{"is_draft": true}`   | Case-insensitive true  |
| 3.9 | `isDraft = False`   | `{"is_draft": false}`  | Case-insensitive false |

---

### 4. Equality Operator (=)

| #   | PQL Input                  | Expected Rich Filter             | Verify                                 |
| --- | -------------------------- | -------------------------------- | -------------------------------------- |
| 4.1 | `priority = "high"`        | `{"priority": "high"}`           | Only high-priority issues returned     |
| 4.2 | `priority = "urgent"`      | `{"priority": "urgent"}`         | Only urgent issues returned            |
| 4.3 | `priority = "none"`        | `{"priority": "none"}`           | Only no-priority issues returned       |
| 4.4 | `stateGroup = "started"`   | `{"state_group": "started"}`     | Only in-progress issues returned       |
| 4.5 | `state = "<state-uuid>"`   | `{"state_id": "<state-uuid>"}`   | Only issues in that specific state     |
| 4.6 | `assignee = "<user-uuid>"` | `{"assignee_id": "<user-uuid>"}` | Only issues assigned to that user      |
| 4.7 | `label = "<label-uuid>"`   | `{"label_id": "<label-uuid>"}`   | Only issues with that label            |
| 4.8 | `startDate = "2025-06-15"` | `{"start_date": "2025-06-15"}`   | Only issues with that exact start date |

---

### 5. Not-Equal Operator (!=)

| #   | PQL Input                   | Expected Rich Filter                    | Verify                              |
| --- | --------------------------- | --------------------------------------- | ----------------------------------- |
| 5.1 | `priority != "high"`        | `{"not": {"priority": "high"}}`         | All issues EXCEPT high priority     |
| 5.2 | `priority != "none"`        | `{"not": {"priority": "none"}}`         | All issues that have a priority set |
| 5.3 | `stateGroup != "completed"` | `{"not": {"state_group": "completed"}}` | Excludes completed issues           |

---

### 6. Comparison Operators (>, >=, <, <=)

| #   | PQL Input                    | Expected Rich Filter                 | Verify                            |
| --- | ---------------------------- | ------------------------------------ | --------------------------------- |
| 6.1 | `createdAt > "2025-01-01"`   | `{"created_at__gt": "2025-01-01"}`   | Issues created after Jan 1        |
| 6.2 | `createdAt >= "2025-01-01"`  | `{"created_at__gte": "2025-01-01"}`  | Issues created on or after Jan 1  |
| 6.3 | `targetDate < "2025-12-31"`  | `{"target_date__lt": "2025-12-31"}`  | Issues due before Dec 31          |
| 6.4 | `targetDate <= "2025-12-31"` | `{"target_date__lte": "2025-12-31"}` | Issues due on or before Dec 31    |
| 6.5 | `updatedAt > "2025-06-01"`   | `{"updated_at__gt": "2025-06-01"}`   | Issues updated after June 1       |
| 6.6 | `startDate >= "2025-03-01"`  | `{"start_date__gte": "2025-03-01"}`  | Issues starting on or after Mar 1 |

**Verify:** Check boundary conditions — issues exactly on the date are included for `>=`/`<=` and excluded for `>`/`<`.

---

### 7. Contains Operator (~)

| #   | PQL Input          | Expected Rich Filter             | Verify                                              |
| --- | ------------------ | -------------------------------- | --------------------------------------------------- |
| 7.1 | `name ~ "login"`   | `{"name__icontains": "login"}`   | Issues with "login" in title (case-insensitive)     |
| 7.2 | `name ~ "Login"`   | `{"name__icontains": "Login"}`   | Same results as 7.1 (icontains is case-insensitive) |
| 7.3 | `name ~ "bug fix"` | `{"name__icontains": "bug fix"}` | Substring match including space                     |
| 7.4 | `name ~ "a"`       | `{"name__icontains": "a"}`       | Single character match                              |

---

### 8. IN Operator

| #   | PQL Input                                  | Expected Rich Filter                       | Verify                              |
| --- | ------------------------------------------ | ------------------------------------------ | ----------------------------------- |
| 8.1 | `priority IN ("high", "urgent")`           | `{"priority__in": "high,urgent"}`          | Issues with high OR urgent priority |
| 8.2 | `priority IN ("high", "urgent", "medium")` | `{"priority__in": "high,urgent,medium"}`   | Three values                        |
| 8.3 | `priority IN ("high")`                     | `{"priority__in": "high"}`                 | Single value in list                |
| 8.4 | `stateGroup IN ("started", "completed")`   | `{"state_group__in": "started,completed"}` | State group filtering               |
| 8.5 | `stateGroup IN ('backlog', 'started')`     | `{"state_group__in": "backlog,started"}`   | Single-quoted values                |
| 8.6 | `priority IN ("high", 'urgent')`           | `{"priority__in": "high,urgent"}`          | Mixed quotes                        |

**Important:** The rich filter serializes list values as comma-separated strings, NOT as JSON arrays. Verify the `__in` value is always a string like `"high,urgent"`.

---

### 9. NOT IN Operator

| #   | PQL Input                                      | Expected Rich Filter                                  | Verify                           |
| --- | ---------------------------------------------- | ----------------------------------------------------- | -------------------------------- |
| 9.1 | `stateGroup NOT IN ("completed", "cancelled")` | `{"not": {"state_group__in": "completed,cancelled"}}` | Excludes completed and cancelled |
| 9.2 | `priority NOT IN ("none", "low", "medium")`    | `{"not": {"priority__in": "none,low,medium"}}`        | Only high + urgent remain        |
| 9.3 | `priority NOT IN ('none', 'low')`              | `{"not": {"priority__in": "none,low"}}`               | Single quotes                    |

**Verify:** The `NOT IN` serialization wraps the condition in a `{"not": ...}` wrapper. Results exclude listed values.

---

### 10. IS NULL / IS NOT NULL

| #    | PQL Input                | Expected Rich Filter             | Verify                         |
| ---- | ------------------------ | -------------------------------- | ------------------------------ |
| 10.1 | `startDate IS NULL`      | `{"start_date__isnull": true}`   | Issues with no start date      |
| 10.2 | `targetDate IS NOT NULL` | `{"target_date__isnull": false}` | Issues that have a target date |
| 10.3 | `assignee IS NULL`       | `{"assignee_id__isnull": true}`  | Unassigned issues              |
| 10.4 | `assignee IS NOT NULL`   | `{"assignee_id__isnull": false}` | Assigned issues                |
| 10.5 | `startDate is null`      | `{"start_date__isnull": true}`   | Case-insensitive keywords      |
| 10.6 | `cycle IS NULL`          | `{"cycle_id__isnull": true}`     | Issues not in any cycle        |

---

### 11. IS EMPTY / IS NOT EMPTY

| #    | PQL Input               | Expected Rich Filter             | Verify                       |
| ---- | ----------------------- | -------------------------------- | ---------------------------- |
| 11.1 | `assignee IS EMPTY`     | `{"assignee_id__isnull": true}`  | Same behavior as IS NULL     |
| 11.2 | `label IS NOT EMPTY`    | `{"label_id__isnull": false}`    | Same behavior as IS NOT NULL |
| 11.3 | `module IS EMPTY`       | `{"module_id__isnull": true}`    | Issues not in any module     |
| 11.4 | `cycle IS NOT EMPTY`    | `{"cycle_id__isnull": false}`    | Issues in at least one cycle |
| 11.5 | `assignee is not empty` | `{"assignee_id__isnull": false}` | Case-insensitive             |

**Note:** `IS EMPTY` and `IS NULL` produce identical output. They are interchangeable.

---

### 12. BETWEEN Operator

| #    | PQL Input                                          | Expected Rich Filter                              | Verify                               |
| ---- | -------------------------------------------------- | ------------------------------------------------- | ------------------------------------ |
| 12.1 | `startDate BETWEEN "2025-01-01" AND "2025-12-31"`  | `{"start_date__range": "2025-01-01,2025-12-31"}`  | Issues within date range (inclusive) |
| 12.2 | `createdAt BETWEEN "2025-06-01" AND "2025-06-30"`  | `{"created_at__range": "2025-06-01,2025-06-30"}`  | Month range                          |
| 12.3 | `targetDate BETWEEN '2025-03-01' AND '2025-03-31'` | `{"target_date__range": "2025-03-01,2025-03-31"}` | Single-quoted dates                  |
| 12.4 | `priority BETWEEN 1 AND 4`                         | `{"priority__range": "1,4"}`                      | Numeric range                        |
| 12.5 | `startDate between "2025-01-01" and "2025-12-31"`  | `{"start_date__range": "2025-01-01,2025-12-31"}`  | Case-insensitive `between` and `and` |

**Important:** The range values are serialized as a comma-separated string, NOT a list. Verify `__range` value is a string like `"2025-01-01,2025-12-31"`.

**Verify:** Both boundary dates are inclusive.

---

### 13. Field Aliases

Every PQL field name maps to an internal rich filter key. Verify each alias resolves correctly.

| #     | PQL Field     | Internal Key      | Test Query                  | Expected Key in Output                                   |
| ----- | ------------- | ----------------- | --------------------------- | -------------------------------------------------------- |
| 13.1  | `priority`    | `priority`        | `priority = "high"`         | `priority`                                               |
| 13.2  | `state`       | `state_id`        | `state = "abc"`             | `state_id`                                               |
| 13.3  | `assignee`    | `assignee_id`     | `assignee = "abc"`          | `assignee_id`                                            |
| 13.4  | `label`       | `label_id`        | `label = "abc"`             | `label_id`                                               |
| 13.5  | `cycle`       | `cycle_id`        | `cycle = "abc"`             | `cycle_id`                                               |
| 13.6  | `module`      | `module_id`       | `module = "abc"`            | `module_id`                                              |
| 13.7  | `mention`     | `mention_id`      | `mention = "abc"`           | `mention_id`                                             |
| 13.8  | `subscriber`  | `subscriber_id`   | `subscriber = "abc"`        | `subscriber_id`                                          |
| 13.9  | `project`     | `project_id`      | `project = "abc"`           | `project_id`                                             |
| 13.10 | `createdBy`   | `created_by_id`   | `createdBy = "abc"`         | `created_by_id`                                          |
| 13.11 | `stateGroup`  | `state_group`     | `stateGroup = "started"`    | `state_group`                                            |
| 13.12 | `startDate`   | `start_date`      | `startDate = "2025-01-01"`  | `start_date`                                             |
| 13.13 | `targetDate`  | `target_date`     | `targetDate = "2025-01-01"` | `target_date`                                            |
| 13.14 | `createdAt`   | `created_at`      | `createdAt = "2025-01-01"`  | `created_at`                                             |
| 13.15 | `updatedAt`   | `updated_at`      | `updatedAt = "2025-01-01"`  | `updated_at`                                             |
| 13.16 | `isDraft`     | `is_draft`        | `isDraft = true`            | `is_draft`                                               |
| 13.17 | `isArchived`  | `is_archived`     | `isArchived = true`         | `is_archived`                                            |
| 13.18 | `type`        | `type_id`         | `type = "abc"`              | `type_id` (EE)                                           |
| 13.19 | `milestone`   | `milestone_id`    | `milestone = "abc"`         | `milestone_id` (EE)                                      |
| 13.20 | `teamProject` | `team_project_id` | `teamProject = "abc"`       | `team_project_id` (EE)                                   |
| 13.21 | `name`        | `name`            | `name ~ "test"`             | `name__icontains`                                        |
| 13.22 | `text`        | `text` (pseudo)   | `text ~ "test"`             | `or: [name__icontains, description_stripped__icontains]` |

**Edge case:**

| #     | PQL Input           | Expected               | Notes                                        |
| ----- | ------------------- | ---------------------- | -------------------------------------------- |
| 13.23 | `somefield = "val"` | `{"somefield": "val"}` | Unknown fields pass through as-is (no error) |

---

### 14. Logical Operator: AND

| #    | PQL Input                                                          | Expected Rich Filter                                                                          | Verify                         |
| ---- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------ |
| 14.1 | `priority = "high" AND stateGroup = "started"`                     | `{"and": [{"priority": "high"}, {"state_group": "started"}]}`                                 | Both conditions must match     |
| 14.2 | `priority = "high" and stateGroup = "started"`                     | Same as 14.1                                                                                  | Case-insensitive `and`         |
| 14.3 | `priority = "high" AND stateGroup = "started" AND isDraft = false` | `{"and": [{"and": [{"priority": "high"}, {"state_group": "started"}]}, {"is_draft": false}]}` | Chained AND (left-associative) |

**Verify:** With chained ANDs, the structure nests left-to-right. `A AND B AND C` becomes `and(and(A, B), C)`.

---

### 15. Logical Operator: OR

| #    | PQL Input                                                         | Expected Rich Filter                                                                       | Verify                        |
| ---- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------- |
| 15.1 | `priority = "high" OR priority = "urgent"`                        | `{"or": [{"priority": "high"}, {"priority": "urgent"}]}`                                   | Either condition matches      |
| 15.2 | `priority = "high" or priority = "urgent"`                        | Same as 15.1                                                                               | Case-insensitive `or`         |
| 15.3 | `priority = "high" OR priority = "urgent" OR priority = "medium"` | `{"or": [{"or": [{"priority": "high"}, {"priority": "urgent"}]}, {"priority": "medium"}]}` | Chained OR (left-associative) |

---

### 16. Logical Operator: NOT

| #    | PQL Input                                      | Expected Rich Filter                                           | Verify                  |
| ---- | ---------------------------------------------- | -------------------------------------------------------------- | ----------------------- |
| 16.1 | `NOT priority = "low"`                         | `{"not": {"priority": "low"}}`                                 | Excludes low priority   |
| 16.2 | `not priority = "low"`                         | Same as 16.1                                                   | Case-insensitive `not`  |
| 16.3 | `NOT stateGroup IN ("completed", "cancelled")` | `{"not": {"state_group__in": "completed,cancelled"}}`          | NOT wrapping IN         |
| 16.4 | `NOT isDraft()`                                | `{"not": {"fn": {"is_draft": true}}}`                          | NOT wrapping predicate  |
| 16.5 | `NOT (priority = "low" OR priority = "none")`  | `{"not": {"or": [{"priority": "low"}, {"priority": "none"}]}}` | NOT wrapping grouped OR |

---

### 17. Operator Precedence and Parentheses

| #    | PQL Input                                                               | Expected Rich Filter                                                                                                  | Explanation                                            |
| ---- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 17.1 | `priority = "low" OR priority = "high" AND stateGroup = "started"`      | `{"or": [{"priority": "low"}, {"and": [{"priority": "high"}, {"state_group": "started"}]}]}`                          | AND binds tighter than OR: `low OR (high AND started)` |
| 17.2 | `(priority = "low" OR priority = "high") AND stateGroup = "started"`    | `{"and": [{"or": [{"priority": "low"}, {"priority": "high"}]}, {"state_group": "started"}]}`                          | Parens override precedence                             |
| 17.3 | `((priority = "high"))`                                                 | `{"priority": "high"}`                                                                                                | Deeply nested parens — flattened                       |
| 17.4 | `NOT (stateGroup = "completed" OR stateGroup = "cancelled")`            | `{"not": {"or": [{"state_group": "completed"}, {"state_group": "cancelled"}]}}`                                       | NOT applies to grouped expression                      |
| 17.5 | `(priority = "urgent" OR isOverdue()) AND stateGroup IN activeStates()` | `{"and": [{"or": [{"priority": "urgent"}, {"fn": {"is_overdue": true}}]}, {"state_group__in": "unstarted,started"}]}` | Complex mixed precedence                               |

**Critical test:** 17.1 vs 17.2 — these MUST produce different results. Without parens, AND binds first.

---

### 18. Text Pseudo-Field

The `text` field is special — it searches both `name` and `description_stripped` using OR.

| #    | PQL Input                             | Expected Rich Filter                                                                               | Verify                         |
| ---- | ------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------ |
| 18.1 | `text = "login"`                      | `{"or": [{"name__icontains": "login"}, {"description_stripped__icontains": "login"}]}`             | Matches title OR description   |
| 18.2 | `text ~ "search term"`                | `{"or": [{"name__icontains": "search term"}, {"description_stripped__icontains": "search term"}]}` | Contains on text field         |
| 18.3 | `text ~ "auth" AND priority = "high"` | `{"and": [{"or": [...]}, {"priority": "high"}]}`                                                   | Combined with other conditions |

**Verify:** An issue with "login" only in the description (not title) should still be returned by `text ~ "login"`.

---

### 19. Date Functions

All date functions resolve to actual date strings at query time. Verify by checking if the returned issues fall within the expected date ranges.

| #     | PQL Input                                           | Function Resolves To                | Verify                                                  |
| ----- | --------------------------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| 19.1  | `targetDate = today()`                              | Today's date (e.g., `"2026-02-18"`) | Issues due exactly today                                |
| 19.2  | `createdAt >= daysAgo(7)`                           | Date 7 days ago                     | Issues created in the last week                         |
| 19.3  | `targetDate <= daysFromNow(14)`                     | Date 14 days from now               | Issues due within 2 weeks                               |
| 19.4  | `startDate >= startOfWeek()`                        | Monday of current week              | Issues starting this week or later                      |
| 19.5  | `targetDate <= endOfWeek()`                         | Sunday of current week              | Issues due by end of this week                          |
| 19.6  | `createdAt >= startOfMonth()`                       | 1st of current month                | Issues created this month                               |
| 19.7  | `targetDate <= endOfMonth()`                        | Last day of current month           | Issues due this month or earlier                        |
| 19.8  | `createdAt >= startOfYear()`                        | January 1st of current year         | Issues created this year                                |
| 19.9  | `targetDate <= endOfYear()`                         | December 31st of current year       | Issues due this year                                    |
| 19.10 | `createdAt >= weeksAgo(2)`                          | Date 2 weeks ago                    | Issues created in last 2 weeks                          |
| 19.11 | `targetDate <= weeksFromNow(4)`                     | Date 4 weeks from now               | Issues due within 4 weeks                               |
| 19.12 | `updatedAt >= monthsAgo(3)`                         | Date ~90 days ago                   | Issues updated in last ~3 months                        |
| 19.13 | `targetDate <= monthsFromNow(6)`                    | Date ~180 days from now             | Issues due within ~6 months                             |
| 19.14 | `createdAt > now()`                                 | Current datetime                    | Should return no issues (nothing created in the future) |
| 19.15 | `startDate BETWEEN startOfMonth() AND endOfMonth()` | Range: 1st to last day of month     | Issues starting this month                              |

**Note:** `monthsAgo(n)` and `monthsFromNow(n)` use `n * 30` days, not calendar months.

---

### 20. User Functions

| #    | PQL Input                                             | Resolves To                        | Verify                                       |
| ---- | ----------------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| 20.1 | `assignee = currentUser()`                            | Authenticated user's UUID          | Only issues assigned to you                  |
| 20.2 | `createdBy = currentUser()`                           | Authenticated user's UUID          | Issues you created                           |
| 20.3 | `subscriber = currentUser()`                          | Authenticated user's UUID          | Issues you subscribe to                      |
| 20.4 | `assignee IN membersOf("project:<project-uuid>")`     | List of project member UUIDs       | Issues assigned to any project member        |
| 20.5 | `assignee IN membersOf("teamspace:<teamspace-uuid>")` | List of teamspace member UUIDs     | Issues assigned to any teamspace member (EE) |
| 20.6 | `assignee IN workspaceMembers()`                      | List of all workspace member UUIDs | Issues assigned to any workspace member      |
| 20.7 | `assignee NOT IN membersOf("project:<project-uuid>")` | Negated list                       | Issues NOT assigned to project members       |

**Verify 20.4:** The returned list should match the project's active members. Deactivated members should NOT be included.

---

### 21. Cycle Functions

| #    | PQL Input                        | Resolves To                                              | Verify                             |
| ---- | -------------------------------- | -------------------------------------------------------- | ---------------------------------- |
| 21.1 | `cycle IN activeCycle()`         | UUIDs of active cycles (start_date <= today <= end_date) | Issues in currently running cycles |
| 21.2 | `cycle IN completedCycles()`     | UUIDs of cycles with end_date < today                    | Issues in past cycles              |
| 21.3 | `cycle IN upcomingCycles()`      | UUIDs of cycles with start_date > today                  | Issues in future cycles            |
| 21.4 | `cycle NOT IN completedCycles()` | Negated                                                  | Issues NOT in completed cycles     |

**Setup:** Ensure you have at least one cycle in each state (active, completed, upcoming) before testing.

---

### 22. State Functions

| #    | PQL Input                          | Expected Rich Filter                                        | Verify                                   |
| ---- | ---------------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| 22.1 | `stateGroup IN openStates()`       | `{"state_group__in": "backlog,unstarted,started"}`          | Issues in backlog, unstarted, or started |
| 22.2 | `stateGroup IN closedStates()`     | `{"state_group__in": "completed,cancelled"}`                | Issues in completed or cancelled         |
| 22.3 | `stateGroup IN activeStates()`     | `{"state_group__in": "unstarted,started"}`                  | Issues in unstarted or started           |
| 22.4 | `stateGroup NOT IN closedStates()` | `{"not": {"state_group__in": "completed,cancelled"}}`       | Excludes completed and cancelled         |
| 22.5 | `stateGroup NOT IN openStates()`   | `{"not": {"state_group__in": "backlog,unstarted,started"}}` | Only completed and cancelled             |
| 22.6 | `stateGroup NOT IN activeStates()` | `{"not": {"state_group__in": "unstarted,started"}}`         | Backlog, completed, cancelled            |

---

### 23. Predicate Functions

Predicate functions are standalone conditions (no field or operator needed).

| #     | PQL Input             | Expected Rich Filter                     | Verify                                             |
| ----- | --------------------- | ---------------------------------------- | -------------------------------------------------- |
| 23.1  | `isOverdue()`         | `{"fn": {"is_overdue": true}}`           | Issues where target_date < today AND state is open |
| 23.2  | `hasNoAssignee()`     | `{"fn": {"has_no_assignee": true}}`      | Issues with no active assignee                     |
| 23.3  | `hasNoLabel()`        | `{"fn": {"has_no_label": true}}`         | Issues with no labels                              |
| 23.4  | `isTopLevel()`        | `{"fn": {"is_top_level": true}}`         | Issues that are NOT sub-issues                     |
| 23.5  | `isSubIssue()`        | `{"fn": {"is_sub_issue": true}}`         | Issues that ARE sub-issues                         |
| 23.6  | `isEpic()`            | `{"fn": {"is_epic": true}}`              | Issues whose type is epic (EE)                     |
| 23.7  | `isIntake()`          | `{"fn": {"is_intake": true}}`            | Intake work items                                  |
| 23.8  | `isDraft()`           | `{"fn": {"is_draft": true}}`             | Draft issues                                       |
| 23.9  | `isArchived()`        | `{"fn": {"is_archived": true}}`          | Archived issues                                    |
| 23.10 | `hasChildren()`       | `{"fn": {"has_children": true}}`         | Issues with at least one sub-issue                 |
| 23.11 | `hasStartAndTarget()` | `{"fn": {"has_start_and_target": true}}` | Issues with both start_date and target_date set    |

**Combination tests:**

| #     | PQL Input                           | Expected Rich Filter                                                        | Verify                                |
| ----- | ----------------------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| 23.12 | `isOverdue() AND priority = "high"` | `{"and": [{"fn": {"is_overdue": true}}, {"priority": "high"}]}`             | Overdue AND high priority             |
| 23.13 | `NOT isDraft()`                     | `{"not": {"fn": {"is_draft": true}}}`                                       | Non-draft issues                      |
| 23.14 | `isTopLevel() AND hasChildren()`    | `{"and": [{"fn": {"is_top_level": true}}, {"fn": {"has_children": true}}]}` | Top-level issues that have sub-issues |

---

### 24. Relation Functions

**Setup:** Create issue relations before testing. Note the UUIDs of related issues.

| #    | PQL Input                                                  | Expected Rich Filter                       | Verify                                                                 |
| ---- | ---------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| 24.1 | `linkedTo("<issue-uuid>")`                                 | `{"fn": {"linked_to": "<issue-uuid>"}}`    | Issues related to the given issue                                      |
| 24.2 | `blockedBy("<issue-uuid>")`                                | `{"fn": {"blocked_by": "<issue-uuid>"}}`   | Issues blocked by the given issue                                      |
| 24.3 | `blocks("<issue-uuid>")`                                   | `{"fn": {"blocks": "<issue-uuid>"}}`       | Issues that block the given issue                                      |
| 24.4 | `childOf("<issue-uuid>")`                                  | `{"fn": {"child_of": "<issue-uuid>"}}`     | Sub-issues of the given issue                                          |
| 24.5 | `parentOf("<issue-uuid>")`                                 | `{"fn": {"parent_of": "<issue-uuid>"}}`    | Parent of the given issue (returns the parent issue's ID via subquery) |
| 24.6 | `duplicateOf("<issue-uuid>")`                              | `{"fn": {"duplicate_of": "<issue-uuid>"}}` | Issues marked as duplicates of the given one                           |
| 24.7 | `blockedBy("<issue-uuid>") AND stateGroup IN openStates()` | Combined                                   | Blocked issues that are still open                                     |

---

### 25. History: Field Change Functions

**Setup:** Perform some state/priority/assignee changes on test issues so activity records exist.

| #    | PQL Input                              | Expected Rich Filter                                  | Verify                                                        |
| ---- | -------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| 25.1 | `wasEver("priority", "urgent")`        | `{"fn": {"was_ever": ["priority", "urgent"]}}`        | Issues where priority was ever set to urgent                  |
| 25.2 | `was("priority", "high")`              | `{"fn": {"was": ["priority", "high"]}}`               | Issues where priority was previously high (then changed away) |
| 25.3 | `changedFrom("state", "<state-uuid>")` | `{"fn": {"changed_from": ["state", "<state-uuid>"]}}` | Issues moved FROM this state                                  |
| 25.4 | `changedTo("state", "<state-uuid>")`   | `{"fn": {"changed_to": ["state", "<state-uuid>"]}}`   | Issues moved TO this state                                    |
| 25.5 | `changed("assignee")`                  | `{"fn": {"changed": "assignee"}}`                     | Issues where assignee was changed at all                      |
| 25.6 | `changed("priority")`                  | `{"fn": {"changed": "priority"}}`                     | Issues where priority was changed                             |

**Supported history field names:** `state`, `stateGroup`, `priority`, `assignee`, `label`, `name`, `description`, `parent`, `startDate`, `targetDate`, `cycle`, `module`, `milestone`, `estimate`, `type`

---

### 26. History: Actor Functions

| #    | PQL Input                                   | Expected Rich Filter                                                | Verify                                       |
| ---- | ------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| 26.1 | `updatedBy("<user-uuid>")`                  | `{"fn": {"updated_by": "<user-uuid>"}}`                             | Issues updated by this user                  |
| 26.2 | `updatedBy(currentUser())`                  | `{"fn": {"updated_by": "<current-user-uuid>"}}`                     | Issues updated by you (function as argument) |
| 26.3 | `commentedBy("<user-uuid>")`                | `{"fn": {"commented_by": "<user-uuid>"}}`                           | Issues commented on by this user             |
| 26.4 | `commentedBy(currentUser())`                | `{"fn": {"commented_by": "<current-user-uuid>"}}`                   | Issues you commented on                      |
| 26.5 | `fieldChangedBy("state", "<user-uuid>")`    | `{"fn": {"field_changed_by": ["state", "<user-uuid>"]}}`            | State changed by this user                   |
| 26.6 | `fieldChangedBy("priority", currentUser())` | `{"fn": {"field_changed_by": ["priority", "<current-user-uuid>"]}}` | Priority changed by you                      |
| 26.7 | `wasAssignedTo("<user-uuid>")`              | `{"fn": {"was_assigned_to": "<user-uuid>"}}`                        | Issues ever assigned to this user            |
| 26.8 | `wasAssignedTo(currentUser())`              | `{"fn": {"was_assigned_to": "<current-user-uuid>"}}`                | Issues ever assigned to you                  |

---

### 27. History: Time-Scoped Functions

| #    | PQL Input                                                     | Expected Rich Filter                                                          | Verify                               |
| ---- | ------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------ |
| 27.1 | `changedAfter("2025-01-01")`                                  | `{"fn": {"changed_after": "2025-01-01"}}`                                     | Issues with any change after Jan 1   |
| 27.2 | `changedBefore("2025-12-31")`                                 | `{"fn": {"changed_before": "2025-12-31"}}`                                    | Issues with any change before Dec 31 |
| 27.3 | `fieldChangedAfter("state", "2025-01-01")`                    | `{"fn": {"field_changed_after": ["state", "2025-01-01"]}}`                    | State changed after Jan 1            |
| 27.4 | `fieldChangedBefore("state", "2025-12-31")`                   | `{"fn": {"field_changed_before": ["state", "2025-12-31"]}}`                   | State changed before Dec 31          |
| 27.5 | `changedToAfter("state", "<state-uuid>", "2025-01-01")`       | `{"fn": {"changed_to_after": ["state", "<state-uuid>", "2025-01-01"]}}`       | State set to value after date        |
| 27.6 | `changedToBefore("state", "<state-uuid>", "2025-12-31")`      | `{"fn": {"changed_to_before": ["state", "<state-uuid>", "2025-12-31"]}}`      | State set to value before date       |
| 27.7 | `fieldChangedBetween("state", "2025-01-01", "2025-12-31")`    | `{"fn": {"field_changed_between": ["state", "2025-01-01", "2025-12-31"]}}`    | State changed within date range      |
| 27.8 | `fieldChangedBetween("assignee", "2025-01-01", "2025-06-30")` | `{"fn": {"field_changed_between": ["assignee", "2025-01-01", "2025-06-30"]}}` | Assignee changed within date range   |

---

### 28. IN with Function Values

Functions that return lists can be used directly with `IN` (without parentheses around the function).

| #    | PQL Input                               | Expected Rich Filter                                        | Verify                                   |
| ---- | --------------------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| 28.1 | `stateGroup IN openStates()`            | `{"state_group__in": "backlog,unstarted,started"}`          | Function returns list, serialized as CSV |
| 28.2 | `stateGroup IN closedStates()`          | `{"state_group__in": "completed,cancelled"}`                | Same pattern                             |
| 28.3 | `stateGroup IN activeStates()`          | `{"state_group__in": "unstarted,started"}`                  | Same pattern                             |
| 28.4 | `stateGroup NOT IN openStates()`        | `{"not": {"state_group__in": "backlog,unstarted,started"}}` | NOT IN with function                     |
| 28.5 | `stateGroup NOT IN activeStates()`      | `{"not": {"state_group__in": "unstarted,started"}}`         | NOT IN with function                     |
| 28.6 | `cycle IN activeCycle()`                | `{"cycle_id__in": "<comma-separated-uuids>"}`               | Dynamic UUIDs from DB                    |
| 28.7 | `assignee IN membersOf("project:<id>")` | `{"assignee_id__in": "<comma-separated-uuids>"}`            | Dynamic UUIDs from DB                    |
| 28.8 | `assignee IN workspaceMembers()`        | `{"assignee_id__in": "<comma-separated-uuids>"}`            | Dynamic UUIDs from DB                    |

**Syntax note:** `IN openStates()` has no outer parentheses — the function call replaces the `(value_list)`.

---

### 29. Complex Compound Queries

These test realistic multi-condition queries combining various features.

| #     | PQL Input                                                                                         | Expected Rich Filter                                                                                                             | Scenario                            |
| ----- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 29.1  | `isOverdue() AND priority IN ("high", "urgent")`                                                  | `{"and": [{"fn": {"is_overdue": true}}, {"priority__in": "high,urgent"}]}`                                                       | Urgent overdue items                |
| 29.2  | `NOT isDraft() AND stateGroup NOT IN ("completed", "cancelled")`                                  | `{"and": [{"not": {"fn": {"is_draft": true}}}, {"not": {"state_group__in": "completed,cancelled"}}]}`                            | Active non-draft items              |
| 29.3  | `(priority = "urgent" OR isOverdue()) AND stateGroup IN activeStates()`                           | `{"and": [{"or": [...]}, {"state_group__in": "unstarted,started"}]}`                                                             | Urgent or overdue, in active states |
| 29.4  | `assignee IS EMPTY AND priority IN ("high", "urgent") AND stateGroup IN ("started", "unstarted")` | `{"and": [{"and": [{"assignee_id__isnull": true}, {"priority__in": "high,urgent"}]}, {"state_group__in": "started,unstarted"}]}` | Triage: unassigned high-priority    |
| 29.5  | `createdAt >= daysAgo(7) AND targetDate <= daysFromNow(30)`                                       | `{"and": [{"created_at__gte": "<date>"}, {"target_date__lte": "<date>"}]}`                                                       | Created recently, due soon          |
| 29.6  | `startDate BETWEEN "2025-01-01" AND "2025-06-30" AND priority IN ("high", "urgent")`              | `{"and": [{"start_date__range": "2025-01-01,2025-06-30"}, {"priority__in": "high,urgent"}]}`                                     | Date range + priority filter        |
| 29.7  | `hasNoAssignee() OR assignee = currentUser()`                                                     | `{"or": [{"fn": {"has_no_assignee": true}}, {"assignee_id": "<uuid>"}]}`                                                         | Unassigned OR mine                  |
| 29.8  | `stateGroup NOT IN ("completed", "cancelled") AND priority IN ("high", "urgent")`                 | `{"and": [{"not": {"state_group__in": "completed,cancelled"}}, {"priority__in": "high,urgent"}]}`                                | Open high-priority issues           |
| 29.9  | `assignee = currentUser() AND stateGroup IN closedStates() AND cycle IN activeCycle()`            | Three-way AND                                                                                                                    | Sprint review: my completed items   |
| 29.10 | `hasNoAssignee() AND priority IN ("high", "urgent") AND createdAt >= startOfWeek()`               | Three-way AND                                                                                                                    | Triage: new unassigned urgent items |
| 29.11 | `assignee = currentUser() AND isOverdue() AND module IS NOT EMPTY`                                | Three-way AND                                                                                                                    | My overdue module work              |
| 29.12 | `blockedBy("<issue-uuid>") AND stateGroup IN openStates()`                                        | Relation + state filter                                                                                                          | Open blocked items                  |

---

### 30. Case Insensitivity

All keywords are case-insensitive. Field names and function names are case-SENSITIVE (camelCase).

| #     | PQL Input                                         | Expected           | Notes                         |
| ----- | ------------------------------------------------- | ------------------ | ----------------------------- |
| 30.1  | `priority = "high" AND stateGroup = "started"`    | Valid              | Standard case                 |
| 30.2  | `priority = "high" and stateGroup = "started"`    | Valid, same result | Lowercase `and`               |
| 30.3  | `priority = "high" And stateGroup = "started"`    | Valid, same result | Mixed case `And`              |
| 30.4  | `priority = "high" or priority = "urgent"`        | Valid              | Lowercase `or`                |
| 30.5  | `not priority = "low"`                            | Valid              | Lowercase `not`               |
| 30.6  | `priority in ("high", "urgent")`                  | Valid              | Lowercase `in`                |
| 30.7  | `priority not in ("low", "none")`                 | Valid              | Lowercase `not in`            |
| 30.8  | `startDate is null`                               | Valid              | Lowercase `is null`           |
| 30.9  | `startDate IS NOT NULL`                           | Valid              | Uppercase                     |
| 30.10 | `assignee is not empty`                           | Valid              | Lowercase `is not empty`      |
| 30.11 | `startDate between "2025-01-01" and "2025-12-31"` | Valid              | Lowercase `between` and `and` |
| 30.12 | `isDraft = TRUE`                                  | Valid              | Uppercase boolean             |
| 30.13 | `isDraft = False`                                 | Valid              | Mixed case boolean            |

---

### 31. Error Cases

These should all return `400 Bad Request` with an error message in `{"pql": "..."}`.

| #     | PQL Input                                         | Expected Error     | Reason                                                  |
| ----- | ------------------------------------------------- | ------------------ | ------------------------------------------------------- |
| 31.1  | `??? broken`                                      | Invalid PQL syntax | Garbage input                                           |
| 31.2  | `priority IN ("high", "urgent"`                   | Invalid PQL syntax | Unclosed parenthesis                                    |
| 31.3  | `"high"`                                          | Invalid PQL syntax | Bare value, no field or operator                        |
| 31.4  | `priority = unknownFunc()`                        | Unknown function   | Function doesn't exist                                  |
| 31.5  | `priority = isOverdue()`                          | Function misuse    | Predicate used as value (predicates must be standalone) |
| 31.6  | `priority = blockedBy("abc")`                     | Function misuse    | Relation function used as value                         |
| 31.7  | `priority = wasEver("state", "done")`             | Function misuse    | History function used as value                          |
| 31.8  | `priority =`                                      | Invalid PQL syntax | Missing value                                           |
| 31.9  | `= "high"`                                        | Invalid PQL syntax | Missing field                                           |
| 31.10 | `AND priority = "high"`                           | Invalid PQL syntax | Leading operator                                        |
| 31.11 | `priority = "high" AND`                           | Invalid PQL syntax | Trailing operator                                       |
| 31.12 | `priority = "high" AND OR stateGroup = "started"` | Invalid PQL syntax | Adjacent operators                                      |
| 31.13 | `priority IN ()`                                  | Invalid PQL syntax | Empty IN list                                           |
| 31.14 | `((priority = "high")`                            | Invalid PQL syntax | Unbalanced parentheses                                  |

---

### 32. End-to-End API Verification

These tests verify that PQL queries produce correct results at the API level — not just correct rich filters, but the actual filtered issues.

#### Setup

Create the following test issues in a project:

| Issue | Priority | State Group | Assignee | Labels       | Start Date | Target Date | Draft | Parent |
| ----- | -------- | ----------- | -------- | ------------ | ---------- | ----------- | ----- | ------ |
| A     | urgent   | started     | User1    | bug          | 2025-01-01 | yesterday   | false | none   |
| B     | high     | unstarted   | User2    | feature      | 2025-02-01 | next week   | false | none   |
| C     | medium   | backlog     | none     | none         | none       | none        | false | none   |
| D     | low      | completed   | User1    | bug          | 2025-01-15 | 2025-02-01  | false | none   |
| E     | none     | cancelled   | User2    | none         | none       | none        | false | none   |
| F     | high     | started     | User1    | bug, feature | 2025-03-01 | next month  | true  | none   |
| G     | urgent   | backlog     | none     | none         | none       | none        | false | A      |

#### Test Scenarios

| #     | PQL Query                                                               | Expected Issues                        | Rationale                                       |
| ----- | ----------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------- |
| 32.1  | `priority = "urgent"`                                                   | A, G                                   | Only urgent priority                            |
| 32.2  | `priority IN ("high", "urgent")`                                        | A, B, F, G                             | High or urgent                                  |
| 32.3  | `priority != "none"`                                                    | A, B, C, D, F, G                       | All except "none" (excludes E)                  |
| 32.4  | `stateGroup IN openStates()`                                            | A, B, C, F, G                          | backlog + unstarted + started                   |
| 32.5  | `stateGroup IN closedStates()`                                          | D, E                                   | completed + cancelled                           |
| 32.6  | `assignee IS NULL`                                                      | C, G                                   | No assignee                                     |
| 32.7  | `assignee IS NOT NULL`                                                  | A, B, D, E, F                          | Has assignee                                    |
| 32.8  | `isOverdue()`                                                           | A                                      | target_date < today AND state is open           |
| 32.9  | `hasNoAssignee()`                                                       | C, G                                   | No active assignee                              |
| 32.10 | `isSubIssue()`                                                          | G                                      | Has a parent                                    |
| 32.11 | `isTopLevel()`                                                          | A, B, C, D, E, F                       | No parent                                       |
| 32.12 | `hasChildren()`                                                         | A                                      | G is child of A                                 |
| 32.13 | `isDraft()`                                                             | F                                      | Draft issue                                     |
| 32.14 | `NOT isDraft()`                                                         | A, B, C, D, E, G                       | Non-draft issues                                |
| 32.15 | `hasStartAndTarget()`                                                   | A, B, D, F                             | Both dates set                                  |
| 32.16 | `label IS EMPTY`                                                        | C, E, G                                | No labels                                       |
| 32.17 | `label IS NOT EMPTY`                                                    | A, B, D, F                             | Has at least one label                          |
| 32.18 | `name ~ "<part of issue A title>"`                                      | A (and any matching)                   | Substring match                                 |
| 32.19 | `priority = "urgent" AND stateGroup IN openStates()`                    | A, G                                   | Urgent AND open                                 |
| 32.20 | `priority = "high" OR priority = "urgent"`                              | A, B, F, G                             | Same as IN ("high", "urgent")                   |
| 32.21 | `isOverdue() AND priority IN ("high", "urgent")`                        | A                                      | Overdue + high/urgent (A is urgent and overdue) |
| 32.22 | `hasNoAssignee() AND priority IN ("high", "urgent")`                    | G                                      | Unassigned + high/urgent                        |
| 32.23 | `NOT stateGroup IN closedStates()`                                      | A, B, C, F, G                          | Excludes completed + cancelled                  |
| 32.24 | `(priority = "urgent" OR priority = "high") AND stateGroup = "started"` | A, F                                   | (urgent OR high) AND started                    |
| 32.25 | `assignee = currentUser() AND stateGroup IN openStates()`               | _(depends on who you're logged in as)_ | Your open issues                                |
| 32.26 | `childOf("<issue-A-uuid>")`                                             | G                                      | Sub-issues of A                                 |
| 32.27 | `startDate BETWEEN "2025-01-01" AND "2025-02-28"`                       | A, D, B                                | Start dates in Jan-Feb range                    |
| 32.28 | `isDraft = false AND stateGroup NOT IN ("completed", "cancelled")`      | A, B, C, G                             | Active non-draft issues                         |

---

## Appendix: Quick Operator Reference

| Operator         | PQL Syntax              | Rich Filter Key Pattern | Rich Filter Value      |
| ---------------- | ----------------------- | ----------------------- | ---------------------- |
| Equals           | `field = value`         | `field_key`             | `value`                |
| Not equals       | `field != value`        | `not > field_key`       | `value`                |
| Greater than     | `field > value`         | `field_key__gt`         | `value`                |
| Greater or equal | `field >= value`        | `field_key__gte`        | `value`                |
| Less than        | `field < value`         | `field_key__lt`         | `value`                |
| Less or equal    | `field <= value`        | `field_key__lte`        | `value`                |
| Contains         | `field ~ value`         | `field_key__icontains`  | `value`                |
| In list          | `field IN (v1, v2)`     | `field_key__in`         | `"v1,v2"` (CSV string) |
| Not in list      | `field NOT IN (v1, v2)` | `not > field_key__in`   | `"v1,v2"` (CSV string) |
| Is null          | `field IS NULL`         | `field_key__isnull`     | `true`                 |
| Is not null      | `field IS NOT NULL`     | `field_key__isnull`     | `false`                |
| Is empty         | `field IS EMPTY`        | `field_key__isnull`     | `true`                 |
| Is not empty     | `field IS NOT EMPTY`    | `field_key__isnull`     | `false`                |
| Range            | `field BETWEEN a AND b` | `field_key__range`      | `"a,b"` (CSV string)   |

## Appendix: Field Alias Reference

| PQL Field     | Rich Filter Key                                      |
| ------------- | ---------------------------------------------------- |
| `priority`    | `priority`                                           |
| `state`       | `state_id`                                           |
| `stateGroup`  | `state_group`                                        |
| `assignee`    | `assignee_id`                                        |
| `label`       | `label_id`                                           |
| `cycle`       | `cycle_id`                                           |
| `module`      | `module_id`                                          |
| `mention`     | `mention_id`                                         |
| `subscriber`  | `subscriber_id`                                      |
| `project`     | `project_id`                                         |
| `createdBy`   | `created_by_id`                                      |
| `type`        | `type_id`                                            |
| `milestone`   | `milestone_id`                                       |
| `teamProject` | `team_project_id`                                    |
| `isDraft`     | `is_draft`                                           |
| `isArchived`  | `is_archived`                                        |
| `startDate`   | `start_date`                                         |
| `targetDate`  | `target_date`                                        |
| `createdAt`   | `created_at`                                         |
| `updatedAt`   | `updated_at`                                         |
| `name`        | `name`                                               |
| `text`        | _(pseudo-field → OR of name + description_stripped)_ |

## Appendix: All Function Names → `fn` Key Mapping

| PQL Function                     | `fn` Key in Rich Filter |
| -------------------------------- | ----------------------- |
| `isOverdue()`                    | `is_overdue`            |
| `hasNoAssignee()`                | `has_no_assignee`       |
| `hasNoLabel()`                   | `has_no_label`          |
| `isTopLevel()`                   | `is_top_level`          |
| `isSubIssue()`                   | `is_sub_issue`          |
| `isEpic()`                       | `is_epic`               |
| `isIntake()`                     | `is_intake`             |
| `isDraft()`                      | `is_draft`              |
| `isArchived()`                   | `is_archived`           |
| `hasChildren()`                  | `has_children`          |
| `hasStartAndTarget()`            | `has_start_and_target`  |
| `linkedTo(id)`                   | `linked_to`             |
| `blockedBy(id)`                  | `blocked_by`            |
| `blocks(id)`                     | `blocks`                |
| `childOf(id)`                    | `child_of`              |
| `parentOf(id)`                   | `parent_of`             |
| `duplicateOf(id)`                | `duplicate_of`          |
| `wasEver(f, v)`                  | `was_ever`              |
| `was(f, v)`                      | `was`                   |
| `changedFrom(f, v)`              | `changed_from`          |
| `changedTo(f, v)`                | `changed_to`            |
| `changed(f)`                     | `changed`               |
| `updatedBy(uid)`                 | `updated_by`            |
| `commentedBy(uid)`               | `commented_by`          |
| `fieldChangedBy(f, uid)`         | `field_changed_by`      |
| `wasAssignedTo(uid)`             | `was_assigned_to`       |
| `changedAfter(d)`                | `changed_after`         |
| `changedBefore(d)`               | `changed_before`        |
| `fieldChangedAfter(f, d)`        | `field_changed_after`   |
| `fieldChangedBefore(f, d)`       | `field_changed_before`  |
| `changedToAfter(f, v, d)`        | `changed_to_after`      |
| `changedToBefore(f, v, d)`       | `changed_to_before`     |
| `fieldChangedBetween(f, d1, d2)` | `field_changed_between` |
