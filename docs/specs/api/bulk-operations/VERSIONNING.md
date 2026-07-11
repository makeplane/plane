# VERSIONNING — api/bulk-operations

| Version | Date | Type | Description | Fichiers touchés |
|---------|------|------|-------------|------------------|
| 1.0.0 | 2026-07-11 | feat | Bulk operations (feature Pro) : édition en masse multi-champs de work items — **zéro migration**. Backend : helper `plane/utils/bulk_issue.py` + `BulkIssueOperationEndpoint` (interne) + `BulkIssueOperationAPIEndpoint` (v1/MCP). Sémantique **scalaires = SET, M2M = ADD/append** (native Plane). Borne `MAX_BULK_ISSUES=100`, validation atomique (400 jamais 500), activité dispatchée sur `transaction.on_commit`, permissions ADMIN+MEMBER. Web : gate levé (`use-bulk-operation-status`), toolbar `ce/components/issues/bulk-operations/{root,properties,delete-modal}.tsx`, i18n 19 locales. **40 tests pytest** (Docker) + E2E live (session + v1 token). Revue adversariale : BK-01..04 + WB-1/WB-2 corrigés, WB-3 rejeté. | apps/api/plane/utils/bulk_issue.py, app/views/issue/base.py, app/views/__init__.py, app/urls/issue.py, api/views/issue.py, api/views/__init__.py, api/urls/work_item.py, tests/contract/{app/test_bulk_operation_app,api/test_bulk_operation_v1}.py ; apps/web/ce/components/issues/bulk-operations/{root,properties,delete-modal,index?}.tsx, core/hooks/{use-bulk-operation-status,use-multiple-select}.ts ; packages/i18n/src/locales/*/work-item.json ; CHANGELOG.md |
| 0.1.0 | 2026-07-11 | docs | Spec initiale (PLAN) — bulk edit multi-champs, zéro migration. | docs/specs/api/bulk-operations/* |

> Table mise à jour par @update-writer-after-implement après chaque implémentation.
