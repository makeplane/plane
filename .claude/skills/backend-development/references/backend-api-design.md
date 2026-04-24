# Backend API Design

Comprehensive guide to designing RESTful, GraphQL, and gRPC APIs with best practices (2025).

## REST API Design

### Resource-Based URLs

**Good:**
```
GET    /api/v1/users              # List users
GET    /api/v1/users/:id          # Get specific user
POST   /api/v1/users              # Create user
PUT    /api/v1/users/:id          # Update user (full)
PATCH  /api/v1/users/:id          # Update user (partial)
DELETE /api/v1/users/:id          # Delete user

GET    /api/v1/users/:id/posts    # Get user's posts
POST   /api/v1/users/:id/posts    # Create post for user
```

**Bad (Avoid):**
```
GET /api/v1/getUser?id=123        # RPC-style, not RESTful
POST /api/v1/createUser           # Verb in URL
GET /api/v1/user-posts            # Unclear relationship
```

### HTTP Status Codes (Meaningful Responses)

**Success:**
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST (resource created)
- `204 No Content` - Successful DELETE

**Client Errors:**
- `400 Bad Request` - Invalid input/validation error
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource conflict (duplicate email)
- `422 Unprocessable Entity` - Validation error (detailed)
- `429 Too Many Requests` - Rate limit exceeded

**Server Errors:**
- `500 Internal Server Error` - Generic server error
- `502 Bad Gateway` - Upstream service error
- `503 Service Unavailable` - Temporary downtime
- `504 Gateway Timeout` - Upstream service timeout

### Request/Response Format

**Request:**
```typescript
POST /api/v1/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "age": 30
}
```

**Success Response:**
```typescript
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/v1/users/123

{
  "id": "123",
  "email": "user@example.com",
  "name": "John Doe",
  "age": 30,
  "createdAt": "2025-01-09T12:00:00Z",
  "updatedAt": "2025-01-09T12:00:00Z"
}
```

**Error Response:**
```typescript
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      },
      {
        "field": "age",
        "message": "Age must be between 18 and 120",
        "value": 15
      }
    ],
    "timestamp": "2025-01-09T12:00:00Z",
    "path": "/api/v1/users"
  }
}
```

### Pagination

```typescript
// Request
GET /api/v1/users?page=2&limit=50

// Response
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 1234,
    "totalPages": 25,
    "hasNext": true,
    "hasPrev": true
  },
  "links": {
    "first": "/api/v1/users?page=1&limit=50",
    "prev": "/api/v1/users?page=1&limit=50",
    "next": "/api/v1/users?page=3&limit=50",
    "last": "/api/v1/users?page=25&limit=50"
  }
}
```

### Filtering and Sorting

```
GET /api/v1/users?status=active&role=admin&sort=-createdAt,name&limit=20

# Filters: status=active AND role=admin
# Sort: createdAt DESC, name ASC
# Limit: 20 results
```

### API Versioning Strategies

**URL Versioning (Most Common):**
```
/api/v1/users
/api/v2/users
```

**Header Versioning:**
```
GET /api/users
Accept: application/vnd.myapi.v2+json
```

**Query Parameter:**
```
/api/users?version=2
```

**Recommendation:** URL versioning for simplicity and discoverability

## GraphQL API Design

### Schema Definition

```graphql
type User {
  id: ID!
  email: String!
  name: String!
  posts: [Post!]!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  published: Boolean!
  createdAt: DateTime!
}

type Query {
  user(id: ID!): User
  users(limit: Int = 50, offset: Int = 0): [User!]!
  post(id: ID!): Post
  posts(authorId: ID, published: Boolean): [Post!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!

  createPost(input: CreatePostInput!): Post!
  publishPost(id: ID!): Post!
}

input CreateUserInput {
  email: String!
  name: String!
  password: String!
}

input UpdateUserInput {
  email: String
  name: String
}
```

### Queries

```graphql
# Flexible data fetching - client specifies exactly what they need
query {
  user(id: "123") {
    id
    name
    email
    posts {
      id
      title
      published
    }
  }
}

# With variables
query GetUser($userId: ID!) {
  user(id: $userId) {
    id
    name
    posts(published: true) {
      title
    }
  }
}
```

### Mutations

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
    name
    createdAt
  }
}

# Variables
{
  "input": {
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePass123!"
  }
}
```

### Resolvers (NestJS Example)

```typescript
@Resolver(() => User)
export class UserResolver {
  constructor(
    private userService: UserService,
    private postService: PostService,
  ) {}

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string) {
    return this.userService.findById(id);
  }

  @Query(() => [User])
  async users(
    @Args('limit', { defaultValue: 50 }) limit: number,
    @Args('offset', { defaultValue: 0 }) offset: number,
  ) {
    return this.userService.findAll({ limit, offset });
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput) {
    return this.userService.create(input);
  }

  // Field resolver - lazy load posts
  @ResolveField(() => [Post])
  async posts(@Parent() user: User) {
    return this.postService.findByAuthorId(user.id);
  }
}
```

### GraphQL Best Practices

1. **Avoid N+1 Problem** - Use DataLoader
```typescript
import DataLoader from 'dataloader';

const postLoader = new DataLoader(async (authorIds: string[]) => {
  const posts = await db.posts.findAll({ where: { authorId: authorIds } });
  return authorIds.map(id => posts.filter(p => p.authorId === id));
});

// In resolver
@ResolveField(() => [Post])
async posts(@Parent() user: User) {
  return this.postLoader.load(user.id);
}
```

2. **Pagination** - Relay-style cursor pagination
3. **Error Handling** - Return errors in response
4. **Depth Limiting** - Prevent deeply nested queries
5. **Query Complexity Analysis** - Limit expensive queries

## gRPC API Design

### Protocol Buffers Schema

```protobuf
syntax = "proto3";

package user;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
  rpc CreateUser (CreateUserRequest) returns (User);
  rpc UpdateUser (UpdateUserRequest) returns (User);
  rpc DeleteUser (DeleteUserRequest) returns (DeleteUserResponse);

  // Streaming
  rpc StreamUsers (StreamUsersRequest) returns (stream User);
}

message User {
  string id = 1;
  string email = 2;
  string name = 3;
  int64 created_at = 4;
}

message GetUserRequest {
  string id = 1;
}

message ListUsersRequest {
  int32 limit = 1;
  int32 offset = 2;
}

message ListUsersResponse {
  repeated User users = 1;
  int32 total = 2;
}

message CreateUserRequest {
  string email = 1;
  string name = 2;
  string password = 3;
}
```

### Implementation (Node.js)

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync('user.proto');
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Server implementation
const server = new grpc.Server();

server.addService(userProto.UserService.service, {
  async getUser(call, callback) {
    const user = await userService.findById(call.request.id);
    callback(null, user);
  },

  async createUser(call, callback) {
    const user = await userService.create(call.request);
    callback(null, user);
  },

  async streamUsers(call) {
    const users = await userService.findAll();
    for (const user of users) {
      call.write(user);
    }
    call.end();
  },
});

server.bindAsync(
  '0.0.0.0:50051',
  grpc.ServerCredentials.createInsecure(),
  () => server.start()
);
```

### gRPC Benefits

- **Performance:** 7-10x faster than REST (binary protocol)
- **Streaming:** Bi-directional streaming
- **Type Safety:** Strong typing via Protocol Buffers
- **Code Generation:** Auto-generate client/server code
- **Best For:** Internal microservices, high-performance systems

## API Design Decision Matrix

| Feature | REST | GraphQL | gRPC |
|---------|------|---------|------|
| **Use Case** | Public APIs, CRUD | Flexible data fetching | Microservices, performance |
| **Performance** | Moderate | Moderate | Fastest (7-10x REST) |
| **Caching** | HTTP caching built-in | Complex | No built-in caching |
| **Browser Support** | Native | Native | Requires gRPC-Web |
| **Learning Curve** | Easy | Moderate | Steep |
| **Streaming** | Limited (SSE) | Subscriptions | Bi-directional |
| **Tooling** | Excellent | Excellent | Good |
| **Documentation** | OpenAPI/Swagger | Schema introspection | Protobuf definition |

## API Security Checklist

- [ ] HTTPS/TLS only (no HTTP)
- [ ] Authentication (OAuth 2.1, JWT, API keys)
- [ ] Authorization (RBAC, check permissions)
- [ ] Rate limiting (prevent abuse)
- [ ] Input validation (all endpoints)
- [ ] CORS configured properly
- [ ] Security headers (CSP, HSTS, X-Frame-Options)
- [ ] API versioning implemented
- [ ] Error messages don't leak system info
- [ ] Audit logging (who did what, when)

## API Documentation

### OpenAPI/Swagger (REST)

```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
paths:
  /api/v1/users:
    get:
      summary: List users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        name:
          type: string
```

## Resources

- **REST Best Practices:** https://restfulapi.net/
- **GraphQL:** https://graphql.org/learn/
- **gRPC:** https://grpc.io/docs/
- **OpenAPI:** https://swagger.io/specification/
