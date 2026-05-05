# Plane Instance Admin API Endpoints — Exact Request/Response Formats

**Explored:** 2026-03-03 | **Thoroughness:** Medium

---

## Authentication: Instance Admin Sign-In

### Endpoint Details

- **URL:** `POST http://your-instance.com/auth/admin/sign-in/` (form-based)
- **Authentication:** None (AllowAny)
- **Returns:** Session cookie + HTML redirect
- **Content-Type:** `application/x-www-form-urlencoded`

### Request Format (Form POST)

```
POST /auth/admin/sign-in/ HTTP/1.1
Content-Type: application/x-www-form-urlencoded

email=admin@example.com&password=SecurePassword123
```

### Required Fields

- `email` (string, required) — Admin user email
- `password` (string, required) — Admin password

### Response: Success

- **Status:** 302 (Redirect to `/general/`)
- **Set-Cookie header:** Session cookie (e.g., `sessionid=xxx`)
- **Body:** Empty (standard HTML redirect)

### Response: Error (redirects with error params)

- **Status:** 302 redirect to `/?error_code=XXX&error_message=YYY`
- **Possible error codes:**
  - `INSTANCE_NOT_CONFIGURED` — Instance not initialized
  - `ADMIN_USER_DOES_NOT_EXIST` — Email not found
  - `ADMIN_USER_DEACTIVATED` — User inactive
  - `ADMIN_AUTHENTICATION_FAILED` — Wrong password or not an admin

**Note:** Admin sign-in is a form-based Django view that uses session cookies. Subsequent API calls use the session cookie for authentication via `BaseSessionAuthentication`.

---

## Verify Admin Session (Check Authentication)

### Endpoint

- **URL:** `GET /api/instances/admins/session/`
- **Authentication:** Session cookie
- **Returns:** JSON user info or unauthenticated status

### Request

```
GET /api/instances/admins/session/ HTTP/1.1
Cookie: sessionid=your_session_cookie
```

### Response: Authenticated

```json
{
  "is_authenticated": true,
  "user": {
    "id": "uuid-string",
    "email": "admin@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "display_name": "John Doe",
    "avatar": "avatar_url or null",
    "is_bot": false
  }
}
```

### Response: Not Authenticated

```json
{
  "is_authenticated": false
}
```

---

## Create Workspace (Admin Context)

### Endpoint

- **URL:** `POST /api/instances/workspaces/`
- **Authentication:** `InstanceAdminPermission` (requires admin session cookie)
- **Returns:** JSON workspace object (201 Created)
- **Content-Type:** `application/json`

### Request Format

```json
POST /api/instances/workspaces/ HTTP/1.1
Cookie: sessionid=your_session_cookie
Content-Type: application/json

{
  "name": "Engineering Team",
  "slug": "engineering-team",
  "company_role": "Team Lead"
}
```

### Required Fields

- `name` (string, max 80 chars) — Workspace display name
- `slug` (string, max 48 chars, alphanumeric + hyphens/underscores) — URL slug, must be unique

### Optional Fields

- `company_role` (string) — Role/company affiliation info

### Validation Rules

- Slug must be unique (checked case-insensitively)
- Slug cannot be in `RESTRICTED_WORKSPACE_SLUGS` list
- Both `name` and `slug` are required
- Name max 80 chars, slug max 48 chars

### Response: Success (201)

```json
{
  "id": "workspace-uuid",
  "name": "Engineering Team",
  "slug": "engineering-team",
  "owner": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "first_name": "John",
    "display_name": "John Doe"
  },
  "logo_url": null,
  "description": "",
  "description_html": "",
  "currency": "USD",
  "updated_at": "2026-03-03T16:27:00.000Z",
  "created_at": "2026-03-03T16:27:00.000Z",
  "total_projects": 0,
  "total_members": 1
}
```

### Response: Error Examples

**Missing required fields (400)**

```json
{
  "error": "Both name and slug are required"
}
```

**Slug already exists (409)**

```json
{
  "slug": "The workspace with the slug already exists"
}
```

**Name/slug too long (400)**

```json
{
  "error": "The maximum length for name is 80 and for slug is 48"
}
```

---

## Create Project in Workspace

### Endpoint

- **URL:** `POST /api/workspaces/{slug}/projects/`
- **Authentication:** Session cookie (regular user, not admin-specific)
- **Permission:** `ROLE.ADMIN` or `ROLE.MEMBER` at workspace level
- **Returns:** JSON project object (201 Created)

### Request Format

```json
POST /api/workspaces/engineering-team/projects/ HTTP/1.1
Cookie: sessionid=your_session_cookie
Content-Type: application/json

{
  "name": "Product Features",
  "identifier": "PRF",
  "description": "Main product feature tracking",
  "description_html": "<p>Main product feature tracking</p>",
  "category": "PRODUCT",
  "project_lead": null,
  "network": 2,
  "cover_image": null,
  "icon_props": {}
}
```

### Required Fields

- `name` (string) — Project display name
- `identifier` (string, 1-5 chars, alphanumeric) — Project identifier for issues

### Optional Fields (create defaults if omitted)

- `description` (string)
- `description_html` (string, HTML-sanitized)
- `category` (string) — e.g., `PRODUCT`, `ENGINEERING`
- `project_lead` (UUID or null) — User ID of project lead
- `network` (integer) — 0=secret, 1=invited, 2=public
- `cover_image` (string/null)
- `icon_props` (object) — Icon customization

### Validation

- Project identifier must be unique within workspace
- Project name must be unique within workspace
- Cannot contain special chars (regex pattern validation)
- Description HTML is sanitized for security

### Response: Success (201)

```json
{
  "id": "project-uuid",
  "name": "Product Features",
  "identifier": "PRF",
  "slug": "product-features",
  "description": "Main product feature tracking",
  "description_html": "<p>Main product feature tracking</p>",
  "category": "PRODUCT",
  "network": 2,
  "workspace": "workspace-uuid",
  "workspace_detail": {
    "id": "workspace-uuid",
    "name": "Engineering Team",
    "slug": "engineering-team"
  },
  "project_lead": null,
  "created_at": "2026-03-03T16:27:00.000Z",
  "updated_at": "2026-03-03T16:27:00.000Z",
  "created_by": "user-uuid"
}
```

**Auto-created on project creation:**

- Default project states (Backlog, Todo, In Progress, In Review, Done, Cancelled)
- ProjectMember entry for requesting user (role = ADMIN = 20)
- ProjectIdentifier entry linking identifier to project

### Response: Error Examples

**Invalid identifier (400)**

```json
{
  "identifier": ["PROJECT_IDENTIFIER_CANNOT_CONTAIN_SPECIAL_CHARACTERS"]
}
```

**Identifier already exists (400)**

```json
{
  "identifier": ["PROJECT_IDENTIFIER_ALREADY_EXIST"]
}
```

---

## Add Members to Workspace

### Endpoint: List/Get Members

- **URL:** `GET /api/workspaces/{slug}/members/`
- **Authentication:** Session cookie
- **Permission:** All authenticated workspace members can list

### Endpoint: Add/Update Member Role

- **URL:** `PATCH /api/workspaces/{slug}/members/{member_id}/`
- **Authentication:** Session cookie
- **Permission:** Workspace ADMIN role required
- **Returns:** JSON member object

### Request: Update Member Role

```json
PATCH /api/workspaces/engineering-team/members/member-uuid/ HTTP/1.1
Cookie: sessionid=your_session_cookie
Content-Type: application/json

{
  "role": 20
}
```

### Role Values

- `20` — Admin
- `15` — Member
- `10` — Guest
- `5` — Lowest (restricted guest)

### Response: Success (200)

```json
{
  "id": "workspace-member-uuid",
  "role": 20,
  "member": {
    "id": "user-uuid",
    "email": "member@example.com",
    "first_name": "Jane",
    "display_name": "Jane Smith"
  },
  "is_active": true,
  "created_at": "2026-03-03T16:27:00.000Z"
}
```

### Response: Error

**Cannot update own role (400)**

```json
{
  "error": "You cannot update your own role"
}
```

**Insufficient permissions (400)**

```json
{
  "error": "You cannot remove a user having role higher than you"
}
```

---

## List All Workspaces (Admin View)

### Endpoint

- **URL:** `GET /api/instances/workspaces/`
- **Authentication:** `InstanceAdminPermission` (requires admin session)
- **Returns:** Paginated workspace list

### Request

```
GET /api/instances/workspaces/?search=engineering&page=1 HTTP/1.1
Cookie: sessionid=your_session_cookie
```

### Query Parameters

- `search` (optional) — Filter by workspace name (case-insensitive contains)
- `page` (optional, default 1) — Pagination
- `per_page` (optional, default 10, max 10)

### Response

```json
{
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "workspace-uuid",
      "name": "Engineering Team",
      "slug": "engineering-team",
      "owner": {...},
      "total_projects": 3,
      "total_members": 8
    }
  ]
}
```

---

## Check Workspace Slug Availability

### Endpoint

- **URL:** `GET /api/instances/workspace-slug-check/?slug=my-workspace`
- **Authentication:** `InstanceAdminPermission` (requires admin session)
- **Returns:** JSON boolean

### Request

```
GET /api/instances/workspace-slug-check/?slug=engineering-team HTTP/1.1
Cookie: sessionid=your_session_cookie
```

### Response: Available (200)

```json
{
  "status": true
}
```

### Response: Not Available (200)

```json
{
  "status": false
}
```

---

## Key Technical Notes

### Authentication Method

- **Type:** Django session-based (CSRF disabled for API endpoints)
- **Session Cookie:** `sessionid=<value>`
- **Set on:** Form POST to `/auth/admin/sign-in/` (redirects and sets cookie)
- **Used for:** All subsequent API calls

### Base Paths

- **Admin APIs:** `/api/instances/...` (requires `InstanceAdminPermission`)
- **Regular User APIs:** `/api/...` (workspace-aware, require user context)
- **Authentication:** `/auth/...` (form-based views)

### Important Permissions

- **InstanceAdminPermission:** Requires `InstanceAdmin` record with `role >= 15` for user
- **WorkSpaceBasePermission:** Regular user endpoints check workspace membership
- **ProjectMemberPermission:** Project-level access control

### Response Headers (Important for Scripting)

- `Set-Cookie: sessionid=...` — on successful admin sign-in
- `Location: /general/` — on successful sign-in (302 redirect)

### Automatically Created Resources

**When workspace created:**

- WorkspaceMember entry (role = 20 = Admin) for requesting user

**When project created:**

- ProjectMember entry (role = 20 = Admin) for requesting user
- 6 default issue states (Backlog, Todo, In Progress, In Review, Done, Cancelled)
- ProjectIdentifier mapping

---

## Usage Example (Bash/cURL)

```bash
# 1. Admin Sign-In (get session cookie)
curl -i -c cookies.txt -X POST \
  http://localhost:8000/auth/admin/sign-in/ \
  -d "email=admin@example.com&password=SecurePassword123"

# 2. Verify Session
curl -b cookies.txt \
  http://localhost:8000/api/instances/admins/session/

# 3. Create Workspace
curl -b cookies.txt -X POST \
  http://localhost:8000/api/instances/workspaces/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Engineering Team","slug":"engineering-team"}'

# 4. Create Project in Workspace
curl -b cookies.txt -X POST \
  http://localhost:8000/api/workspaces/engineering-team/projects/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Product Features","identifier":"PRF"}'
```

---

## Unresolved Questions

- Is token-based authentication (JWT/API key) supported for admin endpoints? (Not found in reviewed code)
- What are the exact field requirements for `icon_props` on project creation?
- Does instance setup require any special endpoints before admin creation?
