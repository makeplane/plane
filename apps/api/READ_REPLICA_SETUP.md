# Read Replica Quick Setup Guide

## Overview

This guide helps you quickly set up and use the read replica functionality in Plane Cloud.

## Quick Start

### 1. Environment Setup

Add these environment variables:

```bash
# Enable read replica
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

### 2. Django Configuration

The configuration is automatically applied when `ENABLE_READ_REPLICA=1`. The settings include:

```python
# Database router (automatically added when ENABLE_READ_REPLICA=1)
DATABASE_ROUTERS = ["plane.utils.core.dbrouters.ReadReplicaRouter"]

# Middleware (automatically added when ENABLE_READ_REPLICA=1)
MIDDLEWARE.append("plane.middleware.db_routing.ReadReplicaRoutingMiddleware")
```

**No manual configuration needed** - just set the environment variables!

### 3. Basic Usage

All existing views automatically support read replicas. No code changes needed!

```python
# This automatically uses read replica for GET requests
class ProductViewSet(BaseViewSet):
    model = Product
    # use_read_replica = True (inherited by default)
```

## Usage Examples

### Use Read Replica (Default)

```python
class ReportViewSet(BaseViewSet):
    # Automatically uses replica for GET/HEAD/OPTIONS
    # Uses primary for POST/PUT/DELETE/PATCH
    model = Report
```

### Force Primary Database

```python
class OrderViewSet(BaseViewSet):
    use_read_replica = False  # Always use primary for fresh data
    model = Order
```

### Mixed Usage

```python
class AnalyticsAPIView(BaseAPIView):
    use_read_replica = True  # Analytics can use stale data

    def get(self, request):
        # This uses read replica
        return Response(data)
```

## View Decision Matrix

| HTTP Method | use_read_replica | Database Used |
|-------------|------------------|---------------|
| GET         | True (default)   | replica       |
| GET         | False            | default       |
| POST        | Any value        | default       |
| PUT         | Any value        | default       |
| DELETE      | Any value        | default       |
| PATCH       | Any value        | default       |

## Testing Your Setup

### 1. Check Configuration

```python
# In Django shell
from plane.utils.core import should_use_read_replica
from plane.utils.core.dbrouters import ReadReplicaRouter

# Test router
router = ReadReplicaRouter()
print(f"Read DB: {router.db_for_read(YourModel)}")
print(f"Write DB: {router.db_for_write(YourModel)}")
```

### 2. Test a View

```python
# Create a test view
class TestViewSet(BaseViewSet):
    use_read_replica = True
    model = YourModel

    def list(self, request):
        # This should use replica
        return super().list(request)
```

### 3. Monitor Logs

Enable debug logging to see routing decisions:

```python
# In settings.py
LOGGING = {
    'loggers': {
        'plane.middleware': {
            'level': 'DEBUG',
        },
        'plane.db': {
            'level': 'DEBUG',
        },
    }
}
```

## Common Patterns

### Read-Heavy Views (Use Replica)

```python
class ProductListViewSet(BaseViewSet):
    use_read_replica = True  # Safe for product browsing
    model = Product
    filterset_fields = ['category', 'price_range']
```

### Write-Heavy Views (Use Primary)

```python
class OrderProcessingViewSet(BaseViewSet):
    use_read_replica = False  # Need fresh inventory data
    model = Order
```

### Mixed Operations

```python
class UserProfileViewSet(BaseViewSet):
    def get_use_read_replica(self):
        # Dynamic decision based on action
        if self.action in ['list', 'retrieve']:
            return True  # Profile viewing can use replica
        return False  # Profile updates need primary
```

## Performance Tips

1. **Use Replicas for**: Reports, analytics, browsing, search
2. **Use Primary for**: Real-time data, after writes, critical operations
3. **Monitor**: Replication lag and query distribution
4. **Test**: Verify your views work with slightly stale data

## Troubleshooting

### Issue: Views not using replica

**Check**: Is `use_read_replica = True` set on your view?

```python
class MyViewSet(BaseViewSet):
    use_read_replica = True  # Add this line
    model = MyModel
```

### Issue: Middleware not working

**Check**: Is middleware in `MIDDLEWARE` setting?

```python
MIDDLEWARE = [
    # ...
    'plane.middleware.db_routing.ReadReplicaRoutingMiddleware',  # Add this
    # ...
]
```

### Issue: Router not routing

**Check**: Is router in `DATABASE_ROUTERS` setting?

```python
DATABASE_ROUTERS = [
    'plane.utils.core.dbrouters.ReadReplicaRouter',  # Add this
]
```

### Issue: Replica connection fails

**Check**: Database configuration and environment variables

```bash
# Verify these are set correctly
echo $POSTGRES_READ_REPLICA_HOST
echo $POSTGRES_READ_REPLICA_DB
# OR if using URL format:
echo $DATABASE_READ_REPLICA_URL
```

## Rollback Plan

If you need to disable read replicas:

1. Set `ENABLE_READ_REPLICA=0`
2. Restart the application
3. All traffic automatically goes to primary database

No code changes needed!

## Next Steps

1. ✅ Basic setup complete
2. 📊 Monitor performance improvements  
3. 🔧 Fine-tune view configurations
4. 📈 Add more replicas for scaling
5. 🌍 Consider geographic distribution

## Need Help?

- Check the full architecture documentation: `READ_REPLICA_ARCHITECTURE.md`
- Review middleware logs for routing decisions
- Test with a simple view first before complex operations

Happy scaling! 🚀
