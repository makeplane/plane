# Log Analysis Fix Workflow

For fixing issues from application logs.

## Prerequisites
- Log file at `./logs.txt` or similar

## Setup (if logs missing)

Add permanent log piping to project config:
- **Bash/Unix**: `command 2>&1 | tee logs.txt`
- **PowerShell**: `command *>&1 | Tee-Object logs.txt`

## Workflow

1. **Read logs** with `Grep` (use `head_limit: 30` initially)
   - Increase limit if insufficient context

2. **Analyze** with `debugger` agent for root causes

3. **Scout** codebase with `scout` agent for issue locations

4. **Plan** fix with `planner` agent

5. **Implement** the fix

6. **Test** with `tester` agent

7. **Review** with `code-reviewer` agent

8. **Iterate** if issues remain, repeat from step 3

## Tips
- Focus on last N lines first (most recent errors)
- Look for stack traces, error codes, timestamps
- Check for patterns/repeated errors
