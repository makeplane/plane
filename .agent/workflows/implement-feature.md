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
     - Use semantic color tokens (`bg-surface-1`, `text-color-primary`, etc.)
     - Wrap with `observer` for MobX reactivity
     - Use `useTranslation()` for all user-facing text
     - Use `cn()` from `@plane/utils` for conditional classes
   - Add routes in `app/routes/`
   - Add translations to ALL 3 supported locale files (`en`, `vi`, `ko`) simultaneously

4. **Verification**
   - Run linting: `pnpm check:lint`
   - Run type check: `pnpm check:types`
   - Test dark mode works (semantic tokens)
   - Test permissions (admin vs member vs guest)
   - Verify no N+1 queries (check `select_related`/`prefetch_related`)
   - Create `walkthrough.md` documenting what was built and tested
