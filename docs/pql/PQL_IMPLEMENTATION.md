# PQL (Plane Query Language) Implementation Guide

This document describes the design and implementation plan for PQL — a JQL-like query language that sits on top of Plane's existing rich filters infrastructure.

---

## Architecture

```
PQL string
    │
    ▼
┌──────────────────┐
│  Lark Parser     │  ← PQL grammar, produces AST
└──────┬───────────┘
       │  AST
       ▼
┌──────────────────────┐
│  PQL Transformer     │  ← resolves functions to values / Q-objects
│                      │     e.g. currentUser() → request.user.id
│                      │          activeCycle() → Cycle.objects.filter(...)
│                      │          daysAgo(7)    → "2026-02-05"
└──────┬───────────────┘
       │  Rich filter JSON dict
       ▼
┌──────────────────────────┐
│  ComplexFilterBackend    │  ← existing infrastructure, untouched
│  (filter_data= kwarg)   │
└──────────────────────────┘
```

### Key Principle

Most PQL functions **resolve to simple values** (a UUID, a date string, a list of IDs) at the transformer stage. The transformer output is plain rich filter JSON that `ComplexFilterBackend` already understands. Only computed predicates like `isOverdue()` need to produce raw Django `Q` objects that get injected alongside the rich filter pipeline.

---

## Existing Infrastructure (What PQL Builds On)

### Core Files

| File                                                      | Purpose                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------ |
| `apps/api/plane/utils/filters/filter_backend.py`          | `ComplexFilterBackend` — main filter engine, accepts `filter_data` kwarg |
| `apps/api/plane/utils/filters/filterset.py`               | `BaseFilterSet`, `IssueFilterSet` — declares allowed fields + lookups    |
| `apps/api/plane/utils/filters/extended/filter_backend.py` | `ExtendedComplexFilterBackend` — adds custom property support            |
| `apps/api/plane/utils/filters/extended/filterset.py`      | `ExtendedIssueFilterSet` — EE fields (type, milestone, team)             |
| `apps/api/plane/utils/filters/converters.py`              | `LegacyToRichFiltersConverter` — converts old format → rich filter JSON  |
| `apps/api/plane/utils/filters/extended/converters.py`     | `ExtendedLegacyToRichFiltersConverter` — EE legacy conversion            |
| `apps/api/plane/utils/issue_filters.py`                   | Legacy filter functions (date arithmetic, relation filters, etc.)        |

### How Rich Filters Work

The `ComplexFilterBackend` accepts a JSON structure with logical operators and field conditions:

```json
{
  "and": [
    { "priority__in": ["high", "urgent"] },
    { "or": [{ "state_group": "started" }, { "state_group": "unstarted" }] },
    { "not": { "assignee_id__isnull": true } }
  ]
}
```

- **Logical operators**: `and`, `or`, `not`
- **Max nesting depth**: 5 (configurable)
- Compiles to a single Django `Q` object → single SQL query
- Accepts filter data via `request.query_params["filters"]` (JSON string) or `filter_data` kwarg (dict)

---

## Filterable Fields

### Issue Fields

| PQL Field    | Rich Filter Key                                         | Supported Lookups       | Values                                                                |
| ------------ | ------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------- |
| `priority`   | `priority`, `priority__in`                              | `exact`, `in`           | `"urgent"`, `"high"`, `"medium"`, `"low"`, `"none"`                   |
| `state`      | `state_id`, `state_id__in`                              | `exact`, `in`           | UUID                                                                  |
| `stateGroup` | `state_group`, `state_group__in`                        | `exact`, `in`           | `"backlog"`, `"unstarted"`, `"started"`, `"completed"`, `"cancelled"` |
| `assignee`   | `assignee_id`, `assignee_id__in`, `assignee_id__isnull` | `exact`, `in`, `isnull` | UUID                                                                  |
| `label`      | `label_id`, `label_id__in`, `label_id__isnull`          | `exact`, `in`, `isnull` | UUID                                                                  |
| `cycle`      | `cycle_id`, `cycle_id__in`, `cycle_id__isnull`          | `exact`, `in`, `isnull` | UUID                                                                  |
| `module`     | `module_id`, `module_id__in`, `module_id__isnull`       | `exact`, `in`, `isnull` | UUID                                                                  |
| `mention`    | `mention_id`, `mention_id__in`, `mention_id__isnull`    | `exact`, `in`, `isnull` | UUID                                                                  |
| `subscriber` | `subscriber_id`, `subscriber_id__in`                    | `exact`, `in`           | UUID                                                                  |
| `project`    | `project_id`, `project_id__in`                          | `exact`, `in`           | UUID                                                                  |
| `createdBy`  | `created_by_id`, `created_by_id__in`                    | `exact`, `in`           | UUID                                                                  |
| `isDraft`    | `is_draft`                                              | `exact`                 | boolean                                                               |
| `isArchived` | `is_archived`                                           | `exact`                 | boolean                                                               |

### Date Fields

| PQL Field    | Rich Filter Key | Supported Lookups                                    |
| ------------ | --------------- | ---------------------------------------------------- |
| `startDate`  | `start_date`    | `exact`, `gte`, `gt`, `lte`, `lt`, `range`, `isnull` |
| `targetDate` | `target_date`   | `exact`, `gte`, `gt`, `lte`, `lt`, `range`, `isnull` |
| `createdAt`  | `created_at`    | `exact`, `gte`, `gt`, `lte`, `lt`, `range`, `isnull` |
| `updatedAt`  | `updated_at`    | `exact`, `gte`, `gt`, `lte`, `lt`, `range`, `isnull` |

### EE-Only Fields

| PQL Field     | Rich Filter Key                                            | Supported Lookups       |
| ------------- | ---------------------------------------------------------- | ----------------------- |
| `type`        | `type_id`, `type_id__in`                                   | `exact`, `in`           |
| `milestone`   | `milestone_id`, `milestone_id__in`, `milestone_id__isnull` | `exact`, `in`, `isnull` |
| `teamProject` | `team_project_id`, `team_project_id__in`                   | `exact`, `in`           |

### Custom Properties (Dynamic)

Format: `customproperty_<property_id>__<lookup>`

Supported lookups vary by property type:

| Property Type    | Lookups                                                              |
| ---------------- | -------------------------------------------------------------------- |
| TEXT, URL, EMAIL | `exact`, `icontains`, `contains`, `startswith`, `endswith`, `isnull` |
| DECIMAL          | `exact`, `in`, `gte`, `gt`, `lte`, `lt`, `range`, `isnull`           |
| DATETIME         | `exact`, `gte`, `gt`, `lte`, `lt`, `range`, `isnull`                 |
| BOOLEAN          | `exact`, `isnull`                                                    |
| OPTION           | `exact`, `in`, `isnull`                                              |
| RELATION         | `exact`, `in`, `isnull`                                              |

---

## Operators

### Comparison Operators

| PQL Operator      | Rich Filter Lookup    | Example PQL                                       |
| ----------------- | --------------------- | ------------------------------------------------- |
| `=`               | `__exact` / plain key | `priority = "high"`                               |
| `!=`              | wrapped in `not`      | `priority != "high"`                              |
| `IN`              | `__in`                | `priority IN ("high", "urgent")`                  |
| `NOT IN`          | `not` + `__in`        | `priority NOT IN ("low", "none")`                 |
| `>`               | `__gt`                | `createdAt > "2024-01-01"`                        |
| `>=`              | `__gte`               | `startDate >= "2024-01-01"`                       |
| `<`               | `__lt`                | `targetDate < "2024-12-31"`                       |
| `<=`              | `__lte`               | `updatedAt <= "2024-06-30"`                       |
| `~` / `CONTAINS`  | `__icontains`         | `name ~ "bug"`                                    |
| `IS NULL`         | `__isnull: true`      | `assignee IS NULL`                                |
| `IS NOT NULL`     | `__isnull: false`     | `assignee IS NOT NULL`                            |
| `IS EMPTY`        | `__isnull: true`      | `module IS EMPTY`                                 |
| `IS NOT EMPTY`    | `__isnull: false`     | `cycle IS NOT EMPTY`                              |
| `BETWEEN ... AND` | `__range`             | `createdAt BETWEEN "2024-01-01" AND "2024-12-31"` |

### Logical Operators

| Operator | Rich Filter Key  | Example PQL                                                                  |
| -------- | ---------------- | ---------------------------------------------------------------------------- |
| `AND`    | `{"and": [...]}` | `priority = "high" AND assignee IS NOT NULL`                                 |
| `OR`     | `{"or": [...]}`  | `stateGroup = "started" OR stateGroup = "completed"`                         |
| `NOT`    | `{"not": {...}}` | `NOT stateGroup = "cancelled"`                                               |
| `(` `)`  | nesting          | `priority = "high" AND (stateGroup = "started" OR stateGroup = "unstarted")` |

---

## Functions

### Date Functions

Backed by existing relative date arithmetic in `issue_filters.py` (`string_date_filter()`, `timedelta`).

| Function           | Signature          | Description                   | Resolution                                                                |
| ------------------ | ------------------ | ----------------------------- | ------------------------------------------------------------------------- |
| `now()`            | `now()`            | Current datetime              | `timezone.now()`                                                          |
| `today()`          | `today()`          | Current date (midnight)       | `timezone.now().date()`                                                   |
| `startOfDay()`     | `startOfDay()`     | Start of current day          | `date.today()` at `00:00:00`                                              |
| `endOfDay()`       | `endOfDay()`       | End of current day            | `date.today()` at `23:59:59`                                              |
| `startOfWeek()`    | `startOfWeek()`    | Monday of current week        | `today - timedelta(days=today.weekday())`                                 |
| `endOfWeek()`      | `endOfWeek()`      | Sunday of current week        | `startOfWeek() + timedelta(days=6)`                                       |
| `startOfMonth()`   | `startOfMonth()`   | First day of current month    | `today.replace(day=1)`                                                    |
| `endOfMonth()`     | `endOfMonth()`     | Last day of current month     | `calendar.monthrange(year, month)`                                        |
| `startOfYear()`    | `startOfYear()`    | January 1st of current year   | `today.replace(month=1, day=1)`                                           |
| `endOfYear()`      | `endOfYear()`      | December 31st of current year | `today.replace(month=12, day=31)`                                         |
| `daysAgo(n)`       | `daysAgo(7)`       | N days in the past            | `today - timedelta(days=n)`                                               |
| `daysFromNow(n)`   | `daysFromNow(14)`  | N days in the future          | `today + timedelta(days=n)`                                               |
| `weeksAgo(n)`      | `weeksAgo(2)`      | N weeks in the past           | `today - timedelta(weeks=n)` — uses existing `n_weeks` pattern            |
| `weeksFromNow(n)`  | `weeksFromNow(1)`  | N weeks in the future         | `today + timedelta(weeks=n)` — uses existing `n_weeks;fromnow` pattern    |
| `monthsAgo(n)`     | `monthsAgo(3)`     | N months in the past          | `today - timedelta(days=n*30)` — uses existing `n_months` pattern         |
| `monthsFromNow(n)` | `monthsFromNow(1)` | N months in the future        | `today + timedelta(days=n*30)` — uses existing `n_months;fromnow` pattern |

**Example PQL queries:**

```
createdAt >= daysAgo(7)
targetDate <= endOfMonth()
startDate BETWEEN startOfMonth() AND endOfMonth()
updatedAt >= weeksAgo(2)
```

### User Functions

Backed by `request.user`, `ProjectMember`, `WorkspaceMember` models.

| Function             | Signature                         | Description                         | Resolution                                                                                         |
| -------------------- | --------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `currentUser()`      | `currentUser()`                   | The authenticated user's ID         | `request.user.id`                                                                                  |
| `membersOf(project)` | `membersOf("project:PROJECT_ID")` | All member IDs of a project         | `ProjectMember.objects.filter(project=id, is_active=True).values_list("member_id", flat=True)`     |
| `workspaceMembers()` | `workspaceMembers()`              | All member IDs in current workspace | `WorkspaceMember.objects.filter(workspace=id, is_active=True).values_list("member_id", flat=True)` |

**Example PQL queries:**

```
assignee = currentUser()
assignee IN membersOf("project:project-uuid"), membersOf("teamspace:teamspace-uuid")
createdBy = currentUser()
```

### Cycle / Sprint Functions

Backed by `Cycle` model and active cycle logic in `active_cycle.py`.

| Function            | Signature           | Description                | Resolution                                                     |
| ------------------- | ------------------- | -------------------------- | -------------------------------------------------------------- |
| `activeCycle()`     | `activeCycle()`     | Currently active cycle IDs | `Cycle.objects.filter(start_date__lte=now, end_date__gte=now)` |
| `completedCycles()` | `completedCycles()` | Past/completed cycle IDs   | `Cycle.objects.filter(end_date__lt=now)`                       |
| `upcomingCycles()`  | `upcomingCycles()`  | Future cycle IDs           | `Cycle.objects.filter(start_date__gt=now)`                     |

**Example PQL queries:**

```
cycle IN activeCycle()
cycle IN completedCycles()
cycle NOT IN upcomingCycles()
```

### State / Status Functions

Backed by `StateGroup` enum values and `filter_issue_state_type()`.

| Function         | Signature        | Description                    | Resolution                                                         |
| ---------------- | ---------------- | ------------------------------ | ------------------------------------------------------------------ |
| `openStates()`   | `openStates()`   | State groups that are "open"   | `["backlog", "unstarted", "started"]`                              |
| `closedStates()` | `closedStates()` | State groups that are "closed" | `["completed", "cancelled"]`                                       |
| `activeStates()` | `activeStates()` | State groups that are "active" | `["unstarted", "started"]` — maps to existing `type=active` filter |

**Example PQL queries:**

```
stateGroup IN openStates()
stateGroup IN closedStates()
stateGroup NOT IN closedStates()
```

### Computed / Predicate Functions

These are boolean predicates that resolve to Django `Q` objects rather than simple values. They act as standalone conditions.

| Function              | Signature             | Description                                 | Q Object                                                                                               |
| --------------------- | --------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `isOverdue()`         | `isOverdue()`         | Target date is past and issue is still open | `Q(target_date__lt=today) & Q(state__group__in=["backlog","unstarted","started"])`                     |
| `hasNoAssignee()`     | `hasNoAssignee()`     | No assignee (with soft-delete awareness)    | `~Q(issue_assignee__deleted_at__isnull=True, issue_assignee__isnull=False)`                            |
| `hasNoLabel()`        | `hasNoLabel()`        | No labels attached                          | `label_id__isnull: true`                                                                               |
| `isTopLevel()`        | `isTopLevel()`        | Not a sub-issue                             | `Q(parent__isnull=True)` — exists as `filter_sub_issue_toggle`                                         |
| `isSubIssue()`        | `isSubIssue()`        | Is a sub-issue                              | `Q(parent__isnull=False)`                                                                              |
| `isEpic()`            | `isEpic()`            | Is an epic type                             | `Q(type__is_epic=True)` — exists as `filter_is_epic`                                                   |
| `isIntake()`          | `isIntake()`          | Is an intake work item                      | `Q(issue_intake__isnull=False)` — exists as `filter_is_intake_workitem`                                |
| `isDraft()`           | `isDraft()`           | Is a draft issue                            | `Q(is_draft=True)`                                                                                     |
| `isArchived()`        | `isArchived()`        | Is archived                                 | `Q(archived_at__isnull=False)`                                                                         |
| `hasChildren()`       | `hasChildren()`       | Has at least one sub-issue                  | `Q(issue_parent__isnull=False)` (reverse FK exists)                                                    |
| `hasStartAndTarget()` | `hasStartAndTarget()` | Has both start and target dates             | `Q(start_date__isnull=False, target_date__isnull=False)` — exists as `filter_start_target_date_issues` |

**Example PQL queries:**

```
isOverdue() AND priority IN ("high", "urgent")
isTopLevel() AND hasNoAssignee()
isEpic() AND stateGroup IN activeStates()
```

### Relation / Link Functions

Backed by `IssueRelation` model with bidirectional relation types: `duplicate`, `relates_to`, `blocked_by`/`blocking`, `start_before`/`start_after`, `finish_before`/`finish_after`, `implemented_by`/`implements`.

| Function             | Signature                 | Description                      | Resolution                                                                                           |
| -------------------- | ------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `linkedTo(issue)`    | `linkedTo("ISSUE_ID")`    | Issues related to a given issue  | `IssueRelation.objects.filter(related_issue=id, relation_type="relates_to").values_list("issue_id")` |
| `blockedBy(issue)`   | `blockedBy("ISSUE_ID")`   | Issues blocked by a given issue  | `IssueRelation.objects.filter(related_issue=id, relation_type="blocked_by").values_list("issue_id")` |
| `blocks(issue)`      | `blocks("ISSUE_ID")`      | Issues that block a given issue  | `IssueRelation.objects.filter(issue=id, relation_type="blocked_by").values_list("related_issue_id")` |
| `childOf(issue)`     | `childOf("ISSUE_ID")`     | Direct children of a given issue | `Q(parent_id=issue_id)`                                                                              |
| `parentOf(issue)`    | `parentOf("ISSUE_ID")`    | Parent of a given issue          | `Issue.objects.filter(issue_parent__id=issue_id).values_list("id")`                                  |
| `duplicateOf(issue)` | `duplicateOf("ISSUE_ID")` | Issues marked as duplicates      | `IssueRelation.objects.filter(related_issue=id, relation_type="duplicate").values_list("issue_id")`  |

**Example PQL queries:**

```
blockedBy("issue-uuid") AND stateGroup IN activeStates()
childOf("epic-uuid") AND priority = "high"
```

### Text Search

| Operator           | Description                           | Resolution                                                         |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------ |
| `name ~ "keyword"` | Case-insensitive name search          | `Q(name__icontains="keyword")`                                     |
| `text ~ "keyword"` | Full text search (name + description) | `Q(name__icontains=...) \| Q(description_stripped__icontains=...)` |

**Example PQL queries:**

```
name ~ "login bug" AND priority = "urgent"
text ~ "authentication" AND stateGroup IN openStates()
```

---

## Lark Grammar

```lark
start: expr

// Logical operators (lowest precedence)
?expr: or_expr

?or_expr: and_expr
        | or_expr "OR"i and_expr        -> or_expr

?and_expr: not_expr
         | and_expr "AND"i not_expr     -> and_expr

?not_expr: "NOT"i not_expr             -> not_expr
         | atom

?atom: condition
     | predicate_func
     | "(" expr ")"                    -> paren_expr

// Conditions: field <op> value
condition: field "=" value              -> eq
         | field "!=" value             -> neq
         | field "IN"i "(" value_list ")"   -> in_op
         | field "NOT"i "IN"i "(" value_list ")" -> not_in
         | field ">" value              -> gt
         | field ">=" value             -> gte
         | field "<" value              -> lt
         | field "<=" value             -> lte
         | field "~" value              -> contains
         | field "IS"i "NULL"i          -> is_null
         | field "IS"i "NOT"i "NULL"i   -> is_not_null
         | field "IS"i "EMPTY"i         -> is_empty
         | field "IS"i "NOT"i "EMPTY"i  -> is_not_empty
         | field "BETWEEN"i value "AND"i value -> between

// Predicate functions (standalone boolean conditions)
predicate_func: FUNC_NAME "(" ")"      -> predicate_call

// Fields and values
field: FIELD_NAME

?value: ESCAPED_STRING                  -> string_val
      | SIGNED_NUMBER                   -> number_val
      | "true"i                         -> true_val
      | "false"i                        -> false_val
      | "null"i                         -> null_val
      | func_call                       -> func_val

func_call: FUNC_NAME "(" func_args? ")"
func_args: value ("," value)*

value_list: value ("," value)*

FIELD_NAME: /[a-zA-Z_][a-zA-Z0-9_.]*/
FUNC_NAME: /[a-zA-Z_][a-zA-Z0-9_]*/

%import common.ESCAPED_STRING
%import common.SIGNED_NUMBER
%import common.WS
%ignore WS
```

---

## Transformer Design

The Lark `Transformer` converts the parsed AST into a rich filter JSON dict.

### Field Alias Map

Maps user-friendly PQL field names to internal rich filter keys:

```python
FIELD_ALIASES = {
    # Direct fields
    "priority": "priority",
    "isDraft": "is_draft",
    "isArchived": "is_archived",

    # UUID relation fields
    "state": "state_id",
    "assignee": "assignee_id",
    "label": "label_id",
    "cycle": "cycle_id",
    "module": "module_id",
    "mention": "mention_id",
    "subscriber": "subscriber_id",
    "project": "project_id",
    "createdBy": "created_by_id",

    # State group
    "stateGroup": "state_group",

    # Date fields
    "startDate": "start_date",
    "targetDate": "target_date",
    "createdAt": "created_at",
    "updatedAt": "updated_at",

    # EE fields
    "type": "type_id",
    "milestone": "milestone_id",
    "teamProject": "team_project_id",
}
```

### Operator → Lookup Map

```python
OPERATOR_LOOKUP = {
    "eq":           "",             # plain key (exact)
    "neq":          "",             # wrapped in {"not": ...}
    "gt":           "__gt",
    "gte":          "__gte",
    "lt":           "__lt",
    "lte":          "__lte",
    "in_op":        "__in",
    "not_in":       "__in",         # wrapped in {"not": ...}
    "contains":     "__icontains",
    "is_null":      "__isnull",     # value = true
    "is_not_null":  "__isnull",     # value = false
    "is_empty":     "__isnull",     # value = true
    "is_not_empty": "__isnull",     # value = false
    "between":      "__range",
}
```

### Function Registry

```python
FUNCTIONS = {
    # Date functions — resolve to date/datetime strings
    "now":            lambda ctx: str(timezone.now()),
    "today":          lambda ctx: str(timezone.now().date()),
    "startOfDay":     lambda ctx: str(date.today()),
    "endOfDay":       lambda ctx: str(date.today()),
    "startOfWeek":    lambda ctx: str(date.today() - timedelta(days=date.today().weekday())),
    "endOfWeek":      lambda ctx: str(date.today() - timedelta(days=date.today().weekday()) + timedelta(days=6)),
    "startOfMonth":   lambda ctx: str(date.today().replace(day=1)),
    "endOfMonth":     lambda ctx: str(date.today().replace(day=calendar.monthrange(date.today().year, date.today().month)[1])),
    "startOfYear":    lambda ctx: str(date.today().replace(month=1, day=1)),
    "endOfYear":      lambda ctx: str(date.today().replace(month=12, day=31)),
    "daysAgo":        lambda ctx, n: str(date.today() - timedelta(days=int(n))),
    "daysFromNow":    lambda ctx, n: str(date.today() + timedelta(days=int(n))),
    "weeksAgo":       lambda ctx, n: str(date.today() - timedelta(weeks=int(n))),
    "weeksFromNow":   lambda ctx, n: str(date.today() + timedelta(weeks=int(n))),
    "monthsAgo":      lambda ctx, n: str(date.today() - timedelta(days=int(n) * 30)),
    "monthsFromNow":  lambda ctx, n: str(date.today() + timedelta(days=int(n) * 30)),

    # User functions — resolve to UUID or list of UUIDs
    "currentUser":      lambda ctx: str(ctx["request"].user.id),
    "membersOf":        lambda ctx, project_id: list(
        ProjectMember.objects.filter(
            project_id=project_id, is_active=True, member__is_active=True
        ).values_list("member_id", flat=True)
    ),
    "workspaceMembers": lambda ctx: list(
        WorkspaceMember.objects.filter(
            workspace_id=ctx["workspace_id"], is_active=True, member__is_active=True
        ).values_list("member_id", flat=True)
    ),

    # Cycle functions — resolve to list of cycle UUIDs
    "activeCycle":      lambda ctx: list(
        Cycle.objects.filter(
            workspace_id=ctx["workspace_id"],
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date(),
            project__archived_at__isnull=True,
        ).values_list("id", flat=True)
    ),
    "completedCycles":  lambda ctx: list(
        Cycle.objects.filter(
            workspace_id=ctx["workspace_id"],
            end_date__lt=timezone.now().date(),
        ).values_list("id", flat=True)
    ),
    "upcomingCycles":   lambda ctx: list(
        Cycle.objects.filter(
            workspace_id=ctx["workspace_id"],
            start_date__gt=timezone.now().date(),
        ).values_list("id", flat=True)
    ),

    # State group functions — resolve to list of state group strings
    "openStates":   lambda ctx: ["backlog", "unstarted", "started"],
    "closedStates": lambda ctx: ["completed", "cancelled"],
    "activeStates": lambda ctx: ["unstarted", "started"],
}
```

### Predicate Function Registry

These return Django `Q` objects, not simple values:

```python
PREDICATE_FUNCTIONS = {
    "isOverdue": lambda ctx: Q(
        target_date__lt=timezone.now().date(),
        state__group__in=["backlog", "unstarted", "started"],
    ),
    "hasNoAssignee": lambda ctx: ~Q(
        issue_assignee__deleted_at__isnull=True,
        issue_assignee__isnull=False,
    ),
    "hasNoLabel": lambda ctx: ~Q(
        issue_label__deleted_at__isnull=True,
        issue_label__isnull=False,
    ),
    "isTopLevel":       lambda ctx: Q(parent__isnull=True),
    "isSubIssue":       lambda ctx: Q(parent__isnull=False),
    "isEpic":           lambda ctx: Q(type__is_epic=True),
    "isIntake":         lambda ctx: Q(issue_intake__isnull=False),
    "isDraft":          lambda ctx: Q(is_draft=True),
    "isArchived":       lambda ctx: Q(archived_at__isnull=False),
    "hasChildren":      lambda ctx: Q(issue_parent__isnull=False),
    "hasStartAndTarget": lambda ctx: Q(
        start_date__isnull=False,
        target_date__isnull=False,
    ),
}
```

### Relation Function Registry

These return querysets of issue IDs:

```python
RELATION_FUNCTIONS = {
    "linkedTo": lambda ctx, issue_id: IssueRelation.objects.filter(
        related_issue_id=issue_id, relation_type="relates_to"
    ).values_list("issue_id", flat=True),

    "blockedBy": lambda ctx, issue_id: IssueRelation.objects.filter(
        related_issue_id=issue_id, relation_type="blocked_by"
    ).values_list("issue_id", flat=True),

    "blocks": lambda ctx, issue_id: IssueRelation.objects.filter(
        issue_id=issue_id, relation_type="blocked_by"
    ).values_list("related_issue_id", flat=True),

    "childOf": lambda ctx, issue_id: Q(parent_id=issue_id),

    "parentOf": lambda ctx, issue_id: Issue.objects.filter(
        issue_parent__id=issue_id
    ).values_list("id", flat=True),

    "duplicateOf": lambda ctx, issue_id: IssueRelation.objects.filter(
        related_issue_id=issue_id, relation_type="duplicate"
    ).values_list("issue_id", flat=True),
}
```

### History Function Registry

History functions query the `IssueActivity` model to filter issues based on their change history. The model tracks every field change with `verb`, `field`, `old_value`, `new_value`, `old_identifier`, `new_identifier`, `actor`, and `created_at`.

All history functions resolve to `Q(pk__in=<subquery>)` using `IssueActivity.objects.filter(...).values_list("issue_id")`.

#### Tracked Fields in IssueActivity

The `field` column records which issue attribute changed. These are the values you'll see:

| Activity Field   | Description                     |
| ---------------- | ------------------------------- |
| `state`          | Workflow state transitions      |
| `priority`       | Priority changes                |
| `assignees`      | Assignee additions/removals     |
| `labels`         | Label additions/removals        |
| `name`           | Title changes                   |
| `description`    | Description edits               |
| `parent`         | Parent issue changes            |
| `start_date`     | Start date changes              |
| `target_date`    | Due date changes                |
| `cycles`         | Cycle/sprint assignment changes |
| `modules`        | Module assignment changes       |
| `milestones`     | Milestone assignment changes    |
| `estimate_point` | Estimate changes                |
| `attachment`     | File attachment add/remove      |
| `link`           | Link add/remove                 |
| `comment`        | Comment activity                |
| `archived_at`    | Archive/restore                 |
| `type`           | Issue type changes              |
| `intake`         | Intake status changes           |

#### Activity Verbs

The `verb` column records what kind of action was performed:

| Verb        | Description                                        |
| ----------- | -------------------------------------------------- |
| `created`   | Entity was created                                 |
| `updated`   | Field was modified                                 |
| `deleted`   | Entity was removed                                 |
| `added`     | Item added to a collection (assignee, label, etc.) |
| `removed`   | Item removed from a collection                     |
| `converted` | Type conversion (e.g., epic to work item)          |

#### Field Change Functions

These filter issues based on whether a specific field was ever changed to/from a value.

```python
HISTORY_FUNCTIONS = {
    # Was a field ever set to a specific value?
    # Usage: wasEver("priority", "urgent")
    # Finds issues where priority was set to "urgent" at any point
    "wasEver": lambda ctx, field, value: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field=FIELD_TO_ACTIVITY_FIELD.get(field, field),
            new_value=value,
        ).values_list("issue_id", flat=True)
    ),

    # Was a field previously set to a value (but isn't anymore)?
    # Usage: was("priority", "urgent")
    # Finds issues that WERE urgent but have since changed
    "was": lambda ctx, field, value: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field=FIELD_TO_ACTIVITY_FIELD.get(field, field),
            old_value=value,
        ).values_list("issue_id", flat=True)
    ),

    # Was a field changed FROM a specific value?
    # Usage: changedFrom("state", "In Progress")
    "changedFrom": lambda ctx, field, value: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field=FIELD_TO_ACTIVITY_FIELD.get(field, field),
            old_value=value,
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),

    # Was a field changed TO a specific value?
    # Usage: changedTo("state", "Done")
    "changedTo": lambda ctx, field, value: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field=FIELD_TO_ACTIVITY_FIELD.get(field, field),
            new_value=value,
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),

    # Was a field changed at all (any transition)?
    # Usage: changed("priority")
    "changed": lambda ctx, field: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field=FIELD_TO_ACTIVITY_FIELD.get(field, field),
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),
}
```

#### Actor-Based Functions

Filter issues by who performed actions on them.

```python
HISTORY_ACTOR_FUNCTIONS = {
    # Issue was updated by a specific user (any field change)
    # Usage: updatedBy(currentUser())
    "updatedBy": lambda ctx, user_id: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            actor_id=user_id,
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),

    # Issue has a comment by a specific user
    # Usage: commentedBy(currentUser())
    "commentedBy": lambda ctx, user_id: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            actor_id=user_id,
            field="comment",
            verb="created",
        ).values_list("issue_id", flat=True)
    ),

    # A specific field was changed by a specific user
    # Usage: fieldChangedBy("state", currentUser())
    "fieldChangedBy": lambda ctx, field, user_id: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            actor_id=user_id,
            field=FIELD_TO_ACTIVITY_FIELD.get(field, field),
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),

    # Issue was ever assigned to a specific user (even if unassigned now)
    # Usage: wasAssignedTo(currentUser())
    "wasAssignedTo": lambda ctx, user_id: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field="assignees",
            new_identifier=user_id,
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),
}
```

#### Time-Scoped History Functions

Filter issues by when changes happened. These accept date values or date functions as arguments.

```python
HISTORY_TIME_FUNCTIONS = {
    # Any change happened after a specific date
    # Usage: changedAfter(daysAgo(7))
    "changedAfter": lambda ctx, date_str: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            created_at__gte=date_str,
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),

    # Any change happened before a specific date
    # Usage: changedBefore("2024-01-01")
    "changedBefore": lambda ctx, date_str: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            created_at__lte=date_str,
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),

    # A specific field was changed after a date
    # Usage: fieldChangedAfter("state", daysAgo(7))
    "fieldChangedAfter": lambda ctx, field, date_str: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field=FIELD_TO_ACTIVITY_FIELD.get(field, field),
            created_at__gte=date_str,
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),

    # A specific field was changed before a date
    # Usage: fieldChangedBefore("priority", "2024-06-01")
    "fieldChangedBefore": lambda ctx, field, date_str: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field=FIELD_TO_ACTIVITY_FIELD.get(field, field),
            created_at__lte=date_str,
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),

    # A field was changed to a specific value after a date
    # Usage: changedToAfter("state", "Done", startOfMonth())
    "changedToAfter": lambda ctx, field, value, date_str: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field=FIELD_TO_ACTIVITY_FIELD.get(field, field),
            new_value=value,
            created_at__gte=date_str,
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),

    # A field was changed to a specific value before a date
    # Usage: changedToBefore("priority", "urgent", "2024-01-01")
    "changedToBefore": lambda ctx, field, value, date_str: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field=FIELD_TO_ACTIVITY_FIELD.get(field, field),
            new_value=value,
            created_at__lte=date_str,
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),

    # Issue was not updated since a given date (stale issues)
    # Usage: NOT changedAfter(daysAgo(30))
    # (achieved by combining NOT with changedAfter)

    # A specific field was changed between two dates
    # Usage: fieldChangedBetween("state", startOfMonth(), endOfMonth())
    "fieldChangedBetween": lambda ctx, field, date_from, date_to: Q(
        pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field=FIELD_TO_ACTIVITY_FIELD.get(field, field),
            created_at__gte=date_from,
            created_at__lte=date_to,
            verb="updated",
        ).values_list("issue_id", flat=True)
    ),
}
```

#### Field Name Mapping (PQL field → IssueActivity.field value)

```python
FIELD_TO_ACTIVITY_FIELD = {
    "state":       "state",
    "stateGroup":  "state",       # state group changes are recorded as "state" activities
    "priority":    "priority",
    "assignee":    "assignees",
    "label":       "labels",
    "name":        "name",
    "description": "description",
    "parent":      "parent",
    "startDate":   "start_date",
    "targetDate":  "target_date",
    "cycle":       "cycles",
    "module":      "modules",
    "milestone":   "milestones",
    "estimate":    "estimate_point",
    "type":        "type",
}
```

---

## Transformation Examples

### History function — wasEver

```
wasEver("priority", "urgent") AND stateGroup IN closedStates()
```

Transformer output:

```python
{
    "rich_filter": {"state_group__in": ["completed", "cancelled"]},
    "q_objects": [
        Q(pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field="priority",
            new_value="urgent",
        ).values_list("issue_id", flat=True))
    ]
}
```

### History function — changedAfter with date function

```
fieldChangedAfter("state", daysAgo(7)) AND priority = "high"
```

Transformer output:

```python
{
    "rich_filter": {"priority": "high"},
    "q_objects": [
        Q(pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field="state",
            created_at__gte="2026-02-05",
            verb="updated",
        ).values_list("issue_id", flat=True))
    ]
}
```

### History function — wasAssignedTo with currentUser

```
wasAssignedTo(currentUser()) AND assignee != currentUser()
```

Transformer output:

```python
{
    "rich_filter": {"not": {"assignee_id": "<resolved-user-uuid>"}},
    "q_objects": [
        Q(pk__in=IssueActivity.objects.filter(
            workspace_id=ctx["workspace_id"],
            field="assignees",
            new_identifier="<resolved-user-uuid>",
            verb="updated",
        ).values_list("issue_id", flat=True))
    ]
}
```

### History function — stale issue detection

```
NOT changedAfter(daysAgo(30)) AND stateGroup IN activeStates()
```

Finds issues in active states that have had no updates in 30 days.

---

## Transformation Examples (continued)

### Simple equality

```
priority = "high"
```

Transformer output:

```json
{ "priority": "high" }
```

### AND with function

```
priority = "high" AND assignee = currentUser()
```

Transformer output:

```json
{ "and": [{ "priority": "high" }, { "assignee_id": "<resolved-user-uuid>" }] }
```

### OR with IN

```
priority IN ("high", "urgent") OR stateGroup = "started"
```

Transformer output:

```json
{ "or": [{ "priority__in": ["high", "urgent"] }, { "state_group": "started" }] }
```

### NOT

```
NOT stateGroup IN closedStates()
```

Transformer output:

```json
{ "not": { "state_group__in": ["completed", "cancelled"] } }
```

### Nested with parentheses

```
priority IN ("high", "urgent") AND (stateGroup = "started" OR stateGroup = "unstarted")
```

Transformer output:

```json
{
  "and": [
    { "priority__in": ["high", "urgent"] },
    { "or": [{ "state_group": "started" }, { "state_group": "unstarted" }] }
  ]
}
```

### Date function

```
createdAt >= daysAgo(7) AND targetDate <= endOfMonth()
```

Transformer output:

```json
{ "and": [{ "created_at__gte": "2026-02-05" }, { "target_date__lte": "2026-02-28" }] }
```

### Between

```
createdAt BETWEEN startOfMonth() AND endOfMonth()
```

Transformer output:

```json
{ "created_at__range": ["2026-02-01", "2026-02-28"] }
```

### Predicate function with AND

```
isOverdue() AND priority IN ("high", "urgent")
```

Transformer output (hybrid — predicate becomes a Q object, rest is rich filter JSON):

```python
# The transformer returns a mixed result:
{
    "rich_filter": {"priority__in": ["high", "urgent"]},
    "q_objects": [Q(target_date__lt=today, state__group__in=["backlog", "unstarted", "started"])]
}
```

### Relation function

```
blockedBy("issue-uuid") AND stateGroup IN activeStates()
```

Transformer output:

```python
{
    "rich_filter": {"state_group__in": ["unstarted", "started"]},
    "q_objects": [Q(pk__in=IssueRelation.objects.filter(...).values_list("issue_id"))]
}
```

---

## Integration Point

### Option A: New query parameter (recommended)

Add a `?pql=...` query parameter alongside the existing `?filters=...`:

```python
class PQLFilterBackend:
    """Parses PQL string and delegates to ComplexFilterBackend."""

    def filter_queryset(self, request, queryset, view):
        pql_string = request.query_params.get("pql")
        if not pql_string:
            return queryset

        ctx = {
            "request": request,
            "workspace_id": view.kwargs.get("slug"),
        }

        # Parse and transform
        result = pql_parse(pql_string, ctx)

        # Apply rich filter portion via existing backend
        if result.get("rich_filter"):
            backend = ComplexFilterBackend()
            queryset = backend.filter_queryset(
                request, queryset, view,
                filter_data=result["rich_filter"]
            )

        # Apply Q objects from predicate/relation functions
        for q in result.get("q_objects", []):
            queryset = queryset.filter(q)

        return queryset
```

Usage in views:

```python
class IssueViewSet(BaseViewSet):
    filter_backends = (PQLFilterBackend, ComplexFilterBackend)
    filterset_class = IssueFilterSet
```

### Option B: Converter (like LegacyToRichFiltersConverter)

For stored PQL queries (saved views/filters), add a `PQLToRichFiltersConverter` that converts PQL → rich filter JSON at save time. This only works for the subset of PQL that doesn't use context-dependent functions like `currentUser()` or `now()`.

---

## Complete Function Reference (Quick Reference)

### Value Functions (resolve to values at query time)

| Category  | Function               | Args        | Returns              |
| --------- | ---------------------- | ----------- | -------------------- |
| **Date**  | `now()`                | —           | datetime string      |
| **Date**  | `today()`              | —           | date string          |
| **Date**  | `startOfDay()`         | —           | date string          |
| **Date**  | `endOfDay()`           | —           | date string          |
| **Date**  | `startOfWeek()`        | —           | date string          |
| **Date**  | `endOfWeek()`          | —           | date string          |
| **Date**  | `startOfMonth()`       | —           | date string          |
| **Date**  | `endOfMonth()`         | —           | date string          |
| **Date**  | `startOfYear()`        | —           | date string          |
| **Date**  | `endOfYear()`          | —           | date string          |
| **Date**  | `daysAgo(n)`           | int         | date string          |
| **Date**  | `daysFromNow(n)`       | int         | date string          |
| **Date**  | `weeksAgo(n)`          | int         | date string          |
| **Date**  | `weeksFromNow(n)`      | int         | date string          |
| **Date**  | `monthsAgo(n)`         | int         | date string          |
| **Date**  | `monthsFromNow(n)`     | int         | date string          |
| **User**  | `currentUser()`        | —           | UUID string          |
| **User**  | `membersOf(projectId)` | UUID string | list of UUID strings |
| **User**  | `workspaceMembers()`   | —           | list of UUID strings |
| **Cycle** | `activeCycle()`        | —           | list of UUID strings |
| **Cycle** | `completedCycles()`    | —           | list of UUID strings |
| **Cycle** | `upcomingCycles()`     | —           | list of UUID strings |
| **State** | `openStates()`         | —           | list of strings      |
| **State** | `closedStates()`       | —           | list of strings      |
| **State** | `activeStates()`       | —           | list of strings      |

### Predicate Functions (resolve to Q objects, standalone conditions)

| Function              | Args | Description                      |
| --------------------- | ---- | -------------------------------- |
| `isOverdue()`         | —    | Target date past + state is open |
| `hasNoAssignee()`     | —    | No active assignee               |
| `hasNoLabel()`        | —    | No labels attached               |
| `isTopLevel()`        | —    | Not a sub-issue                  |
| `isSubIssue()`        | —    | Is a sub-issue                   |
| `isEpic()`            | —    | Epic issue type                  |
| `isIntake()`          | —    | Intake work item                 |
| `isDraft()`           | —    | Draft issue                      |
| `isArchived()`        | —    | Archived issue                   |
| `hasChildren()`       | —    | Has sub-issues                   |
| `hasStartAndTarget()` | —    | Has both start and target dates  |

### Relation Functions (resolve to Q objects with subqueries)

| Function               | Args        | Description                   |
| ---------------------- | ----------- | ----------------------------- |
| `linkedTo(issueId)`    | UUID string | Issues related to given issue |
| `blockedBy(issueId)`   | UUID string | Issues blocked by given issue |
| `blocks(issueId)`      | UUID string | Issues blocking given issue   |
| `childOf(issueId)`     | UUID string | Children of given issue       |
| `parentOf(issueId)`    | UUID string | Parent of given issue         |
| `duplicateOf(issueId)` | UUID string | Duplicates of given issue     |

### History Functions — Field Change (resolve to Q objects with IssueActivity subqueries)

| Function                    | Args                       | Description                                            |
| --------------------------- | -------------------------- | ------------------------------------------------------ |
| `wasEver(field, value)`     | field string, value string | Field was ever set to this value                       |
| `was(field, value)`         | field string, value string | Field was previously this value (changed away from it) |
| `changedFrom(field, value)` | field string, value string | Field was changed FROM this value                      |
| `changedTo(field, value)`   | field string, value string | Field was changed TO this value                        |
| `changed(field)`            | field string               | Field was modified at least once                       |

### History Functions — Actor-Based (resolve to Q objects with IssueActivity subqueries)

| Function                        | Args                           | Description                             |
| ------------------------------- | ------------------------------ | --------------------------------------- |
| `updatedBy(userId)`             | UUID string or `currentUser()` | Issue was updated by this user          |
| `commentedBy(userId)`           | UUID string or `currentUser()` | Issue has a comment from this user      |
| `fieldChangedBy(field, userId)` | field string, UUID string      | Specific field was changed by this user |
| `wasAssignedTo(userId)`         | UUID string or `currentUser()` | Issue was ever assigned to this user    |

### History Functions — Time-Scoped (resolve to Q objects with IssueActivity subqueries)

| Function                               | Args                         | Description                             |
| -------------------------------------- | ---------------------------- | --------------------------------------- |
| `changedAfter(date)`                   | date string or date function | Any field changed after this date       |
| `changedBefore(date)`                  | date string or date function | Any field changed before this date      |
| `fieldChangedAfter(field, date)`       | field string, date           | Specific field changed after this date  |
| `fieldChangedBefore(field, date)`      | field string, date           | Specific field changed before this date |
| `changedToAfter(field, value, date)`   | field, value, date           | Field set to value after date           |
| `changedToBefore(field, value, date)`  | field, value, date           | Field set to value before date          |
| `fieldChangedBetween(field, from, to)` | field, date, date            | Field changed within date range         |

---

## Example PQL Queries

```sql
-- All high priority issues assigned to me that are overdue
priority = "high" AND assignee = currentUser() AND isOverdue()

-- All unassigned issues in the active cycle
cycle IN activeCycle() AND hasNoAssignee()

-- Issues created this month in open states
createdAt >= startOfMonth() AND stateGroup IN openStates()

-- Urgent bugs not in any module
priority = "urgent" AND type = "bug-type-uuid" AND module IS EMPTY

-- Issues blocking a specific issue that are still in progress
blocks("issue-uuid") AND stateGroup = "started"

-- All top-level issues updated in the last week
isTopLevel() AND updatedAt >= daysAgo(7)

-- Search for login-related issues in high priority
name ~ "login" AND priority IN ("high", "urgent")

-- Issues due within the next 2 weeks that have no assignee
targetDate <= daysFromNow(14) AND targetDate >= today() AND hasNoAssignee()

-- Epics with children in the active states
isEpic() AND stateGroup IN activeStates()

-- Everything in completed cycles that is still not done
cycle IN completedCycles() AND stateGroup NOT IN closedStates()

-- Issues that were ever marked urgent but are now lower priority
wasEver("priority", "urgent") AND priority NOT IN ("urgent", "high")

-- Issues where state changed in the last 7 days
fieldChangedAfter("state", daysAgo(7))

-- Issues I was previously assigned to but no longer am
wasAssignedTo(currentUser()) AND assignee != currentUser()

-- Stale issues: active but no updates in 30 days
NOT changedAfter(daysAgo(30)) AND stateGroup IN activeStates()

-- Issues that were moved to "Done" this month
changedToAfter("state", "Done", startOfMonth())

-- Issues that had their priority changed by someone else
changed("priority") AND NOT fieldChangedBy("priority", currentUser())

-- Issues commented on by me that are still open
commentedBy(currentUser()) AND stateGroup IN openStates()

-- Issues where state changed between two dates
fieldChangedBetween("state", "2025-01-01", "2025-06-30") AND priority = "high"

-- Issues that were in a cycle but got removed (was ever in cycles)
wasEver("cycle", "cycle-name") AND cycle IS EMPTY

-- Issues updated by current user in the last week
updatedBy(currentUser()) AND changedAfter(daysAgo(7))
```
