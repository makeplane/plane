# Phase 5: Sync Tooling & Templates

## Context Links

- [Plan Overview](plan.md)
- Depends on: Phase 2, 3, 4 (all rule changes complete)

## Overview

- **Priority**: P2
- **Status**: pending
- **Effort**: 30m
- **Description**: Create sync script to maintain .claude/rules/ → .agent/rules/ single source of truth. Update plan templates to embed rules per phase.

## Key Insights

- Maintaining 2 identical rule directories manually = guaranteed drift
- Sync script eliminates duplication maintenance burden
- Plan phase templates should reference rule embedding pattern

## Implementation Steps

### Step 0: Verify Rollback Point (should exist from Phase 1)

```bash
git tag -l before-rule-optimization  # must show tag
```

After all phases complete, run smoke test:

- Edit a frontend .tsx file → verify correct rules load
- Edit a backend views.py → verify correct rules load
- If regression: `git checkout before-rule-optimization -- .claude/rules/ .agent/rules/ CLAUDE.md GEMINI.md`

### Step 1: Create Sync Script (~30L)

<!-- Updated: Validation Session 2 — no need to strip frontmatter, .agent/rules/ uses it -->

Path: `.claude/scripts/sync-rules-to-agent.sh`

```bash
#!/bin/bash
# Sync .claude/rules/ → .agent/rules/
# Simple copy — .agent/rules/ uses same YAML frontmatter format
# Excludes Claude-specific workflow files (documentation-management)

SOURCE=".claude/rules"
TARGET=".agent/rules"
EXCLUDE="documentation-management.md|primary-workflow.md|orchestration-protocol.md|development-rules.md"

mkdir -p "$TARGET"

for src in "$SOURCE"/*.md; do
  base=$(basename "$src")
  echo "$base" | grep -qE "$EXCLUDE" && continue
  cp "$src" "$TARGET/$base"
done

echo "Synced $(ls "$TARGET"/*.md | wc -l) files to $TARGET"
```

Features:

- Simple cp (frontmatter is valid for both tools)
- Excludes Claude-specific workflow files + development-rules.md (already in GEMINI.md)
- Idempotent — safe to run repeatedly

### Step 2: Add Sync to Pre-commit Hook (optional)

Consider adding to `.husky/pre-commit` or document as manual step:

```bash
bash .claude/scripts/sync-rules-to-agent.sh
```

Decision: Start as manual, automate later if drift occurs.

### Step 3: Update Plan Phase Template

Update documentation-management.md phase file structure to include rule embedding guidance:

Add to "Phase Files" section:

```markdown
**Embedded Rules (MANDATORY — prevents attention dilution)**

- Extract ONLY rules relevant to THIS phase from .claude/rules/
- Embed them inline so AI sees rules at point-of-use
- Include checklist items specific to this phase's tech stack
- Example: frontend phase embeds color tokens, i18n, component rules
- Example: backend phase embeds ViewSet pattern, permission rules, activity tracking
```

### Step 4: Create Phase Template File (~100L)

<!-- Updated: Validation Session 6 — template grows to ~100L with plan structure content -->

Path: `plans/templates/phase-template.md`

Content sourced from documentation-management.md (lines being removed in Phase 2):

- Directory structure (from doc-management L45-66)
- Phase file sections spec (from doc-management L68-158)
- Phase workflow guidance (from doc-management L159-173)
- Context Links section
- Overview (priority, status, description)
- Embedded Rules (extracted from .claude/rules/)
- Implementation Steps
- Post-Phase Checklist
- Todo List
- Success Criteria

### Step 5: Validate Sync

<!-- Updated: Review fix — simple diff, no awk stripping needed (Session 2) -->

After running sync script:

```bash
# Verify content match (both files have same format)
for f in .agent/rules/*.md; do
  base=$(basename "$f")
  src=".claude/rules/$base"
  [ -f "$src" ] || { echo "⚠️  $base only in .agent/rules/"; continue; }
  diff "$src" "$f" > /dev/null && echo "✅ $base" || echo "❌ $base differs"
done
```

### Step 6: Validate Skill & Workflow Pointers

<!-- Added: Review fix — ensure skills/workflows still reference valid paths -->

After all rule changes, verify referenced files still exist:

```bash
# Check BOTH skill directories reference valid rule paths
for f in .agent/skills/*/SKILL.md .claude/skills/*/SKILL.md; do
  grep -oE '\.(agent|claude)/rules/[a-z-]+\.md' "$f" | while read ref; do
    [ -f "$ref" ] && echo "✅ $f → $ref" || echo "❌ $f → $ref MISSING"
  done
done
# Check workflow files
for f in .agent/workflows/*.md; do
  grep -oE '\.(agent|claude)/rules/[a-z-]+\.md' "$f" | while read ref; do
    [ -f "$ref" ] && echo "✅ $f → $ref" || echo "❌ $f → $ref MISSING"
  done
done
```

## Post-Phase Checklist

- [ ] sync-rules-to-agent.sh created and tested
- [ ] Script copies files as-is (no frontmatter stripping needed)
- [ ] Script excludes workflow-only files
- [ ] .agent/rules/ content matches .claude/rules/ exactly
- [ ] Plan phase template created
- [ ] documentation-management.md updated with embedding guidance
- [ ] All skill SKILL.md files reference valid .agent/rules/ paths
- [ ] All workflow .md files reference valid .agent/rules/ paths

## Todo List

- [ ] Create sync-rules-to-agent.sh
- [ ] Test sync script
- [ ] Create phase-template.md
- [ ] Update documentation-management.md with embedding guidance
- [ ] Run final validation across all rule files

## Success Criteria

- Sync script runs successfully, produces matching .agent/rules/ files
- Phase template includes embedded rules section
- Zero manual duplication required between tool configs

## Risk Assessment

- **Low**: Script edge cases (files with special characters in names)
  - Mitigation: Test with all current files before bulk sync
- **Low**: Team forgets to run sync
  - Mitigation: Document in README, consider pre-commit hook later
