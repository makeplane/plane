---
description: Implement a planned feature following Plane architecture
---

# Implement Feature Workflow

// turbo-all

## Steps

1. **Read the Plan**
   - Read `implementation_plan.md` for approved changes
   - Read `./docs/code-standards.md` for coding standards
   - Read `./docs/design-guidelines.md` for UI standards

2. **Backend Implementation** (in order)
   - Create model in `plane/db/models/` → register in `__init__.py`
   - Run `python manage.py makemigrations`
   - Create serializer in `plane/app/serializers/` → register in `__init__.py`
   - Create views in `plane/app/views/` with `@allow_permission` → register in `__init__.py`
   - Create URLs in `plane/app/urls/` → register in `__init__.py`
   - Add activity tracking (`model_activity.delay()` after mutations)
   - Capture `current_instance` before updates for activity diff

3. **Frontend Implementation** (in order)
   - Add TypeScript types in `packages/types/src/`
   - Create API service in `apps/web/core/services/` extending `APIService`
   - Create MobX store in `apps/web/ce/store/` → register in `ce/store/root.store.ts`
   - Create hook in `apps/web/ce/hooks/store/`
   - Build components in `apps/web/ce/components/`:
     - Use `@plane/propel` (subpath imports)
     - Use semantic color tokens (`bg-surface-1`, `text-primary`, etc.)
     - Wrap with `observer` for MobX reactivity
     - Use `useTranslation()` for all user-facing text
     - Use `cn()` from `@plane/utils` for conditional classes
   - Add routes in `app/routes/`
   - Add translations to ALL language files

4. **Post-Phase Checklist (run after EACH phase)**
   - If phase file has embedded rules + checklist, verify ALL checklist items
   - Frontend phases:
     - [ ] ALL strings use `t()` from `@plane/i18n` (zero hardcoded English)
     - [ ] Color tokens use short-form `text-*` / `border-*` (NOT legacy `text-color-*` / `border-color-*`)
     - [ ] Input backgrounds use `bg-layer-2` (NOT `bg-surface-1`)
     - [ ] `observer()` on all MobX store-reading components
     - [ ] Menus use `CustomMenu`/`Menu` (no custom dropdowns)
     - [ ] Layout uses `AppHeader` + `ContentWrapper` + `Outlet`
     - [ ] File sizes under 200 lines (components under 150)
   - Backend phases:
     - [ ] `BaseViewSet`/`BaseAPIView` inherited
     - [ ] `workspace__slug=slug` filtering
     - [ ] Activity tracking after mutations
     - [ ] `select_related`/`prefetch_related` used

5. **Verification**
   - After implementing, follow verification gates in `.agent/rules/development-rules.md`
   - Check `.agent/rules/prettier-formatting.md` for formatting standards (120-char width)
   - Run linting: `pnpm check:lint`
   - Run type check: `pnpm check:types`
   - Test dark mode works (semantic tokens)
   - Test permissions (admin vs member vs guest)
   - Verify no N+1 queries (check `select_related`/`prefetch_related`)
   - Create `walkthrough.md` documenting what was built and tested

6. **Phase Workflow (Attention Dilution Prevention)**
   - Start new chat/context between phases to prevent quality degradation
   - Read phase file first (contains embedded rules + steps + checklist)
   - Implement all steps → run post-phase checklist → mark complete → new context
