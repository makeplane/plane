import { test as base } from "@playwright/test";
import { Api, createApi, type CreatedIssue } from "./api";
import { TimelinePage } from "../pages/timeline.page";

type Fixtures = {
  api: Api;
  /** Issue を 2 つ作成した状態(src / tgt)でテストに渡す。afterEach で自動削除。 */
  issuePair: { src: CreatedIssue; tgt: CreatedIssue };
  /** Gantt 画面へ遷移した TimelinePage POM。`issuePair` に依存して構築される。 */
  timeline: TimelinePage;
  /**
   * Phase 6 (D-06): src→tgt の blocking リレーションが既にシードされた状態で
   * 2 つの Issue を渡す。propagationTimeline と組み合わせて TEST-23 / TEST-24 で使用。
   *
   * Day spacing (D-06b): src start+0/end+3, tgt start+5/end+8 — 2-day gap, 3-day duration each.
   * これにより src を +4 日右にドラッグすると src.target=+7 が tgt.start=+5 を超え、
   * boundary violation で tgt が右シフトされる。
   *
   * Cleanup: IssueRelation.issue は ON DELETE CASCADE のため src 削除でリレーション行も自動除去。
   */
  propagationPair: { src: CreatedIssue; tgt: CreatedIssue };
  /** Gantt 画面へ遷移した TimelinePage POM。`propagationPair` に依存。 */
  propagationTimeline: TimelinePage;
};

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  api: async ({}, use) => {
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

  propagationPair: async ({ api }, use, testInfo) => {
    // D-06b: src start+0/end+3, tgt start+5/end+8 — 2-day gap で boundary violation を確実に発生させる
    const suffix = `${testInfo.title.replace(/\s+/g, "-").slice(0, 40)}-${Date.now()}`;
    const [src, tgt] = await Promise.all([
      api.createIssue(`e2e-prop-src-${suffix}`, { start: 0, end: 3 }),
      api.createIssue(`e2e-prop-tgt-${suffix}`, { start: 5, end: 8 }),
    ]);

    // blocking リレーションを API 経由でシード(D-06: 関係作成は UI ドラッグではなくセットアップ)
    await api.createIssueRelation(src.id, tgt.id, "blocking");

    await use({ src, tgt });

    // IssueRelation は ON DELETE CASCADE なので src 削除で自動的に除去される(D-05b)
    await Promise.allSettled([api.deleteIssue(src.id), api.deleteIssue(tgt.id)]);
  },

  propagationTimeline: async ({ page, propagationPair }, use) => {
    const tp = new TimelinePage(page);
    await tp.gotoIssueGantt();
    await tp.waitForBlock(propagationPair.src.id);
    await tp.waitForBlock(propagationPair.tgt.id);
    await use(tp);
  },
});

export { expect } from "@playwright/test";
