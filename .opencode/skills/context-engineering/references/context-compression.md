# Context Compression

Strategies for long-running sessions exceeding context windows.

## Core Insight

Optimize **tokens-per-task** (total to completion), not tokens-per-request.
Aggressive compression causing re-fetching costs more than better retention.

## Compression Methods

| Method | Compression | Quality | Best For |
|--------|-------------|---------|----------|
| **Anchored Iterative** | 98.6% | 3.70/5 | Best balance |
| **Regenerative Full** | 98.7% | 3.44/5 | Readability |
| **Opaque** | 99.3% | 3.35/5 | Max compression |

## Anchored Iterative Summary Template

```markdown
## Session Intent
Original goal: [preserved]

## Files Modified
- file.py: Changes made

## Decisions Made
- Key decisions with rationale

## Current State
Progress summary

## Next Steps
1. Next action items
```

**On compression**: Merge new content into existing sections, don't regenerate.

## Compression Triggers

| Strategy | Trigger | Use Case |
|----------|---------|----------|
| Fixed threshold | 70-80% utilization | General purpose |
| Sliding window | Keep last N turns + summary | Conversations |
| Task-boundary | At logical completion | Multi-step workflows |

## Artifact Trail Problem

Weakest dimension (2.2-2.5/5.0). Coding agents need explicit tracking of:
- Files created/modified/read
- Function/variable names, error messages

**Solution**: Dedicated artifact section in summary.

## Probe-Based Evaluation

| Probe Type | Tests | Example |
|------------|-------|---------|
| Recall | Factual retention | "What was the error?" |
| Artifact | File tracking | "Which files modified?" |
| Continuation | Task planning | "What next?" |
| Decision | Reasoning chains | "Why chose X?" |

## Six Evaluation Dimensions

1. **Accuracy** - Technical correctness
2. **Context Awareness** - Conversation state
3. **Artifact Trail** - File tracking (universally weak)
4. **Completeness** - Coverage depth
5. **Continuity** - Work continuation
6. **Instruction Following** - Constraints

## Guidelines

1. Use anchored iterative for best quality/compression
2. Maintain explicit artifact tracking section
3. Trigger compression at 70% utilization
4. Merge into sections, don't regenerate
5. Evaluate with probes, not lexical metrics

## Related

- [Context Optimization](./context-optimization.md)
- [Evaluation](./evaluation.md)
