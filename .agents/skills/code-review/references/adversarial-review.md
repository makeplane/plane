---
name: adversarial-review
description: Stage 3 red-team review that actively tries to break code — finds security holes, false assumptions, failure modes, race conditions. Spawns adversarial reviewer subagent with destructive mindset. Includes scope gate for trivial changes.
---

# Adversarial Review (Stage 3)

Runs after every Stage 2 (Code Quality) pass. Subject to scope gate below.

## Scope Gate

Skip adversarial review when ALL of these are true:
- Changed files <= 2
- Lines changed <= 30
- No security-sensitive files touched (auth, crypto, input parsing, SQL, env)
- No new dependencies added

When skipped, note: `Adversarial: skipped (below threshold)` in review output.

**NEVER skip when:**
- Any file in: `auth/`, `middleware/`, `security/`, `crypto/`
- `package.json`, `package-lock.json`, or lockfile changed
- Environment variables added/changed
- Database schema modified
- API route added/changed

## Mindset

> "You are hired to tear apart the implementer's work. Your job is to find every way this code can fail, be exploited, or produce incorrect results. Assume the implementer made mistakes. Prove it."

This is NOT a standard code review. Standard reviews check if code meets requirements. Adversarial review assumes requirements are met and asks: **"How can this still break?"**

## What to Attack

### Security Holes
- Injection vectors (SQL, command, XSS, template)
- Auth bypass paths (missing checks, privilege escalation)
- Secrets exposure (logs, error messages, stack traces)
- Input trust boundaries (user input treated as safe)
- SSRF, path traversal, deserialization attacks

### False Assumptions
- "This will never be null" -- prove it can be
- "This list always has elements" -- find the empty case
- "Users always call A before B" -- find the out-of-order path
- "This config value exists" -- find the missing env var
- "This third-party API always returns 200" -- find the failure mode
- "This API shape won't change" -- find the breaking caller

### Failure Modes & Resource Exhaustion
- What happens when disk is full?
- What happens when network times out mid-operation?
- What happens when the database connection drops during a transaction?
- Unbounded allocations from user-controlled input
- Missing timeouts on external calls
- Event loop blocking (sync operations in async context)
- Connection/handle leaks on error paths
- Regex catastrophic backtracking (ReDoS)

### Race Conditions
- Shared mutable state without locks
- Time-of-check-to-time-of-use (TOCTOU)
- Async operations with implicit ordering assumptions
- Cache invalidation during concurrent writes

### Data Corruption
- Partial writes on failure (no transaction/rollback)
- Type coercion surprises (string "0" as falsy)
- Floating point comparison for equality
- Timezone-naive datetime operations

### Supply Chain & Dependencies
- New dependencies: postinstall scripts, maintainer reputation, bundle size
- Lockfile changes: version drift, removed integrity hashes
- Transitive deps pulling in known-vulnerable packages

### Observability Blind Spots
- Swallowed errors (`catch {}` with no log)
- Missing structured context in error logs
- PII in log output

## Process

### 1. Spawn Adversarial Reviewer

Dispatch `code-reviewer` subagent with adversarial prompt:

```
You are an adversarial code reviewer. Your ONLY job is to find ways this code
can fail, be exploited, or produce incorrect results.

DO NOT praise the code. DO NOT note what works well.
ONLY report problems. If you find nothing, say "No findings" -- but try harder first.

Focus on ADDED/MODIFIED lines (+ prefix in diff). Pre-existing code is out of scope
unless the change makes it newly exploitable.

Context (read for understanding, DO NOT review):
{CONTEXT_FILES}

Runtime: {RUNTIME} (e.g., Node.js single-threaded, browser, serverless)
Framework: {FRAMEWORK} (e.g., Express with global error handler at app.ts:45)

Review this diff:
{DIFF}

Changed files: {FILES}

Attack vectors to check:
1. Security holes (injection, auth bypass, secrets exposure)
2. False assumptions (null, empty, ordering, config, API contracts)
3. Failure modes + resource exhaustion (timeouts, leaks, unbounded input)
4. Race conditions (shared state, TOCTOU, async ordering)
5. Data corruption (partial writes, type coercion, encoding)
6. Supply chain (new deps, lockfile changes, transitive vulns)
7. Observability (swallowed errors, missing logs, PII in output)

For each finding, report:
- SEVERITY: Critical / Medium / Low
- CATEGORY: Security / Assumption / Failure / Race / Data / Supply / Observability
- LOCATION: file:line
- ATTACK: How to trigger the problem
- IMPACT: What happens when triggered
- FIX: Describe the fix approach (e.g., "add null check before line 42").
  Do NOT write implementation code -- the implementer has full context.
```

**If adversarial produces >10 findings on <100 lines changed:** likely too aggressive. Batch-reject noise, deep-review only Critical/Medium.

### 2. Adjudicate Findings

Main agent reviews each adversarial finding and assigns verdict:

| Verdict | Meaning | Action |
|---------|---------|--------|
| **Accept** | Valid flaw, reproducible or clearly reasoned | Must fix before merge |
| **Reject** | False positive, already handled, or impossible path | Document why, no action |
| **Defer** | Valid but low-risk, tracked for later | Create GitHub issue for tracking |

**Rules:**
- Every finding gets a verdict -- no silent dismissals
- Critical findings: Accept unless you can PROVE false positive
- Benefit of doubt goes to the adversary (safer to fix than to dismiss)
- If >50% of findings are Rejected, the adversary was too aggressive -- but still report all

**Calibration examples:**

| Verdict | Example | Reasoning |
|---------|---------|-----------|
| Accept | "SQL injection via string interpolation in query builder" | Clearly exploitable, concrete path shown |
| Reject | "Missing null check on config.apiUrl" | Config loaded at startup with schema validation (see config.ts:12), cannot be null at runtime |
| Defer | "No rate limiting on POST /api/upload" | Valid concern but internal-only tool currently; track for public exposure |

### 3. Report Format

```
## Adversarial Review -- Stage 3

### Summary
- Findings: N total (X Critical, Y Medium, Z Low)
- Accepted: A (must fix)
- Rejected: B (false positive)
- Deferred: C (tracked via GitHub issues)

### Accepted Findings (Must Fix)

#### [1] SEVERITY -- CATEGORY -- file:line
**Attack:** How to trigger
**Impact:** What happens
**Fix:** Approach description
**Verdict:** Accept -- [reason]

### Rejected Findings

#### [N] SEVERITY -- CATEGORY -- file:line
**Attack:** Claimed vector
**Verdict:** Reject -- [reason this is a false positive]

### Deferred Findings

#### [N] SEVERITY -- CATEGORY -- file:line
**Attack:** How to trigger
**Verdict:** Defer -- [reason] → GitHub issue #X
```

### 4. Fix Accepted Findings

- Critical: Block merge. Fix immediately via `/fix` or manual edit.
- Medium: Fix before merge if feasible. Defer only with explicit user approval.
- Low: Track. Fix in follow-up if pattern repeats.

### Re-review Optimization

On fix cycles (re-running after accepted findings were fixed):
- Only pass the FIX diff to adversarial, not the full original diff
- Verify accepted findings are resolved
- Check for regression: did the fix introduce new issues?

## Integration with Pipeline

```
Stage 1 (Spec) → PASS
  ↓
Stage 2 (Quality) → PASS
  ↓
Scope gate → below threshold? → skip (note in report)
  ↓ (above threshold)
Stage 3 (Adversarial) → findings
  ├─ 0 Accepted → PASS → proceed
  ├─ Accepted Critical → BLOCK → fix → re-run Stage 3 (fix diff only)
  └─ Accepted Medium/Low only → fix or defer → proceed
```

**Task pipeline update:** When using task-managed reviews, adversarial review gets its own task between "Review implementation" and "Fix critical issues".

## What This Is NOT

- NOT a style review (Stage 2 handles that)
- NOT a spec compliance check (Stage 1 handles that)
- NOT dependency graph analysis or import tracing (scout handles that)
- NOT a general "suggestions for improvement" pass

This is a focused, hostile attempt to break the code. If the code survives, it's ready to ship.
