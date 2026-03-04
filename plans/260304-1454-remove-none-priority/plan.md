---
title: "Remove None Priority & Set Medium as Default"
description: "Remove none from priority list, set medium as default across full stack"
status: completed
priority: P2
effort: 2h
branch: ngoc-feat/work-items
tags: [priority, issue, backend, frontend]
created: 2026-03-04
---

# Remove None Priority & Set Medium as Default

## Objective

Remove "none" from the priority selection UI, set "medium" as the default priority for all new issues/drafts, **and migrate all existing "none" priority records to "medium"** via a Django data migration.

## Phases

| #   | Phase            | Status    | Effort | File                                                           |
| --- | ---------------- | --------- | ------ | -------------------------------------------------------------- |
| 1   | Backend changes  | completed | 60m    | [phase-01-backend-changes.md](./phase-01-backend-changes.md)   |
| 2   | Frontend changes | completed | 45m    | [phase-02-frontend-changes.md](./phase-02-frontend-changes.md) |

## Key Decisions

- **Data migration required**: Run a Django data migration to update all existing `priority="none"` records to `priority="medium"` in Issue, IssueVersion, and DraftIssue tables
- **Hard reject "none" from API filters**: `DEFAULT_VALID_CHOICES["priority"]` removes "none" — API returns 400 for `priority=none` filter requests
- **PriorityIcon keeps "none" support** (as safety net for any edge cases post-migration)
- **CSS variables for "none" kept** (`--priority-none`) for safety
- **Default changes from "none" to "medium"** in models, constants, form defaults, serializers
- **TIssuePriorities type keeps "none"** so TS doesn't break on any residual data

## Dependencies

- Phase 2 depends on Phase 1 (backend must accept "medium" as default before frontend sends it)

## Reports

- [Scout Report](./reports/scout-report.md)

## Success Criteria

- [ ] No "none" option appears in any priority dropdown or filter
- [ ] New issues default to "medium" priority
- [ ] All existing "none" priority records migrated to "medium" in DB
- [ ] Backend accepts "medium" as default, no 400 errors
- [ ] API returns 400 for `priority=none` filter requests
- [ ] All priority ordering/grouping still works correctly

## Validation Log

### Session 1 — 2026-03-04

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[API compat]** When 'none' is removed from `DEFAULT_VALID_CHOICES['priority']` in `filters/converters.py`, any API request filtering by `priority=none` will be rejected (400 error). How should this be handled?
   - Options: Hard reject | Silently ignore | Map to unset
   - **Answer:** Hard reject (Recommended)
   - **Rationale:** Intentional breaking change; clients should stop using `priority=none` filter.

2. **[Scope]** Existing issues with 'none' priority will appear ungrouped/in a fallback column in kanban/group-by views after frontend changes. Is this acceptable?
   - Options: Acceptable tradeoff | Add 'No Priority' fallback group
   - **Answer:** change to medium
   - **Custom input:** "change to medium"
   - **Rationale:** User wants full cleanup — existing "none" records must be migrated to "medium" via data migration. This expands scope from original "no DB migration" assumption.

3. **[Django admin]** Django admin will show existing 'none' priority records as having an invalid choice after removing it from PRIORITY_CHOICES. Is this OK?
   - Options: Acceptable | Keep 'none' in choices, label it
   - **Answer:** clean priority none change to medium if its possible
   - **Custom input:** "clean priority none change to medium if its possible"
   - **Rationale:** Confirms data migration approach — clean all "none" → "medium" in DB.

4. **[Testing]** The plan skips writing any automated tests. Should tests be added for this change?
   - Options: Skip tests | Add backend unit tests | Add frontend unit tests
   - **Answer:** Skip tests (Recommended)
   - **Rationale:** Simple value-swap + data migration; manual verification sufficient.

#### Confirmed Decisions

- **Data migration**: Yes — migrate all `priority="none"` to `"medium"` in Issue, IssueVersion, DraftIssue
- **API filter rejection**: Hard reject `priority=none` filter (400 error)
- **Testing**: Skip automated tests; manual verification only

#### Action Items

- [ ] Add Django data migration to Phase 1 implementation steps
- [ ] Update Phase 1 risk assessment with data migration risks
- [ ] Update Phase 2 to note group-by "none" risk is resolved by data migration

#### Impact on Phases

- Phase 1: Add Step 7 — create Django data migration updating `priority="none"` → `"medium"` across Issue, IssueVersion, DraftIssue
- Phase 2: Risk "Group-by columns miss 'none' group" is now mitigated by data migration

### Session 2 — 2026-03-04

**Trigger:** Re-validation to confirm implementation-specific details
**Questions asked:** 3

#### Questions & Answers

1. **[Django Migration]** Phase 1 includes a Django data migration with `apps.get_model('db', 'Issue')`. What is the correct Django app label for the Issue/DraftIssue models?
   - Options: "db" (Recommended) | "plane" | Need to check
   - **Answer:** "db" (Recommended)
   - **Rationale:** Confirms migration uses `apps.get_model("db", "Issue")` — correct app label verified.

2. **[Deployment]** Phase 1 (backend + data migration) and Phase 2 (frontend) — what's the deployment order?
   - Options: Backend first then frontend (Recommended) | Single release | Doesn't matter
   - **Answer:** Backend first, then frontend (Recommended)
   - **Rationale:** Deploy Phase 1 + run migration first, verify, then deploy Phase 2. This ensures DB has no "none" records before frontend removes the option.

3. **[Scope]** The `dummy_data_task.py` change — is this file used in production?
   - Options: Dev/seed only — still update it (Recommended) | Skip this file
   - **Answer:** Dev/seed only — still update it (Recommended)
   - **Rationale:** Keep dummy data consistent with new priority options even though it's dev-only.

#### Confirmed Decisions

- **Django app label**: "db" — use `apps.get_model("db", "Issue")` in migration
- **Deployment order**: Backend + migration first → Frontend second
- **Dummy data task**: Update it (keep consistent with 4-priority list)

#### Action Items

- [ ] Note in Phase 1: run `python manage.py showmigrations db` to get latest migration for `dependencies`
- [ ] Note deployment order in plan: Phase 1 must be deployed and migration run before Phase 2

#### Impact on Phases

- Phase 1: No changes needed; app label "db" confirmed correct
- Phase 2: No changes needed; deployment order is an ops concern, not a code change

### Session 3 — 2026-03-04

**Trigger:** Implementation-detail validation — migration command, i18n keys, dead code
**Questions asked:** 3

#### Questions & Answers

1. **[Django Migration]** Phase 1 Step 7 says `python manage.py makemigrations plane --empty` but Session 2 confirmed app label is "db". Which is correct?
   - Options: `makemigrations db --empty` | `makemigrations plane --empty` | Need to check
   - **Answer:** `makemigrations db --empty` (Recommended)
   - **Rationale:** App label is "db"; the command must target the correct app or Django will create the migration under the wrong app directory.

2. **[i18n]** Phase 2 changes tooltip from `t("common.none")` to `t("issue.priority.medium")`. Has this key been verified?
   - Options: Yes, key exists — proceed | Use `t("common.medium")` instead | Needs verification
   - **Answer:** Yes, key exists — proceed
   - **Rationale:** Key verified; safe to use `t("issue.priority.medium")` in tooltip changes.

3. **[Cleanup]** Phase 2 Step 10 notes `priority !== "none"` style checks can remain as dead code. Should they be removed?
   - Options: Leave as-is | Remove them
   - **Answer:** Remove them
   - **Rationale:** After data migration, "none" will never appear; removing dead code keeps components clean.

#### Confirmed Decisions

- **Migration command**: `python manage.py makemigrations db --empty --name migrate_none_priority_to_medium`
- **i18n key**: `t("issue.priority.medium")` confirmed valid
- **Dead code**: Remove `priority !== "none"` / `priority === "none"` style conditions in Phase 2

#### Action Items

- [ ] Fix Phase 1 Step 7 migration command from `plane` to `db`
- [ ] Update Phase 2 Step 10 to remove `priority !== "none"` style checks

#### Impact on Phases

- Phase 1: Fix makemigrations command (`plane` → `db`)
- Phase 2: Step 10 — remove `priority !== "none"` and `priority === "none"` dead code checks in `priority.tsx`
