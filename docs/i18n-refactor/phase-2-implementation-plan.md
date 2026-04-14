# i18n Refactor Phase 2 — Implementation Plan

**Goal:** Bring all 18 non-English locales into full key parity with English, and add a CI workflow that blocks future sync drift.

**Architecture:** Three pieces in one PR: (1) script refactor to share locale I/O between check tools, (2) a dedicated GitHub Actions workflow that runs `check:sync` on locale-touching PRs, (3) a one-time translation pass that closes the sync gap inherited from Phase 1.

**Tech Stack:** TypeScript (tsx), Node.js 22.18.0, GitHub Actions, pnpm workspaces.

**Spec:** `docs/i18n-refactor/phase-2-design-spec.md`

---

## File Map

### Files to Create

| File                                     | Responsibility                                                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/i18n/scripts/lib/locale-io.ts` | Shared locale loading helpers (`flattenKeys`, `readJsonFile`, `listLocales`, `loadLocale`) with file-path context on JSON parse errors. |
| `.github/workflows/i18n-sync-check.yml`  | CI workflow that runs `check:sync` on PRs and pushes touching locales or the check script.                                              |

### Files to Modify

| File                                        | Change                                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `packages/i18n/scripts/sync-check.ts`       | Import I/O helpers from `lib/locale-io.ts`; remove inline duplicates. Behavior (output, counts, exit codes) unchanged. |
| `packages/i18n/src/locales/<locale>/*.json` | 18 locales × up to 37 namespaces. Missing keys added with translations; stale keys removed.                            |

### Files to Delete

None.

---

## Task 1: Refactor shared locale I/O

Extract the inline `flattenKeys`, `loadLocale`, `LOCALES_DIR`, and related interfaces out of `sync-check.ts` into a dedicated `scripts/lib/locale-io.ts` module. Add a `readJsonFile` helper that wraps `JSON.parse` errors with the file path.

### `scripts/lib/locale-io.ts`

Exports:

- `LOCALES_DIR` — absolute path to `packages/i18n/src/locales/`.
- `flattenKeys(obj, prefix?)` — recursively flatten a nested object into dot-notation keys. Arrays are treated as leaf values.
- `readJsonFile(path)` — `JSON.parse(readFileSync(...))` wrapped with a `try/catch` that rethrows as `Error(\`Failed to parse JSON at ${path}: ${message}\`)`.
- `listLocales()` — return sorted list of locale directory names under `LOCALES_DIR`.
- `loadLocale(locale)` — load all `*.json` files for a locale, returning `{ locale, namespaces: NamespaceData[], allKeys: Set<string> }` where each `NamespaceData` has `{ name, keys, data }`.

### `scripts/sync-check.ts` changes

- Remove inline `flattenKeys`, `loadLocale`, `LOCALES_DIR` definitions.
- Remove inline `NamespaceData` and `LocaleData` interfaces.
- Add `import { LOCALES_DIR, listLocales, loadLocale } from "./lib/locale-io.js";` plus `import type { LocaleData } from "./lib/locale-io.js";`.
- `main()` no longer needs `async` — `loadLocale` is synchronous.
- The bottom of the file changes from `main().catch(...)` to `try { main() } catch (err) { ... process.exit(1) }`.
- Error message for missing `en/` locale keeps the `LOCALES_DIR` path reference.

### Verification

- `pnpm --filter=@plane/i18n run check:sync` output is byte-identical to the pre-refactor output.
- `pnpm --filter=@plane/i18n run check:lint` and `check:types` pass.

---

## Task 2: Add the CI workflow

Create `.github/workflows/i18n-sync-check.yml`.

### Key design choices

- **Path-filtered trigger.** Runs on `pull_request` and `push` only when files under `packages/i18n/src/locales/**`, `packages/i18n/scripts/**`, or the workflow file itself change.
- **No `pnpm install`.** The check script has no dependencies beyond `node:fs` and `node:path`. It runs via `npx --yes tsx@4.19.2`. `tsx` version is pinned for reproducibility.
- **Caching.** `~/.npm` cached keyed on the tsx version. Cold first run ~15s; warm ~3s.
- **Concurrency.** `concurrency` group cancels superseded PR runs.
- **Hardening.** `permissions: contents: read` (least-privilege); no secrets referenced; `fetch-depth: 1` + `filter: blob:none` for minimal clone; `timeout-minutes: 5` ceiling; draft PRs skip via `if` guard.
- **Push backstop.** The same check runs on `push` to protected branches (`preview`, `phoenix-releases`, `master`) so admin bypasses or direct pushes don't escape the check.

### Workflow file

```yaml
name: i18n sync check

on:
  workflow_dispatch:
  pull_request:
    branches:
      - "preview"
      - "phoenix-releases"
      - "master"
      - "release/**"
    types:
      - "opened"
      - "synchronize"
      - "reopened"
      - "ready_for_review"
    paths:
      - "packages/i18n/src/locales/**"
      - "packages/i18n/scripts/**"
      - ".github/workflows/i18n-sync-check.yml"
  push:
    branches:
      - "preview"
      - "phoenix-releases"
      - "master"
    paths:
      - "packages/i18n/src/locales/**"
      - "packages/i18n/scripts/**"

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  sync-check:
    name: check:sync
    runs-on: ubuntu-latest
    timeout-minutes: 5
    if: github.event_name == 'push' || github.event.pull_request.draft == false
    env:
      TSX_VERSION: "4.19.2"
    steps:
      - name: Checkout code
        uses: actions/checkout@v6
        with:
          fetch-depth: 1
          filter: blob:none

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "22.18.0"

      - name: Cache npm downloads for npx tsx
        uses: actions/cache@v5
        with:
          path: ~/.npm
          key: npm-tsx-${{ env.TSX_VERSION }}-${{ runner.os }}

      - name: Run sync check
        run: npx --yes tsx@${{ env.TSX_VERSION }} packages/i18n/scripts/sync-check.ts --ci
```

### Verification

- `actionlint .github/workflows/i18n-sync-check.yml` passes with no output.
- A trivial locale file edit on a test branch triggers the workflow; unrelated changes do not.

---

## Task 3: Sync non-English locales

Bring every non-English locale to 100% key parity with English. For each of the 18 locales (`cs`, `de`, `es`, `fr`, `id`, `it`, `ja`, `ko`, `pl`, `pt-BR`, `ro`, `ru`, `sk`, `tr-TR`, `ua`, `vi-VN`, `zh-CN`, `zh-TW`):

1. Identify missing and stale keys per namespace by diffing against English (using `check:sync` output or a local brief derived from the same data).
2. Remove every stale key. Walk the nested object tree, delete the leaf, then prune any parent object that has become empty.
3. Add every missing key with a translated value. Insert under the same parent path the English file uses; create parent objects as needed. Preserve the relative ordering of existing keys.
4. Write each modified file with 2-space indentation and a trailing newline.

### Translation rules

- **Preserve ICU syntax verbatim.** Inside `{count, plural, one {X item} other {# items}}`, translate only the display text inside the inner braces. Keep the structure, `#`, and variable name unchanged. Each locale's plural categories must match CLDR (Slavic: `one`/`few`/`many`/`other`; Romance: `one`/`other`; CJK + Vietnamese: `other` only; etc.).
- **Preserve interpolation placeholders verbatim.** `{{var}}`, `{var}`, `<0>...</0>`, `<link>...</link>` pass through untouched. Only translate the human-readable text around them.
- **Don't translate proper nouns.** `Plane`, product feature names used as product nouns, third-party product names (`Slack`, `GitHub`, `Jira`, `Linear`, `Notion`, `Confluence`, `Bitbucket`, `Figma`), env var names, HTTP methods, URL slugs, API keys, UUIDs.
- **Match the locale's existing conventions.** Formality (formal vs informal second person), capitalization (German noun capitalization, French sentence case), punctuation (French non-breaking spaces, Chinese full-width punctuation). Infer from existing translations in the same locale.
- **No empty strings.** Every missing key gets a non-empty value.

### Commit strategy

One commit per locale — `i18n(<locale>): sync <locale> locale with English (machine-translated)`. This keeps the PR reviewable and makes per-locale revert trivial if a native speaker later flags locale-wide quality issues.

### Verification

- `pnpm --filter=@plane/i18n run check:sync` exits 0 with "All locales are in sync with English. No issues found."
- Every modified JSON file parses as valid JSON.
- `pnpm --filter=@plane/i18n run build` succeeds (generates `keys.generated.ts`).

---

## Final Checks

Before opening the PR:

```bash
pnpm --filter=@plane/i18n run check:sync    # exit 0
pnpm --filter=@plane/i18n run check:lint    # exit 0
pnpm --filter=@plane/i18n run check:types   # exit 0
pnpm --filter=@plane/i18n run check:format  # exit 0
pnpm --filter=@plane/i18n run build         # exit 0
actionlint .github/workflows/i18n-sync-check.yml  # no output
```

PR description must flag translations as machine-generated and call out native-speaker review as follow-up.
