# Scale Game

Test at extremes (1000x bigger/smaller, instant/year-long) to expose fundamental truths hidden at normal scales.

## Core Principle

**Extremes expose fundamentals.** What works at one scale fails at another.

## When to Use

| Symptom | Action |
|---------|--------|
| "Should scale fine" (without testing) | Test at extremes |
| Uncertain about production behavior | Scale up 1000x |
| Edge cases unclear | Test minimum and maximum |
| Architecture validation needed | Extreme testing |

## Quick Reference

| Scale Dimension | Test At Extremes | What It Reveals |
|-----------------|------------------|-----------------|
| **Volume** | 1 item vs 1B items | Algorithmic complexity limits |
| **Speed** | Instant vs 1 year | Async requirements, caching needs |
| **Users** | 1 user vs 1B users | Concurrency issues, resource limits |
| **Duration** | Milliseconds vs years | Memory leaks, state growth |
| **Failure rate** | Never fails vs always fails | Error handling adequacy |

## Process

1. **Pick dimension** - What could vary extremely?
2. **Test minimum** - What if 1000x smaller/faster/fewer?
3. **Test maximum** - What if 1000x bigger/slower/more?
4. **Note what breaks** - Where do limits appear?
5. **Note what survives** - What's fundamentally sound?
6. **Design for reality** - Use insights to validate architecture

## Detailed Examples

### Example 1: Error Handling
- **Normal scale:** "Handle errors when they occur" works fine
- **At 1B scale:** Error volume overwhelms logging, crashes system
- **Reveals:** Need to make errors impossible (type systems) or expect them (chaos engineering)
- **Action:** Design error handling for volume, not just occurrence

### Example 2: Synchronous APIs
- **Normal scale:** Direct function calls work, < 100ms latency
- **At global scale:** Network latency makes synchronous unusable (200-500ms)
- **Reveals:** Async/messaging becomes survival requirement, not optimization
- **Action:** Design async-first from start

### Example 3: In-Memory State
- **Normal duration:** Works for hours/days in development
- **At years:** Memory grows unbounded, eventual crash (weeks → months → years)
- **Reveals:** Need persistence or periodic cleanup, can't rely on memory forever
- **Action:** Design for stateless or externalized state

### Example 4: Single vs Million Users
- **Normal scale:** Session in memory works for 100 users
- **At 1M scale:** Memory exhausted, server crashes
- **Reveals:** Need distributed session store (Redis, database)
- **Action:** Design for horizontal scaling from start

## Both Directions Matter

**Test smaller too:**
- What if only 1 user? Does complexity make sense?
- What if only 10 items? Is optimization premature?
- What if instant response? What becomes unnecessary?

Often reveals over-engineering or premature optimization.

## Red Flags

You need scale game when:
- "It works in dev" (but will it work in production?)
- No idea where limits are
- "Should scale fine" (without evidence)
- Surprised by production behavior
- Architecture feels arbitrary

## Success Metrics

After scale game, you should know:
- Where system breaks (exact limits)
- What survives (fundamentally sound parts)
- What needs redesign (scale-dependent)
- Production readiness (validated architecture)

## Remember

- Extremes reveal fundamentals hidden at normal scales
- What works at one scale fails at another
- Test BOTH directions (bigger AND smaller)
- Use insights to validate architecture early
- Don't guess - test at extremes
