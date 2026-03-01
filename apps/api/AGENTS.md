# API Application

Django REST API backend for Plane.

## Stack

- Django 4.x + Django REST Framework
- PostgreSQL, Redis, Celery + RabbitMQ
- GraphQL via Strawberry

## Commands

```bash
python manage.py runserver     # Dev server
python manage.py migrate       # Run migrations
pytest                         # Run tests
pytest -m unit                 # Unit tests only
pytest -m contract             # Contract tests only
celery -A plane worker -l info # Celery worker
```

## Test Markers

- `unit` - Models, serializers, utilities
- `contract` - API endpoints
- `smoke` - Critical functionality
- `slow` - May be skipped in CI

## Environment

Copy `.env.example` to `.env`. Key variables: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`.

See `plane/AGENTS.md` for Django project structure details.
