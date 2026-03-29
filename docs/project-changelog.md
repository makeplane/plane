# Project Changelog

All significant changes, features, and fixes are recorded here in reverse-chronological order.

---

## [2026-03-29]

### Feature: Task Categories System

**Summary:** Introduced instance-level hierarchical task categorization system enabling organizations to classify work items with 2-tier categories (MainTaskCategory → SubTaskCategory).

**Backend:**

- Models: MainTaskCategory, SubTaskCategory in `plane/db/models/task_category.py`
- Migrations 0158-0160: Create models and add FK to Issue
- Issue model: Optional main_task_category and sub_task_category fields
- Admin API: Full CRUD at `/task-categories/main/` and `/task-categories/sub/` (instance admin only)
- Workspace API: Read-only at `/workspaces/<slug>/task-categories/main/` and `/sub/`
- Validation: For non-draft issues, categories required if categories exist in system

**Frontend:**

- Store: TaskCategoryStore for category state management
- Component: task-category-property.tsx (2-tier dropdown selector)
- Integration: Spreadsheet columns, issue forms, filters
- i18n: Full support for EN/KO/VI languages

### Feature: Head Office (HO) API

**Summary:** Cross-workspace issue management with role-based access control for multi-department organizations. Enables Instance Admins and Department Managers to view aggregated issue data across multiple workspaces.

**Backend:**

- Access Control: BFS department hierarchy traversal for manager-scoped access
- `HoIssueListView`: 18-column read-only datasheet with filtering/sorting (department, status, priority, assignee)
- `HoCategorySummaryView`: Aggregated work item counts by category
- Endpoints: `/api/ho/issues/` (paginated), `/api/ho/category-summary/`
- Permission: Instance admin sees all; department managers see managed + descendant departments

**Frontend:**

- Store: HoIssueStore for HO issue state
- Service: HoIssueService for API integration
- Components: 12 HO components (list, filters, columns, detail modal, category summary)
- Table: TanStack React Table for read-only datasheets
- Admin dashboard: New "Head Office" module accessible to qualified users

### Feature: Time-Tracking Analytics & Capacity Management

**Summary:** Enhanced time tracking with cross-workspace analytics, capacity planning, and visual data representation.

**Backend:**

- Analytics Timesheet: `/api/workspaces/<slug>/analytics/time-tracking/timesheet/` (week-grid view)
- Capacity Heatmap: `/api/workspaces/<slug>/capacity/members/` with color-coded status (green/yellow/red)
- Capacity Day Details: `/api/workspaces/<slug>/capacity/{memberId}/{date}/` per-task breakdown
- Cross-Workspace Enhancement: Timesheet shows ALL assigned issues (not just those with logs)
- CSV Export: Capacity reports exportable as CSV

**Frontend:**

- Components: 13 time-tracking components (5 timesheet, 4 analytics, 4 capacity)
- Visualization: Recharts donut charts (innerRadius 45%, 8-color palette) for category counts
- Stores: CEWorklogStore extends WorklogStore with analytics/capacity methods
- Types: 11 new interfaces in packages/types/src/worklog.ts
- Per-user breakdown: Popover showing task-level distribution in analytics

### Feature: Workspace Default Views

**Summary:** Workspace-level configuration for default issue views with 8+ custom spreadsheet columns enabling standardized view management across workspaces.

**Backend:**

- IssueView model: New is_default flag (migrations 0145-0146)
- Auto-seeding: Default views created on workspace creation
- Custom columns: bank-wide-project, project-lead, department, progress, completed-date, total-log-time, reference-link, project-name
- Endpoint: GET /api/workspaces/{slug}/views/?default=true

**Frontend:**

- Workspace settings: Dedicated workspace-views page
- Default view selector: Dropdown in workspace header
- Spreadsheet: 8+ custom columns with full sorting/filtering support
- Store: Enhanced IssueViewStore with default view management

---

## [2026-03-29]

### Feature: Opinion Removal & Due Date Change Reason Tracking

**Summary:** Removed opinion feature entirely from the platform. Issues can no longer have opinions attached. Due date and completion date changes now require a reason to be tracked in activity log.

**Backend:**

- Removed Opinion model and related endpoints
- Migration 0134: `0134_remove_opinion_feature.py` - Drops opinion tables
- New DueDateChangeReason model tracks reasons for temporal changes
- Issue.target_date and Issue.completed_at updates require optional reason field
- Celery task enhanced to log reason in IssueActivity
- API validation: PATCH /api/v1/issues/{id}/ requires reason when updating target_date or completed_at

**Frontend:**

- Opinion component removed from issue detail sidebar
- Opinion API calls removed from issue service
- Due date change modal enhanced with reason input field
- Worklog features hide "Log Time" button for Done/Cancelled issues (UX improvement)

**Database Changes:**

- Migration removes all opinion-related columns
- No data preservation needed (opinion data discarded)

---

## [2026-03-15]

### Feature: Spreadsheet Enhancements & Module Activity Tracking

**Summary:** Enhanced spreadsheet view with non-sortable column support. Added activity tracking for module changes with frontend rendering improvements.

**Backend:**

- Spreadsheet sort order: Fixed sort_order key handling in column metadata
- Module activity tracking: New ModuleActivity model logs all module changes
- Backend API: `/api/v1/projects/{id}/modules/{id}/activity/` returns activity stream
- Celery: Enhanced activity pipeline to include module-level events

**Frontend:**

- Spreadsheet: Added non-sortable columns support (e.g., custom fields, status)
- Module detail: Activity tab displays change history with timestamp/actor
- Module activity rendering: Shows create, update, delete operations with field diffs

---

## [2026-03-12]

### Feature: Default View Enhancements

**Summary:** Enhanced default view selection per project with project lead display and improved filtering.

**Backend:**

- Project.default_view field now supports detailed view metadata
- API: GET /api/v1/projects/{id}/ includes default_view with view configuration
- View creation: Auto-set as default for projects without default_view

**Frontend:**

- Project settings: Default view dropdown with preview
- Breadcrumb navigation respects default view per project
- Project lead information displayed in project list views

---

## [2026-03-10]

### Fix: Circular Dependency Resolution

**Summary:** Fixed circular dependency in IssueRootStore constructor causing initialization errors.

**Technical Details:**

- Store dependency: Removed circular imports between IssueRootStore and related stores
- Import restructuring: Split store exports into separate files to break cycles
- Impact: Faster store initialization, fewer hydration errors

---

## [2026-03-08]

### Feature: Worklog Enhancements & Activity Improvements

**Summary:** Enhanced worklog functionality with activity tracking, delete modals, and improved error handling.

**Backend:**

- IssueWorkLog activity: Each worklog change creates IssueActivity record
- API error extraction: Worklog endpoints return clearer error messages
- Delete workflow: Confirmation modal added server-side
- Worklog filtering: Enhanced project-level queries with date range support

**Frontend:**

- Activity rendering: Improved filtering for worklog-related activities
- Delete modal: Confirmation before permanent worklog removal
- Activity group: Worklog entries grouped in activity feed by date
- Bulk operations: Support for updating multiple worklogs in single request

---

## [2026-02-28]

### Feature: Bulk Staff Import via Excel

**Summary:** Workspace administrators can bulk-import staff and department members from Excel files without manual data entry.

**Backend:**

- Endpoint: POST /api/v1/workspaces/{slug}/bulk-staff-import/
- Processing: Row-by-row validation with skipped rows logged
- Integration: Auto-creates StaffProfile records linked to users
- Validation: Email, employment status, department code required

**Frontend:**

- Admin panel: Multi-step import flow (upload → preview → confirm)
- Excel parser: Client-side XLSX parsing with validation
- Error handling: Clear feedback on skipped rows with reasons

---

## [2026-02-25]

### Feature: Department Auto-Join in Workspaces

**Summary:** Simplified department-workspace synchronization with automatic member addition.

**Backend:**

- Department model: Added linked_workspace FK (optional)
- Celery task: `sync_department_workspace_members` auto-adds staff to workspace
- Deactivation workflow: Staff deactivation removes workspace membership
- Configuration: Admin toggles auto-join per department-workspace pairing

**Frontend:**

- Department settings: New toggle for auto-join
- Workspace members: Auto-joined staff show department affiliation
- Deactivation: Confirmation modal before removing workspace access

---

## [2026-02-20]

### Feature: Quick-Add Modal Refactor

**Summary:** Migrated quick-add buttons throughout the app to use unified command palette modal for consistent UX.

**Frontend:**

- Command palette: New modal for quick issue/cycle/module creation
- Navigation: "/c" hotkey opens quick-add modal
- Components: Removed inline quick-add buttons (consolidated to palette)
- UX: Single entry point for creation workflows (keyboard-friendly)

---

## [2026-02-18]

### Feature: Module Tooltip Enhancements

**Summary:** Added tooltip to truncated module names in dropdowns and lists.

**Frontend:**

- Module dropdown: Truncated names show full name on hover
- Module list: Tooltip displays description on mouse over
- Accessibility: Proper ARIA labels for tooltip triggers

---

## [2026-02-15]

### Feature: RFC 3986 Custom Protocol Support for Issue Links

**Summary:** Added support for custom URI schemes in issue links with RFC 3986 validation and security checks.

**Backend:**

- IssueLink model: protocol field for custom schemes (git, ssh, ftp, etc.)
- Validation: RFC 3986 regex enforces valid scheme format
- Security: XSS prevention for custom protocol URLs
- API: Links with custom protocols render safely in frontend

**Frontend:**

- Issue relations modal: Protocol selector dropdown
- Link rendering: Safe href generation for custom protocols
- Security: Content Security Policy headers protect against XSS

---

## [2026-02-05]

### Feature: Workflow Enforcement (State Transitions & Approvals)

**Summary:** Project teams can define allowed state transitions, restrict issue creation in certain states, and require approvals from specific users before state changes.

**Backend:**

- New models: `ProjectWorkflow`, `WorkflowStateConfig`, `WorkflowTransition`, `WorkflowTransitionApprover`, `WorkflowActivity`
- Migration 0133: `0133_workflow_models.py` - Creates workflow tables with unique constraints
- 9 new REST endpoints under `/api/workspaces/{slug}/projects/{id}/workflow*/`
- API: `WorkflowStateConfigViewSet`, `ProjectWorkflowViewSet`, `WorkflowTransitionViewSet`, `WorkflowTransitionApproverViewSet`
- Enforcement in `IssueViewSet`: HTTP 403 for unauthorized transitions, HTTP 400 for creation in restricted states
- Audit trail: All workflow config changes logged via `WorkflowActivity`
- Helper utility: `plane/utils/workflow_checker.py` for transition validation

**Frontend (apps/web/ce):**

- MobX Store: `WorkflowStore` with `useWorkflowStore()` hook
- Service: `WorkflowService` - API integration for all workflow endpoints
- Settings page: `/settings/projects/{projectId}/workflows` with state config, transition rules, and approver management
- Components:
  - `workflow-disabled-overlay.tsx` - Kanban drag-block visual
  - `workflow-blocker-modal.tsx` - Non-Kanban state change prevention
  - `workflow-indicator-icon.tsx` - Column header workflow badge
  - `workflow-state-info-popup.tsx` - Inline transition rules display
  - `workflow-drag-n-drop.ts` hook - Drag-drop blocking logic
- UX patterns:
  - Kanban: Drag blocked with overlay + tooltip on hover
  - List/Calendar/etc.: Modal prevents transition before POST attempt
  - Column headers show workflow active indicator when `is_live=true`

**CE Pattern:** All code isolated in `apps/web/ce/` and `apps/api/plane/` (no core modifications)

**Configuration:**

- Project-level toggle: `ProjectWorkflow.is_live` (default: false, backward compatible)
- Per-state: `WorkflowStateConfig.allow_issue_creation` (default: true)
- Transition rules: Only explicitly defined transitions allowed
- Approvals: Optional per-transition user restrictions

---

## [2026-03-05]

### Feature: Workflow Enforcement (State Transitions & Approvals)

**Summary:** Project teams can define allowed state transitions, restrict issue creation in certain states, and require approvals from specific users before state changes.

**Backend:**

- New models: `ProjectWorkflow`, `WorkflowStateConfig`, `WorkflowTransition`, `WorkflowTransitionApprover`, `WorkflowActivity`
- Migration 0133: `0133_workflow_models.py` - Creates workflow tables with unique constraints
- 9 new REST endpoints under `/api/workspaces/{slug}/projects/{id}/workflow*/`
- API: `WorkflowStateConfigViewSet`, `ProjectWorkflowViewSet`, `WorkflowTransitionViewSet`, `WorkflowTransitionApproverViewSet`
- Enforcement in `IssueViewSet`: HTTP 403 for unauthorized transitions, HTTP 400 for creation in restricted states
- Audit trail: All workflow config changes logged via `WorkflowActivity`
- Helper utility: `plane/utils/workflow_checker.py` for transition validation

**Frontend (apps/web/ce):**

- MobX Store: `WorkflowStore` with `useWorkflowStore()` hook
- Service: `WorkflowService` - API integration for all workflow endpoints
- Settings page: `/settings/projects/{projectId}/workflows` with state config, transition rules, and approver management
- Components:
  - `workflow-disabled-overlay.tsx` - Kanban drag-block visual
  - `workflow-blocker-modal.tsx` - Non-Kanban state change prevention
  - `workflow-indicator-icon.tsx` - Column header workflow badge
  - `workflow-state-info-popup.tsx` - Inline transition rules display
  - `workflow-drag-n-drop.ts` hook - Drag-drop blocking logic
- UX patterns:
  - Kanban: Drag blocked with overlay + tooltip on hover
  - List/Calendar/etc.: Modal prevents transition before POST attempt
  - Column headers show workflow active indicator when `is_live=true`

**CE Pattern:** All code isolated in `apps/web/ce/` and `apps/api/plane/` (no core modifications)

**Configuration:**

- Project-level toggle: `ProjectWorkflow.is_live` (default: false, backward compatible)
- Per-state: `WorkflowStateConfig.allow_issue_creation` (default: true)
- Transition rules: Only explicitly defined transitions allowed
- Approvals: Optional per-transition user restrictions

---

## [2026-03-04]

### Feature: Bulk Assign Workspace Members via Excel

**Summary:** God-mode admin can upload an `.xlsx` file to bulk-add users to workspaces without manual one-by-one assignment.

**Backend:**

- New POST endpoint `POST /api/instances/workspaces/bulk-assign-members/`
- Validates each row (email, workspace slug, role); skips rows with unknown users or already-active members with a reason string
- No DB migrations required — uses existing `WorkspaceMember` model
- New view file: `apps/api/plane/license/api/views/workspace_member_bulk_assign.py`
- Extended: `apps/api/plane/license/api/views/__init__.py`, `apps/api/plane/license/urls.py`

**Frontend (apps/admin):**

- New page `/workspace/bulk-assign` with three-step flow: Excel upload → row preview → results display
- New components: `workspace-bulk-assign-form.tsx`, `workspace-bulk-assign-preview.tsx`, `workspace-bulk-assign-results.tsx`
- Excel parsed client-side via `xlsx` (SheetJS), JSON payload sent to backend
- "Bulk Assign Workspace" button added to existing `/workspace/` god-mode page
- Store action `bulkAssignMembers` added to `workspace.store.ts`
- Service method added to `packages/services/src/workspace/instance-workspace.service.ts`

**Decisions recorded:**

- Member role value: `15` (matches DB `ROLE_CHOICES`, spec had a typo of `10`)
- User not found: skip row with reason (no auto-invite)
- Already a member: skip row with reason (no role update)
- # UX pattern: dedicated page (mirrors existing Bulk Import page)
  **Last Updated**: 2026-03-04
  **Version**: 1.2.3
  **Format**: [Keep a Changelog](https://keepachangelog.com/) style

All notable changes to the Plane project are documented here. This file tracks features, breaking changes, bug fixes, and improvements across the full stack.

---

## [1.2.3] - 2026-03-04

### Added

- **Remove None Priority Feature** - Simplified priority system from 5 levels to 4
  - Removed "none" from priority options across full stack
  - Set "medium" as new default priority for all new issues and drafts
  - Created Django data migration (0131) to convert all existing "none" records to "medium"

### Changed

- **Priority System** - Now supports only 4 levels: urgent, high, medium, low (previously 5 with "none")
- **Issue Model Defaults** - Default priority changed from "none" to "medium" in Issue, IssueVersion, DraftIssue models
- **Priority Ordering** - Updated all priority ordering/grouping lists to reflect 4-priority system

### Breaking Changes

- **API Filter Rejection** - Requests filtering by `priority=none` now return HTTP 400 Bad Request
  - Intentional breaking change to enforce new priority system
  - Clients must update filter logic to use valid priorities: urgent, high, medium, low
- **UI Removal** - "None" priority option removed from all priority dropdown selectors
- **Default Priority** - New issues default to "medium" instead of "none"

### Deprecated

- Priority value "none" deprecated in API filters (will return 400)
- Priority UI selectors no longer expose "none" option

### Technical Details

- **Migration Command**: `python manage.py makemigrations db --empty --name migrate_none_priority_to_medium`
- **Affected Tables**: Issue, IssueVersion, DraftIssue
- **Type Safety**: TIssuePriorities type retains "none" for edge case backward compatibility
- **Backward Compat**: PriorityIcon component continues supporting "none" for residual data

---

## [1.2.2] - 2026-03-03

### Added

- **Time Tracking Management** - Comprehensive time tracking and capacity planning features
  - Remove estimate_time field from issue properties
  - Add time_spent model for tracking actual hours worked
  - Time tracking dashboard with capacity heatmaps
  - Capacity summary and planning views

### Changed

- **Issue Properties** - Removed estimate_time from Issue model and frontend components
- **Time Tracking Components** - Updated to use new time_spent model instead of estimate_time

### Fixed

- Time tracking data consistency across Issue, IssueVersion tables

---

## [1.2.1] - 2026-03-02

### Added

- **Admin User Management** - Instance administrator controls for user and workspace management
  - User CRUD operations (create, read, update, delete users)
  - Password reset functionality
  - Workspace assignment and management
  - Admin UI with search, pagination, and detail views
  - MobX store integration for state management

### Changed

- Admin app routes and components for user management
- Instance admin permissions and access controls

### Technical Details

- **Routes**: `/admin/users` (list, create, detail pages)
- **Store**: `instance-user.store.ts` for user state management
- **Service**: `instance-user.service.ts` for API integration

---

## [1.2.0] - 2026-02-28

### Added

- **Swing SSO Authentication** - Integration with Swing portal for single sign-on
  - Provider implementation with credentials and token flows
  - Config keys: IS_SWING_SSO_ENABLED, SWING_SSO_URL, CLIENT_ID, CLIENT_SECRET, COMPANY_CODE
  - Admin UI for Swing SSO configuration
  - Frontend Staff ID login option
  - Token-based SSO from Swing portal

- **Department & Staff Management** - Organizational hierarchy and employee management
  - Hierarchical department structure
  - Employee profile management
  - Bulk import/export functionality
  - Auto-sync to projects

- **Work Items Required Fields** - Issue creation validation
  - Frontend validation for required fields in work item modal
  - Default properties validation (project, state, priority required)
  - User-friendly error messaging

- **Default Labels Seeding** - Auto-generate default labels on project creation
  - 8 default label templates (Bug, Feature, Documentation, etc.)
  - Seed labels for existing projects via data migration (0128)
  - Customizable label colors and descriptions

### Changed

- **Issue Modal** - Enhanced with required field validation and default property management
- **Dashboard V2** - Complete redesign and implementation
  - 8 implementation phases completed (C1, C2, H1, H2, M1-M4)
  - 52 contract tests passing
  - Widget configuration UI with multiple chart types
  - Dashboard CRUD with favorites/pinning

### Fixed

- XSS vulnerability in delete modal component
- Color token validation in dashboard toolbar
- Code duplication in utility functions (DRY refactoring)
- Dashboard bounds validation for widget positioning

---

## [1.1.5] - 2025-11-30

### Added

- **Design System Overhaul** - Propel UI library implementation
  - New component library with design tokens
  - Accessibility improvements (WCAG AA compliance)
  - Consistent styling across all applications

- **Internationalization Enhancement** - Expanded language support
  - 19 languages supported (en, ko, vi, ja, fr, de, es, pt, ru, zh, ar, and more)
  - Translation management system
  - Regional formatting (dates, numbers, currencies)

- **Advanced Filtering & Search** - Enhanced query capabilities
  - Multi-field filter builder
  - Saved filter views
  - Full-text search across issues

- **Custom Workflows** - Workflow automation framework
  - Custom status workflows per project
  - Automated transitions and state machines
  - Conditional rules engine

- **Webhook Integrations** - External system integration
  - Event-driven webhooks
  - Custom payload builders
  - Retry and delivery tracking

### Changed

- **Analytics Dashboard Pro** - Professional analytics features
  - 6 widget types (line, bar, pie, scatter, table, metric)
  - Multi-dashboard CRUD
  - Widget configuration UI
  - Data aggregation and visualization
  - Favorites/pinning with unified UserFavorite system

### Performance

- Optimized database queries for large datasets
- Implemented caching strategies
- Query optimization across ORM calls

---

## [1.1.0] - 2025-09-15

### Added

- **API v1 Release** - Stable REST API for integrations
  - OpenAPI specification
  - Token-based authentication
  - Rate limiting

### Changed

- **Enhanced Notification System** - Improved notification delivery
  - In-app notifications
  - Email notification templates
  - Digest options

### Fixed

- Notification delivery reliability
- Background task retry logic

### Performance

- Database connection pooling
- Query optimization
- Caching layer improvements

---

## [1.0.5] - 2025-06-30

### Added

- **Performance Optimization** - System-wide performance improvements
  - Database indexing strategy
  - Query optimization
  - Frontend bundle size reduction

### Fixed

- Slow page load issues
- Memory leaks in real-time collaboration
- Cache invalidation race conditions

---

## [1.0.0] - 2024-12-15

### Added

- **Initial Release** - Plane.so public launch
  - Core project management (issues, cycles, modules)
  - Workspace & project management
  - User authentication (OAuth: Google, GitHub, GitLab, Gitea; Magic links; Password)
  - Real-time collaboration via CRDT (Y.js + Hocuspocus)
  - Public sharing portal for workspaces and issues
  - Basic analytics and reporting
  - Issue relationships (blocks, relates, duplicates)
  - Comments with reactions
  - Issue versioning and history tracking
  - Multiple view types (board, list, calendar, spreadsheet, gantt, timeline)
  - Self-hosting options (Docker Compose, Docker Swarm, Kubernetes)

### Architecture

- Monorepo structure with pnpm + Turborepo
- React 18 frontend with MobX state management
- Django 4.2 + DRF backend
- PostgreSQL primary database
- Redis/Valkey for caching and sessions
- RabbitMQ for async task queue
- Caddy reverse proxy with auto-HTTPS
- MinIO S3-compatible file storage

---

## Versioning & Release Notes

### Version Format

- **Major.Minor.Patch** (e.g., 1.2.3)
- **Major**: Breaking API changes, significant architecture shifts
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes, performance improvements, non-breaking changes

### Release Cycle

- **Monthly patches** (bug fixes, minor improvements)
- **Quarterly minor releases** (new features, enhancements)
- **Annual major releases** (architecture changes, breaking changes)

### Deployment Strategy

- **Feature branches** → PR to `develop` (staging)
- **Release PRs** → merge `develop` to `preview` (production)
- **Hotfixes** → branch from `preview`, PR to `preview`, sync back to `develop`

---

## Contributing to Changelog

### When to Update

- After implementing a feature (add to "Added" section)
- After fixing a bug (add to "Fixed" section)
- After removing functionality (add to "Removed" section)
- After making breaking changes (add to "Breaking Changes" section)
- After deprecating features (add to "Deprecated" section)

### Format Guidelines

- Use present tense ("Add" not "Added")
- Be descriptive and user-focused
- Include technical details for breaking changes
- Link to related issues/PRs when available
- Group related changes together

### Breaking Change Notation

Always clearly mark breaking changes:

```
### Breaking Changes
- **API Endpoint**: Description of what changed and migration path
- **Database Schema**: Migration required, steps to follow
- **Type Definitions**: Updated types and compatibility notes
```

---

**Document Location**: `/Users/ngoctran/Documents/Shinhan/plane/docs/project-changelog.md`
**Format**: Markdown (Keep a Changelog style)
**Last Review**: 2026-03-04
