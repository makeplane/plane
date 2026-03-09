# PQL vs JQL — Feature Comparison

A detailed comparison of Plane Query Language (PQL) against Jira Query Language (JQL), covering fields, operators, functions, and language features.

---

## Query Structure

| Feature                               | JQL       | PQL              | Notes                                                |
| ------------------------------------- | --------- | ---------------- | ---------------------------------------------------- |
| Basic clause (`field operator value`) | Yes       | Yes              | Same pattern                                         |
| `AND` / `OR` / `NOT`                  | Yes       | Yes              | Same                                                 |
| Parenthesized grouping                | Yes       | Yes              | Same                                                 |
| `ORDER BY`                            | Yes       | **No**           | Sorting handled separately via query params in Plane |
| Max nesting depth                     | Unlimited | 5 (configurable) |                                                      |

---

## Fields

### Common Fields (Present in Both)

| Concept         | JQL Field           | PQL Field                         | Differences                                                                   |
| --------------- | ------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| Priority        | `priority`          | `priority`                        | Both use human-readable values (`"high"`, `"urgent"`)                         |
| Status          | `status`            | `state` / `stateGroup`            | JQL uses status name; PQL `state` requires UUID, `stateGroup` uses group name |
| Assignee        | `assignee`          | `assignee`                        | JQL accepts name/email; PQL requires UUID                                     |
| Labels          | `labels`            | `label`                           | JQL accepts name; PQL requires UUID                                           |
| Project         | `project`           | `project`                         | JQL accepts key (`"PROJ"`) or name; PQL requires UUID                         |
| Creator         | `creator`           | `createdBy`                       | JQL accepts name/email; PQL requires UUID                                     |
| Sprint / Cycle  | `sprint`            | `cycle`                           | JQL accepts sprint name; PQL requires UUID                                    |
| Summary         | `summary`           | `name`                            | Same concept, different field name                                            |
| Description     | `description`       | (via `text ~`)                    | PQL `text ~` searches name + description                                      |
| Due date        | `dueDate` / `due`   | `targetDate`                      | Same concept                                                                  |
| Start date      | (custom field)      | `startDate`                       | Not a native JQL field                                                        |
| Created         | `created`           | `createdAt`                       | Same                                                                          |
| Updated         | `updated`           | `updatedAt`                       | Same                                                                          |
| Parent          | `parent`            | (via `isSubIssue()`, `childOf()`) | JQL has a `parent` field; PQL uses functions                                  |
| Issue type      | `issuetype`         | `type`                            | JQL accepts name; PQL requires UUID                                           |
| Draft status    | —                   | `isDraft`                         | Plane-specific                                                                |
| Archived status | —                   | `isArchived`                      | Plane-specific                                                                |
| Module          | —                   | `module`                          | Plane-specific (no JQL equivalent)                                            |
| Mention         | —                   | `mention`                         | Plane-specific                                                                |
| Subscriber      | `watcher` (partial) | `subscriber`                      | Similar concept                                                               |
| Milestone       | —                   | `milestone`                       | Plane EE-specific                                                             |
| Team project    | —                   | `teamProject`                     | Plane EE-specific                                                             |

### JQL Fields Missing from PQL

| JQL Field           | Description                                         | Applicable to Plane?                                                       |
| ------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| `reporter`          | Who reported the issue (can differ from creator)    | No — Plane has no separate reporter concept                                |
| `resolution`        | Resolution status (Done, Won't Do, Duplicate, etc.) | No — Plane uses state groups instead                                       |
| `fixVersion`        | Version where the fix is included                   | No — Plane has no version/release model                                    |
| `affectedVersion`   | Version where the bug was found                     | No — Plane has no version/release model                                    |
| `component`         | Project component                                   | No — Plane has no component model                                          |
| `environment`       | Environment description                             | No — not in Plane's data model                                             |
| `issueKey`          | Issue identifier (e.g., `PROJ-123`)                 | **Yes — gap.** Plane has sequence IDs but PQL can't query them             |
| `voter` / `votes`   | Who voted / vote count                              | No — Plane has reactions, not votes                                        |
| `originalEstimate`  | Original time estimate                              | **Partial — gap.** Plane has estimate points but PQL has no estimate field |
| `remainingEstimate` | Remaining time estimate                             | No — Plane has no time tracking                                            |
| `timeSpent`         | Logged time                                         | No — Plane has no time tracking                                            |
| `resolved`          | Date issue was resolved                             | No — not tracked separately in Plane                                       |
| `lastViewed`        | When user last viewed the issue                     | No — not tracked in Plane                                                  |
| `level`             | Security level                                      | No — not in Plane                                                          |
| `category`          | Project category                                    | No — not in Plane                                                          |
| `attachments`       | Whether issue has attachments                       | **Yes — gap.** Plane has attachments but no `hasAttachments()` predicate   |
| `comment`           | Search within comments                              | **Yes — gap.** `text ~` only searches name + description, not comments     |
| `worklogComment`    | Search within worklog comments                      | No — Plane has no worklogs                                                 |
| `worklogDate`       | Date of worklog entry                               | No — Plane has no worklogs                                                 |

### PQL Fields Not in JQL

| PQL Field                                 | Description                                              |
| ----------------------------------------- | -------------------------------------------------------- |
| `stateGroup`                              | Query by state group (backlog, started, completed, etc.) |
| `module`                                  | Filter by module                                         |
| `mention`                                 | Filter by mentioned users                                |
| `milestone`                               | Filter by milestone (EE)                                 |
| `teamProject`                             | Filter by team project (EE)                              |
| `isDraft` / `isArchived`                  | Draft and archive status                                 |
| Custom properties (`customproperty_<id>`) | Dynamic custom property filtering with typed lookups     |

---

## Operators

### Present in Both

| Operator          | JQL                            | PQL                            | Notes |
| ----------------- | ------------------------------ | ------------------------------ | ----- |
| Equals            | `=`                            | `=`                            | Same  |
| Not equals        | `!=`                           | `!=`                           | Same  |
| Greater than      | `>`                            | `>`                            | Same  |
| Greater or equal  | `>=`                           | `>=`                           | Same  |
| Less than         | `<`                            | `<`                            | Same  |
| Less or equal     | `<=`                           | `<=`                           | Same  |
| In list           | `IN (...)`                     | `IN (...)`                     | Same  |
| Not in list       | `NOT IN (...)`                 | `NOT IN (...)`                 | Same  |
| Contains (text)   | `~`                            | `~` / `CONTAINS`               | Same  |
| Is null/empty     | `IS EMPTY` / `IS NULL`         | `IS NULL` / `IS EMPTY`         | Same  |
| Is not null/empty | `IS NOT EMPTY` / `IS NOT NULL` | `IS NOT NULL` / `IS NOT EMPTY` | Same  |

### JQL Operators Missing from PQL

| JQL Operator            | Description                                       | PQL Alternative                                                 |
| ----------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| `!~` (DOES NOT CONTAIN) | Negated text search                               | **None** — no way to say "name does not contain X"              |
| `WAS`                   | Field previously had a value                      | `wasEver(field, value)` function — similar but different syntax |
| `WAS NOT`               | Field previously did NOT have a value             | **None**                                                        |
| `WAS IN (...)`          | Field previously had one of several values        | **None** — `wasEver()` only accepts a single value              |
| `WAS NOT IN (...)`      | Field previously didn't have any of listed values | **None**                                                        |
| `CHANGED`               | Field value was changed (with inline qualifiers)  | `changed(field)` function — see qualifier comparison below      |

### PQL Operators Not in JQL

| PQL Operator          | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `BETWEEN ... AND ...` | Range operator (JQL uses `>=` and `<=` pairs instead) |

---

## WAS / CHANGED — Qualifier Comparison

JQL's `WAS` and `CHANGED` operators support **inline qualifiers** that can be combined in a single clause. PQL achieves similar results through **separate functions** that must be combined with `AND`.

### JQL Inline Qualifier Syntax

```sql
-- Single clause with multiple qualifiers
status CHANGED FROM "In Progress" TO "Done" BY currentUser() AFTER startOfWeek()

-- WAS with qualifiers
status WAS "In Progress" BY jsmith BEFORE "2024-01-01"

-- CHANGED with DURING (date range)
status CHANGED TO "Done" DURING ("2024-01-01", "2024-06-01")
```

### PQL Equivalent (Multiple Functions)

```sql
-- Must chain separate functions
changedFrom("state", "In Progress") AND changedTo("state", "Done")
    AND fieldChangedBy("state", currentUser()) AND fieldChangedAfter("state", startOfWeek())

-- Was with actor and time
wasEver("state", "In Progress") AND fieldChangedBy("state", "user-uuid")
    AND fieldChangedBefore("state", "2024-01-01")

-- Changed with date range
changedTo("state", "Done") AND fieldChangedBetween("state", "2024-01-01", "2024-06-01")
```

### Qualifier Coverage

| JQL Qualifier       | PQL Equivalent                         | Parity            |
| ------------------- | -------------------------------------- | ----------------- |
| `FROM value`        | `changedFrom(field, value)`            | Separate function |
| `TO value`          | `changedTo(field, value)`              | Separate function |
| `BY user`           | `fieldChangedBy(field, userId)`        | Separate function |
| `BEFORE date`       | `fieldChangedBefore(field, date)`      | Separate function |
| `AFTER date`        | `fieldChangedAfter(field, date)`       | Separate function |
| `DURING (from, to)` | `fieldChangedBetween(field, from, to)` | Separate function |

**Key difference:** JQL qualifiers scope to the **same transition event** (e.g., "the single transition where it went FROM X TO Y BY user Z"). PQL's separate functions query independently — `changedFrom("state", "X") AND changedTo("state", "Y")` could match two different transitions on the same issue, not necessarily the same one.

---

## Functions

### Date Functions

| Function                            | JQL                                         | PQL             | Notes                         |
| ----------------------------------- | ------------------------------------------- | --------------- | ----------------------------- |
| `now()`                             | Yes                                         | Yes             | Same                          |
| `startOfDay()` / `endOfDay()`       | Yes (accepts offset like `startOfDay(-1d)`) | Yes (no offset) | JQL supports relative offsets |
| `startOfWeek()` / `endOfWeek()`     | Yes (accepts offset)                        | Yes (no offset) | JQL supports relative offsets |
| `startOfMonth()` / `endOfMonth()`   | Yes (accepts offset)                        | Yes (no offset) | JQL supports relative offsets |
| `startOfYear()` / `endOfYear()`     | Yes (accepts offset)                        | Yes (no offset) | JQL supports relative offsets |
| `today()`                           | No (use `startOfDay()`)                     | Yes             | PQL addition                  |
| `daysAgo(n)` / `daysFromNow(n)`     | No (use offset syntax: `-7d`)               | Yes             | PQL uses explicit functions   |
| `weeksAgo(n)` / `weeksFromNow(n)`   | No (use offset syntax: `-2w`)               | Yes             | PQL uses explicit functions   |
| `monthsAgo(n)` / `monthsFromNow(n)` | No (use offset syntax: `-3M`)               | Yes             | PQL uses explicit functions   |

**JQL offset syntax not in PQL:**

```sql
-- JQL: relative offsets on date functions
created >= startOfDay(-7d)    -- start of day, 7 days ago
due <= endOfWeek(2w)          -- end of week, 2 weeks from now
updated >= startOfMonth(-1M)  -- start of last month
```

PQL uses separate functions instead:

```sql
-- PQL equivalent
createdAt >= daysAgo(7)
targetDate <= weeksFromNow(2)
updatedAt >= startOfMonth()   -- no offset support, can't do "last month"
```

**Gap:** PQL's `startOfMonth()`, `startOfWeek()`, etc. don't accept offsets, so "start of last month" or "end of next week" requires manual date calculation.

### User Functions

| Function                 | JQL              | PQL                    | Notes                                             |
| ------------------------ | ---------------- | ---------------------- | ------------------------------------------------- |
| `currentUser()`          | Yes              | Yes                    | Same                                              |
| `membersOf(group)`       | Yes (group name) | `membersOf(projectId)` | JQL uses user groups; PQL uses project membership |
| `workspaceMembers()`     | No               | Yes                    | PQL addition                                      |
| `componentsLeadByUser()` | Yes              | No                     | No components in Plane                            |

### Sprint / Cycle Functions

| JQL Function      | PQL Equivalent      | Notes        |
| ----------------- | ------------------- | ------------ |
| `openSprints()`   | `activeCycle()`     | Same concept |
| `closedSprints()` | `completedCycles()` | Same concept |
| `futureSprints()` | `upcomingCycles()`  | Same concept |

### Version Functions (JQL Only — No Plane Equivalent)

| JQL Function                         | Description                    |
| ------------------------------------ | ------------------------------ |
| `releasedVersions(project)`          | Released versions              |
| `unreleasedVersions(project)`        | Unreleased versions            |
| `latestReleasedVersion(project)`     | Most recently released version |
| `earliestUnreleasedVersion(project)` | Earliest unreleased version    |

### State Functions

| JQL Approach                                     | PQL Function     | Notes                            |
| ------------------------------------------------ | ---------------- | -------------------------------- |
| Manual: `status IN ("Open", "In Progress", ...)` | `openStates()`   | PQL provides convenient grouping |
| Manual: `status IN ("Done", "Closed", ...)`      | `closedStates()` | PQL provides convenient grouping |
| No equivalent                                    | `activeStates()` | PQL addition                     |

### Predicate Functions (PQL Only)

JQL has no standalone predicate functions — these are all PQL additions:

| PQL Function          | JQL Equivalent                                              |
| --------------------- | ----------------------------------------------------------- |
| `isOverdue()`         | `due < now() AND status NOT IN ("Done", "Closed")` (manual) |
| `hasNoAssignee()`     | `assignee IS EMPTY`                                         |
| `hasNoLabel()`        | `labels IS EMPTY`                                           |
| `isTopLevel()`        | `"Epic Link" IS EMPTY` (approximate)                        |
| `isSubIssue()`        | `parent IS NOT EMPTY`                                       |
| `isEpic()`            | `issuetype = "Epic"`                                        |
| `isIntake()`          | No equivalent                                               |
| `isDraft()`           | No equivalent                                               |
| `isArchived()`        | No equivalent                                               |
| `hasChildren()`       | No direct equivalent                                        |
| `hasStartAndTarget()` | No direct equivalent                                        |

### Relation Functions

| PQL Function           | JQL Equivalent                                  | Notes                             |
| ---------------------- | ----------------------------------------------- | --------------------------------- |
| `linkedTo(issueId)`    | `issue IN linkedIssues("KEY")`                  | JQL uses issue key; PQL uses UUID |
| `blockedBy(issueId)`   | `issue IN linkedIssues("KEY", "is blocked by")` | JQL supports link type parameter  |
| `blocks(issueId)`      | `issue IN linkedIssues("KEY", "blocks")`        | Same                              |
| `childOf(issueId)`     | `parent = "KEY"`                                | JQL uses field; PQL uses function |
| `parentOf(issueId)`    | No direct equivalent                            |                                   |
| `duplicateOf(issueId)` | `issue IN linkedIssues("KEY", "duplicates")`    | Same                              |

**JQL advantage:** `linkedIssues(key, linkType)` is a single generic function with a link-type parameter, while PQL has separate functions per relation type.

### History Functions

| PQL Function                           | JQL Equivalent                                        |
| -------------------------------------- | ----------------------------------------------------- |
| `wasEver(field, value)`                | `field WAS value`                                     |
| `was(field, value)`                    | `field WAS value` (combined with current value check) |
| `changedFrom(field, value)`            | `field CHANGED FROM value`                            |
| `changedTo(field, value)`              | `field CHANGED TO value`                              |
| `changed(field)`                       | `field CHANGED`                                       |
| `updatedBy(userId)`                    | `field CHANGED BY user`                               |
| `commentedBy(userId)`                  | No direct equivalent                                  |
| `fieldChangedBy(field, userId)`        | `field CHANGED BY user`                               |
| `wasAssignedTo(userId)`                | `assignee WAS user`                                   |
| `changedAfter(date)`                   | `status CHANGED AFTER date` (per-field only)          |
| `changedBefore(date)`                  | `status CHANGED BEFORE date`                          |
| `fieldChangedAfter(field, date)`       | `field CHANGED AFTER date`                            |
| `fieldChangedBefore(field, date)`      | `field CHANGED BEFORE date`                           |
| `changedToAfter(field, value, date)`   | `field CHANGED TO value AFTER date`                   |
| `changedToBefore(field, value, date)`  | `field CHANGED TO value BEFORE date`                  |
| `fieldChangedBetween(field, from, to)` | `field CHANGED DURING (from, to)`                     |

### Permission / Role Functions (JQL Only)

| JQL Function                             | Description                                   |
| ---------------------------------------- | --------------------------------------------- |
| `projectsWhereUserHasPermission("perm")` | Projects where user has a specific permission |
| `projectsWhereUserHasRole("role")`       | Projects where user has a specific role       |

### Session / Activity Functions (JQL Only)

| JQL Function      | Description                        |
| ----------------- | ---------------------------------- |
| `currentLogin()`  | Timestamp of current user's login  |
| `lastLogin()`     | Timestamp of user's previous login |
| `issueHistory()`  | Issues the user recently viewed    |
| `votedIssues()`   | Issues the user voted on           |
| `watchedIssues()` | Issues the user is watching        |

---

## Text Search

| Feature               | JQL                                                              | PQL                                       | Gap?                        |
| --------------------- | ---------------------------------------------------------------- | ----------------------------------------- | --------------------------- |
| Summary / name search | `summary ~ "text"`                                               | `name ~ "text"`                           | No                          |
| Description search    | `description ~ "text"`                                           | `text ~ "text"` (includes name)           | No                          |
| Comment search        | `comment ~ "text"`                                               | **Not supported**                         | **Yes**                     |
| Environment search    | `environment ~ "text"`                                           | N/A                                       | N/A (no environment field)  |
| Combined text search  | `text ~ "text"` (summary + description + environment + comments) | `text ~ "text"` (name + description only) | **Yes** — comments excluded |
| Negated text search   | `summary !~ "text"`                                              | **Not supported**                         | **Yes**                     |
| Single-char wildcard  | `te?t`                                                           | Not supported                             | **Yes**                     |
| Multi-char wildcard   | `test*`                                                          | Not supported                             | **Yes**                     |
| Fuzzy search          | `roam~`                                                          | Not supported                             | **Yes**                     |
| Proximity search      | `"jira atlassian"~10`                                            | Not supported                             | **Yes**                     |
| Boosting              | `jira^4 atlassian`                                               | Not supported                             | **Yes**                     |
| Phrase matching       | `"exact phrase"`                                                 | Not supported (uses `icontains`)          | **Yes**                     |

---

## Value References

| Feature           | JQL                                        | PQL                           |
| ----------------- | ------------------------------------------ | ----------------------------- |
| By name           | `assignee = "John Smith"`                  | Not supported — requires UUID |
| By email          | `assignee = "john@example.com"`            | Not supported — requires UUID |
| By key/identifier | `project = "PROJ"`, `sprint = "Sprint 42"` | Not supported — requires UUID |
| By ID             | `cf[10001] = "value"`                      | `customproperty_<uuid>`       |

**This is a significant usability gap.** JQL is human-readable by default — users type names, keys, and emails. PQL requires UUIDs for most fields, making it impractical to write queries without looking up IDs first.

---

## Sorting

| Feature           | JQL                                   | PQL               |
| ----------------- | ------------------------------------- | ----------------- |
| Single field sort | `ORDER BY created DESC`               | **Not supported** |
| Multi-field sort  | `ORDER BY priority ASC, created DESC` | **Not supported** |
| Sort direction    | `ASC` / `DESC`                        | **Not supported** |

---

## Summary of Gaps

### High Priority (Core Language Gaps)

| Gap                     | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `ORDER BY`              | No sorting in the query language                           |
| Name-based field values | UUIDs required instead of human-readable names/keys/emails |
| `!~` (does not contain) | No negated text search operator                            |
| Comment search          | `text ~` does not search comments                          |
| Issue key lookup        | No way to query by sequence identifier (e.g., `PROJ-123`)  |

### Medium Priority (Functional Gaps)

| Gap                                        | Description                                                |
| ------------------------------------------ | ---------------------------------------------------------- |
| Unified `CHANGED` operator with qualifiers | Separate functions don't guarantee same-transition scoping |
| `WAS IN` / `WAS NOT IN`                    | Multi-value history queries not supported                  |
| `WAS NOT`                                  | Negated history not directly supported                     |
| Estimate/points field                      | Plane has estimates but PQL can't query them               |
| Date function offsets                      | `startOfMonth(-1M)` not supported                          |
| Wildcard text search                       | No `?` or `*` wildcards                                    |
| `hasAttachments()` predicate               | No way to filter by attachment presence                    |

### Low Priority (Nice-to-Have)

| Gap                              | Description                                                      |
| -------------------------------- | ---------------------------------------------------------------- |
| `currentLogin()` / `lastLogin()` | Session-based date functions                                     |
| `issueHistory()`                 | Recently viewed issues                                           |
| Permission / role functions      | `projectsWhereUserHasPermission()`, `projectsWhereUserHasRole()` |
| Fuzzy / proximity search         | Advanced text search features                                    |

### Not Applicable (Jira-Specific Concepts)

These JQL features have no equivalent in Plane's data model and are not gaps:

| JQL Feature                                            | Reason                          |
| ------------------------------------------------------ | ------------------------------- |
| `fixVersion` / `affectedVersion`                       | No version/release model        |
| `component`                                            | No component model              |
| `resolution`                                           | State groups serve this purpose |
| `environment`                                          | Not in data model               |
| `reporter` (distinct from creator)                     | Single creator field            |
| `voter` / `votes`                                      | Reactions, not votes            |
| `timeSpent` / `originalEstimate` / `remainingEstimate` | No time tracking                |
| `worklogComment` / `worklogDate`                       | No worklogs                     |
| `level` (security level)                               | Not in data model               |
| Version functions (`releasedVersions()`, etc.)         | No version model                |

### PQL Advantages Over JQL

| PQL Feature                                                 | JQL Equivalent                 |
| ----------------------------------------------------------- | ------------------------------ |
| `stateGroup` with group functions (`openStates()`, etc.)    | Manual status listing          |
| Predicate functions (`isOverdue()`, `hasChildren()`, etc.)  | Manual compound clauses        |
| `module`, `milestone`, `mention` fields                     | Not available or custom fields |
| Rich filter JSON output (composable, storable)              | Flat string only               |
| `BETWEEN ... AND` operator                                  | Must use `>=` and `<=` pair    |
| `workspaceMembers()` function                               | No equivalent                  |
| Deep history functions (`commentedBy()`, `wasAssignedTo()`) | Partial via `WAS`/`CHANGED`    |
| Custom property support with typed lookups                  | Custom fields (similar)        |
