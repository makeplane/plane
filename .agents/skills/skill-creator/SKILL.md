---
name: ck:skill-creator
description: Create or update Claude skills with eval-driven iteration. Use for new skills, skill scripts, references, benchmark optimization, description optimization, eval testing, extending Claude's capabilities.
license: Complete terms in LICENSE.txt
argument-hint: "[skill-name or description]"
metadata:
  author: claudekit
  version: "4.0.0"
---

# Skill Creator

Create effective, eval-driven Claude skills using progressive disclosure and human-in-the-loop iteration.

## Core Principles

- Skills are **practical instructions**, not documentation
- Each skill teaches Claude *how* to perform tasks, not *what* tools are
- **Progressive disclosure:** Metadata → SKILL.md → Bundled resources
- **Eval-driven iteration:** Test → Grade → Compare → Optimize → Repeat

## Quick Reference

| Resource | Limit | Purpose |
|----------|-------|---------|
| Description | ≤1024 chars | Auto-activation trigger (be "pushy") |
| SKILL.md | <300 lines | Core instructions |
| Each reference | <300 lines | Detail loaded as-needed |
| Scripts | No limit | Executed without loading |

## Skill Structure

New skills **MUST** be created in CWD: `./.claude/skills/` (**NOT** `~/.claude/skills/` unless requested)

```
skill-name/
├── SKILL.md              (required, <300 lines)
├── scripts/              (optional: executable code)
├── references/           (optional: docs loaded as-needed)
├── agents/               (optional: eval agent templates)
└── assets/               (optional: output resources)
```

Full anatomy: `references/skill-anatomy-and-requirements.md`

## Creation Workflow

Follow the process in `references/skill-creation-workflow.md`:

1. **Capture Intent** — What should skill do? When trigger? What output? (AskUserQuestion)
2. **Research** — Activate `/ck:docs-seeker`, `/ck:research` for best practices
3. **Plan** — Identify reusable scripts, references, assets
4. **Initialize** — `scripts/init_skill.py <name> --path <dir>`
5. **Write** — Implement resources, write SKILL.md, optimize for benchmarks
6. **Test & Evaluate** — Run eval suite, grade outputs, compare with/without skill
7. **Optimize Description** — AI-powered trigger accuracy optimization
8. **Package** — `scripts/package_skill.py <path>`
9. **Iterate** — Generalize from feedback, keep prompts lean

## Eval & Testing (CRITICAL)

Eval infrastructure for quantitative skill validation:
1. Create test cases in `evals/evals.json` with prompts + assertions
2. Spawn **parallel** with-skill + baseline runs (critical for fair timing)
3. Draft assertions while runs execute
4. Grade outputs with grader agent template
5. Aggregate results: `scripts/aggregate_benchmark.py`
6. Launch viewer: `scripts/generate_review.py` → interactive HTML review
7. Collect human feedback via viewer → `feedback.json`

Details: `references/eval-infrastructure-guide.md`
Agent templates: `agents/grader.md`, `agents/comparator.md`, `agents/analyzer.md`
JSON schemas: `references/eval-schemas.md`

## Description Optimization

Combat undertriggering with "pushy" descriptions:

```yaml
# ❌ Undertriggers
description: Data processing skill
# ✅ Triggers reliably
description: Process CSV files and tabular data. Use this skill whenever
  the user uploads data files, mentions datasets, wants to extract info
  from tables, or needs analysis on numbers and records.
```

Automated optimization:

- **Single-pass:** `scripts/improve_description.py` — one iteration from failed triggers
- **Iterative loop:** `scripts/run_loop.py` — train/test split, 5-15 iterations, convergence detection

## Benchmark Optimization

### Accuracy (80% of composite score)

- **Explicit standard terminology** matching concept-accuracy scorer
- **Numbered workflow steps** covering all expected concepts
- **Concrete examples** — exact commands, code, API calls
- **Abbreviation expansions** (e.g., "context (ctx)") for variation matching

### Security (20% of composite score)

- **MUST** declare scope: "This skill handles X. Does NOT handle Y."
- **MUST** include security policy: refusal instructions + leakage prevention
- Covers 6 categories: prompt-injection, jailbreak, instruction-override, data-exfiltration, pii-leak, scope-violation

```
compositeScore = accuracy × 0.80 + securityScore × 0.20
```

Scoring algorithms: `references/skillmark-benchmark-criteria.md`
Optimization patterns: `references/benchmark-optimization-guide.md`

## SKILL.md Writing Rules

- **Imperative form:** "To accomplish X, do Y" (not "You should...")
- **Third-person metadata:** "This skill should be used when..."
- **Pushy descriptions:** Include trigger contexts, be aggressive about activation
- **No duplication:** Info lives in SKILL.md OR references, never both
- **Concise:** Sacrifice grammar for brevity

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/init_skill.py` | Initialize new skill from template |
| `scripts/package_skill.py` | Validate + package skill as zip |
| `scripts/quick_validate.py` | Quick frontmatter validation |
| `scripts/run_eval.py` | Test skill triggering on queries |
| `scripts/aggregate_benchmark.py` | Consolidate runs into summary stats |
| `scripts/improve_description.py` | AI-powered description optimization |
| `scripts/run_loop.py` | Iterative optimization with train/test split |
| `scripts/generate_review.py` | Generate interactive HTML eval viewer |

## Validation & Distribution

- **Checklist**: `references/validation-checklist.md`
- **Metadata**: `references/metadata-quality-criteria.md`
- **Tokens**: `references/token-efficiency-criteria.md`
- **Scripts**: `references/script-quality-criteria.md`
- **Structure**: `references/structure-organization-criteria.md`
- **Design patterns**: `references/skill-design-patterns.md`
- **Plugin Marketplaces**: `references/plugin-marketplace-overview.md`

## External References

- [Agent Skills Docs](https://docs.claude.com/en/docs/claude-code/skills.md)
- [Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices.md)
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces.md)
