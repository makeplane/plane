# Timeline 依存関係ドラッグ E2E テスト環境 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/web` に Playwright E2E 基盤を導入し、Issue Gantt の依存関係ドラッグ機能(commit `f01289047c`)の回帰を防ぐ 3 テスト(#1: blocking / #2: blocked_by / #3: shift+picker→relates_to)を動作させる。

**Architecture:** Playwright `setup` project で毎回 UI ログイン → `storageState` を保存 → chromium project が storageState 付きで 3 spec を実行。API 直叩きは Playwright `request` context で CSRF ヘッダ付与。アサートは `waitForResponse`(POST /issue-relation/ の 201 + payload)+ 新設の `data-dependency-key` 属性での UI 可視チェック。

**Tech Stack:** `@playwright/test` (web ローカル devDependencies), TypeScript, 既存の Django/React スタックはそのまま。

**関連 spec:** `docs/timeline-e2e-test-environment.md`(本プランが実装対象とする設計)

---

## 前提

- ブランチ: `feature/timeline-dependency-drag`(既存、commit `f01289047c` 以降)
- 作業ディレクトリ: `/Users/hosoi/github/karashizuke/plane`(ワークスペースルート)
- 実行時の前提(テスト本体を走らせる段階でのみ必要):
  - 別ターミナルで `docker compose -f docker-compose-local.yml up` 稼働
  - 別ターミナルで `pnpm dev` 稼働(web:3000)
  - `http://localhost:3001/god-mode/` で instance admin 登録済み
  - `apps/web/e2e/.env.e2e` にテストユーザー/ワークスペース/プロジェクト情報記入済み(手動セットアップ、spec §4.6)

## File Structure

新規作成:

- `apps/web/e2e/playwright.config.ts` — Playwright 設定
- `apps/web/e2e/.env.e2e.example` — 環境変数テンプレート
- `apps/web/e2e/README.md` — 手動セットアップ手順
- `apps/web/e2e/auth/auth.setup.ts` — UI ログイン → storageState 保存
- `apps/web/e2e/fixtures/env.ts` — .env.e2e ローダ(dotenv)
- `apps/web/e2e/fixtures/api.ts` — authenticated request helper(CSRF 付き)
- `apps/web/e2e/fixtures/test-fixtures.ts` — `test.extend()` で api + timelinePage + 自動 cleanup
- `apps/web/e2e/pages/timeline.page.ts` — POM: gotoIssueGantt / waitForBlock / dragRightTo / dragLeftTo / clickPickerOption
- `apps/web/e2e/specs/timeline-dependency-drag.spec.ts` — 3 テスト

既存変更:

- `apps/web/package.json` — devDependencies に `@playwright/test` 追加、scripts 追加
- `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx:190` — `<g key={key}>` → `<g key={key} data-dependency-key={key}>`
- `.gitignore`(リポジトリルート)— `apps/web/playwright/.auth/`, `apps/web/test-results/`, `apps/web/playwright-report/`, `apps/web/e2e/.env.e2e` 追加
- `pnpm-lock.yaml` — Playwright インストールに伴う自動更新

変更しないもの:

- `turbo.json`(CI 統合は本 PR 対象外、spec §4.5)
- 他の `apps/*` / `packages/*`

---

## Task 1: Playwright devDependency 追加とスクリプト登録

**Files:**

- Modify: `apps/web/package.json`

- [ ] **Step 1: Playwright を web パッケージに追加**

Run:

```bash
pnpm --filter=web add -D @playwright/test@^1.48.0
```

Expected: `apps/web/package.json` の devDependencies に `@playwright/test` が追加される。`dotenv` は既に apps/web に catalog 経由で存在(`package.json:85`)のため追加不要。

- [ ] **Step 2: scripts セクションを更新**

`apps/web/package.json` の `scripts` を以下に変更:

```json
{
  "scripts": {
    "dev": "react-router dev --port 3000",
    "build": "react-router build",
    "preview": "react-router build && serve -s build/client -l 3000",
    "start": "serve -s build/client -l 3000",
    "clean": "rm -rf .turbo && rm -rf .next && rm -rf .react-router && rm -rf node_modules && rm -rf dist && rm -rf build",
    "check:lint": "oxlint --max-warnings=11957 .",
    "check:types": "react-router typegen && tsc --noEmit",
    "check:format": "oxfmt --check .",
    "fix:lint": "oxlint --fix .",
    "fix:format": "oxfmt .",
    "test:e2e": "playwright test --config=e2e/playwright.config.ts",
    "test:e2e:ui": "playwright test --config=e2e/playwright.config.ts --ui",
    "test:e2e:debug": "playwright test --config=e2e/playwright.config.ts --debug",
    "test:e2e:install": "playwright install chromium"
  }
}
```

- [ ] **Step 3: Chromium バイナリをインストール**

Run:

```bash
pnpm --filter=web test:e2e:install
```

Expected: Chromium が `~/Library/Caches/ms-playwright/` にダウンロードされる。

- [ ] **Step 4: インストール確認**

Run:

```bash
pnpm --filter=web exec playwright --version
```

Expected: `Version 1.48.x` など(1.48.0 以上)。

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add @playwright/test devDependency and e2e scripts"
```

---

## Task 2: .gitignore 追記

**Files:**

- Modify: `.gitignore`(リポジトリルート)

- [ ] **Step 1: 現状確認**

Run:

```bash
grep -n "playwright\|e2e" .gitignore || echo "not present"
```

- [ ] **Step 2: 末尾に追記**

以下を `.gitignore` の末尾に追加(既存のセクション区切りを維持):

```
# Playwright E2E (apps/web)
apps/web/playwright/.auth/
apps/web/test-results/
apps/web/playwright-report/
apps/web/e2e/.env.e2e
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore playwright artifacts and e2e secrets"
```

---

## Task 3: .env.e2e.example と e2e/README.md を作成

**Files:**

- Create: `apps/web/e2e/.env.e2e.example`
- Create: `apps/web/e2e/README.md`

- [ ] **Step 1: .env.e2e.example を作成**

`apps/web/e2e/.env.e2e.example`:

```
# Playwright E2E 環境変数(apps/web/e2e/ で使用)
# このファイルをコピーして apps/web/e2e/.env.e2e を作成し、値を埋める。
# .env.e2e は .gitignore 対象。

E2E_BASE_URL=http://localhost:3000
E2E_API_BASE_URL=http://localhost:8000
E2E_USER_EMAIL=e2e-user@example.com
E2E_USER_PASSWORD=e2e-password
E2E_WORKSPACE_SLUG=e2e-workspace
E2E_PROJECT_ID=00000000-0000-0000-0000-000000000000
```

- [ ] **Step 2: README.md を作成**

`apps/web/e2e/README.md`:

````markdown
# Plane Web E2E (Playwright)

Issue Gantt の依存関係ドラッグ機能(commit `f01289047c`)の回帰防止を目的とする E2E テスト。
設計ドキュメント: `docs/timeline-e2e-test-environment.md`

## 初回セットアップ(手動、約 5 分)

1. 既定のローカル開発スタックを起動:
   ```bash
   docker compose -f docker-compose-local.yml up
   ```
````

2. 別ターミナルで web サーバを起動:
   ```bash
   pnpm dev
   ```
3. `http://localhost:3001/god-mode/` を開き、instance admin を登録(初回のみ、以降の開発と共用可)。
4. `http://localhost:3000` でテスト用ユーザーを作成:
   - メール: `e2e-user@example.com`
   - パスワード: 任意
5. ワークスペース `e2e-workspace`(slug も同じ)を作成。
6. プロジェクトを作成(任意名)。URL の UUID(`projects/<uuid>/...`)を控える。
7. プロジェクトの Issues ページを開き、layout を **Gantt** に切り替える(以降は user preference として保持される)。
8. `.env.e2e.example` をコピーして値を記入:
   ```bash
   cp apps/web/e2e/.env.e2e.example apps/web/e2e/.env.e2e
   # エディタで E2E_USER_PASSWORD と E2E_PROJECT_ID を更新
   ```

## 実行

```bash
# ヘッドレス実行(通常)
pnpm --filter=web test:e2e

# UI モード(デバッグ向け、GUI で各ステップを追える)
pnpm --filter=web test:e2e:ui

# デバッグ(breakpoint でステップ実行)
pnpm --filter=web test:e2e:debug
```

失敗時は `apps/web/playwright-report/` に HTML レポートが生成される。
trace / video は `apps/web/test-results/` に保存(`playwright.config.ts` の `trace`/`video` 設定参照)。

## 前提

- docker-compose-local.yml が up 状態であること
- `pnpm dev` で web:3000 が起動していること
- `.env.e2e` が正しく記入されていること

テストは web サーバを自分で起動しない。別ターミナルで `pnpm dev` を維持。

````

- [ ] **Step 3: Commit**

```bash
git add apps/web/e2e/.env.e2e.example apps/web/e2e/README.md
git commit -m "docs(web/e2e): add env template and setup README"
````

---

## Task 4: Playwright 設定ファイル

**Files:**

- Create: `apps/web/e2e/playwright.config.ts`

- [ ] **Step 1: playwright.config.ts を作成**

`apps/web/e2e/playwright.config.ts`:

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env.e2e をこの config の横から読み込む(存在しなくてもエラーにしない)
dotenv.config({ path: path.join(__dirname, ".env.e2e") });

const AUTH_STATE = path.join(__dirname, "..", "playwright", ".auth", "user.json");

export default defineConfig({
  testDir: path.join(__dirname, "specs"),
  // 初期は逐次実行。共有のテストプロジェクトなので並列はデータ競合を招く
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: path.join(__dirname, "..", "playwright-report") }]],
  outputDir: path.join(__dirname, "..", "test-results"),
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*auth\.setup\.ts/,
      testDir: path.join(__dirname, "auth"),
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_STATE,
      },
    },
  ],
});
```

- [ ] **Step 2: TypeScript がパスを解決できるか確認**

Run:

```bash
pnpm --filter=web exec tsc --noEmit --project apps/web/tsconfig.json
```

Expected: エラーなし(`@playwright/test` と `dotenv` の型が解決される)。既存の web tsconfig には e2e を含めていないので、現時点ではエラーが出るなら次 Step で e2e 用 tsconfig を追加。

- [ ] **Step 3: (エラーが出た場合のみ) e2e 専用 tsconfig を追加**

Playwright は `tsconfig.json` を test ディレクトリから上方向に探すため、`apps/web/e2e/tsconfig.json` を作成:

```json
{
  "extends": "../tsconfig.json",
  "include": ["./**/*.ts"],
  "exclude": [],
  "compilerOptions": {
    "noEmit": true,
    "types": ["@playwright/test", "node"]
  }
}
```

- [ ] **Step 4: 設定読み込みを smoke 確認**

Run:

```bash
pnpm --filter=web exec playwright test --config=e2e/playwright.config.ts --list
```

Expected: `Total: 0 tests in 0 files` のような出力(specs 空なので 0 でも OK、エラーで落ちなければ設定 OK)。

- [ ] **Step 5: Commit**

```bash
git add apps/web/e2e/playwright.config.ts apps/web/e2e/tsconfig.json
git commit -m "chore(web/e2e): add playwright config and tsconfig"
```

(tsconfig.json は作っていなければ add から除外)

---

## Task 5: 環境変数ローダとログイン情報の型

**Files:**

- Create: `apps/web/e2e/fixtures/env.ts`

- [ ] **Step 1: env.ts を作成**

`apps/web/e2e/fixtures/env.ts`:

```ts
/**
 * .env.e2e から必須変数を読み出す。
 * playwright.config.ts で既に dotenv.config() 済みなので process.env を参照するだけ。
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. ` +
        `Copy apps/web/e2e/.env.e2e.example to apps/web/e2e/.env.e2e and fill values. ` +
        `See apps/web/e2e/README.md.`
    );
  }
  return value;
}

export const env = {
  baseURL: required("E2E_BASE_URL"),
  apiBaseURL: required("E2E_API_BASE_URL"),
  userEmail: required("E2E_USER_EMAIL"),
  userPassword: required("E2E_USER_PASSWORD"),
  workspaceSlug: required("E2E_WORKSPACE_SLUG"),
  projectId: required("E2E_PROJECT_ID"),
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/e2e/fixtures/env.ts
git commit -m "feat(web/e2e): add env loader with fail-fast validation"
```

---

## Task 6: UI ログイン setup(storageState 書き出し)

**Files:**

- Create: `apps/web/e2e/auth/auth.setup.ts`

**背景:**

- sign-in は HTML form POST(`action="/auth/sign-in/"`, `packages/services/src/auth/auth.service.ts` および `apps/web/core/components/account/auth-forms/password.tsx:151` 参照)
- Django CSRF は `/auth/get-csrf-token/` で JSON 取得(`{ csrf_token: "..." }`)、ヘッダ名は `X-CSRFTOKEN`(spec §4.1)
- UI ログインはフォーム送信後にリダイレクト → `session-id` Cookie がセットされる

- [ ] **Step 1: auth.setup.ts を作成**

`apps/web/e2e/auth/auth.setup.ts`:

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as setup, expect } from "@playwright/test";
import { env } from "../fixtures/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_STATE = path.join(__dirname, "..", "..", "playwright", ".auth", "user.json");

setup("authenticate via UI login", async ({ page }) => {
  // ログイン画面へ遷移(既にログイン済みなら home にリダイレクトされるので、明示的にサインインページへ)
  await page.goto("/auth/sign-in/");

  // 2 段階フォーム: email → continue → password → sign in
  await page.getByLabel(/email/i).fill(env.userEmail);
  await page.getByRole("button", { name: /continue/i }).click();

  await page.getByLabel(/password/i).fill(env.userPassword);
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // ログイン成功の判定:
  //  - /auth/sign-in/ から離脱
  //  - ワークスペース側の URL にリダイレクト
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/"), { timeout: 15_000 });

  // storageState を保存
  await page.context().storageState({ path: AUTH_STATE });

  // 念のためサニティチェック: session-id cookie が保存されたか
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === "session-id")).toBe(true);
});
```

- [ ] **Step 2: setup が実行されるか確認(spec がない段階でも setup project は走る)**

Run(docker + pnpm dev が稼働中、.env.e2e 記入済みの前提):

```bash
pnpm --filter=web exec playwright test --config=e2e/playwright.config.ts --project=setup
```

Expected: 1 passed(`playwright/.auth/user.json` が生成される)。失敗した場合:

- `getByLabel(/email/i)` のセレクタがログイン画面と合っていない → `apps/web/core/components/account/auth-forms/password.tsx` と `email.tsx` の実装を確認してセレクタを実態に合わせる
- ログイン後の URL 判定が合わない → `waitForURL` の条件を観察した実際の URL に寄せる

- [ ] **Step 3: storageState の中身を確認**

Run:

```bash
test -f apps/web/playwright/.auth/user.json && echo "OK"
```

Expected: `OK`。

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e/auth/auth.setup.ts
git commit -m "feat(web/e2e): add auth setup that logs in via UI and saves storageState"
```

---

## Task 7: 認証付き API helper(CSRF 対応)

**Files:**

- Create: `apps/web/e2e/fixtures/api.ts`

- [ ] **Step 1: api.ts を作成**

`apps/web/e2e/fixtures/api.ts`:

```ts
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
  start_date: string;
  target_date: string;
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
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/e2e/fixtures/api.ts
git commit -m "feat(web/e2e): add authenticated API helper with CSRF handling"
```

---

## Task 8: テスト fixture(auto cleanup 付き)

**Files:**

- Create: `apps/web/e2e/fixtures/test-fixtures.ts`

- [ ] **Step 1: test-fixtures.ts を作成**

`apps/web/e2e/fixtures/test-fixtures.ts`:

```ts
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
});

export { expect } from "@playwright/test";
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/e2e/fixtures/test-fixtures.ts
git commit -m "feat(web/e2e): add test fixtures with auto issue cleanup"
```

---

## Task 9: Timeline POM(ドラッグ操作ヘルパ)

**Files:**

- Create: `apps/web/e2e/pages/timeline.page.ts`

**背景 (spec §4.3):**

- ハンドルは `data-block-id` 要素の **右端外側 6〜18px**(`left-full translate-x-1.5 w-3`)
- ハンドルは `isBlockActive` 時のみ opacity=1 なので、まず hover が必要
- 中間 move は `page.mouse.move(x, y, { steps: 20 })`
- picker は `role="dialog"` + `aria-label="Pick dependency type"`

- [ ] **Step 1: timeline.page.ts を作成**

`apps/web/e2e/pages/timeline.page.ts`:

```ts
import { type Locator, type Page, expect } from "@playwright/test";
import { env } from "../fixtures/env";

const HANDLE_OFFSET_X = 12; // block 右端から 12px 外側(6〜18px の中央)
const DRAG_STEPS = 20;

export class TimelinePage {
  constructor(private readonly page: Page) {}

  /**
   * ワークスペース > プロジェクト > Issues(Gantt レイアウト)へ遷移。
   * Issue layout の Gantt 切り替えはユーザー preference として API に保持されているので、
   * 画面遷移だけで Gantt が表示される想定(手動セットアップで事前設定済み、spec §4.6)。
   */
  async gotoIssueGantt(): Promise<void> {
    await this.page.goto(`/${env.workspaceSlug}/projects/${env.projectId}/issues/`);
    // Gantt コンテナの可視化を待機
    await this.page.locator("#gantt-container").waitFor({ state: "visible", timeout: 15_000 });
  }

  /** 指定 issue のブロックが DOM に登場するまで待機。 */
  async waitForBlock(issueId: string): Promise<void> {
    await this.page.locator(`[data-block-id="${issueId}"]`).waitFor({ state: "visible", timeout: 10_000 });
  }

  block(issueId: string): Locator {
    return this.page.locator(`[data-block-id="${issueId}"]`);
  }

  /**
   * source の右ハンドル → target の左端中央へドラッグ(期待: relation_type=blocking)。
   *
   * shiftKey=true のとき: mouse.up の直前に Shift を押し、picker を開いたまま離す。
   * 呼び出し側で picker 操作(relates_to クリック等)を継続する。
   */
  async dragRightTo(sourceIssueId: string, targetIssueId: string, options: { shiftKey?: boolean } = {}): Promise<void> {
    await this.startDragFromEdge(sourceIssueId, "right");
    await this.dropOnEdge(targetIssueId, "left", options);
  }

  /**
   * source の左ハンドル → target の右端中央へドラッグ(期待: relation_type=blocked_by)。
   */
  async dragLeftTo(sourceIssueId: string, targetIssueId: string, options: { shiftKey?: boolean } = {}): Promise<void> {
    await this.startDragFromEdge(sourceIssueId, "left");
    await this.dropOnEdge(targetIssueId, "right", options);
  }

  private async startDragFromEdge(issueId: string, edge: "left" | "right"): Promise<void> {
    const block = this.block(issueId);
    // hover で isBlockActive=true にする(ハンドル opacity 0 → 1)
    await block.hover();
    const box = await block.boundingBox();
    expect(box, `block ${issueId} has no bounding box`).not.toBeNull();
    if (!box) return;

    // ハンドルは block の外側 12px
    const x = edge === "right" ? box.x + box.width + HANDLE_OFFSET_X : box.x - HANDLE_OFFSET_X;
    const y = box.y + box.height / 2;
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
  }

  private async dropOnEdge(issueId: string, edge: "left" | "right", options: { shiftKey?: boolean }): Promise<void> {
    const block = this.block(issueId);
    const box = await block.boundingBox();
    expect(box, `target block ${issueId} has no bounding box`).not.toBeNull();
    if (!box) return;

    // target の半分判定: left → rect の左 1/4、right → rect の右 1/4
    const x = edge === "left" ? box.x + box.width * 0.25 : box.x + box.width * 0.75;
    const y = box.y + box.height / 2;
    await this.page.mouse.move(x, y, { steps: DRAG_STEPS });

    if (options.shiftKey) {
      await this.page.keyboard.down("Shift");
    }
    await this.page.mouse.up();
    if (options.shiftKey) {
      await this.page.keyboard.up("Shift");
    }
  }

  /** relation-type picker(Shift+drop 後に出現)の locator。 */
  get picker(): Locator {
    return this.page.locator('[role="dialog"][aria-label="Pick dependency type"]');
  }

  async clickPickerOption(option: "blocking" | "blocked_by" | "relates_to" | "duplicate"): Promise<void> {
    // picker option button のラベルは翻訳キー `gantt_dependency.picker.<type>` 経由
    // (relation-type-picker.tsx 参照)。アクセシブル名 = 翻訳結果で click
    const nameRegex: Record<string, RegExp> = {
      blocking: /blocking/i,
      blocked_by: /blocked by/i,
      relates_to: /relates to/i,
      duplicate: /duplicate/i,
    };
    await this.picker.getByRole("button", { name: nameRegex[option] }).click();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/e2e/pages/timeline.page.ts
git commit -m "feat(web/e2e): add TimelinePage POM with drag helpers"
```

---

## Task 10: Test #1(right handle → blocking)— これが data-dependency-key の TDD トリガー

**Files:**

- Create: `apps/web/e2e/specs/timeline-dependency-drag.spec.ts`

- [ ] **Step 1: Spec file を作成(test #1 のみ)**

`apps/web/e2e/specs/timeline-dependency-drag.spec.ts`:

```ts
import { test, expect } from "../fixtures/test-fixtures";
import { env } from "../fixtures/env";

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
```

- [ ] **Step 2: 実行 — この時点で UI アサート部分が失敗することを確認**

Run(docker + pnpm dev 稼働中、.env.e2e 記入済み):

```bash
pnpm --filter=web test:e2e
```

Expected: **1 FAILED**。理由: `data-dependency-key` 属性がまだ prod コードに存在しないため `toBeVisible` が timeout。API レスポンス部分はパスする(201 + 正しい payload)のでログで確認。

もし API レスポンスまでで落ちた場合は spec / fixture / POM 側の問題なので、先にそこを修正してから次 Step へ。

- [ ] **Step 3: prod コードに `data-dependency-key` 属性を追加**

Modify `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx`:

L190 付近、`<g key={key}>` を `<g key={key} data-dependency-key={key}>` に変更。

diff:

```diff
-          <g key={key}>
+          <g key={key} data-dependency-key={key}>
```

- [ ] **Step 4: 再実行 — PASS を確認**

Run:

```bash
pnpm --filter=web test:e2e
```

Expected: **1 passed**。

- [ ] **Step 5: Commit(2 コミットに分割)**

```bash
# prod 変更を先に切り出す(E2E 以外の文脈でも review しやすく)
git add apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx
git commit -m "feat(gantt): add data-dependency-key attribute on persistent dependency paths"

# spec を続けて
git add apps/web/e2e/specs/timeline-dependency-drag.spec.ts
git commit -m "test(web/e2e): verify right-handle drag creates blocking relation"
```

---

## Task 11: Test #2(left handle → blocked_by、mirror 方向の描画検証)

**Files:**

- Modify: `apps/web/e2e/specs/timeline-dependency-drag.spec.ts`

- [ ] **Step 1: Test #2 を追加**

`apps/web/e2e/specs/timeline-dependency-drag.spec.ts` に以下のテストを追加(既存 `test.describe` ブロック内):

```ts
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
```

- [ ] **Step 2: 実行 — PASS 確認**

Run:

```bash
pnpm --filter=web test:e2e
```

Expected: **2 passed**。

もし落ちた場合のデバッグ観点:

- POST payload の `relation_type` が `blocked_by` になっていない → source.edge=left, target.edge=right の geometry が期待と合っていない → `HANDLE_OFFSET_X` / target 側の 1/4 判定を確認
- data-key が逆向きで不在 → `dependency-paths.tsx:103` で `blocking` のみ iterate していることを改めて確認(もし `blocked_by` も iterate に含む変更があったら spec 側の前提が崩れる)

- [ ] **Step 3: Commit**

```bash
git add apps/web/e2e/specs/timeline-dependency-drag.spec.ts
git commit -m "test(web/e2e): verify left-handle drag creates blocked_by relation with mirror render"
```

---

## Task 12: Test #3(Shift+drop → picker → relates_to)

**Files:**

- Modify: `apps/web/e2e/specs/timeline-dependency-drag.spec.ts`

- [ ] **Step 1: Test #3 を追加**

同ファイル `test.describe` ブロック内に追加:

```ts
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
```

- [ ] **Step 2: 実行 — PASS 確認**

Run:

```bash
pnpm --filter=web test:e2e
```

Expected: **3 passed**。

デバッグ観点:

- picker が表示されない → POM の `shiftKey` 扱い(`keyboard.down("Shift")` → `mouse.up()` → `keyboard.up("Shift")` の順序)を確認。`use-dependency-drag.ts:275` は `e.shiftKey` を mouseup イベントで見るので、**mouse.up の時点で Shift が押されている** 必要がある
- picker の button が見つからない → `getByRole("button", { name: /relates to/i })` の翻訳結果(英語 UI 前提)を実画面で確認。日本語 UI なら `/関連/i` 等が必要
- API が呼ばれない → picker の `onResolve` が渡されていない / picker 外クリックで dismiss されていないか確認

- [ ] **Step 3: Commit**

```bash
git add apps/web/e2e/specs/timeline-dependency-drag.spec.ts
git commit -m "test(web/e2e): verify shift-drop picker creates relates_to relation"
```

---

## Task 13: Lint / format / full check を通す

**Files:**

- 全新規 e2e ファイル

- [ ] **Step 1: format**

Run:

```bash
pnpm --filter=web fix:format
```

Expected: 整形のみ(警告なし)。

- [ ] **Step 2: lint**

Run:

```bash
pnpm --filter=web check:lint
```

Expected: `--max-warnings=11957` 据え置きで PASS。新規 e2e コードに lint 違反があれば修正。

- [ ] **Step 3: types**

Run:

```bash
pnpm --filter=web check:types
```

Expected: エラーなし。

- [ ] **Step 4: 変更があれば Commit**

```bash
git add -u
git status
# 必要なものだけ明示 add
git commit -m "style(web/e2e): apply oxfmt and lint fixes"
```

(変更なければスキップ)

---

## Task 14: E2E 全 3 テストを通す最終確認

- [ ] **Step 1: クリーンな状態で実行**

Run:

```bash
# storageState を削除してフルパスを通す
rm -rf apps/web/playwright/.auth/
pnpm --filter=web test:e2e
```

Expected:

- `setup` project が 1 回走り storageState 作成
- chromium project で 3 tests passed
- 合計: `1 setup passed`, `3 passed`

- [ ] **Step 2: HTML レポートを眺めて失敗がないこと、trace が過剰でないことを確認**

Run:

```bash
open apps/web/playwright-report/index.html
```

(または `pnpm --filter=web exec playwright show-report`)

Expected: 3 緑。

- [ ] **Step 3: 同じコマンドを 2 回連続で走らせて冪等性を確認(1 回目で作られた issue が残っていない)**

Run:

```bash
pnpm --filter=web test:e2e && pnpm --filter=web test:e2e
```

Expected: どちらも 3 passed。issuePair fixture の afterEach 削除が効いていることの検証。

- [ ] **Step 4: Final commit(もしあれば)**

ここまで残った変更があれば commit。通常は Task 13 までで尽きている。

---

## Self-Review チェック(執筆者が後で必ず実施)

本プラン確定後のチェック項目(実装者も着手前に眺めてください):

**1. Spec coverage:** spec §1.3 / §3 / §4 の各要件に対応タスクがあるか

- §1.3 テスト #1 #2 #3 → Task 10 / 11 / 12
- §3.1 ディレクトリ → Task 3〜9
- §3.2 Playwright config → Task 4
- §3.3 前提条件 → Task 3(README に記載)
- §3.4 環境変数 → Task 3(.env.e2e.example)+ Task 5(env.ts ローダ)
- §4.1 CSRF → Task 7
- §4.2 fixture 設計 → Task 7/8
- §4.3 ドラッグ機構 → Task 9(POM)
- §4.4 初期テスト → Task 10/11/12
- §4.5 リポジトリ統合(scripts/gitignore/lint)→ Task 1/2/13
- §4.6 ブートストラップ → Task 3(README)
- §4.7 data-dependency-key 追加 → Task 10 Step 3

**2. Placeholder scan:** `TBD` / `TODO` / 空コードブロック → 本プランに残存なし(デバッグ観点の助言は含むが実装コードは全出し)

**3. Type consistency:** `Api` クラスのメソッド名(`createIssue`/`deleteIssue`/`dispose`)、fixture 名(`api`/`issuePair`/`timeline`)、POM メソッド名(`dragRightTo`/`dragLeftTo`/`clickPickerOption`)が Task 間で一致

---

## 備考

- **ログインフォームのセレクタ**(Task 6)は実画面のアクセシブル名に合わせて微調整が必要になる場合があります。失敗時は `pnpm --filter=web test:e2e:ui` で UI モードを開き、目視で正しい selector を探るのが最速です。
- **日本語 UI でテストを回す場合** は Task 9 `clickPickerOption` の regex を日本語翻訳に合わせる必要があります。環境変数で UI 言語を固定できるなら `en-US` 強制を検討。
- **Turborepo `test:e2e` 未登録** は意図的(spec §4.5)。ローカル実行は必ず `pnpm --filter=web test:e2e` で直接行う。将来 CI 統合時に `turbo.json` への追加を再検討。
