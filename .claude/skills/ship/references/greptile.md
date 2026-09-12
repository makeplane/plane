## Step 10: Address Greptile review comments (if PR exists)

**Dispatch the fetch + classification as a subagent** (fresh context, general-purpose persona). The subagent pulls every Greptile comment, runs the escalation detection algorithm, and classifies each comment. Parent receives a structured list and handles the decision, ticketing, fixing, and replies.

**Subagent prompt:**

> You are classifying Greptile review comments for a /ship workflow. Read `<skill-dir>/sections/greptile-triage.md` and follow the fetch, filter, classify, and **escalation detection** steps. Do NOT fix code, do NOT reply to comments, do NOT commit — report only.
>
> For each comment, assign: `classification` (`valid_actionable`, `already_fixed`, `false_positive`, `suppressed`), `escalation_tier` (1 or 2 — this governs reply *tone*, friendly vs. firm; it is not a severity signal), the file:line or [top-level] tag, body summary, and permalink URL.
>
> If no PR exists, `gh` fails, the API errors, or there are zero comments, output: `{"total":0,"comments":[]}` and stop.
>
> Otherwise, output a single JSON object on the LAST LINE of your response:
> `{"total":N,"comments":[{"classification":"...","escalation_tier":N,"ref":"file:line","summary":"...","permalink":"url"},...]}`

**Parent processing:**

Parse the LAST line as JSON.

If `total` is 0, skip this step silently. Continue to Step 12.

Otherwise, print: `+ {total} Greptile comments ({valid_actionable} valid, {already_fixed} already fixed, {false_positive} FP)`.

## Step 10.1: Handle the no-decision buckets directly

**VALID BUT ALREADY FIXED:** no decision needed, no ticket. Reply using the **Already Fixed reply template** from `greptile-triage.md` (tier 1 or 2 per escalation detection) — include what was done and the fixing commit SHA. Save to per-project greptile-history (type: already-fixed).

**SUPPRESSED:** skip silently — these are known false positives from previous triage, already recorded.

## Step 10.2: Present every actionable/false-positive comment together for one decision

Every remaining comment (`valid_actionable` and `false_positive`) needs a human decision — present them **together**, per the decision convention (`library/preferences/working-with-me/decision-review-format.md` — state plainly, recommend, ask A/B/adjust; the ask tool is not used in this vault, same rule as Step 9.2 and Step 11), not as separate per-comment prompts. **Mirror Step 9.2's own fix-now/defer shape exactly** — the earlier version of this section didn't, and that was a bug (see Step 10.3):

**Note on ordering vs. Step 9.2**: Step 9.2 runs Ticket Triage (bundling + real severity judgment) *before* presenting its decision table, so that table shows real severity per ticket. This section deliberately doesn't — ticketing every raw comment before the human has even confirmed it's not a false positive would ticket things that turn out not to need a ticket at all. Ticketing here happens *after* the decision (Step 10.3), scoped to whatever the human actually chose to act on — bundling still happens then, via the same Ticket Triage T1-T3, just not previewed in this table the way Step 9.2's is. What this section can't skip, though, is giving the recommendation something real to stand on:

- One row per comment: classification, file:line or [top-level], body summary, permalink, **and a lightweight severity call** — not a full Ticket Triage T1 pass, just your own read of the comment: does this look like a real bug/security/correctness problem (call it critical-leaning), or a style/minor nit (informational-leaning)? State it plainly as a judgment call, not a formal classification — the real severity gets properly assigned once Step 10.3's Ticket Triage actually runs on whatever gets ticketed.
- Per-comment options:
  - **`valid_actionable`**: A) Fix now, in this session  B) Defer — ticket it, fix in a later session  C) Acknowledge — not going to fix, ship anyway  D) Actually a false positive
  - **`false_positive`**: A) Reply explaining the false positive (recommended if clearly wrong)  B) Fix it anyway now (if trivial)  C) Defer — ticket it, fix in a later session  D) Ignore silently
- Overall recommendation, using that severity read the same way Step 9.2 does: fix critical-leaning comments now, defer informational-leaning ones — unless the set is small enough that fixing everything now is just as fast, in which case say so instead.

## Step 10.3: Route the decisions

**Every comment marked "fix now" or "defer"** (options A/B under `valid_actionable`, options B/C under `false_positive`) needs a ticket. **Run Ticket Triage T1-T3 as two separate passes — one over the "fix now" comments, one over the "defer" comments — never one combined pass over both.** Bundling here happens *after* the fix-now/defer decision, not before (see Step 10.2's note on ordering), which means Ticket Triage's own root-cause-based clustering (T2) could otherwise merge a "fix now" comment and a "defer" comment into one ticket purely because they share a diagnosed cause — leaving that one ticket with two conflicting dispositions. Running the two groups through Triage separately makes that structurally impossible: a bundle can only ever contain findings that already share the same disposition. Use `<skill-dir>/SKILL.md`'s Ticket Triage procedure, T1 through T3, same as Step 9.2 already does — `node questimus.js create` (type Ticket, state Backlog, priority from severity, no label; `source: "greptile"` and `branch: <current>` as description content), for both passes.

- **For every ticket marked "fix now"**: claim (`node questimus.js update <id> --state "In Progress"`) and work it using Ticket Work (W2-W4, full Shared Engine — root-cause confirmation, verify, cold recheck), one ticket at a time, never batched — **regardless of how many were chosen**, same as Step 9.2 item 4: there is no count threshold that turns a "fix now" choice into a deferral. Once each is fixed (`--state Done`): reply using the **Fix reply template** from `greptile-triage.md` (include inline diff + explanation + the fix commit SHA), save to per-project greptile-history (type: fix).
- **For every ticket marked "defer"**: leave it in `Backlog`, no fixing here. Post a lightweight acknowledgment reply immediately — "Acknowledged, tracked for a follow-up fix" (tier 1/2 tone per escalation detection) — don't leave the PR comment thread silent until some later session eventually closes the ticket. Save to per-project greptile-history (type: `ticketed` — see `greptile-triage.md`'s Suppressions Check, extended this session specifically for this case).

**Comments marked "acknowledge, don't fix"** (option C under `valid_actionable`): no ticket, permanent decline — not the same as "defer," which still intends to fix it eventually. Reply with a brief acknowledgment that it was reviewed and intentionally not fixed (not urgent enough to block shipping) — save to per-project greptile-history (type: acknowledged), same completeness principle as every other disposition getting a history record.

**Comments marked "recategorize as false positive"** (option D under `valid_actionable`): route into the same handling as a `false_positive` comment whose chosen option is A — reply using the **False Positive reply template** (include evidence + suggested re-rank), save to per-project greptile-history (type: fp).

**Comments marked "reply, false positive"** (option A under `false_positive`): reply using the **False Positive reply template** from `greptile-triage.md` (include evidence + suggested re-rank), save to per-project greptile-history (type: fp).

**Comments marked "ignore silently"** (option D under `false_positive`): no reply, no ticket, no history write — genuinely a no-op, same as before.

## Step 10.4: Decide whether to continue shipping

Same three-way decision Step 9.2 uses, not just the first two:

- **Any ticket was fixed now this session**: **STOP** once every fix-now ticket is closed. Tell the user to run `/ship` again to re-verify against the now-changed code — do not continue to Step 12 in the same run. Same reasoning as Step 9.2/Step 11: the earlier steps' verification evidence is now stale against the fixes just made.
- **Nothing was fixed this session** (everything deferred, acknowledged, replied-as-false-positive, already-fixed, suppressed, or ignored) **and no deferred ticket is urgent-priority**: continue to **Step 12**.
- **Nothing was fixed this session and at least one deferred ticket is urgent-priority**: **STOP**. State plainly that shipping is blocked on an unresolved critical Greptile-sourced finding, name the ticket(s), and recommend fixing now instead of deferring — but if the user explicitly confirms proceeding anyway per the decision convention, continue to Step 12 and note the override in the PR body (Step 19), same handling as Step 9.2's own override case.

---
