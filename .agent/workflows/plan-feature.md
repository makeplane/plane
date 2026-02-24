---
description: Plan a new feature with research, design, and implementation steps
---

# Plan Feature Workflow

## Steps

1. **Understand Requirements**
   - Read user's feature request carefully
   - Ask clarifying questions if ambiguous
   - Check `./docs/project-roadmap.md` for context

2. **Research Existing Code**
   - Search codebase for similar patterns (Issues, Cycles, Modules)
   - Identify models, views, serializers, and frontend components to reference
   - Read `./docs/codebase-summary.md` for architecture context

3. **Design Backend**
   - Define models (inherit `BaseModel` or `ProjectBaseModel`)
   - Define serializers (inherit `BaseSerializer`)
   - Define views with permissions (`@allow_permission`)
   - Define URL patterns (workspace/project scoped)
   - Plan activity tracking and webhooks

4. **Design Frontend**
   - Define TypeScript interfaces in `@plane/types`
   - Design API service extending `APIService`
   - Design MobX store (in `ce/store/`)
   - Plan components using `@plane/propel` + semantic tokens
   - Follow Plane design system (`./docs/design-guidelines.md`)

5. **Create Implementation Plan**
   - Write `implementation_plan.md` with all changes grouped by component
   - Include verification plan (tests + manual checks)
   - Request user review via `notify_user`

6. **Review Checklist Before Proceeding**
   - [ ] Models inherit correct base class
   - [ ] Permissions use `@allow_permission`
   - [ ] URLs follow `workspaces/<slug>/` pattern
   - [ ] Frontend uses propel components + semantic tokens
   - [ ] No hardcoded colors
   - [ ] CE code in `ce/` directory
   - [ ] All `__init__.py` files updated
   - [ ] Translations added to ALL 3 supported locales (`en`, `vi`, `ko`)
