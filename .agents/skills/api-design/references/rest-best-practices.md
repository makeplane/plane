# REST API Best Practices

## URL Structure

### Resource Naming

```
# Good - Plural nouns
GET /api/users
GET /api/orders
GET /api/products

# Bad - Verbs or mixed conventions
GET /api/getUser
GET /api/user  (inconsistent singular)
POST /api/createOrder
```

### Nested Resources

```
# Shallow nesting (preferred)
GET /api/users/{id}/orders
GET /api/orders/{id}

# Deep nesting (avoid)
GET /api/users/{id}/orders/{orderId}/items/{itemId}/reviews
# Better:
GET /api/order-items/{id}/reviews
```

## HTTP Methods and Status Codes

### GET - Retrieve Resources

```
GET /api/users              → 200 OK (with list)
GET /api/users/{id}         → 200 OK or 404 Not Found
GET /api/users?page=2       → 200 OK (paginated)
```

### POST - Create Resources

```
POST /api/users
  Body: {"name": "John", "email": "john@example.com"}
  → 201 Created
  Location: /api/users/123
  Body: {"id": "123", "name": "John", ...}

POST /api/users (validation error)
  → 422 Unprocessable Entity
  Body: {"errors": [...]}
```

### PUT - Replace Resources

```
PUT /api/users/{id}
  Body: {complete user object}
  → 200 OK (updated)
  → 404 Not Found (doesn't exist)

# Must include ALL fields
```

### PATCH - Partial Update

```
PATCH /api/users/{id}
  Body: {"name": "Jane"}  (only changed fields)
  → 200 OK
  → 404 Not Found
```

### DELETE - Remove Resources

```
DELETE /api/users/{id}
  → 204 No Content (deleted)
  → 404 Not Found
  → 409 Conflict (can't delete due to references)
```

## Filtering, Sorting, and Searching

### Query Parameters

```
# Filtering
GET /api/users?status=active
GET /api/users?role=admin&status=active

# Sorting
GET /api/users?sort=created_at
GET /api/users?sort=-created_at  (descending)
GET /api/users?sort=name,created_at

# Searching
GET /api/users?search=john
GET /api/users?q=john

# Field selection (sparse fieldsets)
GET /api/users?fields=id,name,email
```

## Pagination Patterns

### Offset-Based Pagination

```python
GET /api/users?page=2&page_size=20

Response:
{
  "items": [...],
  "page": 2,
  "page_size": 20,
  "total": 150,
  "pages": 8
}
```

### Cursor-Based Pagination (for large datasets)

```python
GET /api/users?limit=20&cursor=eyJpZCI6MTIzfQ

Response:
{
  "items": [...],
  "next_cursor": "eyJpZCI6MTQzfQ",
  "has_more": true
}
```

### Link Header Pagination (RESTful)

```
GET /api/users?page=2

Response Headers:
Link: <https://api.example.com/users?page=3>; rel="next",
      <https://api.example.com/users?page=1>; rel="prev",
      <https://api.example.com/users?page=1>; rel="first",
      <https://api.example.com/users?page=8>; rel="last"
```

## Versioning Strategies

### URL Versioning (Recommended)

```
/api/v1/users
/api/v2/users

Pros: Clear, easy to route
Cons: Multiple URLs for same resource
```

### Header Versioning

```
GET /api/users
Accept: application/vnd.api+json; version=2

Pros: Clean URLs
Cons: Less visible, harder to test
```

### Query Parameter

```
GET /api/users?version=2

Pros: Easy to test
Cons: Optional parameter can be forgotten
```

## Rate Limiting

### Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 742
X-RateLimit-Reset: 1640000000

Response when limited:
429 Too Many Requests
Retry-After: 3600
```

### Implementation Pattern

```python
from fastapi import HTTPException, Request
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, calls: int, period: int):
        self.calls = calls
        self.period = period
        self.cache = {}

    def check(self, key: str) -> bool:
        now = datetime.now()
        if key not in self.cache:
            self.cache[key] = []

        # Remove old requests
        self.cache[key] = [
            ts for ts in self.cache[key]
            if now - ts < timedelta(seconds=self.period)
        ]

        if len(self.cache[key]) >= self.calls:
            return False

        self.cache[key].append(now)
        return True

limiter = RateLimiter(calls=100, period=60)

@app.get("/api/users")
async def get_users(request: Request):
    if not limiter.check(request.client.host):
        raise HTTPException(
            status_code=429,
            headers={"Retry-After": "60"}
        )
    return {"users": [...]}
```

## Authentication and Authorization

### Bearer Token

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

401 Unauthorized - Missing/invalid token
403 Forbidden - Valid token, insufficient permissions
```

### API Keys

```
X-API-Key: your-api-key-here
```

## Error Response Format

### Consistent Structure

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "not-an-email"
      }
    ],
    "timestamp": "2025-10-16T12:00:00Z",
    "path": "/api/users"
  }
}
```

### Status Code Guidelines

- `200 OK`: Successful GET, PATCH, PUT
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Malformed request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: State conflict (duplicate email, etc.)
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limited
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Temporary downtime

## Caching

### Cache Headers

```
# Client caching
Cache-Control: public, max-age=3600

# No caching
Cache-Control: no-cache, no-store, must-revalidate

# Conditional requests
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
→ 304 Not Modified
```

## Bulk Operations

### Batch Endpoints

```python
POST /api/users/batch
{
  "items": [
    {"name": "User1", "email": "user1@example.com"},
    {"name": "User2", "email": "user2@example.com"}
  ]
}

Response:
{
  "results": [
    {"id": "1", "status": "created"},
    {"id": null, "status": "failed", "error": "Email already exists"}
  ]
}
```

## Idempotency

### Idempotency Keys

```
POST /api/orders
Idempotency-Key: unique-key-123

If duplicate request:
→ 200 OK (return cached response)
```

## CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Documentation with OpenAPI

```python
from fastapi import FastAPI

app = FastAPI(
    title="My API",
    description="API for managing users",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.get(
    "/api/users/{user_id}",
    summary="Get user by ID",
    response_description="User details",
    tags=["Users"]
)
async def get_user(
    user_id: str = Path(..., description="The user ID")
):
    """
    Retrieve user by ID.

    Returns full user profile including:
    - Basic information
    - Contact details
    - Account status
    """
    pass
```

## Health and Monitoring Endpoints

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health/detailed")
async def detailed_health():
    return {
        "status": "healthy",
        "checks": {
            "database": await check_database(),
            "redis": await check_redis(),
            "external_api": await check_external_api()
        }
    }
```
