# Code Review: Bulk Excel Workspace Import

**Date:** 2026-03-04
**Score: 7.5 / 10**

---

## Scope

| File                                                              | LOC | Status   |
| ----------------------------------------------------------------- | --- | -------- |
| `apps/api/plane/license/api/views/workspace_bulk_create.py`       | 123 | New      |
| `apps/api/plane/license/api/views/__init__.py`                    | 36  | Modified |
| `apps/api/plane/license/urls.py`                                  | 101 | Modified |
| `apps/admin/store/workspace.store.ts`                             | 190 | Modified |
| `apps/admin/components/workspace/workspace-bulk-import-form.tsx`  | 239 | New      |
| `apps/admin/app/(all)/(dashboard)/workspace/bulk-import/page.tsx` | 30  | New      |
| `apps/admin/app/(all)/(dashboard)/workspace/page.tsx`             | 175 | Modified |
| `apps/admin/app/routes.ts`                                        | 34  | Modified |
| `apps/admin/package.json`                                         | 66  | Modified |

**Focus:** correctness, security, adherence to existing patterns

---

## Overall Assessment

The feature is functionally sound and mirrors the existing `user_bulk_import` pattern well. The partial-success design, TOCTOU guard via `existing_slugs` set, and client-side XLS parsing are all appropriate choices. The main concerns are: a security-relevant information-leak in exception handling, a broken store pattern for the raw `.post()` call, a missing file-size guard on the client, and a slug case-normalization bug.

---

## Critical Issues

### C1 — Internal error details exposed to client (Security)

**File:** `workspace_bulk_create.py` line 112

```python
except Exception as e:
    skipped.append({..., "reason": str(e)})
```

`str(e)` on an unhandled Django/DB exception can expose stack traces, SQL snippets, or field names to the admin UI. The existing `user_bulk_import.py` has the same pattern — but it is still wrong.

**Fix:** log the full error server-side; return a sanitized string to the client.

```python
import logging
logger = logging.getLogger(__name__)
...
except Exception as e:
    logger.exception("Workspace bulk create row %s failed", row_number)
    skipped.append({..., "reason": "Unexpected error, see server logs"})
```

### C2 — Raw `.post()` call leaks service abstraction (Store integrity)

**File:** `workspace.store.ts` lines 176-179

```ts
const response = await this.instanceWorkspaceService.post("/api/instances/workspaces/bulk-create/", { workspaces });
const result = response?.data as IWorkspaceBulkCreateResponse;
```

`InstanceWorkspaceService.list()` and `.create()` already unwrap `response.data` internally and throw `error?.response?.data`. The raw `.post()` call:

- returns `AxiosResponse` not the data payload (`.data` unwrap is manual here only)
- bypasses the consistent error unwrapping — thrown errors will have a different shape than callers expect
- hardcodes the URL string instead of keeping it in the service

The comment "inlines the API call to avoid a `@plane/services` package rebuild" is not a valid reason to break the abstraction in production code. A rebuild is the correct path or at minimum add a typed method to the service.

**Fix:** Add `bulkCreate()` to `InstanceWorkspaceService`, follow the same pattern as `create()`.

---

## High Priority

### H1 — Slug case-normalization bug

**File:** `workspace_bulk_create.py` line 107

```python
existing_slugs.add(slug.lower())
```

But `existing_slugs` is seeded from the DB with:

```python
existing_slugs = set(Workspace.objects.values_list("slug", flat=True))
```

DB slugs are stored mixed-case (slugify returns lowercase, but the set is raw). The collision check on line 32 does `candidate.lower() in existing_slugs` which is correct for DB slugs. However, intra-batch additions use `slug.lower()` while `_generate_unique_slug` produces a lowercase candidate anyway. The real risk: if DB ever stores a non-lowercased slug (legacy data), the `.lower()` check would catch it but the DB set seed would not normalize it. Recommend normalising the seed:

```python
existing_slugs = set(
    s.lower() for s in Workspace.objects.values_list("slug", flat=True)
)
```

### H2 — No client-side file size limit

**File:** `workspace-bulk-import-form.tsx` lines 62-79

There is an extension check but no `file.size` guard before calling `file.arrayBuffer()`. A malicious or accidental 100 MB spreadsheet will be fully loaded into browser memory before the row-count check fires.

**Fix:**

```ts
const MAX_FILE_SIZE_MB = 5;
if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
  setParseError(`File too large. Maximum ${MAX_FILE_SIZE_MB} MB.`);
  return;
}
```

### H3 — No transaction wrapping; partial DB state on crash

**File:** `workspace_bulk_create.py`

Each `Workspace.objects.create()` + `WorkspaceMember.objects.create()` pair is not atomic. If the server crashes between the two calls, a workspace exists with no owner membership. Django's `transaction.atomic()` block should wrap the pair.

```python
from django.db import transaction
...
with transaction.atomic():
    workspace = Workspace.objects.create(...)
    WorkspaceMember.objects.create(...)
```

### H4 — `WorkspaceBulkImportPreview` and `WorkspaceBulkImportResults` not wrapped in `observer()`

**File:** `workspace-bulk-import-form.tsx` lines 167, 199

Both sub-components receive plain props (no MobX observables), so `observer()` is not strictly required here. However, project convention from `development-rules.md` and confirmed across other admin components requires `observer()` on every component in MobX-connected files. The parent `WorkspaceBulkImportForm` is `observer()`, the children are not. Wrap them for consistency:

```ts
const WorkspaceBulkImportPreview = observer(function WorkspaceBulkImportPreview(...) { ... })
```

---

## Medium Priority

### M1 — HTTP 200 for all outcomes including zero created

**File:** `workspace_bulk_create.py` line 114

A response where `total_created: 0` and `total_skipped: N` still returns `HTTP 200 OK`. A `207 Multi-Status` or `422 Unprocessable Entity` (when everything is skipped) would be more semantically correct and easier to assert in tests.

### M2 — `organization_size` not validated against allowed values

**File:** `workspace_bulk_create.py` line 78 and the Workspace model

`organization_size` is `CharField(max_length=20, blank=True, null=True)`. The backend silently accepts any string. The existing workspace creation UI likely uses a fixed dropdown. Passing arbitrary free-text silently saves it, which may break frontend rendering that expects a specific set of values.

**Fix:** validate against the known enum or truncate to `max_length=20`.

### M3 — `xlsx` package version `^0.18.5` is EOL / has known CVEs

**File:** `apps/admin/package.json` line 51

SheetJS (xlsx) `0.18.x` is the last open-source release (2023) and has several reported DoS/prototype-pollution issues in the community edition. Recommend pinning to `0.18.5` (remove `^`) to prevent accidental minor bumps and document the known limitation. Alternatively evaluate `exceljs` which is actively maintained under MIT.

### M4 — `response?.data as IWorkspaceBulkCreateResponse` unsafe cast

**File:** `workspace.store.ts` line 179

The `as` cast bypasses TypeScript type-checking. If the backend returns an error shape (e.g. Django 500 HTML), `result.created.forEach(...)` on line 181 will throw a runtime crash. Wrap with a runtime guard or handle via the catch path explicitly.

### M5 — URL route order: `workspace/bulk-import` must precede dynamic segments

**File:** `apps/admin/app/routes.ts` lines 14-16

```ts
route("workspace", ...),
route("workspace/create", ...),
route("workspace/bulk-import", ...),
```

With React Router v7, static routes take priority over dynamic ones when defined correctly — this is fine here since there are no `workspace/:id` dynamic segments. No action needed, but flag if a `workspace/:workspaceId` route is ever added (it must come after `bulk-import`).

---

## Low Priority

### L1 — `IWorkspaceBulkCreateResponse` exported from store, not a types package

**File:** `workspace.store.ts` line 14

The response interface is defined inside the store file and re-exported from there. Per codebase convention, shared API response types belong in `@plane/types`. This is a minor layering violation.

### L2 — Duplicate URL name `instance-admins`

**File:** `apps/api/plane/license/urls.py` lines 32, 38, 43

Three `path()` entries share `name="instance-admins"`. This is a pre-existing issue not introduced by this PR, but worth noting since `reverse('instance-admins')` would be ambiguous.

### L3 — `WorkspaceBulkImportForm` component file exceeds 200 LOC

**File:** `workspace-bulk-import-form.tsx` — 239 lines

Per `CLAUDE.md` modularization rule (>200 lines → split). The sub-components `WorkspaceBulkImportPreview` and `WorkspaceBulkImportResults` can be extracted to separate files.

### L4 — No "reset" after successful import

**File:** `workspace-bulk-import-form.tsx`

After a successful import the file input, `parsedRows`, and `selectedFile` state remain. User can click "Import workspaces" again and re-submit the same rows. Add a reset on full success (`total_skipped === 0`) or expose a clear button.

---

## Positive Observations

- `InstanceAdminPermission` correctly applied — endpoint is admin-only.
- Pre-fetching `existing_slugs` before the loop avoids N+1 DB queries.
- `_generate_unique_slug()` correctly handles intra-batch duplicates via the in-memory set.
- `IntegrityError` caught separately from generic `Exception` — clean TOCTOU fallback.
- Dynamic `import("xlsx")` keeps the xlsx bundle out of the initial chunk (code splitting).
- Client-side row preview table before submit is good UX.
- `MAX_WORKSPACES` constant defined in one place on both client and server.
- `observer()` on the main `WorkspaceBulkImportForm` component.
- Route added correctly to the dashboard layout segment.

---

## Recommended Actions (Priority Order)

1. **[Critical]** Log exception details server-side; return sanitized reason string to client (C1)
2. **[Critical]** Add `bulkCreate()` method to `InstanceWorkspaceService`; remove raw `.post()` from store (C2)
3. **[High]** Wrap `Workspace.create` + `WorkspaceMember.create` in `transaction.atomic()` (H3)
4. **[High]** Add `file.size` guard before `arrayBuffer()` on client (H2)
5. **[High]** Normalize `existing_slugs` seed to lowercase (H1)
6. **[High]** Wrap `WorkspaceBulkImportPreview` and `WorkspaceBulkImportResults` in `observer()` (H4)
7. **[Medium]** Validate `organization_size` against allowed enum values (M2)
8. **[Medium]** Pin `xlsx` to `0.18.5` (remove `^`), document EOL status (M3)
9. **[Medium]** Runtime-guard the `response?.data` cast (M4)
10. **[Low]** Move `IWorkspaceBulkCreateResponse` to `@plane/types` (L1)
11. **[Low]** Extract preview/results sub-components to separate files (L3)

---

## Metrics

| Metric             | Value                                                    |
| ------------------ | -------------------------------------------------------- |
| Type Coverage      | Good — interface defined, but unsafe `as` cast present   |
| Linting Issues     | None observed (ESLint max-warnings budget not increased) |
| Transaction Safety | Missing (H3)                                             |
| Test Coverage      | No new tests added                                       |

---

## Unresolved Questions

1. Is `organization_size` meant to be a free-text field or constrained to a specific set of values? The frontend UI for single-workspace creation uses a dropdown — the allowed values should be documented and validated in bulk import too.
2. Is `xlsx ^0.18.5` acceptable given its EOL status, or should this be replaced with an actively maintained library?
3. Should `WorkspaceMember` role `20` (Admin) always be assigned to the requesting admin, or should it be configurable per row?
4. Is there a rate-limit or daily quota on bulk creation that should be enforced at the API level?
