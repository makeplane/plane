---
description: ⚡⚡⚡ [AUTO] Start coding & testing an existing plan ("trust me bro")
argument-hint: [plan] [all-phases-yes-or-no] (default: yes)
---

**MUST READ** `CLAUDE.md` then **THINK HARDER** to start working on the following plan follow the Orchestration Protocol, Core Responsibilities, Subagents Team and Development Rules:
<plan>$ARGUMENTS</plan>

## Arguments
- $PLAN: $1 (Mention specific plan or auto detected, default: latest plan)
- $ALL_PHASES: $2 (`Yest` to finish all phases in one run or `No` to implement phase-by-phase and wait for confirmation, default is `Yes`)

---

## Role Responsibilities
- You are a senior software engineer who must study the provided implementation plan end-to-end before writing code.
- Validate the plan's assumptions, surface blockers, and confirm priorities with the user prior to execution.
- Drive the implementation from start to finish, reporting progress and adjusting the plan responsibly while honoring **YAGNI**, **KISS**, and **DRY** principles.

**IMPORTANT:** Remind these rules with subagents communication:
- Sacrifice grammar for the sake of concision when writing reports.
- In reports, list any unresolved questions at the end, if any.
- Ensure token efficiency while maintaining high quality.
- DO NOT stop until you finish all phases.
- If this is a frontend project, use any of these available skills/tools to verify the implementation: `chrome`, `chrome-devtools`

---

## Step 0: Plan Detection & Phase Selection

**If `$PLAN` is empty:**
1. Find latest `plan.md` in `./plans` | `find ./plans -name "plan.md" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-`
2. Parse plan for phases and status, auto-select next incomplete (prefer IN_PROGRESS or earliest Planned)

**If `$PLAN` provided:** Use that plan and detect which phase to work on (auto-detect or use argument like "phase-2").

**Output:** `✓ Step 0: [Plan Name] - [Phase Name]`

**Subagent Pattern (use throughout):**
```
Task(subagent_type="[type]", prompt="[task description]", description="[brief]")
```

---

## Workflow Sequence

**Rules:** Follow steps 1-5 in order. Each step requires output marker starting with "✓ Step N:". Mark each complete in `TodoWrite` before proceeding. Do not skip steps.

---

## Step 1: Analysis & Task Extraction
Use `project-manager` agent to read plan file completely. Map dependencies between tasks. List ambiguities or blockers. Identify required skills/tools and activate from catalog. Parse phase file and extract actionable tasks.

**TodoWrite Initialization & Task Extraction:**
`project-manager` agent must respond back with:
- Initialize `TodoWrite` with `Step 0: [Plan Name] - [Phase Name]` and all command steps (Step 1 through Step 5)
- Read phase file (e.g., phase-01-preparation.md)
- Look for tasks/steps/phases/sections/numbered/bulleted lists
- MUST convert to `TodoWrite` tasks:
  - Phase Implementation tasks → Step 2.X (Step 2.1, Step 2.2, etc.)
  - Phase Testing tasks → Step 3.X (Step 3.1, Step 3.2, etc.)
  - Phase Code Review tasks → Step 4.X (Step 4.1, Step 4.2, etc.)
- Ensure each task has UNIQUE name (increment X for each task)
- Add tasks to `TodoWrite` after their corresponding command step

**Output:** `✓ Step 1: Found [N] tasks across [M] phases - Ambiguities: [list or "none"]`

Mark Step 1 complete in `TodoWrite`, mark Step 2 in_progress.

---

## Step 2: Implementation

Implement selected plan phase step-by-step following extracted tasks (Step 2.1, Step 2.2, etc.). Mark tasks complete as done. For UI work, call `ui-ux-designer` subagent: "Implement [feature] UI per ./docs/design-guidelines.md". Use `ai-multimodal` skill for image assets, imagemagick in `media-processing` skill for editing. Run type checking and compile to verify no syntax errors.

**Output:** `✓ Step 2: Implemented [N] files - [X/Y] tasks complete, compilation passed`

Mark Step 2 complete in `TodoWrite`, mark Step 3 in_progress.

---

## Step 3: Testing

Write tests covering happy path, edge cases, and error cases. Call `tester` subagent: "Run test suite for plan phase [phase-name]". If ANY tests fail: STOP, call `debugger` subagent: "Analyze failures: [details]", fix all issues, re-run `tester`. Repeat until 100% pass.

**Testing standards:** Unit tests may use mocks for external dependencies (APIs, DB). Integration tests use test environment. E2E tests use real but isolated data. Forbidden: commenting out tests, changing assertions to pass, TODO/FIXME to defer fixes.

**Output:** `✓ Step 3: Tests [X/X passed] - All requirements met`

**Validation:** If X ≠ total, Step 3 INCOMPLETE - do not proceed.

Mark Step 3 complete in `TodoWrite`, mark Step 4 in_progress.

---

## Step 4: Code Review (Smart Auto-Handling)

Call `code-reviewer` subagent: "Review code changes in **Step 2** of plan phase [phase-name]. Check security, performance, architecture, YAGNI/KISS/DRY. Return score (X/10), critical issues list, warnings list, suggestions list."

**Auto-Handling Logic (max 3 cycles):**

```
cycle = 0
LOOP:
  1. Run code-reviewer → get score, critical_count, warnings, suggestions
  2. LOG findings: "Review: [score]/10 | Critical: [N] | Warnings: [N] | Suggestions: [N]"
  3. IF score >= 9.5 AND critical_count == 0:
     → Output: "✓ Step 4: Code reviewed - [score]/10 - Auto-approved ([warnings] warnings logged)"
     → PROCEED to Step 5
  4. ELSE IF critical_count > 0 AND cycle < 3:
     → Output: "⚙ Step 4: Auto-fixing [critical_count] critical issues (cycle [cycle+1]/3)"
     → Implement fixes for critical issues
     → Re-run tester to verify no regressions
     → cycle++, GOTO LOOP
  5. ELSE IF critical_count > 0 AND cycle >= 3:
     → ESCALATE TO USER (auto-fix exhausted)
     → DISPLAY all findings to user (critical, warnings, suggestions with file:line)
     → Use AskUserQuestion:
       - "Fix remaining issues manually" → implement, restart cycle counter
       - "Approve with noted issues" → proceed with warnings
       - "Abort workflow" → stop
  6. ELSE (no critical, but score < 9.5):
     → Output: "✓ Step 4: Code reviewed - [score]/10 - Approved ([warnings] warnings, [suggestions] suggestions logged)"
     → PROCEED to Step 5
```

**Critical issues:** Security vulnerabilities (XSS, SQL injection, OWASP), performance bottlenecks, architectural violations, principle violations.

**Output formats:**
- Auto-approved: `✓ Step 4: Code reviewed - 9.8/10 - Auto-approved (2 warnings logged)`
- After auto-fix: `✓ Step 4: Code reviewed - 7.2/10 → Auto-fixed 2 critical → 9.5/10 - Approved`
- Escalation: `⚠ Step 4: 3 fix cycles exhausted, [N] critical remain - User input required`

**Validation:** Step 4 INCOMPLETE if critical issues > 0 AND user hasn't approved.

Mark Step 4 complete in TodoWrite, mark Step 5 in_progress.

---

## Step 5: Finalize

1. **STATUS UPDATE - BOTH MANDATORY - PARALLEL EXECUTION:**
- **Call** `project-manager` sub-agent: "Update plan status in [plan-path]. Mark plan phase [phase-name] as DONE with timestamp. Update roadmap."
- **Call** `docs-manager` sub-agent: "Update docs for plan phase [phase-name]. Changed files: [list]."

2. **ONBOARDING CHECK:** Detect onboarding requirements (API keys, env vars, config) + generate summary report with next steps.
- If this is the last phase: use `AskUserQuestion` tool to ask if user wants to set up onboarding requirements.

3. **AUTO-COMMIT (after steps 1 and 2 completes):**
- **Call** `git-manager` subagent to handle git operation.
- Run only if: Steps 1 and 2 successful + Tests passed
- Auto-stage, commit with conventional commit message based on actual changes

**Validation:** Steps 1 and 2 must complete successfully. Step 3 (auto-commit) runs only if conditions met.

Mark Step 5 complete in `TodoWrite`.

**Important:**
If $ALL_PHASES is `Yes`, proceed to the next phase automatically.
If $ALL_PHASES is `No`, wait for user confirmation before proceeding to the next phase:
- Use `AskUserQuestion` tool to ask if user wants to proceed to the next phase: "**Phase workflow finished. Ready for next plan phase.**"

## Summary report
If this is the last phase, generate a concise summary report.
Use `AskUserQuestion` tool to ask these questions:
- If user wants to preview the report with `/preview` slash command.
- If user wants to archive the plan with `/plan:archive` slash command.

---

## Critical Enforcement Rules

**Step outputs must follow unified format:** `✓ Step [N]: [Brief status] - [Key metrics]`

**Examples:**
- Step 0: `✓ Step 0: [Plan Name] - [Phase Name]`
- Step 1: `✓ Step 1: Found [N] tasks across [M] phases - Ambiguities: [list]`
- Step 2: `✓ Step 2: Implemented [N] files - [X/Y] tasks complete`
- Step 3: `✓ Step 3: Tests [X/X passed] - All requirements met`
- Step 4: `✓ Step 4: Code reviewed - [0] critical issues`
- Step 5: `✓ Step 5: Finalize - Status updated - Git committed`

**If any "✓ Step N:" output missing, that step is INCOMPLETE.**

**TodoWrite tracking required:** Initialize at Step 0, mark each step complete before next.

**Mandatory subagent calls:**
- Step 3: `tester`
- Step 4: `code-reviewer`
- Step 5: `project-manager` AND `docs-manager` AND `git-manager`

**Blocking gates:**
- Step 3: Tests must be 100% passing
- Step 4: Critical issues must be 0

**REMEMBER:**
- Do not skip steps. Do not proceed if validation fails.
- One plan phase at a time. Do not proceed to the next phase until the current phase is complete and validated.
- You can always generate images with `ai-multimodal` skill on the fly for visual assets.
- You always read and analyze the generated assets with `ai-multimodal` skill to verify they meet requirements.
- For image editing (removing background, adjusting, cropping), use `ImageMagick` or similar tools as needed.
- If this is a frontend project, use any of these available skills/tools to verify the implementation: `chrome`, `chrome-devtools`.