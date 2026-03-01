# Middleware Module

Django middleware for request processing.

## Purpose

Request/response processing middleware for database routing, logging, and request validation.

## Components

### ReadReplicaRoutingMiddleware

Intelligent database routing for read/write splitting.

**Behavior**:

- Routes write operations to primary database
- Routes GET requests to read replicas (configurable)
- Per-view configuration via `use_read_replica` attribute

**Usage**:

```python
class MyView(APIView):
    use_read_replica = True  # Enable read replica for this view
```

### APITokenLogMiddleware

Logs API requests with token information.

**Tracks**:

- Request path and method
- API token used
- Response status
- Timing information

### RequestLoggerMiddleware

General request logging middleware.

**Features**:

- Request/response logging
- Performance timing
- Error tracking

### RequestBodySizeLimitMiddleware

Validates request payload size.

**Purpose**:

- Prevent oversized payloads
- Security protection against DoS
- Configurable size limits

## Configuration

Add to Django `MIDDLEWARE` setting:

```python
MIDDLEWARE = [
    # ...
    'plane.middleware.db_routing.ReadReplicaRoutingMiddleware',
    'plane.middleware.logger.RequestLoggerMiddleware',
    'plane.middleware.request_body_size.RequestBodySizeLimitMiddleware',
]
```

## Database Routing

The read replica routing requires database configuration:

```python
DATABASES = {
    'default': {...},      # Primary (writes)
    'replica': {...},      # Read replica
}
```
