import { test as base } from "@playwright/test";
import { Api, createApi, type CreatedIssue } from "./api";
import { TimelinePage } from "../pages/timeline.page";

type Fixtures = {
  api: Api;
  /** Issue を 2 つ作成した状態(src / tgt)でテストに渡す。afterEach で自動削除。 */
  issuePair: { src: CreatedIssue; tgt: CreatedIssue };
  /** Gantt 画面へ遷移した TimelinePage POM。`issuePair` に依存して構築される。 */
  timeline: TimelinePage;
};

export const test = base.extend<Fixtures>({
  api: async (_fixtures, use) => {
    const api = await createApi();
    await use(api);
    await api.dispose();
  },

  issuePair: async ({ api }, use, testInfo) => {
    // テスト名にユニーク suffix を付けて識別しやすく
    const suffix = `${testInfo.title.replace(/\s+/g, "-").slice(0, 40)}-${Date.now()}`;
    const [src, tgt] = await Promise.all([
      api.createIssue(`e2e-src-${suffix}`, { start: 0, end: 3 }),
      api.createIssue(`e2e-tgt-${suffix}`, { start: 4, end: 7 }),
    ]);

    await use({ src, tgt });

    // 失敗テストでも確実に cleanup(afterEach 相当)
    await Promise.allSettled([api.deleteIssue(src.id), api.deleteIssue(tgt.id)]);
  },

  timeline: async ({ page, issuePair }, use) => {
    const tp = new TimelinePage(page);
    await tp.gotoIssueGantt();
    await tp.waitForBlock(issuePair.src.id);
    await tp.waitForBlock(issuePair.tgt.id);
    await use(tp);
  },
});

export { expect } from "@playwright/test";
