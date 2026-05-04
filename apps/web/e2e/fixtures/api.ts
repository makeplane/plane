import path from "node:path";
import { fileURLToPath } from "node:url";
import { type APIRequestContext, expect, request as apiRequest } from "@playwright/test";
import { env } from "./env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// playwright.config.ts と同じ絶対パスを構築(CWD に依存しない)
const AUTH_STATE = path.join(__dirname, "..", "..", "playwright", ".auth", "user.json");

export type CreatedIssue = {
  id: string;
  name: string;
  start_date: string | null;
  target_date: string | null;
};

/**
 * storageState を保持した APIRequestContext を作り、CSRF を掴んだ状態で返す。
 * 使い終わったら dispose() を呼ぶ(fixture 側で自動化)。
 */
export async function createApi(): Promise<Api> {
  const context = await apiRequest.newContext({
    baseURL: env.apiBaseURL,
    // setup で保存した storageState を使う(Cookie: session-id が自動送信される)
    storageState: AUTH_STATE,
  });

  // CSRF トークンを事前取得(以降の POST/DELETE で X-CSRFTOKEN に付与)
  const csrfResp = await context.get("/auth/get-csrf-token/");
  expect(csrfResp.status()).toBe(200);
  const { csrf_token } = (await csrfResp.json()) as { csrf_token: string };

  return new Api(context, csrf_token);
}

export class Api {
  constructor(
    private readonly ctx: APIRequestContext,
    private readonly csrf: string
  ) {}

  async createIssue(name: string, daysFromNow = { start: 0, end: 7 }): Promise<CreatedIssue> {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() + daysFromNow.start);
    const end = new Date(today);
    end.setDate(end.getDate() + daysFromNow.end);

    const payload = {
      name,
      start_date: start.toISOString().slice(0, 10),
      target_date: end.toISOString().slice(0, 10),
    };

    const resp = await this.ctx.post(`/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/`, {
      data: payload,
      headers: { "X-CSRFTOKEN": this.csrf },
    });
    expect(resp.status(), `createIssue failed: ${resp.status()} ${await resp.text()}`).toBe(201);
    const body = (await resp.json()) as CreatedIssue;
    return body;
  }

  async deleteIssue(issueId: string): Promise<void> {
    const resp = await this.ctx.delete(
      `/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/${issueId}/`,
      { headers: { "X-CSRFTOKEN": this.csrf } }
    );
    // 204 No Content を期待。既に削除済み(404)は許容(冪等な cleanup)
    expect([204, 404], `deleteIssue unexpected status: ${resp.status()}`).toContain(resp.status());
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }

  /**
   * 2 つの Issue 間にリレーションをシードする(D-05)。
   *
   * URL: POST /api/workspaces/<slug>/projects/<projectId>/issues/<srcIssueId>/issue-relation/
   * Body: { relation_type, issues: [targetIssueId] }
   * Expected: 201 Created
   *
   * カスケード削除: IssueRelation.issue は ON DELETE CASCADE なので、
   * deleteIssue(srcIssueId) で関係行も自動削除される(D-05b)。
   */
  async createIssueRelation(
    srcIssueId: string,
    targetIssueId: string,
    relationType: "blocking" | "blocked_by" | "relates_to" | "duplicate" = "blocking"
  ): Promise<void> {
    const resp = await this.ctx.post(
      `/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/${srcIssueId}/issue-relation/`,
      {
        data: { relation_type: relationType, issues: [targetIssueId] },
        headers: { "X-CSRFTOKEN": this.csrf },
      }
    );
    expect(resp.status(), `createIssueRelation failed: ${resp.status()} ${await resp.text()}`).toBe(201);
  }

  /**
   * Issue の start_date または target_date を null にクリアする(D-05)。
   *
   * URL: PATCH /api/workspaces/<slug>/projects/<projectId>/issues/<id>/
   * Body: { [field]: null }
   * Expected: 200 OK or 204 No Content (Plane の IssueViewSet.partial_update — smoke で確定)
   *
   * 用途: TEST-24 で tgt.target_date を null にし、サーバ側の伝播時に
   *      INCOMPLETE_SCHEDULE エラーを誘発する。
   *
   * 注意(D-07a / D-07b): この PATCH は server-side のみ変更し、ブラウザの
   *      ローカル MobX ストアには通知されない(WebSocket 購読なし)。よって
   *      ブラウザの isBlockComplete ガードは true のまま — ドラッグは発火する。
   */
  async clearIssueDate(issueId: string, field: "start_date" | "target_date"): Promise<void> {
    const resp = await this.ctx.patch(
      `/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/${issueId}/`,
      {
        data: { [field]: null },
        headers: { "X-CSRFTOKEN": this.csrf },
      }
    );
    // Plane IssueViewSet.partial_update は通常 200 を返すが、204 でも許容
    expect([200, 204], `clearIssueDate unexpected status: ${resp.status()} ${await resp.text()}`).toContain(
      resp.status()
    );
  }

  /**
   * Issue を 1 件取得する(D-05)。
   *
   * URL: GET /api/workspaces/<slug>/projects/<projectId>/issues/<id>/
   * Expected: 200 OK
   * Returns: CreatedIssue 型(部分集合 — GET レスポンスは追加フィールドを持つが
   *          test 側は id / start_date / target_date のみ参照する)。
   *
   * 用途: TEST-23 で tgt.start_date / target_date が伝播後に
   *      bulk_update で永続化されたことを直接 DB から読み出して確認する。
   *      DRF の retrieve は Redis キャッシュを使わない(RESEARCH §Persistence Read Path)
   *      ため stale read のリスクなし。
   */
  async getIssue(issueId: string): Promise<CreatedIssue> {
    const resp = await this.ctx.get(
      `/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/${issueId}/`,
      { headers: { "X-CSRFTOKEN": this.csrf } }
    );
    expect(resp.status(), `getIssue failed: ${resp.status()} ${await resp.text()}`).toBe(200);
    return (await resp.json()) as CreatedIssue;
  }
}
