import { test, expect } from "../fixtures/test-fixtures";

test.describe("timeline dependency drag", () => {
  test("#1 right handle drag to left edge creates blocking relation", async ({ page, timeline, issuePair }) => {
    const { src, tgt } = issuePair;

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes(`/issues/${src.id}/issue-relation/`) && r.request().method() === "POST",
      { timeout: 10_000 }
    );

    await timeline.dragRightTo(src.id, tgt.id);

    const resp = await responsePromise;
    expect(resp.status()).toBe(201);
    expect(resp.request().postDataJSON()).toMatchObject({
      relation_type: "blocking",
      issues: [tgt.id],
    });

    // 描画: src が blocking として iterate され、`${src.id}-blocking-${tgt.id}` の data-key で線が出る
    await expect(page.locator(`[data-dependency-key="${src.id}-blocking-${tgt.id}"]`)).toBeVisible();
  });

  test("#2 left handle drag to right edge creates blocked_by relation (rendered as mirror)", async ({
    page,
    timeline,
    issuePair,
  }) => {
    const { src, tgt } = issuePair;

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes(`/issues/${src.id}/issue-relation/`) && r.request().method() === "POST",
      { timeout: 10_000 }
    );

    await timeline.dragLeftTo(src.id, tgt.id);

    const resp = await responsePromise;
    expect(resp.status()).toBe(201);
    expect(resp.request().postDataJSON()).toMatchObject({
      relation_type: "blocked_by",
      issues: [tgt.id],
    });

    // 描画は mirror 方向(`dependency-paths.tsx:103` が `blocking` のみ iterate するため
    // `src blocked_by tgt` は `tgt blocking src` として 1 本の線に描かれる)
    await expect(page.locator(`[data-dependency-key="${tgt.id}-blocking-${src.id}"]`)).toBeVisible();
  });

  test("#3 shift drop opens relation picker and commits relates_to via option click", async ({
    page,
    timeline,
    issuePair,
  }) => {
    const { src, tgt } = issuePair;

    // まず Shift 付きで drop → picker が開き、まだ API は呼ばれない
    await timeline.dragRightTo(src.id, tgt.id, { shiftKey: true });

    await expect(timeline.picker).toBeVisible();

    // picker の relates_to をクリック → API 呼び出し
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes(`/issues/${src.id}/issue-relation/`) && r.request().method() === "POST",
      { timeout: 10_000 }
    );
    await timeline.clickPickerOption("relates_to");
    const resp = await responsePromise;

    expect(resp.status()).toBe(201);
    expect(resp.request().postDataJSON()).toMatchObject({
      relation_type: "relates_to",
      issues: [tgt.id],
    });

    // relates_to は gantt 上に線として描画されない(`dependency-paths.tsx:103` が `blocking` のみ iterate)
    // → data-dependency-key の存在確認は行わず、picker が閉じたことだけアサート
    await expect(timeline.picker).toBeHidden();
  });
});
