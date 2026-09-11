---
name: dep-update
description: >
  Automated dependency update loop. Checks all installed packages for newer
  versions, updates them one at a time in risk order (security -> compliance ->
  framework -> integrations -> utilities -> dev tools), raises the floor in
  pyproject.toml, runs the full test suite after each update, commits
  successes, and pins broken packages with an upper bound while writing a
  step-by-step fix plan to docs/dep-update-issues-YYYY-MM-DD.md.
  Usage: /dep-update
allowed-tools: [Read, Edit, Write, Bash, AskUserQuestion]
---

# Automated Dependency Update

Updates Python dependencies one at a time, verifies each with the full test
suite, and either commits the update or pins the package below the breaking
version and logs a fix plan. The feature branch is the only thing touched —
main is never modified.

---

## Step 1 — Pre-flight checks

### 1a. Verify clean working tree

```powershell
git status --porcelain
```

If there are any uncommitted changes, stop immediately and tell the user:

> "Working tree is not clean. Please commit or stash your changes before
> running /dep-update."

### 1b. Discover outdated direct dependencies

```powershell
uv run pip list --outdated --format=columns
```

Parse the output to build a list of `(package, installed_version, latest_version)` tuples.

**Important:** This command lists all packages in the virtualenv, including
transitive dependencies you do not own. After parsing, filter the list to only
packages explicitly declared in `pyproject.toml` under `[project.dependencies]`
or `[project.optional-dependencies].dev`. Discard anything else — transitive
dependencies are managed by uv, not updated manually.

Read `pyproject.toml` now to build the set of direct dependency names before
filtering. When comparing names, normalise both sides: lowercase everything and
treat hyphens and underscores as equivalent (e.g. `PyYAML` -> `pyyaml`,
`pytest_asyncio` -> `pytest-asyncio`, `google_auth_oauthlib` -> `google-auth-oauthlib`).
PyPI considers these name variants identical; a case-sensitive or
hyphen/underscore-sensitive match will silently miss packages.

If no direct dependencies are outdated after filtering, tell the user
"All direct dependencies are up to date." and stop.

---

## Step 2 — Build the ordered update queue

Sort the filtered outdated packages into these risk tiers. Process tier 1
first, tier 6 last. Skip any package not in the outdated list.

| Tier | Packages |
| --- | --- |
| 1 — Security | `cryptography`, `argon2-cffi`, `mnemonic` |
| 2 — Compliance | `arelle-release`, `drafthorse`, `lxml`, `pikepdf`, `weasyprint` |
| 3 — Framework core | `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `pydantic`, `jinja2` |
| 4 — Integrations | `httpx`, `google-api-python-client`, `google-auth-oauthlib`, `google-auth-httplib2`, `anthropic` |
| 5 — Utilities | `apscheduler`, `python-dateutil`, `markdown`, `PyYAML`, `python-multipart`, `sqlcipher3-wheels` |
| 6 — Dev tools | `mypy`, `pytest`, `pytest-asyncio`, `pytest-cov`, `pytest-snapshot`, `hypothesis`, `ruff`, `pip-audit`, `pre-commit` |

Any outdated direct dependency not in the table above goes at the end of Tier 5.

### Present the queue and wait for confirmation

Before doing anything further, output the planned queue in this format and
**wait for the user to confirm before proceeding**:

```text
Planned update queue — N packages:

Tier 1 — Security:
  cryptography  44.0.0 -> 48.0.0

Tier 2 — Compliance:
  arelle-release  2.39.5 -> 2.41.4
  weasyprint      68.1   -> 69.0
  pikepdf         10.5.1 -> 10.7.3

Tier 3 — Framework core:
  fastapi     0.135.3 -> 0.136.3
  sqlalchemy  2.0.48  -> 2.0.50
  pydantic    2.12.5  -> 2.13.4

...

Already up to date (skipped):
  drafthorse  2025.2.0
  lxml        6.1.1

The full test suite (ruff + mypy + pytest) will run after each update.
This will take significant time on a full run. Proceed?
```

---

## Step 3 — Create the feature branch

First, check whether the branch already exists:

```powershell
git branch --list feat/dep-update-YYYY-MM-DD
```

- If the branch does **not** exist: `git checkout -b feat/dep-update-YYYY-MM-DD`
- If the branch **already exists**, ask the user:
  > "Branch feat/dep-update-YYYY-MM-DD already exists. Resume on it, or create
  > feat/dep-update-YYYY-MM-DD-2 for a fresh run?"
  Wait for the answer before continuing. If the user chooses to resume, run
  `git checkout feat/dep-update-YYYY-MM-DD` and proceed to Step 4 starting
  from the first package not yet present as a commit on that branch (check
  `git log --oneline` to see what has already been committed).

Use today's actual date for YYYY-MM-DD.

---

## Step 4 — Update loop

Repeat steps 4a–4e for every package in the queue, in tier order.

### 4a. Raise the floor in pyproject.toml

Read `pyproject.toml` and find the package line. It may appear in either
`[project.dependencies]` (main packages) or `[project.optional-dependencies]`
dev (dev tools such as `mypy`, `pytest`, `ruff`). Update the version floor to
the new latest version in whichever section it lives. Preserve any existing
inline comments.

Examples:

- `"fastapi>=0.116"` -> `"fastapi>=0.136.3"`
- `"cryptography>=44.0"` -> `"cryptography>=48.0.0"`
- `"weasyprint>=65"` -> `"weasyprint>=69.0"`

If the line already has an upper bound that is now stale (below the new floor),
remove it — a stale upper bound is no longer meaningful:

- `"weasyprint>=65,<69"` -> `"weasyprint>=69.0"`

### 4b. Update the lock and sync the environment

```powershell
uv lock --upgrade-package <package-name>
if ($?) { uv sync }
```

If `uv lock --upgrade-package` exits non-zero (dependency resolution conflict),
do **not** run the test suite. Capture the resolver error output and jump
directly to step 4e, using "uv lock conflict" as the failing check name in the
plan file. The pin in step 4e.i should keep the current installed version
(no upgrade attempted), so only the comment and plan file entry are needed —
`pyproject.toml` floor was already raised in 4a, so revert it to the prior
value and leave no upper bound (the package simply wasn't upgraded).

### 4c. Run the full test suite

Run all four checks in order, stopping at the first failure:

```powershell
uv run ruff format .
uv run ruff check .
uv run mypy src/
uv run pytest
```

Capture the exit code and the last 60 lines of output from whichever step
failed first.

### 4d. On success — commit and continue

Stage pyproject.toml, uv.lock, and any source files reformatted by ruff.
`git add -u` is safe here because Step 1a verified the tree was clean before
the skill started, so the only modified tracked files are ones this skill
touched:

```powershell
git add pyproject.toml uv.lock
git add -u
git commit -m @'
chore(deps): update <package> <old_version> -> <new_version>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

Move to the next package.

### 4e. On failure — pin, log, commit, continue

**Do not stop the loop.** Handle the failure as follows, then move to the
next package.

#### i. Revert pyproject.toml — two cases

**Case A — arrived here from a test failure (Step 4c):**
Revert the floor to what it was and add a tight upper bound just below the
breaking version, plus a comment referencing the plan file:

```toml
"weasyprint>=68.1,<69.0"  # 69.0 breaks tests — see docs/dep-update-issues-YYYY-MM-DD.md
```

The upper bound is the breaking version (exclusive), so uv resolves to the
last known-good install.

**Case B — arrived here from a lock conflict (Step 4b):**
Revert the floor to the prior value only. Do not add an upper bound — the
package was never installed at the new version so there is nothing to pin
below. Skip directly to Step 4e.iv after reverting.

#### ii. Restore the lock to the pinned state

```powershell
uv lock
uv sync
```

#### iii. Verify the suite passes with the pin

Run all four checks again. If they now pass, continue to step iv.

If they still fail, stop the entire skill and tell the user:

> "Tests fail even with `<package>` pinned at `<old_version>`. Current state:
> the pin has been written to `pyproject.toml`, `uv sync` has run, but nothing
> has been committed. Run `git diff` to inspect the current changes and
> `git checkout -- .` to discard them if you want to return to the last commit.
> Investigate the pre-existing failure before re-running /dep-update."

#### iv. Write the failure plan

Confirm `docs/` exists (it always does in this project, but verify rather than
assume). Create `docs/dep-update-issues-YYYY-MM-DD.md` if it does not exist,
then append a section for this package.

**Field values differ by case:**

- **Test-failure case:** `Pinned to` = `>=<old_version>,<<new_version>` /
  `Which check failed` = whichever of `ruff format / ruff check / mypy / pytest` failed.
- **Lock-conflict case:** Replace `Pinned to` with
  `Status: floor reverted, no pin — package not installed at new version` /
  `Which check failed` = `uv lock --upgrade-package`.

```markdown
## <package> <old_version> -> <new_version> — BLOCKED

**Date:** YYYY-MM-DD
**Branch:** feat/dep-update-YYYY-MM-DD
**Pinned to:** `>=<old_version>,<<new_version>` (upper bound in pyproject.toml)

### Which check failed

<ruff format / ruff check / mypy / pytest / uv lock --upgrade-package>

### Failing output (last 60 lines)

\`\`\`
<captured output>
\`\`\`

### Likely cause

<1–3 sentence analysis based on the error messages — name the specific
API, import, type error, or test that broke. If the git diff of uv.lock
shows other packages also changed alongside <package>, note them here as
possible co-contributors to the failure.>

### Resolution checklist

- [ ] Read the <package> changelog from <old_version> to <new_version>
- [ ] Check `git diff uv.lock` on the failing commit for transitive dep changes
      (skip if failure was a uv lock conflict — uv.lock was not modified)
- [ ] Identify the breaking API or behaviour change
- [ ] Update affected code in src/ or tests/
- [ ] Remove the upper-bound pin from pyproject.toml
- [ ] Raise the floor: `"<package>>=<new_version>"`
- [ ] Run: `uv lock --upgrade-package <package>`; then `if ($?) { uv sync }`
- [ ] Run full suite (stop at first failure):
  - `uv run ruff format .`
  - `uv run ruff check .`
  - `uv run mypy src/`
  - `uv run pytest`
- [ ] Commit: `chore(deps): update <package> <old_version> -> <new_version>`
```

#### v. Commit

**Test-failure case:** Stage `pyproject.toml` (now contains the upper-bound
pin), `uv.lock` (restored), and the plan file:

```powershell
git add pyproject.toml uv.lock docs/dep-update-issues-YYYY-MM-DD.md
git commit -m @'
chore(deps): pin <package> <old_version> - <new_version> breaks tests

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

**Lock-conflict case:** `pyproject.toml` was reverted to the prior value (net
change from HEAD is zero) and `uv.lock` was never updated. Stage only the plan
file:

```powershell
git add docs/dep-update-issues-YYYY-MM-DD.md
git commit -m @'
chore(deps): skip <package> update - uv lock resolution conflict

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

Move to the next package.

---

## Step 5 — Final report

After the last package is processed, output this summary:

```text
Dependency update complete
Branch: feat/dep-update-YYYY-MM-DD

Updated successfully (N):
  ✅ cryptography     44.0.0  -> 48.0.0
  ✅ arelle-release   2.39.5  -> 2.41.4
  ...

Pinned / blocked (M):
  ⚠️  weasyprint  68.1 -> 69.0   pytest failed  — pinned  >=68.1,<69.0
  ⚠️  mypy        1.13 -> 2.1.0  mypy failed    — pinned  >=1.13,<2.1.0
  ⚠️  somelib     1.0  -> 2.0    lock conflict  — skipped (no pin added)
  Plan: docs/dep-update-issues-YYYY-MM-DD.md

Already up to date (K):
  — drafthorse  2025.2.0
  — lxml        6.1.1

Next steps:
  Merge when ready (use --no-ff to preserve branch history):
    git checkout main
    git merge --no-ff feat/dep-update-YYYY-MM-DD -m "chore(deps): batch dependency updates YYYY-MM-DD"

  Roll back a single update (find commit with git log):
    git revert <commit-hash>

  Roll back everything — branch is preserved, main is untouched:
    git checkout main

  Fix blocked packages:
    See docs/dep-update-issues-YYYY-MM-DD.md — each entry is a self-contained
    fix plan that can be executed in a separate session.
```

Before finishing, invoke the post-run-review skill against this run.

---

## Notes

- Never touch `data/` or `config/config.yaml`.
- Never force-push. Never merge to main without user confirmation.
- `uv.lock` is always committed alongside every `pyproject.toml` change — they
  travel together so any `git revert` restores the exact prior environment.
- `sqlcipher3-wheels` is a native binary wheel; after any update, watch the
  pytest output specifically for SQLCipher connection errors or import failures,
  as these won't always surface as obvious test failures.
- GTK-dependent tests (WeasyPrint) and Java-dependent tests (veraPDF) run as
  part of the full suite — a full update run with many packages will take
  20–40 minutes. This is expected.
- If `ruff format .` modifies files as part of a ruff version update (new
  formatting rules), those reformatted files are staged with `git add -u` and
  included in the ruff update commit — this is correct behaviour.
- When `uv lock --upgrade-package X` runs, uv may also update transitive
  dependencies of X to satisfy new constraints. If tests fail after updating X,
  run `git diff uv.lock` to see which other packages moved — the actual
  breakage may be in a transitive dep rather than X itself. Record this in the
  "Likely cause" section of the plan file.
