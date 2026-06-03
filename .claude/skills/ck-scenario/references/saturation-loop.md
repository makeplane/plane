# Saturation Loop — ck:scenario

Documents the iterative saturation algorithm absorbed from upstream `/autoresearch:scenario`.

Source: `uditgoenka/autoresearch` — `.claude/skills/autoresearch/references/scenario-workflow.md`
License: MIT

---

## Core Concept

One-shot mode generates scenarios in a single pass across applicable dimensions.
Saturation mode runs multiple iterations, classifying each candidate as New/Variant/Duplicate,
and halts when novelty dries up — confirming coverage is exhausted rather than just stopping arbitrarily.

---

## Iteration Loop

```
while not halted:
    pick highest-priority unexplored dimension or combination
    generate ONE concrete situation (Phase 3)
    classify against all previously kept situations (Phase 4)
    if New or Variant: keep, expand edge cases (Phase 5), log
    if Duplicate/OutOfScope/LowValue: discard, log reason
    check halt condition
    if iteration % 5 == 0: print progress summary
```

Each iteration is atomic: generate → classify → decide → log → repeat.

---

## Novelty Detection

Classification is semantic, not lexical. Compare candidate against all kept situations:

| Classification   | Criteria                                                                             |
| ---------------- | ------------------------------------------------------------------------------------ |
| **New**          | Different dimension AND different trigger/precondition than any existing situation   |
| **Variant**      | Same dimension OR similar trigger but meaningfully different actor, data, or outcome |
| **Duplicate**    | Same dimension + same trigger + same expected outcome as existing situation          |
| **Out of scope** | Does not map to the seed scenario                                                    |
| **Low value**    | Technically possible but not plausible in the target domain                          |

Check semantic similarity — same flow with different field names is Duplicate, not Variant.
Different actor performing the same step IS a Variant (persona shift adds value).

---

## Halt Conditions

### Bounded mode (`--iterations N`)

Stop after exactly N iterations. Print final summary.

### Saturation mode (`--saturation`)

Track a consecutive-no-new counter:

- Each iteration that produces 0 `New` classifications: increment counter
- Each iteration that produces ≥1 `New` classification: reset counter to 0
- When counter reaches **2**: halt with confidence message

The threshold of 2 matches upstream default. Rationale: one barren iteration could be a
dimension exhaustion artifact; two consecutive confirms the scenario space is saturated.

### Unbounded mode (neither flag set, default one-shot)

Generate 3–5 scenarios per relevant dimension in a single pass. No iteration loop.
Preserved for backwards compatibility.

---

## Diminishing Returns Warning

In saturation mode, print a warning after 5 consecutive iterations with no new unique situations:

```
[!] Diminishing returns: 5 consecutive iterations produced no novel scenarios.
    Consider narrowing scope or switching to --saturation to halt automatically.
```

(This warning fires before the halt condition in bounded mode — it's advisory only.)

---

## Progress Summary (every 5 iterations)

```
=== Scenario Progress (iteration 15) ===
Scenarios kept:    12  (8 new, 4 variants)
Discarded:          3  (2 duplicates, 1 out-of-scope)
Dimensions covered: 7/12 (58%)
Edge cases found:  18
Severity:          2 Critical, 4 High, 8 Medium, 4 Low
Coverage gaps:     scale, temporal, recovery
```

---

## TSV Log Format

Append one row per iteration to `scenario-results.tsv`:

```tsv
iteration	dimension	classification	severity	title	description	parent
1	happy_path	new	-	Successful checkout	User completes standard checkout	-
2	error_path	new	HIGH	Payment declined	Card rejected during checkout	-
3	edge_case	duplicate	-	Empty cart	Already covered by #1	#1
```

---

## Generation Strategies (rotation)

Upstream defines 6 strategies. Rotate to avoid dimension lock:

| Strategy       | When                                                                |
| -------------- | ------------------------------------------------------------------- |
| Dimension walk | Iterations 1–N covering first pass of all dimensions                |
| Combination    | Mid-iterations: combine 2 dimensions (e.g., edge_case + concurrent) |
| Negation       | When stuck: negate a happy-path step                                |
| Amplification  | Amplify one parameter of an existing situation to extreme           |
| Persona shift  | Same scenario, different actor                                      |
| Temporal shift | Same scenario, different time (peak load, maintenance, first use)   |

Force dimension rotation after 3 consecutive same-dimension iterations.

---

## Composite Score (bounded mode only)

At end of bounded run, compute:

```
scenario_score = scenarios_generated * 10
              + edge_cases_found * 15
              + (dimensions_covered / total_dimensions) * 30
              + unique_actors_explored * 5
              + high_severity_found * 3
```

Higher = more thorough. Incentivizes breadth AND depth.

---

## What NOT to Do

| Anti-pattern            | Why                                              |
| ----------------------- | ------------------------------------------------ |
| Generate 50 happy paths | No value after baseline established              |
| Stay in one dimension   | Force rotation after 3 same-dimension iterations |
| Vague situations        | Require specific trigger, flow, and outcome      |
| Skip classification     | Duplicates inflate count without adding coverage |
