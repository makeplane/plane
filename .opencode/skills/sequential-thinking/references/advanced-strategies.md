# Advanced Sequential Thinking Strategies

Additional sophisticated patterns for complex scenarios.

## Uncertainty Management

Handle incomplete information systematically.

```
Thought 2/7: Need to decide X
Thought 3/7: Insufficient data—two scenarios possible
Thought 4/7 [SCENARIO A if P true]: Analysis for A
Thought 4/7 [SCENARIO B if P false]: Analysis for B
Thought 5/7: Decision that works for both scenarios
Thought 6/7: Or determine critical info needed
Thought 7/7 [FINAL]: Robust solution or clear info requirement
```

**Use for**: Decisions under uncertainty, incomplete requirements.

**Strategies**:
- Find solution robust to uncertainty
- Identify minimal info needed to resolve
- Make safe assumptions with clear documentation

## Revision Cascade Management

Handle revisions that invalidate multiple subsequent thoughts.

```
Thought 1/8: Foundation assumption
Thought 2/8: Build on Thought 1
Thought 3/8: Further build
Thought 4/8: Discover Thought 1 invalid
Thought 5/8 [REVISION of Thought 1]: Corrected foundation
Thought 6/8 [REASSESSMENT]: Which of 2-3 still valid?
  - Thought 2: Partially valid, needs adjustment
  - Thought 3: Completely invalid
Thought 7/8: Rebuild from corrected Thought 5
Thought 8/8 [FINAL]: Solution on correct foundation
```

**Key**: After major revision, explicitly assess downstream impact.

## Meta-Thinking Calibration

Monitor and adjust thinking process itself.

```
Thought 5/9: [Regular thought]
Thought 6/9 [META]: Past 3 thoughts circling without progress
  Analysis: Missing key information
  Adjustment: Need to research X before continuing
Thought 7/9: Research findings on X
Thought 8/9: Now can proceed with informed decision
Thought 9/9: [Resume productive path]
```

**Use when**: Stuck, circling, or unproductive pattern noticed.
**Action**: Pause, identify issue, adjust strategy.

## Parallel Constraint Satisfaction

Handle multiple independent constraints simultaneously.

```
Thought 2/10: Solution must satisfy A, B, C
Thought 3/10 [CONSTRAINT A]: Solutions satisfying A: {X, Y, Z}
Thought 4/10 [CONSTRAINT B]: Solutions satisfying B: {Y, Z, W}
Thought 5/10 [CONSTRAINT C]: Solutions satisfying C: {X, Z}
Thought 6/10 [INTERSECTION]: Z satisfies all
Thought 7/10: Verify Z feasible
Thought 8/10 [BRANCH if infeasible]: Relax which constraint?
Thought 9/10: Decision on constraint relaxation if needed
Thought 10/10 [FINAL]: Optimal solution given constraints
```

**Use for**: Optimization problems, multi-criteria decisions.
**Pattern**: Analyze independently → Find intersection → Verify feasibility.
