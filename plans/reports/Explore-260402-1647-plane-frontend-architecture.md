# Plane React Frontend Architecture

## 1. Project Structure

### Core Directories (apps/web/core/)
- **components/** — 51 subdirectories: issues, cycles, modules, pages, dropdowns, project, workspace, dashboard, etc.
- **store/** — 34 MobX stores: workspace, project, issue, cycle, module, cycle_filter, dashboard, editor, etc.
- **services/** — 30+ API service classes for data fetching: issue, cycle, module, workspace, project, user, etc.
- **hooks/** — 47 custom React hooks: store hooks, context hooks, UI interaction hooks
- **constants/** — Configuration & static values
- **layouts/** — Base layout components (base-layouts/)
- **types/** — TypeScript interfaces (imported from @plane/types)
- **lib/** — Utilities: store-context, local-storage, wrappers, app-rail

### Community Edition Overrides (apps/web/ce/)
Selectively overrides core functionality for Shinhan customizations:
- **components/** — 44 subdirectories: ho (Hierarchical Org), time-tracking, workflow, bank-wide-projects, dashboards, etc.
- **store/** — 25 stores: workflow, task-category, ho (HO department views), project-inbox, module-activity, etc.
- **services/** — 12 services: department, staff, user-worklog, project-worklog, workflow, ho-issue, etc.
- **hooks/** — 24 hooks (store/context wrappers)
- **helpers/** — Utility functions
- **types/** — Custom type extensions

**Key Insight:** CE extends CoreRootStore in `/ce/store/root.store.ts`, allowing additive features without modifying core.

---

## 2. Routing Architecture (React Router v7)

### Route Structure
- **Entry:** `/app/root.tsx` (layout) → `/app/provider.tsx` (context setup)
- **Route Files:** 
  - `app/routes/core.ts` — Upstream shared routes
  - `app/routes/extended.ts` — CE-specific route additions

### Key Route Groups
```
(home)/                              ← Landing page
(all)/                               ← Auth gate
  [workspaceSlug]/                   ← Workspace context
    (projects)/                      ← Sidebar + navigation
      projects/(detail)/[projectId]/
        issues/                      ← Issue list/kanban/gantt/calendar
        cycles/                      ← Sprint management
        modules/                     ← Feature releases
        pages/                       ← Wiki/docs
        views/                       ← Custom filtered views
        archives/                    ← Archived cycles/modules
    (settings)/                      ← Settings group
      settings/(workspace)/          ← Workspace settings
      settings/projects/[projectId]/ ← Project automation, workflows
```

### Layout Pattern
```tsx
AppHeader (page-specific header) + ContentWrapper + Outlet
```
**Rule:** No inline headers in page.tsx; use layout.tsx.

---

## 3. State Management (MobX)

### Architecture
**CoreRootStore** (33+ stores) ← **RootStore** (CE extends in `ce/store/root.store.ts`)

### Core Stores (core/store/)
| Store | Purpose |
|-------|---------|
| **WorkspaceRootStore** | Workspaces, sidebar favorites, notifications |
| **ProjectRootStore** | Projects, members, labels, estimates |
| **IssueRootStore** | Issues by workspace/project/cycle/module, issue details, calendar/kanban/gantt views |
| **CycleStore** | Sprint/cycle CRUD and filtering |
| **ModuleStore** | Feature release CRUD |
| **ProjectViewStore** | Custom filtered views (saved filters) |
| **GlobalViewStore** | Organization-wide saved filters |
| **DashboardStore** | Dashboard widgets, layouts |
| **UserStore** | Auth user, preferences |
| **AnalyticsStore** | App analytics events |
| **RouterStore** | Current route state |
| **ThemeStore** | Dark mode preference |
| **Editor stores** | Rich text editor assets |
| **InboxStore** | Project inbox issues |

### CE Stores (ce/store/)
- **WorkflowStore** — Shinhan workflow state transitions & rules
- **TaskCategoryStore** — Work item categorization
- **HOStore** — Hierarchical organization (departments/staff)
- **ModuleActivityStore** — CE module enhancements
- **DashboardStores** — CE dashboard widgets

### Store Pattern
```typescript
class MyStore implements IMyStore {
  dataMap: Record<string, IModel> = {};
  loader = false;
  
  constructor(private rootStore: CoreRootStore) {
    makeObservable(this, {
      dataMap: observable,
      loader: observable,
      fetchItems: action,
    });
  }
  
  fetchItems = async (slug: string) => {
    this.loader = true;
    try {
      const data = await service.list(slug);
      runInAction(() => {
        data.forEach(item => set(this.dataMap, item.id, item));
      });
    } finally {
      runInAction(() => { this.loader = false; });
    }
  };
}
```

**Key Rules:**
- Always `makeObservable()` (never auto)
- Always `runInAction()` for async observable updates
- Use `set()` from lodash-es for dynamic record keys
- Wrap components with `observer()`

### Data Fetching Strategy
- **SWR** (useSWR) — Read-only, component-local, cached
- **Store.fetchX()** — Mutations, shared state across components

---

## 4. Key UI Components & Pages

### Issue Management (Cornerstone)
**issue-layouts/** — Multiple views under single store:
- **List** — Spreadsheet-like, draggable rows, filters
- **Kanban** — Column-per-status with drag-drop (Atlaskit dnd)
- **Gantt** — Timeline view with dependency lines & date drag
- **Calendar** — Day/week grid
- **Spreadsheet** — Data table with properties (TanStack Table)
- **Properties** — Inline edit issue fields (assignee, status, priority, labels, cycle, module, etc.)

**issue-modal/** — Modal/drawer for issue detail editing
- Full issue context via `useIssueDetail` hook
- Real-time collaboration ready (WebSocket hooks exist)

### Projects
- Project list/grid, project settings, members, automation/workflows
- CE extends with: bank-wide-projects (multi-project dashboard)

### Workspace
- Sidebar with favorites, workspaces, projects
- Settings: members, invitations, integration, webhooks
- CE extends with: HO (hierarchical organization, departments, staff)

### Cycles (Sprints)
- Active cycles, cycle archive, cycle detail with issue views
- Cycle filter store for user preferences

### Modules (Features)
- Module list with issue management
- Module details, dependencies
- CE extends with module activity tracking

### Pages (Wiki/Documentation)
- Project page listing with tree hierarchy
- Page editor with rich text (@plane/editor)
- CE extends with collaborative page actions

### Views
- Custom filtered views (saved filter sets)
- Global views (workspace-level)
- Project views (project-level)

### Additional Features
- **Drafts** — Workspace-level unpublished issues
- **Inbox** — Issue notifications, quick triage
- **Archives** — Soft-deleted cycles, modules, issues
- **Dashboard** — Widget-based workspace overview
- **Time Tracking** (CE) — Worklog per issue/user
- **Workflow** (CE) — State transition rules, automation
- **Analytics** (CE) — Issue/project analytics

---

## 5. Services Layer

### Core Services (core/services/)
| Service | Purpose |
|---------|---------|
| **api.service.ts** | Base HTTP client (Axios) |
| **auth.service.ts** | Login, signup, SSO |
| **issue/** | Issue CRUD, sub-issues, relations, links, attachments |
| **cycle/** | Cycle/sprint CRUD |
| **module/** | Module CRUD |
| **project/** | Project CRUD, members, states |
| **workspace/** | Workspace CRUD, members |
| **user/** | User profile, preferences |
| **dashboard/** | Dashboard widgets |
| **file-upload/** | Image/file uploads (Multer) |
| **integrations/** | GitHub, Slack, etc. |
| **inbox/** | Project inbox |

### CE Services (ce/services/)
- **workflow.service.ts** — Workflow rules, transitions
- **department.service.ts** — HO department CRUD
- **staff.service.ts** — HO staff management
- **project-worklog.service.ts** — Time tracking
- **ho-issue.service.ts** — HO-specific issue queries

---

## 6. Hooks Patterns (47 core hooks)

### Store Access Hooks
```typescript
const useStore = () => useContext(StoreContext).store;
const useWorkspace = () => useStore().workspaceRoot;
const useProject = () => useStore().projectRoot.projects[slug];
```

### Auto-Save & Form Hooks
- `use-auto-save.tsx` — Debounced mutations
- `react-hook-form.helper.ts` — Form validation patterns

### UI Interaction Hooks
- `use-dropdown.ts` — Click-outside, key navigation
- `use-expandable-search.ts` — Expandable search fields
- `use-app-router.tsx` — React Router integration

### Drag-n-Drop Hooks
- `use-collaborative-page-actions.tsx` — Page tree drag
- **Atlaskit PDnD** for issue kanban/gantt (no React DnD)

---

## 7. Notable Features & Architecture Decisions

### Drag-n-Drop
- **Atlaskit Pragmatic Drag and Drop** — Modern, battle-tested
- Used in: Kanban board, Gantt dependencies, Page tree, Favorite sidebar, State ordering
- **Why not React DnD:** Simpler API, better accessibility, lower bundle

### Real-Time Collaboration
- Infrastructure exists but minimal usage in explored code
- `useCollaborativePage` hook pattern ready
- WebSocket hooks prepared for future features
- Comlink used for web worker communication

### Workflows (CE Feature)
- **TaskCategoryStore** — Categorize work items
- **WorkflowStore** — Define state transition rules
- **WorkflowBlockerModal** — Prevent invalid state transitions
- **Visual Workflow Editor** — Drag-drop state diagram
- Activity log for audit trail

### Time Tracking (CE Feature)
- `project-worklog.service.ts` — Hours logged per issue
- `user-worklog.service.ts` — User timesheets
- Dashboard widgets for tracking

### Bank-Wide Features (CE)
- **bank-wide-projects** — Cross-project dashboard
- **HO (Hierarchical Organization)** — Org chart, department views
- **Analytics** — Custom report builders

### Accessibility
- Semantic HTML, ARIA labels (via i18n `t("aria.*")`)
- Keyboard navigation (Tab, arrow keys, Escape)
- React Router v7 focus management

### i18n (Internationalization)
- **@plane/i18n** — EN, KO, VI translations
- Translation keys in `packages/i18n/src/locales/{lang}/translations.ts` (TypeScript, not JSON)
- ALL visible text uses `t()` function

### Semantic Color Tokens (Tailwind v4)
- **Text:** `text-primary`, `text-secondary`, `text-tertiary` (no `text-color-*`)
- **Background:** `bg-canvas`, `bg-surface-1`, `bg-layer-2` (inputs only)
- **Border:** `border-subtle`, `border-strong`
- Dark mode via `data-theme` attribute (no `dark:` variants)

### Component Libraries
- **@plane/propel** — New UI components (Button, Input, Dialog, Toast, Menu)
- **@plane/ui** — Legacy components (CustomMenu, Breadcrumbs, ContentWrapper)
- **Search before build rule** — Always check if component exists before creating

---

## 8. File Organization & Naming

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase.tsx | `IssueList.tsx` |
| Hooks | use-kebab-case.ts | `use-dropdown.ts` |
| Stores | kebab-case.store.ts | `cycle.store.ts` |
| Services | kebab-case.service.ts | `issue.service.ts` |
| Types | kebab-case.ts | `issue.types.ts` |

**Size Limits:**
- Files: <200 lines
- Components: <150 lines
- Hooks: <100 lines

---

## 9. Tech Stack Summary

| Layer | Technologies |
|-------|--------------|
| **Framework** | React 18 + React Router v7 |
| **State** | MobX (33+ stores) |
| **Styling** | Tailwind v4 (semantic tokens) |
| **Forms** | react-hook-form (7.51.5) |
| **UI Libs** | @plane/propel, @plane/ui |
| **HTTP** | Axios + SWR |
| **i18n** | @plane/i18n (ICU MessageFormat) |
| **Drag-n-Drop** | Atlaskit Pragmatic Drag and Drop |
| **Charts** | Recharts |
| **Table** | TanStack React Table (v8) |
| **Editor** | @plane/editor (custom rich text) |
| **Build** | Vite + React Router dev |

---

## 10. Monorepo Structure (packages/)
- **@plane/types** — Shared TypeScript interfaces
- **@plane/services** — Backend API client
- **@plane/ui** — Legacy component library
- **@plane/propel** — New component library
- **@plane/i18n** — Translation system
- **@plane/editor** — Rich text editor
- **@plane/shared-state** — Shared MobX stores (e.g., WorkItemFilterStore)

---

## Architecture Strengths

1. **Scalability:** 33+ MobX stores cleanly organize complex domain logic
2. **CE Pattern:** Core/CE separation allows customizations without forking
3. **Multiple Views:** Single issue store powers list/kanban/gantt/calendar (view agnostic)
4. **Search-First:** Grep rules prevent component duplication
5. **i18n Ready:** 3-language support from day 1
6. **Semantic Design Tokens:** Dark mode & theme switching automatic
7. **Type Safety:** Full TypeScript with explicit makeObservable declarations
8. **Accessibility:** ARIA labels, keyboard navigation built in

---

## Unresolved Questions

1. **Real-Time Architecture:** WebSocket infrastructure prepared but minimal active usage—where does sync happen?
2. **Offline Mode:** Are there offline-first patterns or is it always online?
3. **Performance:** How do issue lists >1000 items handle rendering? (Pagination? Virtual scrolling?)
4. **CE Route Nesting:** How strictly enforced is the route layout nesting rule in extended.ts?
5. **SWR vs Store:** Decision tree for choosing data fetching pattern—formally documented?
6. **Workflow Evaluation:** How are workflow rules evaluated—client-side or server-side?

