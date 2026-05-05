# Phase 1: Audit & Deduplicate

## Context Links

- [Plan Overview](plan.md)
- [Research: Context Management](research/researcher-01-context-management-best-practices.md)
- [Research: Rule Coverage](research/researcher-02-plane-component-rule-coverage.md)

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 30m
- **Description**: Map all duplication across CLAUDE.md, GEMINI.md, .claude/rules/, .agent/rules/, and docs/. Produce dedup map. Delete redundant content.

## Key Insights

- .claude/rules/ and .agent/rules/ are ~95% identical (17 mirrored files)
- GEMINI.md (321L) duplicates ~60% of .agent/rules/ content
- CLAUDE.md repeats git safety rules also in docs/
- Composite files (plane-design-system.md, plane-backend-architecture.md) overlap with individual scoped files

## Current Inventory

### Always-Loaded (unscoped) — 315 lines

| File                        | Lines | Needed Always?                     |
| --------------------------- | ----- | ---------------------------------- |
| development-rules.md        | 51    | Yes (trim to ~35)                  |
| documentation-management.md | 172   | **No** — only during planning      |
| primary-workflow.md         | 57    | **No** — only during planning      |
| orchestration-protocol.md   | 35    | **No** — only during orchestration |

### Path-Scoped — 1,855 lines (16 files)

All have YAML frontmatter with `paths:` — these are correctly scoped.

### Composite Files (already path-scoped, candidates for slimming)

| File                          | Lines | Scoped? | Overlaps With                                               |
| ----------------------------- | ----- | ------- | ----------------------------------------------------------- |
| plane-design-system.md        | 118   | ✅ Yes  | color-tokens, component-libraries, i18n-rules, forms-inputs |
| plane-backend-architecture.md | 118   | ✅ Yes  | backend-models, backend-views, backend-serializers          |

> **Note**: These are NOT always-loaded. They already have `paths:` frontmatter. Impact is less severe than originally stated.

## Implementation Steps

### Step 1: Create Duplication Map

For each rule in CLAUDE.md and GEMINI.md, identify if it exists in:

- .claude/rules/ files
- .agent/rules/ files
- docs/ files

Output: markdown table showing source → duplicates.

### Step 2: Decide Single Source of Truth

- **Source**: `.claude/rules/` (supports path scoping)
- **Mirror target**: `.agent/rules/` (generated via sync script, Phase 5)
- **GEMINI.md**: compact index pointing to .agent/rules/ files
- **CLAUDE.md**: compact invariants only

### Step 3: Identify Composite File Fate

For plane-design-system.md and plane-backend-architecture.md:

- Check if they contain unique content not in individual files
- If unique content exists → merge into relevant individual files
- Then delete composites OR convert to compact index files (<30L)

### Step 4: Scope the Unscoped Files

| File                        | Action                               |
| --------------------------- | ------------------------------------ |
| documentation-management.md | Add `paths: ["plans/**", "docs/**"]` |
| primary-workflow.md         | Add `paths: ["apps/**"]`             |
| orchestration-protocol.md   | Add `paths: ["plans/**"]`            |
| development-rules.md        | Keep unscoped but trim to ~35L       |

### Step 5: Diff .claude/rules/ vs .agent/rules/

```bash
for f in .claude/rules/*.md; do
  base=$(basename "$f")
  agent=".agent/rules/$base"
  [ -f "$agent" ] && diff "$f" "$agent" | head -20
done
```

Document differences. Goal: make .agent/rules/ exact copy of .claude/rules/ (minus workflow files).

## Todo List

- [ ] Create duplication map (CLAUDE.md vs rules vs docs)
- [ ] Create duplication map (GEMINI.md vs .agent/rules/)
- [ ] Diff .claude/rules/ vs .agent/rules/ — document differences
- [ ] Determine composite file fate (keep as index or delete)
- [ ] Determine scoping for 4 unscoped files
- [ ] Document final dedup decisions in this file
- [ ] **LAST STEP**: `git tag before-rule-optimization` (rollback point for Phase 2+)

## Success Criteria

- Complete duplication map exists
- Clear decision for every duplicated rule: which copy is source of truth
- Composite file strategy decided
- Unscoped file strategy decided

## Risk Assessment

- **Low risk**: This phase is analysis only, no file modifications
- **Risk**: Missing a duplication source → fix in Phase 2 when editing files
