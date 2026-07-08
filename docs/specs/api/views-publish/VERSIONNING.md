# VERSIONNING — api/views-publish

| Version | Date | Type | Description | Fichiers touchés |
|---------|------|------|-------------|------------------|
| 0.1.0 | 2026-07-07 | feat | Publish/unpublish de vue projet (DeployBoard anchor), rendu public space avec filtres serveur | apps/api/plane/app/views/view/{publish.py,base.py}, app/serializers/view.py, app/urls/views.py, space/views/{view.py,issue.py}, space/urls/view.py, tests/contract/app/test_view_publish_app.py, packages/types/src/publish.ts, packages/services/src/view/*, apps/web/core/services/view.service.ts, ce/components/views/publish/*, apps/space/app/views/[anchor]/*, apps/space/store/publish/publish_list.store.ts |
| 0.1.1 | 2026-07-08 | fix | Badge « Live » rendu en `<button>` (a11y clavier + disabled non-admin) | apps/web/core/components/views/view-list-item-action.tsx |

> Table mise à jour par @update-writer-after-implement après chaque implémentation.
