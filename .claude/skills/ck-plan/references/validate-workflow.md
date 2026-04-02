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

## Output
- Number of questions asked
- Key decisions confirmed
- Phase propagation results
- Recommendation: proceed or revise

## Next Steps (MANDATORY)
Remind user with absolute path:
> **Best Practice:** Run `/clear` before implementing to start with fresh context.
> Then run:
> ```
> /ck:cook --auto {ABSOLUTE_PATH_TO_PLAN_DIR}/plan.md
> ```
> **Why `--auto`?** Plan was already validated — safe to skip review gates.
> **Why absolute path?** After `/clear`, the new session loses previous context.
> Fresh context helps Claude focus solely on implementation without planning context pollution.

## Important Notes
- Only ask about genuine decision points
- If plan is simple, fewer than min questions is okay
- Prioritize questions that could change implementation significantly
