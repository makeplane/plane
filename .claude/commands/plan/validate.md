---
description: Validate plan with critical questions interview
argument-hint: [plan-path]
---

## Your mission

Interview the user with critical questions to validate assumptions, confirm decisions, and surface potential issues in an implementation plan before coding begins.

## Plan Resolution

1. If `$ARGUMENTS` provided → Use that path
2. Else check `## Plan Context` section → Use active plan path
3. If no plan found → Ask user to specify path or run `/plan:hard` first

## Configuration (from injected context)

Check `## Plan Context` section for validation settings:
- `mode` - Controls auto/prompt/off behavior
- `questions` - Range like `3-8` (min-max)

These values are automatically injected from user config. Use them as constraints.

## Workflow

### Step 1: Read Plan Files

Read the plan directory:
- `plan.md` - Overview and phases list
- `phase-*.md` - All phase files
- Look for decision points, assumptions, risks, tradeoffs

### Step 2: Extract Question Topics

Scan plan content for:

| Category | Keywords to detect |
|----------|-------------------|
| **Architecture** | "approach", "pattern", "design", "structure", "database", "API" |
| **Assumptions** | "assume", "expect", "should", "will", "must", "default" |
| **Tradeoffs** | "tradeoff", "vs", "alternative", "option", "choice", "either/or" |
| **Risks** | "risk", "might", "could fail", "dependency", "blocker", "concern" |
| **Scope** | "phase", "MVP", "future", "out of scope", "nice to have" |

### Step 3: Generate Questions

For each detected topic, formulate a concrete question:

**Question format rules:**
- Each question must have 2-4 concrete options
- Mark recommended option with "(Recommended)" suffix
- Include "Other" option is automatic - don't add it
- Questions should surface implicit decisions

**Example questions:**

```
Category: Architecture
Question: "How should the validation results be persisted?"
Options:
1. Save to plan.md frontmatter (Recommended) - Updates existing plan
2. Create validation-answers.md - Separate file for answers
3. Don't persist - Ephemeral validation only
```

```
Category: Assumptions
Question: "The plan assumes API rate limiting is not needed. Is this correct?"
Options:
1. Yes, rate limiting not needed for MVP
2. No, add basic rate limiting now (Recommended)
3. Defer to Phase 2
```

### Step 4: Interview User

Use `AskUserQuestion` tool to present questions.

**Rules:**
- Use question count from `## Plan Context` → `Validation: mode=X, questions=MIN-MAX`
- Group related questions when possible (max 4 questions per tool call)
- Focus on: assumptions, risks, tradeoffs, architecture

### Step 5: Document Answers

After collecting answers, update `plan.md` with a detailed validation log. If a `## Validation Log` section already exists (from previous sessions), **append** a new session block — never overwrite history.

1. Add or append to `## Validation Log` section in `plan.md`:

```markdown
## Validation Log

### Session 1 — {YYYY-MM-DD}
**Trigger:** {what prompted this validation — initial plan creation, re-validation after scope change, etc.}
**Questions asked:** {count}

#### Questions & Answers

1. **[{Category}]** {full question text}
   - Options: {A} | {B} | {C}
   - **Answer:** {user's choice}
   - **Custom input:** {verbatim "Other" text if user selected Other, otherwise omit this line}
   - **Rationale:** {why this decision matters for implementation}

2. **[{Category}]** {full question text}
   - Options: {A} | {B} | {C}
   - **Answer:** {user's choice}
   - **Custom input:** {verbatim text, omit if N/A}
   - **Rationale:** {why this matters}

#### Confirmed Decisions
- {decision}: {choice} — {brief why}

#### Action Items
- [ ] {specific change needed based on answers}

#### Impact on Phases
- Phase {N}: {what needs updating and why}
```

**Recording rules:**
- **Full question text**: Copy the exact question asked, not a summary
- **All options**: List every option that was presented
- **Verbatim custom input**: If user selected "Other" and typed custom text, record it exactly as entered — this often contains critical context
- **Rationale**: Explain why the decision affects implementation (helps future agents understand intent)
- **Session numbering**: Increment session number from last existing session. First validation = Session 1
- **Trigger**: State what prompted this validation round (initial, re-validation, scope change, etc.)

2. If answers require plan changes, document them in `#### Impact on Phases` section.

### Step 6: Propagate Changes to Phases (Auto-Apply)

**Auto-propagate** validation decisions to affected phase files.

**Process:**
1. Parse "Impact on Phases" section → If empty, skip and report "No phase changes required"
2. For each phase reference (accepts "Phase 2", "phase-02", "P2"):
   - Glob for `phase-{N:02d}-*.md` → If missing, warn and skip
   - Locate target section (exact → fuzzy → fallback to Key Insights)
   - Apply change + add marker: `<!-- Updated: Validation Session N - {change} -->`
   - Skip if same-session marker already exists (prevent duplication)

**Section mapping:**
| Change Type | Target Section |
|-------------|----------------|
| Requirements | Requirements |
| Architecture | Architecture |
| Scope | Overview / Implementation Steps |
| Risk | Risk Assessment |
| Unknown | Key Insights (new subsection) |

**Error handling:** Best-effort — log warnings for missing files/sections, continue with others, report all in Output.

## Output

After validation completes, provide summary:
- Number of questions asked
- Key decisions confirmed
- **Phase propagation results:**
  - ✅ Files updated (with section names)
  - ⚠️ Warnings (skipped phases, fallback sections)
  - ❌ Errors (if any write failures)
- Any items flagged for plan revision
- Recommendation: proceed to implementation or revise plan first

## Next Steps (MANDATORY)

**IMPORTANT:** After providing the validation summary, you MUST remind the user with the **full absolute path**:

> **Best Practice:** Run `/clear` before implementing to start with fresh context.
> Then run:
> ```
> /cook --auto {ABSOLUTE_PATH_TO_PLAN_DIR}/plan.md
> ```
> *(Replace with actual absolute path, e.g., `/home/user/project/plans/260203-1234-feature/plan.md`)*
>
> **Why `--auto`?** Plan was already validated - safe to skip review gates.
> **Why absolute path?** After `/clear`, the new session loses context. Worktree paths won't be discoverable without the full path.
>
> Fresh context helps Claude focus solely on implementation without planning context pollution, improving plan adherence.

This reminder is **NON-NEGOTIABLE** - always output it at the end of validation with the actual absolute path.

## Important Notes

**IMPORTANT:** Only ask questions about genuine decision points - don't manufacture artificial choices.
**IMPORTANT:** If plan is simple with few decisions, it's okay to ask fewer than min questions.
**IMPORTANT:** Prioritize questions that could change implementation significantly.
