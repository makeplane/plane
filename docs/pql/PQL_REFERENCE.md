# PQL (Plane Query Language) Reference

A complete reference for frontend developers integrating PQL into Plane's UI.

PQL is a text-based query language for filtering work items. It is sent as the `?pql=` query parameter to API endpoints that support it. The backend parses the PQL string and converts it into the existing rich filter infrastructure.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Syntax Overview](#syntax-overview)
- [Fields](#fields)
- [Operators](#operators)
- [Logical Operators](#logical-operators)
- [Values](#values)
- [Functions](#functions)
  - [Date Functions](#date-functions)
  - [User Functions](#user-functions)
  - [Cycle Functions](#cycle-functions)
  - [State Functions](#state-functions)
  - [Predicate Functions](#predicate-functions)
  - [Relation Functions](#relation-functions)
  - [History Functions](#history-functions)
- [Rich Filter Output Format](#rich-filter-output-format)
- [API Usage](#api-usage)
- [Examples](#examples)
- [Error Handling](#error-handling)

---

## Quick Start

```
# Find all high-priority issues assigned to me
priority = "high" AND assignee = currentUser()

# Find overdue issues with no assignee
isOverdue() AND hasNoAssignee()

# Find issues created this month
createdAt >= startOfMonth() AND createdAt <= endOfMonth()
```

Send these as `?pql=<url-encoded-string>` on any endpoint with `PQLFilterBackend`.

---

## Syntax Overview

A PQL query is one or more **conditions** joined by **logical operators**.

```
<field> <operator> <value>
<field> <operator> <value> AND <field> <operator> <value>
<predicate_function>()
NOT <condition>
(<condition> OR <condition>) AND <condition>
```

**Key rules:**

- Keywords (`AND`, `OR`, `NOT`, `IN`, `IS`, `NULL`, `EMPTY`, `BETWEEN`) are **case-insensitive**
- Strings must be quoted with double (`"..."`) or single (`'...'`) quotes
- Field names are **camelCase** (e.g., `startDate`, `stateGroup`, `createdBy`)
- Function names are **camelCase** (e.g., `currentUser()`, `daysAgo(7)`)
- Parentheses can group sub-expressions: `(A OR B) AND C`

---

## Fields

| PQL Field     | Description                        | Value Type  | Example Values                                                        |
| ------------- | ---------------------------------- | ----------- | --------------------------------------------------------------------- |
| `priority`    | Issue priority                     | string      | `"urgent"`, `"high"`, `"medium"`, `"low"`, `"none"`                   |
| `state`       | State ID                           | UUID        | `"<state-uuid>"`                                                      |
| `stateGroup`  | State group name                   | string      | `"backlog"`, `"unstarted"`, `"started"`, `"completed"`, `"cancelled"` |
| `assignee`    | Assignee user ID                   | UUID        | `"<user-uuid>"`                                                       |
| `label`       | Label ID                           | UUID        | `"<label-uuid>"`                                                      |
| `cycle`       | Cycle ID                           | UUID        | `"<cycle-uuid>"`                                                      |
| `module`      | Module ID                          | UUID        | `"<module-uuid>"`                                                     |
| `mention`     | Mentioned user ID                  | UUID        | `"<user-uuid>"`                                                       |
| `subscriber`  | Subscriber user ID                 | UUID        | `"<user-uuid>"`                                                       |
| `project`     | Project ID                         | UUID        | `"<project-uuid>"`                                                    |
| `createdBy`   | Creator user ID                    | UUID        | `"<user-uuid>"`                                                       |
| `type`        | Issue type ID (EE)                 | UUID        | `"<type-uuid>"`                                                       |
| `milestone`   | Milestone ID (EE)                  | UUID        | `"<milestone-uuid>"`                                                  |
| `teamProject` | Team project ID (EE)               | UUID        | `"<team-project-uuid>"`                                               |
| `isDraft`     | Draft status                       | boolean     | `true`, `false`                                                       |
| `isArchived`  | Archive status                     | boolean     | `true`, `false`                                                       |
| `startDate`   | Start date                         | date string | `"2025-01-15"`                                                        |
| `targetDate`  | Target/due date                    | date string | `"2025-03-31"`                                                        |
| `createdAt`   | Created timestamp                  | date string | `"2025-01-01"`                                                        |
| `updatedAt`   | Updated timestamp                  | date string | `"2025-06-15"`                                                        |
| `name`        | Issue title                        | string      | `"fix login bug"`                                                     |
| `text`        | Title + description (pseudo-field) | string      | `"authentication"` (searches both name and description)               |

---

## Operators

### Comparison Operators

| Operator          | Meaning                     | Example                                           |
| ----------------- | --------------------------- | ------------------------------------------------- |
| `=`               | Equals                      | `priority = "high"`                               |
| `!=`              | Not equals                  | `priority != "none"`                              |
| `>`               | Greater than                | `createdAt > "2025-01-01"`                        |
| `>=`              | Greater than or equal       | `startDate >= "2025-01-01"`                       |
| `<`               | Less than                   | `targetDate < "2025-12-31"`                       |
| `<=`              | Less than or equal          | `updatedAt <= "2025-06-30"`                       |
| `~`               | Contains (case-insensitive) | `name ~ "bug"`                                    |
| `IN`              | Value in list               | `priority IN ("high", "urgent")`                  |
| `NOT IN`          | Value not in list           | `priority NOT IN ("low", "none")`                 |
| `IS NULL`         | Field is null/unset         | `assignee IS NULL`                                |
| `IS NOT NULL`     | Field is set                | `assignee IS NOT NULL`                            |
| `IS EMPTY`        | Field is empty              | `module IS EMPTY`                                 |
| `IS NOT EMPTY`    | Field is not empty          | `cycle IS NOT EMPTY`                              |
| `BETWEEN ... AND` | Range (inclusive)           | `createdAt BETWEEN "2025-01-01" AND "2025-12-31"` |

### Notes

- `IS NULL` and `IS EMPTY` are equivalent — both check that the field has no value.
- `IS NOT NULL` and `IS NOT EMPTY` are equivalent — both check that the field has a value.
- `~` performs a case-insensitive substring match.
- `IN` accepts either a parenthesised list or a function that returns a list:
  ```
  priority IN ("high", "urgent")
  stateGroup IN openStates()
  assignee IN membersOf("project:<project-uuid>")
  ```

---

## Logical Operators

| Operator | Description                   | Precedence |
| -------- | ----------------------------- | ---------- |
| `NOT`    | Negates a condition           | Highest    |
| `AND`    | Both conditions must be true  | Medium     |
| `OR`     | Either condition must be true | Lowest     |

**Precedence:** `NOT` > `AND` > `OR`. Use parentheses to override.

```
# This means: A OR (B AND C)
A OR B AND C

# Use parens to force: (A OR B) AND C
(A OR B) AND C
```

---

## Values

| Type     | Syntax               | Examples                           |
| -------- | -------------------- | ---------------------------------- |
| String   | `"..."` or `'...'`   | `"high"`, `'backlog'`              |
| Integer  | bare number          | `3`, `-1`, `0`                     |
| Float    | decimal number       | `3.5`, `-0.5`                      |
| Boolean  | `true` / `false`     | `true`, `false` (case-insensitive) |
| Null     | `null`               | `null` (case-insensitive)          |
| Function | `functionName(args)` | `currentUser()`, `daysAgo(7)`      |

---

## Functions

Functions can be used anywhere a value is expected (right-hand side of a condition), or as standalone conditions (predicate functions).

### Date Functions

Return date/datetime strings that resolve at query time.

| Function           | Arguments | Returns                        | Example                          |
| ------------------ | --------- | ------------------------------ | -------------------------------- |
| `now()`            | none      | Current datetime               | `createdAt > now()`              |
| `today()`          | none      | Today's date                   | `targetDate = today()`           |
| `startOfDay()`     | none      | Start of today                 | `createdAt >= startOfDay()`      |
| `endOfDay()`       | none      | End of today                   | `createdAt <= endOfDay()`        |
| `startOfWeek()`    | none      | Monday of current week         | `startDate >= startOfWeek()`     |
| `endOfWeek()`      | none      | Sunday of current week         | `targetDate <= endOfWeek()`      |
| `startOfMonth()`   | none      | 1st of current month           | `createdAt >= startOfMonth()`    |
| `endOfMonth()`     | none      | Last day of current month      | `targetDate <= endOfMonth()`     |
| `startOfYear()`    | none      | January 1st of current year    | `createdAt >= startOfYear()`     |
| `endOfYear()`      | none      | December 31st of current year  | `targetDate <= endOfYear()`      |
| `daysAgo(n)`       | integer   | Date `n` days in the past      | `createdAt >= daysAgo(7)`        |
| `daysFromNow(n)`   | integer   | Date `n` days in the future    | `targetDate <= daysFromNow(14)`  |
| `weeksAgo(n)`      | integer   | Date `n` weeks in the past     | `createdAt >= weeksAgo(2)`       |
| `weeksFromNow(n)`  | integer   | Date `n` weeks in the future   | `targetDate <= weeksFromNow(1)`  |
| `monthsAgo(n)`     | integer   | Date ~`n` months in the past   | `createdAt >= monthsAgo(3)`      |
| `monthsFromNow(n)` | integer   | Date ~`n` months in the future | `targetDate <= monthsFromNow(6)` |

> **Note:** `monthsAgo`/`monthsFromNow` approximate months as 30 days each.

### User Functions

Return user UUIDs or lists of user UUIDs.

| Function                      | Arguments       | Returns             | Example                                               |
| ----------------------------- | --------------- | ------------------- | ----------------------------------------------------- |
| `currentUser()`               | none            | Current user's UUID | `assignee = currentUser()`                            |
| `membersOf("project:<id>")`   | resource string | List of user UUIDs  | `assignee IN membersOf("project:<project-uuid>")`     |
| `membersOf("teamspace:<id>")` | resource string | List of user UUIDs  | `assignee IN membersOf("teamspace:<teamspace-uuid>")` |
| `workspaceMembers()`          | none            | List of user UUIDs  | `assignee IN workspaceMembers()`                      |

The `membersOf()` function takes a resource reference in the format `"<type>:<uuid>"`. Supported types are `project` and `teamspace`.

### Cycle Functions

Return lists of cycle UUIDs based on their status.

| Function            | Arguments | Returns                                  | Example                      |
| ------------------- | --------- | ---------------------------------------- | ---------------------------- |
| `activeCycle()`     | none      | Cycles where today is within start/end   | `cycle IN activeCycle()`     |
| `completedCycles()` | none      | Cycles whose end date has passed         | `cycle IN completedCycles()` |
| `upcomingCycles()`  | none      | Cycles whose start date is in the future | `cycle IN upcomingCycles()`  |

### State Functions

Return lists of state group strings.

| Function         | Arguments | Returns                               | Example                        |
| ---------------- | --------- | ------------------------------------- | ------------------------------ |
| `openStates()`   | none      | `["backlog", "unstarted", "started"]` | `stateGroup IN openStates()`   |
| `closedStates()` | none      | `["completed", "cancelled"]`          | `stateGroup IN closedStates()` |
| `activeStates()` | none      | `["unstarted", "started"]`            | `stateGroup IN activeStates()` |

### Predicate Functions

Standalone boolean conditions used without a field or operator. These are called on their own as complete conditions.

| Function              | Description                             | Example               |
| --------------------- | --------------------------------------- | --------------------- |
| `isOverdue()`         | Target date is past AND state is open   | `isOverdue()`         |
| `hasNoAssignee()`     | Issue has no active assignee            | `hasNoAssignee()`     |
| `hasNoLabel()`        | Issue has no labels                     | `hasNoLabel()`        |
| `isTopLevel()`        | Not a sub-issue (has no parent)         | `isTopLevel()`        |
| `isSubIssue()`        | Is a sub-issue (has a parent)           | `isSubIssue()`        |
| `isEpic()`            | Issue type is epic                      | `isEpic()`            |
| `isIntake()`          | Is an intake work item                  | `isIntake()`          |
| `isDraft()`           | Is a draft issue                        | `isDraft()`           |
| `isArchived()`        | Is archived                             | `isArchived()`        |
| `hasChildren()`       | Has at least one sub-issue              | `hasChildren()`       |
| `hasStartAndTarget()` | Has both start date and target date set | `hasStartAndTarget()` |

**Usage:** Predicate functions stand alone — they are NOT used on the right-hand side of a comparison.

```
# Correct
isOverdue() AND priority = "high"

# Incorrect — will throw an error
priority = isOverdue()
```

### Relation Functions

Query issues based on their relationships with other issues.

| Function                      | Arguments  | Description                                  | Example                       |
| ----------------------------- | ---------- | -------------------------------------------- | ----------------------------- |
| `linkedTo("<issue-uuid>")`    | issue UUID | Issues related to the given issue            | `linkedTo("<issue-uuid>")`    |
| `blockedBy("<issue-uuid>")`   | issue UUID | Issues blocked by the given issue            | `blockedBy("<issue-uuid>")`   |
| `blocks("<issue-uuid>")`      | issue UUID | Issues that block the given issue            | `blocks("<issue-uuid>")`      |
| `childOf("<issue-uuid>")`     | issue UUID | Sub-issues of the given issue                | `childOf("<issue-uuid>")`     |
| `parentOf("<issue-uuid>")`    | issue UUID | Parent issue of the given issue              | `parentOf("<issue-uuid>")`    |
| `duplicateOf("<issue-uuid>")` | issue UUID | Issues marked as duplicates of the given one | `duplicateOf("<issue-uuid>")` |

### History Functions

Query issues based on their change history. These use the `IssueActivity` model under the hood.

#### Field Change Functions

| Function                    | Arguments         | Description                                         |
| --------------------------- | ----------------- | --------------------------------------------------- |
| `wasEver(field, value)`     | field name, value | Field was ever set TO this value                    |
| `was(field, value)`         | field name, value | Field was previously this value (changed away from) |
| `changedFrom(field, value)` | field name, value | Field was changed FROM this value                   |
| `changedTo(field, value)`   | field name, value | Field was changed TO this value                     |
| `changed(field)`            | field name        | Field was changed at all                            |

**Supported history fields:** `state`, `stateGroup`, `priority`, `assignee`, `label`, `name`, `description`, `parent`, `startDate`, `targetDate`, `cycle`, `module`, `milestone`, `estimate`, `type`

**Examples:**

```
wasEver("priority", "urgent")
changedTo("state", "<state-uuid>")
changed("assignee")
```

#### Actor Functions

| Function                               | Arguments             | Description                            |
| -------------------------------------- | --------------------- | -------------------------------------- |
| `updatedBy("<user-uuid>")`             | user UUID             | Issue updated by this user (any field) |
| `commentedBy("<user-uuid>")`           | user UUID             | User commented on the issue            |
| `fieldChangedBy(field, "<user-uuid>")` | field name, user UUID | Specific field changed by this user    |
| `wasAssignedTo("<user-uuid>")`         | user UUID             | Issue was ever assigned to this user   |

**Examples:**

```
updatedBy(currentUser())
commentedBy("<user-uuid>")
fieldChangedBy("priority", currentUser())
wasAssignedTo("<user-uuid>")
```

#### Time-Scoped Functions

| Function                                       | Arguments                      | Description                             |
| ---------------------------------------------- | ------------------------------ | --------------------------------------- |
| `changedAfter("<date>")`                       | date string                    | Any change after this date              |
| `changedBefore("<date>")`                      | date string                    | Any change before this date             |
| `fieldChangedAfter(field, "<date>")`           | field name, date string        | Specific field changed after this date  |
| `fieldChangedBefore(field, "<date>")`          | field name, date string        | Specific field changed before this date |
| `changedToAfter(field, value, "<date>")`       | field name, value, date string | Field changed TO value after this date  |
| `changedToBefore(field, value, "<date>")`      | field name, value, date string | Field changed TO value before this date |
| `fieldChangedBetween(field, "<from>", "<to>")` | field name, from date, to date | Field changed within this date range    |

**Examples:**

```
changedAfter("2025-01-01")
fieldChangedAfter("priority", "2025-06-01")
changedToAfter("state", "<state-uuid>", "2025-01-01")
fieldChangedBetween("assignee", "2025-01-01", "2025-06-30")
```

---

## Rich Filter Output Format

PQL is parsed into a rich filter JSON structure that the backend's `ComplexFilterBackend` consumes. This section documents the output format for reference when debugging or building PQL programmatically.

### Simple Conditions

```
priority = "high"
→ {"priority": "high"}

priority != "low"
→ {"not": {"priority": "low"}}

createdAt > "2025-01-01"
→ {"created_at__gt": "2025-01-01"}

assignee IS NULL
→ {"assignee_id__isnull": true}

priority IN ("high", "urgent")
→ {"priority__in": "high,urgent"}

priority NOT IN ("low", "none")
→ {"not": {"priority__in": "low,none"}}

createdAt BETWEEN "2025-01-01" AND "2025-12-31"
→ {"created_at__range": "2025-01-01,2025-12-31"}

name ~ "bug"
→ {"name__icontains": "bug"}
```

### Text Pseudo-Field

The `text` field searches both `name` and `description_stripped`:

```
text ~ "authentication"
→ {"or": [{"name__icontains": "authentication"}, {"description_stripped__icontains": "authentication"}]}
```

### Logical Operators

```
A AND B
→ {"and": [<A>, <B>]}

A OR B
→ {"or": [<A>, <B>]}

NOT A
→ {"not": <A>}
```

### Predicate / Relation / History Functions

All Q-producing functions are output as `fn` nodes:

```
isOverdue()
→ {"fn": {"is_overdue": true}}

blockedBy("<issue-uuid>")
→ {"fn": {"blocked_by": "<issue-uuid>"}}

changedToAfter("state", "<state-uuid>", "2025-01-01")
→ {"fn": {"changed_to_after": ["state", "<state-uuid>", "2025-01-01"]}}
```

The `fn` node format:

- No arguments: `{"fn": {"<snake_case_name>": true}}`
- One argument: `{"fn": {"<snake_case_name>": "<value>"}}`
- Multiple arguments: `{"fn": {"<snake_case_name>": ["arg1", "arg2", ...]}}`

### Function Name Mapping (camelCase → snake_case)

| PQL Name              | `fn` Key                |
| --------------------- | ----------------------- |
| `isOverdue`           | `is_overdue`            |
| `hasNoAssignee`       | `has_no_assignee`       |
| `hasNoLabel`          | `has_no_label`          |
| `isTopLevel`          | `is_top_level`          |
| `isSubIssue`          | `is_sub_issue`          |
| `isEpic`              | `is_epic`               |
| `isIntake`            | `is_intake`             |
| `isDraft`             | `is_draft`              |
| `isArchived`          | `is_archived`           |
| `hasChildren`         | `has_children`          |
| `hasStartAndTarget`   | `has_start_and_target`  |
| `linkedTo`            | `linked_to`             |
| `blockedBy`           | `blocked_by`            |
| `blocks`              | `blocks`                |
| `childOf`             | `child_of`              |
| `parentOf`            | `parent_of`             |
| `duplicateOf`         | `duplicate_of`          |
| `wasEver`             | `was_ever`              |
| `was`                 | `was`                   |
| `changedFrom`         | `changed_from`          |
| `changedTo`           | `changed_to`            |
| `changed`             | `changed`               |
| `updatedBy`           | `updated_by`            |
| `commentedBy`         | `commented_by`          |
| `fieldChangedBy`      | `field_changed_by`      |
| `wasAssignedTo`       | `was_assigned_to`       |
| `changedAfter`        | `changed_after`         |
| `changedBefore`       | `changed_before`        |
| `fieldChangedAfter`   | `field_changed_after`   |
| `fieldChangedBefore`  | `field_changed_before`  |
| `changedToAfter`      | `changed_to_after`      |
| `changedToBefore`     | `changed_to_before`     |
| `fieldChangedBetween` | `field_changed_between` |

---

## API Usage

### Sending a PQL Query

URL-encode the PQL string and send it as the `pql` query parameter:

```
GET /api/workspaces/{slug}/projects/{project_id}/issues/?pql=priority%20%3D%20%22high%22
```

Which decodes to:

```
?pql=priority = "high"
```

### JavaScript Example

```ts
const pql = 'priority = "high" AND assignee = currentUser()';
const url = `/api/workspaces/${slug}/projects/${projectId}/issues/?pql=${encodeURIComponent(pql)}`;
const response = await fetch(url);
```

### Building PQL Strings Programmatically

When constructing PQL from UI filter selections:

```ts
function buildPQL(filters: Record<string, string[]>): string {
  const conditions: string[] = [];

  if (filters.priority?.length) {
    const values = filters.priority.map((v) => `"${v}"`).join(", ");
    conditions.push(`priority IN (${values})`);
  }

  if (filters.assignee?.length) {
    const values = filters.assignee.map((v) => `"${v}"`).join(", ");
    conditions.push(`assignee IN (${values})`);
  }

  if (filters.stateGroup?.length) {
    const values = filters.stateGroup.map((v) => `"${v}"`).join(", ");
    conditions.push(`stateGroup IN (${values})`);
  }

  return conditions.join(" AND ");
}
```

### Storing PQL Filters

PQL strings can be stored in `pql_filters` fields on these models:

- `IssueView` — saved views
- `CycleUserProperties` — per-user cycle filters
- `ModuleUserProperties` — per-user module filters
- `ProjectUserProperties` — per-user project filters
- `WorkspaceUserProperties` — per-user workspace filters
- `Exporter` — export filters
- `EpicUserProperty` (EE) — per-user epic filters
- `TeamspaceIssueProperties` (EE) — teamspace issue filters
- `InitiativeUserProperty` (EE) — per-user initiative filters

---

## Examples

### Basic Filtering

```
# High priority issues
priority = "high"

# Issues in backlog or unstarted state groups
stateGroup IN ("backlog", "unstarted")

# Issues with a specific label
label = "<label-uuid>"

# Issues containing "auth" in the title
name ~ "auth"

# Search title and description
text ~ "authentication flow"
```

### Date Filtering

```
# Created in the last 7 days
createdAt >= daysAgo(7)

# Due this week
targetDate >= startOfWeek() AND targetDate <= endOfWeek()

# Created this month
createdAt BETWEEN startOfMonth() AND endOfMonth()

# Overdue (target date in the past)
targetDate < today() AND stateGroup IN openStates()

# Due in the next 2 weeks
targetDate <= daysFromNow(14) AND targetDate >= today()
```

### User Filtering

```
# Assigned to me
assignee = currentUser()

# Created by me
createdBy = currentUser()

# Assigned to any member of a specific project
assignee IN membersOf("project:<project-uuid>")

# Unassigned issues
assignee IS NULL

# Issues I'm subscribed to
subscriber = currentUser()
```

### Combining Conditions

```
# High priority, assigned to me, in an active cycle
priority = "high" AND assignee = currentUser() AND cycle IN activeCycle()

# Urgent issues that are overdue
priority = "urgent" AND isOverdue()

# My open issues due this week
assignee = currentUser() AND stateGroup IN openStates() AND targetDate <= endOfWeek()

# Unassigned high-priority bugs (searching title)
hasNoAssignee() AND priority IN ("high", "urgent") AND name ~ "bug"
```

### Using OR and NOT

```
# High or urgent priority
priority = "high" OR priority = "urgent"

# Same thing with IN
priority IN ("high", "urgent")

# Everything except low priority
priority != "low"

# Not in completed or cancelled states
NOT stateGroup IN closedStates()

# Complex: (high priority OR overdue) AND assigned to me
(priority = "high" OR isOverdue()) AND assignee = currentUser()
```

### Predicate Functions

```
# Overdue issues
isOverdue()

# Top-level issues only (no sub-issues)
isTopLevel()

# Issues with both start and target dates
hasStartAndTarget()

# Epics with children
isEpic() AND hasChildren()

# Draft issues
isDraft()
```

### Relation Queries

```
# Issues blocked by a specific issue
blockedBy("<issue-uuid>")

# Issues that a specific issue blocks
blocks("<issue-uuid>")

# Sub-issues of a specific issue
childOf("<issue-uuid>")

# Issues linked to a specific issue
linkedTo("<issue-uuid>")
```

### History Queries

```
# Issues where priority was ever set to urgent
wasEver("priority", "urgent")

# Issues whose state was changed by me
fieldChangedBy("state", currentUser())

# Issues updated after a specific date
changedAfter("2025-01-01")

# Issues where assignee changed in Q1 2025
fieldChangedBetween("assignee", "2025-01-01", "2025-03-31")

# Issues that were moved to a specific state after a date
changedToAfter("state", "<state-uuid>", "2025-06-01")

# Issues I commented on
commentedBy(currentUser())
```

### Complex Real-World Queries

```
# Sprint review: my completed issues in the active cycle
assignee = currentUser() AND stateGroup IN closedStates() AND cycle IN activeCycle()

# Triage: unassigned, high priority, created this week
hasNoAssignee() AND priority IN ("high", "urgent") AND createdAt >= startOfWeek()

# Stale issues: open, not updated in 30 days
stateGroup IN openStates() AND updatedAt < daysAgo(30)

# Blocked work: issues blocked by a specific issue that are still open
blockedBy("<issue-uuid>") AND stateGroup IN openStates()

# My overdue work across all modules
assignee = currentUser() AND isOverdue() AND module IS NOT EMPTY
```

---

## Error Handling

The API returns a `400 Bad Request` with a JSON error when PQL parsing fails:

```json
{
  "pql": "Invalid PQL syntax: ..."
}
```

Common errors:

- **Invalid syntax** — malformed query, missing quotes, unbalanced parentheses
- **Unknown function** — using a function name that doesn't exist
- **Function misuse** — using a predicate function (e.g., `isOverdue()`) as a value in a comparison instead of as a standalone condition
- **Unknown field** — using a field name not in the supported fields list
