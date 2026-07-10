# Upstream Preview Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the investigated `makeplane/plane` `preview` update at `dc9d80b2d2a499b967f0b541e083b283f463719f` into the fork's `preview` line while preserving the fork's timeline dependency, working-day duration, and propagation behavior.

**Architecture:** Perform the merge on an isolated integration branch and keep the merge commit so both histories remain visible. Resolve upstream's i18n replacement by mechanically porting the fork-only keys from the conflicted legacy TypeScript dictionaries into upstream's JSON namespace format, then validate the semantic overlap in the API scheduling path, shared TypeScript contracts, MobX timeline store, and Gantt UI before integrating the branch.

**Tech Stack:** Git/worktrees, pnpm 11.3.0, Turborepo, TypeScript/React/MobX, react-i18next, Vitest, Playwright, Python/Django/pytest, uv.

## Global Constraints

- Merge exactly `upstream/preview@dc9d80b2d2a499b967f0b541e083b283f463719f`, the commit investigated on 2026-07-11; do not silently merge a newer upstream head.
- Start from fork commit `preview@556990ec9780`; if `preview` has moved, stop and repeat the comparison and conflict simulation before executing this plan.
- Use an isolated worktree created with `superpowers:using-git-worktrees`; do not perform the merge in the user's primary checkout.
- Preserve all fork behavior for timeline dependency drag, timeline propagation, and `planned_duration_working_days`.
- Adopt upstream's package baseline: Plane `1.3.1`, pnpm `11.3.0`, catalog-managed external dependencies, react-i18next JSON locales, Storybook 10, and Turbo 2.9.x.
- Keep `workspace:*` for internal packages and `catalog:` for external dependencies.
- Preserve migration `apps/api/plane/db/migrations/0122_issue_planned_duration_working_days.py`; upstream currently ends at migration `0121`, so no migration renumbering is required.
- Do not edit `pnpm-lock.yaml` manually; regenerate it from the resolved manifests with pnpm 11.
- Do not weaken or delete existing fork tests to make the merge pass.
- Do not push, open a pull request, or merge the integration branch into `preview` without separate user authorization.

---

## File Map

- `.gitignore` — retain upstream i18n/script exceptions and the fork's worktree/Playwright artifact exclusions.
- `apps/web/package.json` — retain fork Playwright scripts while converting `@playwright/test` to `catalog:`.
- `packages/utils/package.json` — retain the fork Vitest script and use upstream's catalog version of Vitest.
- `pnpm-workspace.yaml` — upstream dependency catalog plus the fork's Playwright catalog entry.
- `pnpm-lock.yaml` — generated result for pnpm 11 and the merged manifests.
- `packages/types/src/index.ts` — export upstream's new types and fork's `timeline-propagation` contract.
- `packages/i18n/src/locales/{cs,de,en,es,fr,id,it,ja,ko,pl,pt-BR,ro,ru,sk,tr-TR,ua,vi-VN,zh-CN,zh-TW}/common.json` — receive fork-only duration, dependency, and propagation keys.
- `packages/i18n/src/locales/*/translations.ts` — legacy files removed by upstream after their fork-only keys are migrated.
- `packages/i18n/scripts/migrate-fork-keys.ts` — temporary migration helper, created and deleted before the merge commit.
- `apps/api/plane/app/serializers/{__init__.py,issue.py}` — semantic overlap between upstream API hardening/refactors and fork scheduling contracts.
- `apps/api/plane/app/views/issue/base.py` — semantic overlap in create, patch, and bulk-update scheduling behavior.
- `apps/api/plane/db/models/issue.py` — preserve the working-day duration field alongside upstream model changes.
- `apps/web/core/components/gantt-chart/chart/main-content.tsx` — preserve dependency overlay rendering after upstream Web changes.
- `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx` — preserve propagation routing and server reconciliation.
- `apps/web/core/store/issue/issue-details/relation.store.ts` — preserve relation mutation behavior.

---

### Task 1: Create a Reproducible Integration Worktree

**Files:**
- Modify: none
- Verify: Git refs and worktree state

**Interfaces:**
- Consumes: fork `preview@556990ec9780`, investigated upstream SHA `dc9d80b2d2a499b967f0b541e083b283f463719f`.
- Produces: isolated branch `codex/merge-upstream-preview-2026-07` in `.worktrees/merge-upstream-preview-2026-07`.

- [ ] **Step 1: Verify the source checkout is clean and still at the investigated fork commit**

Run:

```bash
git status --short --branch
git rev-parse HEAD
```

Expected: status is `## preview...origin/preview` with no file entries, and the SHA is `556990ec9780...`. If either condition differs, stop and repeat the upstream comparison before continuing.

- [ ] **Step 2: Refresh only the pinned upstream preview ref over HTTPS**

The configured SSH remote is not usable in this environment, so fetch without changing `.git/config`:

```bash
git fetch https://github.com/makeplane/plane.git \
  +refs/heads/preview:refs/remotes/upstream/preview
git cat-file -e dc9d80b2d2a499b967f0b541e083b283f463719f^{commit}
```

Expected: both commands exit 0. A newer `upstream/preview` may be fetched, but this plan still merges the pinned SHA.

- [ ] **Step 3: Create the isolated worktree using the required skill**

Invoke `superpowers:using-git-worktrees`, then create:

```bash
git worktree add \
  .worktrees/merge-upstream-preview-2026-07 \
  -b codex/merge-upstream-preview-2026-07 \
  556990ec9780
cd .worktrees/merge-upstream-preview-2026-07
```

Expected: the new worktree is on `codex/merge-upstream-preview-2026-07` at `556990ec9780`.

- [ ] **Step 4: Record the expected divergence before mutation**

Run:

```bash
test "$(git merge-base HEAD dc9d80b2d2a499b967f0b541e083b283f463719f)" = \
  "13db2f883f141f139b106f9459c44ad030772d73"
git rev-list --left-right --count HEAD...dc9d80b2d2a499b967f0b541e083b283f463719f
```

Expected: the merge-base assertion passes and the divergence is `153 86`.

---

### Task 2: Start the Merge and Resolve Structural/Dependency Conflicts

**Files:**
- Modify: `.gitignore`
- Modify: `apps/web/package.json`
- Modify: `packages/utils/package.json`
- Modify: `packages/types/src/index.ts`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: isolated branch from Task 1 and upstream's package/catalog baseline.
- Produces: a conflict-resolved pnpm 11 dependency graph and combined public type exports; the 19 i18n modify/delete conflicts intentionally remain for Task 3.

- [ ] **Step 1: Start a non-fast-forward merge without committing**

Run:

```bash
git merge --no-ff --no-commit dc9d80b2d2a499b967f0b541e083b283f463719f
```

Expected: Git exits non-zero and reports exactly the known conflict families: `.gitignore`, 19 locale `translations.ts` files, `packages/types/src/index.ts`, and `pnpm-lock.yaml`.

- [ ] **Step 2: Resolve `.gitignore` from upstream plus the fork-only exclusions**

Take upstream's version, then add this exact block after `/security/`:

```gitignore

# Local Git worktrees
.worktrees/

# Playwright E2E (apps/web)
apps/web/playwright/.auth/
apps/web/test-results/
apps/web/playwright-report/
apps/web/e2e/.env.e2e
```

Run:

```bash
git checkout --theirs .gitignore
git add .gitignore
```

Expected: `.gitignore` retains `!packages/i18n/scripts/`, `packages/i18n/src/types/keys.generated.ts`, `/security/`, and all entries above.

- [ ] **Step 3: Resolve the type barrel by retaining all three new exports**

Replace the conflicted section in `packages/types/src/index.ts` with:

```ts
export * from "./issues";
export * from "./issues/base";
export * from "./issues/issue-identifier";
export * from "./issues/issue-property-values";
export * from "./issues/timeline-propagation";
export * from "./layout";
export * from "./module";
export * from "./navigation-preferences";
export * from "./page";
```

Run:

```bash
git add packages/types/src/index.ts
```

Expected: no conflict markers remain and all three exports `issue-property-values`, `timeline-propagation`, and `navigation-preferences` are present.

- [ ] **Step 4: Normalize the fork's test dependencies to upstream's catalog policy**

In `apps/web/package.json`, retain these scripts:

```json
"test:e2e": "playwright test --config=e2e/playwright.config.ts",
"test:e2e:ui": "playwright test --config=e2e/playwright.config.ts --ui",
"test:e2e:debug": "playwright test --config=e2e/playwright.config.ts --debug",
"test:e2e:install": "playwright install chromium"
```

Set the Web dev dependency to:

```json
"@playwright/test": "catalog:"
```

In `packages/utils/package.json`, retain:

```json
"test": "vitest run"
```

and set its dev dependency to:

```json
"vitest": "catalog:"
```

Add this entry to the alphabetized `catalog:` mapping in `pnpm-workspace.yaml`:

```yaml
  "@playwright/test": "^1.59.1"
```

Do not add another Vitest entry: upstream already provides `"vitest": "^4.1.8"`.

Run:

```bash
git add apps/web/package.json packages/utils/package.json pnpm-workspace.yaml
```

Expected: all external test packages use `catalog:` and the fork's four E2E scripts plus Utils test script remain available.

- [ ] **Step 5: Regenerate the lockfile with pnpm 11 instead of hand-merging it**

Run:

```bash
git checkout --theirs pnpm-lock.yaml
corepack pnpm --version
corepack pnpm install --lockfile-only --no-frozen-lockfile
git add pnpm-lock.yaml
```

Expected: pnpm reports `11.3.0`, lockfile generation exits 0, and `git ls-files -u pnpm-lock.yaml` prints nothing.

- [ ] **Step 6: Confirm only the expected i18n conflicts remain**

Run:

```bash
git diff --name-only --diff-filter=U
```

Expected: exactly the 19 `packages/i18n/src/locales/<locale>/translations.ts` paths remain; `.gitignore`, the type barrel, and lockfile are absent.

---

### Task 3: Port Fork Translation Keys into react-i18next JSON Locales

**Files:**
- Create temporarily: `packages/i18n/scripts/migrate-fork-keys.ts`
- Modify: `packages/i18n/src/locales/{cs,de,en,es,fr,id,it,ja,ko,pl,pt-BR,ro,ru,sk,tr-TR,ua,vi-VN,zh-CN,zh-TW}/common.json`
- Delete through merge resolution: `packages/i18n/src/locales/{cs,de,en,es,fr,id,it,ja,ko,pl,pt-BR,ro,ru,sk,tr-TR,ua,vi-VN,zh-CN,zh-TW}/translations.ts`
- Generated, ignored: `packages/i18n/src/types/keys.generated.ts`

**Interfaces:**
- Consumes: legacy default-export objects still present as the `HEAD` side of each modify/delete conflict and upstream JSON locale files.
- Produces: `work_item.duration_placeholder`, `work_item.working_days`, `gantt_dependency.*`, and `timeline.propagation.*` in every locale's `common.json`; non-English missing duration/propagation values fall back to the English fork copy so key parity stays at 100%.

- [ ] **Step 1: Add the one-shot migration script**

Create `packages/i18n/scripts/migrate-fork-keys.ts` with exactly:

```ts
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const locales = [
  "cs",
  "de",
  "en",
  "es",
  "fr",
  "id",
  "it",
  "ja",
  "ko",
  "pl",
  "pt-BR",
  "ro",
  "ru",
  "sk",
  "tr-TR",
  "ua",
  "vi-VN",
  "zh-CN",
  "zh-TW",
] as const;

type JsonObject = Record<string, unknown>;
type LegacyTranslations = {
  work_item: Record<string, unknown>;
  gantt_dependency?: JsonObject;
  timeline?: JsonObject;
};

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(scriptsDir, "../src/locales");

async function loadLegacy(locale: string): Promise<LegacyTranslations> {
  const moduleUrl = pathToFileURL(path.join(localesDir, locale, "translations.ts")).href;
  const module = (await import(moduleUrl)) as { default: LegacyTranslations };
  return module.default;
}

const legacyByLocale = new Map<string, LegacyTranslations>();
for (const locale of locales) legacyByLocale.set(locale, await loadLegacy(locale));

const english = legacyByLocale.get("en");
if (!english?.gantt_dependency || !english.timeline) {
  throw new Error("English fork translation keys are incomplete");
}

for (const locale of locales) {
  const legacy = legacyByLocale.get(locale);
  if (!legacy) throw new Error(`Missing legacy locale: ${locale}`);

  const commonPath = path.join(localesDir, locale, "common.json");
  const common = JSON.parse(await readFile(commonPath, "utf8")) as JsonObject;
  const workItem = common.work_item as Record<string, unknown>;
  if (!workItem) throw new Error(`Missing work_item object: ${locale}`);

  workItem.duration_placeholder =
    legacy.work_item.duration_placeholder ?? english.work_item.duration_placeholder;
  workItem.working_days = legacy.work_item.working_days ?? english.work_item.working_days;
  common.gantt_dependency = legacy.gantt_dependency ?? english.gantt_dependency;
  common.timeline = legacy.timeline ?? english.timeline;

  await writeFile(commonPath, `${JSON.stringify(common, null, 2)}\n`, "utf8");
}
```

- [ ] **Step 2: Install the resolved JavaScript dependencies and run the migration**

Run:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm --filter=@plane/i18n exec tsx scripts/migrate-fork-keys.ts
```

Expected: both commands exit 0 and all 19 `common.json` files are modified.

- [ ] **Step 3: Resolve upstream's deletion of the legacy dictionaries**

Run:

```bash
git rm packages/i18n/src/locales/*/translations.ts
git add packages/i18n/src/locales/*/common.json
```

Expected: `git diff --name-only --diff-filter=U` prints nothing.

- [ ] **Step 4: Remove the one-shot helper so it does not become product code**

Delete `packages/i18n/scripts/migrate-fork-keys.ts`, then verify:

```bash
test ! -e packages/i18n/scripts/migrate-fork-keys.ts
```

Expected: exit 0. The migration logic is represented only by the resulting locale JSON changes.

- [ ] **Step 5: Verify exact key parity and generated translation types**

Run:

```bash
corepack pnpm --filter=@plane/i18n check:sync
corepack pnpm --filter=@plane/i18n generate:types
rg -n 'gantt_dependency|timeline\.propagation|work_item\.duration_placeholder|work_item\.working_days' \
  packages/i18n/src/types/keys.generated.ts
```

Expected: sync check reports all locales in sync with English and no collisions/path conflicts; the generated type union contains all four key families.

---

### Task 4: Verify Semantic Overlap Before Creating the Merge Commit

**Files:**
- Verify: `apps/api/plane/app/serializers/__init__.py`
- Verify: `apps/api/plane/app/serializers/issue.py`
- Verify: `apps/api/plane/app/views/issue/base.py`
- Verify: `apps/api/plane/db/models/issue.py`
- Verify: `apps/web/core/components/gantt-chart/chart/main-content.tsx`
- Verify: `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx`
- Verify: `apps/web/core/store/issue/issue-details/relation.store.ts`
- Test: `apps/api/plane/tests/unit/services/timeline_propagation/`
- Test: `apps/api/plane/tests/unit/services/test_weekend_working_days.py`
- Test: `apps/api/plane/tests/contract/app/test_timeline_propagation.py`
- Test: `apps/api/plane/tests/contract/app/test_issue_working_day_duration.py`
- Test: `packages/utils/src/timeline-propagation/__tests__/preview.test.ts`

**Interfaces:**
- Consumes: fully resolved merge tree from Tasks 2–3.
- Produces: evidence that auto-merged API/Web files still satisfy the fork contracts and that Django sees a complete migration graph.

- [ ] **Step 1: Audit the merge result for unresolved or accidental damage**

Run:

```bash
git diff --check
test -z "$(git diff --name-only --diff-filter=U)"
rg -n 'planned_duration_working_days|TimelinePropagation' \
  apps/api/plane/app/serializers/issue.py \
  apps/api/plane/app/views/issue/base.py \
  apps/api/plane/db/models/issue.py \
  packages/types/src/index.ts
```

Expected: no whitespace/conflict errors; the scheduling field and propagation exports remain present in every listed layer.

- [ ] **Step 2: Run the fast TypeScript contract and scheduling tests**

Run:

```bash
corepack pnpm --filter=@plane/utils test
corepack pnpm turbo run check:types \
  --filter=@plane/i18n \
  --filter=@plane/types \
  --filter=@plane/services \
  --filter=@plane/utils \
  --filter=web
```

Expected: all Utils Vitest cases pass and all five filtered TypeScript checks exit 0.

- [ ] **Step 3: Synchronize Python dependencies and run the fork's API regression suite**

Run:

```bash
cd apps/api
uv sync
DJANGO_SETTINGS_MODULE=plane.settings.test uv run pytest \
  plane/tests/unit/services/timeline_propagation/ \
  plane/tests/unit/services/test_weekend_working_days.py \
  plane/tests/contract/app/test_timeline_propagation.py \
  plane/tests/contract/app/test_issue_working_day_duration.py \
  -q
cd ../..
```

Expected: all selected unit and contract tests pass. If a failure occurs, pause this plan and invoke `superpowers:systematic-debugging`; do not guess at a compatibility fix or delete the failing assertion.

- [ ] **Step 4: Verify the Django migration graph**

Run:

```bash
cd apps/api
DJANGO_SETTINGS_MODULE=plane.settings.test uv run python manage.py makemigrations --check --dry-run
DJANGO_SETTINGS_MODULE=plane.settings.test uv run python manage.py showmigrations db | tail -15
cd ../..
```

Expected: `No changes detected`; migration `0122_issue_planned_duration_working_days` appears after upstream `0121_alter_estimate_type` with no competing leaf.

- [ ] **Step 5: Run focused formatting and lint gates**

Run:

```bash
corepack pnpm turbo run check:format \
  --filter=@plane/i18n \
  --filter=@plane/types \
  --filter=@plane/utils \
  --filter=web
corepack pnpm turbo run check:lint \
  --filter=@plane/i18n \
  --filter=@plane/types \
  --filter=@plane/utils \
  --filter=web
```

Expected: all filtered format and lint checks pass. Apply only deterministic formatter fixes with `pnpm fix:format`, restage them, and rerun both commands.

---

### Task 5: Commit the Merge and Run End-to-End Gates

**Files:**
- Commit: all staged merge resolutions and auto-merged upstream changes
- Test: `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts`
- Test: `apps/web/e2e/specs/work-item-modal-duration.spec.ts`
- Test: dependency-drag E2E specs under `apps/web/e2e/specs/`

**Interfaces:**
- Consumes: resolved and targeted-test-green merge tree from Task 4.
- Produces: one reviewable merge commit on `codex/merge-upstream-preview-2026-07` plus full build/check and E2E evidence.

- [ ] **Step 1: Review staged scope and create the merge commit**

Run:

```bash
git status --short
git diff --cached --stat
git diff --cached --name-only | rg 'translations\.ts$' | wc -l
git commit -m "merge: sync upstream preview through dc9d80b2d2"
```

Expected: the legacy translation count is 19, commit succeeds as a two-parent merge commit, and `git show -s --format='%P' HEAD` contains both the fork parent and `dc9d80b2d2a499b967f0b541e083b283f463719f`.

- [ ] **Step 2: Run repository-wide static and build gates from the committed tree**

Run:

```bash
corepack pnpm check
corepack pnpm build
git status --short
```

Expected: checks and build pass; status is clean. If generated files change, determine why before committing anything else—`packages/i18n/src/types/keys.generated.ts` is intentionally ignored.

- [ ] **Step 3: Run the fork-critical Playwright flows**

Precondition: the documented local Docker stack and Web server are running, `apps/web/e2e/.env.e2e` exists, and the test workspace UI language is English.

Run:

```bash
test -f apps/web/e2e/.env.e2e
corepack pnpm --filter=web test:e2e -- \
  e2e/specs/timeline-dependency-propagation.spec.ts \
  e2e/specs/work-item-modal-duration.spec.ts \
  e2e/specs/timeline-dependency-drag.spec.ts
```

Expected: all selected E2E specs pass. If the dependency-drag filename differs after upstream's merge, use `rg --files apps/web/e2e/specs | rg 'dependency.*drag|drag.*dependency'` and pass the single matching spec path; do not broaden this into the entire E2E suite until the focused flows pass.

- [ ] **Step 4: Perform the final merge-history and cleanliness audit**

Run:

```bash
git status --short --branch
git merge-base --is-ancestor dc9d80b2d2a499b967f0b541e083b283f463719f HEAD
git merge-base --is-ancestor 556990ec9780 HEAD
git log --oneline --decorate --graph -8
```

Expected: worktree is clean, both ancestry checks exit 0, and the graph shows the new two-parent merge commit on `codex/merge-upstream-preview-2026-07`.

- [ ] **Step 5: Hand off without publishing**

Report the merge commit SHA, exact commands run, pass/fail counts, and any skipped E2E prerequisite. Leave the branch local and request explicit approval before pushing or merging it into `preview`.

---

## Acceptance Criteria

- The integration commit contains both `556990ec9780` and `dc9d80b2d2a4` in its ancestry.
- No unmerged paths or conflict markers remain.
- All 19 legacy `translations.ts` files are replaced by upstream JSON namespaces.
- Every locale contains the fork's duration, dependency, and propagation keys and `@plane/i18n check:sync` passes.
- `planned_duration_working_days` remains in the model, serializer, API responses, TypeScript contracts, and timeline preview reconciliation.
- Timeline propagation and working-day API/unit tests pass without weakening assertions.
- Utils Vitest, targeted TypeScript checks, repository `pnpm check`, and `pnpm build` pass.
- Fork-critical Playwright flows pass, or the handoff explicitly records the missing external prerequisite rather than claiming E2E success.
- The integration branch remains unpushed until separately authorized.
