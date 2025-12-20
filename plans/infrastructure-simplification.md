# Infrastructure Simplification Plan: Treasury Plane Fork

## Executive Summary

Simplify Plane's infrastructure stack from **6 services** (PostgreSQL, Redis, RabbitMQ, Minio, MongoDB, Celery workers) to **3 services** (PostgreSQL, Redis, S3) while maintaining full functionality for government deployment.

### Current Stack vs Simplified Stack

| Current | Simplified | Notes |
|---------|------------|-------|
| PostgreSQL | PostgreSQL | Keep (primary DB) |
| Redis | Redis | **Keep** (required for live collaboration) |
| RabbitMQ | Remove | Replace with Django-Q2 ORM broker |
| Minio | LocalStack (local) / S3 (prod) | Simplify local dev |
| MongoDB | Remove | Use PostgreSQL partitioned tables |
| Celery | Django-Q2 | PostgreSQL-native task queue |

**Net result:** Remove RabbitMQ, MongoDB, and Minio. Keep Redis (cannot replace for real-time collaboration).

---

## Why Redis Cannot Be Removed

The Plane "live" service uses Redis pub/sub for real-time collaborative editing:

```typescript
// apps/live/src/redis.ts
import Redis from "ioredis";
// @hocuspocus/extension-redis requires Redis for:
// - Pub/Sub across multiple server instances
// - Presence tracking (who's editing)
// - CRDT (Yjs) document sync
```

**Hocuspocus library requires Redis** for multi-instance real-time collaboration. There's no PostgreSQL alternative that provides the same sub-millisecond pub/sub performance needed for live editing.

---

## Phase 1: Replace RabbitMQ with Django-Q2 (Task Queue)

### Current: Celery + RabbitMQ + Redis

```python
# apps/api/plane/settings/redis.py
CELERY_BROKER_URL = f"amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST}"
CELERY_RESULT_BACKEND = f"redis://{REDIS_HOST}:{REDIS_PORT}/"
```

### Proposed: Django-Q2 (PostgreSQL ORM broker)

**Why Django-Q2:**
- Uses PostgreSQL as the message broker (no RabbitMQ needed)
- Still uses Redis for result caching (already have Redis for live service)
- Django Admin integration for task monitoring
- Scheduled tasks built-in (replaces Celery Beat)
- Version 1.9.0, actively maintained, supports Django 4.2-6.0

### Implementation Steps

#### Step 1: Install Django-Q2

```bash
# In apps/api/
pip install django-q2
```

Add to `requirements.txt`:
```
django-q2==1.9.0
```

#### Step 2: Add to INSTALLED_APPS

```python
# apps/api/plane/settings/common.py
INSTALLED_APPS = [
    # ... existing apps
    'django_q',
]
```

#### Step 3: Configure Django-Q2

```python
# apps/api/plane/settings/common.py (new section)
Q_CLUSTER = {
    'name': 'plane',
    'workers': int(os.environ.get('Q_CLUSTER_WORKERS', 4)),
    'timeout': 300,  # 5 minutes (some exports take time)
    'retry': 600,    # 10 minutes before retry
    'max_attempts': 3,
    'orm': 'default',  # Use PostgreSQL via Django ORM
    'cache': 'default',  # Use Redis for task result caching
    'scheduler': True,  # Enable scheduled tasks
}
```

#### Step 4: Run Migrations

```bash
python manage.py migrate django_q
```

Creates tables:
- `django_q_task` - Task queue
- `django_q_schedule` - Scheduled tasks
- `django_q_ormq` - ORM broker queue
- `django_q_success` / `django_q_failure` - Results

#### Step 5: Convert Background Tasks

**Before (Celery):**
```python
# apps/api/plane/bgtasks/email_notification_task.py
from celery import shared_task

@shared_task
def email_notification(notification_id):
    # ... send email
```

**After (Django-Q2):**
```python
# apps/api/plane/bgtasks/email_notification_task.py
from django_q.tasks import async_task

def email_notification(notification_id):
    # ... send email (remove decorator)

# Caller changes from:
# email_notification.delay(notification_id)
# To:
# async_task('plane.bgtasks.email_notification_task.email_notification', notification_id)
```

**Create a migration helper:**
```python
# apps/api/plane/utils/tasks.py
from django_q.tasks import async_task

def queue_task(func_path, *args, **kwargs):
    """Wrapper for Django-Q2 async_task"""
    return async_task(func_path, *args, **kwargs)
```

#### Step 6: Convert Scheduled Tasks

**Before (Celery Beat in celery.py):**
```python
app.conf.beat_schedule = {
    'stack_email_notification': {
        'task': 'plane.bgtasks.email_notification_task.stack_email_notification',
        'schedule': crontab(minute='*/5'),
    },
    # ... 10 more scheduled tasks
}
```

**After (Django-Q2 Schedule):**
```python
# One-time setup via Django shell or migration
from django_q.tasks import schedule
from django_q.models import Schedule

# Email notification batching (every 5 minutes)
schedule(
    'plane.bgtasks.email_notification_task.stack_email_notification',
    schedule_type=Schedule.CRON,
    cron='*/5 * * * *'
)

# Hard delete (daily at midnight)
schedule(
    'plane.bgtasks.cleanup_task.hard_delete',
    schedule_type=Schedule.CRON,
    cron='0 0 * * *'
)

# Archive old issues (daily at 1 AM)
schedule(
    'plane.bgtasks.issue_automation_task.archive_and_close_old_issues',
    schedule_type=Schedule.CRON,
    cron='0 1 * * *'
)

# ... convert all 11 scheduled tasks
```

#### Step 7: Update Docker Entry Points

**Before:**
```bash
# bin/docker-entrypoint-worker.sh
celery -A plane worker --loglevel=info

# bin/docker-entrypoint-beat.sh
celery -A plane beat --loglevel=info
```

**After:**
```bash
# bin/docker-entrypoint-worker.sh
python manage.py qcluster

# bin/docker-entrypoint-beat.sh (no longer needed, scheduler built into qcluster)
# Can be removed or redirect to qcluster
```

#### Step 8: Update docker-compose.yml

**Remove RabbitMQ service:**
```yaml
# DELETE this service
plane-mq:
  image: rabbitmq:3.12.2-management-alpine
```

**Update worker service:**
```yaml
worker:
  command: python manage.py qcluster
  depends_on:
    - plane-db
    - plane-redis  # Still need Redis for live service
    # Remove: - plane-mq
```

**Remove beat-worker service (scheduler now built into qcluster):**
```yaml
# DELETE this service
beat-worker:
  command: celery -A plane beat
```

#### Step 9: Remove RabbitMQ Environment Variables

```bash
# Remove from .env
# RABBITMQ_HOST="plane-mq"
# RABBITMQ_PORT="5672"
# RABBITMQ_USER="plane"
# RABBITMQ_PASSWORD="plane"
# RABBITMQ_VHOST="plane"
```

---

## Phase 2: Replace MongoDB with PostgreSQL Partitioned Tables

### Current Usage

MongoDB is **optional** in Plane, used for archiving:
- Webhook logs
- API activity logs
- Email notification logs
- Page versions (beyond 20 most recent)
- Issue description versions

### Proposed: PostgreSQL Partitioned Tables

```sql
-- Create partitioned table for log archival
CREATE TABLE archived_logs (
    id BIGSERIAL,
    log_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE archived_logs_y2025m01 PARTITION OF archived_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE archived_logs_y2025m02 PARTITION OF archived_logs
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- ... etc

-- Index for fast lookups
CREATE INDEX ON archived_logs (log_type, created_at);
```

**Automatic partition management with pg_partman:**
```sql
-- On Aurora PostgreSQL
CREATE EXTENSION pg_partman;

SELECT partman.create_parent(
    'public.archived_logs',
    'created_at',
    'native',
    'monthly'
);

-- Auto-create future partitions
SELECT partman.run_maintenance();
```

### Implementation Steps

#### Step 1: Create Migration

```python
# apps/api/plane/db/migrations/xxxx_add_archived_logs_table.py
from django.db import migrations

class Migration(migrations.Migration):
    operations = [
        migrations.RunSQL("""
            CREATE TABLE IF NOT EXISTS archived_logs (
                id BIGSERIAL,
                log_type VARCHAR(50) NOT NULL,
                data JSONB NOT NULL,
                archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                original_created_at TIMESTAMPTZ,
                PRIMARY KEY (id, archived_at)
            ) PARTITION BY RANGE (archived_at);

            CREATE INDEX idx_archived_logs_type_date
            ON archived_logs (log_type, archived_at DESC);
        """, reverse_sql="DROP TABLE IF EXISTS archived_logs CASCADE;")
    ]
```

#### Step 2: Create Django Model

```python
# apps/api/plane/db/models/archive.py
from django.db import models

class ArchivedLog(models.Model):
    LOG_TYPES = [
        ('webhook', 'Webhook Log'),
        ('api', 'API Log'),
        ('email', 'Email Log'),
        ('page_version', 'Page Version'),
        ('issue_version', 'Issue Description Version'),
    ]

    log_type = models.CharField(max_length=50, choices=LOG_TYPES, db_index=True)
    data = models.JSONField()
    archived_at = models.DateTimeField(auto_now_add=True)
    original_created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'archived_logs'
        managed = False  # Partitioned table managed via SQL
```

#### Step 3: Update Cleanup Tasks

**Before (MongoDB archival):**
```python
# apps/api/plane/bgtasks/cleanup_task.py
mongo_collection = get_mongo_collection('webhook_logs')
if mongo_collection is not None:
    mongo_collection.bulk_write([InsertOne(doc) for doc in buffer])
```

**After (PostgreSQL archival):**
```python
# apps/api/plane/bgtasks/cleanup_task.py
from plane.db.models import ArchivedLog

def archive_webhook_logs():
    logs_to_archive = WebhookLog.objects.filter(
        created_at__lt=timezone.now() - timedelta(days=30)
    )[:1000]

    archived = []
    for log in logs_to_archive:
        archived.append(ArchivedLog(
            log_type='webhook',
            data={
                'webhook_id': str(log.webhook_id),
                'event_type': log.event_type,
                'request': log.request_data,
                'response': log.response_data,
                'status_code': log.status_code,
            },
            original_created_at=log.created_at
        ))

    ArchivedLog.objects.bulk_create(archived)
    logs_to_archive.delete()
```

#### Step 4: Remove MongoDB Configuration

```python
# DELETE apps/api/plane/settings/mongo.py
# or keep as empty fallback:

# apps/api/plane/settings/mongo.py
MONGO_DB_URL = None  # MongoDB no longer used
MONGO_DB_DATABASE = None
```

Remove from docker-compose.yml if present.

---

## Phase 3: Replace Minio with LocalStack (Local) / S3 (Production)

### Current: Minio for Local Development

```yaml
# docker-compose.yml
plane-minio:
  image: minio/minio
  ports:
    - "9000:9000"
```

### Proposed: LocalStack for Local, Real S3 for Production

**Benefits:**
- LocalStack emulates real AWS S3 API (99% compatible)
- Same code path for local and production
- No Minio-specific configuration needed
- Easier testing of AWS-specific features (signed URLs, lifecycle policies)

### Implementation Steps

#### Step 1: Update docker-compose-local.yml

```yaml
services:
  plane-db:
    image: postgres:16
    # ... existing config

  plane-redis:
    image: redis:7-alpine
    # ... existing config

  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
    volumes:
      - localstack-data:/tmp/localstack
      - /var/run/docker.sock:/var/run/docker.sock

  # ... web, api, etc services

volumes:
  localstack-data:
```

#### Step 2: Create S3 Bucket Initialization Script

```bash
#!/bin/bash
# scripts/init-localstack.sh

# Wait for LocalStack to be ready
echo "Waiting for LocalStack..."
until aws --endpoint-url=http://localhost:4566 s3 ls 2>/dev/null; do
    sleep 1
done

# Create the uploads bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://uploads

echo "LocalStack S3 bucket 'uploads' created"
```

#### Step 3: Update Settings for Environment Detection

```python
# apps/api/plane/settings/storage.py
import os

# Detect environment
USE_LOCALSTACK = os.environ.get('USE_LOCALSTACK', '0') == '1'
USE_MINIO = os.environ.get('USE_MINIO', '0') == '1'

if USE_LOCALSTACK:
    # LocalStack configuration (local development)
    AWS_S3_ENDPOINT_URL = os.environ.get('AWS_S3_ENDPOINT_URL', 'http://localhost:4566')
    AWS_ACCESS_KEY_ID = 'test'
    AWS_SECRET_ACCESS_KEY = 'test'
    AWS_S3_USE_SSL = False
    AWS_S3_VERIFY = False
elif USE_MINIO:
    # Legacy Minio configuration (backward compatible)
    AWS_S3_ENDPOINT_URL = os.environ.get('AWS_S3_ENDPOINT_URL', 'http://plane-minio:9000')
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', 'access-key')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', 'secret-key')
else:
    # Production AWS S3 (use IAM roles, no access keys)
    AWS_S3_ENDPOINT_URL = None  # Use real AWS endpoint
    AWS_ACCESS_KEY_ID = None    # Use IAM role
    AWS_SECRET_ACCESS_KEY = None

AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_S3_BUCKET_NAME', 'uploads')
AWS_S3_REGION_NAME = os.environ.get('AWS_REGION', 'us-east-1')
AWS_DEFAULT_ACL = None  # Don't set ACLs, use bucket policy

# Django storage backend
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
```

#### Step 4: Update .env for Local Development

```bash
# .env (local development)
USE_LOCALSTACK=1
AWS_S3_ENDPOINT_URL=http://localhost:4566
AWS_S3_BUCKET_NAME=uploads
```

---

## Phase 4: Move Magic Links from Redis to PostgreSQL

### Current: Redis-based Magic Links

```python
# apps/api/plane/authentication/provider/credentials/magic_code.py
ri = redis_instance()
ri.set(key, json.dumps(value), ex=600)  # 10-minute TTL
```

### Proposed: PostgreSQL Table with pg_cron Cleanup

```python
# apps/api/plane/db/models/auth.py
from django.db import models

class MagicLink(models.Model):
    key = models.CharField(max_length=255, unique=True, db_index=True)
    email = models.EmailField()
    code = models.CharField(max_length=10)
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'magic_links'
        indexes = [
            models.Index(fields=['expires_at']),
        ]

# apps/api/plane/authentication/provider/credentials/magic_code.py
from plane.db.models import MagicLink
from django.utils import timezone
from datetime import timedelta

def create_magic_link(email, code):
    key = f"magic_link:{email}"
    expires_at = timezone.now() + timedelta(minutes=10)

    MagicLink.objects.update_or_create(
        key=key,
        defaults={
            'email': email,
            'code': code,
            'attempts': 0,
            'expires_at': expires_at,
        }
    )
    return key

def verify_magic_link(email, code):
    key = f"magic_link:{email}"
    try:
        link = MagicLink.objects.get(key=key)

        if timezone.now() > link.expires_at:
            link.delete()
            return None

        if link.attempts >= 3:
            return None

        if link.code == code:
            link.delete()
            return {'email': link.email, 'verified': True}

        link.attempts += 1
        link.save()
        return None

    except MagicLink.DoesNotExist:
        return None

# Schedule cleanup with pg_cron
# DELETE FROM magic_links WHERE expires_at < NOW()
```

**pg_cron cleanup job:**
```sql
SELECT cron.schedule(
    'cleanup-magic-links',
    '*/5 * * * *',  -- Every 5 minutes
    $$DELETE FROM magic_links WHERE expires_at < NOW()$$
);
```

---

## Final Architecture

### Local Development Stack

```
┌─────────────────────────────────────────────────┐
│                Local Development                 │
├─────────────────────────────────────────────────┤
│                                                  │
│   ┌─────────────┐    ┌─────────────┐            │
│   │  LocalStack │    │  PostgreSQL │            │
│   │     (S3)    │    │     16      │            │
│   └─────────────┘    └─────────────┘            │
│                              │                   │
│                              │  Django-Q2        │
│                              │  (ORM broker)     │
│                              │                   │
│   ┌─────────────┐    ┌───────┴───────┐          │
│   │    Redis    │◄───│   Django API  │          │
│   │  (live only)│    └───────────────┘          │
│   └─────────────┘                               │
│         │                                        │
│   ┌─────┴─────┐                                 │
│   │   Live    │  (Real-time collaboration)      │
│   │  Service  │                                 │
│   └───────────┘                                 │
└─────────────────────────────────────────────────┘

Services: 3 (PostgreSQL, Redis, LocalStack)
Removed: RabbitMQ, Minio, MongoDB
```

### Production Stack (AWS)

```
┌─────────────────────────────────────────────────┐
│                   Production                     │
├─────────────────────────────────────────────────┤
│                                                  │
│   ┌─────────────┐    ┌─────────────────┐        │
│   │   AWS S3    │    │ Aurora PostgreSQL│        │
│   │   Bucket    │    │  Serverless v2   │        │
│   └─────────────┘    └─────────────────┘        │
│                              │                   │
│                              │  Django-Q2        │
│                              │  + pg_cron        │
│                              │                   │
│   ┌─────────────┐    ┌───────┴───────┐          │
│   │ ElastiCache │◄───│ Elastic Beanstalk│       │
│   │   Redis     │    │   or ECS       │          │
│   └─────────────┘    └───────────────┘          │
│         │                                        │
│   ┌─────┴─────┐                                 │
│   │   Live    │  (ECS Fargate task)             │
│   │  Service  │                                 │
│   └───────────┘                                 │
└─────────────────────────────────────────────────┘

Services: Aurora PostgreSQL, ElastiCache Redis, S3
Managed by: Terraform
```

---

## Migration Steps Summary

### Week 1: Django-Q2 Migration
1. [ ] Install django-q2 package
2. [ ] Add Q_CLUSTER configuration
3. [ ] Run django_q migrations
4. [ ] Convert 33 background tasks (remove @shared_task decorator)
5. [ ] Convert 11 scheduled tasks to Django-Q2 Schedule
6. [ ] Update docker entrypoints
7. [ ] Test task execution locally
8. [ ] Remove RabbitMQ from docker-compose

### Week 2: MongoDB Removal
1. [ ] Create archived_logs partitioned table
2. [ ] Create ArchivedLog Django model
3. [ ] Update cleanup tasks to use PostgreSQL
4. [ ] Migrate existing MongoDB data (if any)
5. [ ] Remove MongoDB configuration
6. [ ] Remove MongoDB from docker-compose

### Week 3: Storage Simplification
1. [ ] Add LocalStack to docker-compose-local.yml
2. [ ] Create init-localstack.sh script
3. [ ] Update storage settings for environment detection
4. [ ] Test file uploads with LocalStack
5. [ ] Update production Terraform for S3
6. [ ] Remove Minio configuration

### Week 4: Magic Link Migration
1. [ ] Create MagicLink model and migration
2. [ ] Update magic_code.py to use PostgreSQL
3. [ ] Add pg_cron cleanup job
4. [ ] Test magic link flow
5. [ ] Remove Redis magic link code

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Django-Q2 task throughput | Medium | Monitor task queue depth; can scale workers |
| LocalStack S3 API differences | Low | 99% compatible; test critical paths |
| Redis still required for live | None | Accepted; Hocuspocus requires it |
| Migration data loss | High | Full backup before each phase; staged rollout |
| pg_cron not on all PostgreSQL | Low | Aurora supports it; fallback to Django-Q2 scheduler |

---

## Cost Savings (Production)

| Service | Current Cost | After Simplification |
|---------|--------------|---------------------|
| RabbitMQ (EC2/managed) | ~$15-30/mo | $0 |
| MongoDB (Atlas/EC2) | ~$20-50/mo | $0 |
| Minio (EC2) | ~$10-20/mo | $0 (use S3) |
| **Total Savings** | | **~$45-100/month** |

Plus: Reduced operational complexity, fewer services to secure/monitor/update.

---

## Files to Modify

### Core Changes
- `apps/api/plane/settings/common.py` - Add Q_CLUSTER config
- `apps/api/plane/settings/redis.py` - Remove Celery config
- `apps/api/plane/settings/storage.py` - Add LocalStack support
- `apps/api/plane/settings/mongo.py` - Disable MongoDB
- `apps/api/plane/celery.py` - Remove (or keep as stub)

### Background Tasks (33 files)
- `apps/api/plane/bgtasks/*.py` - Remove @shared_task decorators

### Docker
- `docker-compose.yml` - Remove plane-mq, add localstack
- `docker-compose-local.yml` - Simplified local stack
- `apps/api/bin/docker-entrypoint-worker.sh` - qcluster command
- `apps/api/bin/docker-entrypoint-beat.sh` - Remove (scheduler built-in)

### New Files
- `apps/api/plane/db/models/archive.py` - ArchivedLog model
- `apps/api/plane/db/migrations/xxxx_archived_logs.py`
- `scripts/init-localstack.sh` - Bucket initialization
