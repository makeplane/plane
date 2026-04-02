# Metadata Quality Criteria

Metadata determines when Claude activates the skill. Poor metadata = wrong activation or missed activation.

## Name Field

**Format:** use either `skill-name` or `namespace:skill-name` (for example `ck:plan`), all lowercase

**Good Examples:**
- `pdf-editor` - clear domain
- `ck:bigquery-analyst` - namespaced variant
- `frontend-webapp-builder` - specific function

**Bad Examples:**
- `helper` - too generic
- `mySkill` - wrong case
- `pdf` - too short, unclear purpose

## Description Field

**Constraint:** ≤1024 characters (official max). Shorter is better for token efficiency, but longer descriptions trigger more reliably.

**Purpose:** Trigger automatic activation during implementation. Be "pushy" — include specific trigger contexts.

### Good Descriptions

Specific, action-oriented, includes use cases:

```yaml
description: Build React/TypeScript frontends with modern patterns. Use for components, Suspense, lazy loading, performance optimization.
```

```yaml
description: Process PDFs with rotation, splitting, merging. Use for document manipulation, page extraction, PDF conversion.
```

### Bad Descriptions

Too generic or educational:

```yaml
description: A skill for working with databases.  # Too vague
```

```yaml
description: This skill helps you understand how React works.  # Educational, not actionable
```

## Trigger Precision

Description should answer: "What phrases would a user say that should trigger this skill?"

**Example for `image-editor` skill:**
- "Remove red-eye from this image"
- "Rotate this photo 90 degrees"
- "Crop the background out"

Include these trigger phrases/actions in description.

## Third-Person Style

**Correct:** "This skill should be used when..."
**Wrong:** "Use this skill when..." or "You should use this..."

## Validation

Check with packaging script:

```bash
scripts/package_skill.py <skill-path>
```

Fails if:
- Missing name or description
- Description exceeds 1024 characters
- Name exceeds 64 characters
- Invalid YAML syntax

## Pushy Descriptions (Anti-Undertriggering)

**Problem:** Generic descriptions cause skills to activate too rarely.

```yaml
# BAD — undertriggers
description: Data processing skill

# GOOD — triggers reliably
description: Process CSV files and tabular data. Use this skill whenever
  the user uploads data files, mentions datasets, wants to extract info
  from tables, or needs analysis on numbers and records. Make sure to
  use this skill whenever data transformation is needed.
```

Include "Use this skill whenever..." and list specific trigger contexts.
