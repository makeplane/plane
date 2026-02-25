# Context Optimization

Extend effective context capacity through strategic techniques.

## Four Core Strategies

| Strategy | Target | Reduction | When to Use |
|----------|--------|-----------|-------------|
| **Compaction** | Full context | 50-70% | Approaching limits |
| **Observation Masking** | Tool outputs | 60-80% | Verbose outputs >80% |
| **KV-Cache Optimization** | Repeated prefixes | 70%+ hit | Stable prompts |
| **Context Partitioning** | Work distribution | N/A | Parallelizable tasks |

## Compaction

Summarize context when approaching limits.

**Priority**: Tool outputs → Old turns → Retrieved docs → Never: System prompt

```python
if context_tokens / context_limit > 0.8:
    context = compact_context(context)
```

**Preserve**: Key findings, decisions, commitments (remove supporting details)

## Observation Masking

Replace verbose tool outputs with compact references.

```python
if len(observation) > max_length:
    ref_id = store_observation(observation)
    return f"[Obs:{ref_id}. Key: {extract_key(observation)}]"
```

**Never mask**: Current task critical, most recent turn, active reasoning
**Always mask**: Repeated outputs, boilerplate, already summarized

## KV-Cache Optimization

Reuse cached Key/Value tensors for identical prefixes.

```python
# Cache-friendly ordering (stable first)
context = [system_prompt, tool_definitions]  # Cacheable
context += [unique_content]                   # Variable last
```

**Tips**: Avoid timestamps in stable sections, consistent formatting, stable structure

## Context Partitioning

Split work across sub-agents with isolated contexts.

```python
result = await sub_agent.process(subtask, clean_context=True)
coordinator.receive(result.summary)  # Only essentials
```

## Decision Framework

| Dominant Component | Apply |
|-------------------|-------|
| Tool outputs | Observation masking |
| Retrieved docs | Summarization or partitioning |
| Message history | Compaction + summarization |
| Multiple | Combine strategies |

## Guidelines

1. Measure before optimizing
2. Apply compaction before masking
3. Design for cache stability
4. Partition before context problematic
5. Monitor effectiveness over time
6. Balance savings vs quality

## Related

- [Context Compression](./context-compression.md)
- [Memory Systems](./memory-systems.md)
