# Skill Creation Workflow

9-step process. Follow in order; skip only with clear justification.

## Step 1: Capture Intent

Gather real usage patterns via `AskUserQuestion` tool:

- "What tasks should this skill handle?"
- "Give examples of how it would be used?"
- "What phrases should trigger this skill?"
- "What's the expected output format?"
- "Should we create test cases?" (recommended for objective outputs)

Conclude when functionality scope is clear.

## Step 2: Research

Activate `/ck:docs-seeker` and `/ck:research` skills. Research:

- Best practices & industry standards
- Existing CLI tools (`npx`, `bunx`, `pipx`) for reuse
- Workflows & case studies
- Edge cases & pitfalls

Use parallel `WebFetch` + `Explore` subagents for multiple URLs.
Write reports for next step.

## Step 3: Plan Reusable Contents

Analyze each example:

1. How to execute from scratch?
2. Prefer existing CLI tools over custom code
3. What scripts/references/assets enable repeated execution?
4. Check skills catalog — avoid duplication, reuse existing

**Patterns:**

- Repeated code → `scripts/` (Python/Node.js, with tests)
- Repeated discovery → `references/` (schemas, docs, APIs)
- Repeated boilerplate → `assets/` (templates, images)

Scripts MUST: respect `.env` hierarchy, have tests, pass all tests.

## Step 4: Initialize

For new skills, run init script:

```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

Creates: SKILL.md template, `scripts/`, `references/`, `assets/` with examples.
Skip if skill already exists (go to Step 5).

## Step 5: Write the Skill

### 5a: Implement Resources

Start with `scripts/`, `references/`, `assets/` identified in Step 3.
Delete unused example files from initialization.
May require user input (brand assets, configs, etc.).

### 5b: Write SKILL.md

**Writing style:** Imperative/infinitive form. "To accomplish X, do Y."
**Size:** Under 300 lines. Move details to `references/`.

Answer these in SKILL.md:

1. Purpose (2-3 sentences)
2. When to use (trigger conditions)
3. How to use (reference all bundled resources)

### 5c: Benchmark Optimization

**MUST** include for high Skillmark scores:

- **Scope declaration** — "This skill handles X. Does NOT handle Y."
- **Security policy** — Refusal instructions + leakage prevention
- **Structured workflows** — Numbered steps covering all expected concepts
- **Explicit terminology** — Standard terms matching concept-accuracy scorer
- **Reference linking** — `references/` files for detailed knowledge

See `references/benchmark-optimization-guide.md` for detailed patterns.

### 5d: Write Pushy Description

Description ≤1024 chars. Include specific trigger contexts:

```yaml
description: Process CSV files and tabular data. Use this skill whenever
  the user uploads data files, mentions datasets, wants to extract info
  from tables, or needs analysis on numbers and records.
```

See `references/metadata-quality-criteria.md` for examples.

## Step 6: Test & Evaluate

### 6a: Create Test Cases

Write `evals/evals.json` with 2-3 realistic test prompts + assertions.
See `references/eval-schemas.md` for JSON format.

### 6b: Run Parallel Evals

Spawn with-skill AND baseline runs simultaneously (CRITICAL for timing).
Draft assertions while runs execute.

### 6c: Grade & Aggregate

- Grade outputs with grader agent (`agents/grader.md`)
- Aggregate results: `scripts/aggregate_benchmark.py`
- Launch viewer: `eval-viewer/generate_review.py`

### 6d: Human Review

Present viewer to user:
- **Outputs tab** — qualitative review, feedback textbox
- **Benchmark tab** — quantitative metrics

See `references/eval-infrastructure-guide.md` for details.

## Step 7: Optimize Description

Combat undertriggering with automated optimization:

- **Single-pass:** `scripts/improve_description.py` — one iteration
- **Iterative loop:** `scripts/run_loop.py` — train/test split, convergence detection

## Step 8: Package & Validate

```bash
scripts/package_skill.py <path/to/skill-folder>
```

Validates: frontmatter, naming, description, structure.
Fix all errors, re-run until clean.

## Step 9: Iterate

1. Read `feedback.json` from viewer
2. Generalize from feedback — don't overfit to test examples
3. Keep prompts lean — remove ineffective instructions
4. Update SKILL.md or resources
5. Re-test (return to Step 6)
6. Scale test set to 5-10 cases for production skills

**Benchmark iteration:** Run `skillmark` CLI, review per-concept accuracy, fix gaps.
