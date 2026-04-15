# Researcher 02: Project Model & UPSERT Architecture

**Date:** 2026-03-13 | **Status:** Complete

## Project Model Fields (Updatable via Bulk Import)

**File:** `apps/api/plane/db/models/project.py`

| Field         | Type           | Notes                                   |
| ------------- | -------------- | --------------------------------------- |
| `id`          | UUID           | PK — identifier for upsert lookup       |
| `name`        | CharField(255) | Unique per workspace (when not deleted) |
| `identifier`  | CharField(12)  | Auto-generated, unique per workspace    |
| `description` | TextField      | Optional                                |
| `network`     | IntegerField   | 0=Private, 2=Public                     |
| `workspace`   | FK(Workspace)  | Cannot change via import                |

## UPSERT Design

### Lookup Strategy

- Use `project_id` (UUID) + `workspace_slug` for safe lookup
- Must verify project belongs to the specified workspace (security check)
- Only update `name`, `description`, `network` — not `workspace`, `identifier`

### Name Uniqueness on Update

- When updating name: check no OTHER project in workspace has same name
- `Project.objects.filter(name=new_name, workspace=workspace).exclude(id=project_id).exists()`

### Response Extension

Current: `{ created, skipped, total_created, total_skipped }`
New: `{ created, updated, skipped, total_created, total_updated, total_skipped }`

### Excel Template Columns (Updated)

| Column           | Required | Notes                                               |
| ---------------- | -------- | --------------------------------------------------- |
| `project_id`     | No       | UUID of existing project; if provided → update mode |
| `workspace_slug` | Yes      | Target workspace                                    |
| `name`           | Yes      | Project name                                        |
| `description`    | No       | Optional description                                |
| `network`        | No       | 0=Private / 2=Public, default 2                     |

## Service/Store/Type Changes

### `IWorkspaceProjectBulkImportResponse` (packages/services)

Add:

```typescript
updated: Array<{ workspace_slug: string; name: string; identifier: string; project_id: string }>;
total_updated: number;
```

### `bulkImportProjects()` payload item

```typescript
{ project_id?: string; workspace_slug: string; name: string; description?: string; network?: number }
```

## Frontend Component Updates

### `workspace-project-bulk-import-form.tsx`

- Template download: add `project_id` column (first column)
- No logic change — same submit flow

### `workspace-project-bulk-import-preview.tsx`

- Add `project_id` column to preview table (show truncated UUID)

### `workspace-project-bulk-import-results.tsx`

- Add "Updated" section alongside "Created" section

### `IProjectRow` type (preview component)

```typescript
interface IProjectRow {
  project_id?: string; // NEW optional field
  workspace_slug: string;
  name: string;
  description?: string;
  network?: number;
}
```
