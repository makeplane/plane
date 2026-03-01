# API Pod Startup Performance Analysis

## Problem

When deploying on Kubernetes, each API pod takes **60+ seconds** to become ready, even when there are no pending database migrations. This significantly slows down scaling, rolling deployments, and recovery from pod failures.

## Root Cause: Repeated Django Bootstrap Overhead

The Docker entrypoint scripts (`apps/api/bin/docker-entrypoint-api*.sh`) run **7 separate `python manage.py` invocations** sequentially. Each invocation spawns a new Python process that must fully bootstrap the Django application before executing the actual command.

### Entrypoint Command Sequence

| # | Command | Purpose |
|---|---------|---------|
| 1 | `python manage.py wait_for_db` | Wait for database connectivity |
| 2 | `python manage.py wait_for_migrations` | Wait for pending migrations to complete |
| 3 | `python manage.py register_instance[_ee]` | Register or update instance metadata |
| 4 | `python manage.py configure_instance` | Load instance configuration variables |
| 5 | `python manage.py create_bucket` | Ensure S3/MinIO bucket exists |
| 6 | `python manage.py clear_cache` | Flush stale cache entries |
| 7 | `python manage.py collectstatic` / `update_licenses` | Collect static files (CE) or sync licenses (EE) |

### Why Each Invocation Is Expensive

Each `python manage.py <command>` must:

1. Start a new Python interpreter process
2. Import Django settings (~50+ environment variable lookups)
3. Load all **27+ installed apps** (plane.db, plane.api, plane.graphql, strawberry.django, oauth2_provider, pgtrigger, etc.)
4. Discover and register all ORM models across every app
5. Pre-import **24 Celery task modules** defined in `CELERY_IMPORTS`
6. Set up database connection pools
7. Execute the actual command logic
8. Tear down the process

With this project's size, each bootstrap cycle costs an estimated **5-10 seconds**. Across 7 invocations, that's **35-70 seconds** spent purely on Django startup overhead before any real work happens.

## Secondary Contributors

### 1. Migration Graph Loading (`wait_for_migrations`)

**File**: `apps/api/plane/db/management/commands/wait_for_migrations.py`

Even with zero pending migrations, `MigrationExecutor` builds the full migration dependency graph by:
- Scanning all migration files on disk across every app
- Querying the `django_migrations` table
- Constructing and resolving the dependency DAG

In a project with many apps and migrations, this is non-trivial I/O on every pod start.

### 2. External HTTP Calls During Startup

**CE** (`register_instance.py`): Makes a synchronous HTTP request to `https://api.github.com/repos/makeplane/plane/releases/latest` with a **10-second timeout**. In K8s pods with restricted egress networking or no internet access, this blocks for the full timeout duration.

**EE** (`register_instance_ee.py`): Makes a synchronous HTTP request to the configured `PRIME_HOST`. If the prime server is slow or unreachable, this adds significant delay.

### 3. `collectstatic` at Container Start (CE only)

**File**: `apps/api/bin/docker-entrypoint-api.sh`, line 36

`python manage.py collectstatic --noinput` runs on **every pod startup**, scanning and copying all static files. This is work that should be done once at image build time, not repeated on every container start.

### 4. System Information Gathering in Entrypoint

The entrypoint shell scripts collect system information (hostname, MAC address, CPU info, memory, disk) and compute a SHA-256 hash for the machine signature. Commands like `cat /proc/cpuinfo` and `free -h` add minor but unnecessary overhead to every startup.

## Potential Solutions

### Solution 1: Consolidate Into a Single Management Command (High Impact)

Create a single `startup` management command that performs all initialization steps within one Django process, eliminating 6 redundant bootstrap cycles.

```python
# apps/api/plane/db/management/commands/startup.py
class Command(BaseCommand):
    help = "Run all startup initialization in a single process"

    def handle(self, *args, **options):
        self.wait_for_db()
        self.wait_for_migrations()
        self.register_instance()
        self.configure_instance()
        self.create_bucket()
        self.clear_cache()
```

The entrypoint script then becomes:

```bash
#!/bin/bash
set -e
python manage.py startup
exec gunicorn ...
```

**Expected improvement**: Reduces startup from ~60s to ~15-20s by paying the Django bootstrap cost only once.

### Solution 2: Move `collectstatic` to Docker Build (High Impact, CE only)

Add `collectstatic` to the Dockerfile so static files are baked into the image:

```dockerfile
# In Dockerfile.api
RUN python manage.py collectstatic --noinput
```

Remove the `collectstatic` call from `docker-entrypoint-api.sh`.

**Expected improvement**: Saves one full Django bootstrap cycle (~8-10s) plus the file copy time on every pod start.

### Solution 3: Add Timeouts and Fast-Fail to HTTP Calls (Medium Impact)

Reduce the timeout on external HTTP calls and make them non-blocking for pod startup:

- **CE**: The GitHub API call in `register_instance.py` uses a 10s timeout. Reduce to 3s or move to a post-startup background task.
- **EE**: The prime host call in `register_instance_ee.py` has no explicit timeout set on the `requests.get()` call. Add a short timeout.
- Consider deferring non-critical registration to a Celery task that runs after the server is already accepting traffic.

### Solution 4: Skip `wait_for_migrations` When Running as a Scaled Replica (Medium Impact)

In a K8s deployment, migrations are typically run by a separate init container or Job. Non-primary pods don't need to wait for migrations. Add a flag to skip this check:

```bash
# In entrypoint
if [ "$SKIP_MIGRATION_CHECK" != "1" ]; then
    python manage.py wait_for_migrations
fi
```

Or better, handle this entirely via K8s init containers.

### Solution 5: Compute Machine Signature Once at Build or Deploy Time (Low Impact)

The entrypoint computes a machine signature by reading `/proc/cpuinfo`, running `free -h`, `df -h`, `ip link show`, and hashing the output. In K8s, pod-level hardware info is largely meaningless for instance identification. Pre-compute or use a stable identifier (e.g., a deployment-level UUID from an environment variable) instead of gathering system info on every pod start.

### Solution 6: Use K8s Init Containers for One-Time Setup (Medium Impact)

Split the startup into two concerns:

1. **Init container** (runs once per deployment): `register_instance`, `configure_instance`, `create_bucket`
2. **Main container** (runs per pod): `wait_for_db`, `clear_cache`, start gunicorn

This avoids repeating instance registration and bucket creation on every replica pod.

### Solution 7: Lazy-Load Non-Critical Apps (Low Impact, Long-Term)

Audit `INSTALLED_APPS` for apps that aren't needed at startup (e.g., `plane.graphql`, `plane.silo`, `plane.agents`). Django 3.2+ supports lazy app loading, and unnecessary apps can be deferred to reduce bootstrap time.

## Recommended Priority

| Priority | Solution | Impact | Effort |
|----------|----------|--------|--------|
| 1 | Consolidate into single management command | High | Low |
| 2 | Move `collectstatic` to Dockerfile | High | Low |
| 3 | Add timeouts / defer HTTP calls | Medium | Low |
| 4 | Skip migration check for replicas | Medium | Low |
| 5 | Use K8s init containers | Medium | Medium |
| 6 | Pre-compute machine signature | Low | Low |
| 7 | Lazy-load non-critical apps | Low | High |

Implementing solutions 1-4 alone should reduce pod startup time from **60+ seconds to under 15 seconds**.

## Affected Files

- `apps/api/bin/docker-entrypoint-api.sh`
- `apps/api/bin/docker-entrypoint-api-ee.sh`
- `apps/api/bin/docker-entrypoint-api-cloud.sh`
- `apps/api/Dockerfile.api`
- `apps/api/plane/db/management/commands/wait_for_db.py`
- `apps/api/plane/db/management/commands/wait_for_migrations.py`
- `apps/api/plane/license/management/commands/register_instance.py`
- `apps/api/plane/license/management/commands/register_instance_ee.py`
- `apps/api/plane/license/management/commands/configure_instance.py`
- `apps/api/plane/db/management/commands/create_bucket.py`
- `apps/api/plane/db/management/commands/clear_cache.py`
