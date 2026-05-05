# Phase 01: Backend UPSERT

## Context Links

- [Plan Overview](./plan.md)
- Extends: `plans/260313-1403-bulk-import-projects/phase-01-backend-api.md`
- Research: `research/researcher-01-existing-impl.md`, `research/researcher-02-project-model.md`
- Existing backend: `apps/api/plane/license/api/views/workspace_project_bulk_import.py`

## Overview

| Field       | Value                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Priority    | P2                                                                                                                                                |
| Status      | ⬜ pending                                                                                                                                        |
| Effort      | 1.5h                                                                                                                                              |
| Description | Extend `InstanceWorkspaceProjectBulkImportEndpoint` to support UPSERT: if `project_id` provided, update the project; otherwise, create as before. |

## Key Insights

- Existing endpoint is 224 lines — after modification will be ~260 lines, fits within 300-line limit
- `project_id` is UUID — validate format before DB lookup to avoid 500 errors
- Must verify project belongs to `workspace_slug` (cross-workspace update is a security risk)
- Name uniqueness on update: exclude current project from uniqueness check
- `identifier` is immutable — do NOT update it on UPSERT
- No `ProjectIdentifier` or `State` creation needed for updates
- Response must be backward-compatible: add `updated`/`total_updated`, keep existing fields

## Requirements

- `project_id` (optional UUID string) in each request item
- If `project_id` present:
  - Validate UUID format
  - Fetch `Project` by `id=project_id` — skip if not found
  - Verify `project.workspace.slug == workspace_slug` — skip if mismatch (security)
  - Validate `name` (required, ≤255 chars)
  - Check name uniqueness excluding current project
  - Update `name`, `description`, `network` via `project.save()`
  - Append to `updated` list
- If `project_id` absent → existing create logic unchanged
- Response: `{ created, updated, skipped, total_created, total_updated, total_skipped }`

## Architecture

```
POST /api/instances/bulk-import-projects/
  body: { projects: [{ project_id?, workspace_slug, name, description?, network? }] }

For each row:
  if project_id:
    validate UUID format → skip if invalid
    Project.objects.select_related("workspace").get(id=project_id) → skip if DoesNotExist
    verify project.workspace.slug == workspace_slug → skip if mismatch
    validate name → skip if empty / >255
    check name uniqueness (exclude self) → skip if conflict
    project.name = name; project.description = description; project.network = network
    project.updated_by = request.user; project.save()
    updated.append({...})
  else:
    [existing create logic — unchanged]

Response: { created, updated, skipped, total_created, total_updated, total_skipped }
```

## Related Code Files

- **Modify:** `apps/api/plane/license/api/views/workspace_project_bulk_import.py`

## Embedded Rules

```
- BaseAPIView inheritance, InstanceAdminPermission (role ≥ 15) — already in place
- select_related("workspace") to prevent N+1 on project lookup
- Per-row try/except; collect errors in skipped[], never abort entire batch
- transaction.atomic() only needed for multi-object create — update is single model.save()
- Never expose raw exception messages to client; log with logger.exception()
- project_id must be validated as UUID before DB query (catch ValueError on UUID parse)
- Security: verify project.workspace.slug == workspace_slug before any mutation
```

## Implementation Steps

1. **Add UUID validation helper**
   - Import `uuid` stdlib at top of file
   - Add `_is_valid_uuid(val: str) -> bool` helper (try `uuid.UUID(val)`)

2. **Initialize `updated` list** alongside `created = []`

3. **Extend per-row loop** — insert UPSERT branch before existing create logic:

   ```python
   project_id_raw = str(item.get("project_id") or "").strip()
   if project_id_raw:
       # UPSERT branch
       if not _is_valid_uuid(project_id_raw):
           skipped.append({..., "reason": "Invalid project_id format"})
           continue
       try:
           project = Project.objects.select_related("workspace").get(id=project_id_raw)
       except Project.DoesNotExist:
           skipped.append({..., "reason": f"Project '{project_id_raw}' not found"})
           continue
       if project.workspace.slug != workspace_slug:
           skipped.append({..., "reason": "Project does not belong to workspace"})
           continue
       # validate workspace (reuse cache — fetch if not already cached)
       # validate name (same rules as create)
       # check name uniqueness excluding self
       if Project.objects.filter(name=name, workspace=project.workspace).exclude(id=project.id).exists():
           skipped.append({..., "reason": "Project name already exists in this workspace"})
           continue
       project.name = name
       project.description = description
       project.network = network
       project.updated_by = request.user
       project.save(update_fields=["name", "description", "network", "updated_by", "updated_at"])
       updated.append({"workspace_slug": workspace_slug, "name": name, "identifier": project.identifier, "project_id": str(project.id)})
       continue  # skip create branch
   # existing create logic follows unchanged...
   ```

4. **Update response** — add `updated` and `total_updated`:

   ```python
   return Response({
       "created": created,
       "updated": updated,
       "skipped": skipped,
       "total_created": len(created),
       "total_updated": len(updated),
       "total_skipped": len(skipped),
   }, status=status.HTTP_200_OK)
   ```

5. **Add `uuid` import** at top of file (stdlib, no new dependency)

## Post-Phase Checklist

- [ ] `_is_valid_uuid()` helper catches `ValueError` (not `Exception`)
- [ ] Security check: `project.workspace.slug == workspace_slug` present before any mutation
- [ ] `save(update_fields=[...])` used — never full `save()` which overwrites unrelated fields
- [ ] `updated = []` initialized before loop, returned in response
- [ ] `total_updated` present in response dict
- [ ] Existing create logic untouched (no regression for rows without `project_id`)
- [ ] File stays ≤300 lines after changes
- [ ] Run `pnpm check:lint` — no Python lint errors (or `cd apps/api && python -c "import plane.license.api.views.workspace_project_bulk_import"`)

## Todo List

- [ ] Add `import uuid` to file header
- [ ] Add `_is_valid_uuid()` helper function
- [ ] Initialize `updated = []` in `post()` method
- [ ] Add UPSERT branch in per-row loop
- [ ] Update response to include `updated`/`total_updated`
- [ ] Run post-phase checklist
- [ ] Mark phase complete in plan.md

## Success Criteria

- `POST /api/instances/bulk-import-projects/` with `project_id` → updates project, returns in `updated[]`
- Invalid `project_id` UUID → row in `skipped[]` with clear reason
- `project_id` from different workspace → row in `skipped[]` (security check passes)
- Rows without `project_id` → unchanged create behavior
- Response always has `created`, `updated`, `skipped`, `total_created`, `total_updated`, `total_skipped`

## Risk Assessment

- **Name conflict on update:** mitigated by excluding self from uniqueness check
- **Concurrent update race:** low risk for admin-only God Mode feature; `save(update_fields=...)` is atomic enough
- **Wrong workspace_slug + valid project_id:** security check prevents cross-workspace update

## Security Considerations

- `InstanceAdminPermission` already enforced — God Mode admins only
- **Must** verify `project.workspace.slug == workspace_slug` — prevents admin of workspace A from updating projects in workspace B
- Validate UUID format client-side too (Excel validation) but backend must be authoritative
- `update_fields` prevents accidental overwrite of audit fields (`created_by`, `created_at`)

## Next Steps

- Phase 02 (Frontend) depends on this phase: must update `IWorkspaceProjectBulkImportResponse` type and all UI components
