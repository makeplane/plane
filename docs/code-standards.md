# Code Standards & Conventions

## Core Principles

**YAGNI** — You Aren't Gonna Need It (don't build for future you don't have)
**KISS** — Keep It Simple, Stupid (avoid premature complexity)
**DRY** — Don't Repeat Yourself (extract reusable abstractions)

## File & Naming Conventions

### Naming Rules

| File Type | Convention | Example |
|-----------|-----------|---------|
| **JS/TS files** | kebab-case | `workflow-store.ts`, `use-workflow.ts` |
| **React components** | PascalCase (directory) | `KanbanGroup/KanbanGroup.tsx` |
| **Directories** | kebab-case | `issue-layouts/`, `workflow-services/` |
| **Classes** | PascalCase | `WorkflowRootStore`, `IssueService` |
| **Functions** | camelCase | `handleWorkFlowState()`, `getIssueDetails()` |
| **Constants** | UPPER_SNAKE_CASE | `WORKFLOW_TRANSITION_BLOCKED`, `MAX_FILE_SIZE` |
| **Interfaces/Types** | I prefix + PascalCase | `IWorkspace`, `IIssue`, `IPageBlock` |
| **Boolean variables** | is/has/should prefix | `isLoading`, `hasAccess`, `shouldValidate` |

### File Size Limits

- **Code files:** <200 lines per file (split larger modules)
- **React components:** <150 lines per component
- **Markdown docs:** <800 lines per file (split by topic)
- **Configuration:** No limit (but prefer YAML > JSON)

**Modularization Triggers:**
- Component exceeds 150 LOC → split by logical sections
- Service exceeds 200 LOC → separate into domain-specific services
- Store exceeds 300 LOC → extract into sub-stores (composition)
- Utility file exceeds 100 LOC → group related functions into separate files

### Directory Structure Rules

**App routing:** All routes in `apps/web/app/` (Next.js app router)
**Shared components:** `apps/web/core/components/` (never modify from ce/)
**CE components:** `apps/web/ce/components/` (extensions only)
**Core stores:** `apps/web/core/store/` (never modify)
**CE stores:** `apps/web/ce/store/` (extends CoreRootStore)
**Hooks:** `apps/web/core/hooks/store/` (for store access)
**Services:** `apps/web/core/services/` (API clients)
**Types:** `packages/types/src/` (centralized type definitions)

## Backend Standards (Django/DRF)

### Model Conventions

**Base Models:**
```python
from plane.db.models import BaseModel, ProjectBaseModel

# Use ProjectBaseModel for issue-related models
class Issue(ProjectBaseModel):
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="issues")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey("db.User", on_delete=models.SET_NULL, null=True)
    updated_by = models.ForeignKey("db.User", on_delete=models.SET_NULL, null=True, related_name="+")
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project_id", "-created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["project_id", "key"],
                condition=Q(deleted_at__isnull=True),
                name="unique_issue_key"
            )
        ]
    
    objects = SoftDeletionManager()
```

**Key Patterns:**
- Inherit `ProjectBaseModel` for project-scoped models
- Include `created_by` and `updated_by` for audit trails
- Use `SoftDeletionManager` for soft deletes
- Add `UniqueConstraint` with soft-delete condition
- Index frequently queried fields
- Order by most recent first (default)

### View Conventions

**DRF Viewset Pattern:**
```python
from plane.utils.decorators import allow_permission
from rest_framework.viewsets import ReadOnlyModelViewSet

class IssueViewSet(ReadOnlyModelViewSet):
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # CRITICAL: Always scope to workspace + project
        return Issue.objects.filter(
            project__workspace__slug=self.kwargs["workspace_slug"],
            project__slug=self.kwargs["project_slug"]
        ).select_related("created_by", "updated_by")
    
    @allow_permission("workspace.member")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @allow_permission("project.member")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
```

**Key Patterns:**
- All queries scoped by `project__workspace__slug` (never just `project_id`)
- Use `select_related()` for FK relationships
- Use `prefetch_related()` for M2M/reverse relationships
- `@allow_permission(role)` decorator for RBAC
- Separate v0/v1 serializers (never shared)

### Serializer Conventions

**Pattern:**
```python
# apps/api/plane/app/serializers/v0/issue.py
class IssueSerializer(serializers.ModelSerializer):
    created_by_detail = UserLiteSerializer(source="created_by", read_only=True)
    
    class Meta:
        model = Issue
        fields = ["id", "title", "description", "created_by", "created_by_detail"]
        read_only_fields = ["created_at", "updated_at"]
    
    def create(self, validated_data):
        # Add current user
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
```

**Key Patterns:**
- Separate nested read serializers (never use depth=)
- Override `create()`/`update()` for custom logic
- Mark read-only fields explicitly
- Use `source=` for field remapping
- Validate at serializer level, not in views

### Celery Task Conventions

**Pattern:**
```python
# apps/api/plane/tasks/issues.py
from celery import shared_task
from django.core.mail import send_mail

@shared_task
def send_issue_notification(issue_id, user_id):
    """Send email notification for issue update."""
    try:
        issue = Issue.objects.get(id=issue_id)
        user = User.objects.get(id=user_id)
        
        send_mail(
            subject=f"Issue {issue.key} updated",
            message=f"Title: {issue.title}",
            from_email="noreply@plane.so",
            recipient_list=[user.email],
            fail_silently=False,
        )
        return {"status": "sent"}
    except Exception as e:
        # Log error, retry
        return {"status": "failed", "error": str(e)}
```

**Key Patterns:**
- Use `@shared_task` for routing flexibility
- Always wrap in try-except
- Return dict with status + optional data
- Log before retrying (Celery retries on exception)
- No I/O operations in request handlers (offload to tasks)

## Frontend Standards (React/TypeScript)

### Component Conventions

**Functional Component Pattern:**
```typescript
// KanbanGroup.tsx
import React, { useState, useCallback } from "react"
import { observer } from "mobx-react"
import { IIssue } from "@plane/types"

interface IKanbanGroupProps {
  groupId: string
  issues: IIssue[]
  onDragEnter?: (sourceId: string, destId: string) => void
}

export const KanbanGroup = observer(
  React.forwardRef<HTMLDivElement, IKanbanGroupProps>(
    ({ groupId, issues, onDragEnter }, ref) => {
      const [isExpanded, setIsExpanded] = useState(true)

      const handleDragEnter = useCallback(
        (e: React.DragEvent) => {
          onDragEnter?.(sourceId, groupId)
        },
        [groupId, onDragEnter]
      )

      return (
        <div ref={ref} onDragEnter={handleDragEnter}>
          {isExpanded && issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )
    }
  )
)

KanbanGroup.displayName = "KanbanGroup"
```

**Key Patterns:**
- Wrap components observing MobX stores with `observer()`
- Use `React.forwardRef` for dom access
- Type all props with interfaces
- Use `useCallback` for event handlers
- Set `displayName` for debugging
- Extract constants to file top
- Keep components <150 LOC

### MobX Store Conventions

**Store Pattern:**
```typescript
// workflow.store.ts
import { makeObservable, observable, action, flow, runInAction } from "mobx"

export class WorkflowRootStore {
  root: RootStore
  workflows: Map<string, Workflow> = new Map()
  isLoading = false
  error: string | null = null

  constructor(root: RootStore) {
    this.root = root
    makeObservable(this, {
      workflows: observable,
      isLoading: observable,
      error: observable,
      fetchWorkflows: flow, // async
      setWorkflows: action,
      updateWorkflow: action.bound,
      deleteWorkflow: action,
    })
  }

  // Async: use flow
  *fetchWorkflows(projectId: string) {
    this.isLoading = true
    try {
      const response = yield this.root.workflowService.list(projectId)
      runInAction(() => {
        response.forEach((w) => this.workflows.set(w.id, w))
        this.isLoading = false
      })
    } catch (error) {
      runInAction(() => {
        this.error = error.message
        this.isLoading = false
      })
    }
  }

  // Sync: use action
  setWorkflows(workflows: Workflow[]) {
    this.workflows.clear()
    workflows.forEach((w) => this.workflows.set(w.id, w))
  }

  // Bound action for callbacks
  updateWorkflow = action((id: string, data: Partial<Workflow>) => {
    const workflow = this.workflows.get(id)
    if (workflow) Object.assign(workflow, data)
  })
}
```

**Key Patterns:**
- All mutations must be `action` or `flow`
- Async mutations use `flow` + `runInAction`
- Use `makeObservable` with explicit action map (never `makeAutoObservable`)
- Bound actions for event handlers (arrow functions)
- Error state + loading state always
- Use `Map<id, obj>` for keyed collections (not arrays)

### Hook Conventions

**Custom Hook Pattern:**
```typescript
// use-workflow.ts
import { useContext } from "react"
import { StoreContext } from "@/plane-web/context/store-context"

export function useWorkflow() {
  const { workflowStore } = useContext(StoreContext)
  if (!workflowStore) {
    throw new Error("useWorkflow must be used within StoreProvider")
  }
  return workflowStore
}

// use-issue-form.ts
import { useCallback } from "react"
import { useProject } from "@/hooks/store"
import { IIssue } from "@plane/types"

export function useIssueForm(projectId: string) {
  const { projectStore } = useProject()
  
  const createIssue = useCallback(
    async (data: Partial<IIssue>) => {
      try {
        const issue = await projectStore.createIssue(projectId, data)
        return issue
      } catch (error) {
        throw new Error(`Failed to create issue: ${error.message}`)
      }
    },
    [projectId, projectStore]
  )

  return { createIssue }
}
```

**Key Patterns:**
- Return objects with related functions
- Always validate context availability
- Use `useCallback` for stability
- Document dependencies in `useEffect` deps
- Throw errors clearly
- Type return values explicitly

### Type Conventions

**Type Definitions:**
```typescript
// packages/types/src/issue.ts
export interface IIssue {
  id: string
  project_id: string
  key: string
  title: string
  description: string
  state_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface IIssueUpdate extends Partial<IIssue> {
  id: string // Required for updates
}

export type IssueFilter = "all" | "assigned" | "created" | "subscribed"
```

**Key Patterns:**
- One type per file in `packages/types/src/`
- Export all from `packages/types/src/index.ts`
- Use `I*` prefix for all types
- Discriminated unions for variants
- Utility types (Partial, Pick) sparingly
- Comment non-obvious fields

## API Standards (Both v0 & v1)

### Request/Response Patterns

**Success Response (200, 201):**
```json
{
  "id": "uuid",
  "title": "string",
  "created_at": "ISO-8601"
}
```

**Error Response (4xx, 5xx):**
```json
{
  "detail": "Workspace not found",
  "code": "WORKSPACE_NOT_FOUND",
  "status": 404
}
```

**Pagination:**
```json
{
  "count": 100,
  "next": "/api/v1/issues?offset=50&limit=50",
  "previous": "/api/v1/issues?offset=0&limit=50",
  "results": [{ "id": "...", ... }]
}
```

### Endpoint Naming

| Method | Pattern | Example |
|--------|---------|---------|
| **GET** | `/resource/` | `/api/v1/issues/` |
| **GET** | `/resource/{id}/` | `/api/v1/issues/{id}/` |
| **POST** | `/resource/` | `/api/v1/issues/` |
| **PATCH** | `/resource/{id}/` | `/api/v1/issues/{id}/` |
| **DELETE** | `/resource/{id}/` | `/api/v1/issues/{id}/` |
| **Action** | `/resource/{id}/{action}/` | `/api/v1/issues/{id}/duplicate/` |

## Testing Standards

### Backend Tests

**Pattern:**
```python
# tests/test_issue_views.py
from django.test import TestCase
from rest_framework.test import APIClient

class IssueViewsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create(email="test@test.com")
        self.workspace = Workspace.objects.create(name="Test", slug="test")
        self.project = Project.objects.create(workspace=self.workspace, name="Proj")

    def test_list_issues_success(self):
        Issue.objects.create(project=self.project, title="Test", created_by=self.user)
        
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/v0/issues/")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_list_issues_permission_denied(self):
        other_user = User.objects.create(email="other@test.com")
        
        self.client.force_authenticate(other_user)
        response = self.client.get(f"/api/v0/issues/")
        
        self.assertEqual(response.status_code, 403)
```

**Key Patterns:**
- One test per behavior
- Clear assertions
- Use `setUp()` for common data
- Test success + error paths
- Mock external services (S3, email)
- No fixture files (use factories)

### Frontend Tests

**Pattern:**
```typescript
// components/KanbanGroup.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { observer } from "mobx-react"
import { KanbanGroup } from "./KanbanGroup"

describe("KanbanGroup", () => {
  it("renders issues in group", () => {
    const issues = [
      { id: "1", title: "Task 1", state_id: "todo" }
    ]
    
    render(<KanbanGroup groupId="todo" issues={issues} />)
    
    expect(screen.getByText("Task 1")).toBeInTheDocument()
  })

  it("calls onDragEnter on drag", () => {
    const onDragEnter = jest.fn()
    const issues = []
    
    render(
      <KanbanGroup 
        groupId="todo" 
        issues={issues} 
        onDragEnter={onDragEnter} 
      />
    )
    
    fireEvent.dragEnter(screen.getByRole("group"))
    expect(onDragEnter).toHaveBeenCalledWith(expect.any(String), "todo")
  })
})
```

**Key Patterns:**
- Test user interactions, not implementation
- Mock stores/services as needed
- Use `screen` for element queries
- One behavior per test
- Clear test names

## Code Review Checklist

**Before Committing:**
- [ ] No syntax errors (compile passes)
- [ ] Tests pass (no skipped tests)
- [ ] No linting errors (`pnpm check:lint`)
- [ ] <200 LOC per file (split if needed)
- [ ] Types defined for all parameters
- [ ] Error handling in place
- [ ] No console.log() or debugger
- [ ] Comments for non-obvious logic
- [ ] Follows naming conventions

**Before Creating PR:**
- [ ] Branch name: `{user}/{feat|fix|docs}/{desc}`
- [ ] Commit messages: conventional format (`feat:`, `fix:`, `docs:`, etc.)
- [ ] Changelog entry if feature/fix
- [ ] Docs updated if behavior changed
- [ ] No secrets in code (env vars via `.env.example`)
- [ ] No force-push (create new commits)

## Linting & Formatting

**Run before commit:**
```bash
# Lint check
pnpm check:lint

# Format code
pnpm check:format

# Type check
pnpm check:types
```

**ESLint Rules:**
- No unused variables
- No implicit any
- No floating promises
- Consistent naming
- Custom @plane/plane rules (eslint-plugin-plane)

---

**Last Updated:** 2026-04-02
**Version:** 1.0
