# Read Replica Architecture Documentation

## Overview

This document provides a comprehensive overview of the read replica implementation in Plane Cloud. The architecture enables intelligent database routing to improve performance by distributing read operations across replica databases while ensuring write operations always use the primary database.

## Architecture Components

### 1. Request-Scoped Context Management
**Location**: `plane/utils/core/request_scope.py`

The foundation of the read replica system is a request-scoped context manager that maintains database routing decisions throughout the request lifecycle.

```python
# Core functions
set_use_read_replica(use_replica: bool)     # Set routing decision
should_use_read_replica() -> bool           # Check current routing
clear_read_replica_context()               # Cleanup after request
```

**Key Features**:
- Uses `asgiref.local.Local` for async-safe request isolation
- Prevents context leakage between concurrent requests
- Thread-safe and async-compatible

### 2. Database Router
**Location**: `plane/utils/core/dbrouters.py`

Django database router that implements the actual routing logic based on request context.

```python
class ReadReplicaRouter:
    def db_for_read(self, model, **hints) -> str
    def db_for_write(self, model, **hints) -> str  
    def allow_migrate(self, db, app_label, **hints) -> bool
```

**Routing Rules**:
- **Read operations**: Route to `replica` if context allows, otherwise `default`
- **Write operations**: Always route to `default` (primary database)
- **Migrations**: Only allowed on `default` database

### 3. Middleware Layer
**Location**: `plane/middleware/db_routing.py`

Modern Django middleware that determines routing decisions based on HTTP methods and view attributes.

```python
class ReadReplicaRoutingMiddleware:
    def __call__(self, request) -> HttpResponse
    def process_view(self, request, view_func, view_args, view_kwargs)
```

**Processing Logic**:
1. **Non-read requests** (POST, PUT, DELETE, PATCH) → Set primary database immediately
2. **Read requests** (GET, HEAD, OPTIONS) → Check view's `use_read_replica` attribute
3. **Context cleanup** → Clear context after request processing

### 4. DRF Mixin
**Location**: `plane/utils/core/mixins/view.py`

Django REST Framework mixin providing declarative control over read replica usage.

```python
class ReadReplicaControlMixin:
    use_read_replica: bool = True  # Default to replica for safety
```

**Integration Points**:
- Mixed into base view classes (`BaseAPIView`, `BaseViewSet`)
- Provides declarative API for developers
- Defaults to using replicas for safety

## Data Flow Architecture

```
HTTP Request
     ↓
┌─────────────────────────────────┐
│  ReadReplicaRoutingMiddleware   │
│  ────────────────────────────── │
│  1. Check HTTP method           │
│  2. If write → set primary      │
│  3. If read → check view attr   │
│  4. Set context accordingly     │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│  Django View Processing         │
│  ────────────────────────────── │
│  • View with ReadReplicaMixin   │
│  • use_read_replica attribute   │
│  • Business logic execution     │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│  Database Query Execution       │
│  ────────────────────────────── │
│  • Django ORM queries           │
│  • Router checks context        │
│  • Route to replica/primary     │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│  Request Cleanup                │
│  ────────────────────────────── │
│  • Clear request context        │
│  • Prevent context leakage      │
│  • Return HTTP response         │
└─────────────────────────────────┘
```

## Implementation Details

### Middleware Pattern (Modern Django 4.2+)

The middleware uses modern Django patterns instead of legacy `MiddlewareMixin`:

```python
class ReadReplicaRoutingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Pre-processing
        if request.method not in self.READ_ONLY_METHODS:
            set_use_read_replica(False)

        response = self.get_response(request)

        # Post-processing cleanup
        clear_read_replica_context()
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        # Efficient view inspection without URL resolution
        if request.method in self.READ_ONLY_METHODS:
            use_replica = self._should_use_read_replica(view_func)
            set_use_read_replica(use_replica)
```

### View Attribute Detection

The middleware intelligently detects the `use_read_replica` attribute across different view types:

```python
def _get_use_replica_attribute(self, view_func):
    # Function-based views
    use_replica = getattr(view_func, "use_read_replica", None)

    # Django CBV wrapper
    if hasattr(view_func, "view_class"):
        use_replica = getattr(view_func.view_class, "use_read_replica", None)

    # DRF wrapper (APIView/ViewSet)
    if hasattr(view_func, "cls"):
        use_replica = getattr(view_func.cls, "use_read_replica", None)

    return use_replica
```

### Context Isolation

Uses `asgiref.local.Local` for proper async context isolation:

```python
from asgiref.local import Local

_db_routing_context = Local()  # Provides ContextVar under the hood

def set_use_read_replica(use_replica: bool):
    _db_routing_context.use_read_replica = bool(use_replica)

def should_use_read_replica() -> bool:
    return getattr(_db_routing_context, "use_read_replica", False)
```

## Integration with Existing Base Classes

### Current Integration Status

All major base classes in Plane now inherit from `ReadReplicaControlMixin`:

```python
# plane/app/views/base.py
class BaseViewSet(TimezoneMixin, ReadReplicaControlMixin, ModelViewSet, BasePaginator):
    # Inherits use_read_replica = True by default

class BaseAPIView(TimezoneMixin, ReadReplicaControlMixin, APIView, BasePaginator):
    # Inherits use_read_replica = True by default

# plane/api/views/base.py  
class BaseAPIView(TimezoneMixin, ReadReplicaControlMixin, APIView, BasePaginator):
    # API-specific base with read replica support

# plane/ee/views/base.py
class BaseViewSet(BaseViewSetBase):  # Inherits from plane.app.views.base
class BaseAPIView(BaseAPIViewBase):  # Inherits from plane.app.views.base
```

This means **all views in Plane automatically have read replica capability**.

## Configuration Requirements

### Django Settings

The configuration is automatically applied when `ENABLE_READ_REPLICA=1`:

```python
# These are automatically configured in settings/common.py:

if os.environ.get("ENABLE_READ_REPLICA", "0") == "1":
    # Database configuration (automatically added)
    if bool(os.environ.get("DATABASE_READ_REPLICA_URL")):
        DATABASES["replica"] = dj_database_url.parse(
            os.environ.get("DATABASE_READ_REPLICA_URL")
        )
    else:
        DATABASES["replica"] = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_READ_REPLICA_DB"),
            "USER": os.environ.get("POSTGRES_READ_REPLICA_USER"),
            "PASSWORD": os.environ.get("POSTGRES_READ_REPLICA_PASSWORD"),
            "HOST": os.environ.get("POSTGRES_READ_REPLICA_HOST"),
            "PORT": os.environ.get("POSTGRES_READ_REPLICA_PORT", "5432"),
        }

    # Database router (automatically added)
    DATABASE_ROUTERS = ["plane.utils.core.dbrouters.ReadReplicaRouter"]

    # Middleware (automatically added)
    MIDDLEWARE.append("plane.middleware.db_routing.ReadReplicaRoutingMiddleware")
```

**No manual settings.py changes required** - just set environment variables!

### Environment Variables

```bash
# Enable read replica functionality
ENABLE_READ_REPLICA=1

# Option 1: Using DATABASE_READ_REPLICA_URL (recommended)
DATABASE_READ_REPLICA_URL=postgresql://user:password@replica.example.com:5432/plane_replica

# Option 2: Using individual environment variables
POSTGRES_READ_REPLICA_DB=plane_replica
POSTGRES_READ_REPLICA_USER=plane_user
POSTGRES_READ_REPLICA_PASSWORD=your_password
POSTGRES_READ_REPLICA_HOST=replica.example.com
POSTGRES_READ_REPLICA_PORT=5432
```

## Usage Patterns

### 1. Default Behavior (Automatic Read Replica)

```python
class ProductViewSet(BaseViewSet):
    # use_read_replica = True (inherited from mixin)
    model = Product
    # GET requests automatically use replica
```

### 2. Force Primary Database

```python
class OrderViewSet(BaseViewSet):
    use_read_replica = False  # Always use primary for fresh data
    model = Order
```

### 3. Mixed Usage in APIView

```python
class ReportAPIView(BaseAPIView):
    use_read_replica = True  # Reports can tolerate stale data

    def get(self, request):
        # This will use read replica
        return Response(data)
```

### 4. Conditional Logic

```python
class DynamicViewSet(BaseViewSet):
    def get_use_read_replica(self):
        # Override for dynamic behavior
        if self.action in ['list', 'retrieve']:
            return True
        return False
```

## Performance Considerations

### Benefits

1. **Load Distribution**: Read operations distributed across replicas
2. **Primary Offloading**: Reduces load on primary database for writes
3. **Scalability**: Easy horizontal scaling by adding more replicas
4. **Geographic Distribution**: Replicas can be geographically distributed

### Considerations

1. **Replication Lag**: Replica data may be slightly stale
2. **Connection Overhead**: Additional database connections
3. **Monitoring**: Need to monitor both primary and replica health
4. **Failover**: Handle replica unavailability gracefully

## Monitoring and Observability

### Logging

The system includes comprehensive logging:

```python
# Middleware logging
logger.debug(f"Routing {request.method} {request.path} to {db_type}")

# Router logging  
logger.debug(f"Routing read for {model._meta.label} to replica database")
logger.debug(f"Routing write for {model._meta.label} to primary database")
```

### Debugging in Development

```python
# In settings.py with DEBUG=True
if settings.DEBUG:
    from django.db import connection
    print(f"{request.method} - {request.get_full_path()} Queries: {len(connection.queries)}")
```

## Security Considerations

1. **Replica Permissions**: Ensure replica databases have read-only permissions
2. **Network Security**: Secure connections between app and replica databases  
3. **Data Sensitivity**: Consider data classification for replica placement
4. **Access Control**: Same access controls apply to replica data

## Testing Strategy

### Unit Tests

```python
def test_read_replica_routing():
    # Test middleware routing decisions
    # Test context isolation
    # Test view attribute detection

def test_database_router():
    # Test read/write routing
    # Test migration blocking
```

### Integration Tests

```python
def test_end_to_end_routing():
    # Test full request flow
    # Test different view configurations
    # Test error handling
```

## Migration and Rollback

### Deployment Steps

1. **Phase 1**: Deploy code without enabling replica
2. **Phase 2**: Configure replica database
3. **Phase 3**: Enable `ENABLE_READ_REPLICA=1`
4. **Phase 4**: Monitor and adjust view configurations

### Rollback Plan

1. Set `ENABLE_READ_REPLICA=0`
2. Remove replica database configuration  
3. All traffic automatically routes to primary
4. No code changes required

## Future Enhancements

### Planned Improvements

1. **Smart Failover**: Automatic failover to primary if replica unavailable
2. **Load Balancing**: Multiple replica support with load balancing
3. **Query Analysis**: Automatic detection of read-only queries
4. **Health Checks**: Built-in replica health monitoring
5. **Metrics**: Performance metrics and query distribution stats

### Extension Points

1. **Custom Routers**: Plugin architecture for custom routing logic
2. **Dynamic Configuration**: Runtime configuration changes
3. **Multi-Region**: Geographic replica routing
4. **Cache Integration**: Integration with Redis for hot data

## Troubleshooting

### Common Issues

1. **Context Leakage**: Ensure middleware is properly configured
2. **Migration Failures**: Check `allow_migrate` router configuration
3. **Stale Data**: Adjust view `use_read_replica` settings
4. **Connection Errors**: Verify replica database configuration

### Debug Commands

```python
# Check current context
from plane.utils.core import should_use_read_replica
print(f"Current context: {should_use_read_replica()}")

# Test router directly
from plane.utils.core import ReadReplicaRouter
router = ReadReplicaRouter()
print(f"Read DB: {router.db_for_read(MyModel)}")
```

## Conclusion

The read replica implementation provides a robust, scalable solution for database load distribution in Plane Cloud. The architecture is designed for:

- **Safety**: Conservative defaults and explicit opt-in
- **Performance**: Intelligent routing with minimal overhead  
- **Maintainability**: Clean separation of concerns
- **Extensibility**: Plugin architecture for future enhancements

The system is production-ready and provides immediate performance benefits while maintaining data consistency and system reliability.
