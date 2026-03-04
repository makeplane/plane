# Phase 2: Compress & Scope Rules

## Context Links

- [Plan Overview](plan.md)
- [Phase 1: Audit](phase-01-audit-and-deduplicate.md) (dependency)
- [Research: Compression Techniques](research/researcher-02-plane-component-rule-coverage.md#4-rule-compression-techniques)

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 45m
- **Description**: Convert prose rules to checklist/table format. Add path scoping to unscoped files. Eliminate composite files.

## Key Insights

- Checklist format = 50% compression, higher scanability
- ❌/✅ negative examples 40% more effective than prose
- Tables best for multi-option rules (dialogs, components)
- Path scoping reduces context noise 40-60%

## Embedded Rules (from .claude/rules/)

```
- Checklist > prose (2-3x scannable)
- ❌/✅ for do/don't rules
- Tables for multi-option (dialog systems, color mappings)
- One file = one concern (single-responsibility)
- <200 lines per file
```

## Implementation Steps

### Step 1: Handle Unscoped Files

<!-- Updated: Validation Session 4 — scope workflow files, replace dead skill refs -->

**development-rules.md** — Keep unscoped, trim + cleanup:

<!-- Updated: Validation Session 6 — skill refs are valid, no replacement needed -->

- Skill references (docs-seeker, ai-multimodal, etc.) are VALID — exist in skills catalog, keep as-is
- Remove Visual Aids section (covered by primary-workflow.md)
- Remove verbose prose, convert to checklist format
- Target: ~35 lines

**documentation-management.md** — Add path scoping + compress:

```yaml
---
paths:
  - plans/**
  - docs/**
---
```

- Remove plan file structure section (172L → ~60L) — move plan structure to a plan-template file
- Keep only: roadmap/changelog triggers, update protocol, plan location

**primary-workflow.md** — Add path scoping (Claude multi-agent orchestrator pipeline):

```yaml
---
paths:
  - apps/**
---
```

- Agent refs (planner, tester, code-reviewer, debugger, docs-manager) are VALID — maps to .claude/agents/
- packages/\*\* excluded — shared core libs, not custom code
- Keep content, trim if possible (~40-50L)

**orchestration-protocol.md** — Add path scoping:

```yaml
---
paths:
  - plans/**
---
```

- Subagent delegation rules are VALID for Claude CLI
- Keep as-is (~35L)

### Step 2: Compress Rule Files to Checklist Format

For each scoped file, convert prose to checklists. Example transformations:

**backend-models.md** (114L → target ~70L):

- Convert model conventions from prose to ❌/✅
- Table for field naming conventions
- Remove explanatory paragraphs, keep only rules

**mobx-stores.md** (114L → target ~70L):

- Already partially checklist — finish conversion
- Remove examples that duplicate what ❌/✅ shows

**color-tokens.md** (83L → target ~55L):

- Convert to table format for token mappings
- Remove prose descriptions

Apply same pattern to all 16 scoped files. Target: 20-30% reduction per file.

### Step 3: Slim Composite Files to ~60L Index

<!-- Updated: Validation Session 2 — keep as slim index, not delete -->

**plane-design-system.md** (118L → ~60L):

- Contains CE pattern + Top 10 rules not fully covered by individual files
- Extract verbose content to individual files where applicable
- Keep as slim index: one-liner per rule category + pointer to individual file
- Target: ~60 lines, checklist format

**plane-backend-architecture.md** (118L → ~60L):

- Same approach — slim to index format
- Move verbose model/view/serializer details to individual backend-\*.md files
- Keep: overview, two API layers, model hierarchy, common mistakes
- Target: ~60 lines, checklist format

### Step 4: Verify Path Scoping Works

After adding paths, test by checking YAML frontmatter syntax:

```bash
for f in .claude/rules/*.md; do
  head -1 "$f" | grep -q "^---" && echo "✅ $f" || echo "❌ $f (no frontmatter)"
done
```

## Post-Phase Checklist

- [ ] primary-workflow.md SCOPED to `apps/**`
- [ ] orchestration-protocol.md SCOPED to `plans/**`
- [ ] development-rules.md: only unscoped file, ≤35 lines, `imagemagick` ref removed (only dead ref — other 5 skills verified valid in Session 5)
- [ ] documentation-management.md: ≤60 lines with path scope
- [ ] All remaining .claude/rules/ files have YAML frontmatter with `paths:`
- [ ] All prose rules converted to checklist/table format
- [ ] Composite files slimmed to ~60L index format
- [ ] No file exceeds 120 lines
- [ ] No syntax errors in YAML frontmatter
- [ ] frontend-implementation-checklist.md reconciled between .claude/ and .agent/

## Todo List

- [ ] Add path scoping to documentation-management.md
- [ ] SCOPE primary-workflow.md to relevant paths (Claude multi-agent orchestrator pipeline)
- [ ] SCOPE orchestration-protocol.md to plans/\*\* (subagent delegation rules)
- [ ] Trim development-rules.md to ~35L
- [ ] Compress documentation-management.md to ~60L
- [ ] Compress backend-models.md to checklist format
- [ ] Compress mobx-stores.md to checklist format
- [ ] Compress color-tokens.md to table format
- [ ] Compress remaining scoped files (batch)
- [ ] Resolve plane-design-system.md
- [ ] Resolve plane-backend-architecture.md
- [ ] Verify all YAML frontmatter valid

## Success Criteria

- Total .claude/rules/ lines reduced from 1,723 to <1,300
- Always-loaded lines reduced from 315 to <85 (only dev-rules ~35L + CLAUDE.md)
- All files path-scoped except development-rules.md

## Risk Assessment

- **Medium**: Over-compression may lose critical nuance → use ❌/✅ to preserve intent
- **Low**: Path glob too narrow → test with common editing scenarios
- **Mitigation**: Keep original files in git history; can revert any compression
