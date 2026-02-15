# Phase 6: Dashboard List & CRUD UI

## Context Links

- **Parent Plan**: [plan.md](./plan.md)
- **Previous Phase**: [Phase 5: Navigation & Routing](./phase-05-navigation-routing.md)
- **Research Reports**:
  - [Frontend Patterns](./research/researcher-02-frontend-patterns.md)
- **Dependencies**: Phases 4 and 5 must be completed (store and routes exist)

## Overview

**Date**: 2026-02-14
**Priority**: P1
**Status**: Completed
**Estimated Effort**: 4 hours

Implement dashboard list page with CRUD operations: create, edit, delete dashboards.

## Key Insights

1. **Observer Pattern**: Wrap components with `observer()` for MobX reactivity
2. **Modal Pattern**: Use propel modal components for create/edit
3. **Empty State**: Use `EmptyStateDetailed` from propel
4. **Card Grid**: Responsive grid layout for dashboard cards
5. **Permissions**: Check user permissions before showing actions

## Requirements

### Functional Requirements

1. Dashboard list page with card grid layout
2. Create dashboard modal with form validation
3. Edit dashboard modal (pre-filled form)
4. Delete confirmation dialog
5. Empty state when no dashboards exist
6. Project multi-select for dashboard scoping
7. Dashboard logo/icon customization
8. Loading states during operations

### Non-Functional Requirements

1. Responsive grid (1-3 columns based on screen size)
2. Form validation on create/edit
3. Optimistic UI updates
4. Error handling with toast notifications
5. Accessibility (keyboard navigation, ARIA labels)

## Architecture

### Component Hierarchy

```
DashboardListPage
├── DashboardListHeader
│   ├── PageTitle
│   └── CreateButton
├── DashboardGrid (or EmptyState)
│   └── DashboardCard[]
│       ├── CardHeader (name, menu)
│       ├── CardBody (description, stats)
│       └── CardFooter (projects, owner)
└── DashboardFormModal
    ├── NameInput
    ├── DescriptionTextarea
    ├── ProjectMultiSelect
    └── SubmitButton
```

### State Flow

1. Page loads → fetch dashboards from store
2. User clicks "Create" → open modal
3. User submits form → create dashboard → close modal → update list
4. User clicks card → navigate to detail page
5. User clicks "Delete" → show confirmation → delete → update list

## Related Code Files

### Files to Create

1. **`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-list-header.tsx`**
   - Header with title and create button

2. **`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-card.tsx`**
   - Individual dashboard card component

3. **`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-form-modal.tsx`**
   - Create/edit dashboard modal

4. **`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-delete-modal.tsx`**
   - Delete confirmation dialog

5. **`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-empty-state.tsx`**
   - Empty state component

### Files to Modify

1. **`apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`**
   - Implement full dashboard list UI

## Implementation Steps

### Step 1: Create Dashboard List Header

**File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-list-header.tsx`

```typescript
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";

interface DashboardListHeaderProps {
  onCreateClick: () => void;
}

export const DashboardListHeader = observer(
  ({ onCreateClick }: DashboardListHeaderProps) => {
    const { t } = useTranslation();

    return (
      <div className="flex items-center justify-between border-b border-custom-border-200 p-4">
        <div>
          <h1 className="text-xl font-semibold">{t("dashboards")}</h1>
          <p className="text-sm text-custom-text-300">
            Create and manage analytics dashboards
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          <span>New Dashboard</span>
        </Button>
      </div>
    );
  }
);

DashboardListHeader.displayName = "DashboardListHeader";
```

### Step 2: Create Dashboard Card Component

**File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-card.tsx`

```typescript
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
import { MoreVertical, Edit2, Trash2, LayoutDashboard } from "lucide-react";
import type { IDashboard } from "@plane/types";
import { Button } from "@plane/propel/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@plane/propel/dropdown-menu";

interface DashboardCardProps {
  dashboard: IDashboard;
  workspaceSlug: string;
  onEdit: (dashboard: IDashboard) => void;
  onDelete: (dashboard: IDashboard) => void;
}

export const DashboardCard = observer(
  ({ dashboard, workspaceSlug, onEdit, onDelete }: DashboardCardProps) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
      navigate(`/${workspaceSlug}/dashboards/${dashboard.id}/`);
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(dashboard);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(dashboard);
    };

    return (
      <div
        className="group relative flex cursor-pointer flex-col rounded-lg border border-custom-border-200 bg-custom-background-100 p-4 transition-all hover:shadow-md"
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-custom-primary-100/10">
              <LayoutDashboard className="h-5 w-5 text-custom-primary-100" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-custom-text-100">
                {dashboard.name}
              </h3>
              {dashboard.is_default && (
                <span className="text-xs text-custom-text-300">Default</span>
              )}
            </div>
          </div>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {dashboard.description && (
          <p className="mb-3 text-sm text-custom-text-300 line-clamp-2">
            {dashboard.description}
          </p>
        )}

        {/* Footer Stats */}
        <div className="mt-auto flex items-center justify-between text-xs text-custom-text-300">
          <div className="flex items-center gap-4">
            <span>{dashboard.widget_count} widgets</span>
            {dashboard.config.project_ids?.length > 0 && (
              <span>{dashboard.config.project_ids.length} projects</span>
            )}
          </div>
          <span>by {dashboard.owner_name}</span>
        </div>
      </div>
    );
  }
);

DashboardCard.displayName = "DashboardCard";
```

### Step 3: Create Dashboard Form Modal

**File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-form-modal.tsx`

```typescript
import { observer } from "mobx-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { X } from "lucide-react";
import type { IDashboard, TDashboardCreate } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Textarea } from "@plane/propel/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@plane/propel/dialog";

interface DashboardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TDashboardCreate) => Promise<void>;
  dashboard?: IDashboard | null;
}

interface FormData {
  name: string;
  description: string;
  project_ids: string[];
}

export const DashboardFormModal = observer(
  ({ isOpen, onClose, onSubmit, dashboard }: DashboardFormModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
      control,
      handleSubmit,
      formState: { errors },
      reset,
    } = useForm<FormData>({
      defaultValues: {
        name: dashboard?.name || "",
        description: dashboard?.description || "",
        project_ids: dashboard?.config?.project_ids || [],
      },
    });

    const handleFormSubmit = async (data: FormData) => {
      try {
        setIsSubmitting(true);
        await onSubmit({
          name: data.name,
          description: data.description,
          logo_props: {},
          config: {
            project_ids: data.project_ids,
          },
        });
        reset();
        onClose();
      } catch (error) {
        console.error("Failed to save dashboard:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleClose = () => {
      reset();
      onClose();
    };

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dashboard ? "Edit Dashboard" : "Create Dashboard"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </label>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Analytics Dashboard"
                    hasError={!!errors.name}
                  />
                )}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Dashboard description..."
                    rows={3}
                  />
                )}
              />
            </div>

            {/* Project Scoping - TODO: Add project multi-select */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Projects (optional)
              </label>
              <p className="text-xs text-custom-text-300">
                Leave empty to include all projects
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : dashboard
                  ? "Update Dashboard"
                  : "Create Dashboard"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

DashboardFormModal.displayName = "DashboardFormModal";
```

### Step 4: Create Delete Confirmation Modal

**File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-delete-modal.tsx`

```typescript
import { observer } from "mobx-react";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { IDashboard } from "@plane/types";
import { Button } from "@plane/propel/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@plane/propel/dialog";

interface DashboardDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  dashboard: IDashboard | null;
}

export const DashboardDeleteModal = observer(
  ({ isOpen, onClose, onConfirm, dashboard }: DashboardDeleteModalProps) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
      try {
        setIsDeleting(true);
        await onConfirm();
        onClose();
      } catch (error) {
        console.error("Failed to delete dashboard:", error);
      } finally {
        setIsDeleting(false);
      }
    };

    if (!dashboard) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle>Delete Dashboard</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{dashboard.name}</span>? This
              action cannot be undone and will delete all widgets in this
              dashboard.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Dashboard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

DashboardDeleteModal.displayName = "DashboardDeleteModal";
```

### Step 5: Create Empty State Component

**File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-empty-state.tsx`

```typescript
import { observer } from "mobx-react";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@plane/propel/button";
import { EmptyStateDetailed } from "@plane/propel/empty-state";

interface DashboardEmptyStateProps {
  onCreateClick: () => void;
}

export const DashboardEmptyState = observer(
  ({ onCreateClick }: DashboardEmptyStateProps) => {
    return (
      <EmptyStateDetailed
        icon={LayoutDashboard}
        title="No dashboards yet"
        description="Create your first analytics dashboard to visualize work item data with customizable charts and widgets."
        primaryButton={{
          text: "Create Dashboard",
          onClick: onCreateClick,
        }}
      />
    );
  }
);

DashboardEmptyState.displayName = "DashboardEmptyState";
```

### Step 6: Update Dashboard List Page

**File**: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`

```typescript
import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import { useDashboardStore } from "@/core/hooks/use-dashboard-store";
import { Loader } from "@plane/propel/loader";
import type { Route } from "./+types/page";
import type { IDashboard } from "@plane/types";

// Import components
import { DashboardListHeader } from "./components/dashboard-list-header";
import { DashboardCard } from "./components/dashboard-card";
import { DashboardFormModal } from "./components/dashboard-form-modal";
import { DashboardDeleteModal } from "./components/dashboard-delete-modal";
import { DashboardEmptyState } from "./components/dashboard-empty-state";

function DashboardListPage({ params }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { workspaceSlug } = params;
  const dashboardStore = useDashboardStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<IDashboard | null>(
    null
  );

  // Fetch dashboards on mount
  useEffect(() => {
    dashboardStore.fetchDashboards(workspaceSlug);
  }, [workspaceSlug, dashboardStore]);

  const handleCreate = async (data: any) => {
    await dashboardStore.createDashboard(workspaceSlug, data);
  };

  const handleEdit = (dashboard: IDashboard) => {
    setSelectedDashboard(dashboard);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: any) => {
    if (!selectedDashboard) return;
    await dashboardStore.updateDashboard(
      workspaceSlug,
      selectedDashboard.id,
      data
    );
  };

  const handleDelete = (dashboard: IDashboard) => {
    setSelectedDashboard(dashboard);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDashboard) return;
    await dashboardStore.deleteDashboard(workspaceSlug, selectedDashboard.id);
  };

  const pageTitle = t("dashboards");

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <DashboardListHeader onCreateClick={() => setIsCreateModalOpen(true)} />

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {dashboardStore.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader />
            </div>
          ) : dashboardStore.dashboardsList.length === 0 ? (
            <DashboardEmptyState
              onCreateClick={() => setIsCreateModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboardStore.dashboardsList.map((dashboard) => (
                <DashboardCard
                  key={dashboard.id}
                  dashboard={dashboard}
                  workspaceSlug={workspaceSlug}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DashboardFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      <DashboardFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDashboard(null);
        }}
        onSubmit={handleUpdate}
        dashboard={selectedDashboard}
      />

      <DashboardDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDashboard(null);
        }}
        onConfirm={handleConfirmDelete}
        dashboard={selectedDashboard}
      />
    </>
  );
}

export default observer(DashboardListPage);
```

## Todo List

- [ ] Create `dashboard-list-header.tsx` component
- [ ] Create `dashboard-card.tsx` component
- [ ] Create `dashboard-form-modal.tsx` component
- [ ] Create `dashboard-delete-modal.tsx` component
- [ ] Create `dashboard-empty-state.tsx` component
- [ ] Update dashboard list page with full UI
- [ ] Test create dashboard flow
- [ ] Test edit dashboard flow
- [ ] Test delete dashboard flow
- [ ] Test empty state displays correctly
- [ ] Test responsive grid layout
- [ ] Test form validation
- [ ] Test error handling
- [ ] Add project multi-select to form (Phase 7 enhancement)
- [ ] Add toast notifications for success/error

## Success Criteria

1. ✅ Dashboard list displays in responsive grid
2. ✅ Create dashboard modal works
3. ✅ Edit dashboard modal works (pre-filled)
4. ✅ Delete confirmation works
5. ✅ Empty state displays when no dashboards
6. ✅ Dashboard cards clickable (navigate to detail)
7. ✅ Form validation works
8. ✅ Loading states display correctly
9. ✅ Error handling works
10. ✅ MobX reactivity updates UI automatically

## Risk Assessment

**Risk**: Form doesn't validate properly
- **Mitigation**: Use react-hook-form validation rules

**Risk**: Modal doesn't close after submit
- **Mitigation**: Call onClose() after successful operation

**Risk**: Optimistic updates cause stale data
- **Mitigation**: Fetch dashboards after create/update/delete

**Risk**: Memory leak from unclosed modals
- **Mitigation**: Reset form state in handleClose

## Security Considerations

1. **Input Validation**: Form validates all user input
2. **XSS Prevention**: React auto-escapes user content
3. **Permission Checks**: Backend validates all operations
4. **Soft Delete**: Dashboards can be recovered from database

## Next Steps

Proceed to [Phase 7: Widget Components & Grid Layout](./phase-07-widget-components-grid.md)
- Implement widget grid layout with drag-drop
- Create widget wrapper component
- Implement all 6 widget chart types
- Add widget add button
