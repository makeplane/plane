# Plane Frontend Apps Scout Report

Date: 2026-02-13
Version: 1.2.0
License: AGPL-3.0

## App: Web

### Structure
- **Type**: Client-side React app with React Router v7
- **Framework**: React (SSR disabled)
- **Entry Point**: `app/entry.client.tsx`
- **Root Layout**: `app/root.tsx` + `app/layout.tsx`
- **Config**: `react-router.config.ts` (appDirectory: "app", ssr: false)

**Directory Layout**:
```
apps/web/
├── app/
│   ├── (all)            # Main app routes group
│   ├── (home)           # Home/auth routes
│   ├── assets/          # Images, icons, favicons (27 dirs, 696 files)
│   ├── components/      # Reusable UI components
│   ├── error/           # Error boundary handling
│   ├── routes/          # Route definitions
│   │   ├── core.ts      # Main route config (18.5KB)
│   │   ├── extended.ts
│   │   └── helper.ts
│   ├── types/           # Type definitions
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── provider.tsx
│   ├── root.tsx
│   └── routes.ts
├── core/
│   ├── store/           # MobX state (32 stores)
│   ├── components/      # 50+ component directories
│   ├── hooks/           # Custom React hooks (49 dirs)
│   ├── services/        # API service layer (31 dirs)
│   ├── layouts/
│   ├── lib/
│   ├── constants/       # App constants
│   ├── custom-events/
│   └── types/
├── ce/                  # Community Edition features
├── styles/              # Global CSS/Tailwind
└── public/              # Static assets
```

### Dependencies (Key)
- **React**: catalog (latest)
- **React Router**: v7 with react-router@latest, @react-router/node, @react-router/dev
- **State Management**: MobX, mobx-react, mobx-utils
- **API Client**: axios, SWR
- **UI Framework**: @plane/ui, @headlessui/react, lucide-react
- **Editor**: @plane/editor, react-markdown, @react-pdf/renderer
- **Drag & Drop**: @atlaskit/pragmatic-drag-and-drop (with auto-scroll, hitbox extensions)
- **Forms**: react-hook-form (7.51.5)
- **Tables**: @tanstack/react-table (8.21.3)
- **Charts**: recharts (2.12.7)
- **Date**: date-fns (4.1.0)
- **Theming**: next-themes (0.4.6)
- **Icons**: @fontsource/material-symbols-rounded, @fontsource/ibm-plex-mono
- **Analytics**: Sentry integration
- **Dev**: Vite, TypeScript, Tailwind CSS

### Routing
**Architecture**: Hierarchical file-based routing using React Router v7
- Client-side SPA (ssr: false)
- Routes defined in code: `app/routes/core.ts` and `app/routes/extended.ts`
- Base route groups: `(home)` (auth/signup), `(all)` (main app)

**Main Route Structure**:
```
/ (home)
  - sign-up
  - accounts/forgot-password
  - accounts/reset-password
  - accounts/set-password
  - create-workspace
  - onboarding
  - invitations
  - workspace-invitations

/(all)
  [workspaceSlug]/
    active-cycles
    analytics/:tabId
    browse/:workItem
    drafts
    notifications
    profile/:userId
    [...many project routes...]
    [projectId]/
      board
      list
      calendar
      spreadsheet
      gantt
      issues
      pages
      settings
      modules
      cycles
      views
```

### State Management
**Pattern**: MobX-based centralized store with multiple domain stores

**Store Structure** (`core/store/`):
- **Root Store**: `root.store.ts`, `router.store.ts`
- **User Management**: `user/` (user auth, profile, preferences)
- **Workspace**: `workspace/` (workspace data, members, settings)
- **Project**: `project/` (project list, settings, favorites)
- **Issue Management**: `issue/` (32 issue-related stores including issue detail, filters, status)
- **Workspace Features**: 
  - `cycle.store.ts`, `cycle_filter.store.ts` (sprint/cycle management)
  - `module.store.ts`, `module_filter.store.ts` (module management)
  - `label.store.ts` (issue labels)
  - `favorite.store.ts` (favorited items)
  - `global-view.store.ts` (saved views)
  - `project-view.store.ts`
- **UI State**: `theme.store.ts`, `state.store.ts`, `analytics.store.ts`
- **Command Palette**: `base-command-palette.store.ts`, `base-power-k.store.ts`
- **Advanced**: `dashboard.store.ts`, `inbox/`, `editor/`, `pages/`, `timeline/`, `notifications/`, `estimates/`, `sticky/`

**Hook Integration**: `core/hooks/store/` exposes stores via custom hooks

### Key Features
1. **Project Management**: Workspaces, projects, issues, cycles, modules
2. **Issue Tracking**: Issue creation, detail views, status tracking, filtering
3. **Board Views**: Kanban boards, list views, calendar view, spreadsheet, Gantt, timeline
4. **Collaboration**: Real-time editor, comments, activity tracking
5. **User Management**: Authentication, profiles, invitations, workspace membership
6. **Analytics**: Dashboard, analytics views with charts
7. **Search**: Global search via command palette
8. **Customization**: Themes (light/dark/contrast), custom colors
9. **Draft Management**: Work-in-progress issues/pages
10. **Notifications**: In-app and email notifications
11. **Drag & Drop**: Task organization with pragmatic-drag-and-drop

---

## App: Admin

### Structure
- **Type**: Client-side React app with React Router v7
- **Framework**: React (SSR disabled)
- **Entry Point**: `app/entry.client.tsx`
- **Root Layout**: `app/root.tsx`
- **Config**: `react-router.config.ts` (appDirectory: "app", basename from env, ssr: false)

**Directory Layout**:
```
apps/admin/
├── app/
│   ├── (all)/
│   │   ├── (home)/          # Home page
│   │   ├── (dashboard)/     # Admin dashboard
│   │   │   ├── general/
│   │   │   ├── workspace/
│   │   │   ├── email/
│   │   │   ├── authentication/ (GitHub, GitLab, Google, Gitea)
│   │   │   ├── ai/
│   │   │   └── image/
│   │   └── layout.tsx
│   ├── assets/              # Favicon, logos
│   ├── components/          # Reusable components
│   ├── types/
│   ├── entry.client.tsx
│   └── root.tsx
├── core/
│   ├── store/               # 5 MobX stores (minimal)
│   │   ├── instance.store.ts
│   │   ├── root.store.ts
│   │   ├── theme.store.ts
│   │   ├── user.store.ts
│   │   └── workspace.store.ts
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── constants/
│   └── types/
├── ce/                      # Community Edition
├── ee/                      # Enterprise Edition
├── styles/
└── public/
```

### Dependencies (Key)
- **React**: catalog
- **React Router**: v7 with basename support for path-based deployment
- **State Management**: MobX, mobx-react
- **API Client**: axios, SWR
- **UI Framework**: @plane/ui, @headlessui/react, lucide-react
- **Forms**: react-hook-form (7.51.5)
- **Virtualization**: @tanstack/react-virtual (3.13.12)
- **Theming**: next-themes (0.4.6)
- **Dev**: Vite, TypeScript, Tailwind CSS

### Routing
**Architecture**: Simple file-based routing for admin dashboard

**Route Structure**:
```
/ (home)

/general      (instance settings)
/workspace    (workspace management)
/workspace/create
/email        (email configuration)
/authentication (OAuth setup)
  /github
  /gitlab
  /google
  /gitea
/ai           (AI feature settings)
/image        (image service settings)
```

**Configuration**: 
- Supports custom basename via `VITE_ADMIN_BASE_PATH` environment variable
- Allows deployment at sub-paths

### State Management
**Pattern**: Minimal MobX store (5 core stores)

**Store Structure** (`core/store/`):
- `instance.store.ts` - Instance configuration
- `root.store.ts` - Root store container
- `theme.store.ts` - Theme switching
- `user.store.ts` - Admin user data
- `workspace.store.ts` - Workspace management

**Note**: More focused than web app; admin-specific feature management

### Key Features
1. **Instance Management**: General instance configuration
2. **Workspace Administration**: Workspace settings, member management
3. **Email Configuration**: Email service setup
4. **Authentication**: OAuth provider setup (GitHub, GitLab, Google, Gitea)
5. **AI Integration**: AI feature configuration
6. **Image Services**: Image processing settings
7. **User Management**: Admin user profiles and permissions

---

## App: Space

### Structure
- **Type**: Full-stack React app with React Router v7 SSR
- **Framework**: React (SSR enabled)
- **Entry Point**: `app/entry.client.tsx` + server-side rendering
- **Root Layout**: `app/root.tsx`
- **Config**: `react-router.config.ts` (appDirectory: "app", basename from env, ssr: true)

**Directory Layout**:
```
apps/space/
├── app/
│   ├── [workspaceSlug]/
│   │   └── [projectId]/     # Project-specific views
│   ├── issues/
│   │   └── [anchor]/        # Public issue view via anchor
│   ├── assets/              # 14 asset directories (auth, images, logos, etc.)
│   ├── components/          # Reusable components
│   ├── compat/
│   ├── types/
│   ├── entry.client.tsx
│   ├── error.tsx
│   ├── page.tsx             # Home/index page
│   ├── not-found.tsx
│   ├── providers.tsx
│   ├── root.tsx
│   └── routes.ts
├── core/
│   ├── store/               # 14 MobX stores
│   │   ├── cycle.store.ts
│   │   ├── instance.store.ts
│   │   ├── issue.store.ts
│   │   ├── issue-detail.store.ts
│   │   ├── issue-filters.store.ts
│   │   ├── label.store.ts
│   │   ├── members.store.ts
│   │   ├── module.store.ts
│   │   ├── profile.store.ts
│   │   ├── root.store.ts
│   │   ├── state.store.ts
│   │   ├── user.store.ts
│   │   ├── publish/         # Public sharing features
│   │   └── helpers/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── layouts/
│   ├── lib/
│   ├── constants/
│   └── types/
├── ce/                      # Community Edition
├── ee/                      # Enterprise Edition
├── styles/
└── public/
```

### Dependencies (Key)
- **React**: catalog
- **React Router**: v7 with SSR enabled (@react-router/serve for server-side rendering)
- **State Management**: MobX, mobx-react, mobx-utils
- **API Client**: axios, SWR
- **UI Framework**: @plane/ui, @headlessui/react, lucide-react
- **Editor**: @plane/editor, react-markdown, react-dropzone
- **Theming**: next-themes (0.4.6)
- **Styling**: Popper.js (2.11.8), React Popper
- **Date**: date-fns (4.1.0)
- **Dev**: Vite, TypeScript, Tailwind CSS, @tailwindcss/typography

### Routing
**Architecture**: File-based routing with SSR

**Route Structure**:
```
/ (index home)

/:workspaceSlug/:projectId  (project issues board/list)

/issues/:anchor             (public issue view via anchor link)
```

**Configuration**:
- Supports custom basename via `VITE_SPACE_BASE_PATH` environment variable
- Server-side rendering enabled for better SEO and initial load performance
- Can be deployed at custom paths

### State Management
**Pattern**: MobX stores focused on public/shared content

**Store Structure** (`core/store/`):
- **Root**: `root.store.ts`
- **Content**: `issue.store.ts`, `issue-detail.store.ts`, `issue-filters.store.ts`
- **Workspace**: `cycle.store.ts`, `module.store.ts`, `members.store.ts`, `label.store.ts`
- **User**: `user.store.ts`, `profile.store.ts`
- **App State**: `state.store.ts`, `instance.store.ts`
- **Publishing**: `publish/` directory (public sharing, comments, reactions)
- **Helpers**: `helpers/` (store helper utilities)

### Key Features
1. **Public Issue Sharing**: Share issues publicly via anchor links
2. **Read-Only Views**: Browse public projects and issues
3. **Issue Filtering**: Filter issues by various criteria
4. **Public Comments**: Comments on public issues (if enabled)
5. **Project Views**: List and detail views of public projects
6. **Workspace Browsing**: Browse public workspaces
7. **Publishing Features**: Share boards, cycles, modules publicly
8. **Mobile Responsive**: Full responsive design for mobile access

---

## App: Live

### Structure
- **Type**: Backend/Real-time Collaboration Server (Node.js)
- **Framework**: Express.js + Hocuspocus (Y.js CRDT)
- **Entry Point**: `src/start.ts` (launches Server class)
- **Language**: TypeScript (compiled to ESM)

**Directory Layout**:
```
apps/live/
├── src/
│   ├── controllers/         # Request handlers (7 dirs)
│   ├── extensions/          # Hocuspocus extensions (9 dirs)
│   ├── services/            # Business logic (6 dirs)
│   ├── lib/                 # Utility libraries (7 dirs)
│   ├── schema/              # Data schemas (3 dirs)
│   ├── types/               # TypeScript types (4 dirs)
│   ├── utils/               # Helper utilities (4 dirs)
│   ├── env.ts               # Environment configuration
│   ├── hocuspocus.ts        # Hocuspocus server setup
│   ├── instrument.ts        # Sentry instrumentation
│   ├── redis.ts             # Redis connection manager
│   ├── server.ts            # Express server (3.9KB)
│   └── start.ts             # Entry point
├── tests/                   # Vitest test suite
├── tsdown.config.ts         # Bundler config
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

### Dependencies (Key)
- **Server**: Express.js with express-ws for WebSocket support
- **Real-time Collaboration**: @hocuspocus/server (2.15.2) - CRDT server
  - Extensions: @hocuspocus/extension-database, extension-logger, extension-redis
  - Transformer: @hocuspocus/transformer (for data conversion)
- **Document Format**: Y.js (13.6.20) - CRDT library
  - y-prosemirror (1.3.7) - ProseMirror/TipTap integration
  - y-protocols (1.0.6) - Protocol handlers
- **Editor Integration**: @tiptap/core, @tiptap/html (@plane packages)
- **Message Queue/Pub-Sub**: Redis via ioredis (5.7.0)
- **Security**: helmet (7.1.0)
- **Compression**: compression (1.8.1)
- **CORS**: cors (2.8.5)
- **API Client**: axios
- **Error Tracking**: @sentry/node, @sentry/profiling-node
- **PDF Export**: @react-pdf/renderer (4.3.0), sharp (0.34.3)
- **Effect System**: effect (3.16.3), @effect/platform, @effect/platform-node (functional programming)
- **Validation**: zod (3.25.76)
- **Testing**: Vitest (4.0.8), pdf-parse for tests
- **Build**: tsdown (monorepo bundler)
- **Dev**: TypeScript, ESM module system

### Routing
**Architecture**: Express.js REST + WebSocket via Hocuspocus

**Routes** (controller-based):
```
Base Path: env.LIVE_BASE_PATH

/documents/:documentId  (WebSocket - Hocuspocus CRDT sync)
/[other_controllers]/   (REST endpoints)
```

**Hocuspocus Features**:
- WebSocket connection for real-time document sync
- Database persistence via extension
- Redis pub-sub for distributed syncing
- Logging for debugging

### State Management
**Pattern**: No client-side state store (server-side focus)

**Server State**:
- Hocuspocus document state (Y.js CRDT)
- Redis cache for distributed systems
- In-memory connections manager

### Key Features
1. **Real-time Collaboration**: WebSocket-based collaborative editing
2. **CRDT-based Sync**: Y.js CRDT for conflict-free synchronization
3. **Editor Integration**: Works with TipTap/ProseMirror editors
4. **Distributed System**: Redis pub-sub for horizontal scaling
5. **Database Persistence**: Stores document state in database
6. **Rich Text Support**: Full rich text editing with transformers
7. **PDF Export**: Server-side PDF generation from documents
8. **Error Handling**: Graceful shutdown, signal handling
9. **Security**: CORS, helmet for security headers
10. **Logging**: Comprehensive logging with Sentry integration
11. **Monitoring**: Effect-based error and resource tracking

---

## Cross-App Architecture

### Shared Dependencies
- **@plane/ui**: Shared UI component library
- **@plane/types**: Shared TypeScript type definitions
- **@plane/utils**: Shared utilities
- **@plane/services**: Shared API service layer
- **@plane/hooks**: Shared React hooks
- **@plane/constants**: Constants (SITE_NAME, SITE_DESCRIPTION)
- **@plane/editor**: Rich text editor implementation
- **@plane/i18n**: Internationalization (web, space)
- **@plane/propel**: Custom utilities/extensions
- **@plane/shared-state**: Shared state management (@plane/shared-state)
- **@plane/decorators**: Decorators for live app

### Architecture Pattern
1. **Web App**: Main workspace/project management UI (most complex)
2. **Admin App**: System administration dashboard (minimal feature set)
3. **Space App**: Public sharing portal with SSR (simplified feature set)
4. **Live App**: Backend service for real-time collaboration (server-side only)

### Tech Stack Summary
- **Frontend Build**: React Router v7 + Vite
- **State Management**: MobX across all client apps
- **API**: Axios + SWR for data fetching
- **Real-time**: Hocuspocus + Y.js for CRDT
- **Styling**: Tailwind CSS + custom themes
- **Icons**: Lucide React + Material Symbols
- **Deployment**: Docker support, environment-based configuration

---

## Key Observations

### 1. Modular Monorepo Structure
- Shared workspace packages (@plane/*)
- Feature parity between web/space with differences in scope
- Live service fully separated (Node.js backend)

### 2. MobX State Management
- Extensive store hierarchy in web app (32 stores)
- Simplified in admin (5 stores)
- Space app balances both (14 stores)
- Hooks for store access (`core/hooks/store/`)

### 3. Routing Architecture
- React Router v7 file-based routing
- Web & Admin: Client-side SPA (no SSR)
- Space: Server-side rendering for public sharing
- Hierarchical parameter-based routes

### 4. Real-time Collaboration
- Hocuspocus + Y.js CRDT for conflict-free sync
- Redis for pub-sub in distributed systems
- WebSocket integration via express-ws

### 5. Development Philosophy
- TypeScript throughout
- Tailwind CSS for styling
- Extensive componentization
- Service layer abstraction for APIs
- Environmental configuration for multi-tenant deployment

