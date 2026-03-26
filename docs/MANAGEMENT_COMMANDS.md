# Django Management Commands Reference

This document lists all custom Django management commands available in the Plane API server (`apps/api`).

All commands are run via:

```bash
python manage.py <command> [arguments]
```

Or inside Docker:

```bash
docker compose exec api python manage.py <command> [arguments]
```

---

## `activate_user`

Activates a deactivated user account by their email address. Use this when a user has been disabled and needs to regain access to the platform.

```bash
python manage.py activate_user user@example.com
```

| Argument | Required | Description                   |
| -------- | -------- | ----------------------------- |
| `email`  | Yes      | Email of the user to activate |

---

## `change_ownership`

Transfers workspace ownership to a different user. The specified user is set as the workspace admin and becomes the new owner. Useful when the original workspace creator leaves the organization or ownership needs to be reassigned.

```bash
python manage.py change_ownership --email new-owner@example.com --workspace_slug my-workspace
```

| Argument           | Required | Description       |
| ------------------ | -------- | ----------------- |
| `--email`          | Yes      | New owner's email |
| `--workspace_slug` | Yes      | Workspace slug    |

---

## `clear_cache`

Clears the application cache to remove stale values. Can target a specific cache key or clear the entire cache. Typically used before server restarts or when cached data becomes inconsistent.

```bash
python manage.py clear_cache
python manage.py clear_cache --key my_cache_key
```

| Argument | Required | Description                 |
| -------- | -------- | --------------------------- |
| `--key`  | No       | Specific cache key to clear |

---

## `clear_workspace_licenses`

Hard deletes all workspace licenses from the database. Used during startup or when license state needs to be fully reset before re-syncing from the payment server.

```bash
python manage.py clear_workspace_licenses
```

---

## `configure_instance`

Loads instance configuration from environment variables, including OAuth provider settings (Google, GitHub, etc.), email configuration, and other instance-level settings. Run this after changing environment variables to apply them to the instance.

```bash
python manage.py configure_instance
```

---

## `copy_issue_comment_to_description`

Migrates existing IssueComment records into the Description model in batches. This is a data migration command used when transitioning comment storage to the description model.

```bash
python manage.py copy_issue_comment_to_description
```

---

## `copy_project`

Copies an entire project with all its data (issues, cycles, modules, etc.) from one workspace to another. Supports renaming the copied project and running the operation in the background via Celery for large projects.

```bash
python manage.py copy_project \
  --source-workspace-slug my-workspace \
  --source-project-identifier PROJ \
  --target-workspace-slug other-workspace
python manage.py copy_project \
  --source-workspace-slug my-workspace \
  --source-project-identifier PROJ \
  --target-workspace-slug other-workspace \
  --new-project-name "Copied Project" \
  --new-project-identifier COPY \
  --background
```

| Argument                      | Required | Description                       |
| ----------------------------- | -------- | --------------------------------- |
| `--source-workspace-slug`     | Yes      | Source workspace slug             |
| `--source-project-identifier` | Yes      | Source project identifier         |
| `--target-workspace-slug`     | Yes      | Target workspace slug             |
| `--new-project-name`          | No       | Name for the copied project       |
| `--new-project-identifier`    | No       | Identifier for the copied project |
| `--background`                | No       | Run via Celery background task    |

---

## `copy_workspace_data`

Copies all data from one workspace to another with a new owner. The command uses interactive prompts to collect workspace details and runs the actual copy operation as a Celery background task.

```bash
python manage.py copy_workspace_data
```

---

## `create_analytics`

Creates test analytics data by generating a cycle with 50 issues and corresponding progress records. Useful for development and testing of analytics features.

```bash
python manage.py create_analytics
```

---

## `create_bucket`

Creates the default S3/MinIO storage bucket for file uploads if it doesn't already exist. Should be run during initial instance setup to ensure the storage backend is ready.

```bash
python manage.py create_bucket
```

---

## `create_dummy_data`

Queues background tasks to populate a workspace with dummy data including issues, cycles, modules, and pages. Useful for development, demos, and testing at scale.

```bash
python manage.py create_dummy_data
python manage.py create_dummy_data --workspace_slug my-workspace
```

| Argument           | Required | Description           |
| ------------------ | -------- | --------------------- |
| `--workspace_slug` | No       | Target workspace slug |

---

## `create_instance_admin`

Adds a user as an instance administrator, giving them access to the admin panel (god-mode) for managing instance-wide settings, configurations, and user management.

```bash
python manage.py create_instance_admin admin@example.com
```

| Argument      | Required | Description                     |
| ------------- | -------- | ------------------------------- |
| `admin_email` | Yes      | Email of the user to make admin |

---

## `create_profile`

Creates a user profile for the given email address. If a profile already exists, it returns the existing one. Useful for ensuring a user's profile record exists in the system.

```bash
python manage.py create_profile user@example.com
```

| Argument | Required | Description        |
| -------- | -------- | ------------------ |
| `email`  | Yes      | User email address |

---

## `create_project_member`

Adds a workspace member to a specific project with a designated role. The user must already be a member of the workspace. Arguments can be provided via flags or interactively.

```bash
python manage.py create_project_member
python manage.py create_project_member --project_id <uuid> --user_email user@example.com --role 20
```

| Argument       | Required | Description               |
| -------------- | -------- | ------------------------- |
| `--project_id` | No       | Project UUID              |
| `--user_email` | No       | User email address        |
| `--role`       | No       | Role level in the project |

---

## `delete_user`

Permanently deletes a user account and cleans up associated token constraints. Use with caution as this operation is irreversible.

```bash
python manage.py delete_user --email user@example.com
```

| Argument  | Required | Description                 |
| --------- | -------- | --------------------------- |
| `--email` | Yes      | Email of the user to delete |

---

## `faker`

An interactive wizard that generates test and dummy data via background tasks. Prompts you to select a workspace and configure what data to generate. Similar to `create_dummy_data` but with a guided interactive experience.

```bash
python manage.py faker
```

---

## `fix_duplicate_sequences`

Fixes duplicate issue sequence IDs within a project using PostgreSQL advisory locks to ensure safe concurrent access. Use this when issues in a project have conflicting sequence numbers.

```bash
python manage.py fix_duplicate_sequences PROJECT-123
```

| Argument           | Required | Description                            |
| ------------------ | -------- | -------------------------------------- |
| `issue_identifier` | Yes      | Issue identifier (e.g., `PROJECT-123`) |

---

## `fix_workspace_duplicate_sequences`

Scans all projects in a workspace for duplicate issue sequences and fixes them. Supports dry-run mode to preview changes and can be scoped to a single project. Use this for bulk sequence repair across an entire workspace.

```bash
python manage.py fix_workspace_duplicate_sequences my-workspace
python manage.py fix_workspace_duplicate_sequences my-workspace --project-id <uuid>
python manage.py fix_workspace_duplicate_sequences my-workspace --dry-run
python manage.py fix_workspace_duplicate_sequences my-workspace --auto-confirm
```

| Argument         | Required | Description                      |
| ---------------- | -------- | -------------------------------- |
| `workspace_slug` | Yes      | Workspace slug                   |
| `--project-id`   | No       | Limit to a specific project      |
| `--dry-run`      | No       | Preview changes without applying |
| `--auto-confirm` | No       | Skip confirmation prompts        |

---

## `generate_cycle_progress`

Generates EntityProgress data for a specific cycle by replaying issue state activity history. Useful for backfilling progress metrics when cycle progress data is missing or needs recalculation.

```bash
python manage.py generate_cycle_progress <cycle_uuid>
```

| Argument   | Required | Description |
| ---------- | -------- | ----------- |
| `cycle_id` | Yes      | Cycle UUID  |

---

## `generate_index`

Deletes and recreates the Elasticsearch index for issues, then performs a bulk re-index of all issue data. Use this to rebuild the search index from scratch when it becomes corrupted or out of sync.

```bash
python manage.py generate_index
```

---

## `hard_delete_api_logs`

Schedules a background task to permanently delete old API log records from the database. Prompts interactively for the age threshold. Helps manage database size by purging historical API logs.

```bash
python manage.py hard_delete_api_logs
```

---

## `hard_delete_email_notification_logs`

Schedules a background task to permanently delete old email notification log records. Prompts interactively for the age threshold. Useful for database maintenance and storage reclamation.

```bash
python manage.py hard_delete_email_notification_logs
```

---

## `hard_delete_recent_visits`

Schedules a background task to permanently delete old user recent visit records. Prompts interactively for the age threshold. Keeps the recent visits table from growing unbounded.

```bash
python manage.py hard_delete_recent_visits
```

---

## `hard_delete_webhook_log`

Schedules a background task to permanently delete old webhook log records. Prompts interactively for the age threshold. Prevents webhook logs from consuming excessive database storage.

```bash
python manage.py hard_delete_webhook_log
```

---

## `invalidate_passwords`

Invalidates passwords for users specified by email addresses or a CSV file. Affected users will need to reset their passwords on next login. Supports dry-run mode to preview which accounts would be affected. Useful for security incidents or enforced password rotation.

```bash
python manage.py invalidate_passwords --email user1@example.com,user2@example.com
python manage.py invalidate_passwords --csv /path/to/emails.csv --column email_address
python manage.py invalidate_passwords --email user@example.com --dry-run
```

| Argument    | Required                    | Description                        |
| ----------- | --------------------------- | ---------------------------------- |
| `--email`   | One of `--email` or `--csv` | Comma-separated email addresses    |
| `--csv`     | One of `--email` or `--csv` | Path to CSV file with emails       |
| `--column`  | No                          | CSV column name (default: `email`) |
| `--dry-run` | No                          | Preview changes without applying   |

---

## `license_check`

Verifies the instance license with the Prime server. If the instance is not registered, it attempts registration. Use this to diagnose licensing issues or confirm that the instance is properly licensed.

```bash
python manage.py license_check
```

---

## `manage_search_index`

Manages the OpenSearch index with support for background execution via Celery and optional vectorization. Acts as a wrapper around OpenSearch index operations, making it easy to trigger re-indexing and vector embedding generation. Note that the `docs_semantic` index is managed out-of-band; however, to maintain a consistent CLI experience, it is automatically included when operating on all indices, and the command natively parses `--indices docs_semantic` to allow targeting it specifically.

```bash
python manage.py manage_search_index
python manage.py manage_search_index --background
python manage.py manage_search_index --background --vectorize
python manage.py manage_search_index index rebuild --force
python manage.py manage_search_index index rebuild --indices docs_semantic --force
```

| Argument       | Required | Description                                                    |
| -------------- | -------- | -------------------------------------------------------------- |
| `--background` | No       | Run via Celery background task                                 |
| `--vectorize`  | No       | Trigger vectorization after indexing (requires `--background`) |

---

## `migrate_intake_notifications`

Fixes notifications that were incorrectly created with `entity_name='intake'` by changing them to `'issue'`. This addresses a specific bug and can be run in dry-run mode to preview the scope of changes.

```bash
python manage.py migrate_intake_notifications
python manage.py migrate_intake_notifications --dry-run --batch-size 500
```

| Argument       | Required | Description                       |
| -------------- | -------- | --------------------------------- |
| `--dry-run`    | No       | Preview changes without applying  |
| `--batch-size` | No       | Records per batch (default: 1000) |

---

## `monitor_search_queue`

Monitors and manages OpenSearch batch update Redis queues. Provides real-time visibility into queue health, supports cleanup of stale queues, and offers an emergency force-drain option for stuck queues.

```bash
python manage.py monitor_search_queue status
python manage.py monitor_search_queue watch
python manage.py monitor_search_queue cleanup
python manage.py monitor_search_queue force-drain
```

| Subcommand    | Description                           |
| ------------- | ------------------------------------- |
| `status`      | Show current queue status (default)   |
| `watch`       | Watch queues in real-time             |
| `cleanup`     | Clean up stale queues                 |
| `force-drain` | Emergency force drain (**dangerous**) |

---

## `move_project_activities`

Migrates workspace-level activity records to project-specific activity models (ProjectActivity and ProjectMemberActivity). This is a one-time data migration command used when restructuring how activities are stored.

```bash
python manage.py move_project_activities
```

---

## `publish_template`

Publishes or unpublishes a template to/from the marketplace. Published templates become available for other workspaces to discover and use. Includes verification steps during publishing.

```bash
python manage.py publish_template <template_id>
python manage.py publish_template <template_id> --action unpublish
```

| Argument      | Required | Description                                   |
| ------------- | -------- | --------------------------------------------- |
| `template_id` | Yes      | Template UUID                                 |
| `--action`    | No       | `publish` or `unpublish` (default: `publish`) |

---

## `register_instance`

Registers a community edition instance with the Plane service and syncs version information from GitHub releases. Run this during initial setup of a community edition deployment.

```bash
python manage.py register_instance <machine_signature>
```

| Argument            | Required | Description              |
| ------------------- | -------- | ------------------------ |
| `machine_signature` | Yes      | Machine signature string |

---

## `register_instance_ee`

Registers a commercial/enterprise edition instance with the Prime server. Similar to `register_instance` but for paid editions that require license validation.

```bash
python manage.py register_instance_ee <machine_signature>
```

| Argument            | Required | Description              |
| ------------------- | -------- | ------------------------ |
| `machine_signature` | Yes      | Machine signature string |

---

## `reset_marketplace_app_secrets`

Deletes and recreates all marketplace application secrets. Use this when secrets have been compromised or need to be rotated for security purposes.

```bash
python manage.py reset_marketplace_app_secrets
```

---

## `reset_password`

Interactively resets a user's password. Prompts for the new password and validates its strength before applying the change. Use this when a user is locked out and cannot use the self-service password reset flow.

```bash
python manage.py reset_password user@example.com
```

| Argument | Required | Description       |
| -------- | -------- | ----------------- |
| `email`  | Yes      | Email of the user |

---

## `setup_instance`

Sets up a cloud edition instance, including admin user creation and initial configuration. This is the primary setup command for cloud deployments.

```bash
python manage.py setup_instance
```

---

## `silo_credentials_email_update`

Schedules a background task to update silo (integration) credentials from the old schema to the new schema. Part of the integration system migration process.

```bash
python manage.py silo_credentials_email_update
```

---

## `silo_data_migration`

Schedules a background task to migrate silo (integration) data from the old schema to the new schema. Used during major version upgrades that change the integration data structure.

```bash
python manage.py silo_data_migration
```

---

## `split_remaining_github_econnections`

Splits GitHub entity connections that haven't been migrated to the new schema. Targets specific connection IDs that were missed during the initial migration.

```bash
python manage.py split_remaining_github_econnections --entity_connections_ids_not_split id1,id2,id3
```

| Argument                             | Required | Description                            |
| ------------------------------------ | -------- | -------------------------------------- |
| `--entity_connections_ids_not_split` | No       | Comma-separated list of connection IDs |

---

## `startup`

Consolidated startup command that runs all initialization steps (database readiness, migrations, instance registration, configuration, bucket creation, license checks) in a single Django process. This is the primary entrypoint used in production deployments.

```bash
python manage.py startup cloud
python manage.py startup commercial --machine-signature <signature>
python manage.py startup community
```

| Argument              | Required | Description                           |
| --------------------- | -------- | ------------------------------------- |
| `edition`             | Yes      | `cloud`, `commercial`, or `community` |
| `--machine-signature` | No       | Machine signature for registration    |

---

## `sync_issue_description_version`

Schedules a background task to create IssueDescriptionVersion records for existing issues that don't have them. Used for backfilling version history after the description versioning feature was introduced.

```bash
python manage.py sync_issue_description_version
```

---

## `sync_issue_version`

Schedules a background task to create IssueVersion records for existing issues. Similar to `sync_issue_description_version` but for overall issue versioning rather than just descriptions.

```bash
python manage.py sync_issue_version
```

---

## `sync_license_user`

Schedules a background task to sync workspace members with the payment server. Ensures that the payment system has an accurate count of licensed users. Prompts interactively for workspace details.

```bash
python manage.py sync_license_user
```

---

## `sync_workspace_license_free_seats`

Schedules a background task to sync the free seat allocation for a workspace with the payment server. Use this when the free seat count appears incorrect or after plan changes.

```bash
python manage.py sync_workspace_license_free_seats
```

---

## `sync_workspace_license_subscription`

Schedules a background task to sync workspace billing and subscription details with the payment server. Use this to resolve subscription state discrepancies.

```bash
python manage.py sync_workspace_license_subscription
```

---

## `test_email`

Sends a test email to a specified recipient to verify that the email configuration (SMTP settings, templates, etc.) is working correctly. Useful during initial setup or after changing email settings.

```bash
python manage.py test_email recipient@example.com
```

| Argument   | Required | Description             |
| ---------- | -------- | ----------------------- |
| `to_email` | Yes      | Recipient email address |

---

## `transfer_api_logs`

Schedules a background task to transfer API log records from one database to another. Used when migrating log storage to a separate database for performance or compliance reasons. Prompts interactively for configuration.

```bash
python manage.py transfer_api_logs
```

---

## `transfer_email_notification_logs`

Schedules a background task to transfer email notification log records between databases. Similar to `transfer_api_logs` but specifically for email notification records.

```bash
python manage.py transfer_email_notification_logs
```

---

## `transfer_webhook_log`

Schedules a background task to transfer webhook log records between databases. Similar to `transfer_api_logs` but specifically for webhook delivery records.

```bash
python manage.py transfer_webhook_log
```

---

## `update_bucket`

Checks S3/MinIO bucket permissions and applies the public access policy if needed. Run this after changing storage configuration or if file access permissions are not working correctly.

```bash
python manage.py update_bucket
```

---

## `update_deleted_workspace_slug`

Appends a deletion timestamp to a soft-deleted workspace's slug, freeing up the original slug name for reuse. Useful when a workspace was deleted but its slug is still blocking creation of a new workspace with the same name.

```bash
python manage.py update_deleted_workspace_slug my-workspace
python manage.py update_deleted_workspace_slug my-workspace --dry-run
```

| Argument    | Required | Description                      |
| ----------- | -------- | -------------------------------- |
| `slug`      | Yes      | Workspace slug to update         |
| `--dry-run` | No       | Preview changes without applying |

---

## `update_licenses`

Schedules a background task to refresh and update all workspace licenses from the payment server. Typically run during startup to ensure all license states are current.

```bash
python manage.py update_licenses
```

---

## `update_marketplace_app`

Comprehensive management tool for marketplace apps. Supports publishing, unpublishing, assigning workspace owners, toggling internal/external visibility, setting priority and status, and configuring authorization requirements.

```bash
python manage.py update_marketplace_app assign-owner <app_id> --workspace-slug my-ws
python manage.py update_marketplace_app publish <app_id>
python manage.py update_marketplace_app unpublish <app_id>
python manage.py update_marketplace_app make-app-internal <app_id>
python manage.py update_marketplace_app make-app-external <app_id>
python manage.py update_marketplace_app set-app-priority <app_id> --priority 10
python manage.py update_marketplace_app set-app-status <app_id> --status active
python manage.py update_marketplace_app skip-app-authorization <app_id>
python manage.py update_marketplace_app mandate-app-authorization <app_id>
```

| Subcommand                  | Description                               |
| --------------------------- | ----------------------------------------- |
| `assign-owner`              | Assign a workspace as app owner           |
| `publish`                   | Publish the app (with optional timestamp) |
| `unpublish`                 | Unpublish the app                         |
| `make-app-internal`         | Mark app as internal                      |
| `make-app-external`         | Mark app as external                      |
| `set-app-priority`          | Set app display priority                  |
| `set-app-status`            | Set app status                            |
| `skip-app-authorization`    | Allow skipping authorization              |
| `mandate-app-authorization` | Require authorization                     |

---

## `wait_for_db`

Blocks execution until the database connection becomes available. Polls the database repeatedly and only returns once a successful connection is made. Used in startup scripts and container entrypoints to ensure the database is ready before running migrations or starting the server.

```bash
python manage.py wait_for_db
```

---

## `wait_for_migrations`

Blocks execution until all pending database migrations are complete, polling every 10 seconds. Used by Celery workers and beat schedulers to ensure they don't start processing before the database schema is fully up to date.

```bash
python manage.py wait_for_migrations
```
