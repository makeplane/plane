import { test } from "../fixtures/test-fixtures";

/**
 * Phase 6 — Timeline Dependency Schedule Propagation E2E coverage.
 *
 * 対象要件:
 *   TEST-23: drag predecessor → dependent work item moves → schedule persists end-to-end
 *   TEST-24: drag triggers known protocol error (INCOMPLETE_SCHEDULE) → UI rolls back + error toast
 *
 * 前提:
 *   - docker-compose-local.yml + pnpm dev が稼働
 *   - apps/web/e2e/.env.e2e 設定済み
 *   - ワークスペースの UI 言語 = en (D-04b / D-08a)
 *   - Issue layout = Gantt
 */
test.describe("timeline dependency propagation", () => {
  test.skip("#1 [TEST-23] happy path: drag predecessor moves successor and persists", async () => {
    // Plan 06-02 で実装する。Plan 06-01 では D-13a の self-test として skip 状態で配置する。
  });

  test.skip("#2 [TEST-24] failure path: incomplete-schedule rejects drag and rolls back UI", async () => {
    // Plan 06-02 で実装する。
  });

  test("#smoke: relation seed survives deletion cascade", async ({ api }, testInfo) => {
    const suffix = `${testInfo.title.replace(/\s+/g, "-").slice(0, 40)}-${Date.now()}`;
    const [src, tgt] = await Promise.all([
      api.createIssue(`e2e-smoke-rel-src-${suffix}`, { start: 0, end: 3 }),
      api.createIssue(`e2e-smoke-rel-tgt-${suffix}`, { start: 5, end: 8 }),
    ]);
    try {
      // Should resolve to 201 (assertion is inside the helper)
      await api.createIssueRelation(src.id, tgt.id, "blocking");
    } finally {
      await Promise.allSettled([api.deleteIssue(src.id), api.deleteIssue(tgt.id)]);
    }
  });
});
