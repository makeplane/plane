---
name: api-documentation-generator
description: "Generate comprehensive, developer-friendly API documentation from code, including endpoints, parameters, examples, and best practices"
---

# API Documentation Generator

## Overview

Automatically generate clear, comprehensive API documentation from your codebase. This skill helps you create professional documentation that includes endpoint descriptions, request/response examples, authentication details, error handling, and usage guidelines.

Perfect for REST APIs, GraphQL APIs, and WebSocket APIs.

## When to Use This Skill

- Use when you need to document a new API
- Use when updating existing API documentation
- Use when your API lacks clear documentation
- Use when onboarding new developers to your API
- Use when preparing API documentation for external users
- Use when creating OpenAPI/Swagger specifications

## How It Works

### Step 1: Analyze the API Structure

First, I'll examine your API codebase to understand:
- Available endpoints and routes
- HTTP methods (GET, POST, PUT, DELETE, etc.)
- Request parameters and body structure
- Response formats and status codes
- Authentication and authorization requirements
- Error handling patterns

### Step 2: Generate Endpoint Documentation

For each endpoint, I'll create documentation including:

**Endpoint Details:**
- HTTP method and URL path
- Brief description of what it does
- Authentication requirements
- Rate limiting information (if applicable)

**Request Specification:**
- Path parameters
- Query parameters
- Request headers
- Request body schema (with types and validation rules)

**Response Specification:**
- Success response (status code + body structure)
- Error responses (all possible error codes)
- Response headers

**Code Examples:**
- cURL command
- JavaScript/TypeScript (fetch/axios)
- Python (requests)
- Other languages as needed

### Step 3: Add Usage Guidelines

I'll include:
- Getting started guide
- Authentication setup
- Common use cases
- Best practices
- Rate limiting details
- Pagination patterns
- Filtering and sorting options

### Step 4: Document Error Handling

Clear error documentation including:
- All possible error codes
- Error message formats
- Troubleshooting guide
- Common error scenarios and solutions

### Step 5: Create Interactive Examples

Where possible, I'll provide:
- Postman collection
- OpenAPI/Swagger specification
- Interactive code examples
- Sample responses

## Examples

### Example 1: REST API Endpoint Documentation

```markdown
## Create User

Creates a new user account.

**Endpoint:** `POST /api/v1/users`

**Authentication:** Required (Bearer token)

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",      // Required: Valid email address
  "password": "SecurePass123!",     // Required: Min 8 chars, 1 uppercase, 1 number
  "name": "John Doe",               // Required: 2-50 characters
  "role": "user"                    // Optional: "user" or "admin" (default: "user")
}
\`\`\`

**Success Response (201 Created):**
\`\`\`json
{
  "id": "usr_1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2026-01-20T10:30:00Z",
  "emailVerified": false
}
\`\`\`

**Error Responses:**

- `400 Bad Request` - Invalid input data
  \`\`\`json
  {
    "error": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "field": "email"
  }
  \`\`\`

- `409 Conflict` - Email already exists
  \`\`\`json
  {
    "error": "EMAIL_EXISTS",
    "message": "An account with this email already exists"
  }
  \`\`\`

- `401 Unauthorized` - Missing or invalid authentication token

**Example Request (cURL):**
\`\`\`bash
curl -X POST https://api.example.com/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
\`\`\`

**Example Request (JavaScript):**
\`\`\`javascript
const response = await fetch('https://api.example.com/api/v1/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    name: 'John Doe'
  })
});

const user = await response.json();
console.log(user);
\`\`\`

**Example Request (Python):**
\`\`\`python
import requests

response = requests.post(
    'https://api.example.com/api/v1/users',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json={
        'email': 'user@example.com',
        'password': 'SecurePass123!',
        'name': 'John Doe'
    }
)

user = response.json()
print(user)
\`\`\`
```

### Example 2: GraphQL API Documentation

```markdown
## User Query

Fetch user information by ID.

**Query:**
\`\`\`graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    email
    name
    role
    createdAt
    posts {
      id
      title
      publishedAt
    }
  }
}
\`\`\`

**Variables:**
\`\`\`json
{
  "id": "usr_1234567890"
}
\`\`\`

**Response:**
\`\`\`json
{
  "data": {
    "user": {
      "id": "usr_1234567890",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2026-01-20T10:30:00Z",
      "posts": [
        {
          "id": "post_123",
          "title": "My First Post",
          "publishedAt": "2026-01-21T14:00:00Z"
        }
      ]
    }
  }
}
\`\`\`

**Errors:**
\`\`\`json
{
  "errors": [
    {
      "message": "User not found",
      "extensions": {
        "code": "USER_NOT_FOUND",
        "userId": "usr_1234567890"
      }
    }
  ]
}
\`\`\`
```

### Example 3: Authentication Documentation

```markdown
## Authentication

All API requests require authentication using Bearer tokens.

### Getting a Token

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "your-password"
}
\`\`\`

**Response:**
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "refreshToken": "refresh_token_here"
}
\`\`\`

### Using the Token

Include the token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_TOKEN
\`\`\`

### Token Expiration

Tokens expire after 1 hour. Use the refresh token to get a new access token:

**Endpoint:** `POST /api/v1/auth/refresh`

**Request:**
\`\`\`json
{
  "refreshToken": "refresh_token_here"
}
\`\`\`
```

## Best Practices

### ✅ Do This

- **Be Consistent** - Use the same format for all endpoints
- **Include Examples** - Provide working code examples in multiple languages
- **Document Errors** - List all possible error codes and their meanings
- **Show Real Data** - Use realistic example data, not "foo" and "bar"
- **Explain Parameters** - Describe what each parameter does and its constraints
- **Version Your API** - Include version numbers in URLs (/api/v1/)
- **Add Timestamps** - Show when documentation was last updated
- **Link Related Endpoints** - Help users discover related functionality
- **Include Rate Limits** - Document any rate limiting policies
- **Provide Postman Collection** - Make it easy to test your API

### ❌ Don't Do This

- **Don't Skip Error Cases** - Users need to know what can go wrong
- **Don't Use Vague Descriptions** - "Gets data" is not helpful
- **Don't Forget Authentication** - Always document auth requirements
- **Don't Ignore Edge Cases** - Document pagination, filtering, sorting
- **Don't Leave Examples Broken** - Test all code examples
- **Don't Use Outdated Info** - Keep documentation in sync with code
- **Don't Overcomplicate** - Keep it simple and scannable
- **Don't Forget Response Headers** - Document important headers

## Documentation Structure

### Recommended Sections

1. **Introduction**
   - What the API does
   - Base URL
   - API version
   - Support contact

2. **Authentication**
   - How to authenticate
   - Token management
   - Security best practices

3. **Quick Start**
   - Simple example to get started
   - Common use case walkthrough

4. **Endpoints**
   - Organized by resource
   - Full details for each endpoint

5. **Data Models**
   - Schema definitions
   - Field descriptions
   - Validation rules

6. **Error Handling**
   - Error code reference
   - Error response format
   - Troubleshooting guide

7. **Rate Limiting**
   - Limits and quotas
   - Headers to check
   - Handling rate limit errors

8. **Changelog**
   - API version history
   - Breaking changes
   - Deprecation notices

9. **SDKs and Tools**
   - Official client libraries
   - Postman collection
   - OpenAPI specification

## Common Pitfalls

### Problem: Documentation Gets Out of Sync
**Symptoms:** Examples don't work, parameters are wrong, endpoints return different data
**Solution:** 
- Generate docs from code comments/annotations
- Use tools like Swagger/OpenAPI
- Add API tests that validate documentation
- Review docs with every API change

### Problem: Missing Error Documentation
**Symptoms:** Users don't know how to handle errors, support tickets increase
**Solution:**
- Document every possible error code
- Provide clear error messages
- Include troubleshooting steps
- Show example error responses

### Problem: Examples Don't Work
**Symptoms:** Users can't get started, frustration increases
**Solution:**
- Test every code example
- Use real, working endpoints
- Include complete examples (not fragments)
- Provide a sandbox environment

### Problem: Unclear Parameter Requirements
**Symptoms:** Users send invalid requests, validation errors
**Solution:**
- Mark required vs optional clearly
- Document data types and formats
- Show validation rules
- Provide example values

## Tools and Formats

### OpenAPI/Swagger
Generate interactive documentation:
```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    post:
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
```

### Postman Collection
Export collection for easy testing:
```json
{
  "info": {
    "name": "My API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create User",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/v1/users"
      }
    }
  ]
}
```

## Related Skills

- `@doc-coauthoring` - For collaborative documentation writing
- `@copywriting` - For clear, user-friendly descriptions
- `@test-driven-development` - For ensuring API behavior matches docs
- `@systematic-debugging` - For troubleshooting API issues

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [REST API Best Practices](https://restfulapi.net/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [API Design Patterns](https://www.apiguide.com/)
- [Postman Documentation](https://learning.postman.com/docs/)

---

**Pro Tip:** Keep your API documentation as close to your code as possible. Use tools that generate docs from code comments to ensure they stay in sync!

