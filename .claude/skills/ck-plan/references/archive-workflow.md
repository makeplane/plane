# Archive Workflow

## Your mission
Read and analyze the plans, then write journal entries and archive specific plans or all plans in the `plans` directory.

## Plan Resolution
1. If `$ARGUMENTS` provided → Use that path
2. Else read all plans in the `plans` directory

## Workflow

### Step 1: Read Plan Files

Read the plan directory:
- `plan.md` - Overview and phases list
- `phase-*.md` - 20 first lines of each phase file to understand the progress and status

### Step 2: Summarize the plans and document them with `/ck:journal` skill invocation
Use `AskUserQuestion` tool to ask if user wants to document journal entries or not.
Skip this step if user selects "No".
If user selects "Yes":
- Analyze the information in previous steps.
- Use Task tool with `subagent_type="journal-writer"` in parallel to document all plans.
- Journal entries should be concise and focused on the most important events, key changes, impacts, and decisions.
- Keep journal entries in the `./docs/journals/` directory.

### Step 3: Ask user to confirm the action before archiving these plans
Use `AskUserQuestion` tool to ask if user wants to proceed with archiving these plans, select specific plans to archive or all completed plans only.
Use `AskUserQuestion` tool to ask if user wants to delete permanently or move to the `./plans/archive` directory.

### Step 4: Archive the plans
Start archiving the plans based on the user's choice:
- Move the plans to the `./plans/archive` directory.
- Delete the plans permanently: `rm -rf ./plans/<plan-1> ./plans/<plan-2> ...`

### Step 5: Ask if user wants to commit the changes
Use `AskUserQuestion` tool to ask if user wants to commit the changes with these options:
- Stage and commit the changes (Use `/ck:git` for commit flow)
- Commit and push the changes (Use `/ck:git` for push flow)
- Nah, I'll do it later

## Output
After archiving the plans, provide summary:
- Number of plans archived
- Number of plans deleted permanently
- Table of plans that are archived or deleted (title, status, created date, LOC)
- Table of journal entries that are created (title, status, created date, LOC)

## Important Notes
- Only ask questions about genuine decision points
- Sacrifice grammar for concision
- List any unresolved questions at the end
- Ensure token efficiency while maintaining high quality
