# Backend Models & Query Patterns Research

**Date:** 2026-03-08
**Researcher:** researcher-02
**Focus:** Activity tracking, cross-workspace queries, department hierarchy

---

## 1. Activity & Event Tracking Models

### IssueActivity Model

**File:** `apps/api/plane/db/models/issue.py` (lines 406-530)

**Key Fields:**

- `issue` → FK to Issue (on_delete=DO_NOTHING)
- `actor` → FK to User (on_delete=SET_NULL) — WHO made the change
- `created_at` / `updated_at` — Inherited from AuditModel (TimeAuditModel)
- `created_by` / `updated_by` — Inherited from AuditModel (UserAuditModel)
- `field` → CharField(max_length=255) — WHICH field changed
- `old_value` → TextField (nullable) — WHAT changed FROM
- `new_value` → TextField (nullable) — WHAT changed TO

**Conclusion:** IssueActivity tracks issue field changes with actor, timestamp, old/new values. No workspace reference directly — accessed via `issue.project.workspace`.

### WorkflowActivity Model

**File:** `apps/api/plane/db/models/workflow.py` (lines 88-100)

**Structure:** Similar to IssueActivity — field, old_value, new_value, actor tracking for workflow config changes.

---

## 2. Cross-Workspace Query Patterns

### Current Model Relationships

**No native cross-workspace hierarchy exists.** All data is scoped to single workspace:

- **Issue** → ProjectBaseModel → workspace FK
- **Project** → workspace FK
- **Cycle** → workspace FK
- **Department** → workspace FK
- **StaffProfile** → workspace FK

### Department Hierarchy (Key Finding)

**File:** `apps/api/plane/db/models/department.py` (lines 11-100)

**Structure:**

- `workspace` → FK to Workspace (required, scoped)
- `parent` → FK to self (nullable, self-referential for tree)
- `level` → SmallIntegerField (1-6 max depth validation)
- `manager` → FK to User (nullable)
- `linked_project` → FK to Project (nullable, team project link)

**Tree Traversal:** Parent-child links allow ancestor/descendant queries via recursive CTEs.
**No "linked_workspace" field** — departments are workspace-scoped, not cross-workspace.

### StaffProfile Scope

**File:** `apps/api/plane/db/models/staff.py` (lines 17-90)

**Structure:**

- `workspace` → FK to Workspace (one-per-workspace pattern)
- `user` → FK to User
- `department` → FK to Department (nullable)
- `is_department_manager` → Boolean (flag, not structure)

**Unique Constraint:** `(workspace, user)` — ensures 1 staff profile per user per workspace.

---

## 3. Base Model & Audit Trail

### AuditModel Inheritance Chain

**File:** `apps/api/plane/db/mixins.py`

**TimeAuditModel (lines 16-23):**

- `created_at` → DateTimeField(auto_now_add=True)
- `updated_at` → DateTimeField(auto_now=True)

**UserAuditModel (lines 26-45):**

- `created_by` → FK to User (SET_NULL on delete)
- `updated_by` → FK to User (SET_NULL on delete)

**SoftDeleteModel (lines 61-82):**

- `deleted_at` → DateTimeField (nullable, for soft delete)

**Result:** All BaseModel-derived entities (Issues, Projects, Departments, StaffProfiles) inherit:

```
id (UUID), created_at, updated_at, created_by, updated_by, deleted_at
```

---

## 4. Activity Feed Data Sources

### For Head Office Dashboard

**Aggregatable models with actor + timestamp:**

1. **IssueActivity** — `actor, created_at, field, old_value, new_value`
2. **IssueComment & IssueCommentReaction** — `actor, created_at`
3. **IssueReaction & IssueVote** — `actor, created_at`
4. **Issue creation** — Use Issue.created_by + Issue.created_at

**Query Pattern:**

```python
# Across multiple workspaces (if head office has workspace list)
WorkspaceIDs = [dept.workspace_id for dept in head_office_depts]
activities = IssueActivity.objects.filter(
    issue__project__workspace_id__in=WorkspaceIDs
).select_related('actor', 'issue__project__workspace').order_by('-created_at')
```

---

## 5. Key Findings

| Aspect                | Finding                                                                       |
| --------------------- | ----------------------------------------------------------------------------- |
| **Activity Tracking** | IssueActivity + Comment/Reaction models; all have actor + timestamp           |
| **Cross-Workspace**   | NO native model support; must query workspaces by ID list                     |
| **Department Tree**   | Parent-child self-ref + level validation (max 6 levels)                       |
| **Staff Scope**       | Per-workspace profiles; `is_department_manager` Boolean flag                  |
| **Audit Trail**       | All models inherit created_by, updated_by, created_at, updated_at, deleted_at |
| **Soft Delete**       | Via SoftDeletionManager; query excludes deleted_at\_\_isnull=False            |

---

## 6. Implementation Considerations

### For Head Office Analytics Backend

1. **Define which workspaces = "head office scope"** (not yet modeled)
2. **Query pattern:** Filter by `workspace_id__in=[list]` + `select_related` for performance
3. **Activity aggregation:** Use IssueActivity + Issue.created_by for unified feed
4. **Staff visibility:** Query StaffProfile scoped per workspace first, then aggregate
5. **Department scope:** Departments are workspace-scoped; head office sees descendant workspaces via parent-child tree (to be defined)

---

## 7. Unresolved Questions

- **Head Office to subsidiary workspace mapping:** No explicit "linked_workspace" field found. Must define how head office determines which workspaces to track.
- **Multi-workspace staff:** Does a user's StaffProfile exist in multiple workspaces? (Current constraint: 1 per workspace, but not enforced globally)
- **Department manager permissions:** Does `is_department_manager=True` auto-grant view access to descendant workspace data?

**Files Referenced:**

- `apps/api/plane/db/models/issue.py` — IssueActivity + Issue model
- `apps/api/plane/db/models/department.py` — Department hierarchy
- `apps/api/plane/db/models/staff.py` — StaffProfile scoping
- `apps/api/plane/db/mixins.py` — AuditModel, SoftDelete, ChangeTracker
- `apps/api/plane/db/models/workflow.py` — WorkflowActivity
