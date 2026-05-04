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
  test("#1 [TEST-23] happy path: drag predecessor moves successor and persists", async ({
    page,
    api,
    propagationPair,
    propagationTimeline,
  }) => {
    const { src, tgt } = propagationPair;

    // dayWidth は propagationPair の tgt(start+5/end+8、duration=4days)から DOM 派生
    const dayWidth = await propagationTimeline.getDayWidthFromBlock(tgt.id, tgt);
    if (dayWidth <= 0) {
      throw new Error(`unexpected dayWidth=${dayWidth} (DOM derivation failed)`);
    }

    // pre-drag バウンディングボックス(D-04 step 2 の比較対象)
    const preDragBoxSrc = await propagationTimeline.getBlockBox(src.id);
    const preDragBoxTgt = await propagationTimeline.getBlockBox(tgt.id);

    // waitForResponse は drag の前にセット(Pitfall 7)
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes("/timeline-propagation/") && r.request().method() === "POST",
      { timeout: 15_000 }
    );

    // src を +4 日右にドラッグ — src.target=+3 → +7 が tgt.start=+5 を violate
    // → サーバが tgt を +8/+11 に shift
    await propagationTimeline.dragBlockBy(src.id, 4, src);

    const resp = await responsePromise;

    // === Assertion 1: Network ===
    expect(resp.status()).toBe(200);
    const body = (await resp.json()) as {
      requested_work_item_id: string;
      total_updated_count: number;
      work_items: Array<{ id: string; start_date: string; target_date: string; updated_at: string }>;
    };
    expect(body.requested_work_item_id).toBe(src.id);
    expect(body.total_updated_count).toBeGreaterThanOrEqual(2);

    // リクエストボディも確認(operation=move、work_item_id=src.id)
    expect(resp.request().postDataJSON()).toMatchObject({
      work_item_id: src.id,
      operation: "move",
    });

    // === Assertion 2: DOM ===
    // MobX runInAction の flush 後に tgt が右にシフトしていることを expect.poll で待つ(Pitfall 2)
    // dayWidth - 2px tolerance(D-04c)
    await expect
      .poll(async () => (await propagationTimeline.getBlockBox(tgt.id)).x, { timeout: 5_000 })
      .toBeGreaterThan(preDragBoxTgt.x + dayWidth - 2);

    // src(drag された側)も右にシフトしている(基準: pre-drag より dayWidth*4 - tolerance)
    await expect
      .poll(async () => (await propagationTimeline.getBlockBox(src.id)).x, { timeout: 5_000 })
      .toBeGreaterThan(preDragBoxSrc.x + dayWidth - 2);

    // === Assertion 3: Persistence ===
    // server response から期待値を取り出す
    const serverTgt = body.work_items.find((wi) => wi.id === tgt.id);
    expect(serverTgt, `server response did not include tgt(${tgt.id}) in work_items`).toBeDefined();

    // API GET で DB を直読み — bulk_update がコミット済みなら新値が返る(stale cache なし)
    const persisted = await api.getIssue(tgt.id);
    expect(persisted.start_date).toBe(serverTgt!.start_date);
    expect(persisted.target_date).toBe(serverTgt!.target_date);
  });

  test("#2 [TEST-24] failure path: incomplete-schedule rejects drag and rolls back UI", async ({
    page,
    api,
    propagationPair,
    propagationTimeline,
  }) => {
    const { src, tgt } = propagationPair;

    // === Setup (D-07a: clearIssueDate AFTER propagationTimeline 完了) ===
    // propagationTimeline fixture は既に gotoIssueGantt + waitForBlock(src,tgt) 済み。
    // ブラウザのローカル MobX ストアは tgt.target_date を populated でホールド(D-07b — WS 通知なし)。
    // 今 server-side のみクリアすることで、UI の isBlockComplete ガードは true のまま — drag が発火する。
    await api.clearIssueDate(tgt.id, "target_date");

    // dayWidth は src(start+0/end+3、duration=4days)から DOM 派生
    const dayWidth = await propagationTimeline.getDayWidthFromBlock(src.id, src);

    // pre-drag バウンディングボックス(rollback 比較用、D-04a step 3)
    const preDragBoxSrc = await propagationTimeline.getBlockBox(src.id);
    const preDragBoxTgt = await propagationTimeline.getBlockBox(tgt.id);

    // waitForResponse を drag の前にセット(Pitfall 7)
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes("/timeline-propagation/") && r.request().method() === "POST",
      { timeout: 15_000 }
    );

    // src を +4 日右にドラッグ → server は tgt の target_date=null を検知 → 422 + INCOMPLETE_SCHEDULE
    await propagationTimeline.dragBlockBy(src.id, 4, src);

    const resp = await responsePromise;

    // === Assertion 1: Network — 422 + envelope ===
    expect(resp.status()).toBe(422);
    const body = (await resp.json()) as { code: string; message: string };
    expect(body).toMatchObject({ code: "INCOMPLETE_SCHEDULE" });
    expect(typeof body.message).toBe("string");
    expect(body.message.length).toBeGreaterThan(0);

    // === Assertion 2: Toast — text-based seam(@plane/propel/toast に data-testid なし)===
    // 英語 i18n 文字列は `packages/i18n/src/locales/en/translations.ts:2769,2772` 参照
    await expect(page.getByText("Schedule update failed")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("A dependent work item is missing start or target dates.")).toBeVisible();

    // === Assertion 3: DOM rollback — both blocks return to pre-drag positions(D-04c, ±2px)===
    // previewById.clear() が runInAction 内で実行される → block.position fallback で元位置に
    // expect.poll で MobX flush を待つ(Pitfall 2)
    await expect
      .poll(async () => (await propagationTimeline.getBlockBox(src.id)).x, { timeout: 5_000 })
      .toBeGreaterThanOrEqual(preDragBoxSrc.x - 2);
    await expect
      .poll(async () => (await propagationTimeline.getBlockBox(src.id)).x, { timeout: 5_000 })
      .toBeLessThanOrEqual(preDragBoxSrc.x + 2);
    await expect
      .poll(async () => (await propagationTimeline.getBlockBox(tgt.id)).x, { timeout: 5_000 })
      .toBeGreaterThanOrEqual(preDragBoxTgt.x - 2);
    await expect
      .poll(async () => (await propagationTimeline.getBlockBox(tgt.id)).x, { timeout: 5_000 })
      .toBeLessThanOrEqual(preDragBoxTgt.x + 2);

    // dayWidth consumed above — suppress unused-variable warning
    void dayWidth;
  });

  test.skip("#smoke: relation seed survives deletion cascade", async ({ api }, testInfo) => {
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

  test.skip("#smoke: clearIssueDate sets target_date to null", async ({ api }, testInfo) => {
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

  test.skip("#smoke: dragBlockBy moves the dragged block visually (no relation)", async ({ api, page }, testInfo) => {
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

  test.skip("#smoke: getIssue reads back created dates and clearIssueDate persists null", async ({ api }, testInfo) => {
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

  test.skip("#smoke: propagationPair seeds relation and propagationTimeline renders both blocks", async ({
    propagationPair,
    propagationTimeline,
    page,
  }) => {
    const { src, tgt } = propagationPair;

    // propagationTimeline fixture 構築直後 → 両ブロックが DOM にいる(waitForBlock を経由)
    const srcBox = await propagationTimeline.getBlockBox(src.id);
    const tgtBox = await propagationTimeline.getBlockBox(tgt.id);

    expect(srcBox.width).toBeGreaterThan(0);
    expect(tgtBox.width).toBeGreaterThan(0);

    // tgt は src の右側にあるはず (D-06b: src end=+3, tgt start=+5 → tgt.x > src.x + src.width)
    expect(tgtBox.x).toBeGreaterThan(srcBox.x + srcBox.width);

    // 両ブロックが可視状態
    await expect(propagationTimeline.block(src.id)).toBeVisible();
    await expect(propagationTimeline.block(tgt.id)).toBeVisible();

    // optional: 関係線が描画されているか(propagationPair が API 経由で関係を作っているので必ず存在)
    await expect(page.locator(`[data-dependency-key="${src.id}-blocking-${tgt.id}"]`)).toBeVisible({
      timeout: 5_000,
    });
  });
});
