# Runbook — God-Mode GD Workspace Owner + Instance-Admin RBAC Rollout

Covers the two god-mode changes shipped together: workspace owner defaults to the
General Director (GD), and instance-admin per-menu RBAC.

## 1. HARD GO-LIVE GATE — GD staff record carries grade code `GD`

The owner resolver matches `StaffProfile.job_grade == "GD"` (case-insensitive, **code**,
not the grade _name_). Repo seed data stores `"Director"`/`"General Director"` and will
NOT resolve — assume real data needs verification.

**Prerequisite (do BEFORE enabling god-mode workspace creation):**

1. Set `job_grade = "GD"` on the General Director's **staff record** via the staff
   import or staff edit screen (God Mode → Staff). ⚠️ The **job-positions template
   upload does NOT do this** — it only seeds the JobGrade/JobPosition lookup tables
   and never touches staff records.
2. Verify exactly one active GD resolves:

   ```sql
   -- expect exactly 1 row, the GD's user
   SELECT user_id, staff_id, job_grade, employment_status
   FROM staff_profiles
   WHERE LOWER(job_grade) = 'gd'
     AND employment_status = 'active'
     AND deleted_at IS NULL
     AND user_id IS NOT NULL;
   ```

   - 0 rows → workspace creation will require an explicit owner pick (400 on bulk
     paths without `owner_email`). Fix the staff record.
   - \>1 distinct users → creation fails with "ambiguous GD". Fix staff data.

3. If the GD later resigns (staff deactivate / status change), the resolver returns
   none and the picker/400 behavior applies until a new GD record is graded.

## 2. Pre-migration check — ghost admin rows

Migration `license/0007_instance_admin_menu_permissions` backfills every admin row
**with a real user** as super-admin. Rows whose user FK was SET_NULL'd are deliberately
skipped. Before migrating, check whether any exist (informational):

```sql
SELECT id, created_at FROM instance_admins WHERE user_id IS NULL;
```

Ghost rows stay non-super and can be deleted from the Administrators page afterwards.

## 3. Post-deploy verification

1. Sign in as the original instance admin → full sidebar incl. **Administrators**
   (backfilled super-admin).
2. Administrators page → add a test admin granting only **Workspaces** → in a second
   browser session as that admin:
   - sidebar shows only Workspaces;
   - direct URL `/users/` redirects with a toast; `GET /api/instances/users/` → 403;
   - create a workspace → owner defaults to the GD; the creating admin does NOT
     appear in the workspace's member list.
3. Attempt to remove/demote the only super-admin → blocked with a clear error.
4. Remove the test admin.

## 4. Behavior changes to communicate

- God-mode-created workspaces no longer include the instance admin as a member —
  admins manage workspaces via god-mode APIs, not membership. Existing
  admin-owned workspaces are unchanged (no backfill, by decision); project imports
  into them exclude the acting admin from new projects.
- Additional admins created via the API before this release have no menu grants
  (fail-closed) — grant menus or super-admin from the Administrators page.

## Rollback

Standard release rollback applies. Migration `0007` is reversible
(`migrate license 0006`) — it drops the two columns and the backfill.
