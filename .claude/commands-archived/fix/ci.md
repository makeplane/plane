---
description: ⚡ Analyze Github Actions logs and fix issues
argument-hint: [github-actions-url]
---

## Github Actions URL
<url>$ARGUMENTS</url>

## Workflow
1. Use `debugger` subagent to read the github actions logs with `gh` command, analyze and find the root cause of the issues and report back to main agent.
2. Start implementing the fix based the reports and solutions.
3. Use `tester` agent to test the fix and make sure it works, then report back to main agent.
4. If there are issues or failed tests, repeat from step 2.
5. After finishing, respond back to user with a summary of the changes and explain everything briefly, guide user to get started and suggest the next steps.

## Notes
- If `gh` command is not available, instruct the user to install and authorize GitHub CLI first.