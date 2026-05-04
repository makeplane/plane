# Codebase Concerns

**Analysis Date:** 2026-05-03

> Findings are grouped by severity (Critical → High → Medium → Low) and then by category. Severity is a reviewer judgement based on impact + likelihood, not a formal SLA. File paths are absolute-from-repo-root and should be opened with the Read tool.

## Tech Debt

### Critical

**Stale `AGENTS.md` actively contradicts canonical guidance:**

- Files: `AGENTS.md` (24 lines) vs `CLAUDE.md` (93 lines)
- Issue: `AGENTS.md` claims "All features require unit tests, use existing test framework per package", which directly contradicts `CLAUDE.md` (and reality): "Most frontend packages currently have no test harness — do not invent one without asking." `AGENTS.md` also lists only `web:3000, admin:3001` as dev servers, omitting `space:3002` and `live`. It mentions `packages/shared-state` as the canonical store location but doesn't mention the `core` vs `ce` vs `ee` boundary at all.
- Impact: Agents that pick `AGENTS.md` first (the conventional name) will write tests where none exist, miss the CE/core/ee split, and miss the OxLint-not-ESLint rule.
- Fix approach: Either delete `AGENTS.md` or replace its body with a one-line pointer: "See `CLAUDE.md` for canonical agent guidance." Do not maintain two diverging files.

### High

**Massive ratcheting OxLint warning budget across web/propel:**

- Files / budgets:
  - `apps/web/package.json:13` — `--max-warnings=11957`
  - `packages/propel/package.json:55` — `--max-warnings=3605`
  - `apps/admin/package.json:14` — `--max-warnings=759`
  - `apps/space/package.json:13` — `--max-warnings=676`
  - `packages/editor/package.json:28` — `--max-warnings=416`
  - `apps/live/package.json:22` — `--max-warnings=119`
  - `packages/ui/package.json:22` — `--max-warnings=66`
  - `packages/utils/package.json:18` — `--max-warnings=38`
- Issue: ~17,646 lint warnings collectively suppressed by budget. Budgets ratchet downward only when developers happen to fix files they touch; there is no scheduled paydown.
- Impact: Real bugs (unused vars, exhaustive-deps, accessibility) hide in the noise; new warnings flow under the budget undetected as long as the count stays at-or-below.
- Fix approach: Add a `pnpm fix:lint` paydown sprint per top-warning rule (`apps/web` is the priority). After paydown, drop the budget by N each PR rather than accepting current numbers as the floor.

**Frontend test coverage is essentially zero:**

- Only test directories with actual specs: `apps/live/tests/`, `packages/codemods/tests/`, `apps/web/e2e/specs/timeline-dependency-drag.spec.ts`, `apps/api/plane/tests/`
- Untested packages (no test harness at all): `apps/web` (unit), `apps/admin`, `apps/space`, `packages/ui`, `packages/propel`, `packages/editor`, `packages/services`, `packages/shared-state`, `packages/utils`, `packages/hooks`, `packages/types`, `packages/i18n`, `packages/constants`, `packages/decorators`, `packages/logger`
- Issue: Most product UI is unverified by automation. The only frontend automation is the 3 timeline E2E specs added on the current branch.
- Fix approach: As `docs/timeline-e2e-test-environment.md` §4.8 notes, introduce Vitest to `packages/utils`, `packages/hooks`, and the gantt-chart `dependency/` modules first (pure JS validation logic in `cycle-check.ts`, `date-check.ts`, `build-bezier.ts`, `chart-coords.ts` is a low-friction starting point).

**Next.js → React Router migration is incomplete:**

- Files: `apps/web/app/compat/next/{link,navigation,script,image,helper}.{ts,tsx}` (Vite shim layer)
- 348 import sites still using `next/link` or `next/navigation` across `apps/web/**`
  - 213 × `useParams` from `next/navigation`
  - 56 × `Link` from `next/link`
  - 14 × `useSearchParams`, 14 × combined `useParams, usePathname`, 11 × `usePathname`, 9 × `useRouter`, etc.
- Issue: The shim works but adds an indirection cost on every navigation hook (`apps/web/app/compat/next/navigation.ts:11-37` wraps `useRouter` in `setTimeout(0)` to avoid render-phase navigation). Some shim methods are no-ops: `prefetch` is a comment-only stub (`navigation.ts:32-34`); `refresh` does a full `location.reload()`.
- Impact: New developers think they're in a Next.js codebase. The React Router v7 idioms (`useNavigate`, `useLocation`, route-defined params) are right there in the same files.
- Fix approach: Codemod-driven migration on a per-feature basis. The `packages/codemods` workspace already has the jscodeshift infra (`packages/codemods/function-declaration.ts`).

**Missing `ee/` directory blocks reviewers from running enterprise-aware codemods:**

- Files: `packages/codemods/package.json:7,8` — both scripts target `../../apps/*/ee` which does not exist in the OSS tree
- Issue: `find apps -maxdepth 3 -name ee -type d` returns nothing in this repo, but the codemods scripts blindly include the path. `jscodeshift` will silently no-op on missing globs, so this works, but it is misleading: the `@/plane-web/*` alias in `apps/web/tsconfig.json` resolves to `apps/web/ce/*` for OSS and `apps/web/ee/*` in the private fork — none of that is documented in code.
- Impact: Reviewers can't tell which CE stub is "intentionally empty because EE provides the real one" vs "actually unimplemented." The OSS-side gantt dependency drag was a real instance of the former (see `docs/timeline-dependency-implementation.md`).
- Fix approach: Add a top-of-file comment in each `apps/*/ce` stub that returns `<></>` saying "EE provides the real implementation; this CE stub is intentionally empty." For `apps/web/ce/components/gantt-chart/dependency/` the stubs were already replaced on the current branch — that pattern should be normalized.

**Broken `apps/api/run_tests.sh`:**

- File: `apps/api/run_tests.sh` (3 lines, single `exec tests/run_tests.sh "$@"` call)
- Issue: `apps/api/tests/` directory does not exist. The actual tests live in `apps/api/plane/tests/`. The wrapper script will exit with `exec: tests/run_tests.sh: No such file or directory`.
- Impact: `./run_tests.sh` fails for anyone discovering it via `ls` / tab completion. `apps/api/run_tests.py` is the working entry point.
- Fix approach: Either delete `run_tests.sh` outright, or fix it to `exec python run_tests.py "$@"`. `CLAUDE.md` already calls this out, but the broken file should not stay.

### Medium

**Heavy use of `any` in stores and services:**

- 187 files contain `: any` patterns in `apps/web/`
- Heaviest concentrations:
  - `apps/web/core/services/issue/issue.service.ts` — 6 occurrences
  - `apps/web/core/services/module.service.ts` — 5
  - `apps/web/core/components/gantt-chart/root.tsx` — 3
  - `apps/web/core/components/gantt-chart/chart/main-content.tsx` — 3
  - `apps/web/core/components/issues/issue-modal/form.tsx` — 5
  - `packages/types/src/view-props.ts:156` — `layout?: any; // TODO: Need to fix this and set it to enum EIssueLayoutTypes`
- Impact: Erodes the value of `strict: true` + `strictNullChecks: true`. Service-layer `any` is the worst because it leaks into store types and into components.
- Fix approach: Highest-leverage targets are the service layer (`apps/web/core/services/issue/issue.service.ts`, `module.service.ts`) and `packages/types/src/view-props.ts:156`. Each fix removes downstream `any` casts.

**`@ts-ignore` / `@ts-expect-error` clusters:**

- 27 occurrences in `apps/web` across 16 files; 28 in `packages` across 15 files
- Editor toolbar files have an entire `@ts-expect-error type mismatch here` pattern repeated:
  - `apps/web/core/components/pages/editor/toolbar/toolbar.tsx:46,80,97`
  - `apps/web/core/components/editor/lite-text/{toolbar.tsx:85,editor.tsx:181,206}`
  - `apps/web/core/components/editor/sticky-editor/{toolbar.tsx:47,editor.tsx:119}`
- `apps/web/core/hooks/use-collaborative-page-actions.tsx:35` — `// @ts-expect-error - TODO: fix this`
- Fix approach: All 7 editor toolbar suppressions are the same root cause ("type mismatch here") — a single fix in the underlying editor type signature would clear them.

**TODO/FIXME debt by area:**

- `apps/web` ts/tsx — 66 occurrences (sample list below)
- `apps/api/plane` python — 13 occurrences
- `packages/**` ts/tsx — 29 occurrences
- `apps/admin` + `apps/space` ts/tsx — 4 occurrences
- `apps/live` ts — 1 occurrence
- Highest-priority threads:
  - i18n debt (`apps/web/helpers/authentication.helper.tsx:111` and 8+ other `// TODO: Translate here`)
  - Type debt (`apps/web/core/components/workspace/sidebar/workspace-menu-header.tsx:44` `// TODO: fix types`, plus form.tsx, profile components, etc.)
  - Refactor debt (`apps/web/core/components/settings/profile/content/pages/activity/activity-list.tsx:60`, `apps/web/core/components/home/root.tsx:47`, `apps/web/core/components/modules/analytics-sidebar/root.tsx:54`, `apps/web/core/components/views/form.tsx:131` all `// TODO: refactor this component`)
  - Pagination/loader debt (`apps/web/core/components/base-layouts/gantt/sidebar.tsx:50` — `const isPaginating = false; // TODO: Add proper pagination state`)
- Fix approach: Group these by sprint theme rather than fixing one-off. The translation TODOs alone are >10 sites.

**Deprecated helpers still imported:**

- `apps/web/helpers/graph.helper.ts:7` — `// ------------ DEPRECATED (Use re-charts and its helpers instead) ------------`
- `apps/web/helpers/dashboard.helper.ts:15` — `// -------------------- DEPRECATED --------------------`
- `apps/api/plane/db/models/project.py:298` — `# DEPRECATED TODO: used to get the old anchors for the project deploy boards` (`ProjectDeployBoard` model still in use)
- Fix approach: Run `Grep` for imports of each deprecated module, migrate callers, then delete the helper.

### Low

**Duplicate modal-width enum across packages:**

- `packages/propel/src/dialog/root.tsx:19,20` defines `EDialogWidth.XXXL` / `XXXXL`
- `packages/ui/src/modals/constants.ts:18,19` defines `EModalWidth.XXXL` / `XXXXL`
- Issue: Two parallel enums for the same concept. Components in `apps/web/core/components/inbox/modals/create-modal/modal.tsx:40`, `apps/web/core/components/issues/issue-modal/base.tsx:419`, `apps/web/core/components/core/modals/existing-issues-list-modal.tsx`, etc., reach for `EModalWidth`.
- Fix approach: Consolidate on `@plane/propel` `EDialogWidth`, deprecate `@plane/ui` `EModalWidth` with an alias.

**Translation keys not yet wired up:**

- 11+ `// TODO: Translate here` / `// TODO: Add translation` sites in `apps/web/core/components` (`issues/select/base.tsx:299`, `issues/delete-issue-modal.tsx:122`, `issues/issue-layouts/quick-add/root.tsx:118`, `issues/issue-layouts/properties/label-dropdown.tsx:316`, `inbox/sidebar/root.tsx:164`, `inbox/modals/delete-issue-modal.tsx:77`, `inbox/modals/decline-issue-modal.tsx:50`, `workspace/confirm-workspace-member-remove.tsx:66`, `issues/attachment/delete-attachment-modal.tsx:68`, `core/modals/existing-issues-list-modal.tsx:215`, `estimates/create/stage-one.tsx:88`)
- Fix approach: i18n maintenance ticket; not blocking.

**Live server `console.error` in env validation:**

- `apps/live/src/env.ts:36` — `console.error("❌ Invalid environment variables:", ...)` instead of `logger.error` from `@plane/logger`. Only one site, but `apps/live` already imports `@plane/logger` elsewhere.
- Fix approach: Swap to `logger.error`. Trivial.

## Known Bugs

### High

**Webhook detail page swallows an unspecified error:**

- File: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/[webhookId]/page.tsx:37` — `// TODO: fix this error`
- Issue: Existing acknowledged error path. Need to read the file context to understand whether it silently swallows errors or surfaces a stale toast.
- Fix approach: Read the file, decide whether to retry, surface, or remove.

**Cycles list-item depends on backend-side bug:**

- `apps/web/core/components/cycles/list/cycles-list-item.tsx:56` — `// TODO: change this logic once backend fix the response`
- Issue: There's a known backend response shape bug being worked around in the frontend. If the backend fix lands, the frontend logic will need to be reverted.
- Fix approach: Cross-link this comment to the backend issue (file unknown today). Track in a single ticket.

### Medium

**Duplicate detection feature stub:**

- `apps/web/core/components/issues/issue-modal/form.tsx:373` — `// TODO: Remove this after the de-dupe feature is implemented`
- Issue: Hard-coded shim awaiting the de-dupe feature. The neighbouring `isDuplicateModalOpen` flag is referenced in 4 modal files (`form.tsx`, `base.tsx`, `inbox/modals/create-modal/modal.tsx`).
- Fix approach: Either complete the dedupe feature or remove the dead modal-width branch.

**Cycles cannot be soft-deleted:**

- `apps/api/plane/app/views/cycle/base.py:500` — `# TODO: Soft delete the cycle break the onetoone relationship with cycle issue`
- Issue: Soft-delete on cycles violates the `Cycle ↔ CycleIssue` 1:1 invariant.
- Impact: Cycles are hard-deleted; restore is impossible after delete.
- Fix approach: Refactor `CycleIssue` FK from OneToOne to ForeignKey with `unique_together` on `(cycle, deleted_at)` like `ProjectIdentifier` already does (`apps/api/plane/db/models/project.py:271-277`).

## Security Considerations

### Critical

**`apps/api/plane/utils/email.py` is proprietary; copy-pasting it forks the license:**

- File: `apps/api/plane/utils/email.py:1-10`
- Notice: `SPDX-License-Identifier: LicenseRef-Plane-Commercial` ... `# DO NOT remove or modify this notice. # NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.`
- Issue: A single proprietary file lives inside an otherwise AGPL-3.0 codebase. Its existence is fine (per the EULA at https://plane.so/legals/eula) but agents must not copy its body into other locations or quote it externally.
- Fix approach: Document this carve-out in `CLAUDE.md` so agents know to leave the file alone and never paste its contents.

### High

**`SECRET_KEY` fallback silently generates a fresh key per process if the env var is missing:**

- `apps/api/plane/settings/common.py:27` — `SECRET_KEY = os.environ.get("SECRET_KEY", get_random_secret_key())`
- Issue: In production-like Django deployments without `SECRET_KEY` env var, every process restart generates a new key, invalidating all sessions, password reset tokens, and CSRF tokens. The `setup.sh:64-72` flow appends a randomly generated key to `apps/api/.env` — but only on first run; if the file exists or `tr -dc 'a-z0-9'` returns empty, the fallback in `common.py:27` masks the failure silently.
- Mitigation: `setup.sh` does generate a 50-char `[a-z0-9]` key (only ~258 bits of entropy because alphabet is restricted; Django's `get_random_secret_key` uses 50 chars from a wider alphabet).
- Fix approach: In `apps/api/plane/settings/production.py`, raise on missing `SECRET_KEY` rather than calling `get_random_secret_key()`. Add a startup assertion. Tighten `setup.sh` to use `secrets.token_urlsafe(50)` via Python instead of `tr`.

**CORS defaults to allow-all when no env var is set:**

- `apps/api/plane/settings/common.py:121-129`:
  ```python
  cors_origins_raw = os.environ.get("CORS_ALLOWED_ORIGINS", "")
  ...
  if cors_allowed_origins:
      CORS_ALLOWED_ORIGINS = cors_allowed_origins
      secure_origins = False if [origin for origin in cors_allowed_origins if "http:" in origin] else True
  else:
      CORS_ALLOW_ALL_ORIGINS = True
      secure_origins = False
  ```
- Issue: With `CORS_ALLOW_CREDENTIALS = True` (line 120), `CORS_ALLOW_ALL_ORIGINS = True` is rejected by `django-cors-headers` at request time, but the misconfiguration is only caught when a request is actually made — not at boot. Also note `secure_origins = False` is fed directly into `SESSION_COOKIE_SECURE` and `CSRF_COOKIE_SECURE` (lines 314 and 327), so missing `CORS_ALLOWED_ORIGINS` ALSO disables Secure cookies.
- Impact: A self-hosted deployment that forgets to set `CORS_ALLOWED_ORIGINS` ships unsecured cookies even on HTTPS hosts.
- Fix approach: In `production.py`, fail-closed on missing `CORS_ALLOWED_ORIGINS`. Decouple `secure_origins` from CORS configuration; gate it on `request.is_secure()` or a dedicated `SECURE_COOKIES` env var.

**`ALLOWED_HOSTS = ["*"]` default:**

- `apps/api/plane/settings/common.py:36` — `ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")`
- Issue: Django's HOST header validation is bypassed by default, allowing host header injection attacks.
- Fix approach: Production override in `production.py` should require an explicit value.

**Live server still uses static-secret auth instead of HMAC:**

- `apps/live/src/lib/auth-middleware.ts:34` — `// TODO - Move to hmac`
- Issue: `live-server-secret-key` is compared via `===` (line 38) — a constant-time comparison would be safer to avoid timing attacks, but the bigger smell is that any caller with the env value forever holds an admin-grade credential. HMAC of a payload + timestamp would scope each request.
- Impact: Compromised live server secret = unbounded admin access until the env var is rotated across all deployments.
- Fix approach: Implement the HMAC migration the comment promises. Add timing-safe comparison (`crypto.timingSafeEqual`) as an interim mitigation.

### Medium

**Anonymous throttle is very loose:**

- `apps/api/plane/settings/common.py:84` — `"anon": "30/minute"`
- Issue: 30 unauthenticated requests per minute is generous for endpoints that hit DB. The `asset_id` rate (`5/minute`) is more reasonable.
- Fix approach: Add per-endpoint throttles for the auth-related views (`apps/api/plane/authentication/views/`) to slow down credential-stuffing.

**`SKIP_ENV_VAR` defaults to `"1"`:**

- `apps/api/plane/settings/common.py:309` — `SKIP_ENV_VAR = os.environ.get("SKIP_ENV_VAR", "1") == "1"`
- Issue: Defaulting to skipping env-var validation is the wrong direction for a self-hosted product. Operators should opt-out, not opt-in.
- Fix approach: Flip default to `"0"` and document the strict-mode env-var checks.

**Env files exist on disk; agents must not read them:**

- Files (existence only — never quote contents): `.env`, `apps/web/.env`, `apps/admin/.env`, `apps/space/.env`, `apps/live/.env`, `apps/api/.env`, `apps/web/e2e/.env.e2e`
- Issue: All `.env` files are gitignored (`.gitignore` lines 35-39 + appended block), but agents that traverse the repo can still read them. Any tool output that quotes their values is a leak.
- Fix approach: Already handled by agent prompt rules. Document in `CLAUDE.md` so future agents respect the boundary.

## Performance Bottlenecks

### High

**Largest source files (refactor candidates for cognitive load and bundle size):**

- `apps/web/core/store/issue/helpers/base-issues.store.ts` — **1965 lines** (single MobX store class)
- `apps/api/plane/app/views/issue/base.py` — **1354 lines** (single ViewSet)
- `apps/web/core/constants/plans.tsx` — **1311 lines** (subscription plan config)
- `apps/api/plane/app/views/cycle/base.py` — **1049 lines**
- `apps/api/plane/app/serializers/issue.py` — **1029 lines**
- `apps/api/plane/api/views/issue.py` — **2484 lines** (public API)
- `apps/api/plane/api/views/cycle.py` — **1202 lines**
- `apps/api/plane/api/views/module.py` — **1077 lines**
- `apps/api/plane/bgtasks/issue_activities_task.py` — **1604 lines**
- Issue: 1900-line MobX store on the client means every observer subscription walks a wide observable graph; 1300-2400-line views ship a lot of code that webpack/Rollup can't tree-shake at the file level. Plane-cloud bundle size for `apps/web` is impacted directly by `base-issues.store.ts` because it's imported by every Issue layout (kanban, list, calendar, gantt, spreadsheet).
- Fix approach: Split `base-issues.store.ts` along its method groups (CRUD vs filters vs subscription handlers vs derived getters); split issue ViewSets along resource boundaries (`apps/api/plane/app/views/issue/{relation,sub_issue,activity,attachment}.py` already started, base.py is the leftover).

### Medium

**Query optimization density is moderate; targeted audit needed:**

- 289 `select_related` / `prefetch_related` calls in `apps/api/plane/`
- 168 `.count()` / `.first()` / `.last()` / `.exists()` calls in `apps/api/plane/app/views/`
- Issue: Without Django Debug Toolbar coverage, can't quantify N+1 risk, but the iteration patterns in `apps/api/plane/app/views/issue/{archive.py:319,sub_issue.py:182,relation.py:233}` hit the queryset inside a `for issue in issues:` loop. These should be audited individually.
- Fix approach: Run `silk` or `django-debug-toolbar` against the local stack on a typical `IssueViewSet.list` request and capture query count/duration.

**Frontend large stores:**

- `apps/web/core/store/cycle.store.ts` — **725 lines**
- `apps/web/core/store/module.store.ts` — **641 lines**
- `apps/web/core/store/favorite.store.ts` — **445 lines** (10 `eslint-disable` inside)
- `apps/web/core/store/state.store.ts` — **391 lines**
- Issue: Wide MobX stores that are not split per concern. The `eslint-disable` density in `favorite.store.ts` is a marker of accumulated workarounds.
- Fix approach: Split by feature (e.g. `cycle-list.store.ts`, `cycle-detail.store.ts`, `cycle-progress.store.ts`).

### Low

**Compat shim adds `setTimeout(0)` to every navigation:**

- `apps/web/app/compat/next/navigation.ts:17,21,24,27`
- Issue: Each `router.push` / `router.replace` defers via `setTimeout` to avoid render-phase navigation. A direct `useNavigate` call would skip the queue.
- Impact: Sub-millisecond per navigation, but compounded across 9 sites importing `useRouter` from `next/navigation`.
- Fix approach: Migration to React Router v7 idioms eliminates this entirely.

## Fragile Areas

### Critical

**`#gantt-container` ID is a load-bearing CSS selector:**

- `apps/web/core/components/gantt-chart/chart/main-content.tsx:177-178` — `// DO NOT REMOVE THE ID  id="gantt-container"`
- `apps/web/core/components/gantt-chart/sidebar/root.tsx:57` — `// DO NOT REMOVE THE ID`
- Issue: Hard-coded DOM ID consumed by multiple unrelated callers. Used by `apps/web/ce/components/gantt-chart/dependency/use-dependency-drag.ts` (via `chart-coords.ts` `CHART_CONTENT_ID`), and by E2E specs (`apps/web/e2e/pages/timeline.page.ts` `await this.page.locator("#gantt-container").waitFor(...)`).
- Impact: Renaming or removing the ID silently breaks dependency drag mouse-coordinate translation AND the E2E suite. The "DO NOT REMOVE" comment is the only documentation.
- Fix approach: Centralize in a constant — `CHART_CONTENT_ID` already exists at `apps/web/ce/components/gantt-chart/dependency/chart-coords.ts`; both `main-content.tsx` and `sidebar/root.tsx` should import that constant rather than hard-coding the string.

**`title-input.tsx` debounced save will multi-fire if dependency array grows:**

- `apps/web/core/components/issues/title-input.tsx:83-85`:
  ```ts
  // DO NOT Add more dependencies here. It will cause multiple requests to be sent.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);
  ```
- Issue: The lint suppression is the only thing keeping a future contributor from adding `value` or `setIsSubmitting` to the deps and triggering duplicate POSTs.
- Fix approach: Refactor with `useEvent` (React 19 `experimental_useEffectEvent` or stable equivalent) so the effect depends only on `debouncedValue` while still calling latest closures.

### High

**Custom Hocuspocus extensions silently swallow errors after force-close:**

- `apps/live/src/extensions/database.ts:127-129`:
  ```ts
  // Don't throw after force close - document is already unloaded
  // Throwing would cause hocuspocus's finally block to access the null document
  return;
  ```
- Issue: Documents that fail to fetch with `content_too_large` or other critical errors silently return rather than throwing. This is correct per the comment, but means any other unanticipated error path that can't be force-closed will surface in the wrong layer.
- Files affected: `apps/live/src/extensions/database.ts`, `apps/live/src/extensions/title-sync.ts` (181 lines, large extension), `apps/live/src/extensions/redis.ts`, `apps/live/src/extensions/force-close-handler.ts`, `apps/live/src/extensions/title-update/`
- Fix approach: Audit error paths in each extension. Add a Vitest case for the `content_too_large` branch. Consider opening an upstream issue with hocuspocus about the null-document finally block.

**`ProjectIdentifier` carries a stale `workspace` FK:**

- `apps/api/plane/db/models/project.py:263-280`:
  ```python
  # TODO: Remove workspace relation later
  class ProjectIdentifier(AuditModel):
      workspace = models.ForeignKey("db.Workspace", models.CASCADE, related_name="project_identifiers", null=True)
      project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="project_identifier")
  ```
- Issue: `workspace` is reachable via `project.workspace`, but the column persists in the unique constraint (`unique_together = ["name", "workspace", "deleted_at"]`). Any data drift between `ProjectIdentifier.workspace` and `Project.workspace` produces undefined behaviour.
- Fix approach: Backfill migration to enforce `ProjectIdentifier.workspace == ProjectIdentifier.project.workspace`, then drop the column.

**`ProjectDeployBoard` is deprecated but still in service:**

- `apps/api/plane/db/models/project.py:298-306` — `# DEPRECATED TODO: used to get the old anchors for the project deploy boards`
- Issue: Marked deprecated, but no new model has replaced it. The `apps/space` app likely still queries it.
- Fix approach: Identify caller in `apps/space/`, migrate to whatever replaces `anchor`, then drop the model.

### Medium

**Timeline dependency drag has a documented date-conflict gap:**

- `apps/web/ce/components/gantt-chart/dependency/draggable-dependency-path.tsx:54-57` (referenced by `docs/timeline-e2e-test-environment.md` §1.3): when `source.target_date > target.start_date`, the path renders red but the commit is still allowed.
- Issue: The draggable path UI shows a "you can't do this" red signal, but the API is called anyway. Users may form an incorrect mental model.
- Fix approach: Either (a) suppress the commit when red is shown, or (b) change the red to amber + tooltip explaining "this creates a date conflict". Tracked as out-of-scope in the timeline E2E spec.

**`session-id` cookie name is configurable but referenced as a magic string in tests:**

- `apps/web/e2e/auth/auth.setup.ts` (per plan in `docs/timeline-e2e-test-environment-plan.md`) — `cookies.some((c) => c.name === "session-id")`
- Backend config: `apps/api/plane/settings/common.py:318` — `SESSION_COOKIE_NAME = os.environ.get("SESSION_COOKIE_NAME", "session-id")`
- Issue: If a deployer sets `SESSION_COOKIE_NAME` to anything else, the E2E suite breaks silently.
- Fix approach: Read `process.env.E2E_SESSION_COOKIE_NAME` (default `"session-id"`) in `auth.setup.ts`.

## Migration Artifacts

### High

**Vite + React Router shim layer for Next.js APIs:**

- Files: `apps/web/app/compat/next/{link.tsx, navigation.ts, script.tsx, image.tsx, helper.ts}`
- Vite alias config: `apps/web/vite.config.ts:25-30` aliases `next/link`, `next/navigation`, `next/script` to local shims
- Stale gitignore artifacts: `.gitignore` still excludes `.next/`, `/.next/`, `/.pnp` (Next-era), and explicitly mentions `.react-router/` only twice in the file
- Issue: 348 imports still flow through the shim. The fact that `.next/` is in `.gitignore` years after migration is residue.
- Fix approach: See "Tech Debt → Next.js → React Router migration is incomplete" above. Trim `.gitignore` once the shim is removed.

**`CLAUDE.md` is `.gitignore`-d at repo root:**

- `.gitignore` line: `CLAUDE.md`
- Issue: The single canonical agent guide is gitignored, while the stale `AGENTS.md` is committed. Reviewing Claude Code's outputs, contributors will see only `AGENTS.md`.
- Fix approach: Remove `CLAUDE.md` from `.gitignore`. Either rename `CLAUDE.md` → `AGENTS.md` (and delete the old one) or commit both with `AGENTS.md` reduced to a one-line redirect.

## In-Progress Feature Concerns

### High — Timeline Dependency Schedule Propagation (PRD)

The current branch `feature/timeline-dependency-drag` is mid-feature. Concerns surfaced from `docs/prd/timeline-dependency-date-range-propagation.md`, `docs/adr/0001-server-authoritative-dependency-schedule-propagation.md`, `docs/adr/0002-working-calendar-with-japan-holiday-preset.md`, and `docs/timeline-dependency-follow-up-tasks.md`:

**Deferred work that will become tech debt if not tracked:**

- Working Calendar model (workspace default + project override) — out of scope for first impl
- Japan public holiday preset (2024-2030) — built-in import
- `planned_duration_working_days` field on work items — out of scope (don't conflate with existing estimate points)
- Working-day calculation for `target_date` from `start_date + planned_duration` — deferred
- Holiday preset import-by-year + manual override — deferred
- Non-working-day Gantt highlighting — deferred (axis stays calendar-day)
- File: `docs/timeline-dependency-follow-up-tasks.md`
- Fix approach: Open a parent issue and link each bullet as a child task before merging the propagation PR.

**Server-authoritative propagation surface area not yet implemented:**

- Per ADR 0001 + PRD, the server must:
  - Accept `move` intent (workItemId, originalSchedule, requestedStart, requestedTarget) — endpoint not yet present in `apps/api/plane/app/views/issue/`
  - Resolve full same-project precedence graph
  - Enforce 100 work item update limit per request
  - Return stable error codes: `DEPENDENCY_CYCLE`, `PROJECT_BOUNDARY_EXCEEDED`, `INCOMPLETE_SCHEDULE`, `PROPAGATION_LIMIT_EXCEEDED`, `SCHEDULE_CHANGED`, `PERMISSION_DENIED`, `INVALID_DATE_RANGE`
  - Compare client's drag-start version with server data (stale detection)
- Concern: This is a deep module that doesn't yet exist. The risk is bolting it onto `apps/api/plane/app/views/issue/relation.py:209-260` (creation endpoint) instead of carving it out as a new propagation service.
- Fix approach: Create `apps/api/plane/app/views/issue/schedule_propagation.py` (or a service module under `apps/api/plane/utils/`). Follow the PRD's "deep module with small interface" guidance.

**Cross-project propagation explicitly fails — needs UI handling:**

- PRD: "Reaching a Work Item outside the current project fails the entire propagation request." Error code `PROJECT_BOUNDARY_EXCEEDED`.
- Concern: There is no UI today to render this failure. The relation creation flow (`apps/web/ce/components/gantt-chart/dependency/use-dependency-drag.ts`) would need to surface the error.
- Fix approach: Add a translation key + toast handler before the propagation server endpoint goes live.

**E2E coverage is sparse and human-bootstrapped:**

- `docs/timeline-e2e-test-environment.md` §4.6 documents a 5-minute manual setup (workspace, project, user, layout-toggle).
- 3 tests on the current branch (`apps/web/e2e/specs/timeline-dependency-drag.spec.ts`): blocking, blocked_by, relates_to.
- `.env.e2e` is not committed; lives only in each developer's machine.
- Concern: No CI integration (out of scope per spec §4.5). Anyone joining the project must redo the manual bootstrap.
- Fix approach: §4.8 of the spec already lists "automatic bootstrap" and "CI integration" as future work — these need owners.

**Timeline drag handle position is hard-coded geometry:**

- `apps/web/e2e/pages/timeline.page.ts` — `const HANDLE_OFFSET_X = 12; // block 右端から 12px 外側(6〜18px の中央)`
- Concern: If the CSS for `right-draggable.tsx` changes (`left-full translate-x-1.5 w-3` → anything else), the E2E geometry silently drifts.
- Fix approach: Extract the offset into a shared constant used by both the production `RightDependencyDraggable` and the POM.

## Test Coverage Gaps

### High

**Frontend has 3 specs total (timeline E2E):**

- `apps/web/e2e/specs/timeline-dependency-drag.spec.ts` — 3 tests covering #1 right→blocking, #2 left→blocked_by, #3 shift+picker→relates_to
- Untested timeline scenarios from `docs/timeline-e2e-test-environment.md` §1.3:
  - #4 self-drop (red, no API call)
  - #5 duplicate-drop (red, no API call)
  - #6 cycle-creating drop (red, no API call) — see `apps/web/ce/components/gantt-chart/dependency/cycle-check.ts`
  - #8 hover-delete on confirmed dependency line
  - #9 Escape during drag
- Fix approach: §4.8 of the E2E spec recommends moving #4-#6 to Vitest unit tests against `cycle-check.ts` rather than E2E.

**Hocuspocus extensions have no test coverage beyond title-update + pdf:**

- Tested: `apps/live/tests/services/pdf-export/effect-utils.test.ts`, `apps/live/tests/lib/pdf/pdf-rendering.test.ts`
- Untested: `apps/live/src/extensions/{database,title-sync,redis,force-close-handler}.ts` (462 lines collectively)
- Risk: Custom database/redis/title-sync logic is the realtime collaboration core. A regression here corrupts user pages.
- Fix approach: Add Vitest cases for the `content_too_large` and `force-close` branches first.

**Django propagation service tests required by PRD:**

- PRD §Testing Decisions enumerates 14+ required backend service tests (no-violation, rightward, leftward, transitive, split, merge, gap-preservation, exact-boundary, incomplete-schedule, cross-project, cycle, 100-limit, stale-version, invalid-date-range, permission). These don't exist yet.
- Fix approach: Add `apps/api/plane/tests/unit/services/test_schedule_propagation.py` alongside the new propagation service module.

### Medium

**Existing pytest suite is small:**

- 18 test files total in `apps/api/plane/tests/`
- Coverage is patchy: 2 model tests (`test_workspace_model.py`, `test_issue_comment_modal.py`), 4 contract tests (workspace-app, project-app, authentication, api-token, cycles, labels), but most ViewSets have no contract tests.
- The `--fail-under=90` flag in `apps/api/run_tests.py` (per `CLAUDE.md`) is enforced only when `--coverage` is passed; default invocation has no coverage gate.
- Fix approach: Add contract tests for `apps/api/plane/app/views/issue/relation.py` (relation creation/deletion) before the propagation feature lands.

## Operational Concerns

### High

**Minimum 12 GB RAM required for full local stack:**

- Source: `CLAUDE.md` "Minimum 12 GB RAM is recommended; 8 GB systems routinely fail during Docker startup or pnpm install."
- Stack components from `docker-compose-local.yml`: Postgres 15, Valkey, RabbitMQ, MinIO, Django api, Celery worker, Celery beat-worker, migrator. Plus `pnpm dev` runs 4+ Vite/Turbo processes (web:3000, admin:3001, space:3002, live, package watchers — concurrency=18 per CLAUDE.md).
- Impact: New contributors on 8 GB MacBook Airs cannot run the stack. Documentation should set expectations earlier.
- Fix approach: Add a "minimum hardware" section to `setup.sh` output. Consider a `docker-compose-minimal.yml` that turns off Celery/MinIO for users only working on the frontend.

### Medium

**Turborepo `concurrency=18` is hardcoded:**

- `pnpm dev` runs all JS dev servers via Turbo with `--concurrency=18`. On constrained hardware this saturates CPU.
- Fix approach: Document `pnpm turbo run dev --filter=web` as the supported "I only want one app" path. This already works via the `--filter` flag noted in `CLAUDE.md`.

### Low

**Dependency on private Docker images for some deployments:**

- `deployments/{aio,cli,kubernetes,swarm}` reference image tags that may not be public.
- Out of scope here (deployment concern, not codebase concern), but worth flagging during a deployment pass.

---

## Severity Summary

| Severity | Count | Top Themes                                                                                                                                                                                                                            |
| -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | 6     | Stale `AGENTS.md`, proprietary email file, load-bearing `#gantt-container`, fragile `title-input` deps                                                                                                                                |
| High     | 17    | Lint budget (17k warnings), zero frontend unit tests, Next→React Router migration (348 imports), missing `ee/`, broken `run_tests.sh`, SECRET_KEY/CORS/cookie defaults, Hocuspocus error swallowing, in-progress timeline propagation |
| Medium   | 12    | `any` density, `@ts-expect-error` clusters, TODO/FIXME debt, large stores/views, Cycle soft-delete, throttle, env-file boundary                                                                                                       |
| Low      | 5     | Duplicate modal-width enum, translation TODOs, console.error in live env validation, Vite shim setTimeout cost, private Docker images                                                                                                 |

## Top 5 Priorities (recommended next phases)

1. **Reconcile `AGENTS.md` ↔ `CLAUDE.md`** — quickest win, high agent-correctness payoff. Either delete `AGENTS.md` or replace with redirect. Also remove `CLAUDE.md` from `.gitignore`.
2. **Schedule propagation API + tests** — the PRD/ADR work is well-scoped; missing piece is the actual `apps/api/plane/app/views/issue/schedule_propagation.py` module + 14 PRD-required tests.
3. **Lint budget paydown for `apps/web` (top 1000 warnings)** — concentrated effort during a sprint, then drop the budget step-wise per PR.
4. **Production settings hardening** — fail-closed on missing `SECRET_KEY`, `CORS_ALLOWED_ORIGINS`, `ALLOWED_HOSTS` in `apps/api/plane/settings/production.py`. Decouple `secure_origins` from CORS.
5. **Live-server HMAC migration** — replace static `live-server-secret-key` with HMAC-of-payload-and-timestamp; resolves the only TODO in `apps/live`.

---

_Concerns audit: 2026-05-03_
