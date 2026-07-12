# VERSIONNING — api/milestones

| Version | Date | Type | Description | Fichiers touchés |
|---------|------|------|-------------|------------------|
| 0.1.0 | 2026-07-12 | feat | Milestones complets alignés SDK/MCP : modèles Milestone+MilestoneIssue (migration 0128), toggle projet, couche v1 (title, cursor, work-items bulk add/remove), couche app interne, web (type/service/store/page/toggle/composants), i18n ×19 | apps/api/plane/db/models/milestone.py, db/migrations/0128_milestones.py, api+app/{serializers,views,urls}/milestone*, apps/web/core/{services,store,components}/milestone*, page milestones, features-list.tsx, project-navigation.tsx, packages/types/src/milestone.ts, packages/i18n ×19 |

> Table mise à jour par @update-writer-after-implement après chaque implémentation.
