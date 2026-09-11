## Step 9: Pre-Landing Review

**Skip-flag check (before anything else):** if `pre-landing-review` is in Step 0.5's resolved skip set (quick mode, `--skip-pre-landing-review`, or CLAUDE.md `Skip: pre-landing-review`), skip this whole step — queue generation, triage, everything — print "Pre-Landing Review skipped (quick mode / --skip-pre-landing-review / CLAUDE.md config)." and continue to Step 10. The PR body's `## Pre-Landing Review` section (Step 19) reflects this as "Skipped (quick mode / config)" rather than a ticket summary. **Step 11's adversarial review runs independently of this skip** (unless *it's* also skipped) — Step 9 being off doesn't imply Step 11 is off too, they're two separate flags for two separate steps.

This step's **queue generation** is `review-fix-technical-code`'s Pre-merge Gate mode (`sections/diff-analysis.md`), run from inside `/ship` rather than standalone — it does not maintain its own copy of the checklist/specialist/confidence/dedup machinery for *finding* issues. A prior version of this file did duplicate that machinery inline, and across several review rounds the two copies drifted (missing checklist categories, a diff-base that mixed two-dot and merge-base semantics, 7 of 11 specialists instead of all 11) — every fix had to land twice and usually only landed once. Delegating queue-generation removes that class of bug.

**What this step is *not*, stated plainly rather than left implicit**: once the queue exists, this step does not classify findings and auto-apply the mechanical-looking ones. An earlier version of this step did exactly that (an AUTO-FIX/ASK split, auto-applying AUTO-FIX items without asking) and it proved unreliable — a fix framed as "mechanical" turned out to be an unreviewed design decision more than once. This step now delegates to `review-fix-technical-code`'s own Ticket Triage and Ticket Work procedures for *every* finding, same as a standalone run: a ticket first, always, then a real human decision on fix-now-vs-defer, then — only for what's fixed now — the full Shared Engine (root-cause confirmation, verification, cold recheck, loop control), not a lighter substitute. The only thing `/ship`-specific about this step is presenting every ticket for that decision inline and gating shipping on the outcome — see Step 9.2.

1. Read `<skill-dir>/sections/checklist.md`. If the file cannot be read, **STOP** and report the error.
2. Run `<skill-dir>/sections/detect-base-branch.md`'s logic (or reuse `<base>` if `/ship` already resolved it earlier in this run) to get the base branch.
3. Run `<skill-dir>/sections/diff-analysis.md` **in full** against that base — this single file covers what used to be duplicated here: get-the-diff (merge-base-relative, not two-dot), the checklist two-pass (all 5 CRITICAL categories, not a shortened 2-item list), confidence calibration, the pre-emit verification gate, the specialist stack/scope detection, specialist selection against all 11 specialists (not a 7-specialist subset), parallel dispatch, collect-and-merge with fingerprint dedup and the PR Quality Score, and the conditional Red Team pass. `diff-analysis.md`'s specialist dispatch already includes Design (`<skill-dir>/sections/design-checklist.md`) conditionally on `SCOPE_FRONTEND` — nothing extra to run here for design findings; DESIGN.md/design-system.md calibration lives inside `design-checklist.md` itself.

The merged, deduped, confidence-gated finding set that `diff-analysis.md` produces **is** this step's findings queue.

## Step 9.1: Ticket-aware dedup

Before triaging findings into tickets, check both prior skipped findings and prior tickets already tracking a finding from an earlier review pass on this branch.

```bash
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
cat .agents/skills/review-fix-technical-code/output/review-log.jsonl 2>/dev/null | grep "\"branch\":\"$CURRENT_BRANCH\"" | grep -E '"mode":"(pre-merge-gate|triage)"' | tail -30
```

Scope to entries whose `branch` field matches the current branch **and** whose `mode` is `"pre-merge-gate"` or `"triage"` — both are `/ship`'s own writes for this gate (the `via:"ship"` field distinguishes them from a standalone `review-fix-technical-code` run, but doesn't change which entries are relevant here). Widened from the old `pre-merge-gate`-only filter because ticket-writing now produces its own `"mode":"triage"` entries that also need to feed this dedup. Entries predating these fields' introduction (no `branch`/`mode` key at all) won't match either, which is correct: treat them as not applicable rather than guessing.

If matching lines exist, parse each JSON line for entries with a `findings` array:
1. Collect fingerprints where `action: "skipped"` — note a skipped finding's own `commit` array is empty (nothing was committed for it), so use the whole-run `commit` field from that same ledger record (not the per-finding one) as that review's reference point. Suppress a current finding matching one of these only if the finding's file path is **not** in `git diff --name-only <prior-review-commit> HEAD` — same file-hasn't-changed-since rule as before.
2. Collect fingerprints where `action: "ticketed"` whose ticket (cross-referenced by fingerprint via `node questimus.js search`) is not yet `Done` — these are already tracked by an open ticket from a prior pass. Don't create a duplicate ticket for them in Step 9.2 below; instead carry them into Step 9.2's decision list as **already-ticketed, still open**, referencing the existing ticket's Questimus identifier rather than minting a new one.

**Never suppress `fixed`/`auto-fixed` fingerprints** — those might regress and should be re-checked, same as `review-fix-technical-code` step 0.

Print: "Suppressed N findings from prior reviews (previously skipped by user). M findings already tracked by an open ticket."

If no prior reviews exist or none have a `findings` array, skip this step silently.

Output a summary header: `Pre-Landing Review: N issues (X critical, Y informational)`

## Step 9.2: Triage, decide, fix-now-or-defer

**No auto-fixing.** Every finding gets a ticket first, and every ticket's disposition — fix now, in this session, or defer to a later `review-fix-technical-code` Ticket Work session — is the user's decision, always, regardless of severity or how mechanical the fix looks. This replaces an earlier version of this step that classified findings AUTO-FIX/ASK and applied AUTO-FIX items directly without asking; that classification proved unreliable in real runs — a design decision framed as "closing a finding" got auto-applied and had to be reverted later. `/ship` now treats every finding the same way `review-fix-technical-code` treats every finding standalone: ticket first, human decides, the real root-cause-and-cold-recheck engine when it's actually worked — not a lighter substitute just because the call came from inside `/ship`.

1. **Triage every finding not already covered by an open ticket (Step 9.1)** using `<skill-dir>/SKILL.md`'s Ticket Triage procedure, T1 through T3, exactly as written there — read that file's Ticket Triage section in full before executing, same "don't work from memory" rule the rest of `/ship` already follows for its own section files — light root-cause diagnosis only (pattern-library check, read the code, `git log`; no repro loop yet), cluster findings sharing a diagnosed cause into one ticket, create each ticket in Questimus via `node questimus.js create` (type Ticket, state Backlog, priority mapped from severity, no label; `source: "pre-merge-gate"` and `branch: <current>` as description content), per-finding severity preserved in the `## Findings` list. **`/ship` overrides Triage's own T4 continue-vs-stop heuristic** — never auto-continue into fixing even a single-item queue. Ship's whole point here is putting every ticket in front of the user for an explicit decision, not silently continuing past it the way a standalone single-item Triage run would.

2. **Order all tickets in play** (freshly triaged this pass, plus any already-open ones surfaced by Step 9.1) critical-first, same as `review-fix-technical-code` T4's ordering.

3. **Present the full list** per the decision convention (`library/preferences/working-with-me/decision-review-format.md` — state plainly, recommend, ask A/B/adjust; `AskUserQuestion` is not used in this vault):
   - One row per ticket: ID, severity, title, one-line summary, `new` or `still open since <date>`.
   - Overall recommendation: fix critical tickets now, defer informational ones — unless the set is small enough that fixing everything now is just as fast, in which case say so instead.
   - Options: **A) Fix ticket(s) now, in this session** (name which) **B) Defer ticket(s) — leave them open, come back to `/ship` after they're resolved** (name which) **C) Mixed — fix some now, defer the rest** (the expected common case on a real PR) **D) adjust**.

4. **For every ticket chosen "fix now"**: claim and work it using `<skill-dir>/SKILL.md`'s Ticket Work procedure, W2 through W4, exactly as written there (same file already read for item 1 above) — claim (`node questimus.js update <id> --state "In Progress"`), enter Shared Engine at step 2 to *confirm* the ticket's hypothesis (build the repro loop; never inherit the hypothesis on trust), fix, verify with real evidence, fresh cold recheck (genuinely fresh `Agent` spawn, same as standalone), close the ticket (`--state Done`). This is the **full** Shared Engine, not a lightweight classify-and-apply pass — root cause, verification, cold recheck, the STOP-and-classify table on any cold-recheck FIXABLE finding, and WTF-likelihood loop control all apply exactly as `review-fix-technical-code` SKILL.md defines them. Work fix-now tickets one at a time, never batched across tickets, even when several were chosen together in one A/B/C answer.

5. **For every ticket chosen "defer"**: leave it in `Backlog`. No further action here — it stays in Questimus for a later `review-fix-technical-code` "work the next ticket" session.

6. **Decide whether to continue shipping:**
   - **Any fix-now ticket was worked this session**: **STOP** once all fix-now tickets are closed. Tell the user to run `/ship` again to re-verify against the now-changed code — do not continue to Step 10 in the same run. (Steps 4-8's earlier verification evidence is now stale against the fixes just made.)
   - **Nothing was fixed this session** (everything deferred, or no issues found) **and no deferred ticket is urgent-priority**: continue to **Step 10** (Greptile — not Step 12; skipping straight to Step 12 would silently drop Step 10's Greptile triage and Step 11's adversarial review).
   - **Nothing was fixed this session and at least one deferred ticket is urgent-priority**: **STOP**. State plainly that shipping is blocked on an unresolved critical finding, name the ticket(s), and recommend fixing now instead of deferring — but if the user explicitly confirms proceeding anyway per the decision convention, continue to Step 10 and note the override in the PR body (Step 19).

7. Output summary: `Pre-Landing Review: N tickets — M fixed now, K deferred (J urgent, L low)`. If no issues found: `Pre-Landing Review: No issues found.`

8. **Persist the review result.** Two kinds of ledger write, both `via:"ship"`, one line per entry (never combined):
   - **If any tickets were triaged/written this pass** (item 1 above): one `"mode":"triage"` entry, same shape as `review-fix-technical-code` T5's write, `findings` array with `"action":"ticketed"` for every fingerprint just written.
   - **For every ticket fixed now** (item 4 above): one `"mode":"pre-merge-gate"` entry per ticket, same shape as `review-fix-technical-code` step 8's write, `"ticket":"<id>"`, `findings` covering that ticket's own finding(s) with their final `action` (`fixed`/`auto-fixed`/`skipped`/`reverted`) and full commit history. This is a **full** Shared Engine ledger entry now, not the old reduced Fix-First-flow entry — don't add a caveat implying it's a lighter pass, because this flow no longer runs one.

   ```bash
   mkdir -p .agents/skills/review-fix-technical-code/output
   echo "{\"skill\":\"review-fix-technical-code\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"mode\":\"MODE\",\"ticket\":\"TICKET_ID_OR_NULL\",\"branch\":\"$(git branch --show-current 2>/dev/null)\",\"status\":\"STATUS\",\"issues_found\":N,\"critical\":N,\"informational\":N,\"quality_score\":SCORE,\"specialists\":SPECIALISTS_JSON,\"findings\":FINDINGS_JSON,\"commit\":\"$(git rev-parse --short HEAD)\",\"via\":\"ship\"}" >> .agents/skills/review-fix-technical-code/output/review-log.jsonl
   ```
   Substitute `MODE` (`"triage"` for the ticket-write entry, `"pre-merge-gate"` for each fix-now ticket's own entry), `TICKET_ID_OR_NULL` (`null` for the triage entry, the actual ticket ID for a fix-now entry), `STATUS` (`"clean"` if every ticket in play this pass got fixed now with no deferrals, else `"issues_found"`), and the rest as `review-fix-technical-code` SKILL.md step 8 already defines them.
   - `quality_score` = the PR Quality Score `diff-analysis.md` computed (triage entry only; a fix-now entry doesn't recompute it — carry the same value forward, or `10.0` if specialists were skipped).
   - `specialists` = the per-specialist stats object `diff-analysis.md` compiled (triage entry only; `{}` on fix-now entries, same as `review-fix-technical-code`'s own non-specialist-dispatching modes).

Save the review output (tickets created, tickets fixed now, tickets deferred) — it goes into the PR body in Step 19, including a list of any still-open deferred tickets so reviewers can see known outstanding follow-up work.

---
