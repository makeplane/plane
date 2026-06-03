# Verification Roles

Language-agnostic roles for verifying plan accuracy against the actual codebase.

**Loaded by:** planner (self-verify during creation), validate (external verify after creation), red-team (evidence-backed adversarial review).

**Principle:** `user asks → scout → planner writes → audit-verify → report` instead of `user asks → planner writes → report done`.

## Tiering (Auto-Scale by Plan Size)

Count phases in the plan to determine verification tier.

| Phases | Tier     | Active Roles                     | Spot-Check Budget |
| ------ | -------- | -------------------------------- | ----------------- |
| 1-2    | Light    | Fact Checker                     | 5 claims/phase    |
| 3-4    | Standard | Fact Checker + Contract Verifier | 10 claims/phase   |
| 5+     | Full     | All 4 roles                      | 15+ claims/phase  |

## Role: Fact Checker

**Purpose:** Verify every file path, symbol, endpoint, and config key cited in the plan actually exists.

**Method:**

- Sample N claims per phase (per tier budget)
- `grep -rn "{symbol}" .` to verify symbols exist
- `glob "{path}"` to verify file paths
- For endpoints: grep route definitions
- For config keys: grep env files, config objects

**Red flags:**

- Wrapper/validator/manager/handler names that grep returns nothing for
- Centralized packages that are actually scattered across the codebase
- Paths from scout reports that were renamed or moved since scouting

**Output per claim:** `VERIFIED (file:line)` | `FAILED (not found)` | `UNVERIFIED (ambiguous)`

## Role: Flow Tracer

**Purpose:** Verify behavioral claims ("X triggers Y", "A calls B before C", "middleware runs before handler").

**Method:**

- Start from the claimed entry point
- Read the actual code path: entry → guards → branching → target
- List all early returns, middleware chains, event listeners in the path
- For async code: check ordering guarantees (await, Promise.then, callbacks)
- Verify causality (A actually invokes B) vs correlation (both exist in same file)

**Red flags:**

- "X triggers Y" but X and Y share no call path
- Missing intermediate steps (A calls C which calls B, not A calls B directly)
- Async ordering assumed synchronous

**Output:** Traced path with file:line citations, or FAILED with explanation of actual flow.

## Role: Scope Auditor

**Purpose:** Verify state additions (new fields, context values, singletons, env vars) respect lifetime boundaries.

**Method:**

- Grep the target struct/class/object for ALL instantiation sites
- Determine lifetime: request-scoped, session-scoped, process-global
- Check for shared-state leaks across isolation boundaries
- Verify no existing state already serves the same purpose (grep for similar field names)

**Red flags:**

- "Adding field to X" when X is a singleton shared across requests
- New state duplicating existing state under a different name
- Module-level variables in request-handling code

**Output:** Lifetime classification with instantiation sites, or FAILED with leak description.

## Role: Contract Verifier

**Purpose:** Verify interface changes (API endpoints, function signatures, config schemas, exports) account for ALL consumers.

**Method:**

- `grep -rn "{function_name}" .` to enumerate ALL callers — list explicitly
- Never write "update all callers" — always state the count and list them
- If count > 10: list first 10 with file:line, state total count
- Check downstream: tests that call the function, imports, re-exports
- Check upstream: config files, env vars, CI scripts, CLI help text

**Red flags:**

- Plan says "3 callers" but grep finds 7
- Missing test file updates
- Re-exported types not updated at barrel files
- CLI help text referencing old parameter names

**Output:** Caller list with file:line, type compatibility assessment, or FAILED with missing callers.

## Verification Output Format

Append to plan's `## Validation Log` or include in red-team findings:

```markdown
### Verification Results

- **Tier:** Light|Standard|Full
- **Claims checked:** N
- **Verified:** N | **Failed:** N | **Unverified:** N

#### Failures

1. [Fact Checker] `src/utils/auth.ts` — path not found, actual: `src/lib/auth.ts`
2. [Contract Verifier] `parseConfig()` — plan says 3 callers, found 7
```

## Whole-Plan Consistency Sweep

**Purpose:** Prevent iterative validate/red-team edits from fixing one phase while leaving stale claims elsewhere.

Run this after any validation or red-team change that edits `plan.md` or any `phase-*.md` file.

### Required Inputs

- `plan.md`
- Every `phase-*.md` file in the plan directory
- New decisions or accepted findings from the current validation/red-team session

### Sweep Method

1. Re-read `plan.md` and all `phase-*.md` files after applying edits.
2. Build a short decision delta list from the current session:
   - renamed fields, APIs, files, tags, timestamps, scopes, or workflows
   - changed validation decisions or rejected assumptions
   - changed phase order, dependencies, ownership, or success criteria
3. Search all plan files for old terms, superseded assumptions, and duplicate embedded drafts from each delta.
4. Reconcile affected sections across files, not only the file that triggered the finding.
5. Check `plan.md` summary, phases table text, phase requirements, implementation steps, success criteria, risk notes, and validation/red-team logs for contradictions.
6. If a conflict cannot be resolved with current evidence, add it to unresolved questions and do not recommend cooking yet.

### Output Format

Append to the current `## Validation Log` or `## Red Team Review` section:

```markdown
### Whole-Plan Consistency Sweep

- Files reread: plan.md, phase-01-..., phase-02-...
- Decision deltas checked: N
- Reconciled stale references: N
- Unresolved contradictions: N
```

If `Unresolved contradictions` is greater than zero, list each conflict with the affected files and ask the user before implementation.

## Integration Points

- **Planner self-verify:** Apply Fact Checker inline while writing each phase. Tag `[UNVERIFIED]` for claims that can't be confirmed. Other roles applied during validate/red-team.
- **Validate Step 2.5:** Run tier-appropriate roles after reading plan, before interview questions. FAILED findings become additional interview topics.
- **Validate after propagation:** Run Whole-Plan Consistency Sweep before recommending implementation.
- **Red-team reviewers:** Each reviewer carries their adversarial lens + assigned verification role. Findings without grep evidence = auto-rejected during adjudication.
- **Red-team after accepted edits:** Run Whole-Plan Consistency Sweep before presenting next steps.
