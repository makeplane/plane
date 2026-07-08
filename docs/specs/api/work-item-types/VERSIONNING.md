# VERSIONNING — api/work-item-types

| Version | Date | Type | Description | Fichiers touchés |
|---------|------|------|-------------|------------------|
| 0.1.0 | 2026-07-08 | feat | Work item types (types only) : CRUD interne + externe v1/MCP, seeding default+epic à l'activation, exposition type_id, activité, invariants (défaut unique, epic immuable) ; UI web (sélecteur/switcher/filtre, toggle projet). Corrections sécurité de revue (IDOR type_id, gardes coercées, epic non-défaut). | apps/api/plane/db/models/__init__.py, utils/issue_type.py, app/serializers/{issue_type.py,issue.py}, app/views/issue_type/base.py, app/views/issue/*, app/urls/issue_type.py, api/serializers/issue_type.py, api/views/issue_type.py, api/urls/work_item_type.py, bgtasks/issue_activities_task.py, tests/* ; apps/web/core/{services/issue-type.service.ts,store/issue-type.store.ts,components/project/settings/features-list.tsx,components/issues/...}, apps/web/ce/components/issues/{issue-modal,issue-details,filters}/*, packages/types/src/issues/* |

> Table mise à jour par @update-writer-after-implement après chaque implémentation.
