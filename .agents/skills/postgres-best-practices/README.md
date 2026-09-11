# Postgres Best Practices - Contributor Guide

This repository contains Postgres performance optimization rules optimized for
AI agents and LLMs.

## Quick Start

```bash
# Install dependencies
cd packages/postgres-best-practices-build
npm install

# Validate existing rules
npm run validate

# Build AGENTS.md
npm run build
```

## Creating a New Rule

1. **Choose a section prefix** based on the category:
   - `query-` Query Performance (CRITICAL)
   - `conn-` Connection Management (CRITICAL)
   - `security-` Security & RLS (CRITICAL)
   - `schema-` Schema Design (HIGH)
   - `lock-` Concurrency & Locking (MEDIUM-HIGH)
   - `data-` Data Access Patterns (MEDIUM)
   - `monitor-` Monitoring & Diagnostics (LOW-MEDIUM)
   - `advanced-` Advanced Features (LOW)

2. **Copy the template**:
   ```bash
   cp references/_template.md references/query-your-rule-name.md
   ```

3. **Fill in the content** following the template structure

4. **Validate and build**:
   ```bash
   npm run validate
   npm run build
   ```

5. **Review** the generated `AGENTS.md`

## Repository Structure

```
skills/postgres-best-practices/
├── SKILL.md           # Agent-facing skill manifest
├── AGENTS.md          # [GENERATED] Compiled rules document
├── README.md          # This file
├── metadata.json      # Version and metadata
└── references/
    ├── _template.md      # Rule template
    ├── _sections.md      # Section definitions
    ├── _contributing.md  # Writing guidelines
    └── *.md              # Individual rules

packages/postgres-best-practices-build/
├── src/               # Build system source
├── package.json       # NPM scripts
└── test-cases.json    # [GENERATED] Test artifacts
```

## Rule File Structure

See `references/_template.md` for the complete template. Key elements:

````markdown
---
title: Clear, Action-Oriented Title
impact: CRITICAL|HIGH|MEDIUM-HIGH|MEDIUM|LOW-MEDIUM|LOW
impactDescription: Quantified benefit (e.g., "10-100x faster")
tags: relevant, keywords
---

## [Title]

[1-2 sentence explanation]

**Incorrect (description):**

```sql
-- Comment explaining what's wrong
[Bad SQL example]
```
````

**Correct (description):**

```sql
-- Comment explaining why this is better
[Good SQL example]
```

```
## Writing Guidelines

See `references/_contributing.md` for detailed guidelines. Key principles:

1. **Show concrete transformations** - "Change X to Y", not abstract advice
2. **Error-first structure** - Show the problem before the solution
3. **Quantify impact** - Include specific metrics (10x faster, 50% smaller)
4. **Self-contained examples** - Complete, runnable SQL
5. **Semantic naming** - Use meaningful names (users, email), not (table1, col1)

## Impact Levels

| Level | Improvement | Examples |
|-------|-------------|----------|
| CRITICAL | 10-100x | Missing indexes, connection exhaustion |
| HIGH | 5-20x | Wrong index types, poor partitioning |
| MEDIUM-HIGH | 2-5x | N+1 queries, RLS optimization |
| MEDIUM | 1.5-3x | Redundant indexes, stale statistics |
| LOW-MEDIUM | 1.2-2x | VACUUM tuning, config tweaks |
| LOW | Incremental | Advanced patterns, edge cases |
```
