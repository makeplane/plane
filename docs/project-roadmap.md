# Project Roadmap & Status

**Last Updated**: 2026-03-29 (Opinion removal, due date reasons, spreadsheet enhancements, module activity tracking)
**Current Version**: 1.2.4
**Next Release Target**: Q2 2026

## Project Status Summary

### Current State (v1.2.0)

**Overall Status**: Stable, feature-complete for MVP

| Area                 | Status            | Health    | Notes                      |
| -------------------- | ----------------- | --------- | -------------------------- |
| **Core Features**    | ✅ Shipped        | Excellent | All major features working |
| **Real-time Collab** | ✅ Shipped        | Excellent | CRDT-based, stable         |
| **Mobile UI**        | ✅ Shipped        | Good      | Responsive design complete |
| **Performance**      | ✅ Optimized      | Good      | Sub-2s avg response time   |
| **Security**         | ✅ Implemented    | Excellent | RBAC, OAuth, encryption    |
| **Deployment**       | ✅ Multi-platform | Excellent | Docker, K8s, All-in-One    |
| **Documentation**    | 🆕 Improving      | Good      | New dev docs in progress   |
| **Testing**          | ✅ Comprehensive  | Good      | Unit + E2E coverage        |
| **Community**        | ✅ Active         | Excellent | 50K+ GitHub stars          |

### Completed Milestones (v1.0 - v1.2)

#### v1.0 - Initial Release (2024)

- ✅ Core project management (issues, cycles, modules)
- ✅ Workspace & project management
- ✅ User authentication (OAuth, password, magic links)
- ✅ Real-time collaboration (CRDT via Y.js)
- ✅ Public sharing portal
- ✅ Basic analytics

#### v1.1 - Stability & Scale (2025)

- ✅ Performance optimization
- ✅ Database indexing
- ✅ Caching improvements
- ✅ Query optimization
- ✅ API v1 release
- ✅ Enhanced notification system

#### v1.2 - Current (Feb 2026)

- ✅ Design system overhaul (Propel UI library)
- ✅ Accessibility improvements (WCAG AA)
- ✅ Internationalization (19 languages)
- ✅ Advanced filtering & search
- ✅ Custom workflows
- ✅ Webhook integrations
- ✅ Analytics Dashboard Pro Feature (6 widget types, multi-dashboard CRUD, widget config UI, backend API, data aggregation, favorites/pinning)
- ✅ Custom Dashboard Feature (project-scoped dashboards, widgets with charts, data aggregation utilities, widget layout management, favorites)
  - ✅ i18n: 88+ translation keys added (en/ko/vi)
  - ✅ Testing: 41 comprehensive backend tests (CRUD + widget aggregation)
  - ✅ Fixes: XSS prevention in delete modal, semantic color tokens in toolbar
- ✅ Dashboard V2 Implementation Complete (Feb-Mar 2026)
  - ✅ All 8 implementation phases complete (C1, C2, H1, H2, M1-M4)
  - ✅ 52/52 contract tests passing
  - ✅ Code review: 4 critical fixes applied (favorite.store.ts, bounds validation, color validation, DRY utilities)
  - ✅ Frontend build: passing (no TS/lint errors)
  - ✅ Ready for merge to preview branch
- ✅ Department & Staff Management (hierarchical departments, employee profiles, bulk import/export, auto-sync to projects)
- ✅ Swing SSO Authentication (Mar 2026)
  - ✅ Provider implementation (credentials + token flows)
  - ✅ 5 config keys (IS_SWING_SSO_ENABLED, SWING_SSO_URL, CLIENT_ID, CLIENT_SECRET, COMPANY_CODE)
  - ✅ Backend auth views & endpoints
  - ✅ Admin UI god-mode config page with test modal
  - ✅ Frontend Staff ID login branch
  - ✅ Token-based SSO from Swing portal
- ✅ Admin User Management (Mar 2026)
  - ✅ Backend APIs: User CRUD, password reset, workspace assignment
  - ✅ Admin UI: /users list (search, pagination), /users/create form, /users/:id detail page
  - ✅ Dialogs: Workspace assignment, password reset
  - ✅ Integration: MobX store, API service, frontend components
  - ✅ Documentation: Updated codebase-summary, system-architecture
- ✅ Remove None Priority Feature (Mar 2026)
  - ✅ Simplified priority system from 5 levels to 4 (urgent, high, medium, low)
  - ✅ Set "medium" as new default priority for all issues and drafts
  - ✅ Created Django data migration (0131) for none→medium conversion
  - ✅ API returns 400 for priority=none filter requests (breaking change)
  - ✅ Full-stack implementation (backend models, serializers, API views, frontend UI)
  - ✅ Documentation: Changelog, architecture updates, breaking change notes
- ✅ Worklog (Time Tracking) Phases 1-9 (Mar 2026)
  - ✅ Backend validation: 12h/day limit (720 min), no future dates, 7-working-day edit window
  - ✅ Permission enforcement: ADMIN-only edit/delete with 7-day window, MEMBER create-only
  - ✅ API endpoints: Issue-level CRUD, project/workspace summaries, timesheet grid, bulk upsert
  - ✅ Serializer architecture: Standard + bulk entry semantics, date range validation
  - ✅ Frontend validation: Date picker restrictions, error toasts, edit window checks
  - ✅ Daily reminder: Celery task at UTC 10:00, email + in-app notifications
  - ✅ User preferences: `UserNotificationPreference.worklog_reminder` toggle
  - ✅ Code modularization: `time_tracking.py` → `time_tracking/{summary,timesheet_grid,timesheet_bulk}.py`
  - ✅ i18n: EN/KO/VI translations (20+ keys)
  - ✅ Phase 9 Feature Flag Gating: Sidebar nav gated, route guard with EmptyState, "Log Time" button info popup, worklog property hidden
  - ✅ Documentation: Comprehensive specification in `worklog-specification.md` + feature flag section
- ✅ Opinion Feature Removal (Mar 2026)
  - ✅ Complete removal of opinion model and related API endpoints
  - ✅ Migration 0134: Drops all opinion tables from database
  - ✅ Due date change reason tracking: Required reason field for temporal changes
  - ✅ UX enhancement: Worklog button hidden for Done/Cancelled issues
  - ✅ Activity log: Reasons tracked for audit trail
- ✅ Spreadsheet & Module Enhancements (Mar 2026)
  - ✅ Non-sortable columns support in spreadsheet view
  - ✅ Sort order key fixes for proper column ordering
  - ✅ Module activity tracking: ModuleActivity model for change history
  - ✅ Frontend: Activity tab in module detail with change stream
  - ✅ Default view enhancements with project lead display
  - ✅ Circular dependency fix in IssueRootStore
  - ✅ Quick-add modal refactor unified command palette
  - ✅ Module dropdown tooltip for truncated names
  - ✅ RFC 3986 custom protocol support for issue links
- ✅ Task Categories System (Mar 2026)
  - ✅ Instance-level 2-tier categorization (MainTaskCategory → SubTaskCategory)
  - ✅ Migrations 0158-0160 for models and Issue FK additions
  - ✅ Admin API full CRUD (instance admin only)
  - ✅ Workspace API read-only access for members
  - ✅ Frontend: TaskCategoryStore, 2-tier dropdown component, spreadsheet integration
  - ✅ i18n: EN/KO/VI translations
  - ✅ Validation: Categories required for non-draft issues when categories exist
- ✅ Head Office (HO) API (Mar 2026)
  - ✅ Cross-workspace issue visibility with role-based access control
  - ✅ BFS department hierarchy traversal for manager-scoped access
  - ✅ HoIssueListView: 18-column read-only datasheet with filtering/sorting
  - ✅ HoCategorySummaryView: Aggregated work item counts by category
  - ✅ Frontend: HoIssueStore, HoIssueService, 12 components, TanStack React Table
  - ✅ Admin dashboard: New "Head Office" module
  - ✅ Endpoints: /api/ho/issues/, /api/ho/category-summary/
- ✅ Time-Tracking Analytics & Capacity (Mar 2026)
  - ✅ Analytics timesheet: Week-grid view with per-user breakdown
  - ✅ Capacity heatmap: Color-coded status (green/yellow/red)
  - ✅ Capacity day details: Per-task breakdown for member on specific date
  - ✅ Donut pie charts: Recharts visualization (innerRadius 45%, 8-color palette)
  - ✅ Cross-workspace enhancement: Timesheet shows ALL assigned issues
  - ✅ CSV export: Capacity reports exportable
  - ✅ 13 components: timesheet (5), analytics (4), capacity (4)
  - ✅ 11 new type interfaces in packages/types/src/worklog.ts
- ✅ Workspace Default Views (Mar 2026)
  - ✅ IssueView model is_default flag (migrations 0145-0146)
  - ✅ Auto-seeding: Default views on workspace creation
  - ✅ 8+ custom columns: bank-wide-project, project-lead, department, progress, completed-date, total-log-time, reference-link, project-name
  - ✅ Workspace settings: Dedicated workspace-views page
  - ✅ Default view selector in workspace header
  - ✅ Full sorting/filtering support

## Planned Roadmap (2026)

### Phase 1: Q1 2026 (Complete - Mar 29, 2026) ✅ COMPLETE

**Focus**: Developer Experience & Documentation + Pro Features + Org Structure + Enterprise Auth + Worklog

**Tasks**:

- ✅ Complete developer documentation
- ✅ Create codebase summary
- ✅ Establish code standards
- ✅ System architecture diagrams
- ✅ Deployment guide
- ✅ Analytics Dashboard Pro feature (backend + frontend + tests + code review fixes)
- ✅ Custom Dashboard Feature (i18n + comprehensive testing + fixes)
- ✅ Dashboard V2 implementation & testing (8 phases, 52 contract tests, code review fixes)
- ✅ Department & Staff Management (models, APIs, workspace settings UI, bulk import/export)
- ✅ Swing SSO Authentication (5 config keys, provider, admin UI, frontend integration)
- ✅ Admin User Management (backend APIs, admin UI, CRUD workflows)
- ✅ Worklog (Time Tracking) complete implementation (9 phases, backend + frontend + i18n + feature flags)
- ✅ Remove None Priority feature (4-level priority system, data migration 0131)
- ✅ Opinion removal (complete feature sunset, data migration 0134)
- ✅ Spreadsheet enhancements (non-sortable columns, sort order fixes)
- ✅ Module activity tracking (activity stream + frontend rendering)
- ✅ Default view enhancements (project lead display, default view per project)
- 🔄 ESLint enforcement migration (deferred to Q2)
- 🔄 TypeScript strict mode rollout (deferred to Q2)

**Success Metrics**:

- All docs under 800 LOC
- 100% TypeScript in new code
- All monorepo packages documented

### Phase 2: Q2 2026 (Apr - Jun 2026)

**Focus**: Advanced Features & AI Integration

**Planned Features**:

**Issue Management Enhancements**:

- AI-powered issue summarization
- Suggested issue templates
- Auto-categorization of incoming issues
- Smart duplicate detection

**Automation & Workflows**:

- Custom workflow builder (no-code)
- Conditional rules engine
- Auto-assignment based on rules
- Bulk operations API

**Performance Improvements**:

- GraphQL API (alongside REST)
- Query response caching
- Pagination optimization
- Search index improvements

**Timeline**: 8-10 weeks development

### Phase 3: Q3 2026 (Jul - Sep 2026)

**Focus**: Enterprise Features & Compliance

**Planned Features**:

**Advanced Permission System**:

- Fine-grained resource-level permissions
- Custom role builder
- Permission delegation
- Audit trail enhancements

**Data & Compliance**:

- HIPAA compliance mode
- SOC2 Type II certification
- Data residency options
- GDPR data export/deletion API

**Integrations**:

- Jira migration tool
- GitHub Actions integration
- Slack command support
- Linear API compatibility mode

**Timeline**: 12 weeks development

### Phase 4: Q4 2026 (Oct - Dec 2026)

**Focus**: Mobile Apps & Offline Support

**Planned Initiatives**:

**Native Mobile Apps**:

- iOS app (React Native)
- Android app (React Native)
- Offline-first sync
- Push notifications

**Desktop App**:

- Electron-based desktop client
- Offline work with sync
- System notifications
- Quick capture widget

**Timeline**: 16 weeks development

## Current Gaps & Improvement Areas

### Documentation Gaps

| Gap                                 | Impact | Priority | Timeline |
| ----------------------------------- | ------ | -------- | -------- |
| API endpoint documentation          | Medium | High     | Q1 2026  |
| Database schema docs                | Low    | Medium   | Q2 2026  |
| Troubleshooting guide               | Medium | High     | Q1 2026  |
| Performance tuning guide            | Low    | Medium   | Q2 2026  |
| Migration guides (from Jira/Linear) | High   | High     | Q3 2026  |

### Code Quality Improvements

| Area                       | Current      | Target      | Timeline |
| -------------------------- | ------------ | ----------- | -------- |
| **Test Coverage**          | 65%          | 85%         | Q2 2026  |
| **TypeScript Strict Mode** | 40% of files | 100%        | Q2 2026  |
| **Component File Size**    | Avg 180 LOC  | Max 150 LOC | Q1 2026  |
| **Storybook Coverage**     | 45%          | 80%         | Q2 2026  |
| **E2E Test Coverage**      | 30%          | 60%         | Q2 2026  |

### Performance Areas

| Metric                        | Current | Target | Timeline |
| ----------------------------- | ------- | ------ | -------- |
| **Page Load Time**            | <2.5s   | <1.5s  | Q2 2026  |
| **API Response Time (p95)**   | <1s     | <500ms | Q2 2026  |
| **WebSocket Sync Latency**    | <500ms  | <200ms | Q3 2026  |
| **Database Query Time (p95)** | <200ms  | <100ms | Q2 2026  |
| **Bundle Size (gzipped)**     | 480KB   | 350KB  | Q1 2026  |

## Technical Debt Backlog

### High Priority (Address in Q1-Q2)

1. **Legacy API Endpoints** (plane/app/\*)
   - Status: Migrate to v1 endpoints
   - Effort: 40 hours
   - Impact: Simplifies codebase, better maintainability

2. **UI Library Migration**
   - Status: Move from @plane/ui to @plane/propel
   - Effort: 60 hours across all apps
   - Impact: Modern components, better UX

3. **Database Query Optimization**
   - Status: Add missing indexes
   - Effort: 20 hours
   - Impact: Faster queries (20-30% improvement expected)

### Medium Priority (Q2-Q3)

4. **Redux → MobX State Management**
   - Some legacy Redux stores still exist
   - Effort: 30 hours
   - Impact: Unified state management

5. **Component Testing**
   - Increase from current 30% to 60% coverage
   - Effort: 80 hours
   - Impact: Catch regressions early

6. **Accessibility Audit**
   - Full WCAG AA compliance check
   - Effort: 20 hours
   - Impact: Better for all users

### Low Priority (Q3-Q4)

7. **Python Dependency Updates**
   - Keep Django, DRF, other deps current
   - Effort: Ongoing (5 hours/quarter)
   - Impact: Security & stability

## Dependencies & Constraints

### External Dependencies

**Critical** (must maintain):

- GitHub (OAuth, GitLab integration)
- Google (OAuth, optional features)
- SendGrid/SMTP (email notifications)
- AWS S3 / MinIO (file storage)

**Important** (helpful but optional):

- Slack (notifications)
- OpenAI (AI features, optional)
- Sentry (error tracking, optional)
- PostHog (analytics, optional)

### Technical Constraints

**Maintained**:

- PostgreSQL 15.7+ (no downgrades)
- Redis 7.2+ (cache & sessions)
- RabbitMQ 3.13.6+ (message queue)
- Node.js 18+ LTS (frontend)
- Python 3.9+ (backend)

**Browser Support**:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- No IE 11 support

## Community & Contributor Priorities

### For Contributors (Issues/PRs Needed)

**High Priority**:

1. Test coverage improvements
2. Documentation enhancements
3. Accessibility (a11y) improvements
4. Performance optimizations
5. Bug fixes

**Medium Priority**:

1. UI/UX improvements
2. Translation contributions
3. Feature requests
4. Code cleanup

**Community Channels**:

- GitHub Discussions: Feature ideas, general questions
- GitHub Issues: Bug reports, feature requests
- Discord: Community chat, quick support
- Twitter: Announcements, news

## Success Metrics

### Product Metrics

| Metric                      | Target           | Status                        |
| --------------------------- | ---------------- | ----------------------------- |
| **GitHub Stars**            | 75K by Q4        | On track (50K as of Feb 2026) |
| **Self-hosted Deployments** | 10K+             | Growing                       |
| **Active Users**            | 100K+            | Growing                       |
| **Community Contributors**  | 500+             | 350+ currently                |
| **Integration Ecosystem**   | 20+ integrations | 12 currently                  |

### Engineering Metrics

| Metric                | Target  | Current |
| --------------------- | ------- | ------- |
| **Test Coverage**     | 85%     | 65%     |
| **Build Time**        | <10min  | 8min    |
| **Deployment Time**   | <5min   | 4min    |
| **Incident Response** | <1hr    | <30min  |
| **Release Cycle**     | 2 weeks | 2 weeks |

### User Experience Metrics

| Metric                      | Target | Current |
| --------------------------- | ------ | ------- |
| **Page Load Time (p95)**    | <1.5s  | 2s      |
| **API Response Time (p95)** | <500ms | 800ms   |
| **WebSocket Latency**       | <200ms | 400ms   |
| **Error Rate**              | <0.1%  | 0.05%   |
| **Uptime SLA**              | 99.9%  | 99.95%  |

## Decision Log

### Recent Decisions (Feb 2026)

**Decision 1**: Migrate from @plane/ui to @plane/propel

- **Date**: 2026-02-01
- **Reason**: Modern components, better accessibility
- **Timeline**: Q1-Q2 2026
- **Owner**: Design system team

**Decision 2**: Implement strict TypeScript mode

- **Date**: 2026-02-05
- **Reason**: Catch bugs earlier, better DX
- **Timeline**: Start Q1, complete Q2
- **Owner**: Infra team

**Decision 3**: Establish 800 LOC file size limit

- **Date**: 2026-02-10
- **Reason**: Improve code maintainability, easier reviews
- **Timeline**: Enforce starting Q1
- **Owner**: All teams

### Architecture Decisions

**CRDT for Real-time**:

- Rationale: Conflict-free sync without central authority
- Alternative considered: Operational Transformation (OT)
- Decision made: Q4 2024, still valid

**Monorepo Structure**:

- Rationale: Shared types/utils, unified tooling
- Alternative considered: Separate repos
- Decision made: v1.0, enabling faster iteration

**PostgreSQL + MongoDB**:

- Rationale: ACID compliance + flexible schema
- Alternative considered: MongoDB-only, PostgreSQL-only
- Decision made: v1.0, works well

## Risk Assessment

### Technical Risks

| Risk                           | Likelihood | Impact | Mitigation                                     |
| ------------------------------ | ---------- | ------ | ---------------------------------------------- |
| Database scaling bottleneck    | Medium     | High   | Query optimization, read replicas (planned Q3) |
| Real-time sync issues at scale | Low        | High   | CRDT robustness tested, Redis pub-sub          |
| WebSocket connection drops     | Low        | Medium | Reconnection logic, local queue                |
| API rate limiting issues       | Low        | Medium | Implement token bucket algorithm (Q2)          |

### Business Risks

| Risk                       | Likelihood | Impact | Mitigation                             |
| -------------------------- | ---------- | ------ | -------------------------------------- |
| Competitor emergence       | Medium     | High   | Continuous innovation, community focus |
| Key contributor departure  | Low        | Medium | Cross-training, documentation          |
| Security vulnerability     | Low        | High   | Regular audits, bounty program         |
| License enforcement issues | Low        | Medium | Legal review, AGPLv3 compliance        |

## How to Contribute

### Getting Started

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Review [code standards](./code-standards.md)
3. Pick issue from GitHub (label: `good-first-issue`)
4. Read related docs in `./docs`
5. Set up local dev environment (see [deployment-guide.md](./deployment-guide.md))

### Contribution Types

**Code**:

- Bug fixes (send PR directly)
- Features (discuss in issue first)
- Tests (always welcome)
- Performance (always welcome)

**Non-Code**:

- Documentation (always welcome)
- Translations (if language support exists)
- Issues/bug reports (template provided)
- Design feedback

### Review Process

1. Submit PR with description
2. Automated checks (lint, test, build)
3. Code review (48-72 hour SLA)
4. Merge when approved
5. Deploy to staging
6. Deploy to production

---

**Document Location**: `/Volumes/Data/SHBVN/plane.so/docs/project-roadmap.md`
**Lines**: ~450
**Status**: Final
**Last Review**: 2026-02-13
**Next Review**: 2026-03-13 (monthly)
