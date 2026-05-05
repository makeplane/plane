# Research Report: Plane.so Architecture & AI Agent Rule-Writing Best Practices

**Date**: 2026-03-12
**Researcher**: researcher
**Scope**: Plane.so opensource patterns + AI agent rule-writing best practices for monorepos

---

## Topic 1: Plane.so Architecture & Contribution Patterns

### Key Findings

**Tech Stack**:

- **Frontend**: React 18 + React Router v7 + MobX + Tailwind CSS v4
- **Backend**: Django 4.2 + DRF 3.15 + PostgreSQL 15.7 + Celery + RabbitMQ
- **Real-time**: Express.js + Hocuspocus (Y.js CRDT) + Redis pub-sub
- **Storage**: MinIO (S3-compatible)
- **Package Manager**: pnpm (monorepo with Turborepo)

**Architecture Patterns** (Verified from codebase):

1. **CE Pattern** (Community Edition override):
   - New features → `ce/` directories (never modify `core/`)
   - Backward compatible, isolated customizations
   - Applied to: dashboards, workflows, time-tracking, etc.

2. **Frontend State Management**:
   - **MobX** with 35+ stores (web app), 6 stores (admin), 14 stores (space)
   - Root store pattern: instantiate all child stores
   - Observable state + computed derived values + action mutations
   - Observer HOC wrapper on components reading observables

3. **Backend API Structure**:
   - V0 (`/api/v0/`, `/api/`): legacy endpoints under `plane.app`
   - V1 (`/api/v1/`): new endpoints under `plane.api`
   - Admin endpoints: `/god-mode/instances/` (monitoring, user management, config)
   - Public APIs: `/api/public/` for shared space access

4. **Service Layer Pattern**:
   - Frontend: `core/services/` for Axios-wrapped API calls
   - Backend: ViewSet + Serializer pattern with DRF
   - Permission classes enforce workspace/project membership + role checks

5. **UI Component Convention**:
   - Prefer `@plane/propel/*` over legacy `@plane/ui`
   - Semantic Tailwind tokens: `text-primary` (not `text-color-primary`), `bg-surface-1`
   - <150 lines per component for readability

6. **Database Design**:
   - Soft-delete support (deleted_at field)
   - Polymorphic UserFavorite pattern (shared across dashboards, views, cycles)
   - Indexed relationships for performance (select_related, prefetch_related)

---

## Topic 2: AI Agent Rule-Writing Best Practices for Monorepo Projects

### Configuration Approaches (2025 Status)

| Tool               | File                              | Scope                                | Inheritance                                                          |
| ------------------ | --------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| **Cursor**         | `.cursorrules`                    | Single file                          | Global rules only                                                    |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Single file + new multi-file support | Path-specific via `applyTo` frontmatter (.github/instructions/\*.md) |
| **Claude Code**    | `CLAUDE.md` + `./.claude/rules/*` | Root + per-path rule files           | Auto-loaded by file path matching                                    |

### Critical Best Practices for Reducing AI Hallucination & Laziness

**1. Declare Exact Tech Stack**:

- Framework names + versions (React 18, Django 4.2, MobX, Tailwind v4)
- Package manager specifics (pnpm monorepo with Turborepo)
- Narrows AI suggestion scope, prevents cross-framework confusion

**2. Define 5–10 High-Frequency Rules**:

- Component patterns (kebab-case, <150 lines)
- Import conventions (`@plane/propel` over `@plane/ui`)
- MobX store patterns (observable + action + computed)
- Django ViewSet + Serializer structure
- File organization (apps/web/core/store, etc.)

**3. Negative Rules ("Never" Patterns)**:

- ❌ Never modify `core/` directory (use `ce/` overrides)
- ❌ Never commit secrets (.env, API keys)
- ❌ Never force push to `preview`/`develop`
- ❌ Never use bare `makeAutoObservable` without explicit declarations
- ❌ Never use `@plane/ui` for new code (use `@plane/propel`)
- ❌ Never ignore failing tests to pass builds

**4. Mandatory Validation Checkpoints**:

- After code implementation: Run linting (`pnpm check:lint`)
- After file edits: Verify syntax (no compile errors)
- Before commit: Tests must pass (`cd apps/api && python run_tests.py`)
- After MobX changes: Verify @observer wrapper on consuming components

**5. Anti-Laziness Patterns**:

- **Real implementations only** (no mocks or simulations to fake completion)
- **Post-implementation checks**: Compile, lint, test required
- **Sequential validation**: Changes → Lint → Test → Review (not parallel)
- **Hook failure handling**: Fix issues, don't retry in sleep loops

**6. Context Minimization** (Token Efficiency):

- Provide just enough context without overwhelming model
- Monorepo: specify package scope (apps/web vs apps/api)
- Avoid dumping entire codebase; cite relevant patterns instead
- Use `.cursor rules` / rule files as canonical source (commit after accepted diff)

---

## Topic 3: Framework-Specific AI Rules

### MobX Store Patterns (Anti-Hallucination Rules)

**Critical Rules to Embed**:

1. **Observable Definition**:

   ```
   ✅ Use makeObservable() with explicit declarations
   ✅ Use @observable for state, @action for mutations, @computed for derivations
   ❌ Never use makeAutoObservable (too implicit)
   ❌ Never mutate observables outside @action methods
   ```

2. **Computed Properties**:

   ```
   ✅ Keep computed values pure (no side effects)
   ✅ Derived data only (read existing observables)
   ❌ Never call API/async in @computed
   ❌ Never create new observables in @computed
   ```

3. **Component Wrapper**:

   ```
   ✅ Wrap all components reading observables with observer()
   ✅ Use from mobx-react (not mobx-react-lite)
   ❌ Never forget observer() wrapper (most common MobX bug)
   ❌ Never read observables in non-observer components
   ```

4. **Store Composition**:
   ```
   ✅ RootStore instantiates all child stores
   ✅ Separate domain stores from UI stores
   ✅ Pass references between stores (not primitives)
   ❌ Never store API responses directly in MobX (causes stale data)
   ❌ Never dispose reactions without cleanup
   ```

### Django DRF Patterns (Anti-Hallucination Rules)

**Critical Rules to Embed**:

1. **ViewSet Structure**:

   ```
   ✅ Set queryset, serializer_class, permission_classes
   ✅ Use get_queryset() for dynamic filters per user
   ✅ Override perform_create() for custom creation logic
   ❌ Never override list/create without permission checks
   ❌ Never bypass permission_classes for "quick" endpoints
   ```

2. **Serializer Selection**:

   ```
   ✅ Use get_serializer_class() for action-based selection
   ✅ Different serializers for list/detail/create (list is read-only)
   ✅ Validate in Serializer.validate() for business logic
   ❌ Never put business logic in model methods (use ViewSet)
   ❌ Never skip field-level validation in serializers
   ```

3. **Permission Architecture**:

   ```
   ✅ Global: WorkspaceMemberPermission (has access to workspace?)
   ✅ Object-level: ProjectMemberPermission (has role in project?)
   ✅ Custom: Use IsOwner pattern for resource-specific checks
   ❌ Never trust request.user without explicit permission check
   ❌ Never apply object-level permissions to list() (list uses type-level only)
   ```

4. **Query Optimization**:
   ```
   ✅ Use select_related() for FK joins
   ✅ Use prefetch_related() for reverse relations + M:N
   ✅ Annotate is_favorite via UserFavorite exists check
   ❌ Never loop through querysets without select_related (N+1 queries)
   ❌ Never fetch full objects when only IDs needed
   ```

### Tailwind v4 & React Router v7 Patterns

**Tailwind Rules**:

- ✅ Use semantic tokens: `text-primary`, `bg-surface-1`, `border-subtle`
- ✅ CSS variables in `@plane/tailwind-config`
- ❌ Never use `text-color-primary` (old naming)
- ❌ Never hard-code colors (#fff, #000)

**React Router v7 Rules**:

- ✅ File-based routing in `app/routes/`
- ✅ Route groups via parenthesized directories: `(settings)/`
- ✅ Outlets for nested layouts
- ❌ Never mix client-side redirects with SSR loaders
- ❌ Never forget Suspense boundaries on async loaders

---

## Gap Analysis: Current Rule Set vs Best Practices

### Strengths (Already Implemented)

- ✅ CE pattern clearly documented ("never modify core/")
- ✅ Tech stack explicitly declared (React 18, Django 4.2, MobX)
- ✅ File standards defined (kebab-case, <200 lines code, <150 lines components)
- ✅ Git safety rules enforced (no upstream pulls, no force push)
- ✅ YAGNI / KISS / DRY principles stated
- ✅ Testing requirement documented (no ignored tests)

### Gaps to Address

- ❌ **MobX-specific rules missing**: No rules for observer wrapping, makeObservable vs makeAutoObservable, @action/@computed constraints
- ❌ **Anti-hallucination validation checkpoints missing**: No explicit post-implementation compile/lint/test mandates
- ❌ **DRF-specific patterns missing**: No rules for serializer selection, permission architecture, query optimization (select_related/prefetch_related)
- ❌ **Post-implementation verification lacking**: Rules state "run compile command" but don't mandate specific outputs (0 lint errors required?)
- ❌ **Token efficiency guidance missing**: No mention of context minimization for agent instructions
- ❌ **AI laziness safeguards missing**: No "real implementations only" rule or prohibition on simulation/mocking
- ❌ **Tailwind semantic tokens not emphasized**: Design guidelines don't enforce `text-primary` over old conventions
- ❌ **Negative rules sparse**: Could add more "never" patterns to prevent common mistakes

---

## Actionable Recommendations

### Priority 1: Add Framework-Specific MobX Rules

**File**: `.claude/rules/mobx-patterns.md`

- Observable definition constraints
- Computed property purity rules
- observer() HOC requirements
- Store composition & lifecycle

### Priority 2: Strengthen DRF Backend Rules

**File**: `.claude/rules/drf-patterns.md`

- ViewSet structure template
- Serializer selection per-action
- Permission class hierarchy
- Query optimization mandatory

### Priority 3: Anti-Laziness Enforcement

**Update**: `.claude/rules/development-rules.md`

- Add explicit post-implementation checks (compile → lint → test)
- Define test coverage minimum (0 lint errors, all tests passing)
- Prohibit mocks/simulations for implementation tasks

### Priority 4: AI Context Optimization

**Update**: `.claude/rules/orchestration-protocol.md`

- Document context minimization for parallel agents
- Specify which files to include vs exclude in agent instructions
- Token budget guidance per agent type (planner, researcher, implementer)

### Priority 5: Tailwind & Router Best Practices

**Update**: `docs/design-guidelines.md`

- Enforce semantic token usage (with examples)
- Document React Router v7 file-based routing patterns
- Forbidden patterns (old color naming, hard-coded values)

---

## Sources & References

- [Cursor AI Review 2025](https://skywork.ai/blog/cursor-ai-review-2025-agent-refactors-privacy/)
- [How to Write AI Coding Rules](https://www.agentrulegen.com/guides/how-to-write-ai-coding-rules)
- [MobX: Defining Data Stores](https://mobx.js.org/defining-data-stores.html)
- [MobX: Computeds](https://mobx.js.org/computeds.html)
- [MobX Anti-Patterns](https://www.nigelthorne.com/2025/04/common-mobx-anti-patterns-and-fixes.html)
- [Django REST Framework Viewsets](https://www.django-rest-framework.org/api-guide/viewsets/)
- [DRF Permissions](https://www.django-rest-framework.org/api-guide/permissions/)

---

**Status**: Draft
**Next Step**: Gap analysis summary to be incorporated into comprehensive rule-writing plan.
