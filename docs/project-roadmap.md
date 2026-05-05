# Project Roadmap

## Current Status (2026-04-02)

**Overall Progress:** 75% complete
**Next Release:** May 2026 (v0.20)
**Maintenance:** Workflows stable, Time Tracking in refinement, HO improvements planned

## Active Development Phases

### Phase 1: Workflow Refinement (95% Complete)

**Status:** Nearing Completion
**Target:** Mid-April 2026

**Completed:**

- ✅ Core workflow state management (MobX store)
- ✅ Workflow transition validation (backend)
- ✅ Kanban drag-and-drop with workflow rules
- ✅ Blocked transition error handling
- ✅ Workflow blocker modal UI
- ✅ Workflow persistence (database models)
- ✅ CE store pattern implementation
- ✅ Workspace default views feature
- ✅ Workflow rule editing UI (project settings)

**In Progress:**

- 🔄 Transition approval workflows (optional refinement)

**Blocked:**

- ❌ Workflow analytics dashboard (depends on Analytics phase)

**Success Criteria:**

- All workflow states persist correctly
- Invalid transitions are blocked + user notified
- Kanban board updates reflect workflow rules
- <100ms validation latency

### Phase 2: Time Tracking Enhancement (65% Complete)

**Status:** Active Development
**Target:** End of May 2026

**Completed:**

- ✅ Time log model + serializers
- ✅ Log time UI (modal form)
- ✅ Time estimate + actual hours display
- ✅ Issue time summary card
- ✅ Celery tasks for time reports

**Completed (added):**

- ✅ Workspace-level time tracking (3 tabs: Timesheet, Analytics, Capacity) at workspace scope

**In Progress:**

- 🔄 Time tracking analytics (sprint burndown, velocity)
- 🔄 Timesheet reports (weekly, monthly)
- 🔄 Team capacity planning UI

**Blocked:**

- ❌ Integrations with external time tracking (JIRA, Harvest)

**Success Criteria:**

- Users can log hours per issue
- Time estimates vs actual hours tracked
- Weekly timesheet generation
- Analytics dashboard queryable

### Phase 3: Organization Chart (HO) Enhancements (70% Complete)

**Status:** Feature Development
**Target:** Mid-May 2026

**Completed:**

- ✅ Org hierarchy data model
- ✅ HO MobX store implementation
- ✅ Tree view rendering
- ✅ Column-specific sorting
- ✅ Multi-select filtering

**In Progress:**

- 🔄 Org chart visualization (Mermaid/D3.js)
- 🔄 Department management UI
- 🔄 Role hierarchy assignment
- 🔄 Drill-down analytics (by team, role)

**Planned:**

- 📋 Org chart export (PDF, PNG)
- 📋 Approval workflows for org changes

**Success Criteria:**

- Full org hierarchy visualized
- Multi-level filtering working
- <500ms render for 1000+ employees
- Column sorting respects soft-deleted records

### Phase 4: Analytics Dashboard (55% Complete)

**Status:** Feature Development
**Target:** May-June 2026

**Completed:**

- ✅ Analytics data model + Celery tasks
- ✅ Basic query endpoints (v0, v1)
- ✅ Dashboard UI components (charts, tables)
- ✅ Sprint burndown charts
- ✅ Velocity tracking

**In Progress:**

- 🔄 Team productivity metrics
- 🔄 Custom report builder
- 🔄 Analytics store (MobX) integration

**Planned:**

- 📋 Custom report builder
- 📋 Scheduled report delivery (email)
- 📋 Export to PDF/Excel

**Success Criteria:**

- Real-time project metrics
- Trend analysis (30, 90 day views)
- Team productivity insights
- <1s chart render time

### Phase 5: Performance & Stability (45% Complete)

**Status:** Ongoing
**Target:** Continuous

**Completed:**

- ✅ Kanban virtualization (Atlaskit pragmatic DnD)
- ✅ Redis caching layer
- ✅ Database query optimization
- ✅ Read-replica routing middleware

**In Progress:**

- 🔄 Frontend bundle optimization
- 🔄 API response time reduction (target <200ms p95)
- 🔄 WebSocket performance tuning
- 🔄 Celery task prioritization

**Planned:**

- 📋 Load testing suite (k6)
- 📋 APM integration (DataDog)
- 📋 Browser performance monitoring

**Success Criteria:**

- API p95 latency: <200ms
- Kanban render: <1s for 500 issues
- Bundle size: <250KB (gzipped)
- Core Web Vitals: All "Good"

## Upcoming Phases (Q2-Q3 2026)

### Phase 6: Advanced Filtering & Search (Planned Q2)

**Features:**

- 📋 Advanced JQL-like query builder
- 📋 Saved filter sets per user
- 📋 Full-text search (Elasticsearch)
- 📋 Filter suggestions (AI)

### Phase 7: Real-Time Collaboration v2 (Planned Q2-Q3)

**Features:**

- 📋 Live cursor positions (Y.js Awareness)
- 📋 Presence indicators (who's editing)
- 📋 Comment threading with real-time sync
- 📋 Conflict resolution UI

### Phase 8: Mobile App (Planned Q3)

**Platforms:**

- 📋 React Native (iOS + Android)
- 📋 Offline-first syncing
- 📋 Push notifications

### Phase 9: AI Features (Planned Q3+)

**Features:**

- 📋 Issue auto-categorization
- 📋 Description auto-generation
- 📋 Smart assignment suggestions
- 📋 Burndown prediction

## Known Issues & Blockers

### Critical (Fix Immediately)

| Issue | Impact | Status   |
| ----- | ------ | -------- |
| N/A   | —      | ✅ Clear |

### High Priority (Fix Soon)

| Issue                                             | Impact                 | Owner               | ETA        |
| ------------------------------------------------- | ---------------------- | ------------------- | ---------- |
| Workflow validation timing out on bulk operations | Performance regression | @backend-team       | 2026-04-15 |
| WebSocket reconnection lag (live edits)           | Real-time sync delays  | @live-team          | 2026-04-20 |
| Time tracking decimals rounding (8.5h → 8.4h)     | Reporting inaccuracy   | @time-tracking-team | 2026-04-10 |

### Medium Priority (Plan Next)

| Issue                                             | Impact             | Owner           | ETA        |
| ------------------------------------------------- | ------------------ | --------------- | ---------- |
| Org chart sorting inconsistency with soft-deletes | UX confusion       | @ho-team        | 2026-05-01 |
| Analytics queries slow on large projects          | Dashboard load >3s | @analytics-team | 2026-05-15 |

### Low Priority (Backlog)

| Issue                                | Impact       | Owner          |
| ------------------------------------ | ------------ | -------------- |
| Deprecated API endpoints (v0 subset) | Tech debt    | @api-team      |
| Legacy UI component cleanup          | Code quality | @frontend-team |

## Dependencies & Milestones

```
Q1 2026 (Jan-Mar)
├── Workflows v1 ✅ DONE
└── CE Store Pattern ✅ DONE

Q2 2026 (Apr-Jun)
├── Workflows v1.0 (Apr 15) ✅ NEAR COMPLETION
├── Time Tracking v1 (Apr 30) 🔄 IN PROGRESS
├── HO Enhancements (May 31) 🔄 IN PROGRESS
├── Analytics Dashboard (Jun 30) 🔄 IN PROGRESS
└── Performance Optimization 🔄 ONGOING

Q3 2026 (Jul-Sep)
├── Real-Time Collab v2 (Aug 31) 📋 PLANNED
├── Mobile App MVP (Sep 30) 📋 PLANNED
└── AI Features Phase 1 (Sep 30) 📋 PLANNED

Q4 2026 (Oct-Dec)
├── Advanced Search (Oct 31) 📋 PLANNED
├── Mobile iOS Release (Nov 30) 📋 PLANNED
└── AI Features Phase 2 (Dec 31) 📋 PLANNED
```

## Feature Parity with Makeplane/Plane

### Upstream (Makeplane) Features

| Feature               | Status      | Notes                                      |
| --------------------- | ----------- | ------------------------------------------ |
| **Issue Management**  | ✅ Upstream | List, Kanban, Gantt, Calendar, Spreadsheet |
| **Projects & Cycles** | ✅ Upstream | Standard project management                |
| **Pages (Wiki)**      | ✅ Upstream | Markdown-based wiki pages                  |
| **Modules**           | ✅ Upstream | Feature grouping                           |
| **Integrations**      | ⚠️ Partial  | JIRA, GitHub, Slack (basic)                |
| **Custom States**     | ✅ Upstream | Workflow states per project                |

### Shinhan Customizations (CE)

| Feature                      | Status    | Completion                                  |
| ---------------------------- | --------- | ------------------------------------------- |
| **Workflows**                | ✅ Done   | 95% (refinements in progress)               |
| **Time Tracking**            | 🔄 Active | 70% (analytics & reports in progress)       |
| **Org Chart (HO)**           | 🔄 Active | 75% (visualization & analytics in progress) |
| **Analytics Dashboard**      | 🔄 Active | 55% (UI components, burndown charts done)   |
| **Task Categories**          | ✅ Done   | 100%                                        |
| **Monitoring Dashboard**     | ✅ Done   | 100%                                        |
| **Multi-Workspace**          | ✅ Done   | 100%                                        |
| **RBAC (Workspace/Project)** | ✅ Done   | 100%                                        |

## Release Schedule

### v0.20 (May 2026) — Time Tracking & HO

**Features:**

- Time Tracking v1.0 (estimate + log hours, reports)
- Org Chart enhancements (visualization, filtering)
- Workflow rule UI improvements
- Performance optimizations

**Breaking Changes:** None expected

**Migration Guide:** N/A

### v0.21 (June 2026) — Analytics

**Features:**

- Analytics dashboard (sprint, team, project views)
- Advanced filtering with saved filters
- Report export (PDF, CSV, Excel)

**Breaking Changes:** None expected

### v0.22 (July 2026) — Real-Time v2

**Features:**

- Live cursors (Y.js Awareness)
- Presence indicators
- Comment threading with real-time sync
- Conflict resolution UI

**Breaking Changes:** WebSocket protocol change (compatible upgrade)

## Success Metrics

### User Adoption

| Metric                   | Target | Current | Status      |
| ------------------------ | ------ | ------- | ----------- |
| **Monthly Active Users** | 500+   | 350     | 📈 On track |
| **Workspace Creation**   | 100+   | 75      | 📈 On track |
| **Daily Active Users**   | 300+   | 200     | 📈 On track |

### Performance

| Metric              | Target           | Current | Status                |
| ------------------- | ---------------- | ------- | --------------------- |
| **API p95 Latency** | <200ms           | 250ms   | ⚠️ Needs optimization |
| **Frontend Bundle** | <250KB           | 280KB   | ⚠️ Needs optimization |
| **Kanban Render**   | <1s (500 issues) | 1.2s    | ⚠️ Needs optimization |
| **Uptime**          | 99.5%            | 99.6%   | ✅ Exceeds target     |

### Quality

| Metric                  | Target | Current | Status            |
| ----------------------- | ------ | ------- | ----------------- |
| **Test Coverage**       | >80%   | 78%     | 📈 On track       |
| **Bug Resolution (p0)** | <24h   | 18h     | ✅ Exceeds target |
| **Code Review Time**    | <24h   | 20h     | ✅ Exceeds target |

## Staffing & Ownership

| Component            | Owner          | Team Size | Capacity |
| -------------------- | -------------- | --------- | -------- |
| **Backend (Django)** | @backend-team  | 3         | 80%      |
| **Frontend (React)** | @frontend-team | 4         | 75%      |
| **Real-Time (Live)** | @live-team     | 1         | 60%      |
| **Devops/Infra**     | @devops-team   | 2         | 50%      |
| **QA/Testing**       | @qa-team       | 2         | 85%      |

## Next Steps

### This Week (Apr 2-8)

1. Complete time tracking analytics (backend)
2. Deploy HO visualization component
3. Fix workflow validation performance issue
4. Update Analytics phase documentation

### This Month (April)

1. Time Tracking v1.0 release
2. HO drill-down analytics UI
3. Performance optimization sprint
4. Q2 planning + prioritization

### Next Quarter (Q2)

1. Analytics dashboard MVP
2. Advanced filtering + saved filters
3. Real-Time Collaboration v2 architecture
4. Mobile app research + prototyping

---

**Last Updated:** 2026-04-08
**Roadmap Version:** 2.2
**Next Review:** 2026-04-30 (monthly)
