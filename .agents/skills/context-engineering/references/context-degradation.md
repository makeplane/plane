# Context Degradation Patterns

Predictable degradation as context grows. Not binary - a continuum.

## Degradation Patterns

| Pattern | Cause | Detection |
|---------|-------|-----------|
| **Lost-in-Middle** | U-shaped attention | Critical info recall drops 10-40% |
| **Context Poisoning** | Errors compound via reference | Persistent hallucinations despite correction |
| **Context Distraction** | Irrelevant info overwhelms | Single distractor degrades performance |
| **Context Confusion** | Multiple tasks mix | Wrong tool calls, mixed requirements |
| **Context Clash** | Contradictory info | Conflicting outputs, inconsistent reasoning |

## Lost-in-Middle Phenomenon

- Information in middle gets 10-40% lower recall
- Models allocate massive attention to first token (BOS sink)
- As context grows, middle tokens fail to get sufficient attention
- **Mitigation**: Place critical info at beginning/end

```markdown
[CURRENT TASK]              # Beginning - high attention
- Critical requirements

[DETAILED CONTEXT]          # Middle - lower attention
- Supporting details

[KEY FINDINGS]              # End - high attention
- Important conclusions
```

## Context Poisoning

**Entry points**:
1. Tool outputs with errors/unexpected formats
2. Retrieved docs with incorrect/outdated info
3. Model-generated summaries with hallucinations

**Detection symptoms**:
- Degraded quality on previously successful tasks
- Tool misalignment (wrong tools/parameters)
- Persistent hallucinations

**Recovery**:
- Truncate to before poisoning point
- Explicit note + re-evaluation request
- Restart with clean context, preserve only verified info

## Model Degradation Thresholds

| Model | Degradation Onset | Severe Degradation |
|-------|-------------------|-------------------|
| GPT-5.2 | ~64K tokens | ~200K tokens |
| Claude Opus 4.5 | ~100K tokens | ~180K tokens |
| Claude Sonnet 4.5 | ~80K tokens | ~150K tokens |
| Gemini 3 Pro | ~500K tokens | ~800K tokens |

## Four-Bucket Mitigation

1. **Write**: Save externally (scratchpads, files)
2. **Select**: Pull only relevant (retrieval, filtering)
3. **Compress**: Reduce tokens (summarization)
4. **Isolate**: Split across sub-agents (partitioning)

## Detection Heuristics

```python
def calculate_health(utilization, degradation_risk, poisoning_risk):
    """Health score: 1.0 = healthy, 0.0 = critical"""
    score = 1.0
    score -= utilization * 0.5 if utilization > 0.7 else 0
    score -= degradation_risk * 0.3
    score -= poisoning_risk * 0.2
    return max(0, score)

# Thresholds: healthy >0.8, warning >0.6, degraded >0.4, critical <=0.4
```

## Guidelines

1. Monitor context length vs performance correlation
2. Place critical info at beginning/end
3. Implement compaction before degradation
4. Validate retrieved docs before adding
5. Use versioning to prevent outdated clash
6. Segment tasks to prevent confusion
7. Design for graceful degradation

## Related Topics

- [Context Optimization](./context-optimization.md) - Mitigation techniques
- [Multi-Agent Patterns](./multi-agent-patterns.md) - Isolation strategies
