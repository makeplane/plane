---
name: ship
description: "Ship workflow: detect + merge base branch, run tests, review diff, bump VERSION, update CHANGELOG, commit, push, create PR, auto-merge and clean up branches once clean. Full rigor by default; `--quick` (or a project's CLAUDE.md `## Ship` config) trims it down."
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Agent
  - AskUserQuestion
  - WebSearch
triggers:
  - ship it
  - create a pr
  - push to main
  - deploy this
---

## When to invoke this skill

Use when asked to "ship", "deploy", "push to main", "create a PR", "merge and push", or "get it deployed".
Proactively invoke this skill (do NOT push/PR directly) when the user says code
is ready, asks about deploying, wants to push code up, or asks to create a PR.

## Step 0: Detect platform and base branch

First, detect the git hosting platform from the remote URL:

```bash
git remote get-url origin 2>/dev/null
```

- If the URL contains "github.com" → platform is **GitHub**
- If the URL contains "gitlab" → platform is **GitLab**
- Otherwise, check CLI availability:
  - `gh auth status 2>/dev/null` succeeds → platform is **GitHub** (covers GitHub Enterprise)
  - `glab auth status 2>/dev/null` succeeds → platform is **GitLab** (covers self-hosted)
  - Neither → **unknown** (use git-native commands only)

Determine which branch this PR/MR targets, or the repo's default branch if no
PR/MR exists. Use the result as "the base branch" in all subsequent steps.

**If GitHub:**
1. `gh pr view --json baseRefName -q .baseRefName` — if succeeds, use it
2. `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` — if succeeds, use it

**If GitLab:**
1. `glab mr view -F json 2>/dev/null` and extract the `target_branch` field — if succeeds, use it
2. `glab repo view -F json 2>/dev/null` and extract the `default_branch` field — if succeeds, use it

**Git-native fallback (if unknown platform, or CLI commands fail):**
1. `git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||'`
2. If that fails: `git rev-parse --verify origin/main 2>/dev/null` → use `main`
3. If that fails: `git rev-parse --verify origin/master 2>/dev/null` → use `master`

If all fail, fall back to `main`.

Print the detected base branch name. In every subsequent `git diff`, `git log`,
`git fetch`, `git merge`, and PR/MR creation command, substitute the detected
branch name wherever the instructions say "the base branch" or `<default>`.

---

## Step 0.5: Resolve ship mode, skip flags, and merge method

1. **Parse invocation flags** from how `/ship` was called:
   - `--quick` — opt into quick mode for this run.
   - `--full` — force full mode for this run, overriding any CLAUDE.md default (rarely needed since full is already the fallback, but useful when a project's CLAUDE.md defaults to quick and this run needs the full pass).
   - `--skip-evals`, `--skip-coverage`, `--skip-plan-check`, `--skip-pre-landing-review`, `--skip-adversarial` — independently skip that one step for this run, regardless of mode. These are always **additive** (they only ever remove a step, never a way to force a step back on that quick mode or CLAUDE.md already skips).

2. **Read the project's CLAUDE.md for a `## Ship` section** (repo root). All fields optional:
   ```
   ## Ship
   Default mode: full
   Skip: plan-check
   Merge method: squash
   ```
   (Example deliberately mixes modes to show `Skip:` isn't just quick-mode shorthand: this project stays in full mode — still gets evals/coverage/pre-landing-review/adversarial by default — but has separately, permanently opted out of the plan-completion audit specifically, e.g. because it never uses plan files. A project that instead wants `Default mode: quick` doesn't need to *also* list `evals, coverage, pre-landing-review, adversarial` under `Skip:` — quick mode already implies those four; `Skip:` is for anything *beyond* what the chosen mode already covers.)
   - `Default mode:` — `quick` or `full`. No `## Ship` section, or no `Default mode:` field → **full**.
   - `Skip:` — comma-separated from `evals`, `coverage`, `plan-check`, `pre-landing-review`, `adversarial`. Absent → none. Applies **regardless of mode**, additively — a full-mode project can still permanently drop one specific step this way, and a quick-mode project can drop `plan-check` too even though quick mode alone doesn't imply it.
   - `Merge method:` — `squash`, `merge`, or `rebase`. Absent → **squash**.

3. **Resolve the effective mode** for this run: invocation `--quick`/`--full` (if given) overrides CLAUDE.md's `Default mode:`; otherwise use CLAUDE.md's value; otherwise **full**.

4. **Resolve the effective skip set** for this run — the union of:
   - Quick mode's implied skips (`evals`, `coverage`, `pre-landing-review`, `adversarial`) **only if** the resolved mode from step 3 is `quick`. **`plan-check` is deliberately not part of this implied set** — Step 8 already self-skips almost instantly when there's no plan file (the common case), so keeping it in quick mode costs effectively nothing; `--skip-plan-check` (or CLAUDE.md's `Skip:` list) remains available for when a plan file *does* exist and you still don't want the audit.
   - CLAUDE.md's `Skip:` list.
   - Any invocation `--skip-*` flags from step 1.

5. **Resolve the merge method** (used by Step 19.5): CLAUDE.md's `Merge method:` if present, else `squash`.

6. **Print the resolved configuration once**, before Step 1: `Ship mode: {quick|full}. Skipping: {comma-list or "none"}. Merge method: {method}.`

This resolved mode/skip-set/merge-method is referenced by name for the rest of the run. Steps 6, 7, 8, 9, and 11 each check the skip set at the very top of their own section file (`references/tests.md`, `references/test-coverage.md`, `references/plan-completion.md`, `references/review-army.md`, `references/adversarial.md`) before doing anything else — if skipped, that section prints one line and hands off to the next step, no partial work. Step 19.5 uses the resolved merge method.

---

# Ship: Fully Automated Ship Workflow

You are running the `/ship` workflow. This is a **non-interactive, fully automated** workflow. Do NOT ask for confirmation at any step. The user said `/ship` which means DO IT. Run straight through and output the PR URL at the end.

**Only stop for:**
- On the base branch (abort)
- Merge conflicts that can't be auto-resolved (stop, show conflicts)
- In-branch test failures (pre-existing failures are triaged, not auto-blocking)
- Pre-landing review always presents its full ticket list for a fix-now-or-defer decision — never auto-applied (see Step 9.2) — unless Step 9 itself was skipped (see below)
- A deferred CRITICAL-severity ticket blocks shipping until fixed now or explicitly overridden (see Step 9.2)
- MINOR or MAJOR version bump needed (ask — see Step 12)
- Greptile review comments always present the full list together for a fix-now/defer/acknowledge/false-positive decision — never auto-applied (see Step 10.2), same ticket-first convention as Step 9.2/Step 11
- Any Greptile-sourced ticket was fixed now this session — stop for re-verification, same as Step 9.2/Step 11 (see Step 10.4)
- A deferred CRITICAL-severity Greptile-sourced ticket blocks shipping until fixed now or explicitly overridden (see Step 10.4), same rule as Step 9.2's own critical-ticket gate
- AI-assessed coverage below minimum threshold (hard gate with user override — see Step 7) — unless Step 7 itself was skipped
- Plan items NOT DONE with no user override (see Step 8) — unless Step 8 itself was skipped
- Plan verification failures (see Step 8.1)
- Merge blocked for a non-CI reason once the PR is up — missing required review, real conflicts, a branch-protection rule (see Step 19.5)

**Never stop for:**
- Uncommitted changes (always include them)
- Version bump choice (auto-pick MICRO or PATCH — see Step 12)
- CHANGELOG content (auto-generate from diff)
- Commit message approval (auto-commit)
- Multi-file changesets (auto-split into bisectable commits)
- Questimus ticket completed-item detection (auto-mark)
- Test coverage gaps within target threshold (auto-generate and commit, or flag in PR body)
- Ship mode / skip-set resolution (Step 0.5 auto-applies CLAUDE.md config + invocation flags, no confirmation needed)
- Merging and deleting the branch once the PR is clean and mergeable (Step 19.5-19.6) — applies in both quick and full mode; only a genuine block (see "Only stop for" above) pauses this

**Skipped steps never produce their own stop conditions.** A skipped Step 7 can't trigger the coverage gate; a skipped Step 9 can't require a ticket fix-now-or-defer decision; a skipped Step 8 can't block on incomplete plan items. This is expected, not a gap — that's what "skip" means. Each skipped step still prints one line saying it was skipped and why (quick mode / a specific `--skip-*` flag / CLAUDE.md config), so it's visible in the run's output even though it didn't execute.

**Re-run behavior (idempotency):**
Re-running `/ship` means "run the whole checklist again" — *for whatever mode and skip set Step 0.5 resolves on this invocation*, which can differ from a prior run's if flags or CLAUDE.md changed in between. Every non-skipped verification step
(tests, coverage audit, plan completion, pre-landing review, adversarial review,
VERSION/CHANGELOG check, Questimus ticket sync, document-release) runs on every invocation.
Only *actions* are idempotent:
- Step 12: If VERSION already bumped, skip the bump but still read the version
- Step 17: If already pushed, skip the push command
- Step 19: If PR exists, update the body instead of creating a new PR
- Step 19.5: If already merged, skip the merge but still attempt Step 19.6's cleanup
Never skip a verification step because a prior `/ship` run already performed it — unless that step is in *this* run's resolved skip set.

---

## Section index — Read each section when its situation applies

This skill is a decision-tree skeleton. The steps below point to on-demand
sections. Read a section in full before doing its step; do not work from memory.

| When | Read this section |
|------|-------------------|
| running the test suites and (if prompt files changed, and not skipped) the eval suites (Steps 4-6) | `references/tests.md` |
| auditing test coverage of the diff (Step 7, unless skipped) | `references/test-coverage.md` |
| auditing plan completion, verification, and scope drift (Step 8, unless skipped) | `references/plan-completion.md` |
| the pre-landing review and specialist dispatch (Step 9, unless skipped) | `references/review-army.md` |
| addressing Greptile review comments when a PR exists (Step 10) | `references/greptile.md` |
| the adversarial review (Step 11, unless skipped) | `references/adversarial.md` |
| writing the CHANGELOG entry (Step 13) | `references/changelog.md` |
| syncing docs, creating/updating the PR/MR, auto-merging, and cleaning up the branch (Steps 18-19.6) | `references/pr-body.md` |

Always read each section file in full even when Step 0.5's skip set might apply — the skip check is the first thing inside the file itself, not a reason to skip *reading* it. Working from memory about which step is skippable is exactly the "don't work from memory" failure this table exists to prevent.

---

## Step 1: Pre-flight

1. Check the current branch. If on the base branch or the repo's default branch, **abort**: "You're on the base branch. Ship from a feature branch."

2. Run `git status` (never use `-uall`). Uncommitted changes are always included — no need to ask.

3. Run `git diff <base>...HEAD --stat` and `git log <base>..HEAD --oneline` to understand what's being shipped.

4. Check review readiness:

### Review Readiness Check

```bash
# Check if review has been run on THIS branch recently
BRANCH=$(git branch --show-current 2>/dev/null)
PY=$(command -v python3 || command -v python || command -v py)
if [ -f .agents/skills/review-fix-technical-code/output/review-log.jsonl ] && [ -n "$PY" ]; then
  # Find most recent review entry for this branch (last 7 days)
  REVIEW_ENTRY=$(tail -50 .agents/skills/review-fix-technical-code/output/review-log.jsonl 2>/dev/null | \
    SHIP_BRANCH="$BRANCH" "$PY" -c "
import sys, json, os
from datetime import datetime, timezone, timedelta
branch = os.environ.get('SHIP_BRANCH', '')
cutoff = datetime.now(timezone.utc) - timedelta(days=7)
entries = []
for line in sys.stdin:
    try:
        e = json.loads(line.strip())
        ts = datetime.fromisoformat(e.get('timestamp','').replace('Z','+00:00'))
        if ts > cutoff and e.get('skill') == 'review-fix-technical-code' and e.get('branch') == branch:
            entries.append(e)
    except Exception:
        pass
if entries:
    last = entries[-1]
    print(f\"REVIEW_STATUS={last.get('status','unknown')} REVIEW_DATE={last.get('timestamp','')} REVIEW_COMMIT={last.get('commit','')}\")
else:
    print('NO_RECENT_REVIEW')
" 2>/dev/null || echo "NO_RECENT_REVIEW")
  echo "$REVIEW_ENTRY"
elif [ -f .agents/skills/review-fix-technical-code/output/review-log.jsonl ]; then
  echo "NO_PYTHON_INTERPRETER"
else
  echo "NO_REVIEW_LOG"
fi
```

Filtering on `e.get('branch') == branch` matters now that the ledger carries a `branch` field: without it, a clean review on a *different* branch would read as clearing readiness for this one. Pass `BRANCH` into the Python process via an env var (`SHIP_BRANCH=$BRANCH "$PY" -c "..."` — same effect, shown inline above via `os.environ.get`) rather than string-interpolating it into the script text, so a branch name containing a quote can't break the embedded Python. `NO_PYTHON_INTERPRETER` (distinct from `NO_RECENT_REVIEW`) means the gate genuinely can't be evaluated — treat that the same as `NO_RECENT_REVIEW` for gating purposes, but don't conflate the two messages when reporting to the user.

If review was run (output shows `REVIEW_STATUS=`):
- Parse the status and date from the output
- Display: "Eng Review: {status} on {date} (commit {sha})"
- Check for staleness: `git rev-list --count {review_commit}..HEAD` — if > 0 commits since review, note: "Note: {N} commits since last review — may be stale"
- If status is "clean": Print "Eng Review: CLEAR — proceeding to ship."
- If status is "issues_found": **Check Step 0.5's resolved skip set first.** If `pre-landing-review` is *not* skipped this run, print "Eng Review: ISSUES FOUND — ship will re-run pre-landing review in Step 9." If it *is* skipped this run (quick mode / `--skip-pre-landing-review` / CLAUDE.md config), print instead: "Eng Review: ISSUES FOUND (open tickets from a prior review) — Step 9 is skipped this run, so these will NOT be addressed or re-checked now." This is informational, not a stop condition — quick mode is still allowed to ship over known open tickets, same as it's allowed to skip the review that would have found them, but silently reusing the "will re-run in Step 9" message when Step 9 isn't actually running this time would be actively misleading. A `"mode":"triage"` entry (tickets were written but nothing fixed yet) always reads as `"issues_found"` here — it never gets its own separate status vocabulary; open tickets awaiting a fix-now-or-defer decision are exactly what "issues found" means for this display.

If no review found:
- Print: "No prior eng review found." If `pre-landing-review` is not skipped this run, add: "— ship will run its own pre-landing review in Step 9." If it is skipped this run, add instead: "— Step 9 is skipped this run (quick mode / config), so this diff won't get an eng review at all before shipping."
- Check diff size: `git diff <base>...HEAD --stat | tail -1`. If the diff is >200 lines, add: "Note: This is a large diff. Consider running `review-fix-technical-code`'s Pre-merge Gate mode or `/plan-dev-review` for architecture-level review before shipping." — this note is worth showing even when Step 9 is skipped this run, arguably more so.

Continue to Step 2 — do NOT block or ask. Ship runs its own review in Step 9, unless Step 9 is skipped this run (see above).

---

## Step 2: Distribution Pipeline Check

If the diff introduces a new standalone artifact (CLI binary, library package, tool) — not a web
service with existing deployment — verify that a distribution pipeline exists.

1. Check if the diff adds a new `cmd/` directory, `main.go`, or `bin/` entry point:
   ```bash
   git diff origin/<base> --name-only | grep -E '(cmd/.*/main\.go|bin/|Cargo\.toml|setup\.py|package\.json)' | head -5
   ```

2. If new artifact detected, check for a release workflow:
   ```bash
   ls .github/workflows/ 2>/dev/null | grep -iE 'release|publish|dist'
   grep -qE 'release|publish|deploy' .gitlab-ci.yml 2>/dev/null && echo "GITLAB_CI_RELEASE"
   ```

3. **If no release pipeline exists and a new artifact was added:** Use AskUserQuestion:
   - "This PR adds a new binary/tool but there's no CI/CD pipeline to build and publish it.
     Users won't be able to download the artifact after merge."
   - A) Add a release workflow now (CI/CD release pipeline — GitHub Actions or GitLab CI depending on platform)
   - B) Defer — create a Questimus ticket (via the questimus skill: type Ticket, state Backlog, no label, assigned to Karol)
   - C) Not needed — this is internal/web-only, existing deployment covers it

4. **If release pipeline exists:** Continue silently.
5. **If no new artifact detected:** Skip silently.

---

## Step 3: Merge the base branch (BEFORE tests)

Fetch and merge the base branch into the feature branch so tests run against the merged state:

```bash
git fetch origin <base> && git merge origin/<base> --no-edit
```

**If there are merge conflicts:** Try to auto-resolve if they are simple (VERSION, schema.rb, CHANGELOG ordering). If conflicts are complex or ambiguous, **STOP** and show them.

**If already up to date:** Continue silently.

---

> **STOP.** Before running the test suites and (if prompt files changed) the eval suites (Steps 4-6), Read `references/tests.md` and execute it in full. Do not work from memory — that section is the source of truth for this step.

> **STOP.** Before auditing test coverage of the diff (Step 7), Read `references/test-coverage.md` and execute it in full. Do not work from memory — that section is the source of truth for this step.

> **STOP.** Before auditing plan completion, verification, and scope drift (Step 8), Read `references/plan-completion.md` and execute it in full. Do not work from memory — that section is the source of truth for this step.

> **STOP.** Before the pre-landing review and specialist dispatch (Step 9), Read `references/review-army.md` and execute it in full. Do not work from memory — that section is the source of truth for this step.

> **STOP.** Before addressing Greptile review comments when a PR exists (Step 10), Read `references/greptile.md` and execute it in full. Do not work from memory — that section is the source of truth for this step.

> **STOP.** Before the adversarial review (Step 11), Read `references/adversarial.md` and execute it in full. Do not work from memory — that section is the source of truth for this step.

## Step 12: Version bump (auto-decide)

1. **Read current version:**
   ```bash
   cat VERSION 2>/dev/null || echo "0.0.0.0"
   ```
   Parse as `MAJOR.MINOR.PATCH.MICRO`. If the format differs (e.g., `MAJOR.MINOR.PATCH`), adapt accordingly — preserve the existing format.

2. **Check if already bumped** (idempotency): Run `git diff <base>...HEAD -- VERSION` to see if VERSION changed on this branch. If it did, read the bumped version and skip to step 4 — the bump was already done.

3. **Decide the bump level** from the diff (agent judgment):
   - **MICRO**: <50 lines, trivial tweaks/config. Auto-pick without asking.
   - **PATCH**: 50+ lines, no feature signals. Auto-pick without asking.
   - **MINOR**: Ask if any feature signal (new route/page, migration, new module), OR 500+ lines.
   - **MAJOR**: Ask — milestones or breaking changes only.

   For MINOR/MAJOR, use AskUserQuestion:
   - Explain the feature signals detected
   - Options: A) MINOR bump (recommended if feature signals exist), B) PATCH bump, C) MAJOR bump (breaking changes only)

4. **Compute new version** from `BUMP_LEVEL`:
   - MICRO: increment last segment (`1.2.3.4` → `1.2.3.5`)
   - PATCH: increment third segment, reset fourth (`1.2.3.4` → `1.2.4.0`)
   - MINOR: increment second segment, reset third and fourth (`1.2.3.4` → `1.3.0.0`)
   - MAJOR: increment first segment, reset all others (`1.2.3.4` → `2.0.0.0`)

5. **Write the bump:**
   ```bash
   echo "$NEW_VERSION" > VERSION
   ```
   If `package.json` exists and has a `"version"` field, update it too:
   ```bash
   # Check if package.json has a version field
   grep -q '"version"' package.json 2>/dev/null && \
     sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json && \
     rm -f package.json.bak
   ```

Store `NEW_VERSION` for use in CHANGELOG (Step 13) and PR title (Step 19).

> **STOP.** Before writing the CHANGELOG entry (Step 13), Read `references/changelog.md` and execute it in full. Do not work from memory — that section is the source of truth for this step.

## Step 14: Questimus ticket sync

Cross-reference the project's Questimus tickets against the changes being shipped (via the questimus skill — `node questimus.js`). Update tickets completed by this PR to Done; create tickets for newly discovered work. If the project has no Questimus connection, skip this step silently.

**1. List the project's open tickets:** `node questimus.js list` (via the questimus skill).

**2. Detect completed tickets:**

This step is fully automatic — no user interaction.

Use the diff and commit history already gathered in earlier steps:
- `git diff <base>...HEAD` (full diff against the base branch)
- `git log <base>..HEAD --oneline` (all commits being shipped)

For each open ticket, check if the changes in this PR complete it by:
- Matching commit messages against the ticket title and description
- Checking if files referenced in the ticket appear in the diff
- Checking if the ticket's described work matches the functional changes

**Be conservative:** Only mark a ticket as completed if there is clear evidence in the diff. If uncertain, leave it alone.

**3. Update completed tickets:** `node questimus.js update <id> --state Done` and comment `**Completed:** vX.Y.Z (YYYY-MM-DD)`.

**4. Create tickets for newly discovered work:** anything the diff surfaces that should be tracked (deferred items, follow-ups) → `node questimus.js create --name ... --desc-file ... --state Backlog --priority <mapped>` (type Ticket, no label, assigned to Karol). Priority mapping: P0→urgent, P1→high, P2→medium, P3→low, P4→none.

**5. Output summary:**
- `Questimus: N tickets marked complete (id1, id2, ...). M tickets remaining.`
- Or: `Questimus: No completed tickets detected. M tickets remaining.`

**6. Defensive:** If Questimus is unreachable, warn the user and continue. Never stop the ship workflow for a ticket-sync failure.

Save this summary — it goes into the PR body in Step 19.

---

## Step 15: Commit (bisectable chunks)

### Step 15.0: WIP Commit Squash (continuous checkpoint mode only)

Check if the branch has WIP commits from auto-checkpointing:

```bash
WIP_COUNT=$(git log <base>..HEAD --oneline --grep="^WIP:" 2>/dev/null | wc -l | tr -d ' ')
echo "WIP_COMMITS: $WIP_COUNT"
```

If `WIP_COUNT` is 0: skip this sub-step entirely.

If `WIP_COUNT` > 0, collect the WIP context first:

```bash
mkdir -p "$(git rev-parse --show-toplevel)/.claude"
git log <base>..HEAD --grep="^WIP:" --format="%H%n%B%n---END---" > \
  "$(git rev-parse --show-toplevel)/.claude/wip-context-before-squash.md" 2>/dev/null || true
```

**Non-destructive squash strategy:**

Check if there are non-WIP commits mixed in:
```bash
NON_WIP=$(git log <base>..HEAD --oneline --invert-grep --grep="^WIP:" 2>/dev/null | wc -l | tr -d ' ')
echo "NON_WIP_COMMITS: $NON_WIP"
```

If `NON_WIP` is 0 (branch is ALL WIP commits):
```bash
git reset --soft $(git merge-base HEAD origin/<base>)
echo "WIP-only branch, reset-soft to merge base. Step 15.1 will create clean commits."
```

If `NON_WIP` > 0 (mixed WIP and non-WIP commits): Use AskUserQuestion to confirm before attempting rebase, explaining that WIP commits need to be squashed into non-WIP commits manually. NEVER blind `git reset --soft` if there are non-WIP commits — it would uncommit real landed work.

### Step 15.1: Bisectable Commits

**Goal:** Create small, logical commits that work well with `git bisect` and help LLMs understand what changed.

1. Analyze the diff and group changes into logical commits. Each commit should represent **one coherent change** — not one file, but one logical unit.

2. **Commit ordering** (earlier commits first):
   - **Infrastructure:** migrations, config changes, route additions
   - **Models & services:** new models, services, concerns (with their tests)
   - **Controllers & views:** controllers, views, JS/React components (with their tests)
   - **VERSION + CHANGELOG + Questimus ticket updates:** always in the final commit

3. **Rules for splitting:**
   - A model and its test file go in the same commit
   - A service and its test file go in the same commit
   - A controller, its views, and its test go in the same commit
   - Migrations are their own commit (or grouped with the model they support)
   - Config/route changes can group with the feature they enable
   - If the total diff is small (< 50 lines across < 4 files), a single commit is fine

4. **Each commit must be independently valid** — no broken imports, no references to code that doesn't exist yet. Order commits so dependencies come first.

5. Compose each commit message:
   - First line: `<type>: <summary>` (type = feat/fix/chore/refactor/docs)
   - Body: brief description of what this commit contains
   - Only the **final commit** (VERSION + CHANGELOG) gets the version tag and co-author trailer:

```bash
git commit -m "$(cat <<'EOF'
chore: bump version and changelog (vX.Y.Z.W)

Co-Authored-By: Claude Sonnet 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Step 16: Verification Gate

**IRON LAW: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

Before pushing, re-verify if code changed at any point after Step 5's test run — not just during Steps 4-6. This now routinely includes Step 7 (coverage-audit test generation), Step 9 (fix-now tickets, each with its own commits), and Step 11 (adversarial-review tickets fixed now) — any of which can land real code changes well after Step 5 already ran:

1. **Test verification:** If ANY code changed after Step 5's test run (fixes from review findings in Steps 7/9/11, CHANGELOG edits don't count), re-run the test suite. Paste fresh output. Stale output from Step 5 is NOT acceptable.

2. **Build verification:** If the project has a build step, run it. Paste output.

3. **Rationalization prevention:**
   - "Should work now" → RUN IT.
   - "I'm confident" → Confidence is not evidence.
   - "I already tested earlier" → Code changed since then. Test again.
   - "It's a trivial change" → Trivial changes break production.

**If tests fail here:** STOP. Do not push. Fix the issue and return to Step 5.

Claiming work is complete without verification is dishonesty, not efficiency.

---

## Step 17: Push

**Idempotency check:** Check if the branch is already pushed and up to date.

```bash
git fetch origin <branch-name> 2>/dev/null
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/<branch-name> 2>/dev/null || echo "none")
echo "LOCAL: $LOCAL  REMOTE: $REMOTE"
[ "$LOCAL" = "$REMOTE" ] && echo "ALREADY_PUSHED" || echo "PUSH_NEEDED"
```

If `ALREADY_PUSHED`, skip the push but continue to Step 18. Otherwise push with upstream tracking:

```bash
git push -u origin <branch-name>
```

**You are NOT done.** The code is pushed but documentation sync and PR creation are mandatory final steps. Continue to Step 18.

---

**PR/MR title invariant (always applies):** Any PR or MR you create OR update in the next step MUST have a title that starts with `v$NEW_VERSION` (the version bumped in Step 12), in the format `v<NEW_VERSION> <type>: <summary>`. The full create/update procedure — including the new auto-merge and branch-cleanup steps that follow PR creation — is in `references/pr-body.md`.

> **STOP.** Before syncing docs, creating or updating the PR/MR, and auto-merging/cleaning up (Steps 18-19.6), Read `references/pr-body.md` and execute it in full. Do not work from memory — that section is the source of truth for this step.

---

## Step 20: Optional Housekeeping (not gated on this PR's merge)

Reached after Step 19.6 (or after Step 19.5's non-blocking auto-merge note, if the merge itself is still pending on CI). This step is **housekeeping, not gated on this PR's merge status** — it cleans
up local branches left over from *other*, already-merged/closed work, not the
branch just shipped (Step 19.6 already handled that one directly). Unlike the rest of ship, it always asks first: deleting
branches reaches beyond the current PR/worktree, so it counts as a genuine
judgment call even in ship's otherwise non-interactive flow.

1. Use AskUserQuestion: "Clean up local branches whose upstream is gone?"
   Options: A) Yes, clean up now, B) No, skip.

2. **If No:** skip the rest of this step, workflow is complete.

3. **If Yes:**
   ```bash
   git fetch --prune
   git branch -v | grep '\[gone\]'
   ```
   For each branch reported as `[gone]`:
   - **Salvage before delete.** Before removing anything, check whether the branch holds unmerged work worth keeping: `git log <base>..<branch> --oneline` and `git diff <base>...<branch> --stat`. If there are commits not reachable from the base branch (i.e. the branch isn't fully merged — a stale `[gone]` tracking state doesn't always mean fully merged), don't just delete it:
     - Extract the unmerged diff into a GitHub/GitLab issue (or a fresh branch if the platform CLI isn't available) so the work isn't lost, referencing the original branch name and last commit SHA.
     - Only then proceed to delete. Never lose unmerged work — deletion is for branches that are either fully merged or confirmed abandoned with nothing worth keeping.
   - Check for an attached worktree: `git worktree list | grep "\[<branch>\]"`.
     If found, remove it first: `git worktree remove --force <worktree-path>`
     (a branch checked out in a worktree can't be deleted until its worktree
     is gone).
   - Delete the branch: `git branch -D <branch>`.

4. Report results: which worktrees were removed, which branches were deleted, and which had unmerged work salvaged to an issue (with links).
   If no `[gone]` branches were found, report that no cleanup was needed.

## Important Rules

- **Non-interactive by default.** The user said /ship — that means do it. Auto-decide MICRO/PATCH bumps, CHANGELOG content, commit messages, and auto-fixable review items. Only pause for genuine judgment calls (MINOR/MAJOR version, failing tests, critical review findings).
- **Idempotent checks, idempotent actions.** Every verification step runs every time. Only the actions (bump, push, PR create) skip if already done.
- **Read sections before executing.** The section files are the source of truth — don't work from memory for complex steps.
- **No push without passing tests.** Step 16 is an iron law.
- **No auto-fixing review findings — pre-landing, adversarial, or Greptile.** Every finding that needs a real code fix (Step 9.2's pre-landing review, Step 11's adversarial review, Step 10.3's actionable Greptile comments) gets a ticket first, then the user explicitly decides fix-now-in-this-session vs defer-to-a-later-ticket-session for each one — there is no classification that applies a fix without asking, regardless of how mechanical it looks or which of the three review sources it came from.
- **PR title must start with version.** `v$NEW_VERSION <type>: <summary>` — no exceptions.
- **Full rigor is the default, always.** `--quick` (or a project's CLAUDE.md `## Ship` config) is opt-in — this is deliberate so you're never surprised by ship quietly doing less than it can; the full path stays the thing you get unless you specifically ask for less, project by project.
- **No parallel `Agent` dispatch anywhere in this skill.** Every subagent this skill spawns (Step 7 coverage audit, Step 8 plan completion, Step 9's Ticket Work cold recheck, Step 10's Greptile classification and its own Ticket Work cold recheck when a comment is fixed now, Step 11 Claude adversarial, Step 18 doc sync) runs one at a time. The one review-fix-technical-code component `/ship` delegates into that *does* dispatch its specialists in parallel (`diff-analysis.md`'s Step 9 specialist stack) is intentionally left as-is for now, under active measurement — not a silent exception, see that file's own notes.
- **Auto-merge and branch cleanup once clean, in both modes.** Once Step 19's PR is up, Step 19.5 merges automatically (or enables the platform's native auto-merge if only pending checks are in the way) unless something is genuinely blocking it — see "Only stop for" above. This isn't quick-mode-only; a full-mode run that comes back clean ships all the way through by default too.
- **Before finishing, invoke the post-run-review skill against this run.**
