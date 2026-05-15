---
title: "Copy Project to Another Workspace"
description: "Deep copy a project (states, labels, estimates, modules, cycles, issues with attachments/worklogs/comments, members) into another workspace asynchronously via Celery."
status: complete
priority: P2
effort: 28h
branch: trihob5
tags: [backend, frontend, celery, ce, copy, workspace]
created: 2026-05-13
completed: 2026-05-13
---

# Copy Project to Another Workspace

## Goal

Enable a workspace admin (or instance admin) to deep-copy an entire project into another workspace they administer. Copy runs asynchronously via Celery, frontend polls job status, and user manually picks a new identifier if a collision occurs.

## In scope (V1)

| Entity | Copied | Notes |
|---|---|---|
| Project metadata | ✅ | name, description, icon, timezone, feature flags |
| States | ✅ | re-created, FK re-mapped on issues |
| Labels | ✅ | re-created in target workspace |
| Estimates + EstimatePoints | ✅ | re-created |
| Modules | ✅ | re-created, issue links restored |
| Cycles | ✅ | re-created, issue links restored |
| Issues | ✅ | state/label/parent FK re-mapped; assignees re-mapped if member copied |
| Issue comments | ✅ | re-created |
| Issue attachments | ✅ | S3 assets copied via `copy_s3_object` pattern |
| Issue worklogs | ✅ | time tracking entries re-created |
| Members | ✅ | auto-invited to target workspace + added to project with original roles |
| Cover image | ✅ | S3 asset copy |

## Out of scope (V1)

- Pages (skipped per user decision)
- Webhooks / integrations / API tokens
- Views, drafts, archived issues, intake issues, project automations
- In-flight progress percentage (binary pending/processing/completed/failed only)

## Phases

| # | Phase | Status | Owner | Effort | Files |
|---|---|---|---|---|---|
| 01 | Backend model + Celery task | complete | backend | 10h | `phase-01-backend-model-task.md` |
| 02 | Backend API endpoint + permissions | complete | backend | 3h | `phase-02-backend-api-endpoint.md` |
| 03 | Frontend modal + menu item | complete | frontend | 4h | `phase-03-frontend-modal-ui.md` |
| 04 | Frontend service + store + polling | complete | frontend | 4h | `phase-04-frontend-service-store.md` |
| 05 | i18n keys + polish + error handling | complete | both | 3h | `phase-05-i18n-and-polish.md` |

## Dependency Graph

```
01 (model + task) ──► 02 (API) ──► 04 (service/store) ──► 03 (modal UI)
                                                              ▼
                                                            05 (i18n + polish)
```

- 01 blocks 02 (view imports model + task)
- 02 blocks 04 (service calls endpoint)
- 04 blocks 03 (modal calls store action)
- 03 + 04 block 05 (final wiring)

## Data Flow

```
User clicks "Copy to Workspace" in ProjectActionsMenu
    │
    ▼
CopyProjectModal (CE) → picks target workspace + identifier
    │
    ▼ POST /workspaces/{slug}/projects/{id}/copy/
ProjectCopyViewSet.create()
    │  validates permissions (source admin + target admin)
    │  validates identifier uniqueness in target workspace
    │  creates ProjectCopyJob (status=queued)
    │  fires copy_project_task.delay(job_id)
    ▼ returns 202 + {job_id}
Frontend store starts polling
    │
    ▼ GET /workspaces/{slug}/projects/{id}/copy-status/{job_id}/
Returns {status, new_project_id?, error?}
    │
    ▼ on completed: toast (stay in current workspace)
    ▼ on failed: toast + show error
```

## Top Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Partial-copy on Celery failure | M | H | Wrap task body in single `transaction.atomic()` — all-or-nothing |
| FK remap bugs (issue.state, sub-issue parent, modules) | H | H | Build `id_map` dicts per entity; unit test remap before bulk_create |
| Identifier conflict race (two creates same instant) | L | M | DB unique constraint + serializer validation; surface 409 in UI |
| Long task time (>5min) starves worker | M | M | Use `bulk_create(batch_size=100)`; ack-late=false; soft-time-limit 600s |
| User loses dialog before completion | M | L | Store job_id in MobX store; resume polling on remount |
| Cross-workspace permission bypass | L | H | Two-level check: source workspace admin AND target workspace admin |

## Rollback

- Phase 01: drop migration with reverse SQL (model removal) — no FKs from elsewhere
- Phase 02: delete URL entry; ViewSet/task remain harmless
- Phase 03–04: remove menu item + modal mount; CE-only, no `core/` touched
- Phase 05: i18n keys are additive; safe to leave

## Success Criteria

- [ ] Workspace admin can copy a project with 500+ issues into another workspace they admin
- [ ] All states/labels/estimates/modules/cycles/issues re-created with FK remapping intact
- [ ] Issue attachments (S3) and worklogs copied
- [ ] Project members auto-invited to target workspace and added to project
- [ ] Sub-issue parent links preserved within copied project
- [ ] Identifier conflict surfaces inline error before submit
- [ ] Polling stops on terminal status (completed/failed)
- [ ] Non-admin cannot trigger copy (403 on API)
- [ ] All visible strings via `t()`, all 3 locales updated (en/ko/vi)
- [ ] Backend unit tests cover: permission, identifier validation, FK remap, atomic rollback on failure
- [ ] `pnpm check:lint` clean, `python run_tests.py -u` green for new tests

## Open Questions

- Q1: Should the source project be locked (read-only) during copy? V1 answer: no — copy snapshots queryset at task start.
- Q2: Notify user via email/inbox on completion? Defer to V2; toast on poll-completion suffices for V1.
- Q3: Should copied project name be `{name} (copy)` or user-supplied? V1: user supplies in modal (defaults to `{name} (copy)`).
