# Multi-Agent Patterns

Distribute work across multiple context windows for isolation and scale.

## Core Insight

Sub-agents exist to **isolate context**, not anthropomorphize roles.

## Token Economics

| Architecture | Multiplier | Use Case |
|--------------|------------|----------|
| Single agent | 1x | Simple tasks |
| Single + tools | ~4x | Moderate complexity |
| Multi-agent | ~15x | Context isolation needed |

**Key**: Token usage explains 80% of performance variance.

## Patterns

### Supervisor/Orchestrator

```python
class Supervisor:
    def process(self, task):
        subtasks = self.decompose(task)
        results = [worker.execute(st, clean_context=True) for st in subtasks]
        return self.aggregate(results)
```

**Pros**: Control, human-in-loop | **Cons**: Bottleneck, telephone game

### Peer-to-Peer/Swarm

```python
def process_with_handoff(agent, task):
    result = agent.process(task)
    if "handoff" in result:
        return process_with_handoff(select_agent(result["to"]), result["state"])
    return result
```

**Pros**: No SPOF, scales | **Cons**: Complex coordination

### Hierarchical

Strategy → Planning → Execution layers
**Pros**: Separation of concerns | **Cons**: Coordination overhead

## Context Isolation Patterns

| Pattern | Isolation | Use Case |
|---------|-----------|----------|
| Full delegation | None | Max capability |
| Instruction passing | High | Simple tasks |
| File coordination | Medium | Shared state |

## Consensus Mechanisms

```python
def weighted_consensus(responses):
    scores = {}
    for r in responses:
        weight = r["confidence"] * r["expertise"]
        scores[r["answer"]] = scores.get(r["answer"], 0) + weight
    return max(scores, key=scores.get)
```

## Failure Recovery

| Failure | Mitigation |
|---------|------------|
| Bottleneck | Output schemas, checkpointing |
| Overhead | Clear handoffs, batching |
| Divergence | Boundaries, convergence checks |
| Errors | Validation, circuit breakers |

## Guidelines

1. Use multi-agent for context isolation, not role-play
2. Accept ~15x token cost for benefits
3. Implement circuit breakers
4. Use files for shared state
5. Design clear handoffs
6. Validate between agents

## Related

- [Context Optimization](./context-optimization.md)
- [Evaluation](./evaluation.md)
