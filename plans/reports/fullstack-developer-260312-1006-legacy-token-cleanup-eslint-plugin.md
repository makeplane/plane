# Phase Implementation Report

## Executed Phase

- Phase: Phase 5 — Legacy Token Cleanup + ESLint Plugin
- Plan: plans/260312-0803-ai-agent-rules-gap-analysis/
- Status: completed

## Files Modified

### Part 1: Token Replacement (94 files touched via perl -i)

- All `.tsx` and `.ts` files under `apps/` — bulk in-place edit via perl script
- 340 Tailwind class occurrences replaced (0 remaining)
- 15 CSS custom property refs (`--text-color-*`, `--border-color-*`) preserved intact

### Part 2: ESLint Plugin (new files)

- `packages/eslint-plugin-plane/package.json` — plugin manifest
- `packages/eslint-plugin-plane/index.js` — plugin entry, exports `no-legacy-tokens` rule
- `packages/eslint-plugin-plane/rules/no-legacy-tokens.js` — rule impl with auto-fix (~90 lines)
- `eslint.config.mjs` — registered plugin + rule (warn, excludes tailwind-config)
- `package.json` — added `"eslint-plugin-plane": "workspace:*"` to devDependencies

## Tasks Completed

- [x] Bulk replace all `text-color-`, `border-color-`, `bg-color-` Tailwind class tokens in apps/
- [x] Preserve CSS custom property refs (`var(--text-color-*)`, `bg-(--text-color-*)`)
- [x] Covered `apps/live/` (confirmed clean)
- [x] Created `packages/eslint-plugin-plane/` with `no-legacy-tokens` rule + auto-fix
- [x] Registered plugin in root `eslint.config.mjs`
- [x] Added workspace dep to root `package.json`
- [x] Ran `pnpm install` — symlink created at `node_modules/eslint-plugin-plane`

## Tests Status

- Legacy token grep: **0 remaining** in apps/ .tsx/.ts (excluding CSS vars)
- ESLint spot check on `trend-piece.tsx` (was heavy offender): **0 plane/ warnings**
- ESLint spot check on `create-update-label-inline.tsx` (CSS var refs): **0 false positives**
- Type check / full lint: not run (scope would require full turbo build)

## Replacement Method

Used perl lookbehind `(?<!--)` to match `text-color-`, `border-color-`, `bg-color-` only when NOT preceded by `-` (i.e. not part of `--text-color-` CSS variable names).

## Issues Encountered

- Shell `!` in history expansion broke `perl -e '(?<!-)...'` inline — solved by writing replacement logic to `/tmp/fix_tokens.pl` script and using `perl -i script.pl`
- `pnpm install` skipped workspace link on first run (package not yet in root devDeps) — fixed by adding `"eslint-plugin-plane": "workspace:*"` then reinstalling

## Next Steps

- Task #7: Finalize — review, update plan status, docs update, commit all changes
