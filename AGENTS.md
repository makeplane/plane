# Agent Development Guide

## Commands

- `pnpm dev` - Start all dev servers (web:3000, admin:3001)
- `pnpm build` - Build all packages and apps
- `pnpm check` - Run all checks (format, lint, types)
- `pnpm check:lint` - OxLint across all packages
- `pnpm check:types` - TypeScript type checking
- `pnpm fix` - Auto-fix format and lint issues
- `pnpm turbo run <command> --filter=<package>` - Target specific package/app
- `pnpm --filter=@plane/ui storybook` - Start Storybook on port 6006

## Code Style

- **Imports**: Use `workspace:*` for internal packages, `catalog:` for external deps
- **TypeScript**: Strict mode enabled, all files must be typed
- **Formatting**: oxfmt, run `pnpm fix:format`
- **Linting**: OxLint with shared `.oxlintrc.json` config
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Use try-catch with proper error types, log errors appropriately
- **State Management**: MobX stores in `packages/shared-state`, reactive patterns
- **Testing**: All features require unit tests, use existing test framework per package
- **Components**: Build in `@plane/ui` with Storybook for isolated development

## Backend tests (Docker)

The Django/pytest suite for `apps/api` runs in an isolated stack defined by `docker-compose-test.yml` at the repo root.

Prereq (once): `./setup.sh` — generates `apps/api/.env` from `.env.example`.

- Full suite: `docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests`
- Subset: `docker compose -f docker-compose-test.yml run --rm api-tests pytest -m unit`
- Teardown: `docker compose -f docker-compose-test.yml down -v`

See `apps/api/tests/RUNNING_TESTS.md` for the full walkthrough and troubleshooting; see `apps/api/tests/TESTING_GUIDE.md` for test conventions and fixtures.

## Git workflow: commit, push, merge

Every change lands through the same sequence, no exceptions for "just docs" or "small fix". This is the process the internal custom-fields / contract-project work (see `docs/internal-project-custom-fields.md`) has followed end to end; the one time it was skipped (a direct merge to `preview` plus a follow-up commit made straight on `preview`, bypassing a PR) is exactly the kind of drift this section exists to prevent.

1. **Never commit directly to `preview`.** All work happens on a feature branch (this repo has used one long-lived branch, `claude/repo-code-summary-22f444`, reused across many PRs rather than cut fresh each time -- reusing it is fine, but every commit still goes through steps 2-7 below, and `preview` itself is never a valid commit target).
2. **Before staging**, run `git status --short --branch -uall` and record `git rev-parse HEAD`. In a multi-agent or multi-session checkout, re-run both immediately before the commit and again before the push -- if `HEAD` moved or files changed outside what you intended, stop and reconcile instead of pushing through it.
3. **Stage explicit file paths**, never `git add -A` or `git add .`. List exactly the files the change touched.
4. **Commit with a message that explains what and why**, not just what changed line by line -- link back to the design doc or prior commit it implements when one exists. End the message with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` (adjust the model name to whichever Claude model is authoring the commit).
5. **Push the feature branch itself** (`git push origin <branch>`), never `preview` or any other shared branch directly.
6. **Open a PR against `preview`** with `gh pr create --base preview --head <branch>`, description covering what changed and why, plus a test plan. Do not merge branch-to-branch with a local `git merge` and push -- every change into `preview` goes through a reviewable PR, even a docs-only one.
7. **Check `gh pr view <n> --json state,mergeable,mergeStateStatus`** before merging; only merge when it reports `CLEAN` / `MERGEABLE`.
8. **Merge with `gh pr merge <n> --merge --delete-branch=false`** -- keep the feature branch alive if more work is coming on the same line of development, matching how this repo's internal work has stacked many small PRs on one branch instead of a fresh branch per change.
9. **Each of commit / push / merge needs its own explicit go-ahead in the current turn.** Finishing a change does not imply permission to commit it; committing does not imply permission to push; pushing does not imply permission to merge. Ask (or wait to be asked) at each step rather than bundling them because the previous step went smoothly.
10. **Never bypass this with `--no-verify`, a force-push, or a direct commit/merge into `preview`** -- if a hook fails, fix the underlying issue and recommit; if `preview` needs a change with no corresponding feature-branch history, that is a sign the process broke down upstream, not a reason to patch it directly.
## Internal custom fields (contract + project)

Three invariants introduced by Phase A (commit `260ccae81`, design in `docs/internal-contract-project-relationship.md`, implementation record in `docs/internal-contract-project-relationship-implementation-2026-09.md`). Honour these when touching `apps/api/plane/db/default_data/project_custom_fields.py`, `apps/api/plane/utils/historical_project_import.py`, `apps/api/plane/db/management/commands/import_historical_project_data.py`, or `apps/api/plane/db/models/contract.py`:

1. **Excel parses "合同号" cells as datetime/int — never call generic `coerce_text` on column F of the historical xlsx.** Real data: `datetime(5763, 5, 1)` arrives for a cell that should read `"5763-5"` (124/189 rows). `int(5725)` arrives for `"5725-22"` (4 rows). Always go through `_coerce_contract_cell` in the import command, which has a `_coerce_text` shim that reconstructs `YYYY-M` from midnight-datetimes and stringifies bare ints. Calling the public `coerce_text` helper on contract_no inputs would write `"5763-05-01 00:00:00"` into the DB and silently corrupt uniqueness + display.
2. **`DEFAULT_PROJECT_CUSTOM_FIELDS` no longer mirrors the xlsx A-W column order.** After Phase A retires column A ("合同号&项目号") and moves F/G/H/I/J to Contract / ContractProject, the 17-entry list is in semantic order, not positional. Callers that want header-name column lookup must pass `header_row=` to `parse_row` / `validate_headers`; positional fallback still works for the pure-function unit tests but emits a one-shot stderr warning and is **not** safe for real import runs.
3. **`is_unique_key` is a single-field invariant per project.** Before Phase A, "合同号&项目号" carried `is_unique_key=True`. After Phase A, only "项目序号" should. `seed_default_custom_fields` does not retroactively reset the flag on existing rows — migration `0127_internal_contract_project_is_unique_key_reset.py` is what repairs that. If you add or rename a field that should be workspace-unique, update **both** `DEFAULT_PROJECT_CUSTOM_FIELDS` **and** add a paired RunPython data migration that clears the legacy flag; otherwise old projects will end up with two `is_unique_key=True` fields and `ProjectCustomFieldValueSerializer.validate()`'s uniqueness path will double-select them.
