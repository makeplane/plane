# Project Changelog

All significant changes, features, and fixes are recorded here in reverse-chronological order.

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
- UX pattern: dedicated page (mirrors existing Bulk Import page)
=======
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
