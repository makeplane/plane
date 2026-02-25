---
description: ⚡⚡⚡ Analyze the codebase and update documentation
---

## Phase 1: Parallel Codebase Scouting

1. Scan the codebase and calculate the number of files with LOC in each directory (skip credentials, cache or external modules directories, such as `.claude`, `.opencode`, `.git`, `tests`, `node_modules`, `__pycache__`, `secrets`, etc.)
2. Target directories **that actually exist** - adapt to project structure, don't hardcode paths
3. Activate `scout` skill to explore the code base and return detailed summary reports to the main agent
4. Merge scout reports into context summary

## Phase 1.5: Parallel Documentation Reading

**You (main agent) must spawn readers** - subagents cannot spawn subagents.

1. Count docs: `ls docs/*.md 2>/dev/null | wc -l`
2. Get LOC: `wc -l docs/*.md 2>/dev/null | sort -rn`
3. Strategy:
   - 1-3 files: Skip parallel reading, docs-manager reads directly
   - 4-6 files: Spawn 2-3 `Explore` agents
   - 7+ files: Spawn 4-5 `Explore` agents (max 5)
4. Distribute files by LOC (larger files get dedicated agent)
5. Each agent prompt: "Read these docs, extract: purpose, key sections, areas needing update. Files: {list}"
6. Merge results into context for docs-manager

### Workload Distribution Example

| Agent | Files | Est. LOC |
|-------|-------|----------|
| 1 | codebase-summary.md (800) | 800 |
| 2 | system-architecture.md (400), code-standards.md (300) | 700 |
| 3 | project-overview-pdr.md (500), project-roadmap.md (200) | 700 |

## Phase 2: Documentation Update (docs-manager Agent)

**CRITICAL:** You MUST spawn `docs-manager` agent via Task tool with merged reports and doc readings. Do not wait for user input.

Pass the gathered context to docs-manager agent to update documentation:
- `README.md`: Update README (keep it under 300 lines)
- `docs/project-overview-pdr.md`: Update project overview and PDR (Product Development Requirements)
- `docs/codebase-summary.md`: Update codebase summary
- `docs/code-standards.md`: Update codebase structure and code standards
- `docs/system-architecture.md`: Update system architecture
- `docs/project-roadmap.md`: Update project roadmap
- `docs/deployment-guide.md` [optional]: Update deployment guide
- `docs/design-guidelines.md` [optional]: Update design guidelines

## Additional requests
<additional_requests>
  $ARGUMENTS
</additional_requests>

## Phase 3: Size Check (Post-Update)

After docs-manager completes:
1. Run `wc -l docs/*.md 2>/dev/null | sort -rn` to check LOC
2. Use `docs.maxLoc` from session context (default: 800)
3. For files exceeding limit:
   - Report which files exceed and by how much
   - docs-manager should have already split proactively per Section 6 guidelines
   - If still oversized, ask user: split now or accept as-is?

## Phase 4: Documentation Validation (Post-Update)

Run validation to detect potential hallucinations:
1. Run: `node .claude/scripts/validate-docs.cjs docs/`
2. Display validation report (warnings only, non-blocking)
3. Checks performed:
   - Code references: Verify `functionName()` and `ClassName` exist in codebase
   - Internal links: Verify `[text](./path.md)` links point to existing files
   - Config keys: Verify `ENV_VAR` mentioned in docs exist in `.env.example`

## Important
- Use `docs/` directory as the source of truth for documentation.

**IMPORTANT**: **Do not** start implementing.