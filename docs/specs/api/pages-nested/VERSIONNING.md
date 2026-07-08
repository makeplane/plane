# VERSIONNING — api/pages-nested

| Version | Date | Type | Description | Fichiers touchés |
|---------|------|------|-------------|------------------|
| 0.1.0 | 2026-07-07 | feat | Endpoint sub-pages, anti-cycle + contrainte projet sur parent, sub_pages_data rempli, UI d'arbre | apps/api/plane/app/views/page/base.py, app/urls/page.py, bgtasks/page_version_task.py, tests/contract/app/test_page_app.py, tests/unit/bg_tasks/test_page_version_task.py, apps/web/core/services/page/project-page.service.ts, core/store/pages/project-page.store.ts, ce/store/pages/extended-base-page.ts, core/components/pages/list/{block,block-item-action}.tsx, core/components/pages/dropdowns/actions.tsx, packages/types/src/page/extended.ts |
| 0.1.1 | 2026-07-07 | fix | Action « New sub-page » ajoutée à la barre d'outils d'une page ouverte (était absente de l'`optionsOrder`, donc invisible en vue détail) | apps/web/core/components/pages/editor/toolbar/options-dropdown.tsx |

> Table mise à jour par @update-writer-after-implement après chaque implémentation.
