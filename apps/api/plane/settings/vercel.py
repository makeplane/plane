# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Vercel Serverless Settings

This configuration is optimized for Vercel's serverless environment:
- No file system writes (logs to console only)
- Database connection pooling (required for serverless)
- Celery tasks run synchronously (no workers available)
- Stateless operation
"""

import os

from .common import *  # noqa

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Honor the 'X-Forwarded-Proto' header for request.is_secure()
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Disable Scout APM (not compatible with serverless)
SCOUT_MONITOR = False

# =============================================================================
# DATABASE - Use connection pooling for serverless
# =============================================================================
# For Neon: Use pooled connection string
# For Supabase: Use transaction pooler (port 6543)

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "plane"),
        "USER": os.environ.get("POSTGRES_USER", "plane"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "plane"),
        "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": 0,  # Don't persist connections in serverless
        "CONN_HEALTH_CHECKS": False,
        "OPTIONS": {
            "sslmode": os.environ.get("POSTGRES_SSLMODE", "require"),
        },
    }
}

# =============================================================================
# CELERY - Run tasks synchronously (no workers in serverless)
# =============================================================================
CELERY_TASK_ALWAYS_EAGER = True  # Execute tasks immediately, not async
CELERY_TASK_EAGER_PROPAGATES = True  # Propagate exceptions

# =============================================================================
# CACHING - Use Redis (Upstash recommended for serverless)
# =============================================================================
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {
                "max_connections": 5,  # Limit connections for serverless
            },
        },
    }
}

# =============================================================================
# LOGGING - Console only (no file system access in serverless)
# =============================================================================
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "fmt": "%(levelname)s %(asctime)s %(module)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "level": "INFO",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "plane": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# =============================================================================
# STATIC FILES - Served by Vercel CDN
# =============================================================================
STATIC_URL = "/static/"

# =============================================================================
# FILE STORAGE - Vercel Blob
# =============================================================================
# Use Vercel Blob for file storage (avatars, attachments, exports)
# Requires BLOB_READ_WRITE_TOKEN environment variable
DEFAULT_FILE_STORAGE = "plane.utils.storage.vercel_blob.VercelBlobStorage"

# Disable S3/Minio
USE_MINIO = False
AWS_S3_ENDPOINT_URL = None

# =============================================================================
# SECURITY
# =============================================================================
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]

# =============================================================================
# LIMITATIONS WARNING
# =============================================================================
# The following features will NOT work on Vercel:
#
# 1. Background Tasks (Celery):
#    - Email notifications (will block request)
#    - Export tasks (will timeout for large exports)
#    - Webhook delivery (will block request)
#
# 2. Scheduled Jobs (Celery Beat):
#    - Auto-archive issues
#    - Cleanup tasks
#    - Email digests
#
# 3. WebSocket (Live Server):
#    - Real-time collaboration
#    - Live updates
#
# 4. Long-running operations:
#    - Large file uploads
#    - Bulk operations
#    - Data migrations
#
# Consider using Railway/Render for full functionality.
# =============================================================================
