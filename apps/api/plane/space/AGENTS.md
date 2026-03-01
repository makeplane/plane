# Space Module

Public-facing API for shared workspaces.

## Purpose

Provides public API endpoints for viewing shared/public workspace content without full authentication.

## Features

### Public Issue Viewing

- Browse issues in public projects
- View issue details without login
- Limited to public project scope

### Public Intake Forms

- Submit feature requests
- Public intake submissions
- Form validation

### Public Cycles/Modules

- View cycle progress
- Browse module contents
- Read-only access

### Public Assets

- Access public attachments
- Image/file viewing

## Security

- Rate limiting via `rate_limit.py`
- Scoped to public projects only
- No modification capabilities
- Anonymous access support

## URL Structure

```
/spaces/<workspace_slug>/projects/<project_id>/issues/
/spaces/<workspace_slug>/projects/<project_id>/cycles/
/spaces/<workspace_slug>/projects/<project_id>/modules/
/spaces/<workspace_slug>/projects/<project_id>/intake/
```

## Serializers

Public-safe serializers that exclude sensitive data:

- User information limited
- Internal IDs may be hidden
- Workspace details restricted
