# Validate Workflow

Interview the user with critical questions to validate assumptions, confirm decisions, and surface potential issues in an implementation plan before coding begins.

## Plan Resolution

1. If `$ARGUMENTS` provided → Use that path
2. Else check `## Plan Context` section → Use active plan path
3. If no plan found → Ask user to specify path or run `/ck:plan --hard` first

## Configuration

Check `## Plan Context` section for validation settings:

- `mode` - Controls auto/prompt/off behavior
- `questions` - Range like `3-8` (min-max)

## Workflow

### Step 1: Read Plan Files

- `plan.md` - Overview and phases list
- `phase-*.md` - All phase files
- Look for decision points, assumptions, risks, tradeoffs

### Step 2: Extract Question Topics

Load: `references/validate-question-framework.md`

### Step 2.5: Verification Pass (Auto-Scaled)

Before interviewing the user, verify plan accuracy against the actual codebase.
Load: `references/verification-roles.md`

**Guard:** If `## Red Team Review` section already exists in `plan.md` with verification evidence, skip to Step 3 — limit this step to resolving any remaining `[UNVERIFIED]` tags only.

1. **Tier detection** — Count phases in the plan:
   - 1-2 phases → Light (Fact Checker only, 5 claims/phase)
   - 3-4 phases → Standard (Fact Checker + Contract Verifier, 10 claims/phase)
   - 5+ phases → Full (all 4 roles, 15+ claims/phase)
2. **For each active role at the current tier:**
   - Sample N claims per phase (per tier budget)
   - Run grep/glob to verify file paths, symbols, endpoints
   - Collect findings: VERIFIED | FAILED | UNVERIFIED
3. **Handle failures:**
   - Surface ALL failures as additional interview questions in Step 4 (with glob-suggested alternatives as "(Recommended)" options)
   - Never auto-correct plan files — all corrections require user confirmation via interview
4. **Check `[UNVERIFIED]` tags** — Scan plan for planner-tagged unverified claims, attempt to resolve
5. **Append results** to `## Validation Log`:
   ```
   ### Verification Results
   - Claims checked: N
   - Verified: N | Failed: N | Unverified: N
   - Tier: Light|Standard|Full
   - Failures: [list with file:line evidence]
   ```

### Step 3: Generate Questions

For each detected topic, formulate a concrete question with 2-4 options.
Mark recommended option with "(Recommended)" suffix.

### Step 4: Interview User

Use `AskUserQuestion` tool.

- Use question count from `## Plan Context` validation settings
- Group related questions (max 4 per tool call)
- Focus on: assumptions, risks, tradeoffs, architecture

### Step 5: Document Answers

Add or append `## Validation Log` section in `plan.md`.
Load: `references/validate-question-framework.md` for recording format.

### Step 6: Propagate Changes to Phases

Auto-propagate validation decisions to affected phase files.
Add marker: `<!-- Updated: Validation Session N - {change} -->`

### Step 7: Whole-Plan Consistency Sweep

Load: `references/verification-roles.md` → "Whole-Plan Consistency Sweep".

After propagation, re-read `plan.md` and every `phase-*.md` file. Check the whole plan for stale or contradictory claims caused by the validation decisions.

Required checks:

- Search all plan files for old terms, renamed fields/APIs/files, rejected assumptions, and superseded validation decisions.
- Reconcile `plan.md` overview, phase summaries, implementation steps, success criteria, risk notes, and validation logs.
- If the same SQL/query/API/body/contract appears as both prose and embedded draft, update both copies or mark the unresolved conflict.
- Append `### Whole-Plan Consistency Sweep` to the current `## Validation Log`.
- If any unresolved contradiction remains, ask the user before recommending implementation.

## Output

- Number of questions asked
- Key decisions confirmed
- Phase propagation results
- Whole-plan consistency sweep results
- Recommendation: proceed or revise

## Next Steps

Present user-choice next steps with the absolute path:

> **Best Practice:** Run `/clear` before implementing to start with fresh context.
> If the user chooses implementation, run:
>
> ```
> /ck:cook {ABSOLUTE_PATH_TO_PLAN_DIR}/plan.md
> ```
>
> **Flag selection:** If Verification Results show `Failed: 0`, the plan is eligible for implementation. Ask the user before proceeding. Add `--auto` only when the user explicitly asks for autonomous implementation. If `Failed: N > 0`, revise the plan before cooking.
> **Why absolute path?** After `/clear`, the new session loses previous context.
> Fresh context helps Claude focus solely on implementation without planning context pollution.

## Important Notes

- Only ask about genuine decision points
- If plan is simple, fewer than min questions is okay
- Prioritize questions that could change implementation significantly
- Never recommend cooking until the whole-plan consistency sweep has no unresolved contradictions
