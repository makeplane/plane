# Code Standards & Conventions

**Last Updated**: 2026-02-13
**Scope**: TypeScript, Python, configuration files across monorepo
**Enforced By**: ESLint, Prettier, pre-commit hooks

## TypeScript Standards

### General Principles
- **Strict Mode**: Enable `strict: true` in `tsconfig.json`
- **No `any`**: Use explicit types; suppress with `// @ts-ignore` only as last resort
- **Type Exports**: Always `export type` for interfaces/types to enable tree-shaking
- **Null Safety**: Enable `strictNullChecks` and handle null/undefined explicitly

### Type Definitions

**Pattern - Use interfaces for object shapes**:
```typescript
// Good
interface WorkspaceSettings {
  name: string;
  defaultCycleLength: number;
}

// Avoid
type WorkspaceSettings = {
  name: string;
  defaultCycleLength: number;
};
```

**Pattern - Export types from @plane/types**:
```typescript
// apps/web uses types from @plane/types
import type { IWorkspace, IProject, IIssue } from "@plane/types";
```

**Pattern - Avoid `any` in service layer**:
```typescript
// Good
const response = await api.get<IWorkspace>(`/workspaces/${id}/`);

// Avoid
const response = await api.get(`/workspaces/${id}/`);
```

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| React Components | PascalCase | `WorkspaceSettings.tsx` |
| Custom Hooks | kebab-case + prefix | `use-workspace-store.ts` |
| Utils/Services | kebab-case | `api-service.ts` |
| Constants | UPPER_SNAKE_CASE | `WORKSPACE_ROLES.ts` |
| Types/Interfaces | PascalCase + interface file | `workspace-types.ts` |
| Store files | kebab-case.store.ts | `workspace.store.ts` |

### Component Patterns

**Pattern - Functional components with explicit props type**:
```typescript
interface WorkspaceSelectorProps {
  value: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  value,
  onSelect,
  disabled = false,
}) => {
  // Implementation
};
```

**Pattern - Custom hooks return typed objects**:
```typescript
interface UseWorkspaceReturn {
  workspace: IWorkspace | null;
  loading: boolean;
  error: Error | null;
}

export const useWorkspace = (id: string): UseWorkspaceReturn => {
  // Implementation
};
```

**Pattern - Avoid prop spreading; be explicit**:
```typescript
// Good
<Button variant="primary" size="lg" onClick={handleClick} />

// Avoid
<Button {...buttonProps} />
```

### Imports

**Order imports in this sequence**:
```typescript
// 1. React & external libraries
import React, { useState } from "react";
import { observer } from "mobx-react";

// 2. Type imports (separate)
import type { IWorkspace } from "@plane/types";

// 3. Internal absolute imports
import { WorkspaceStore } from "@/core/store/workspace.store";
import { useWorkspace } from "@/core/hooks/use-workspace";

// 4. Local relative imports
import { WorkspaceHeader } from "./workspace-header";

// 5. Styles (last)
import styles from "./workspace.module.css";
```

**Use type imports to reduce bundle**:
```typescript
// Good
import type { IssueResponse } from "@plane/types";

// Avoid
import { IssueResponse } from "@plane/types";
```

### Error Handling

**Pattern - Always handle errors in async operations**:
```typescript
try {
  const data = await api.post("/issues/", payload);
  return data;
} catch (error) {
  if (error instanceof AxiosError) {
    console.error("API error:", error.message);
    throw new Error("Failed to create issue");
  }
  throw error;
}
```

**Pattern - Use custom error types**:
```typescript
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = "ValidationError";
  }
}
```

## React Patterns

### Hooks Rules
- Call hooks at top level (not in conditions)
- Use ESLint plugin `eslint-plugin-react-hooks` to enforce
- Custom hooks should start with `use` prefix

### State Management (MobX)

**Pattern - Store structure**:
```typescript
// core/store/workspace.store.ts
import { makeAutoObservable } from "mobx";

export class WorkspaceStore {
  workspaces: IWorkspace[] = [];
  isLoading = false;
  error: Error | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setWorkspaces(workspaces: IWorkspace[]) {
    this.workspaces = workspaces;
  }

  async fetchWorkspaces() {
    this.isLoading = true;
    try {
      const data = await workspaceService.getAll();
      this.setWorkspaces(data);
    } catch (error) {
      this.error = error as Error;
    } finally {
      this.isLoading = false;
    }
  }
}
```

**Pattern - Using stores in components**:
```typescript
import { observer } from "mobx-react";
import { useStore } from "@/core/hooks/use-store";

export const WorkspaceList = observer(() => {
  const { workspace: workspaceStore } = useStore();

  return (
    <div>
      {workspaceStore.isLoading && <LoadingSpinner />}
      {workspaceStore.workspaces.map(ws => (
        <WorkspaceItem key={ws.id} workspace={ws} />
      ))}
    </div>
  );
});
```

### Performance Optimization

**Pattern - Memoize expensive computations**:
```typescript
import { useMemo } from "react";

export const IssueList = ({ issues }: { issues: IIssue[] }) => {
  const groupedIssues = useMemo(
    () => groupBy(issues, issue => issue.status),
    [issues]
  );

  return <div>{/* render grouped issues */}</div>;
};
```

**Pattern - Use observer for MobX components**:
```typescript
// Automatically re-renders when observed values change
export const IssueDetail = observer(() => {
  const { issue: issueStore } = useStore();
  return <div>{issueStore.current?.title}</div>;
});
```

## Python Standards (Django Backend)

### File Structure

**Pattern - Django apps follow this structure**:
```
plane/app/
├── models/              # Database models
├── serializers/         # DRF serializers
├── views/               # ViewSets/Views
├── permissions/         # Permission classes
├── urls/                # URL routing
├── middleware/          # App middleware
└── tests/               # Test suite
```

### Models

**Pattern - Model organization**:
```python
# plane/db/models/workspace.py
from django.db import models
from django.contrib.auth.models import User

class Workspace(models.Model):
    id = models.UUIDField(primary_key=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workspace"
        verbose_name = "Workspace"
        ordering = ["-created_at"]
        permissions = [
            ("can_manage_workspace", "Can manage workspace"),
        ]

    def __str__(self) -> str:
        return self.name
```

### Serializers

**Pattern - DRF serializer with validation**:
```python
from rest_framework import serializers
from plane.db.models import Workspace

class WorkspaceSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)

    class Meta:
        model = Workspace
        fields = ["id", "name", "slug", "owner", "owner_name", "created_at"]
        read_only_fields = ["id", "created_at", "owner"]

    def validate_name(self, value: str) -> str:
        if len(value) < 3:
            raise serializers.ValidationError("Name must be at least 3 characters")
        return value
```

### ViewSets

**Pattern - DRF ViewSet with permissions**:
```python
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from plane.app.permissions import IsWorkspaceMember

class WorkspaceViewSet(ModelViewSet):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]
    lookup_field = "slug"

    @action(detail=True, methods=["get"])
    def members(self, request, slug=None):
        """List workspace members"""
        workspace = self.get_object()
        members = workspace.members.all()
        serializer = MemberSerializer(members, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
```

### Celery Tasks

**Pattern - Task organization**:
```python
# plane/bgtasks/issue_task.py
from celery import shared_task
from plane.db.models import Issue

@shared_task
def update_issue_activity(issue_id: str, activity_type: str):
    """Background task to log issue activity"""
    try:
        issue = Issue.objects.get(id=issue_id)
        # Process activity
        return {"status": "success", "issue_id": issue_id}
    except Issue.DoesNotExist:
        return {"status": "error", "message": "Issue not found"}
```

## ESLint Configuration

**Location**: `/eslint.config.mjs` (root-level, ESLint v9 flat config)

### Key Rules Enforced

| Rule | Level | Purpose |
|------|-------|---------|
| `@typescript-eslint/no-explicit-any` | warn | Prevent `any` types |
| `@typescript-eslint/no-floating-promises` | warn | Catch unhandled promises |
| `react-hooks/rules-of-hooks` | error | Enforce hooks rules |
| `react/display-name` | warn | Identify components |
| `import/prefer-type-imports` | warn | Use type imports |
| `@typescript-eslint/no-unused-vars` | warn | Remove unused imports |

### Running ESLint

```bash
# Check for lint errors
pnpm check:lint

# Auto-fix issues
pnpm fix:lint

# Pre-commit hook (via Husky)
# Runs automatically before git commit
```

### Suppressing Warnings

Only suppress with documentation of why:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = JSON.parse(response);
```

## Prettier Configuration

**Location**: `.prettierrc.json` (root-level)

**Key Settings**:
- Print width: 100 characters
- Tab width: 2 spaces
- Semicolons: required
- Trailing commas: all (ES5+)
- Quotes: double

### Running Prettier

```bash
# Format files
pnpm format

# Check formatting without changes
pnpm check:format
```

## File Size Guidelines

**Target Limits**:
- **TypeScript files**: <200 lines
- **React components**: <150 lines
- **Custom hooks**: <100 lines
- **Services**: <200 lines
- **Django views**: <150 lines per view class

**When to Split**:
- Component has multiple sub-components → extract to separate files
- Service has 3+ distinct domains → split into domain services
- Hook logic >100 lines → extract helper functions to utils

## Naming Conventions

### Variables & Functions

```typescript
// Good: camelCase, descriptive
const isWorkspaceActive = true;
const getIssuesByStatus = (issues: IIssue[]) => {};

// Avoid: single letters (except loops), unclear abbreviations
const iwa = true;  // unclear
const gis = (issues: IIssue[]) => {};  // unclear
```

### Constants

```typescript
// Good: UPPER_SNAKE_CASE
export const DEFAULT_PAGE_SIZE = 20;
export const API_BASE_URL = "https://api.plane.so";

// Avoid: lowercase or mixed case for constants
export const defaultPageSize = 20;
```

### Database Fields

```python
# Good: snake_case
class Workspace(models.Model):
    created_at = models.DateTimeField()
    is_active = models.BooleanField()
    max_members = models.IntegerField()

# Avoid: camelCase
class Workspace(models.Model):
    createdAt = models.DateTimeField()  # Wrong
```

## Testing Standards

### Frontend (Vitest)

**Pattern - Component test**:
```typescript
import { render, screen } from "@testing-library/react";
import { WorkspaceSelector } from "./workspace-selector";

describe("WorkspaceSelector", () => {
  it("renders workspace list", () => {
    const workspaces = [{ id: "1", name: "Acme" }];
    render(<WorkspaceSelector workspaces={workspaces} />);
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });
});
```

### Backend (Django TestCase)

```python
from django.test import TestCase
from plane.db.models import Workspace

class WorkspaceTestCase(TestCase):
    def setUp(self):
        self.workspace = Workspace.objects.create(
            name="Test Workspace",
            slug="test-workspace"
        )

    def test_workspace_creation(self):
        self.assertIsNotNone(self.workspace.id)
        self.assertEqual(self.workspace.name, "Test Workspace")
```

## Git & Commit Standards

### Commit Message Format

Follow conventional commits:
```
type(scope): subject

body (optional)

footer (optional)
```

**Types**: feat, fix, docs, style, refactor, test, chore, ci

**Examples**:
```
feat(workspace): add workspace archive functionality
fix(issue): resolve duplicate comment notification bug
docs(setup): update Docker Compose deployment guide
chore(deps): upgrade React to v18.3
```

### Pre-commit Hooks

**Enabled via Husky**:
1. Prettier auto-formats staged files
2. ESLint checks with `--max-warnings=0`
3. Type checking (if enabled)

**Bypass** (use sparingly):
```bash
git commit --no-verify
```

## Documentation Standards

### Inline Comments

**Use when WHY is non-obvious**:
```typescript
// Good: explains business logic
// We need to delay the sync to prevent race conditions
// when multiple issues are updated in quick succession
await delay(500);

// Avoid: restates obvious code
const workspace = getWorkspace(id);  // Get workspace by id
```

### Function/Method Documentation

**Pattern - JSDoc for public APIs**:
```typescript
/**
 * Fetches issues for a workspace with optional filtering
 * @param workspaceId - The workspace ID to fetch issues for
 * @param filters - Optional filters (status, assignee, etc.)
 * @returns Promise resolving to array of issues
 * @throws {Error} If workspace not found or API fails
 */
export const getWorkspaceIssues = (
  workspaceId: string,
  filters?: IssueFilters
): Promise<IIssue[]> => {
  // Implementation
};
```

## Security Standards

### Input Validation

**Pattern - Validate all user input**:
```typescript
import { z } from "zod";

const IssueSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  assignee_ids: z.array(z.string().uuid()).default([]),
});

const payload = IssueSchema.parse(request.body);
```

### Secrets Management

**Never commit secrets**:
```bash
# Good: Use environment variables
DB_PASSWORD=${DATABASE_PASSWORD}

# Avoid: Hardcoding in code
DB_PASSWORD="super-secret-123"
```

## Performance Standards

### Bundle Size

**Target**: <500KB for main app (gzipped)

**Measure**: `pnpm build` output

**Optimization**:
- Code splitting via React.lazy()
- Tree-shaking via ES modules
- Avoid large dependencies without justification

### Database Query Optimization

**Pattern - Use select_related for foreign keys**:
```python
# Good: Fetches in single query
issues = Issue.objects.select_related("assignee").all()

# Avoid: N+1 queries
issues = Issue.objects.all()
for issue in issues:
    print(issue.assignee.name)  # Query for each issue
```

---

**Document Location**: `/Volumes/Data/SHBVN/plane.so/docs/code-standards.md`
**Lines**: ~520
**Status**: Final
**Related**: `/docs/eslint.md` (existing ESLint documentation)
