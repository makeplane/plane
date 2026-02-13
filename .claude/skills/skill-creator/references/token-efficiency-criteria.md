# Token Efficiency Criteria

Skills use progressive disclosure to minimize context window usage.

## Three-Level Loading

1. **Metadata** - Always loaded (~200 chars)
2. **SKILL.md body** - Loaded when skill triggers (<150 lines)
3. **Bundled resources** - Loaded as needed (unlimited for scripts)

## Size Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Description | <200 chars | In YAML frontmatter |
| SKILL.md | <150 lines | Core instructions only |
| Each reference file | <150 lines | Split if larger |
| Scripts | No limit | Executed, not loaded into context |

## SKILL.md Content Strategy

**Include in SKILL.md:**
- Purpose (2-3 sentences)
- When to use (trigger conditions)
- Quick reference for common workflows
- Pointers to resources (scripts, references, assets)

**Move to references/:**
- Detailed documentation
- Database schemas
- API specs
- Step-by-step guides
- Examples and templates
- Best practices

## No Duplication Rule

Information lives in ONE place:
- Either in SKILL.md
- Or in references/

**Bad:** Schema overview in SKILL.md + detailed schema in references/schema.md
**Good:** Brief mention in SKILL.md + full schema only in references/schema.md

## Splitting Large Files

If reference exceeds 150 lines, split by logical boundaries:

```
references/
├── api-endpoints-auth.md      # Auth endpoints
├── api-endpoints-users.md     # User endpoints
├── api-endpoints-payments.md  # Payment endpoints
```

Include grep patterns in SKILL.md for discoverability:

```markdown
## API Documentation
- Auth: `references/api-endpoints-auth.md`
- Users: `references/api-endpoints-users.md`
- Payments: `references/api-endpoints-payments.md`
```

## Scripts: Best Token Efficiency

Scripts execute without loading into context.

**When to use scripts:**
- Repetitive code patterns
- Deterministic operations
- Complex transformations

**Example:** PDF rotation via `scripts/rotate_pdf.py` vs rewriting rotation code each time.
