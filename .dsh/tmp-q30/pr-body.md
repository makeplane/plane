## Summary

Moves work items between projects (QUESTIMUS-30) plus the repository restructure landed alongside it. A member can now move a work item — together with its entire sub-tree — into another project of the same workspace via a new "Move to project" action in the detail menu and all layout quick-menus. The item is re-keyed to the next sequence number in the destination, and its state, labels (cloned), assignees (destination members kept), and issue type are remapped to the destination's setup. Cycle/module memberships and cross-project relations are cleaned up; activity, webhooks, notifications, and version snapshots fire exactly as an edit would.

**Commits:**
- `918a53666` feat(api): move endpoint — subtree collection, dual advisory locks (sorted), sequence reallocation, state/type/label/assignee remap, relation pruning, bulk cross-project row cascade, version snapshot; 24 contract tests
- `bb3b56a69` feat(web): Move-to-project menu items (detail + 4 layouts), move-issue-modal (permission-filtered destinations, guarded close), MobX store action, activity rendering, i18n
- `dc32a433f` chore: arsenal and questimus restructure — planning/ticketing/handoff docs moved onto the Questimus tracker; design + ship skill bundles; manifests refreshed (251 files)
- `592e5e411f` fix: review-army fixes — label adoption rewritten as cloning (shared labels preserved on source issues), TOCTOU authorization re-validation under the locks, post-commit side-effect guard, non-dict body 400, i18n locale sync (all 19 locales, check:sync green)
- `03a91b6cd7` fix: adversarial hardening — per-issue aggregates hoisted out of the lock hold, chunked IN-lists, parents-first label clones, archived/deleted project rejection, moved_ids store purge, twin-merge dedupe

## Test Coverage

**Coverage audit: 83% ≥ 80% — PASS.**

| Area | Before | After |
|------|--------|-------|
| Backend move tests | 0 | 25 contract tests (happy path, subtree, sequences, state/type/label remap, clone/twin-merge/shared-label, relations/blockers pruning, 403/404/400 matrix, soft-deleted descendants, moved_ids) |
| Backend suite total | 516 passed | 540 passed / 0 failed |
| Frontend oxlint | clean | clean (0 errors / 1,889 files) |

Coverage gaps found by the audit are ticketed (8fefdcf6): `Migration-003` forward/reverse re-run, label-filter acceptance tests, DRF-permission audit, serializers round-trip, state-sync edge (`sync` False → activity history skip), intake cycle regression.

## Pre-Landing Review

Review army: 10 specialists (security, performance, testing, maintainability, error-handling, api-contract, design, comments, type-design, test-coverage) + independent adversarial pass (Codex unavailable — Claude only). Findings were ticket-first, then triaged:

**Fixed now (6 tickets, all closed Done, verified by the 25/25 suite + live redeploy):**
- `191d7088` Label adoption re-pointed shared Label rows, stripping labels from non-moved source issues → rewritten as CLONE into destination (same-name merges onto twin)
- `2a3addac` TOCTOU: pre-checks ran before the advisory locks → issue fetch, destination membership, archived/intake/state checks re-validated inside the transaction
- `b52bcf8c` Label clone hierarchy was order-dependent → parents-first processing
- `6203fe5c` Archived/deleted source/target projects accepted → 400 rejection
- `38a8fca0` Frontend store left moved children stale → response now carries `moved_ids`; store purges the whole subtree
- `a84eef61` Twin-merge could duplicate IssueLabel bridges → dedupe before re-point

**Deferred (Backlog, all related to QUESTIMUS-30):**
- `e10805fd` Performance: recursive-CTE subtree collection, dest-side anti-joins, bulk writes, lock-scope shrink (partial mitigations shipped: aggregate hoisting + chunking)
- `62467eaa` Code-quality batch: post() decomposition, shared annotation helper, ROLE.MEMBER.value, copy-paste prune helper, @extend_schema, modal guards/UX, i18n key placement, locale translations
- `8fefdcf6` Coverage-gap tests (6 areas)

## Design Review (lite)

6 findings — 1 rejected by spec (menu-position variance is the ticketed requirement), 5 deferred to `62467eaa` (i18n namespace placement, duplicate key drift, no-eligible-projects footer, guard timeout, ProjectName UUID fallback).

## Questimus Ticket Summary

- QUESTIMUS-30 → Done (analysis, implementation, review, evidence posted)
- 9 follow-up tickets created this run: 2 security/functional (fixed + closed), 4 adversarial (fixed + closed), 3 deferred (performance, code-quality batch, coverage gaps)
