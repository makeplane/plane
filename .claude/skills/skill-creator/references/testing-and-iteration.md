# Testing and Iteration

## Testing Approaches

Choose rigor based on skill visibility:
- **Manual testing** — Run queries in Claude.ai, observe behavior. Fast iteration.
- **Scripted testing** — Automate test cases in Claude Code for repeatable validation.
- **Programmatic testing** — Build eval suites via skills API for systematic testing.

**Pro tip:** Iterate on a single challenging task until Claude succeeds, then extract the winning approach into the skill. Expand to multiple test cases after.

## Three Testing Areas

### 1. Triggering Tests

Ensure skill loads at right times.

| Should trigger | Should NOT trigger |
|---|---|
| "Help me set up a new ProjectHub workspace" | "What's the weather?" |
| "I need to create a project in ProjectHub" | "Help me write Python code" |
| "Initialize a ProjectHub project for Q4" | "Create a spreadsheet" |

**Debug:** Ask Claude: "When would you use the [skill-name] skill?" — it quotes the description back.

### 2. Functional Tests

Verify correct outputs:
- Valid outputs generated
- API/MCP calls succeed
- Error handling works
- Edge cases covered

### 3. Performance Comparison

Compare with and without skill:

| Metric | Without Skill | With Skill |
|---|---|---|
| Messages needed | 15 back-and-forth | 2 clarifying questions |
| Failed API calls | 3 retries | 0 |
| Tokens consumed | 12,000 | 6,000 |

## Success Criteria

### Quantitative
- Skill triggers on ~90% of relevant queries (test 10-20 queries)
- Completes workflow in fewer tool calls than without skill
- 0 failed API calls per workflow

### Qualitative
- Users don't need to prompt Claude about next steps
- Workflows complete without user correction
- Consistent results across sessions
- New users can accomplish task on first try

## Iteration Signals

### Undertriggering
- Skill doesn't load when it should → add more trigger phrases/keywords to description
- Users manually enabling it → description too vague

### Overtriggering
- Skill loads for unrelated queries → add negative triggers, be more specific
- Users disabling it → clarify scope in description

### Execution Issues
- Inconsistent results → improve instructions, add validation scripts
- API failures → add error handling, retry guidance
- User corrections needed → make instructions more explicit

## Iteration Workflow

1. Use skill on real tasks
2. Notice struggles, inefficiencies, token usage
3. Identify SKILL.md or resource updates needed
4. Implement changes
5. Test again with same scenarios
