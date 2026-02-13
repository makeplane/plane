---
name: Problem-Solving Techniques
description: Apply systematic problem-solving techniques when stuck. Use for complexity spirals, innovation blocks, recurring patterns, assumption constraints, simplification cascades, scale uncertainty.
version: 2.0.0
---

# Problem-Solving Techniques

Systematic approaches for different types of stuck-ness. Each technique targets specific problem patterns.

## When to Use

Apply when encountering:
- **Complexity spiraling** - Multiple implementations, growing special cases, excessive branching
- **Innovation blocks** - Conventional solutions inadequate, need breakthrough thinking
- **Recurring patterns** - Same issue across domains, reinventing solutions
- **Assumption constraints** - Forced into "only way", can't question premise
- **Scale uncertainty** - Production readiness unclear, edge cases unknown
- **General stuck-ness** - Unsure which technique applies

## Quick Dispatch

**Match symptom to technique:**

| Stuck Symptom | Technique | Reference |
|---------------|-----------|-----------|
| Same thing implemented 5+ ways, growing special cases | **Simplification Cascades** | `references/simplification-cascades.md` |
| Conventional solutions inadequate, need breakthrough | **Collision-Zone Thinking** | `references/collision-zone-thinking.md` |
| Same issue in different places, reinventing wheels | **Meta-Pattern Recognition** | `references/meta-pattern-recognition.md` |
| Solution feels forced, "must be done this way" | **Inversion Exercise** | `references/inversion-exercise.md` |
| Will this work at production? Edge cases unclear? | **Scale Game** | `references/scale-game.md` |
| Unsure which technique to use | **When Stuck** | `references/when-stuck.md` |

## Core Techniques

### 1. Simplification Cascades
Find one insight eliminating multiple components. "If this is true, we don't need X, Y, Z."

**Key insight:** Everything is a special case of one general pattern.

**Red flag:** "Just need to add one more case..." (repeating forever)

### 2. Collision-Zone Thinking
Force unrelated concepts together to discover emergent properties. "What if we treated X like Y?"

**Key insight:** Revolutionary ideas from deliberate metaphor-mixing.

**Red flag:** "I've tried everything in this domain"

### 3. Meta-Pattern Recognition
Spot patterns appearing in 3+ domains to find universal principles.

**Key insight:** Patterns in how patterns emerge reveal reusable abstractions.

**Red flag:** "This problem is unique" (probably not)

### 4. Inversion Exercise
Flip core assumptions to reveal hidden constraints. "What if the opposite were true?"

**Key insight:** Valid inversions reveal context-dependence of "rules."

**Red flag:** "There's only one way to do this"

### 5. Scale Game
Test at extremes (1000x bigger/smaller, instant/year-long) to expose fundamental truths.

**Key insight:** What works at one scale fails at another.

**Red flag:** "Should scale fine" (without testing)

## Application Process

1. **Identify stuck-type** - Match symptom to technique above
2. **Load detailed reference** - Read specific technique from `references/`
3. **Apply systematically** - Follow technique's process
4. **Document insights** - Record what worked/failed
5. **Combine if needed** - Some problems need multiple techniques

## Combining Techniques

Powerful combinations:
- **Simplification + Meta-pattern** - Find pattern, then simplify all instances
- **Collision + Inversion** - Force metaphor, then invert its assumptions
- **Scale + Simplification** - Extremes reveal what to eliminate
- **Meta-pattern + Scale** - Universal patterns tested at extremes

## References

Load detailed guides as needed:
- `references/when-stuck.md` - Dispatch flowchart and decision tree
- `references/simplification-cascades.md` - Cascade detection and extraction
- `references/collision-zone-thinking.md` - Metaphor collision process
- `references/meta-pattern-recognition.md` - Pattern abstraction techniques
- `references/inversion-exercise.md` - Assumption flipping methodology
- `references/scale-game.md` - Extreme testing procedures
- `references/attribution.md` - Source and adaptation notes
