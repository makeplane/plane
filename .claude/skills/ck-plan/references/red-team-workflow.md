# Red Team Review

Adversarially review an implementation plan by spawning parallel reviewer subagents that try to tear it apart. Each reviewer adopts a different hostile lens. You then adjudicate findings, and the user decides which to apply.

**Mindset:** Like hiring someone who hates the implementer to destroy their work.

## Plan Resolution

1. If `$ARGUMENTS` provided → Use that path
2. Else check `## Plan Context` section → Use active plan path
3. If no plan found → Ask user to specify path or run `/ck:plan` first

## Workflow

### Step 1: Read Plan Files

Read the plan directory:

- `plan.md` — Overview, phases, dependencies
- `phase-*.md` — All phase files (full content)

### Step 2: Scale Reviewer Count

| Phase Count | Reviewers | Lenses Selected                           |
| ----------- | --------- | ----------------------------------------- |
| 1-2 phases  | 2         | Security Adversary + Assumption Destroyer |
| 3-5 phases  | 3         | + Failure Mode Analyst                    |
| 6+ phases   | 4         | + Scope & Complexity Critic (all lenses)  |

### Step 3: Define Adversarial Lenses

Load: `references/red-team-personas.md`

### Step 4: Spawn Reviewers

Launch reviewers simultaneously via Task tool with `subagent_type: "code-reviewer"`.
Each reviewer prompt MUST include override, persona, plan file paths, and hostile instructions.
Load: `references/red-team-personas.md` for reviewer prompt template.

If a reviewer or controller writes report artifacts, create the plan `reports/` directory first and use a plan-scoped descriptive filename. Use names like `from-code-reviewer-to-planner-red-team-security-adversary-plan-review-report.md`. Never use generic names such as `red-team-review.md`, `review.md`, `report.md`, or `notes.md`. If filename guidance rejects a write, retry immediately with a descriptive filename and continue the review.

### Step 5: Collect, Deduplicate & Cap

1. Collect all findings
2. Deduplicate overlapping findings
3. Sort by severity: Critical → High → Medium
4. Cap at 15 findings

### Step 5.5: Evidence Filter

For each finding, check: does the `Evidence:` field contain at least one `file:line` citation (pattern `path/to/file.ext:NNN`)? If not, auto-set disposition to **Reject** with rationale "No codebase evidence." Do not evaluate merit for evidence-free findings.

### Step 6: Adjudicate

For each finding that passed the evidence filter, evaluate and propose: **Accept** or **Reject**.

### Step 7: User Review

Present via `AskUserQuestion`:

- "Looks good, apply accepted findings"
- "Let me review each one"
- "Reject all, plan is fine"

**If "Let me review each one":**
For each finding marked Accept, ask via `AskUserQuestion`:

- Options: "Yes, apply" | "No, reject" | "Modify suggestion"

**If "Modify suggestion":**
Ask via `AskUserQuestion`: "Describe your modification to this finding's suggested fix:"
(user provides free text via "Other" option)
Record the modified suggestion. Set disposition to "Accept (modified)" in the Red Team Review table.

### Step 8: Apply to Plan

For accepted findings, edit target phase files inline with marker.
Add `## Red Team Review` section to `plan.md`.

### Step 9: Whole-Plan Consistency Sweep

Load: `references/verification-roles.md` → "Whole-Plan Consistency Sweep".

After accepted findings are applied, re-read `plan.md` and every `phase-*.md` file. Red-team edits often change one local phase; this sweep prevents stale claims from surviving elsewhere.

Required checks:

- Convert accepted findings into a decision delta list.
- Search all plan files for old terms, rejected assumptions, renamed files/APIs/fields, and superseded implementation details.
- Reconcile `plan.md` summaries, dependencies, phase requirements, implementation steps, success criteria, and existing validation/red-team logs.
- If a finding updates an embedded draft, pseudo-query, command, or API contract, update duplicate prose/draft copies too.
- Append `### Whole-Plan Consistency Sweep` to `## Red Team Review`.
- If contradictions remain, list them as unresolved and do not present the plan as ready for implementation.

## Output

- Total findings by severity
- Accepted vs rejected count
- Files modified
- Whole-plan consistency sweep results
- Key risks addressed

## Next Steps

Remind user they can run `/ck:plan validate {plan-directory-path}` before implementation.
When the user approves implementation, run `/ck:cook {ABSOLUTE_PATH_TO_PLAN_DIR}/plan.md`.
Add `--auto` only when the user explicitly asks for autonomous implementation.

## Important Notes

- Reviewers must be HOSTILE, not helpful
- Deduplicate aggressively
- Adjudication must be evidence-based
- Reviewers read plan files directly
- Report artifacts use the provided reports path and descriptive plan-scoped filenames
- Never recommend cooking until the whole-plan consistency sweep has no unresolved contradictions
