# Code Review — Phase 3 + 3.5 web-perf (Final, pre-commit)

Scope: 5 files (1 backend, 4 frontend + 1 deletion). Goal: collapse `HoFilterOptionsView` fan-out (~17 queries → ~6) + dedupe frontend fetch + single mount point + workspace-switch refetch.

## Verdict

**APPROVE with P2 nits.** Backend rewrite is semantically equivalent on the audited facets, response shape preserved, dedupe correctness verified, no leftover references to deleted service. No P0/P1 issues found.

---

## Facet-by-facet equivalence (a)

| Facet                    | Original                                                                                                                              | New                                                                                                                  | Equivalent?                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `states`                 | `Issue.objects.filter(id__in=ids).exclude(state__isnull=True).values_list("state__group", distinct).order_by` then `sorted(set(...))` | `ArrayAgg("state__group", distinct=True, filter=Q(state__isnull=False))` then `sorted(set(...))`                     | ✅                                                         |
| `raw_priorities`         | `.exclude(priority__isnull=True).values_list("priority", distinct)` then `sorted({p.lower() for p in raw if p})`                      | `ArrayAgg("priority", distinct=True, filter=Q(priority__isnull=False))` then `sorted({p.lower() for p in raw if p})` | ✅                                                         |
| `main_cats` / `sub_cats` | `.exclude(field__isnull=True).values_list(...__name, distinct).order_by` then `sorted(set(...))`                                      | `ArrayAgg(...__name, distinct=True, filter=Q(...__isnull=False))` then `sorted(set(...))`                            | ✅                                                         |
| `cycles` / `modules`     | `.filter(issue_cycle__cycle__isnull=False).values_list("issue_cycle__cycle__name", distinct).order_by`                                | `ArrayAgg("issue_cycle__cycle__name", distinct=True, filter=Q(issue_cycle__cycle__isnull=False))`                    | ✅                                                         |
| `assignees`              | IssueAssignee → distinct user_ids → User filter+order                                                                                 | Subquery on IssueAssignee.values("assignee_id") → User filter+order+distinct                                         | ✅ (soft-delete guard `deleted_at__isnull=True` preserved) |
| `leads`                  | Project filter→`exclude(project_lead__isnull=True)`→distinct lead_ids → User filter+order                                             | Subquery on Project.values("project_lead_id") with same exclude → User filter+order+distinct                         | ✅                                                         |
| `workspaces`             | Issue (ws-pool) → distinct workspace_ids → Workspace filter                                                                           | Workspace.filter(id\_\_in=Issue.filter(...).values("workspace_id"))                                                  | ✅                                                         |
| `projects`               | Same pattern for project_id                                                                                                           | Same                                                                                                                 | ✅                                                         |

**Empty-pool guard (f):** `if issue_ids:` correctly returns empty arrays. For assignees/leads/workspaces/projects when `issue_ids=[]`: subqueries `Issue.filter(id__in=[])` and `IssueAssignee.filter(issue_id__in=[])` yield empty inner sets → outer `User/Workspace/Project.filter(id__in=<empty>)` → empty list. ✅

## Priority normalization (b)

Identical: `sorted({p.lower() for p in raw_priorities if p})`. Preserves dedupe + lowercase + sort. ✅

## Null filter equivalence (c)

`.exclude(field__isnull=True)` ≡ `Q(field__isnull=False)` in `ArrayAgg(filter=...)`. PostgreSQL `FILTER (WHERE field IS NOT NULL)` behaves identically. `ArrayAgg(distinct=True, filter=...)` over empty set returns `NULL` → coalesced via `facets.get(...) or []`. ✅

## Inline subquery patterns (d)

Subqueries `Issue.objects.filter(id__in=workspaces_issue_ids_sq).values("workspace_id")` are emitted as proper SQL subselects (Django composes them lazily); no reference to outer Issue table. The repeated `Issue.objects.filter(id__in=<subquery>)` could in principle be flattened to a JOIN on the same table, but ORM will emit two distinct `WHERE id IN (SELECT id FROM issues WHERE ...)` which the planner handles fine. ✅

## Frontend dedupe (e)

```ts
if (this._filterOptionsInflight) return this._filterOptionsInflight;
...
this._filterOptionsInflight = doFetch();
return this._filterOptionsInflight;
```

- Two concurrent callers → both receive the same promise (assignment happens before await). ✅
- Cleared in `finally` → resets on both success and failure. ✅
- **P2 nit:** `_filterOptionsInflight` is cleared inside `runInAction`'s sibling line, not inside it. Since the field isn't `observable`, this is fine — but worth confirming it's intentionally non-observable (it is; private field, not in `makeObservable` map at line 155). ✅

## Mount centralization

- `page.tsx` mounts effect with `[store, workspaceSlug]` deps → fetches on mount + workspace switch. ✅
- `ho-datasheet-view.tsx` and `ho-category-view.tsx` no longer call `fetchFilterOptions` from their mount effects → no duplicate fetch on view-switch within same workspace. ✅
- Store still calls `fetchFilterOptions` internally on filter-mutation methods (lines 341/351/379/388) — unchanged, correct.

## Deleted service safety

`my-staff-profile.service.ts` deleted. Grep confirms:

- Hook `use-my-staff-profile.ts` imports `staff.service` (`@/plane-web/services/staff.service`), not the deleted file. ✅
- All `useMyStaffProfile` consumers (staff-profile-section, ho-view-tabs, department-list) use the hook, not the service directly. ✅

## Findings

### P2 (non-blocking)

1. **`workspaces_issue_ids_sq` / `projects_issue_ids_sq` are double-wrapped.** The pattern `Workspace.filter(id__in=Issue.filter(id__in=<inner_sq>).values("workspace_id"))` is two nested subselects. Could be flattened to `Workspace.filter(id__in=<inner_sq>.values("workspace_id"))` — same result, one less SELECT layer. Postgres will likely optimize anyway. Skip unless profiling shows it matters.

2. **`Issue.objects` vs `Issue.issue_objects`.** The view uses `Issue.objects` throughout (both before and after). Per `plane-backend-architecture.md` rule #1, user-facing queries should use `Issue.issue_objects`. **This is pre-existing**, not a Phase 3.5 regression — flag for backlog, not this commit.

3. **`order_by("display_name")` before `.distinct()` on Users.** Django emits `SELECT DISTINCT ... ORDER BY display_name` which is valid (display_name is in the SELECT). Behaviorally identical to original, just inlined.

4. **`ArrayAgg` ordering not guaranteed.** Original `.order_by()` on the underlying query is gone; final `sorted(set(...))` in Python preserves alphabetic output for `states/main_cats/sub_cats/cycles/modules`. Net behavior identical. No action.

### P0 / P1

None.

## Index coverage check (spot-check, not exhaustive)

- `Issue.id` — PK, indexed.
- `Issue.workspace_id`, `Issue.project_id`, `Issue.state_id`, `Issue.priority` — all indexed via existing model + standard FK indexes.
- `IssueAssignee.issue_id`, `IssueAssignee.assignee_id`, `IssueAssignee.deleted_at` — FK + soft-delete pattern; indexed.
- `Project.project_lead_id` — FK indexed.

No new query filters on non-indexed columns introduced.

## Recommended actions

1. Commit as-is. Conventional commit suggestion: `perf(ho): collapse filter-options fan-out via ArrayAgg + dedupe FE fetch`.
2. Run `cd apps/api && python run_tests.py -u` if any tests touch `HoFilterOptionsView` (search before commit).
3. After merge: monitor `/api/ho/filter-options/` p95 in observability to confirm the predicted ~17→~6 query reduction translates to real-world latency drop.

## Unresolved questions

- None blocking. Backlog item: migrate to `Issue.issue_objects` for the manager-level soft-delete guarantee (pre-existing tech debt).

---

**Status:** DONE
**Summary:** Phase 3 + 3.5 changes are semantically correct, preserve response shape, dedupe frontend promise correctly, and remove dead code safely. APPROVE for commit.
**Concerns/Blockers:** None.
