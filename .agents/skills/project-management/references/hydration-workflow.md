# Hydration Workflow

Tasks are **session-scoped** — they disappear when the session ends. Plan files are the **persistent** layer. The hydration pattern bridges sessions.

## Flow Diagram

```
┌──────────────────┐  Hydrate   ┌───────────────────┐
│ Plan Files       │ ─────────► │ Claude Tasks      │
│ (persistent)     │            │ (session-scoped)  │
│ [ ] Phase 1      │            │ ◼ pending         │
│ [ ] Phase 2      │            │ ◼ pending         │
└──────────────────┘            └───────────────────┘
                                        │ Work
                                        ▼
┌──────────────────┐  Sync-back ┌───────────────────┐
│ Plan Files       │ ◄───────── │ Task Updates      │
│ (updated)        │            │ (completed)       │
│ [x] Phase 1      │            │ ✓ completed       │
│ [ ] Phase 2      │            │ ◼ in_progress     │
└──────────────────┘            └───────────────────┘
```

## Tool Availability

Task tools (`TaskCreate`/`TaskUpdate`/`TaskGet`/`TaskList`) are **CLI-only** — disabled in VSCode extension. If unavailable, use `TodoWrite` for progress tracking. The hydration pattern still works: plan files remain source of truth, sync-back updates checkboxes regardless of Task tool availability.

## Session Start: Hydration

1. Read plan files: `plan.md` + `phase-XX-*.md`
2. Identify unchecked `[ ]` items = remaining work
3. `TaskCreate` per unchecked item with metadata (phase, priority, effort, planDir, phaseFile) — or `TodoWrite` if Task tools unavailable
4. Set up `addBlockedBy` dependency chains between phases (skip if using TodoWrite fallback)
5. Already-checked `[x]` items = done, skip

**Check first:** `TaskList()` — if tasks already exist (same session), skip re-creation. If TaskList errors, proceed with TodoWrite.

## During Work

- `TaskUpdate(status: "in_progress")` when picking up a task
- `TaskUpdate(status: "completed")` immediately after finishing
- Parallel agents coordinate through shared task list
- Blocked tasks auto-unblock when dependencies complete

## Session End: Sync-Back

1. Collect completed tasks (`TaskUpdate(status: "completed")`) with metadata (`phase`, `phaseFile`, `planDir`).
2. Sweep all `phase-XX-*.md` files in the target plan directory.
3. Reconcile and backfill: update `[ ]` → `[x]` for all completed items across every phase file (including earlier phases).
4. Update `plan.md` frontmatter: status field (pending → in-progress → completed).
5. Update progress percentages in `plan.md` overview from real checkbox counts.
6. Report unresolved mappings when completed tasks cannot be matched to a phase file.
7. Git commit captures state transition for next session.

## Cross-Session Resume

When user runs `/ck:cook path/to/plan.md` in a new session:
1. `TaskList()` → empty (tasks died with old session)
2. Read plan files → re-hydrate from unchecked `[ ]` items
3. Already-checked `[x]` = done, creates tasks only for remaining work
4. Dependency chain reconstructed automatically

## Compound Interest Effect

Each hydration cycle makes specs smarter:
- **Session 1:** Execute first tasks, establish patterns
- **Session 2:** See completed work, build on established patterns
- **Session 3:** Full context of prior sessions, fewer clarifications needed

Git history shows progression. Completed checkboxes show the path that worked. Specs gain **institutional memory** across sessions.

## YAML Frontmatter Sync

Plan files MUST have frontmatter with these fields:

```yaml
---
title: Feature name
description: Brief description
status: in-progress  # pending | in-progress | completed
priority: P1
effort: medium
branch: feature-branch
tags: [auth, api]
created: 2026-02-05
---
```

Update `status` field during sync-back when plan state changes.
