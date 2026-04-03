# Plan Review: Fix Views Column Sorting (Security Adversary)

**Reviewer:** code-reviewer (Security Adversary perspective)
**Date:** 2026-04-02
**Plan:** `plans/260402-1736-fix-views-column-sorting/`

---

## Finding 1: `ISSUE_ORDERBY_KEY` not updated — TypeScript compile failure + broken re-sort on mutation

- **Severity:** Critical
- **Location:** Phase 01, "Implementation Steps" — missing step entirely
- **Flaw:** `ISSUE_ORDERBY_KEY` at `base-issues.store.ts:146` is typed `Record<TIssueOrderByOptions, keyof TIssue>`. The `TIssueOrderByOptions` union includes `project__name`, `-project__name`, `main_task_category__name`, `-main_task_category__name`, `sub_task_category__name`, `-sub_task_category__name` (view-props.ts:59-68). These 6 keys have no entries in the Record. TypeScript will refuse to compile because `Record<TIssueOrderByOptions, ...>` requires ALL union members as keys. The plan acknowledges this in `plan.md` line 18 but has zero implementation steps or TODOs to fix it. Even if compilation somehow passes, the `orderByKey` computed (line 332) returns `undefined` for CE keys, so `getPathsForReOrdering` (line 1578-1584) early-returns `[]` — issues never re-sort after inline mutation.
- **Failure scenario:** `pnpm check:lint` / tsc fails. If somehow bypassed, user sorts by category, edits an issue's category inline, list stays stale.
- **Evidence:** Plan says: _"ISSUE_ORDERBY_KEY (core) doesn't map CE sort keys to TIssue properties, so orderByKey returns undefined — preventing re-sort on issue updates."_ Zero remediation.
- **Suggested fix:** Add step: extend `ISSUE_ORDERBY_KEY` with `project__name: "project_id"`, `main_task_category__name: "main_task_category_id"`, etc. (both asc/desc variants). Evaluate CE extension pattern if core cannot be modified.

## Finding 2: Full `RootStore` passed to utility — privilege escalation surface

- **Severity:** High
- **Location:** Phase 01, Step 1 (function signature) and Step 2 (call site)
- **Flaw:** The plan injects the entire `RootStore` (33+ stores including auth, user, workspace settings) into a sorting utility function. This is a pure data-transformation function that needs exactly 2 lookups: project name and category name. Passing the full root store creates an unnecessary trust boundary violation — the function gains access to authentication state, user PII, API tokens, and every other store.
- **Failure scenario:** A developer later adds error telemetry or debug logging to this sort path. They serialize `rootStore` or parts of it into a Sentry breadcrumb or console log, leaking user tokens, workspace member lists, or PII to external monitoring services. The broad type signature makes this trivially easy.
- **Evidence:** `import type { RootStore } from "@/plane-web/store/root.store"` — full store with auth, user, workspace, notification stores.
- **Suggested fix:** Narrow the parameter to `{ projectStore: IProjectStore; taskCategoryStore: ITaskCategoryStore }`. This follows least-privilege and makes the function's data dependencies explicit.

## Finding 3: Backend `order_queryset.py` not audited for ORM injection via crafted `order_by`

- **Severity:** High
- **Location:** Plan overview, "Affected Files" — `apps/api/plane/utils/order_queryset.py` marked "works fine"
- **Flaw:** The `order_by` value originates from user-controlled display filter preferences, persisted in the database and sent via API. The plan dismisses the backend with "works fine for FK fields" without verifying that `order_queryset.py` uses an allowlist. Django's `.order_by()` accepts arbitrary field traversals — if `order_queryset.py` passes user input directly to `.order_by()`, an attacker can craft values like `project__workspace__members__user__password` to probe data ordering, or trigger expensive JOINs for DoS.
- **Failure scenario:** Attacker sets `order_by=project__workspace__members__user__email` via the view props API. Backend dutifully orders by that traversal. While it doesn't return the email values directly, the ordering itself leaks information (e.g., binary search via pagination to determine if a user's email starts with 'a' vs 'b'). Alternatively, deeply nested traversals cause expensive multi-table JOINs — DoS via slow queries.
- **Evidence:** Plan states `apps/api/plane/utils/order_queryset.py` has role "Backend sort (works fine for FK fields)" — no security analysis, no grep for allowlist.
- **Suggested fix:** Audit `order_queryset.py` for allowlist validation. If it uses a passthrough pattern, add an explicit set of permitted `order_by` values. This is a prerequisite for safely adding new sort keys.

## Finding 4: Store data race — categories fetched async, sort runs on empty maps

- **Severity:** High
- **Location:** Phase 01, "Risk Assessment" — acknowledged but unaddressed
- **Flaw:** `taskCategoryStore.mainCategories` and `subCategories` are populated async. If the sort runs before fetch completes, all category names resolve to `""`. The plan's Risk Assessment says "verify they're loaded on views pages" but has no implementation step, no guard, and no TODO for this. The sort function has no way to signal "data not ready" — it silently returns a wrong ordering. Worse, `taskCategoryStore` sets `hasFetched = true` even on fetch failure, so a transient 500 permanently blocks category resolution.
- **Failure scenario:** Deep-link to workspace view with `order_by=main_task_category__name`. Categories haven't loaded. Sort produces arbitrary order. User sees "sorted" indicator but wrong results. Categories load later but no re-sort trigger fires (the sort function is not a MobX computed — it's called imperatively).
- **Evidence:** Risk Assessment: _"Task categories must be fetched before sorting works — verify they're loaded on views pages"_ — zero verification step in TODO list.
- **Suggested fix:** (a) Add a guard: if `taskCategoryStore.hasFetched === false`, defer sort or return unsorted with a loading indicator. (b) Don't set `hasFetched = true` on failure. (c) Ensure MobX reactivity triggers re-sort when category data arrives.

## Finding 5: Duplicate file `base-issue-store.ts` — undefined sync strategy enables silent regression

- **Severity:** High
- **Location:** Phase 01, Step 3
- **Flaw:** Two files export the same function: `base-issue.store.ts` and `base-issue-store.ts`. Plan says "Either: Update both files, OR make one re-export the other" — this is an open question, not a plan step. The core imports from `base-issue.store` (dot variant). If any other module (current or future) imports from `base-issue-store` (hyphen variant), it gets the old no-op function. Both files compile, both export the same name, grep won't catch the divergence unless you know to look.
- **Failure scenario:** Developer adds a new view component, auto-import suggests `base-issue-store` (hyphen). Sorting silently fails in that view only. No error, no test failure, no lint warning.
- **Evidence:** Both files exist with identical content. Plan acknowledges duplication but defers decision.
- **Suggested fix:** Decide NOW: grep imports, confirm `base-issue-store.ts` is dead code, delete it. If imported elsewhere, make it re-export from the canonical file.

## Finding 6: `as keyof TIssue` unsafe cast in `getSortOrderToFilterEmptyValues`

- **Severity:** Medium
- **Location:** Phase 01, Step 1 — helper function definition
- **Flaw:** `issue[key as keyof TIssue] ? 0 : 1` uses an unsafe type cast and JavaScript truthiness. The `key` parameter is a string like `"project_id"` or `"main_task_category_id"`. The cast bypasses TypeScript's type checking. The truthiness check fails for valid falsy values (`0`, `""`, `false`). While current usage is with nullable UUID fields (safe), the pattern invites misuse. More critically, if `key` is a string that doesn't exist as a TIssue property, the access returns `undefined` and the function silently treats it as "empty."
- **Failure scenario:** Developer reuses this helper for a numeric field (e.g., `sort_order` which can be `0`). Issues with `sort_order = 0` are treated as empty and pushed to bottom.
- **Evidence:** `issue[key as keyof TIssue] ? 0 : 1` — truthiness check, not null check.
- **Suggested fix:** Use `issue[key as keyof TIssue] != null ? 0 : 1` for explicit null/undefined checking.

## Finding 7: No mention of CSRF/auth — view preferences modification

- **Severity:** Medium
- **Location:** Plan overview — missing security consideration
- **Flaw:** The `order_by` preference is persisted (stored in view props). The plan does not consider whether modifying view preferences requires authentication or whether the endpoint is CSRF-protected. If a malicious page can trick the user's browser into sending a preference update (CSRF), it could set `order_by` to a value that triggers expensive backend queries or confusing UI state.
- **Failure scenario:** Attacker hosts a page with a hidden form that POSTs to the view preferences endpoint, setting `order_by` to a deeply nested FK traversal. If CSRF protection is missing or misconfigured, every subsequent view load triggers expensive database queries.
- **Evidence:** No security considerations section in the plan. The plan focuses entirely on client-side sorting logic.
- **Suggested fix:** Verify that view preference update endpoints use Django's CSRF protection (they likely do via `BaseViewSet`). Document this as verified in the plan's security section.

---

**Status:** DONE
**Summary:** 7 findings. 1 critical (ISSUE_ORDERBY_KEY not updated — will fail TypeScript compilation), 4 high (root store over-exposure, backend ORM injection unaudited, store data race, duplicate file ambiguity), 2 medium (unsafe cast, CSRF not verified). The critical finding blocks the plan from compiling. The backend `order_by` injection risk is the most concerning security gap — the plan adds new sort keys to the frontend without verifying the backend validates them against an allowlist.
