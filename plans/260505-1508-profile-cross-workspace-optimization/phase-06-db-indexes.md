# Phase 6 — DB Indexes for Cross-Workspace Query

## Context Links

- Phase 1 introduces query: `Issue.issue_objects.filter(assignees=user, workspace_member__active, project_member__active, state__group__in=[...], parent__isnull=True, target_date__lt|isnull)`
- Issue model: `apps/api/plane/db/models/issue.py:203`
- Migration directory: `apps/api/plane/db/migrations/`

## Overview

- **Priority:** P2 (deploy-time hardening — defensive index ALWAYS shipped per Validation Session 2)
- **Status:** complete
- **Effort:** 0.5h
- **Brief:** Add partial composite index to support new endpoint query. Capture EXPLAIN before/after for PR description, but migration ships regardless.
- **Depends:** Phase 1 (need actual SQL)
- **Note:** Migration file `0168_add_issue_workitems_index.py` created and applied.

<!-- Updated: Validation Session 2 - migration is mandatory in this PR -->

**Validation decision (Session 2):** Migration ALWAYS included. EXPLAIN remains a verification step (capture before/after for PR description), but it does NOT gate whether the migration ships. Rationale: avoids "slow first prod query" risk, eliminates a follow-up PR, partial-index storage cost is negligible.

## Key Insights

- Premature indexing = waste; verify FIRST with `EXPLAIN ANALYZE`.
- Existing indexes likely cover most cases (Plane already has FK indexes on assignees, state, workspace).
- Likely candidate: `(state_id, target_date) WHERE parent_id IS NULL AND deleted_at IS NULL` partial index.
- Don't index everything — m2m join (`issue_assignee.assignee_id, issue_id`) probably already indexed by Django auto-FK.

## Requirements

**Functional**

- Query plan shows index scan on `issue` for the new endpoint.
- Migration is reversible (`migrations.RemoveIndex`).

**Non-functional**

- Index creation uses `CREATE INDEX CONCURRENTLY` (no table lock) — wrap in `migrations.RunSQL` since Django's `models.Index` doesn't support concurrent natively in 4.2.
- Migration time on prod: <60s for 100k issues.

## Architecture

Linear flow (Session 2 — no skip branch): <!-- Updated: Validation Session 2 -->

1. Run EXPLAIN ANALYZE on dev (capture baseline plan).
2. Create migration with partial index `(target_date, state_id) WHERE parent_id IS NULL AND deleted_at IS NULL AND archived_at IS NULL AND is_draft = FALSE`.
3. Re-run EXPLAIN post-migration → confirm Index Scan, capture cost delta.
4. Document before/after EXPLAIN in PR description.

## Related Code Files

**Create**

- `apps/api/plane/db/migrations/0XXX_add_issue_workitems_index.py` — mandatory in this PR <!-- Updated: Validation Session 2 -->

**Read**

- `apps/api/plane/db/models/issue.py` Meta — check existing indexes
- Latest migration number in `apps/api/plane/db/migrations/`

## Implementation Steps

1. **EXPLAIN ANALYZE in dev psql:**

   ```sql
   EXPLAIN ANALYZE
   SELECT i.id FROM issues i
     JOIN issue_assignees ia ON ia.issue_id=i.id
     JOIN workspace_members wm ON wm.workspace_id=i.workspace_id
     JOIN project_members pm ON pm.project_id=i.project_id
   WHERE ia.assignee_id='<uid>'
     AND wm.member_id='<uid>' AND wm.is_active=TRUE
     AND pm.member_id='<uid>' AND pm.is_active=TRUE
     AND i.parent_id IS NULL
     AND i.deleted_at IS NULL
     AND i.archived_at IS NULL
     AND i.is_draft=FALSE
     AND i.target_date < CURRENT_DATE;
   ```

2. **Read plan output:** capture baseline cost for PR description (no skip branch — Session 2 locked migration as mandatory).

3. **Create migration** (mandatory):

   ```python
   # apps/api/plane/db/migrations/0XXX_add_issue_workitems_index.py
   from django.db import migrations
   class Migration(migrations.Migration):
       atomic = False
       dependencies = [("db", "0XXX_previous")]
       operations = [
           migrations.RunSQL(
               sql="""
                 CREATE INDEX CONCURRENTLY IF NOT EXISTS
                   issues_workitems_idx ON issues (target_date, state_id)
                   WHERE parent_id IS NULL AND deleted_at IS NULL
                     AND archived_at IS NULL AND is_draft = FALSE;
               """,
               reverse_sql="DROP INDEX IF EXISTS issues_workitems_idx;",
           ),
       ],
   ```

4. **Run migration in dev:** `python manage.py migrate db`

5. **Re-run EXPLAIN ANALYZE → verify Index Scan**

6. **Document in PR:** include before/after EXPLAIN output.

## Todo List

- [x] EXPLAIN ANALYZE on dev (baseline)
- [x] Create migration file with `CREATE INDEX CONCURRENTLY` + `atomic=False`
- [x] Run `migrate` in dev
- [x] Verify post-migration EXPLAIN shows Index Scan
- [x] Capture before/after timings + EXPLAIN snippets for PR

## Success Criteria

- Migration applied successfully on dev (no lock contention)
- Post-migration EXPLAIN shows Index Scan on `issues_workitems_idx`, p95 query <100ms
- Before/after cost recorded in PR description

## Risk Assessment

| Risk                                                             | Likelihood              | Impact | Mitigation                                                          |
| ---------------------------------------------------------------- | ----------------------- | ------ | ------------------------------------------------------------------- |
| Migration locks `issues` table on prod                           | Low (CONCURRENTLY used) | High   | `atomic=False` + `CREATE INDEX CONCURRENTLY`                        |
| Index bloats storage                                             | Low                     | Low    | Partial index (WHERE parent IS NULL etc.) keeps it lean             |
| Migration fails on prod due to existing rows w/ NULL             | Low                     | Med    | Partial filter handles; test on staging first                       |
| Plan still uses seq scan after index (planner not picking it up) | Med                     | Med    | `ANALYZE issues;` post-migration; tune `random_page_cost` if needed |

## Security Considerations

- None — schema-level optimization.

## Next Steps

- Phase 7 includes EXPLAIN-based regression test in benchmark
- Monitor prod query metrics for 1 week post-deploy
