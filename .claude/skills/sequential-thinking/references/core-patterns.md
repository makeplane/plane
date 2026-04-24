# Core Sequential Thinking Patterns

Essential revision and branching patterns.

## Revision Patterns

### Assumption Challenge
Early assumption proves invalid with new data.
```
Thought 1/5: Assume X is bottleneck
Thought 4/5 [REVISION of Thought 1]: X adequate; Y is actual bottleneck
```

### Scope Expansion
Problem larger than initially understood.
```
Thought 1/4: Fix bug
Thought 4/5 [REVISION of scope]: Architectural redesign needed, not patch
```

### Approach Shift
Initial strategy inadequate for requirements.
```
Thought 2/6: Optimize query
Thought 5/6 [REVISION of Thought 2]: Optimization + cache layer required
```

### Understanding Deepening
Later insight fundamentally changes interpretation.
```
Thought 1/5: Feature broken
Thought 4/5 [REVISION of Thought 1]: Not bug—UX confusion issue
```

## Branching Patterns

### Trade-off Evaluation
Compare approaches with different trade-offs.
```
Thought 3/7: Choose between X and Y
Thought 4/7 [BRANCH A]: X—simpler, less scalable
Thought 4/7 [BRANCH B]: Y—complex, scales better
Thought 5/7: Choose Y for long-term needs
```

### Risk Mitigation
Prepare backup for high-risk primary approach.
```
Thought 2/6: Primary: API integration
Thought 3/6 [BRANCH A]: API details
Thought 3/6 [BRANCH B]: Fallback: webhook
Thought 4/6: Implement A with B contingency
```

### Parallel Exploration
Investigate independent concerns separately.
```
Thought 3/8: Two unknowns—DB schema & API design
Thought 4/8 [BRANCH DB]: DB options
Thought 4/8 [BRANCH API]: API patterns
Thought 5/8: Integrate findings
```

### Hypothesis Testing
Test multiple explanations systematically.
```
Thought 2/6: Could be A, B, or C
Thought 3/6 [BRANCH A]: Test A—not cause
Thought 3/6 [BRANCH B]: Test B—confirmed
Thought 4/6: Root cause via Branch B
```

## Adjustment Guidelines

**Expand when**: Complexity discovered, multiple aspects identified, verification needed, alternatives require exploration.

**Contract when**: Key insight solves earlier, problem simpler, steps merge naturally.

**Example**:
```
Thought 1/5: Initial
Thought 3/7: Complexity (5→7)
Thought 5/8: Another aspect (7→8)
Thought 8/8 [FINAL]: Complete
```

## Anti-Patterns

**Premature Completion**: Rushing without verification → Add verification thoughts.

**Revision Cascade**: Repeated revisions without understanding why → Identify root cause.

**Branching Explosion**: Too many branches → Limit to 2-3, converge before more.

**Context Loss**: Ignoring earlier insights → Reference previous thoughts explicitly.
