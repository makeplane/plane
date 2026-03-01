# Settings Module

Django configuration for different environments.

## Purpose

Environment-specific Django settings configuration.

## Configuration Files

### common.py

Global settings shared across all environments.

**Key Sections**:

- `INSTALLED_APPS`: 13+ custom apps
- `MIDDLEWARE`: 8+ middleware classes
- `REST_FRAMEWORK`: DRF configuration
- `DATABASES`: Database setup
- `CACHES`: Cache configuration
- `CELERY_*`: Celery settings

### local.py

Development environment settings.

**Features**:

- Debug mode enabled
- Local database settings
- Relaxed security settings

### production.py

Production environment settings.

**Features**:

- Debug disabled
- Secure cookie settings
- Production database config
- Error logging

### test.py

Testing environment settings.

**Features**:

- Test database configuration
- Faster password hashing
- Disabled external services

### storage.py

File storage configuration.

**Supports**:

- Local file storage
- S3/MinIO storage
- Storage backends

### redis.py

Redis configuration.

**Used For**:

- Caching
- Session storage
- Celery broker
- Real-time features

### openapi.py

OpenAPI/Swagger documentation settings.

### mongo.py

MongoDB configuration for optional activity logging.

## Usage

Set `DJANGO_SETTINGS_MODULE` environment variable:

```bash
export DJANGO_SETTINGS_MODULE=plane.settings.production
```

## Installed Apps

```python
INSTALLED_APPS = [
    # Django
    'django.contrib.auth',
    'django.contrib.contenttypes',
    # ...

    # Third-party
    'rest_framework',
    'corsheaders',
    'oauth2_provider',
    # ...

    # Plane apps
    'plane.db',
    'plane.api',
    'plane.app',
    'plane.authentication',
    'plane.license',
    'plane.bgtasks',
    # ...
]
```
