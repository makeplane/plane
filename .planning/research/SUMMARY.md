---
last_researched: 2026-06-29
---

# Project Research Summary

## Key Findings

**Stack:** Use the existing Plane stack. Add Django/DRF models, serializers, views, permissions, and a transaction-backed apply service. Use the existing React Router create-project flow, `ProjectTemplateSelect` stub, project service, MobX project store, and shared types. Do not introduce a new template engine or frontend state system.

**Features:** v1 should include template selection in the create Project modal, three built-in system templates, owner/admin custom template management, and backend application of states, labels, modules, cycles, and starter issues.

**Architecture:** Project creation should accept optional `template_id`. Backend should validate template visibility and apply the template atomically. Existing default project creation must remain unchanged when no template is selected.

**Pitfalls:** The highest risks are partial project creation, duplicating/default-state regressions, ambiguous permissions, starter issue reference mapping, label hierarchy complexity, and cycle date semantics.

## Implications For Requirements

- Requirements should explicitly cover both no-template and template-selected project creation.
- Requirements should distinguish selecting templates from managing templates.
- Requirements should specify permission behavior for custom template management.
- Requirements should define which template contents v1 must support.
- Requirements should include backend transaction/rollback behavior as a user-visible quality requirement.
- Requirements should either include or defer hierarchical labels and relative cycle dates.

## Implications For Roadmap

Recommended phase order:

1. Backend template model/API foundation.
2. Backend template application in project creation.
3. Frontend template selection in create Project modal.
4. Workspace custom template management UI.
5. Verification, polish, and built-in template content.

## Sources

- `.planning/PROJECT.md`
- `.planning/codebase/STACK.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `apps/web/ce/components/projects/create/root.tsx`
- `apps/web/ce/components/projects/create/template-select.tsx`
- `apps/web/core/components/project/create/header.tsx`
- `apps/web/core/components/project/create-project-modal.tsx`
- `apps/web/core/services/project/project.service.ts`
- `apps/web/core/store/project/project.store.ts`
- `apps/api/plane/app/views/project/base.py`
- `apps/api/plane/app/serializers/project.py`
- `apps/api/plane/db/models/project.py`
- `apps/api/plane/db/models/state.py`
- `apps/api/plane/app/views/state/base.py`
- `apps/api/plane/app/views/issue/label.py`
- `apps/api/plane/db/models/label.py`
- `apps/api/plane/db/models/module.py`
- `apps/api/plane/db/models/cycle.py`

