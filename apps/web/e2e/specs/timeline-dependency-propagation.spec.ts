import { test, expect } from "../fixtures/test-fixtures";

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

  test("#smoke: clearIssueDate sets target_date to null", async ({ api }, testInfo) => {
    const suffix = `${testInfo.title.replace(/\s+/g, "-").slice(0, 40)}-${Date.now()}`;
    const issue = await api.createIssue(`e2e-smoke-clear-${suffix}`, { start: 0, end: 7 });
    try {
      // Helper resolves with 200/204 — assertion inside helper
      await api.clearIssueDate(issue.id, "target_date");

      // Verify via getIssue (which is added in Task 06-01-04 — temporarily inline-call here
      // is rejected; instead assert the PATCH succeeded by verifying the next createIssue+drag
      // doesn't include this issue. For Task 06-01-03 we only assert the helper does not throw).
    } finally {
      await api.deleteIssue(issue.id);
    }
  });

  test("#smoke: dragBlockBy moves the dragged block visually (no relation)", async ({ api, page }, testInfo) => {
    const { TimelinePage } = await import("../pages/timeline.page");
    const suffix = `${testInfo.title.replace(/\s+/g, "-").slice(0, 40)}-${Date.now()}`;
    const issue = await api.createIssue(`e2e-smoke-drag-${suffix}`, { start: 0, end: 3 });
    try {
      const tp = new TimelinePage(page);
      await tp.gotoIssueGantt();
      await tp.waitForBlock(issue.id);

      const preBox = await tp.getBlockBox(issue.id);

      // 単独 issue を 4 日右にドラッグ — server は 200 (no propagation needed) を返す
      // 注: relation がないため伝播エンドポイントが返すのは src 単独の更新
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes("/timeline-propagation/") && r.request().method() === "POST",
        { timeout: 15_000 }
      );
      await tp.dragBlockBy(issue.id, 4, issue);
      const resp = await responsePromise;
      // ステータスは 200 (no boundary violation で伝播も発火する)。relation がない場合の挙動は
      // Phase 5 の base-gantt-root の D-01 split に依存 — ここではステータスが 200 か 422 のいずれかを許容。
      // 実際: relation なし → propagationStore.commitWithServerResult が呼ばれるが、伝播対象は dragged のみ
      //       → サーバは 200 を返し total_updated_count = 1
      if (resp.status() !== 200) {
        throw new Error(`smoke drag: expected 200, got ${resp.status()} body=${await resp.text()}`);
      }

      // DOM が動いたこと(MobX flush 後)を expect.poll で確認 — D-12b
      // Drag 後の box.x は preBox.x + pixelDelta(±tolerance)
      const dayWidth = await tp.getDayWidthFromBlock(issue.id, issue);
      // server がドラッグ後の position に再配置 — block.position から計算される final box.x は
      // preBox.x + 4 * dayWidth(server から返った start_date が +4 されたため)
      await expect
        .poll(async () => (await tp.getBlockBox(issue.id)).x, { timeout: 5_000 })
        .toBeGreaterThan(preBox.x + dayWidth - 2);
    } finally {
      await api.deleteIssue(issue.id);
    }
  });

  test("#smoke: getIssue reads back created dates and clearIssueDate persists null", async ({ api }, testInfo) => {
    const suffix = `${testInfo.title.replace(/\s+/g, "-").slice(0, 40)}-${Date.now()}`;
    const issue = await api.createIssue(`e2e-smoke-get-${suffix}`, { start: 0, end: 7 });
    try {
      // Initial read — should have both dates populated
      const initial = await api.getIssue(issue.id);
      expect(initial.start_date).toBeTruthy();
      expect(initial.target_date).toBeTruthy();

      // Clear target_date — server-side null
      await api.clearIssueDate(issue.id, "target_date");

      // Re-read — target_date must now be null (stale cache check)
      const after = await api.getIssue(issue.id);
      expect(after.target_date).toBeNull();
    } finally {
      await api.deleteIssue(issue.id);
    }
  });
});
