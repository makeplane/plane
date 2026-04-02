# Writing Effective Instructions

## Writing Style

Write entirely in **imperative/infinitive form** (verb-first). Use objective, instructional language.

- **Good:** "To accomplish X, do Y" / "Run `script.py` to validate"
- **Bad:** "You should do X" / "If you need to do X"

## Recommended SKILL.md Structure

```markdown
---
name: your-skill  # optional namespace: ck:your-skill
description: [What + When + Key capabilities]
---
# Skill Name
## Instructions
### Step 1: [First Major Step]
Clear explanation. Example with expected output.
### Step 2: [Next Step]
(Continue as needed)
## Examples
### Example 1: [Common scenario]
**User says:** "[trigger phrase]"
**Actions:** 1. Do X  2. Do Y
**Result:** [Expected outcome]
## Troubleshooting
**Error:** [Message] → **Solution:** [Fix]
```

## Be Specific and Actionable

**Good:**
```markdown
Run `python scripts/validate.py --input {filename}` to check format.
If validation fails, common issues:
- Missing required fields (add to CSV)
- Invalid date formats (use YYYY-MM-DD)
```

**Bad:**
```markdown
Validate the data before proceeding.
```

## Include Error Handling

```markdown
## Common Issues
### MCP Connection Failed
If "Connection refused":
1. Verify MCP server running: Settings > Extensions
2. Confirm API key valid
3. Reconnect: Settings > Extensions > [Service] > Reconnect
```

## Reference Bundled Resources Clearly

```markdown
Before writing queries, consult `references/api-patterns.md` for:
- Rate limiting guidance
- Pagination patterns
- Error codes and handling
```

## Use Progressive Disclosure

Keep SKILL.md focused on core instructions (<300 lines). Move to `references/`:
- Detailed API documentation
- Database schemas
- Extended examples
- Domain-specific rules
- Troubleshooting guides

## Critical Instructions

Put at the top of SKILL.md. Use headers like `## CRITICAL` or `## IMPORTANT`.
Repeat key points if they're frequently missed.

**Advanced technique:** For critical validations, bundle a script that performs checks programmatically rather than relying on language instructions alone. Code is deterministic; language interpretation isn't.

## What NOT to Include

- General knowledge Claude already has
- Tool documentation (teach workflows, not what tools do)
- Verbose explanations (sacrifice grammar for concision)
- Duplicated content between SKILL.md and references
