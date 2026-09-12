---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
disallowed-tools:
  - WebFetch
  - WebSearch
harness: universal
---

# Test-Driven Development

## Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_ it does it. A good test reads like a specification - "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

**Tautological tests** restate the implementation inside the assertion, so they pass by construction and give zero confidence. When the expected value is computed the way the code computes it — `expect(add(a, b)).toBe(a + b)`, snapshotting a figure you derived by hand the same way the code does, asserting a constant equals itself — the test can never disagree with the code: break the code wrong and the assertion breaks wrong with it. The expected value must come from an independent source of truth — a known-good literal, a worked example, the spec.

See [tests.md](references/tests.md) for examples and [mocking.md](references/mocking.md) for mocking guidelines.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" - treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes - they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
  ...
```

## Workflow

### 1. Planning

When exploring the codebase, if the project keeps a domain glossary or ADRs (naming may vary — `CONTEXT.md`, `docs/domain.md`, `docs/adr/`, etc.), read it so test names and interface vocabulary match the project's domain language, and respect any decisions recorded there. Otherwise, negotiate domain terms with the user directly.

Before writing any code:

- [ ] Confirm with user what interface changes are needed
- [ ] Confirm with user which behaviors to test (prioritize)
- [ ] Identify opportunities for deep modules (small interface, deep implementation) — the testability checks below apply regardless of what the project calls its architecture-review process
- [ ] List the behaviors to test (not implementation steps)
- [ ] Get user approval on the plan

Ask: "What should the public interface look like? Which behaviors are most important to test?"

**You can't test everything.** Confirm with the user exactly which behaviors matter most. Focus testing effort on critical paths and complex logic, not every possible edge case.

### 2. Tracer Bullet

Write ONE test that confirms ONE thing about the system:

```
RED:   Write test for first behavior → test fails
GREEN: Write minimal code to pass → test passes
```

This is your tracer bullet - proves the path works end-to-end.

### 3. Incremental Loop

For each remaining behavior:

```
RED:   Write next test → fails
GREEN: Minimal code to pass → passes
```

Rules:

- One test at a time
- Only enough code to pass current test
- Don't anticipate future tests
- Keep tests focused on observable behavior

### 4. Refactor

After all tests pass, look for [refactor candidates](references/refactoring.md):

- [ ] Extract duplication
- [ ] Deepen modules (move complexity behind simple interfaces)
- [ ] Apply SOLID principles where natural
- [ ] Consider what new code reveals about existing code
- [ ] Run tests after each refactor step

**Never refactor while RED.** Get to GREEN first.

## Checklist Per Cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] Expected values are independent literals, not recomputed from the code
[ ] Code is minimal for this test
[ ] No speculative features added
```

## Advanced Testing Techniques

Once the core RED/GREEN/refactor loop is established, two techniques raise confidence beyond example-based tests — use them to *validate* and *extend* a suite that's already testing real behavior, not as a substitute for it.

### Mutation Testing

Validates that the existing test suite actually catches regressions, rather than just achieving coverage. A mutation-testing tool (Stryker for JS/TS, PIT for Java, mutmut for Python, cargo-mutants for Rust) systematically introduces small code changes ("mutants" — flipped arithmetic/relational/logical operators, altered conditional boundaries, mutated statements) and reruns the suite against each. A mutant that survives (tests still pass despite the behavior change) marks a gap: either a missing test or an existing test that's tautological/implementation-coupled rather than behavior-verifying — the same failure mode this skill's Philosophy section warns about.

Setup checklist:
- Pick the framework for the project's language and install/configure it against the existing test runner.
- Configure which mutation operators to run (arithmetic, relational, logical, conditional-boundary, statement) — start narrow, expand once the workflow is trusted.
- Enable parallel execution and incremental/file-filtered runs — full mutation runs are expensive; incremental mode (mutating only changed files) keeps it usable in CI.
- Set a mutation-score threshold as a quality gate, and track surviving mutants over time rather than chasing 100% — a rising trend of dismissed survivors is itself a signal to inspect.
- Wire into CI as a reporting step first; only make it a hard gate once the team trusts the signal (early false-positive noise from equivalent mutants — code changes that can't actually be observed by any test — otherwise erodes trust in the gate).

### Property-Based Testing

Complements example-based tests by generating many inputs against a stated invariant, rather than hand-picking cases. Best suited to code with mathematical properties, round-trip behavior (serialize/deserialize, encode/decode), or business invariants (e.g., "total after discount is never negative", "sorting is idempotent") — not a wholesale replacement for behavior-driven example tests.

Setup checklist:
- Pick the framework for the language (fast-check for JS/TS, Hypothesis for Python, QuickCheck for Haskell, proptest for Rust, test.check for Clojure).
- Identify properties before writing generators: symmetries (A then B then A⁻¹ returns the start state), round-trips, invariants that must hold for *all* valid inputs, not just the examples already covered.
- Design generators/constraints deliberately — overly-loose generators waste cycles on irrelevant inputs; overly-tight ones miss the edge cases property testing exists to find.
- Configure shrinking (minimizing a failing input to the smallest reproducing case) — this is what makes a property-test failure debuggable instead of a wall of random data.
- Integrate into the existing suite and CI the same way as any other test; keep property tests alongside, not instead of, the example-based tests for the same behavior.

**When to reach for these**: mutation testing after a suite already exists, to audit its real effectiveness before trusting it as a regression gate. Property-based testing when writing tests for logic with a checkable invariant, in addition to the concrete example tests the tracer-bullet workflow already produces.

## Companion Skills

`/project-execute` invokes this skill at pre-agreed seams — TDD is the engine behind the execution orchestrator. (Formerly `/implement`, retired 2026-08-29, superseded by project-execute.)
