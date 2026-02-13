---
name: sequential-thinking
description: Apply step-by-step analysis for complex problems with revision capability. Use for multi-step reasoning, hypothesis verification, adaptive planning, problem decomposition, course correction.
version: 1.0.0
license: MIT
---

# Sequential Thinking

Structured problem-solving via manageable, reflective thought sequences with dynamic adjustment.

## When to Apply

- Complex problem decomposition
- Adaptive planning with revision capability
- Analysis needing course correction
- Problems with unclear/emerging scope
- Multi-step solutions requiring context maintenance
- Hypothesis-driven investigation/debugging

## Core Process

### 1. Start with Loose Estimate
```
Thought 1/5: [Initial analysis]
```
Adjust dynamically as understanding evolves.

### 2. Structure Each Thought
- Build on previous context explicitly
- Address one aspect per thought
- State assumptions, uncertainties, realizations
- Signal what next thought should address

### 3. Apply Dynamic Adjustment
- **Expand**: More complexity discovered → increase total
- **Contract**: Simpler than expected → decrease total
- **Revise**: New insight invalidates previous → mark revision
- **Branch**: Multiple approaches → explore alternatives

### 4. Use Revision When Needed
```
Thought 5/8 [REVISION of Thought 2]: [Corrected understanding]
- Original: [What was stated]
- Why revised: [New insight]
- Impact: [What changes]
```

### 5. Branch for Alternatives
```
Thought 4/7 [BRANCH A from Thought 2]: [Approach A]
Thought 4/7 [BRANCH B from Thought 2]: [Approach B]
```
Compare explicitly, converge with decision rationale.

### 6. Generate & Verify Hypotheses
```
Thought 6/9 [HYPOTHESIS]: [Proposed solution]
Thought 7/9 [VERIFICATION]: [Test results]
```
Iterate until hypothesis verified.

### 7. Complete Only When Ready
Mark final: `Thought N/N [FINAL]`

Complete when:
- Solution verified
- All critical aspects addressed
- Confidence achieved
- No outstanding uncertainties

## Application Modes

**Explicit**: Use visible thought markers when complexity warrants visible reasoning or user requests breakdown.

**Implicit**: Apply methodology internally for routine problem-solving where thinking aids accuracy without cluttering response.

## Scripts (Optional)

Optional scripts for deterministic validation/tracking:
- `scripts/process-thought.js` - Validate & track thoughts with history
- `scripts/format-thought.js` - Format for display (box/markdown/simple)

See README.md for usage examples. Use when validation/persistence needed; otherwise apply methodology directly.

## References

Load when deeper understanding needed:
- `references/core-patterns.md` - Revision & branching patterns
- `references/examples-api.md` - API design example
- `references/examples-debug.md` - Debugging example
- `references/examples-architecture.md` - Architecture decision example
- `references/advanced-techniques.md` - Spiral refinement, hypothesis testing, convergence
- `references/advanced-strategies.md` - Uncertainty, revision cascades, meta-thinking
