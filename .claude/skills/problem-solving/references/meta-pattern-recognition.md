# Meta-Pattern Recognition

Spot patterns appearing in 3+ domains to find universal principles.

## Core Principle

**Find patterns in how patterns emerge.** When the same pattern appears in 3+ domains, it's likely a universal principle worth extracting.

## When to Use

| Symptom | Action |
|---------|--------|
| Same issue in different places | Extract the abstract form |
| Déjà vu in problem-solving | Find the universal pattern |
| Reinventing wheels across domains | Identify the meta-pattern |
| "Haven't we done this before?" | Yes, find and reuse it |

## Quick Reference

| Pattern Appears In | Abstract Form | Where Else? |
|-------------------|---------------|-------------|
| CPU/DB/HTTP/DNS caching | Store frequently-accessed data closer | LLM prompt caching, CDN |
| Layering (network/storage/compute) | Separate concerns into abstraction levels | Architecture, org structure |
| Queuing (message/task/request) | Decouple producer from consumer with buffer | Event systems, async |
| Pooling (connection/thread/object) | Reuse expensive resources | Memory mgmt, governance |

## Process

1. **Spot repetition** - See same shape in 3+ places
2. **Extract abstract form** - Describe independent of any domain
3. **Identify variations** - How does it adapt per domain?
4. **Check applicability** - Where else might this help?
5. **Document pattern** - Make it reusable

## Detailed Example

**Pattern spotted:** Rate limiting appears in:
- API throttling (requests per minute)
- Traffic shaping (packets per second)
- Circuit breakers (failures per window)
- Admission control (concurrent connections)

**Abstract form:** Bound resource consumption to prevent exhaustion

**Variation points:**
- What resource (requests, packets, failures, connections)
- What limit (per time window, concurrent, cumulative)
- What happens when exceeded (reject, queue, degrade)

**New application:** LLM token budgets
- Same pattern: prevent context window exhaustion
- Resource: tokens
- Limit: context window size
- Action: truncate or reject

## 3+ Domain Rule

**Why 3 domains?**
- 1 occurrence = coincidence
- 2 occurrences = possible pattern
- 3+ occurrences = likely universal

**Domain independence test:**
Can you describe the pattern without mentioning specific domains?

## Red Flags

Signs you're missing meta-patterns:
- "This problem is unique" (probably not)
- Multiple teams solving "different" problems identically
- Reinventing wheels across domains
- "Haven't we done something like this?" (yes, find it)

## Benefits of Meta-Patterns

- **Battle-tested** - Proven across multiple domains
- **Reusable** - Apply to new situations
- **Universal** - Domain-independent solutions
- **Documented** - Known variations and trade-offs

## Remember

- 3+ domains = likely universal
- Abstract form reveals new applications
- Variations show adaptation points
- Universal patterns save time
- Document for future reuse
