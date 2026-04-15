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
});
