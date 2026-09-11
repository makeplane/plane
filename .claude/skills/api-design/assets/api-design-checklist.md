# API Design Checklist

## Pre-Implementation Review

### Resource Design

- [ ] Resources are nouns, not verbs
- [ ] Plural names for collections
- [ ] Consistent naming across all endpoints
- [ ] Clear resource hierarchy (avoid deep nesting >2 levels)
- [ ] All CRUD operations properly mapped to HTTP methods

### HTTP Methods

- [ ] GET for retrieval (safe, idempotent)
- [ ] POST for creation
- [ ] PUT for full replacement (idempotent)
- [ ] PATCH for partial updates
- [ ] DELETE for removal (idempotent)

### Status Codes

- [ ] 200 OK for successful GET/PATCH/PUT
- [ ] 201 Created for POST
- [ ] 204 No Content for DELETE
- [ ] 400 Bad Request for malformed requests
- [ ] 401 Unauthorized for missing auth
- [ ] 403 Forbidden for insufficient permissions
- [ ] 404 Not Found for missing resources
- [ ] 422 Unprocessable Entity for validation errors
- [ ] 429 Too Many Requests for rate limiting
- [ ] 500 Internal Server Error for server issues

### Pagination

- [ ] All collection endpoints paginated
- [ ] Default page size defined (e.g., 20)
- [ ] Maximum page size enforced (e.g., 100)
- [ ] Pagination metadata included (total, pages, etc.)
- [ ] Cursor-based or offset-based pattern chosen

### Filtering & Sorting

- [ ] Query parameters for filtering
- [ ] Sort parameter supported
- [ ] Search parameter for full-text search
- [ ] Field selection supported (sparse fieldsets)

### Versioning

- [ ] Versioning strategy defined (URL/header/query)
- [ ] Version included in all endpoints
- [ ] Deprecation policy documented

### Error Handling

- [ ] Consistent error response format
- [ ] Detailed error messages
- [ ] Field-level validation errors
- [ ] Error codes for client handling
- [ ] Timestamps in error responses

### Authentication & Authorization

- [ ] Authentication method defined (Bearer token, API key)
- [ ] Authorization checks on all endpoints
- [ ] 401 vs 403 used correctly
- [ ] Token expiration handled

### Rate Limiting

- [ ] Rate limits defined per endpoint/user
- [ ] Rate limit headers included
- [ ] 429 status code for exceeded limits
- [ ] Retry-After header provided

### Documentation

- [ ] OpenAPI/Swagger spec generated
- [ ] All endpoints documented
- [ ] Request/response examples provided
- [ ] Error responses documented
- [ ] Authentication flow documented

### Testing

- [ ] Unit tests for business logic
- [ ] Integration tests for endpoints
- [ ] Error scenarios tested
- [ ] Edge cases covered
- [ ] Performance tests for heavy endpoints

### Security

- [ ] Input validation on all fields
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CORS configured correctly
- [ ] HTTPS enforced
- [ ] Sensitive data not in URLs
- [ ] No secrets in responses

### Performance

- [ ] Database queries optimized
- [ ] N+1 queries prevented
- [ ] Caching strategy defined
- [ ] Cache headers set appropriately
- [ ] Large responses paginated

### Monitoring

- [ ] Logging implemented
- [ ] Error tracking configured
- [ ] Performance metrics collected
- [ ] Health check endpoint available
- [ ] Alerts configured for errors

## GraphQL-Specific Checks

### Schema Design

- [ ] Schema-first approach used
- [ ] Types properly defined
- [ ] Non-null vs nullable decided
- [ ] Interfaces/unions used appropriately
- [ ] Custom scalars defined

### Queries

- [ ] Query depth limiting
- [ ] Query complexity analysis
- [ ] DataLoaders prevent N+1
- [ ] Pagination pattern chosen (Relay/offset)

### Mutations

- [ ] Input types defined
- [ ] Payload types with errors
- [ ] Optimistic response support
- [ ] Idempotency considered

### Performance

- [ ] DataLoader for all relationships
- [ ] Query batching enabled
- [ ] Persisted queries considered
- [ ] Response caching implemented

### Documentation

- [ ] All fields documented
- [ ] Deprecations marked
- [ ] Examples provided
- [ ] Schema introspection enabled
