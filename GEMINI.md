# GEMINI.md

## Architecture

- **Frontend**: React 18 + Router v7 + MobX + Tailwind v4 | `@plane/propel` (primary UI) + `@plane/ui` (legacy)
- **Backend**: Django 4.2 + DRF + PostgreSQL + Celery + RabbitMQ
- **CE pattern**: new features in `ce/`, never modify `core/`
- Two API layers: `plane/app/` (internal, session) vs `plane/api/` (external, API key) — NEVER mix serializers

## Git Safety

- Origin: `github.com/shbvn/plane.git` | Default: `preview` | Staging: `develop`
- Branch: `{user}/{type}/{desc}` → develop → preview
- ❌ NEVER pull/merge/rebase from upstream (`makeplane/plane`)
- ❌ NEVER force push or push directly to `preview`/`develop`

## Build

- PM: pnpm | Lint: `pnpm check:lint` | Format: `pnpm check:format`
- Backend: `cd apps/api && python run_tests.py`

## File Standards

- kebab-case, <200 lines code, <150 lines components, YAGNI/KISS/DRY

## Rule Index — READ before implementing

| Category                 | File                                                |
| ------------------------ | --------------------------------------------------- |
| Frontend design system   | `.agent/rules/plane-design-system.md`               |
| Backend architecture     | `.agent/rules/plane-backend-architecture.md`        |
| Implementation checklist | `.agent/rules/frontend-implementation-checklist.md` |
| Color tokens             | `.agent/rules/color-tokens.md`                      |
| Components               | `.agent/rules/component-libraries.md`               |
| MobX stores              | `.agent/rules/mobx-stores.md`                       |
| Routing/layouts          | `.agent/rules/routing-layouts.md`                   |
| Dialogs/modals           | `.agent/rules/dialogs-modals.md`                    |
| Forms/inputs             | `.agent/rules/forms-inputs.md`                      |
| i18n                     | `.agent/rules/i18n-rules.md`                        |
| API services             | `.agent/rules/api-services.md`                      |
| Backend models           | `.agent/rules/backend-models.md`                    |
| Backend views            | `.agent/rules/backend-views.md`                     |
| Backend serializers      | `.agent/rules/backend-serializers.md`               |
| Backend URLs/Celery      | `.agent/rules/backend-urls-celery.md`               |
| Testing/i18n             | `.agent/rules/backend-testing-i18n.md`              |

## Frontend Critical Rules

- ✅ ALWAYS grep for existing components before creating new UI
- ✅ Semantic tokens only: `text-color-*`, `border-color-*`, `bg-*` (no `color-` for bg)
- ❌ `text-tertiary` → must be `text-color-tertiary`
- ❌ `border-subtle` → must be `border-color-subtle`
- ✅ ALL inputs/selects/textareas use `bg-layer-2` (NOT `bg-surface-1`)
- ✅ `observer()` on ALL MobX-reading components
- ✅ `makeObservable` with explicit fields (NEVER `makeAutoObservable`)
- ✅ `runInAction` for async observable updates, `set()` for dynamic keys
- ✅ `t()` for ALL user-facing strings, translations in en/ko/vi
- ✅ `AppHeader` + `ContentWrapper` + `Outlet` in layout.tsx
- ✅ Propel subpath imports: `@plane/propel/button` (NOT barrel)
- ✅ `setToast()` after ALL mutations
- ✅ Dropdowns: `CustomMenu` (web) or `Menu` (admin) — never custom
- ✅ Dialogs: Propel Dialog (admin) / ModalCore+Headless (web)
- ✅ `void` before `handleSubmit(handler)(e)` in form onSubmit
- ✅ Import order: React → `import type` → `@plane/*` → `@/` → relative

## Backend Critical Rules

- ✅ `Issue.issue_objects` for user queries (NOT `Issue.objects`)
- ✅ ALWAYS filter by `workspace__slug=slug`
- ✅ Inherit `BaseViewSet`/`BaseAPIView`
- ✅ `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` decorator
- ✅ Fire `issue_activity.delay()` + `model_activity.delay()` after mutations
- ✅ Capture `current_instance` BEFORE update for activity diff
- ✅ `select_related`/`prefetch_related` to prevent N+1
- ✅ `str(obj.id)` to Celery — never model instances
- ✅ Register new models/views/serializers/urls in `__init__.py`
- ✅ `BaseModel` (workspace-level) or `ProjectBaseModel` (project-scoped)

## CE Feature Checklist

### Backend:

1. Model → `plane/db/models/` + `__init__.py`
2. Migration → `python manage.py makemigrations`
3. Serializer → `plane/app/serializers/` + `__init__.py`
4. Views → `plane/app/views/` + `__init__.py`
5. URLs → `plane/app/urls/` + `__init__.py`
6. Activity → `model_activity.delay()`

### Frontend:

1. Types → `packages/types/src/`
2. Service → `apps/web/ce/services/`
3. Store → `apps/web/ce/store/` + register in `ce/store/root.store.ts`
4. Hook → `apps/web/ce/hooks/store/`
5. Components → `apps/web/ce/components/`
6. Layout+Page → `apps/web/app/.../layout.tsx` + `page.tsx`
7. Routes → `app/routes/extended.ts` (NOT `core.ts`)
8. Translations → `packages/i18n/src/locales/{en,ko,vi}/translations.ts`

## Common Mistakes

- ❌ `Issue.objects` → `Issue.issue_objects`
- ❌ Hardcoded colors → semantic tokens
- ❌ `@plane/ui` when propel has equivalent → check propel first
- ❌ Missing `observer()` → always wrap MobX components
- ❌ CE code in `core/` → always in `ce/`
- ❌ Missing `workspace__slug` filter → cross-workspace leak
- ❌ `makeAutoObservable` → `makeObservable` with explicit fields
- ❌ Direct key assignment on observable → `set()` from MobX
- ❌ Missing toast feedback → `setToast()` after mutations
- ❌ Inline headers in page.tsx → use layout.tsx pattern

## Skills & Workflows

| Skill        | Command    | Description                                 |
| ------------ | ---------- | ------------------------------------------- |
| `/research`  | Research   | Codebase + web research → report            |
| `/planning`  | Plan       | Research → phases with embedded rules       |
| `/implement` | Execute    | Read phase → implement → checklist          |
| `/cook`      | End-to-end | research → plan → implement → test → review |
| `/test`      | Test       | Execute tests → analyze → report            |
| `/review`    | Review     | Check against rules → score → report        |

**Pipeline:** `/research` → `/planning` → `/implement` (per phase) → `/test` → `/review`
Or `/cook` for full pipeline. State tracking via `plans/` directory.

## Attention Dilution Prevention

1. Embed relevant rules in each phase file from `.agent/rules/`
2. Include post-phase checklist — concrete verification steps
3. Fresh context between phases (`/clear`)
4. Front-load critical rules at TOP of embedded section
