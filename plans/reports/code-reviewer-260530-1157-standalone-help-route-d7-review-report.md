# Code Review — Standalone `/help` Route Migration (D7)

**Date:** 2026-05-30 · **Reviewer:** code-reviewer · **Branch:** duonglx/feat/help-center
**Scope:** UNCOMMITTED changes migrating Help Center reader from `(all)/[workspaceSlug]/(projects)/help/*` to standalone top-level `/help`.

## Verdict

**APPROVE.** Migration is clean, follows the established `settings/profile` standalone pattern exactly, and correctly implements the locked D7 design (auth-gated, workspace-agnostic, NOT public). No critical/high issues found. One out-of-scope `package.json` change should be unbundled; remaining notes are Low.

## Files reviewed (15 code files)
- Routes: `apps/web/app/routes/extended.ts`; deleted `(all)/[workspaceSlug]/(projects)/help/{article,layout,page}.tsx`
- New shell: `apps/web/app/(all)/help/{layout,page,article}.tsx`
- Components: `help-center-header.tsx`, `help-content-renderer.tsx`, `help-article-view.tsx`, `help-article-footer.tsx`, `article-list.tsx`, `help-center-home.tsx`, `help-center-states.tsx`
- Discovery: `core/components/workspace/sidebar/help-section/root.tsx`, `core/components/power-k/config/help-commands.ts`
- Constants/i18n: `packages/constants/src/workspace.ts`, `packages/i18n/src/locales/{en,vi,ko}/translations.ts`

---

## Critical
None.

## High
None.

## Medium
None.

## Low

### L1 — Unrelated `package.json`/`pnpm-lock.yaml` change bundled in this diff
`apps/web/package.json` reorders `xlsx` and ADDS `@tailwindcss/postcss@4.1.17` + `tailwindcss@4.1.17` devDeps. This is unrelated to the D7 routing migration. Bundling it muddies the commit and risks an unreviewed dep change riding along.
**Fix:** Unstage `apps/web/package.json` + `pnpm-lock.yaml` from this commit; land them separately (or drop if accidental). Confirm the tailwind devDep bump is intentional before it ships.

### L2 — `HelpContentRenderer` resolves "first workspace" via `Object.values(workspaces)[0]` (non-deterministic order)
`help-content-renderer.tsx:23` — `Object.values(workspaces ?? {})[0]`. Object key order is insertion order in practice, so the "first" workspace can differ run-to-run if the workspaces map is rebuilt in a different order. This only feeds the editor's image asset-URL handler (no functional impact today: no images exist yet per validation, and text renders regardless). Acceptable for now given P6 moves help images to a global static path.
**Fix (optional, when P6 lands):** drop the workspace dependency entirely once asset URLs are global, or pin to `getWorkspaceRedirectionUrl()`'s resolved workspace for consistency. No action needed now.

---

## Focus-area findings (all PASS)

**1. Routing correctness — PASS.** `extended.ts:61-64` registers `layout("./(all)/help/layout.tsx", [...])` as a sibling of `[workspaceSlug]/layout.tsx` under `(all)/layout.tsx`. No collision between static `/help` and dynamic `/:workspaceSlug`: React Router ranks static segments above dynamic ones, and the generated `.react-router/types/+routes.ts` enumerates both `/help` and `/:workspaceSlug` as distinct top-level paths — proving the route generator accepts them. `mergeRoutes` (helper.ts) keys by `file`; the new help layout file is extended-only, appended after core children at the `(all)/layout.tsx` level — no merge hazard. `RESTRICTED_URLS += "help"` (workspace.ts:78) is sufficient: consumed by all 3 create-workspace paths (`create-workspace-form.tsx:73`, `onboarding/create-workspace.tsx:67`, `onboarding/steps/workspace/create.tsx:76`) to block a workspace slug named `help` from shadowing the route.

**2. Discovery edits — no regression.** `help-section/root.tsx`: `workspaceSlug` is STILL used by `handleStartProductTour` (lines 38-39), so `useParams` import correctly retained; help item now `router.push("/help")` unconditionally — correct for global visibility. `help-commands.ts`: `useParams` import removed, no other `workspaceSlug` usage remained in that file; `isEnabled/isVisible` → `true`, action → `/help` — correct.

**3. `HelpContentRenderer` zero-workspace edge — no crash.** With zero workspaces, `workspaceId`/`workspaceSlug` are `""`. `editable={false}` makes upload/duplicate no-ops (`editor.tsx:82-83`). CE `useEditorFlagging` ignores props entirely (returns static config). `getEditorFileHandlers` callbacks (`use-editor-config.ts:73-86`) are lazy — invoked only when an embedded asset exists, and `getAssetSrc` returns `""` for empty path. Empty slug → at worst a malformed image URL (broken image), never a throw; text rendering unaffected. Note: an onboarded user practically always has ≥1 workspace; non-onboarded users are redirected to `/onboarding` before reaching the renderer (see #6), so true zero-workspace is unreachable in normal flow.

**4. `getWorkspaceRedirectionUrl()` on standalone /help — populated + safe.** `fetchWorkspaces()` is called inside `fetchCurrentUser()` (`user/index.ts:123`), which the help layout's own `AuthenticationWrapper` triggers via SWR (`authentication-wrapper.tsx:45`). The `AUTHENTICATED` branch renders children only after `currentUser.id` is set, and `fetchCurrentUser` awaits workspaces + userSettings together (lines 120-124) before setting `data` — so by the time `HelpCenterHeader` renders, both are populated; no transient `/create-workspace` flash. Store-level `getWorkspaceRedirectionUrl` (`workspace/index.ts:129-143`) gracefully falls back to `/create-workspace` if no valid last/fallback workspace. No crash.

**5. No leftover workspace coupling.** Grep confirms zero `/${workspaceSlug}/help` links and zero `useParams().workspaceSlug` in help-center components. The only `workspaceSlug` references are the intentional local var in `help-content-renderer.tsx`. All `/help/a/${...}` links use article slugs (standalone, correct). No stale references to the deleted route files anywhere in `apps/web`.

**6. Auth posture — PASS (not public).** Help layout uses `<AuthenticationWrapper>` with no `pageType` → defaults to `EPageTypes.AUTHENTICATED` (`authentication-wrapper.tsx:38`). Unauthenticated → redirect to `/?next_path=/help` (line 138); non-onboarded → `/onboarding` (line 134); authenticated+onboarded → renders. Matches D7 (all authenticated users, NOT public). Backend read API untouched (stays `IsAuthenticated`). No data-exposure regression.

**7. i18n — complete.** `help_center.back_to_app` added to all 3 locales with real localizations (vi: "Quay lại ứng dụng", ko: "앱으로 돌아가기" — not English placeholders). No other new hardcoded strings; `HelpCenterHeader` uses `t()` for both `back_to_app` and `breadcrumb_home`. Minor: `<nav aria-label="breadcrumb">` (header.tsx) is a hardcoded a11y attribute — acceptable (machine-readable landmark role value, not user-facing copy; consistent with codebase norms).

---

## Positive observations
- Standalone shell mirrors `settings/profile/layout.tsx` byte-for-byte in structure (ProjectsAppPowerKProvider + AuthenticationWrapper + content) — uses the validated pattern, no new wrapper invented.
- Code comments explain the *why* (workspace-agnostic rationale, asset-handler-only workspace use) without referencing plan artifacts — complies with `review-audit-self-decision.md` §5.
- `RESTRICTED_URLS` reservation is the correct defense against slug-shadowing; not overlooked.
- Removed dead `workspaceSlug` props/params thoroughly across the component tree (props, types, imports all cleaned).

---

## Behavioral checklist
- [x] Concurrency / async ordering: header back-link timing verified safe (workspaces awaited before children render)
- [x] Error boundaries: editor file handlers are no-ops/lazy under `editable=false`; no unhandled throw on empty slug
- [x] API contracts: `getWorkspaceRedirectionUrl` nullable-safe; RichTextEditor accepts empty workspaceId/slug
- [x] Backwards compat: old `/:workspaceSlug/help` removed by design (D7); no external callers of deleted files
- [x] Input validation: N/A (no new external inputs; articleSlug from route param passed through unchanged)
- [x] Auth/authz: `/help` stays behind AUTHENTICATED gate; not public
- [x] N+1 / queries: no new DB/query loops introduced
- [x] Data leaks: no PII/secret exposure; auth posture unchanged
- [x] Fact-checked: route registration, RESTRICTED_URLS consumers, fetchWorkspaces trigger, auth default all grep/read-verified

## Plan TODO status (informational)
D7 reader migration appears complete per this diff. Recommend the lead update `plans/260529-1428-help-center-in-app/plan.md` D7 block status. (Not editing plan files per role.)

---

## Unresolved questions
1. Is the `apps/web/package.json` tailwind devDep bump (`@tailwindcss/postcss`, `tailwindcss` 4.1.17) intentional for this branch, or an accidental local install? It is unrelated to D7 and should be confirmed/unbundled before the help-center commit.
2. P6 (global asset path) will make `HelpContentRenderer`'s first-workspace lookup obsolete — confirm the plan tracks removing that workspace dependency once images are authored, so L2 doesn't linger as dead coupling.
