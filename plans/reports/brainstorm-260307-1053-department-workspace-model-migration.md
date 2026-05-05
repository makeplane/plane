# Brainstorm: Department-Workspace Model Migration

**Date**: 2026-03-07
**Type**: Architecture Migration Analysis
**Context**: Migrate from single-workspace model to department-per-workspace model
**Previous Plan**: `plans/260217-1300-department-staff-management/plan.md` (completed)

---

## Problem Statement

Current model uses **1 workspace** ("Shinhan Bank VN") with **N departments** inside, each department linking to a **Project** for access control. User wants to change to **each department = its own workspace**, with org chart hierarchy managed at **instance level (god-mode)**.

### Key Changes Required

1. Department model: workspace-scoped -> instance-level, `linked_project` -> `linked_workspace`
2. StaffProfile model: workspace-scoped -> instance-level
3. Department & Staff management UI: Workspace Settings -> God-mode admin
4. Org chart: add user-facing page in workspace (read-only, scoped by permission)
5. Manager auto-join: managers auto-join all descendant workspaces
6. Staff join workspace: both god-mode assignment AND workspace admin invite

---

## Current vs New Architecture

### Current (Single Workspace)

```
Instance
  |
  Workspace "Shinhan Bank VN"
    |-- Department tree (metadata)
    |     |-- RBG (L1) -> linked_project: null
    |     |   |-- RBG-CR (L2) -> linked_project: null
    |     |       |-- RBG-CR-AP (L3) -> linked_project: "[Appraisal]"
    |     |       |-- RBG-CR-CO (L3) -> linked_project: "[Collection]"
    |     |-- ITG (L1) -> linked_project: null
    |         |-- ITG-DEV (L2) -> linked_project: null
    |             |-- ITG-DEV-BE (L3) -> linked_project: "[Backend]"
    |
    |-- Projects (SECRET, access via ProjectMember)
         |-- [Appraisal] Internal
         |-- [Collection] Internal
         |-- [Backend] Internal
```

### New (Department = Workspace)

```
Instance (God-mode manages dept tree + staff)
  |
  Department tree (instance-level metadata, managed in god-mode)
  |-- RBG (L1) -> linked_workspace: "RBG" (optional)
  |   |-- RBG-CR (L2) -> linked_workspace: "Credit Division" (optional)
  |       |-- RBG-CR-AP (L3) -> linked_workspace: "Appraisal Dept"
  |       |-- RBG-CR-CO (L3) -> linked_workspace: "Collection Dept"
  |-- ITG (L1) -> linked_workspace: "IT Group" (optional)
      |-- ITG-DEV (L2) -> linked_workspace: "Software Dev"
          |-- ITG-DEV-BE (L3) -> linked_workspace: "Backend Team"
  |
  Workspaces (each department can have its own)
  |-- "Appraisal Dept" workspace -> projects inside
  |-- "Collection Dept" workspace -> projects inside
  |-- "Backend Team" workspace -> projects inside
  |-- "IT Group" workspace (optional, for group-level work)
```

---

## Confirmed Decisions

| #   | Decision                           | Answer                                                                       |
| --- | ---------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Department-to-workspace mapping    | Flexible: admin chooses which departments get workspaces                     |
| 2   | Manager access to child workspaces | Auto-join all child workspaces as WorkspaceMember                            |
| 3   | StaffProfile scope                 | Instance-level (god-mode), no workspace FK                                   |
| 4   | Department model FK change         | Remove `workspace` FK, remove `linked_project` FK, add `linked_workspace` FK |
| 5   | Staff -> Workspace join            | Both: god-mode can assign (auto-join), workspace admin can also invite       |
| 6   | Org chart for regular users        | Dedicated page in workspace, scoped to user's visibility                     |

---

## Data Model Changes

### Department Model (BEFORE -> AFTER)

```python
# BEFORE
class Department(BaseModel):
    workspace = FK("Workspace")       # REMOVE
    linked_project = FK("Project")    # REMOVE
    # ...keep: name, code, short_name, dept_code, description
    # ...keep: parent, level, manager, sort_order, is_active

# AFTER
class Department(BaseModel):
    # NO workspace FK - instance-level
    linked_workspace = OneToOneField("Workspace", null=True, blank=True)  # NEW
    # ...keep everything else
    # Unique constraints: remove workspace scope, make instance-global
```

### StaffProfile Model (BEFORE -> AFTER)

```python
# BEFORE
class StaffProfile(BaseModel):
    workspace = FK("Workspace")       # REMOVE
    user = FK(User)
    department = FK(Department)
    # ...rest stays

# AFTER
class StaffProfile(BaseModel):
    # NO workspace FK - instance-level
    user = FK(User)
    department = FK(Department)
    # ...rest stays
    # Unique constraints: remove workspace scope
```

### Constraint Changes

```
BEFORE: UniqueConstraint(["workspace", "code"]) -> AFTER: UniqueConstraint(["code"])
BEFORE: UniqueConstraint(["workspace", "short_name"]) -> AFTER: UniqueConstraint(["short_name"])
BEFORE: UniqueConstraint(["workspace", "dept_code"]) -> AFTER: UniqueConstraint(["dept_code"])
BEFORE: UniqueConstraint(["workspace", "staff_id"]) -> AFTER: UniqueConstraint(["staff_id"])
BEFORE: UniqueConstraint(["workspace", "user"]) -> AFTER: UniqueConstraint(["user"])
```

---

## API Changes

### Department API (god-mode, instance-level)

```
BEFORE: /api/v1/workspaces/<slug>/departments/
AFTER:  /api/v1/departments/                     (instance admin only)

BEFORE: /api/v1/workspaces/<slug>/departments/tree/
AFTER:  /api/v1/departments/tree/

BEFORE: /api/v1/workspaces/<slug>/departments/<id>/link-project/
AFTER:  /api/v1/departments/<id>/link-workspace/   (NEW endpoint)
```

### Staff API (god-mode, instance-level)

```
BEFORE: /api/v1/workspaces/<slug>/staff/
AFTER:  /api/v1/staff/                            (instance admin only)

BEFORE: /api/v1/workspaces/<slug>/staff/<id>/transfer/
AFTER:  /api/v1/staff/<id>/transfer/
```

### New: Org Chart API (workspace-scoped, read-only)

```
GET /api/v1/workspaces/<slug>/org-chart/          (workspace member, scoped view)
GET /api/v1/workspaces/<slug>/org-chart/my-chain/  (user's dept + upward chain)
```

### Permission Changes

| Endpoint        | Before                    | After                        |
| --------------- | ------------------------- | ---------------------------- |
| Department CRUD | Workspace Admin (role=20) | Instance Admin (god-mode)    |
| Staff CRUD      | Workspace Admin (role=20) | Instance Admin (god-mode)    |
| Org chart view  | N/A                       | Workspace Member (read-only) |

---

## Auto-membership Logic Changes

### Staff Assignment (god-mode)

```
BEFORE: staff -> department -> linked_project -> auto ProjectMember
AFTER:  staff -> department -> linked_workspace -> auto WorkspaceMember
```

### Manager Auto-join

```
BEFORE: manager -> auto-join all descendant linked_projects
AFTER:  manager -> auto-join all descendant linked_workspaces
```

### Staff Transfer

```
BEFORE: remove old ProjectMember, add new ProjectMember
AFTER:  remove old WorkspaceMember, add new WorkspaceMember
```

### Staff Deactivation

```
BEFORE: remove ProjectMember + deactivate WorkspaceMember + deactivate User
AFTER:  remove all WorkspaceMember(s) + deactivate User
```

---

## Frontend Changes

### 1. REMOVE from Workspace Settings

| File                                                                              | Action                                                     |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `packages/types/src/settings.ts`                                                  | Remove "departments", "staff" from TWorkspaceSettingsTabs  |
| `packages/constants/src/settings/workspace.ts`                                    | Remove departments/staff from WORKSPACE_SETTINGS + GROUPED |
| `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx`               | Remove departments/staff icons                             |
| `apps/web/app/routes/core.ts`                                                     | Remove departments/staff routes                            |
| `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/` | Remove/archive entire directory                            |
| `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/`       | Remove/archive entire directory                            |

### 2. ADD to God-mode Admin

| File                                                       | Action                                   |
| ---------------------------------------------------------- | ---------------------------------------- |
| `apps/admin/hooks/use-sidebar-menu/core.ts`                | Add departments + staff menu items       |
| `apps/admin/hooks/use-sidebar-menu/index.ts`               | Include new menu items                   |
| `apps/admin/app/(all)/(dashboard)/departments/page.tsx`    | New page (adapt from workspace settings) |
| `apps/admin/app/(all)/(dashboard)/departments/components/` | Move & adapt components                  |
| `apps/admin/app/(all)/(dashboard)/staff/page.tsx`          | New page (adapt from workspace settings) |
| `apps/admin/app/(all)/(dashboard)/staff/components/`       | Move & adapt components                  |
| `apps/admin/services/department.service.ts`                | New service (instance-level API paths)   |
| `apps/admin/services/staff.service.ts`                     | New service (instance-level API paths)   |

### 3. Department Form Changes

- Remove: project link selector
- Add: workspace link selector (dropdown of all workspaces)
- Add: "Create workspace" option from department form

### 4. ADD Org Chart Page in Workspace

| File                                                       | Action                       |
| ---------------------------------------------------------- | ---------------------------- |
| `apps/web/app/(all)/[workspaceSlug]/org-chart/page.tsx`    | New page                     |
| `apps/web/app/(all)/[workspaceSlug]/org-chart/components/` | Org chart tree visualization |
| `apps/web/ce/services/org-chart.service.ts`                | New service (read-only)      |
| `apps/web/app/routes/core.ts`                              | Add org-chart route          |
| Workspace sidebar                                          | Add org chart nav item       |

---

## Implementation Impact Analysis

### High Impact (core model changes)

- Department model migration (remove workspace FK, add linked_workspace FK)
- StaffProfile model migration (remove workspace FK)
- All API endpoints change paths & permission model
- Auto-membership logic rewrites (project -> workspace)

### Medium Impact (UI migration)

- Move ~16 UI components from workspace settings to god-mode
- Adapt services to new API paths
- Update sidebar menus in both apps
- Department form: project selector -> workspace selector

### Low Impact (additions)

- Org chart page (new, no existing code to change)
- New routes & sidebar items

### Risk Assessment

| Risk                                                              | Impact | Mitigation                                                                            |
| ----------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| DB migration complexity (remove FKs, change constraints)          | High   | Careful migration script, test on staging first                                       |
| Existing data loss (department/staff records reference workspace) | High   | Write data migration to preserve records, set linked_workspace based on old workspace |
| God-mode API authentication differs from workspace API            | Medium | Study existing god-mode API auth pattern, follow same approach                        |
| Components depend on workspace context (useParams)                | Medium | Audit all moved components, remove workspaceSlug dependencies                         |
| Org chart permission scoping (who sees what)                      | Medium | Start simple: user sees own chain + subordinates if manager                           |

---

## Recommended Implementation Phases

### Phase 1: DB Model Migration

- Modify Department model (remove workspace FK, linked_project FK, add linked_workspace FK)
- Modify StaffProfile model (remove workspace FK)
- Data migration script
- Update unique constraints

### Phase 2: Backend API Migration

- Move department endpoints to instance-level
- Move staff endpoints to instance-level
- Update permissions to instance admin
- Update auto-membership logic (project -> workspace)
- Add link-workspace endpoint (replace link-project)

### Phase 3: God-mode Frontend

- Add sidebar menu items
- Move & adapt department management pages
- Move & adapt staff management pages
- Create admin services with new API paths
- Department form: workspace selector instead of project selector

### Phase 4: Remove from Workspace Settings

- Remove pages, routes, sidebar items
- Clean up constants/types
- Remove old services from web app

### Phase 5: Org Chart (Workspace-facing)

- New org chart API (workspace-scoped, read-only)
- Org chart page with tree visualization
- Add to workspace sidebar/navigation
- Permission scoping (own chain + subordinates)

### Phase 6: Manager Auto-join & Polish

- Manager assignment -> auto-join child workspaces
- Staff assignment -> auto-join linked workspace
- Transfer/deactivation logic
- Testing & polish

---

## Resolved Questions (Session 2)

| #   | Question                                           | Answer                                                                                    |
| --- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 5   | Org chart UI style                                 | **Tree view** (expand/collapse, same as department management)                            |
| 6   | Retroactive auto-join when linking dept->workspace | **Confirm dialog**: ask admin "Add X existing staff to workspace?"                        |
| 7   | Staff "My Profile" section in workspace            | **Keep**: show department + position, data from instance-level StaffProfile               |
| 8   | `useMyStaffProfile` hook                           | **Move to global context**: no workspaceSlug needed, API path `/api/v1/me/staff-profile/` |
