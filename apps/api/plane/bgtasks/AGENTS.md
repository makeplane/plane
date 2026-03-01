# Background Tasks Module

Celery task management for asynchronous processing.

## Purpose

Central Celery task system handling emails, notifications, imports/exports, webhooks, cleanup, and more.

## Configuration

Located at `/apps/api/plane/celery.py`:

- Broker: Redis
- Scheduler: `django_celery_beat.schedulers.DatabaseScheduler`
- JSON logging format

## Scheduled Jobs

| Schedule          | Task                                  |
| ----------------- | ------------------------------------- |
| Every 5 min       | Email notification stacking           |
| Every 6 hours     | Instance trace monitoring             |
| Daily 00:00       | Hard deletion of soft-deleted records |
| Daily 01:00       | Archive/close old issues              |
| Daily 01:30-03:45 | Various cleanup tasks                 |

## Task Categories

### Email & Notifications

| File                                  | Purpose                            |
| ------------------------------------- | ---------------------------------- |
| `email_notification_task.py`          | Issue/epic update emails, batching |
| `notification_task.py`                | In-app notifications               |
| `user_activation_email_task.py`       | Account activation                 |
| `forgot_password_task.py`             | Password reset                     |
| `extended/share_page_notification.py` | Page share notifications           |

### Webhooks & Events

| File                     | Purpose                     |
| ------------------------ | --------------------------- |
| `webhook_task.py`        | Webhook delivery with retry |
| `event_tracking_task.py` | PostHog analytics           |

### Import/Export

| File                      | Purpose                      |
| ------------------------- | ---------------------------- |
| `export_task.py`          | Issue export (CSV/JSON/XLSX) |
| `importer_task.py`        | External service imports     |
| `analytic_plot_export.py` | Analytics export             |

### Issue Activity

| File                       | Purpose                         |
| -------------------------- | ------------------------------- |
| `issue_activities_task.py` | Activity tracking (1700+ lines) |
| `issue_automation_task.py` | Auto-archive/close              |
| `link_crawler_task.py`     | URL crawling for links          |

### Version Control

| File                                | Purpose                |
| ----------------------------------- | ---------------------- |
| `issue_description_version_task.py` | Description versioning |
| `page_version_task.py`              | Page version history   |

### Deletion & Cleanup

| File                       | Purpose                           |
| -------------------------- | --------------------------------- |
| `deletion_task.py`         | Soft/hard deletion                |
| `cleanup_task.py`          | Log cleanup (API, email, webhook) |
| `exporter_expired_task.py` | Expired export links              |

### Storage

| File                 | Purpose                   |
| -------------------- | ------------------------- |
| `file_asset_task.py` | Incomplete upload cleanup |
| `copy_s3_object.py`  | S3 file operations        |

### Workspace

| File                           | Purpose                |
| ------------------------------ | ---------------------- |
| `workspace_seed_task.py`       | Demo project setup     |
| `workspace_invitation_task.py` | Invitations            |
| `silo_data_migration_task.py`  | Multi-tenant migration |

## Key Task Patterns

```python
@shared_task(bind=True)
def my_task(self, arg1, arg2):
    try:
        # Task logic
    except Exception as e:
        log_exception(e)
        raise
```

## Error Handling

All tasks use `log_exception()` from `plane.utils.exception_logger`

## External Integrations

- S3 for exports
- PostHog for analytics
- MongoDB (optional) for activity logging
- GitHub webhooks for repo sync
