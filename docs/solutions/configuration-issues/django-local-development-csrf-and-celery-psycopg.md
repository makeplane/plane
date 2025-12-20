---
title: Django Local Development - CSRF and Celery psycopg Configuration
date: 2025-12-20
category: configuration-issues
tags: [django, csrf, celery, sqlalchemy, psycopg, local-development]
symptoms:
  - "CSRF Verification Failed" on login form submission
  - "ModuleNotFoundError: No module named 'psycopg2'" on API calls
  - 500 errors after successful database operations
root_cause: Missing localhost in CORS origins and SQLAlchemy defaulting to psycopg2 driver
---

# Django Local Development - CSRF and Celery psycopg Configuration

## Problem 1: CSRF Verification Failed

### Symptom

When accessing the Django backend directly at `localhost:8000/auth/sign-in/` and submitting the login form, Django returns:

```
CSRF Verification Failed
It looks like your form submission has expired or there was a problem with your request.
```

### Root Cause

Django's `CSRF_TRUSTED_ORIGINS` setting was configured from `CORS_ALLOWED_ORIGINS`, which only included frontend ports:

```
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3100"
```

When the form is submitted from `localhost:8000`, Django rejects it because that origin isn't trusted.

### Solution

Add the backend port to `CORS_ALLOWED_ORIGINS` in `.env`:

```bash
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3100,http://localhost:8000,http://127.0.0.1:8000"
```

### Prevention

When setting up local development:
- Include ALL ports that will serve forms (both frontend AND backend)
- Include both `localhost` and `127.0.0.1` variants

---

## Problem 2: Celery SQLAlchemy psycopg2 ModuleNotFoundError

### Symptom

After a successful database operation (e.g., creating a workspace), a 500 error occurs:

```
ModuleNotFoundError: No module named 'psycopg2'
```

The operation succeeds (workspace is created) but post-operation Celery tasks fail.

### Root Cause

The Celery broker was configured with a SQLAlchemy transport URL:

```python
return f"sqla+postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
```

SQLAlchemy's `postgresql://` dialect **defaults to psycopg2**, but the project uses **psycopg v3** (different package).

### Solution

Explicitly specify the psycopg driver in the connection string:

```python
# Before (defaults to psycopg2)
return f"sqla+postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# After (explicitly uses psycopg v3)
return f"sqla+postgresql+psycopg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
```

### Key Insight

| Connection String | Driver Used |
|-------------------|-------------|
| `postgresql://` | psycopg2 (legacy) |
| `postgresql+psycopg2://` | psycopg2 (explicit) |
| `postgresql+psycopg://` | psycopg v3 (modern) |

### Prevention

1. **Check requirements.txt** - If you see `psycopg` (not `psycopg2`), use `postgresql+psycopg://`
2. **Never cowboy install** - If you `pip install` something to fix an issue, add it to requirements
3. **Match drivers** - Ensure all PostgreSQL connections use the same driver

---

## General Learning: No Cowboy Installs

When installing dependencies to fix issues during development:

1. **ALWAYS update requirements** - Add to `requirements.txt` or `requirements/base.txt`
2. **Or fix the root cause** - Often the issue is configuration, not a missing package
3. **Verify reproducibility** - Run `pip install -r requirements.txt` in a fresh venv to confirm

Bad:
```bash
pip install psycopg2-binary  # Fixes it now, breaks for next developer
```

Good:
```python
# Fix the connection string to use the driver that's already installed
return f"sqla+postgresql+psycopg://{...}"
```
