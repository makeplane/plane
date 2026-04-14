# Design Spec: i18n Phase 2 — Locale Sync + CI Enforcement

**Date:** 2026-04-15
**Package:** `packages/i18n` (`@plane/i18n`)
**Approach:** Close the existing English-to-locale sync gap, then enforce sync parity in CI

---

## Goals

1. **Full key parity** — Every key present in English exists in all 18 non-English locales with a translated value.
2. **Zero stale keys** — Remove every locale key that no longer exists in English.
3. **Drift prevention** — Block PRs that introduce missing or stale keys, via a dedicated fast-running GitHub Actions workflow.
4. **Script hardening** — File-path context on JSON parse errors so CI failures are actionable.

## Non-goals

- Changing the public API of `@plane/i18n`.
- Changing how the app loads translations at runtime.
- Native-speaker review of translations (tracked as follow-up).
- Adding new supported languages. The 19-locale set from Phase 1 is unchanged.
- An auto-fix bot for sync drift. The CI check fails the build; authors fix locally.

---

## Starting state

Running `pnpm --filter=@plane/i18n run check:sync` before this phase reported:

- English: 4,813 keys (source of truth).
- 17 locales missing 562–619 keys each (~87% coverage).
- `de` missing 37 keys (~99.2% coverage).
- 17 locales carrying 64–94 stale keys each.
- No cross-namespace collisions and no path conflicts in English.

Total work: ~10,800 missing keys to translate, ~1,510 stale keys to remove across 18 locales × 37 namespaces. No CI enforcement existed, so drift had accumulated silently since Phase 1.

---

## Approach

Two concerns, both solved in a single PR:

### 1. One-time sync

Every non-English locale is brought to 100% parity with English. Missing keys are filled with machine-translated values following a strict contract (preserve ICU syntax, preserve interpolation placeholders, don't translate proper nouns). Stale keys are removed outright, with empty parent objects pruned.

Completion gate: `pnpm --filter=@plane/i18n run check:sync` exits 0 for all 18 locales.

Machine translations are flagged in the PR description and tracked as follow-up work for native-speaker review.

### 2. CI enforcement

A new GitHub Actions workflow runs `check:sync --ci` on PRs and pushes that touch locale files or the sync script. The workflow is intentionally minimal — skip `pnpm install`, run the check directly via `npx tsx`. Typical end-to-end run: 20–40 seconds cold, ~3 seconds warm.

### 3. Script refactor

A small refactor of `scripts/sync-check.ts` extracts shared locale-loading helpers into `scripts/lib/locale-io.ts`. The new helper wraps `JSON.parse` with the offending file path, closing a CI-debugging gap where malformed locale JSON would throw with no filename in the error message.

The sync-check behavior (output format, counts, exit codes) is unchanged.

---

## Components

### CI workflow — `.github/workflows/i18n-sync-check.yml`

**Trigger:**

```yaml
on:
  pull_request:
    branches: [preview, phoenix-releases, master, release/**]
    types: [opened, synchronize, reopened, ready_for_review]
    paths:
      - "packages/i18n/src/locales/**"
      - "packages/i18n/scripts/**"
      - ".github/workflows/i18n-sync-check.yml"
  push:
    branches: [preview, phoenix-releases, master]
    paths:
      - "packages/i18n/src/locales/**"
      - "packages/i18n/scripts/**"
```

- Path-filtered to locale files and the check scripts — runs only when relevant.
- The workflow's own file is included so config changes get validated by their own run.
- A `push` backstop on protected branches catches admin bypasses and direct pushes.
- `workflow_dispatch` enables manual runs from the Actions UI.

**Speed optimizations:**

- `fetch-depth: 1` and `filter: blob:none` — minimal clone.
- **No `pnpm install`.** The check script uses only `node:fs` and `node:path`. It runs via `npx --yes tsx@4.19.2` and nothing else is installed.
- `~/.npm` cache keyed on the tsx version — cold first run ~15s, warm ~3s.
- `concurrency` group with `cancel-in-progress: true` — superseded PR runs don't waste minutes.
- `ubuntu-latest` runner. The check is I/O-bound over ~700 small JSON files; no benefit from multi-core.
- `timeout-minutes: 5` hard ceiling.

**Hardening:**

- `permissions: contents: read` — least-privilege.
- Node pinned to `22.18.0` to match the project's pinned version.
- No secrets referenced. Safe on fork PRs.
- Draft PRs skip via `if: github.event_name == 'push' || github.event.pull_request.draft == false`.

### Shared locale I/O — `scripts/lib/locale-io.ts`

A focused helper module used by `sync-check.ts`. Exports:

| Symbol               | Responsibility                                                                    |
| -------------------- | --------------------------------------------------------------------------------- |
| `LOCALES_DIR`        | Absolute path to `src/locales/`.                                                  |
| `flattenKeys(obj)`   | Recursively flatten a nested object into dot-notation keys.                       |
| `readJsonFile(path)` | Read and parse JSON, wrapping parse errors with the file path.                    |
| `listLocales()`      | Return sorted list of locale directory names.                                     |
| `loadLocale(locale)` | Load all namespace files for a locale, return flattened key sets and parsed data. |

### Sync-check script — `scripts/sync-check.ts`

Refactored to import from `lib/locale-io.ts` instead of duplicating helpers inline. Output format, per-locale counts, and exit codes are unchanged. CI continues to consume the same output.

---

## Testing

**For the sync:**

- `pnpm --filter=@plane/i18n run check:sync` must exit 0 with "All locales are in sync with English."
- `pnpm --filter=@plane/i18n run build` must succeed (runs `generate:types` as pre-step, a smoke check on the English source).
- Spot-check of translated keys: ICU syntax preserved, interpolation placeholders intact, no empty strings.

**For the CI workflow:**

- `actionlint .github/workflows/i18n-sync-check.yml` must pass.
- A trivial locale change on a test branch triggers the workflow; unrelated changes do not.
- Introducing a missing key on a test branch causes the workflow to fail with a useful log.

---

## Rollout

Phase 2 ships as a single PR containing:

- 18 locale syncs (one commit per locale, for per-locale reviewability and targeted revert).
- `scripts/lib/locale-io.ts` (new).
- `scripts/sync-check.ts` (refactored to use the shared helper + path-context errors).
- `.github/workflows/i18n-sync-check.yml` (new).

The locale JSON diffs are bulk changes best validated by the green `check:sync` result plus sampling. The PR description flags translations as machine-generated and recommends native-speaker review as follow-up.

---

## Out of scope (deferred)

- **Native-speaker review** of machine translations. Opens as a follow-up effort.
- **Pluralization audit.** `check:sync` treats each key equally, but ICU plural forms differ by language (Slavic languages have 4, Arabic 6). A dedicated audit is a separate effort.
- **Translation memory / glossary** for consistency of domain terms ("workspace", "cycle", "initiative") across languages.
- **Automated translation bot** that opens PRs when English changes. The CI check in this phase blocks drift at merge time; a bot is an additive investment for a later phase.
