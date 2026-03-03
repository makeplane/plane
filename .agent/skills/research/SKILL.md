---
name: research
description: Research technical topics for implementation planning. Use when asked to "research", "investigate", "find out how", or before planning a feature.
---

# Research

Conduct thorough technical research on a topic and produce a structured report.

## Instructions

1. **Understand the request** — what topic/feature needs research?
2. **Search the codebase** — find related patterns, existing implementations, similar features
3. **Search the web** — find best practices, library docs, similar solutions
4. **Analyze findings** — identify approaches, trade-offs, risks
5. **Write report** — save to `plans/reports/research-{date}-{slug}.md`

## Report Format

```markdown
# Research: {Topic}

## Summary

Brief overview of findings (3-5 sentences)

## Approaches Found

### Approach A: {name}

- Description, pros, cons, effort estimate

### Approach B: {name}

- Description, pros, cons, effort estimate

## Recommended Approach

Which approach and why

## Key References

- Relevant files in codebase
- External documentation links

## Risks & Considerations

- Potential issues to watch for
```

## Rules

- Reports ≤150 lines, concise
- Always search codebase FIRST before web
- Reference specific files/line numbers
- Save report to `plans/reports/` directory
- Read `.agent/rules/` for project-specific architecture rules before researching

## Examples

**User:** "Research how to add WebSocket support"
**Action:** Search codebase for existing WebSocket code → search web for Django Channels patterns → write report comparing approaches → save to `plans/reports/research-{date}-websocket-support.md`
