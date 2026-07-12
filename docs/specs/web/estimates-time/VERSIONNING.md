# VERSIONNING — web/estimates-time

| Version | Date | Type | Description | Fichiers touchés |
|---------|------|------|-------------|------------------|
| 0.1.0 | 2026-07-12 | feat | Système TIME débloqué en CE : widget h/min (stockage minutes), template hours corrigé, custom caché anti-crash ; volet revue : enum `EstimateType.TIME` + validation type (migration 0127), routes v1 estimates montées, activité `estimate_time` visible et formatée, tooltip dropdown « Xh Ym » | apps/web/ce/components/estimates/{helper,inputs/time-input}.tsx, packages/constants/src/estimates.ts, apps/web/core/components/issues/issue-detail/issue-activity/activity/{activity-list,actions/estimate}.tsx, apps/web/core/components/dropdowns/estimate.tsx, apps/api/plane/db/models/estimate.py, db/migrations/0127_alter_estimate_type_time.py, app/views/estimate/base.py, api/urls/__init__.py |

> Table mise à jour par @update-writer-after-implement après chaque implémentation.
