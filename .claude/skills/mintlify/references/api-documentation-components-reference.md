# API Documentation Components Reference

Complete guide for documenting APIs with Mintlify using OpenAPI/AsyncAPI specs and API components.

## OpenAPI Integration

### Automatic Page Generation

Use OpenAPI frontmatter to auto-generate API documentation from OpenAPI specs.

```mdx
---
title: "Get User"
openapi: "GET /users/{id}"
---
```

Mintlify automatically extracts:
- Request parameters (path, query, header, body)
- Request examples in multiple languages
- Response schemas
- Response examples
- Authentication requirements

### OpenAPI Configuration

Configure in `docs.json`:

```json
{
  "api": {
    "openapi": "/openapi.yaml",
    "params": {
      "expanded": true
    },
    "playground": {
      "display": "interactive",
      "proxy": "https://api.example.com"
    },
    "examples": {
      "languages": ["bash", "python", "javascript", "go", "ruby", "php", "java"],
      "defaults": {
        "bash": "curl",
        "python": "requests"
      },
      "prefill": {
        "apiKey": "your-api-key",
        "baseUrl": "https://api.example.com"
      },
      "autogenerate": true
    }
  }
}
```

**Configuration options:**
- `openapi` - Path to OpenAPI spec file (YAML or JSON)
- `params.expanded` - Expand parameter details by default
- `playground.display` - API playground mode (interactive, simple, none)
- `playground.proxy` - Proxy URL for API requests
- `examples.languages` - Supported code example languages
- `examples.defaults` - Default library per language
- `examples.prefill` - Pre-fill values in examples
- `examples.autogenerate` - Auto-generate examples from spec

### Multiple OpenAPI Specs

```json
{
  "api": {
    "openapi": [
      "/specs/v1.yaml",
      "/specs/v2.yaml"
    ]
  }
}
```

### OpenAPI Validation

```bash
mint openapi-check
```

Validates OpenAPI specs for:
- Syntax errors
- Schema compliance
- Missing required fields
- Invalid references

## AsyncAPI Integration

Document asynchronous APIs (WebSockets, message queues, event streams).

```json
{
  "api": {
    "asyncapi": "/asyncapi.yaml"
  }
}
```

Use in frontmatter:

```mdx
---
title: "User Events"
asyncapi: "subscribe user.created"
---
```

## ParamField Component

Document API parameters with detailed type information.

### Path Parameters

```mdx
<ParamField path="userId" type="string" required>
  The unique identifier of the user
</ParamField>

<ParamField path="postId" type="integer" required>
  The ID of the post to retrieve
</ParamField>
```

### Query Parameters

```mdx
<ParamField query="page" type="number" default="1">
  Page number for pagination (1-indexed)
</ParamField>

<ParamField query="limit" type="number" default="10">
  Number of items per page (max 100)
</ParamField>

<ParamField query="sort" type="string" default="created_at">
  Field to sort by
</ParamField>

<ParamField query="order" type="string" default="desc">
  Sort order (asc or desc)
</ParamField>
```

### Body Parameters

```mdx
<ParamField body="email" type="string" required>
  User's email address (must be unique)
</ParamField>

<ParamField body="name" type="string" required>
  Full name of the user
</ParamField>

<ParamField body="age" type="number">
  User's age (must be 18 or older)
</ParamField>

<ParamField body="settings" type="object">
  User preferences and settings
</ParamField>
```

### Header Parameters

```mdx
<ParamField header="Authorization" type="string" required>
  Bearer token for authentication

  Format: `Bearer YOUR_API_KEY`
</ParamField>

<ParamField header="Content-Type" type="string" default="application/json">
  Content type of the request body
</ParamField>

<ParamField header="X-Request-ID" type="string">
  Unique identifier for request tracing
</ParamField>
```

### Enum Parameters

```mdx
<ParamField
  query="status"
  type="string"
  default="active"
  enum={["active", "inactive", "pending", "suspended"]}
  enumDescriptions={{
    active: "User account is active and fully functional",
    inactive: "User account is temporarily disabled",
    pending: "User registration awaiting email verification",
    suspended: "User account suspended due to policy violation"
  }}
>
  Filter users by account status
</ParamField>
```

### Array Parameters

```mdx
<ParamField query="tags" type="array">
  Array of tag IDs to filter by

  Example: `?tags=1,2,3`
</ParamField>

<ParamField body="roles" type="string[]" required>
  Array of role identifiers to assign to the user
</ParamField>
```

### Nested Object Parameters

```mdx
<ParamField body="address" type="object">
  User's address information

  <Expandable title="address properties">
    <ParamField body="street" type="string" required>
      Street address
    </ParamField>
    <ParamField body="city" type="string" required>
      City name
    </ParamField>
    <ParamField body="state" type="string">
      State or province
    </ParamField>
    <ParamField body="postal_code" type="string" required>
      Postal/ZIP code
    </ParamField>
    <ParamField body="country" type="string" required>
      ISO 3166-1 alpha-2 country code
    </ParamField>
  </Expandable>
</ParamField>
```

## ResponseField Component

Document API response fields with type information.

### Basic Response Fields

```mdx
<ResponseField name="id" type="string" required>
  Unique identifier of the user
</ResponseField>

<ResponseField name="email" type="string" required>
  User's email address
</ResponseField>

<ResponseField name="created_at" type="timestamp" required>
  ISO 8601 timestamp of when the user was created
</ResponseField>

<ResponseField name="is_verified" type="boolean" default="false">
  Whether the user's email has been verified
</ResponseField>
```

### Nested Response Objects

```mdx
<ResponseField name="user" type="object">
  User information object

  <Expandable title="user properties">
    <ResponseField name="id" type="string" required>
      User ID
    </ResponseField>
    <ResponseField name="name" type="string" required>
      Full name
    </ResponseField>
    <ResponseField name="email" type="string" required>
      Email address
    </ResponseField>
    <ResponseField name="profile" type="object">
      Extended profile information

      <Expandable title="profile properties">
        <ResponseField name="bio" type="string">
          User biography
        </ResponseField>
        <ResponseField name="avatar_url" type="string">
          Profile picture URL
        </ResponseField>
        <ResponseField name="location" type="string">
          User's location
        </ResponseField>
      </Expandable>
    </ResponseField>
  </Expandable>
</ResponseField>
```

### Array Responses

```mdx
<ResponseField name="users" type="array">
  Array of user objects

  <Expandable title="user object properties">
    <ResponseField name="id" type="string">
      User ID
    </ResponseField>
    <ResponseField name="name" type="string">
      User name
    </ResponseField>
    <ResponseField name="email" type="string">
      Email address
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="meta" type="object">
  Pagination metadata

  <Expandable title="meta properties">
    <ResponseField name="page" type="number">
      Current page number
    </ResponseField>
    <ResponseField name="per_page" type="number">
      Items per page
    </ResponseField>
    <ResponseField name="total" type="number">
      Total number of items
    </ResponseField>
  </Expandable>
</ResponseField>
```

## Request Examples

Show API request examples in multiple programming languages.

### Basic Request Example

```mdx
<RequestExample>
```bash cURL
curl -X GET https://api.example.com/users/123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```python Python
import requests

response = requests.get(
    "https://api.example.com/users/123",
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)

print(response.json())
```

```javascript JavaScript
const response = await fetch("https://api.example.com/users/123", {
  method: "GET",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY"
  }
});

const data = await response.json();
console.log(data);
```

```go Go
package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    client := &http.Client{}
    req, _ := http.NewRequest("GET", "https://api.example.com/users/123", nil)
    req.Header.Set("Authorization", "Bearer YOUR_API_KEY")

    resp, _ := client.Do(req)
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}
```
</RequestExample>
```

### POST Request with Body

```mdx
<RequestExample>
```bash cURL
curl -X POST https://api.example.com/users \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "age": 30
  }'
```

```python Python
import requests

data = {
    "email": "user@example.com",
    "name": "John Doe",
    "age": 30
}

response = requests.post(
    "https://api.example.com/users",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json=data
)

print(response.json())
```

```javascript JavaScript
const data = {
  email: "user@example.com",
  name: "John Doe",
  age: 30
};

const response = await fetch("https://api.example.com/users", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
});

const result = await response.json();
console.log(result);
```

```ruby Ruby
require 'net/http'
require 'json'

uri = URI('https://api.example.com/users')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_API_KEY'
request['Content-Type'] = 'application/json'
request.body = {
  email: 'user@example.com',
  name: 'John Doe',
  age: 30
}.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts response.body
```
</RequestExample>
```

## Response Examples

Show API response examples for different scenarios.

### Success and Error Responses

```mdx
<ResponseExample>
```json Success (200)
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2024-01-15T10:30:00Z",
  "is_verified": true
}
```

```json Error (400)
{
  "error": {
    "code": "validation_error",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

```json Error (401)
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid or expired API key"
  }
}
```

```json Error (404)
{
  "error": {
    "code": "not_found",
    "message": "User with ID 'usr_abc123' not found"
  }
}
```
</ResponseExample>
```

### Paginated Response

```mdx
<ResponseExample>
```json Success (200)
{
  "data": [
    {
      "id": "usr_001",
      "name": "Alice Smith",
      "email": "alice@example.com"
    },
    {
      "id": "usr_002",
      "name": "Bob Jones",
      "email": "bob@example.com"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 45,
    "total_pages": 5
  },
  "links": {
    "first": "https://api.example.com/users?page=1",
    "last": "https://api.example.com/users?page=5",
    "next": "https://api.example.com/users?page=2",
    "prev": null
  }
}
```
</ResponseExample>
```

## API Playground

Interactive API playground modes.

### Interactive Mode (default)

Full interactive playground with request builder and live testing.

```json
{
  "api": {
    "playground": {
      "display": "interactive"
    }
  }
}
```

Features:
- Live API requests from browser
- Parameter input fields
- Authentication management
- Response preview
- Copy as code snippets

### Simple Mode

Simplified playground with basic request/response display.

```json
{
  "api": {
    "playground": {
      "display": "simple"
    }
  }
}
```

### Disabled Playground

Hide playground completely.

```json
{
  "api": {
    "playground": {
      "display": "none"
    }
  }
}
```

### Playground Proxy

Route API requests through proxy server (bypass CORS).

```json
{
  "api": {
    "playground": {
      "proxy": "https://cors-proxy.example.com"
    }
  }
}
```

## Code Example Languages

Configure supported languages for code examples.

```json
{
  "api": {
    "examples": {
      "languages": [
        "bash",
        "python",
        "javascript",
        "typescript",
        "go",
        "ruby",
        "php",
        "java",
        "swift",
        "csharp",
        "kotlin",
        "rust"
      ]
    }
  }
}
```

### Default Libraries

Set default library/method per language.

```json
{
  "api": {
    "examples": {
      "defaults": {
        "bash": "curl",
        "python": "requests",
        "javascript": "fetch",
        "go": "http"
      }
    }
  }
}
```

### Prefill Values

Pre-fill common values in code examples.

```json
{
  "api": {
    "examples": {
      "prefill": {
        "apiKey": "sk_test_abc123",
        "baseUrl": "https://api.example.com",
        "userId": "usr_example"
      }
    }
  }
}
```

Values replace placeholders in examples:
- `{apiKey}` → `sk_test_abc123`
- `{baseUrl}` → `https://api.example.com`
- `{userId}` → `usr_example`

### Auto-generate Examples

Automatically generate code examples from OpenAPI spec.

```json
{
  "api": {
    "examples": {
      "autogenerate": true
    }
  }
}
```

## SDK Integration

### Speakeasy SDK

Integrate Speakeasy-generated SDKs.

```mdx
---
title: "Create User"
openapi: "POST /users"
---

<CodeGroup>
```typescript TypeScript SDK
import { SDK } from '@company/sdk';

const sdk = new SDK({ apiKey: 'YOUR_API_KEY' });

const user = await sdk.users.create({
  email: 'user@example.com',
  name: 'John Doe'
});
```

```python Python SDK
from company_sdk import SDK

sdk = SDK(api_key='YOUR_API_KEY')

user = sdk.users.create(
    email='user@example.com',
    name='John Doe'
)
```
</CodeGroup>
```

### Stainless SDK

Integrate Stainless-generated SDKs.

```mdx
<CodeGroup>
```typescript TypeScript SDK
import { CompanyAPI } from 'company-api';

const client = new CompanyAPI({
  apiKey: process.env.COMPANY_API_KEY
});

const user = await client.users.create({
  email: 'user@example.com',
  name: 'John Doe'
});
```
</CodeGroup>
```

## Complete API Endpoint Example

Full example of documented API endpoint.

```mdx
---
title: "Create User"
description: "Create a new user account"
openapi: "POST /users"
---

Creates a new user with the provided information. Email must be unique.

## Request

<ParamField body="email" type="string" required>
  User's email address (must be unique)
</ParamField>

<ParamField body="name" type="string" required>
  Full name of the user
</ParamField>

<ParamField body="password" type="string" required>
  User's password (minimum 8 characters)
</ParamField>

<ParamField body="role" type="string" default="user" enum={["user", "admin", "moderator"]}>
  User's role in the system
</ParamField>

## Response

<ResponseField name="id" type="string" required>
  Unique identifier of the created user
</ResponseField>

<ResponseField name="email" type="string" required>
  User's email address
</ResponseField>

<ResponseField name="name" type="string" required>
  User's full name
</ResponseField>

<ResponseField name="role" type="string" required>
  User's assigned role
</ResponseField>

<ResponseField name="created_at" type="timestamp" required>
  ISO 8601 timestamp of creation
</ResponseField>

<RequestExample>
```bash cURL
curl -X POST https://api.example.com/users \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "SecurePass123",
    "role": "user"
  }'
```

```python Python
import requests

response = requests.post(
    "https://api.example.com/users",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "email": "john@example.com",
        "name": "John Doe",
        "password": "SecurePass123",
        "role": "user"
    }
)
```
</RequestExample>

<ResponseExample>
```json Success (201)
{
  "id": "usr_abc123",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "user",
  "created_at": "2024-01-15T10:30:00Z"
}
```

```json Error (400)
{
  "error": {
    "code": "validation_error",
    "message": "Email already exists",
    "field": "email"
  }
}
```
</ResponseExample>
```
