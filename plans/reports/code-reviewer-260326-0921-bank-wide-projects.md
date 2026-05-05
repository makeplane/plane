# Code Review: Bank-wide Projects Feature

**Date:** 2026-03-26
**Branch:** triho
**Reviewer:** code-reviewer agent

---

## Scope

- Files reviewed: 15 (8 backend, 7 frontend + types/i18n)
- LOC: ~350 (new) + ~50 (modified)
- Focus: Security, correctness, CE pattern, type safety, YAGNI/KISS/DRY

---

## Overall Assessment

The implementation is solid and follows established patterns well. Security is correctly layered (frontend guard + backend 403). The CE pattern is respected. Two medium-priority issues exist — archived project leakage and hardcoded strings — plus several low-priority observations.

---

## Critical Issues

None.

---

## High Priority

### H1 — Archived projects included in response (`bank_wide.py` line 57–61)

**Problem:** The query `Project.objects.filter(is_bank_wide=True)` does not exclude archived projects (`archived_at IS NOT NULL`). Soft-deleted projects are already excluded by `SoftDeleteModel`'s default manager, but archived projects are a separate concept in this codebase (see `project.py` line 115, and `base.py` line 222 where `retrieve` explicitly adds `.filter(archived_at__isnull=True)`). The BoD view will therefore show archived bank-wide projects to users.

**Fix:**

```python
projects = (
    Project.objects.filter(is_bank_wide=True, archived_at__isnull=True)
    .select_related("workspace")
    .order_by("workspace__name", "name")
)
```

---

## Medium Priority

### M1 — Hardcoded English strings in layout and page (`layout.tsx` line 8, `page.tsx` line 7)

**Problem:** Both the `AppHeader` heading and `PageHead` title use hardcoded English strings (`"Bank-wide Projects"`), bypassing the i18n system entirely. The Vietnamese and Korean translations (`bank_wide_projects.title`) are defined but never used in these files.

**Affected files:**

- `apps/web/app/(all)/[workspaceSlug]/(projects)/bank-wide-projects/layout.tsx` line 8
- `apps/web/app/(all)/[workspaceSlug]/(projects)/bank-wide-projects/page.tsx` line 7

**Fix:** Use `useTranslation` (or a server-compatible i18n call) to resolve `bank_wide_projects.title`.

---

### M2 — SWR key is an inline string literal (`root.tsx` line 23)

**Problem:** `bank-wide-projects-${currentWorkspace.slug}` is an ad-hoc inline key. The rest of the codebase uses screaming-snake-case constants (e.g., `DEPARTMENTS_TREE_${slug}`, `INSTANCE_ADMIN_STATUS`), defined with a consistent prefix. This is a minor DRY violation and makes it harder to invalidate or share the cache key across future components.

**Recommendation:** Extract to a constant following the existing pattern:

```ts
const key = currentWorkspace?.slug ? `BANK_WIDE_PROJECTS_${currentWorkspace.slug}` : null;
```

---

### M3 — `IBankWideProject` extends the full `IProject`, not a lean shape

**Problem:** `IBankWideProject extends IProject` pulls in 30+ fields that the backend never returns for this endpoint (e.g., `archive_in`, `close_in`, `members`, `estimate`, `anchor`, `is_favorite`, `timezone`, `next_work_item_sequence`, etc.). The serializer only emits 11 fields. This creates a type/runtime mismatch: TypeScript sees all `IProject` fields as required/optional, but at runtime most are `undefined`.

**Impact:** Low severity at runtime (undefined fields are ignored), but misleading for future maintainers who may depend on those fields being present.

**Recommendation:** Define `IBankWideProject` as a lean standalone interface (or `Pick<IProject, 'id' | 'name' | 'identifier' | 'logo_props' | 'cover_image' | 'cover_image_url' | 'description' | 'network' | 'is_bank_wide' | 'workspace'> & { workspace_slug: string; workspace_name: string }`) matching exactly what the serializer returns.

---

## Low Priority

### L1 — Two separate `if` guards for BoD items could be combined (`sidebar-item.tsx` lines 23–24)

**Current:**

```ts
if (item.key === "ho" && !currentWorkspace?.is_board_of_director_workspace) return null;
if (item.key === "bank-wide-projects" && !currentWorkspace?.is_board_of_director_workspace) return null;
```

**Simpler:**

```ts
const BOD_ONLY_KEYS = ["ho", "bank-wide-projects"];
if (BOD_ONLY_KEYS.includes(item.key) && !currentWorkspace?.is_board_of_director_workspace) return null;
```

This avoids repeating the `is_board_of_director_workspace` check for every new BoD-only item added in the future.

---

### L2 — Service class is missing JSDoc comments

The `BankWideProjectsService` in `bank-wide-projects.service.ts` has no JSDoc on `fetchAll`, unlike the `DepartmentService` (which documents every method). Minor inconsistency with codebase style.

---

### L3 — `workspace` field redundancy in serializer fields list

`bank_wide.py` line 38 includes `"workspace"` (returns the UUID) alongside `"workspace_slug"` and `"workspace_name"` computed fields. The frontend `IBankWideProject` and `root.tsx` never use the raw `workspace` UUID; it adds payload weight and creates the impression the frontend should use it for cross-workspace links (it should not — it uses `workspace_slug`). Consider dropping `"workspace"` from the serializer fields.

---

## Edge Cases Found by Scout

1. **Workspace switch without page reload:** When a user switches from a BoD workspace to a non-BoD workspace, the sidebar correctly returns `null` for the menu item (line 24 `sidebar-item.tsx`), but if the user has `/bank-wide-projects` bookmarked or navigated to it directly, they will hit the API which correctly returns 403. The frontend `BankWideProjectsRoot` does not handle a 403 SWR error — `data` stays `undefined` and `isLoading` stays `false` after error, leaving a blank screen instead of the empty state. SWR's `error` state should be handled.

2. **`currentWorkspace` null-safety in SWR fetcher:** The SWR key is `null` when `currentWorkspace?.slug` is falsy, which correctly prevents the fetch. However, the fetcher callback uses `currentWorkspace!.slug` (non-null assertion). If there is any race condition where the key becomes non-null before `currentWorkspace` is set, this will throw. This is a theoretical edge case given MobX reactivity, but the pattern `() => bankWideProjectsService.fetchAll(currentWorkspace!.slug)` is the same used in `department-list.tsx` line 52, so it is consistent with the codebase convention.

3. **Empty workspace_name heading:** If `workspace_name` is somehow empty or null (corrupted data), the `<h3>` heading in `root.tsx` line 59 renders empty, showing a blank section header. A fallback like `workspaceProjects[0].workspace_name || workspaceProjects[0].workspace_slug` would be defensive.

4. **Project link navigates cross-workspace:** `BankWideProjectCard` links to `/{project.workspace_slug}/projects/{project.id}/issues/`. If the user is not a member of the target workspace, they will get an authorization error on that page. This is expected behavior, not a bug, but there is no visual indication on the card that this is a cross-workspace link (the `workspace_name` badge helps, but is small).

---

## Positive Observations

- Security: The BoD guard is correctly applied at two independent layers — frontend (`sidebar-item.tsx`) hides the menu item, and backend (`bank_wide.py` lines 53–55) returns 403 for non-BoD workspaces, regardless of how the user reaches the endpoint. Defense-in-depth is correctly implemented.
- `select_related("workspace")` prevents N+1 queries on `get_workspace_slug` / `get_workspace_name` calls.
- SWR key is correctly set to `null` when `currentWorkspace?.slug` is undefined, preventing premature fetches.
- `Logo` import from `@plane/propel/emoji-icon-picker` is consistent with other CE components (e.g., `breadcrumbs/project.tsx`).
- All three locale files (en/vi/ko) have the `bank_wide_projects` keys fully populated.
- CE pattern is respected — all new files are in `apps/web/ce/` and `apps/web/app/`, with no modifications to `apps/web/core/`.
- `IBankWideProject` is defined in `packages/types/src/project/projects.ts` and exported via the barrel — correct location per types rules.
- The `BankWideProjectSerializer` is lean and does not expose sensitive workspace fields beyond slug/name.

---

## Recommended Actions

1. **[High]** Add `archived_at__isnull=True` to the `Project.objects.filter(...)` query in `bank_wide.py`.
2. **[Medium]** Use `t("bank_wide_projects.title")` for the `AppHeader` and `PageHead` in `layout.tsx` and `page.tsx`.
3. **[Medium]** Handle SWR `error` state in `root.tsx` — show an error message or empty state instead of a blank screen on 403/network failure.
4. **[Medium]** Consider defining `IBankWideProject` as a lean `Pick<>` type matching the actual serializer output, rather than extending the full `IProject`.
5. **[Low]** Unify the two BoD guard `if` statements in `sidebar-item.tsx` into a single `includes()` check.
6. **[Low]** Use a screaming-snake-case SWR key constant (`BANK_WIDE_PROJECTS_${slug}`) consistent with the `HO` component pattern.
7. **[Low]** Drop `"workspace"` (UUID) from the serializer `fields` list — `workspace_slug` and `workspace_name` are sufficient for the frontend.

---

## Metrics

- Type Coverage: IBankWideProject defined and exported correctly; minor mismatch between interface shape and serializer output (see M3)
- Linting: No issues observed in reviewed files; imports follow `import type` convention where applicable
- Test Coverage: No backend tests added for the new endpoint — consider a smoke test verifying 403 for non-BoD workspaces and 200 for BoD members

---

## Unresolved Questions

- Should the Bank-wide Projects page redirect (or show an error) when accessed directly in a non-BoD workspace, rather than showing blank? Currently the SWR error state is not handled.
- Is `network` field (project visibility: secret=0 / public=2) relevant to display in the card? It is in the serializer output but unused in the frontend card component.
