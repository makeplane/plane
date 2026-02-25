# Skill Validation Checklist

Quick validation before packaging. Run `scripts/package_skill.py` for automated checks.

## Critical (Must Pass)

### Metadata
- [ ] `name`: kebab-case, descriptive
- [ ] `description`: under 200 characters, specific triggers, not generic

### Size Limits
- [ ] SKILL.md: under 150 lines
- [ ] Each reference file: under 150 lines
- [ ] No info duplication between SKILL.md and references

### Structure
- [ ] SKILL.md exists with valid YAML frontmatter
- [ ] Unused example files deleted
- [ ] File names: kebab-case, self-documenting

## Scripts (If Applicable)

- [ ] Tests exist and pass
- [ ] Cross-platform (Node.js/Python preferred)
- [ ] Env vars: respects hierarchy `process.env` > `$HOME/.claude/skills/${SKILL}/.env` (global) > `$HOME/.claude/skills/.env` (global) > `$HOME/.claude/.env` (global) > `./.claude/skills/${SKILL}/.env` (cwd) > `./.claude/skills/.env` (cwd) > `./.claude/.env` (cwd)
- [ ] Dependencies documented (requirements.txt, .env.example)
- [ ] Manually tested with real use cases

## Quality

### Writing Style
- [ ] Imperative form: "To accomplish X, do Y"
- [ ] Third-person metadata: "This skill should be used when..."
- [ ] Concise, no fluff

### Practical Utility
- [ ] Teaches *how* to do tasks, not *what* tools are
- [ ] Based on real workflows
- [ ] Includes concrete trigger phrases/examples

## Integration

- [ ] No duplication with existing skills
- [ ] Related topics consolidated (e.g., cloudflare + docker → devops)
- [ ] Composable with other skills

## Automated Validation

Run packaging script to validate:

```bash
scripts/package_skill.py <path/to/skill-folder>
```

Checks performed:
- YAML frontmatter format
- Required fields present
- Description length (<200 chars)
- Directory structure
- File organization

Fix all errors before distributing.

## Subagent Delegation Enforcement

When a skill requires subagent delegation (via Task tool):

1. **Use MUST language** - "Use subagent" is weak; "MUST spawn subagent" is enforceable
2. **Include Task pattern** - Show exact syntax: `Task(subagent_type="X", prompt="Y", description="Z")`
3. **Add validation rule** - "If Task tool calls = 0 at end, workflow is INCOMPLETE"
4. **Mark requirements clearly** - Use table with "MUST spawn" column
5. **Forbid direct implementation** - "DO NOT implement X yourself - DELEGATE to subagent"

**Anti-pattern (weak):**
```
- Use `tester` agent for testing
```

**Correct pattern (enforceable):**
```
- **MUST** spawn `tester` subagent: `Task(subagent_type="tester", prompt="Run tests", description="Test")`
- DO NOT run tests yourself - DELEGATE
```
