---
description: ⚡ Analyze logs and fix issues
argument-hint: [issue]
---

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.

## Mission
<issue>$ARGUMENTS</issue>

## Workflow
1. Check if `./logs.txt` exists:
   - If missing, set up permanent log piping in project's script config (`package.json`, `Makefile`, `pyproject.toml`, etc.):
     - **Bash/Unix**: append `2>&1 | tee logs.txt`
     - **PowerShell**: append `*>&1 | Tee-Object logs.txt`
   - Run the command to generate logs
2. Use `debugger` subagent to analyze `./logs.txt` and find root causes:
   - Use `Grep` with `head_limit: 30` to read only last 30 lines (avoid loading entire file)
   - If insufficient context, increase `head_limit` as needed
3. Use `scout` subagent to analyze the codebase and find the exact location of the issues, then report back to main agent.
4. Use `planner` subagent to create an implementation plan based on the reports, then report back to main agent.
5. Start implementing the fix based the reports and solutions.
6. Use `tester` agent to test the fix and make sure it works, then report back to main agent.
7. Use `code-reviewer` subagent to quickly review the code changes and make sure it meets requirements, then report back to main agent.
8. If there are issues or failed tests, repeat from step 3.
9. After finishing, respond back to user with a summary of the changes and explain everything briefly, guide user to get started and suggest the next steps.
