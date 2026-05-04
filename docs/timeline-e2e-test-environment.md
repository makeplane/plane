# Timeline 依存関係ドラッグ E2E テスト環境構築 設計ドキュメント

作成日: 2026-04-15
対象コミット: `f01289047c feat: add timeline dependency drag UI for Issue gantt`
関連ドキュメント: `docs/timeline-dependency-implementation.md`

## ステータス

**Approved** — 2026-04-15 ブレインストーミングで全決定完了。次は実装プラン作成(`writing-plans` スキル)へ。

---

## 1. 目的と背景

### 1.1 目的

直近コミット `f01289047c` で追加した Issue Gantt の「依存関係ドラッグ UI」(ブロックの左/右ハンドルから別ブロックへドラッグして `blocked_by` / `blocking` 関係を作成する機能)の回帰防止を主目的とする E2E テスト環境を構築する。

同時に、将来他の UI テストを追加しやすいよう、認証とデータ seed の最小限の再利用可能な土台も整える(スコープは中間 = C)。

### 1.2 現状

- `apps/web` に E2E テスト基盤は存在しない(Playwright / Cypress ともに)
- `CLAUDE.md` も「Most frontend packages currently have no test harness — do not invent one without asking」と明示
- テスト基盤があるのは `apps/live`(Vitest), `packages/codemods`(Jest), `apps/api/plane/tests`(pytest)のみ
- バックエンド API はすべて完成済み(`IssueRelationViewSet` → `POST /api/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-relation/`)※ `/api/` は session-cookie 認証の internal app API。`/api/v1/` は X-API-KEY 認証の public API で別物

### 1.3 検証対象機能(ブラックボックス観点)

今回の実装でカバーしたい主なインタラクション:

| #   | 入力                                                   | 期待動作                                                         |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| 1   | ブロック A の右ハンドルからブロック B の左端へドラッグ | `A blocking B` 関係が作成される(`relation_type = blocking`)      |
| 2   | ブロック A の左ハンドルからブロック B の右端へドラッグ | `A blocked_by B` 関係が作成される                                |
| 3   | Shift を押しながらドロップ                             | relation-type picker が開く(`relates_to` / `duplicate` 選択可能) |
| 4   | 自分自身にドロップ                                     | 赤パス表示、API 呼び出しなし                                     |
| 5   | 既存関係の重複ドロップ                                 | 赤パス表示、API 呼び出しなし                                     |
| 6   | 循環を作るドロップ                                     | 赤パス表示、API 呼び出しなし                                     |
| 8   | 確定済みの依存線のホバー削除ボタン                     | 関係が削除される                                                 |
| 9   | ドラッグ中に Escape                                    | ドラッグがキャンセルされる                                       |

**スコープ内訳:**

- **初期実装**: #1, #2, #3(合計 3 本)— happy path + picker フロー
- **段階的追加**: #4, #5, #6, #8, #9 — Vitest 導入時に #4〜#6 は unit test へ逃がす可能性あり(§4.4 / §4.8 参照)
- **スコープ外**: `source.target_date > target.start_date` の日付競合ケース
  - 実装上このケースは赤いパスを表示するが **commit は許可される**(`use-dependency-drag.ts` の `resolveDrop` は日付チェックを行わない / `draggable-dependency-path.tsx:54-57` のコメント参照)
  - 日付競合で commit を止めるかは将来のプロダクト判断で変わり得るため E2E に固定しない

---

## 2. 決定事項

ブレインストーミングで確定したもの。

### 2.1 スコープ: **C(中間)**

今回の依存関係ドラッグ機能のテストを書くことが第一目的。その過程で、認証と最小の再利用可能な土台(API helper / storageState / POM パターンの原型)だけは整える。将来タイムライン以外の UI テストを書く際に下敷きになる。

**除外:** Storybook ビジュアルテスト、ユニットテスト(既存の live/codemods 流儀と分離)、ロードテスト、Axe などアクセシビリティ自動検査。

### 2.2 テスト実行環境: **A(既存ローカルスタック再利用)**

- `docker compose -f docker-compose-local.yml up` で立つ Postgres / API / Valkey / MinIO / Celery を前提
- `pnpm dev` で起動した web(:3000)に対してテストを走らせる
- テスト用の固定「ユーザー / ワークスペース / プロジェクト」を 1 回手で作成し `.env.e2e` に記述(§4.6)
- issue は各テストの前後で API 経由で作成/削除(状態はテスト内で完結)

### 2.3 認証: **B(UI ログイン 1 回 + storageState 再利用)**

- Global setup で `/auth/sign-in/` に実際の UI ログインを行い、Cookie を `playwright/.auth/user.json` に保存
- 各テストは `storageState` を指定するだけで認証済みコンテキストで起動
- API 直叩き(issue 作成/削除)も同じ storageState を持つ `request` コンテキストで CSRF ヘッダ付きで送る(§4.1)
- setup は **毎回の `pnpm test:e2e` 実行で再実行** される(Playwright `dependencies` 機構のデフォルト)ため storageState の期限切れは発生しない

### 2.4 テストフレームワーク: **Playwright**

**決定理由(最重要):** 今回実装した依存ドラッグは **ネイティブ `mousedown` / `mousemove` / `mouseup` イベント + `document.elementFromPoint` でターゲット検出** しているため、HTML5 drag-and-drop API を使うツール(Playwright の `dragTo` も含む)では発火できない。`page.mouse.down()` / `page.mouse.move(x, y, { steps: N })` / `page.mouse.up()` で中間 move イベント付きの手動制御が必須。

Playwright は:

- 中間 mousemove を `steps` オプションで明示制御可能
- `storageState` による Cookie 再利用が標準
- 同一セッション内で `request` fixture により API 叩きが可能
- 失敗時の trace / video / screenshot を標準で出せる
- 既に `node_modules` に存在(Storybook の依存経由)

### 2.5 配置: **`apps/web/e2e/`**

Turborepo 的に `apps/web` のサブツリーに置き、`pnpm --filter=web test:e2e` で回す。

---

## 3. 設計

### 3.1 ディレクトリ構成

```
apps/web/
├── e2e/
│   ├── playwright.config.ts      # baseURL, storageState, retries, reporter
│   ├── .env.e2e.example          # テスト用認証情報サンプル
│   ├── auth/
│   │   └── auth.setup.ts         # 毎回 UI ログイン → storageState 保存
│   ├── fixtures/
│   │   ├── api.ts                # authenticated request ラッパ (CSRF 付き)
│   │   └── test-fixtures.ts      # test.extend() で api + timelinePage を注入
│   ├── pages/
│   │   └── timeline.page.ts      # POM: goto / waitForBlock / dragRightTo / dragLeftTo / shiftDrag
│   └── specs/
│       └── timeline-dependency-drag.spec.ts
├── playwright/.auth/              # gitignore 対象, Cookie JSON が入る
└── package.json                   # test:e2e / test:e2e:ui / test:e2e:debug 追加
```

### 3.2 Playwright projects 構成

```ts
// playwright.config.ts(骨子)
export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: false, // 初期は逐次。共有テストプロジェクトなので並列はデータ競合リスク
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    // firefox/webkit は最小スコープでは外す
  ],
});
```

### 3.3 前提条件

- 別ターミナルで以下が起動していること:
  - `docker compose -f docker-compose-local.yml up`
  - `pnpm dev`(web:3000)
- テスト内では web server を起動しない(Turbo の `pnpm dev` と競合するため)
- `apps/web/e2e/.env.e2e` にテスト用認証情報とワークスペース情報が入っていること
- **テスト対象は Issue Gantt レイアウトのみ**(Module/Cycle Gantt は `isDependencyEnabled=false` のため依存 UI 自体が non-render)
- 機能フラグ `ENABLE_ISSUE_DEPENDENCIES` は `packages/constants/src/issue/filter.ts:361` で **build-time 定数 `true`**(OSS デフォルト有効)→ 追加の環境変数設定は不要

### 3.4 必要な環境変数

```
E2E_BASE_URL=http://localhost:3000
E2E_API_BASE_URL=http://localhost:8000     # Django API(もしくは同じ :3000 経由の rewrite)
E2E_USER_EMAIL=e2e-user@example.com
E2E_USER_PASSWORD=e2e-password
E2E_WORKSPACE_SLUG=e2e-workspace
E2E_PROJECT_ID=<uuid>
```

---

## 4. 詳細設計(確定)

### 4.1 API helper の CSRF ハンドリング

調査結果に基づく確定仕様:

- **CSRF 取得エンドポイント**: `GET /auth/get-csrf-token/` → JSON 形式 `{ "csrf_token": "..." }`(`apps/api/plane/authentication/views/common.py:28-35`)
- **送信ヘッダ名**: `X-CSRFTOKEN`(既存 `packages/services/src/auth/auth.service.ts:79` と揃える。HTTP ヘッダは大小無視だが統一)
- **httpOnly フラグ**:
  - `CSRF_COOKIE_HTTPONLY = True`(`apps/api/plane/settings/common.py:328`)→ JS から直接読めないため、必ず上記エンドポイント経由で取得
  - `SESSION_COOKIE_HTTPONLY = True` → storageState での保存は可、JS 読み出しは不可
- **Playwright での扱い**:
  - `request.newContext({ storageState: "playwright/.auth/user.json" })` は Cookie を自動送信するため手動 Cookie 設定は不要
  - `POST` 系リクエストでは CSRF ヘッダのみ `extraHTTPHeaders` または都度明示で付与:
    ```ts
    const csrf = await ctx.get("/auth/get-csrf-token/").then((r) => r.json());
    await ctx.post(url, { data: payload, headers: { "X-CSRFTOKEN": csrf.csrf_token } });
    ```

### 4.2 テストフィクスチャの設計

**方針**: fixture は **テスト前後の cleanup 専用**。アサーションは UI + `waitForResponse` で行う(§4.4)。

- `createIssue(payload)` — `start_date` / `target_date` を自動付与、戻り値は issue id。Gantt に表示させるため日付は必須
- `deleteIssue(issueId)` — afterEach で teardown。関係は FK cascade で落ちるので `deleteIssueRelation` は不要
- `getIssue(issueId)` — デバッグ用(失敗時の状態確認)
- `afterEach` teardown は Playwright の auto-fixture 機構を使い、失敗したテストでも確実に走るようにする

**あえて提供しないもの**:

- `createIssueRelation` — 関係の作成はテスト対象そのもの。seed 用途で提供すると UI ドラッグを回避できてしまい、目的が本末転倒になる
- `getIssueRelations` — アサートは UI で行うため不要

### 4.3 ドラッグ機構の詳細

**ハンドル出現手順(必須)**

1. `page.locator('[data-block-id="<src>"]').hover()` で source block の onMouseEnter を発火
   → `store.activeBlockId` が更新され、`Right/LeftDependencyDraggable` の opacity が 1 に(`right-draggable.tsx:63-69`)
2. ハンドルは block 右端の **外側 6〜18px**(`left-full translate-x-1.5 w-3`)に位置
   → `boundingBox()` で block の rect を取り、`x = rect.right + 12, y = rect.top + rect.height/2` を狙う
3. `page.mouse.down()` でドラッグ開始 → document-level リスナーが drag state に遷移(`use-dependency-drag.ts:189-307`)

**中間 move**

- `page.mouse.move(x, y, { steps: 20 })` で 20 回の mousemove を発火
- ターゲット判定は `document.elementFromPoint` 経由なので、中継地点の element がどうであれ最終地点が target block の `data-block-id` 要素の rect 内なら OK

**仮想スクロール制約**

- **source 側 block は viewport 内必須**(`ChartDraggable` → `RightDependencyDraggable` は `RenderIfVisible` の内側 → viewport 外だと handle が mount されない)
- target 側 block は `data-block-id` outer shell が常時 DOM にあり、ドラッグ中は `forceRender={isCurrentDependencyDragging}` で全 block が再描画されるため viewport 外でも target 検出は機能する
- **初期テストは両方 viewport 内に収める**(座標計算を単純化するため)

**Shift 押下(relation-type picker)**

- `page.keyboard.down('Shift')` → `page.mouse.up()` → picker 表示を待機(セレクタは `relation-type-picker.tsx` の実装に合わせて実装時に確定)→ 選択肢をクリック → `page.keyboard.up('Shift')`

**Escape キャンセル**

- mousedown 後の任意タイミングで `page.keyboard.press('Escape')` → `onKeyDown` が `endDependencyDrag` を呼ぶ(`use-dependency-drag.ts:293-297`)

### 4.4 初期テストシナリオ

**初期 PR の対象: #1 + #2 + #3 の 3 ケース**

| #   | テスト名                                                     | POST payload                                                                             | UI アサート                                                                                               |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | `right handle drag to left edge creates blocking relation`   | URL: `/issues/<A>/issue-relation/`, body: `{ relation_type: "blocking", issues: [B] }`   | `[data-dependency-key="${A}-blocking-${B}"]` が可視                                                       |
| 2   | `left handle drag to right edge creates blocked_by relation` | URL: `/issues/<A>/issue-relation/`, body: `{ relation_type: "blocked_by", issues: [B] }` | `[data-dependency-key="${B}-blocking-${A}"]` が可視(描画は mirror 方向)                                   |
| 3   | `shift drop opens relation picker and commits relates_to`    | URL: `/issues/<A>/issue-relation/`, body: `{ relation_type: "relates_to", issues: [B] }` | picker が閉じる。`relates_to` は gantt 上に描画されないため `data-dependency-key` アサートは **行わない** |

**#2 の描画方向の注意点**
`dependency-paths.tsx:103` の描画ループは `relationMap[sourceId]?.blocking` のみを iterate する(`blocked_by` は mirror なので二重描画を避けるためスキップ)。つまり `A blocked_by B` を作成すると:

- Store: `relationMap[A].blocked_by=[B]`, `relationMap[B].blocking=[A]`(mirror)
- 描画: `sourceId=B` の走査で `B → A` の線が 1 本引かれる → `data-dependency-key="${B}-blocking-${A}"`

**#3 の描画について**
`relates_to` および `duplicate` は precedence 関係ではないため `dependency-paths.tsx` の描画対象外。gantt 上に線は表示されないので、UI 側のアサートは「picker が閉じた」ことのみ(`role=dialog` の不在)。関係が実際に作成されたことは API レスポンス + payload で確認する。

**セットアップ共通化**

- beforeEach で 2 issue 並列作成(`Promise.all`)→ Gantt 画面遷移 → 両ブロック描画待機
- afterEach で作成した issue を deleteIssue (cascade で関係も削除)

**アサーション戦略(テンプレート)**

```ts
// #1 / #2 共通パターン
const responsePromise = page.waitForResponse(
  (r) => r.url().includes(`/issues/${sourceId}/issue-relation/`) && r.request().method() === "POST"
);
// drag gesture...
const resp = await responsePromise;
expect(resp.status()).toBe(201);
const postedBody = resp.request().postDataJSON();
expect(postedBody).toMatchObject({ relation_type: "blocking", issues: [targetId] });
// 描画方向に合わせた data-dependency-key:
// #1: `${sourceId}-blocking-${targetId}` / #2: `${targetId}-blocking-${sourceId}` (mirror)
await expect(page.locator(`[data-dependency-key="${renderedSourceId}-blocking-${renderedTargetId}"]`)).toBeVisible();
```

```ts
// #3 パターン(picker 経由、UI 側の SVG 線はない)
const responsePromise = page.waitForResponse(
  (r) => r.url().includes(`/issues/${sourceId}/issue-relation/`) && r.request().method() === "POST"
);
// shift-drag gesture → picker 表示待機 → relates_to をクリック
await page.locator('[role="dialog"][aria-label="Pick dependency type"]').waitFor();
await page.getByRole("button", { name: /relates to/i }).click();
const resp = await responsePromise;
expect(resp.status()).toBe(201);
expect(resp.request().postDataJSON()).toMatchObject({ relation_type: "relates_to", issues: [targetId] });
await expect(page.locator('[role="dialog"][aria-label="Pick dependency type"]')).toBeHidden();
```

**段階的追加の方針**

- #4 (self) / #5 (duplicate) / #6 (cycle) は純粋な JS バリデーションで、本来 unit test 領域 → `use-dependency-drag` / `cycle-check` に対する Vitest 導入を別 PR で行い、そちらでカバー(§4.8)
- #8 (ホバー削除) / #9 (Escape) は E2E 継続対象、本 PR の次回インクリメントで追加

### 4.5 リポジトリ統合

- **`apps/web/package.json` devDependencies**: `@playwright/test` を **web ローカルに直接追加**(catalog は複数 consumer がいる場合の指針。当面 apps/web のみが使うため J2)
- **`apps/web/package.json` scripts**:
  ```json
  {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:install": "playwright install chromium"
  }
  ```
- **`turbo.json`**: `test:e2e` を追加する場合は `cache: false` + 依存サーバが外部前提のため **追加しない方向**(pnpm --filter で直接実行)。将来 CI 統合時に再検討
- **`.gitignore` 追加**:
  - `apps/web/playwright/.auth/`
  - `apps/web/test-results/`
  - `apps/web/playwright-report/`
  - `apps/web/e2e/.env.e2e`
- **`apps/web/e2e/.env.e2e.example`** はコミット
- **OxLint 警告バジェット**: `apps/web/e2e/` は `apps/web` の lint スコープに **含める**(`--max-warnings 11957` 据え置き、新規テストコードは warnings 0 で追加)
- **CI 統合**: 本 PR のスコープ外。ローカル手動実行のみ

### 4.6 テスト用リソースのブートストラップ(手動 / 4.6.a)

最小スコープ原則で **手動作成 + `.env.e2e` に記述**:

1. `docker compose -f docker-compose-local.yml up` 起動後、`http://localhost:3001/god-mode/` で instance admin を登録(初回のみ)
2. `http://localhost:3000` で以下を作成:
   - ユーザー(`e2e-user@example.com`)
   - ワークスペース(`e2e-workspace`)
   - プロジェクト(任意名、UUID をメモ)
3. プロジェクトの Issue layout を **Gantt** に切り替え(user preference として保存される)
4. `apps/web/e2e/.env.e2e` に上記値を記入
5. 手順全体を `apps/web/e2e/README.md` に記載

将来テストが増えて手動ブートストラップがボトルネックになったら、§4.8 の「自動ブートストラップ」へ移行。

### 4.7 実装側の軽微な変更(本 PR に含める)

E2E のアサートを安定させるため、以下の 1 行を prod コードに追加:

- **`apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx:190`**
  - 現状: `<g key={key}>`
  - 変更後: `<g key={key} data-dependency-key={key}>`
  - 目的: `${sourceId}-${relationType}-${targetId}` で永続依存線を狙い撃ちできるようにする
  - 既存の `data-block-id`(commit `3d8e17146d`)と同じ方針。prod 挙動への影響なし、可視性ゼロ

### 4.8 将来の最適化/拡張候補

- **G4 プログラム的ログイン**: `/auth/sign-in/` を form POST で直接叩いて storageState を生成 → UI ログインの ~3-5 秒が削減可能。遅さが実害になった時点で移行
- **#4-#6 の Vitest 化**: `use-dependency-drag` / `cycle-check.ts` に対する unit test を別 PR で導入。self / duplicate / cycle 検証は E2E よりそちらの方が安価
- **#8 (ホバー削除) / #9 (Escape)**: 基盤ができた後、本 spec の continuation PR で追加
- **自動ブートストラップ**: `pnpm --filter=web e2e:bootstrap` で API 経由に workspace/project を冪等生成
- **CI 統合**: GitHub Actions で Postgres/Redis を Service Container として起動し Playwright を回す

---

## 5. 参照先

- 実装本体: `apps/web/ce/components/gantt-chart/dependency/*`
- ドラッグフック: `apps/web/ce/components/gantt-chart/dependency/use-dependency-drag.ts`
- 視覚ロジック: `apps/web/ce/components/gantt-chart/dependency/draggable-dependency-path.tsx` / `dependency-paths.tsx`
- ハンドル: `apps/web/ce/components/gantt-chart/dependency/blockDraggables/{left,right}-draggable.tsx`
- 実装メモ: `docs/timeline-dependency-implementation.md`
- バックエンド relation API: `apps/api/plane/app/views/issue/relation.py`
- URL 定義: `apps/api/plane/app/urls/issue.py:236`
- 認証 URL: `apps/api/plane/authentication/urls.py`
- CSRF エンドポイント: `apps/api/plane/authentication/views/common.py:28-35`
- 既存 CSRF クライアント実装: `packages/services/src/auth/auth.service.ts`
- フラグ: `packages/constants/src/issue/filter.ts:361`(`ENABLE_ISSUE_DEPENDENCIES = true`)
- Issue Timeline store: `apps/web/core/store/timeline/issues-timeline.store.ts`(`isDependencyEnabled = true`)
- E2E 対象 attr: `data-block-id="<issue_id>"`(gantt ブロック outer shell、`apps/web/core/components/gantt-chart/blocks/block.tsx:73`)
- E2E 追加 attr(§4.7): `data-dependency-key="<sourceId>-<relationType>-<targetId>"`(依存線 `<g>`)
