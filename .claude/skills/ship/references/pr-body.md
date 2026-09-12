## Step 18: Documentation sync (via subagent, before PR creation)

**Dispatch /document-release as a subagent** (fresh context window, general-purpose persona). The subagent gets a fresh context window — zero rot from the preceding 17 steps. It also runs the **full** `/document-release` workflow rather than a weaker reimplementation.

**Sequencing:** This step runs AFTER Step 17 (Push) and BEFORE Step 19 (Create PR). The PR is created once from final HEAD with the `## Documentation` section baked into the initial body.

**Subagent prompt:**

> You are executing the /document-release workflow after a code push. Read the full skill file `<harness-config-dir>/skills/document-release/SKILL.md` and execute its complete workflow end-to-end, including CHANGELOG clobber protection, doc exclusions, risky-change gates, and named staging. Do NOT attempt to edit the PR body — no PR exists yet. Branch: `<branch>`, base: `<base>`.
>
> After completing the workflow, output a single JSON object on the LAST LINE of your response (no other text after it):
> `{"files_updated":["README.md","CLAUDE.md",...],"commit_sha":"abc1234","pushed":true,"documentation_section":"<markdown block for PR body's ## Documentation section>"}`
>
> If no documentation files needed updating, output:
> `{"files_updated":[],"commit_sha":null,"pushed":false,"documentation_section":null}`

**Parent processing:**

1. Parse the LAST line of the subagent's output as JSON.
2. Store `documentation_section` — Step 19 embeds it in the PR body (or omits the section if null).
3. If `files_updated` is non-empty, print: `Documentation synced: {files_updated.length} files updated, committed as {commit_sha}`.
4. If `files_updated` is empty, print: `Documentation is current — no updates needed.`

**If the subagent fails or returns invalid JSON:** Print a warning and proceed to Step 19 without a `## Documentation` section. Do not block /ship on subagent failure. The user can run `/document-release` manually after the PR lands.

---

## Step 19: Create PR/MR

**Idempotency check:** Check if a PR/MR already exists for this branch.

**If GitHub:**
```bash
gh pr view --json url,number,state -q 'if .state == "OPEN" then "PR #\(.number): \(.url)" else "NO_PR" end' 2>/dev/null || echo "NO_PR"
```

**If GitLab:**
```bash
glab mr view -F json 2>/dev/null | jq -r 'if .state == "opened" then "MR_EXISTS" else "NO_MR" end' 2>/dev/null || echo "NO_MR"
```

If an **open** PR/MR already exists: **update** the PR body using `gh pr edit --body-file "$PR_BODY_FILE"` (GitHub) or `glab mr update -d ...` (GitLab). Always regenerate the PR body from scratch using this run's fresh results (test output, coverage audit, review findings, adversarial review, Questimus ticket summary, documentation_section from Step 18). Never reuse stale PR body content from a prior run.

**PR title format:** Any PR or MR you create OR update MUST have a title starting with `v$NEW_VERSION` in the format `v<NEW_VERSION> <type>: <summary>`. If the existing title doesn't start with the current version, update it:
1. Read the current title: `CURRENT=$(gh pr view --json title -q .title)`
2. If title already starts with `v$NEW_VERSION`, leave it as-is.
3. If title has a different `v<X.Y.Z.W>` prefix, replace the version part.
4. If title has no version prefix, prepend `v$NEW_VERSION `.

If no PR/MR exists: create a pull request (GitHub) or merge request (GitLab) using the platform detected in Step 0.

The PR/MR body should contain these sections:

```
## Summary
<Summarize ALL changes being shipped. Run `git log <base>..HEAD --oneline` to enumerate
every commit. Exclude the VERSION/CHANGELOG metadata commit (that's this PR's bookkeeping,
not a substantive change). Group the remaining commits into logical sections (e.g.,
"**Performance**", "**Dead Code Removal**", "**Infrastructure**"). Every substantive commit
must appear in at least one section. If a commit's work isn't reflected in the summary,
you missed it.>

## Test Coverage
<If Step 7 was skipped (Step 0.5's resolved skip set): "Skipped (quick mode / --skip-coverage / CLAUDE.md config).">
<Otherwise: coverage diagram from Step 7, or "All new code paths have test coverage.">
<If Step 7 ran: "Tests: {before} → {after} (+{delta} new)">

## Pre-Landing Review
<If Step 9 was skipped (Step 0.5's resolved skip set): "Skipped (quick mode / --skip-pre-landing-review / CLAUDE.md config). Not independently reviewed beyond Steps 5/16's test runs.">
<Otherwise, Step 9's summary: "N tickets — M fixed now, K deferred (J urgent, L low)", or "No issues found."
 If any tickets remain open (deferred this run, or already open from a prior pass): list them —
 "**Open tickets** (not fixed in this PR): <Questimus identifier> informational — <title>, ..."
 — so reviewers can see known outstanding follow-up work rather than assuming a clean review.
 If a CRITICAL-severity ticket was deferred with an explicit override (Step 9.2 item 6's last case),
 call that out explicitly: "**⚠ Shipped with an unresolved CRITICAL ticket**: <Questimus identifier> — <title> (deferred by explicit override)." >

## Design Review
<If Step 9 was skipped, Design findings were skipped along with it — omit this section entirely rather than printing a misleading "skipped" line redundant with Pre-Landing Review above.>
<Otherwise: Design findings are part of the same Step 9 queue and ticket flow as everything else (diff-analysis.md's Design specialist, dispatched on SCOPE_FRONTEND) — not a separately auto-fixed pass. If design findings were in this run's queue: "Design Review (lite): N findings — M fixed now, K deferred. AI Slop: clean/N issues.">
<If no frontend files changed: "No frontend files changed — design review skipped.">

## Adversarial Review
<If Step 11 was skipped (Step 0.5's resolved skip set): "Skipped (quick mode / --skip-adversarial / CLAUDE.md config).">
<Otherwise: the ADVERSARIAL REVIEW SYNTHESIS block from Step 11.>

## Eval Results
<If evals ran: suite names, pass/fail counts, cost dashboard summary.>
<If skipped because no prompt-related files changed: "No prompt-related files changed — evals skipped.">
<If skipped because `evals` was in Step 0.5's resolved skip set (this check happens before the prompt-file check inside Step 6, so it takes precedence): "Skipped (quick mode / --skip-evals / CLAUDE.md config) — not checked against prompt-related files this run.">

## Greptile Review
<If Greptile comments were found: bullet list with [FIXED] / [TICKETED] / [ACKNOWLEDGED] / [FALSE POSITIVE] / [ALREADY FIXED] / [IGNORED] tag (per Step 10.3's outcome routing) + one-line summary per comment. A [TICKETED] entry links its ticket: "[TICKETED] <Questimus identifier> — <summary>" — same reasoning as the Pre-Landing Review section above, so reviewers can see what's still open rather than assuming every comment was resolved.>
<If no Greptile comments found: "No Greptile comments.">
<If no PR existed during Step 10: omit this section entirely>

## Scope Drift
<If scope drift ran: "Scope Check: CLEAN" or list of drift/creep findings>
<If no scope drift: omit this section>

## Plan Completion
<If Step 8 was skipped (Step 0.5's resolved skip set — `--skip-plan-check` or CLAUDE.md `Skip: plan-check`; note quick mode does NOT imply this skip by default): "Skipped (--skip-plan-check / CLAUDE.md config).">
<Otherwise, if plan file found: completion checklist summary from Step 8>
<Otherwise, if no plan file: "No plan file detected.">
<If plan items deferred: list deferred items>

## Linked Spec
<Auto-detect: look for /spec archives matching this branch:
  CURRENT_BRANCH=$(git branch --show-current)
  SPEC_DIR="<harness-config-dir>/spec-archives"
  SPEC_FILE=$(grep -rl "^spec_branch: $CURRENT_BRANCH$" "$SPEC_DIR"/*.md 2>/dev/null | head -1)
  [ -z "$SPEC_FILE" ] && exit  # no spec; omit this section entirely
  SPEC_ISSUE=$(grep "^spec_issue_number:" "$SPEC_FILE" | cut -d' ' -f2)
  [ -z "$SPEC_ISSUE" ] && exit  # spec archive exists but no issue number; omit

  # CONDITIONAL resolve: only add "Resolves" when Plan Completion above is "complete".
  # If plan completion reports deferred or failed items, emit:
  #   "Linked to <Questimus identifier> (partial delivery — NOT auto-resolving; resolve manually after follow-up)"
  # If Plan Completion is fully complete, emit:
  #   "Resolves <Questimus identifier>">

<Format:
  Resolves <Questimus identifier>

  This PR delivers the spec at <archive path relative to repo root>.
  Spec filed: <spec_filed_at from frontmatter>>

<If partial delivery, emit instead:
  Linked to <Questimus identifier> (partial delivery — not auto-resolving).
  Deferred items: <list from Plan Completion>.
  Resolve <Questimus identifier> manually after follow-up lands.>

<If no /spec archive matches this branch: omit this entire section.>

## Verification Results
<If verification ran: summary from Step 8.1 (N PASS, M FAIL, K SKIPPED)>
<If skipped: reason (no plan, no server, no verification section)>
<If not applicable: omit this section>

## Questimus Tickets
<If tickets were marked complete this PR: bullet list of completed tickets with version>
<If no tickets completed: "No Questimus tickets completed in this PR.">
<If tickets were created this PR: bullet list of the new tickets (Backlog)>
<If no tickets were touched: omit this section>

## Documentation
<Embed the `documentation_section` string returned by Step 18's subagent here, verbatim.>
<If Step 18 returned `documentation_section: null` (no docs updated), omit this section entirely.>

## Test plan
- [x] All Rails tests pass (N runs, 0 failures)
- [x] All Vitest tests pass (N tests)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**If GitHub:** write the body to a temp file and create from it:

```bash
PR_BODY_FILE=$(mktemp)
cat > "$PR_BODY_FILE" <<'PR_BODY_EOF'
<PR body from above>
PR_BODY_EOF
gh pr create --base <base> --title "v$NEW_VERSION <type>: <summary>" --body-file "$PR_BODY_FILE"
rm -f "$PR_BODY_FILE"
```

**If GitLab:**

```bash
glab mr create -b <base> -t "v$NEW_VERSION <type>: <summary>" -d "$(cat <<'EOF'
<MR body from above>
EOF
)"
```

**If neither CLI is available:**
Print the branch name, remote URL, and instruct the user to create the PR/MR manually via the web UI. Do not stop — the code is pushed and ready. **Skip Step 19.5 below** (it needs `gh`/`glab` to check mergeability and merge) — go straight to Step 20 after printing the manual-PR instructions.

**Output the PR/MR URL** — then proceed to Step 19.5.

---

## Step 19.5: Auto-merge (if clean)

Applies in **both** quick and full mode — auto-merge-on-clean isn't gated by ship mode, only by actual mergeability. Uses the merge method Step 0.5 resolved (`squash` by default, or CLAUDE.md's `Merge method:`).

**Idempotency check first, before attempting anything:**
```bash
gh pr view --json state -q .state 2>/dev/null
```
(GitLab: `glab mr view -F json 2>/dev/null | jq -r .state`)

If this reports **already merged** (GitHub `MERGED`; GitLab `merged`) — a re-run of `/ship` after a prior run already completed the merge, possibly in a session that then stopped before Step 19.6 ran — **skip the merge attempt entirely** (don't even try `gh pr merge`; it would just fail with "pull request is already merged" and get misclassified as a block by the logic below). Go straight to **Step 19.6** to finish any cleanup that didn't happen last time — that step's own commands are themselves safe to re-run against an already-gone branch (see its notes).

**Otherwise, attempt the merge directly — don't pre-classify from `mergeStateStatus` first.** An earlier version of this step tried to read GitHub's `mergeStateStatus` field and sort it into "clean" / "pending checks" / "blocked" before deciding what to do. That doesn't actually work reliably: `mergeStateStatus=BLOCKED` covers both "a required check is still running" and "a required check already failed (or review is missing)" — the same enum value, two completely different situations — so a pre-classification step can't tell them apart without also querying individual check states and branch-protection rules, which is a lot of extra API surface to get right. GitHub's own `gh pr merge` command already has to resolve this correctly to do its job; use *its* answer as ground truth instead of re-deriving it:

**If GitHub:**
```bash
gh pr merge --<method> --delete-branch 2>&1
```
(`<method>` is `--squash`, `--merge`, or `--rebase`, from the resolved merge method.)

**If GitLab:**
```bash
glab mr merge --<method> --remove-source-branch 2>&1
```

**Interpret the result:**

1. **Command succeeds (exit 0):** the PR was clean and is now merged. Continue to **Step 19.6**.

2. **Command fails, and the error text indicates a required check is still pending/in-progress/queued** (GitHub: phrasing like "not all required status checks have passed", "in progress", "expected — waiting for status to be reported"; GitLab: pipeline running / "merge when pipeline succeeds" applicable): don't make this session wait on CI — enable the platform's native auto-merge instead:
   - GitHub: `gh pr merge --auto --<method> --delete-branch`
   - GitLab: `glab mr merge --auto-merge --<method> --remove-source-branch`

   Print: "Auto-merge enabled ({method}) — will complete once required checks pass. Branch will be deleted automatically on merge." **Do not proceed to Step 19.6** this run — the remote branch will be deleted by the platform once the merge actually completes; local cleanup happens naturally on a future `/ship` or `/project-sync` run, since Step 20's existing `git fetch --prune` + `[gone]`-branch sweep already picks up a branch once its remote is gone. Continue to Step 20.

   **If this `--auto` command itself also fails** (most commonly GitHub reporting auto-merge isn't enabled for this repository — a repo-level setting `gh` can't turn on for you): fall back to polling instead of failing the run — recheck with a plain (non-`--auto`) merge attempt every ~60 seconds, up to ~10 attempts (~10 minutes), succeeding the moment checks clear. If still not clean after the cap, stop and report the same way as case 3, plus note that enabling "Allow auto-merge" in the repo's settings would let this resolve itself next time without polling.

3. **Command fails for any other reason** (missing required review approval, real merge conflicts, a branch-protection rule, a check that already failed rather than one still running): **STOP**. Print the exact error text from the failed command, verbatim — don't paraphrase away the specific reason, and don't guess whether it's transient. Do not attempt to merge or delete anything, and do not retry automatically. This is genuine "issues need to be handled first" territory.

**Telling case 2 from case 3 from error text alone is inherently a bit heuristic** — GitHub and GitLab don't return a single unambiguous machine-readable "this is just pending, try again later" signal from the merge command itself. When the wording genuinely doesn't match either pattern confidently, default to case 3 (stop and show the user the raw error) rather than guessing case 2 and silently leaving an auto-merge queued that may never actually resolve as expected — a false "still pending" guess just means one keystroke to retry later; a false "just enable auto-merge" guess on a PR that's actually blocked for a real reason means it silently never merges and nobody notices.

## Step 19.6: Delete the shipped branch (local + remote)

Reached either from Step 19.5's case 1 (synchronous merge just happened) or from its idempotency check (PR was already merged by a prior run — this run is just finishing cleanup that may or may not have already happened). Case 2 (auto-merge pending) and case 3 (blocked) skip this step for now, as noted above.

```bash
git checkout <base>
git pull origin <base>
git branch -D <branch-name> 2>&1 || echo "Local branch already gone — nothing to delete."
```

**Treat "branch not found" from that last command as success, not failure** — reached via the idempotency path, the branch may well have already been deleted by whichever earlier run actually did the merge. Don't report an error for it; just note the branch was already clean.

**Force-delete (`-D`), not safe-delete (`-d`), and this is deliberate, not a shortcut.** `git branch -d`'s "is this merged" check is ancestry-based — it looks for the branch tip as a reachable commit on `<base>`. A **squash** merge (the default method here) creates a brand-new commit on `<base>` that doesn't contain the feature branch's tip as an ancestor at all; a **rebase** merge replays the commits with new SHAs, same problem. In both cases `-d` would refuse with "not fully merged" even though the code is safely landed — only a plain merge-commit (`--merge`) preserves the ancestry `-d` checks for. Since Step 19.6 only ever runs *after* Step 19.5's merge command already reported success (case 1), that's the real confirmation the branch is landed — `-D` here isn't overriding a legitimate safety check, it's working around `-d`'s check being the wrong tool for a squash/rebase merge.

**Don't issue a second remote-delete command** — Step 19.5's `--delete-branch`/`--remove-source-branch` flag already handled the remote branch server-side as part of the merge. **Exception**: if neither `gh` nor `glab` was available and the merge happened via a manual/git-native path, delete the remote branch explicitly here: `git push origin --delete <branch-name>`.

Report: "Shipped and merged. Branch `<branch-name>` deleted (local + remote)." Continue to Step 20.

---
