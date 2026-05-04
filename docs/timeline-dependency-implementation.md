# Timeline 依存関係ドラッグ機能 実装調査まとめ

作成日: 2026-04-14

## 1. 概要

Plane の Timeline(旧 Gantt)ビューには、2 つの work item 間をマウスでドラッグ接続して依存関係(blocked_by / blocking / relates_to / start_before / finish_before)を作成する UI が存在する。**ただし Plane Cloud / EE ビルドでしか描画されない**。OSS セルフホスト(CE)では当該 UI コンポーネントが空実装(`return <></>`)にされているため、Gantt ビュー上でブロック間にハンドルが出てこず、操作不能になる。

この文書は、OSS 環境でこの機能を自前実装するために必要な情報を集約したもの。

---

## 2. 問題の構造

### 2.1 バックエンドは完全実装済み(何も書く必要なし)

| 項目                   | 実装場所                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ViewSet                | `apps/api/plane/app/views/issue/relation.py:37` (`IssueRelationViewSet`)                                                   |
| 作成エンドポイント     | `POST /api/v1/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/issue-relation/` (`relation.py:209-260`)           |
| 削除エンドポイント     | `POST .../issue-relation/remove/` (`relation.py:262-284`)                                                                  |
| URL ルーティング       | `apps/api/plane/app/urls/issue.py:236-243`                                                                                 |
| サポート relation_type | `blocking` / `blocked_by` / `duplicate` / `relates_to` / `start_before` / `start_after` / `finish_before` / `finish_after` |

リクエスト例:

```bash
POST /api/v1/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/issue-relation/
Content-Type: application/json

{
  "relation_type": "blocked_by",
  "issues": ["<related_issue_uuid>"]
}
```

feature flag / license check は無く、OSS ビルドでもそのまま叩ける。

### 2.2 フロントエンドは CE スタブで意図的に無効化

コア側(`apps/web/core/...`)は `@/plane-web/components/gantt-chart` から依存ドラッグコンポーネントを import する設計。この alias は `tsconfig.json` で OSS ビルド時 `ce/*` に解決される。CE 実装は以下の通り全て空:

| ファイル                                                                            | 行    | 実装                         |
| ----------------------------------------------------------------------------------- | ----- | ---------------------------- |
| `apps/web/ce/components/gantt-chart/dependency/blockDraggables/left-draggable.tsx`  | 15-17 | `return <></>`               |
| `apps/web/ce/components/gantt-chart/dependency/blockDraggables/right-draggable.tsx` | 14-15 | `return <></>`               |
| `apps/web/ce/components/gantt-chart/dependency/draggable-dependency-path.tsx`       | 7-9   | `return <></>`               |
| `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx`                | -     | 確定済み依存線の描画(要確認) |

EE ビルドでは同 alias が `ee/*`(本リポジトリには存在しない private パッケージ)に差し替わり、そこで本物の draggable コンポーネントが描画される。

### 2.3 呼び出し元(ここは変更不要)

コア側には既に呼び出し箇所がある:

- `apps/web/core/components/gantt-chart/helpers/draggable.tsx:15,48-50,72-74`
  `LeftDependencyDraggable` / `RightDependencyDraggable` を block の左右に配置
- `apps/web/core/components/gantt-chart/chart/main-content.tsx:28,223`
  `TimelineDraggablePath`(ドラッグ中の動的パス)と確定パス `DependencyPaths` を描画
- `apps/web/core/components/gantt-chart/chart/root.tsx:39,210` / `root.tsx:33,90`
  `enableDependency: boolean | ((blockId: string) => boolean)` prop のパススルー
- `apps/web/core/components/base-layouts/gantt/layout.tsx:38,135`
  デフォルト `false`
- `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx:150`
  Issue 画面での `enableDependency` 有効化

つまり足場は完成しており、CE コンポーネントの中身を書き替えるだけで動くはず。

---

## 3. 関連 PR / Issue / 外部情報

### 3.1 公式 PR(本家 makeplane/plane)

- [PR #5915](https://github.com/makeplane/plane/pull/5915) "[WEB-2442] feat: Revamp Timeline Layout" (2024-10-28 merged, +2911/-2634)
  Timeline を全面刷新し、`start_before` / `finish_before` relation type の導入、`useGanttResizable` フック導入、`base-timeline.store.ts` 追加などを含む。**この時点で UI の足場は OSS に入ったが、dragger 本体は ee/ に置かれた**。
- [PR #6150](https://github.com/makeplane/plane/pull/6150) "chore: Remove shouldIgnoreDependencies flags while dragging in timeline view" (2024-12-11 merged)
  ドラッグ中の依存無視フラグを削除。`updateBlockPosition` / `getUpdatedPositionAfterDrag` のシグネチャから `ignoreDependencies` が消えた。

### 3.2 Feature Request(未解決)

- [Issue #3051](https://github.com/makeplane/plane/issues/3051) Gantt view で Modules / Cycles / Issues をまとめて表示したい
- [Issue #3050](https://github.com/makeplane/plane/issues/3050) Gantt の時間軸を Months / Quarters に切り替えたい(#5915 で部分対応)

### 3.3 Fork 調査(2026-04-14 時点)

GitHub API (`gh api repos/makeplane/plane/forks?sort=stargazers`) で stargazers 順 20 件確認。**依存ドラッグを実装した fork は一つも無い**。

| Fork                                                    | Stars | 主な変更           |
| ------------------------------------------------------- | ----- | ------------------ |
| [torbenraab/plane](https://github.com/torbenraab/plane) | 81    | OIDC 認証サポート  |
| [shinbatsu/plane](https://github.com/shinbatsu/plane)   | 15    | 説明に独自変更なし |
| [sakimotto/plane](https://github.com/sakimotto/plane)   | 2     | ほぼミラー         |
| 他                                                      | 1-4   | ほぼミラー         |

### 3.4 コミュニティ動向(r/selfhosted)

Reddit の r/selfhosted で 2026-04-03 の "Self-hosted project management tool (free, simple, with Gantt charts)" スレッドでは、Plane.so が 1 票のみ(`jondonessa`)。票が集まったのは Vikunja、Kanboard + DHTMLX Gantt プラグイン、Kaneo。`@culturednii_v2` が X で「Jira から self-hosted Plane に移行する」と発言しているなど認知は広がりつつあるが、依存ドラッグ欠落は community では話題化していない。

---

## 4. 実装プラン(推奨アプローチ)

### 4.1 スコープ

最小実装:

1. Gantt ブロックの左右に掴みハンドル(ドット/矢印)を表示
2. mousedown → mousemove 中、始点ブロック右端(or 左端)からマウス位置までの SVG path(ベジェ曲線)を描画
3. mouseup 時、カーソル下にある別ブロックを判定 → 依存関係 API に POST
4. 成功後、SWR を revalidate してサイドバー `Blocked by` / `Blocking` に反映

発展実装(後続):

5. 確定済み依存線を `dependency-paths.tsx` で描画
6. 循環依存バリデーション(フロント側先行チェック + API 側エラーハンドリング)
7. 依存線のホバー削除 UI
8. ドラッグ中に無効ターゲット(自分自身 / 既存関係 / 循環)を赤でフィードバック

### 4.2 実装順序(ファイル単位)

**Step 1: 座標フック**

`apps/web/ce/components/gantt-chart/dependency/` に新規ユーティリティ追加:

- `use-dependency-drag.ts` — ドラッグ状態(始点 block、始点 edge "left"|"right"、現在のマウス座標)を MobX observable で保持
- `get-block-rect.ts` — `ganttContainerRef` と `block.id` から DOM rect を取得するヘルパー

**Step 2: Draggable ハンドル**

`blockDraggables/right-draggable.tsx` を以下に書き換え(left 側も対称):

```tsx
export function RightDependencyDraggable({ block, ganttContainerRef }: RightDependencyDraggableProps) {
  const store = useDependencyDragStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // block 移動と衝突させない
    store.beginDrag({ sourceBlockId: block.id, sourceEdge: "right" });
  };

  return (
    <div
      className="absolute right-0 h-full w-2 cursor-crosshair opacity-0 hover:opacity-100"
      onMouseDown={handleMouseDown}
    >
      {/* 視覚的な掴みドット */}
      <div className="h-2 w-2 rounded-full bg-custom-primary-100" />
    </div>
  );
}
```

**Step 3: 動的パス描画**

`draggable-dependency-path.tsx` を以下のように実装:

```tsx
export const TimelineDraggablePath = observer(() => {
  const store = useDependencyDragStore();
  if (!store.isDragging) return null;

  const { startX, startY, currentX, currentY } = store.getPathPoints();
  const path = buildBezier(startX, startY, currentX, currentY);

  return (
    <svg className="pointer-events-none absolute inset-0">
      <path d={path} stroke="currentColor" strokeWidth={2} fill="none" strokeDasharray="4" />
    </svg>
  );
});
```

`buildBezier` は `M x1 y1 C cx1 cy1, cx2 cy2, x2 y2` 形式の 3 次ベジェを生成。横方向の `abs((x2 - x1) / 2)` をコントロールポイントのオフセットにすると Jira ライクな挙動になる。

**Step 4: 全体の mousemove / mouseup ハンドラ**

`apps/web/core/components/gantt-chart/chart/main-content.tsx` か新規 `dependency/dependency-drag-layer.tsx` で、container 単位の `onMouseMove` / `onMouseUp` を購読:

- mousemove → store に current 座標を更新
- mouseup → DOM から `data-block-id` を読み、始点と異なれば `IssueRelationService.create()` 呼び出し
- escape キー → ドラッグキャンセル

**Step 5: API 呼び出し**

既存のサービス `packages/services` 配下に `issue-relation.service.ts` があるはず(要確認)。無ければ追加:

```ts
export class IssueRelationService extends APIService {
  async createRelation(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    payload: {
      relation_type: "blocked_by" | "blocking" | "relates_to" | "start_before" | "finish_before";
      issues: string[];
    }
  ) {
    return this.post(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/issue-relation/`,
      payload
    );
  }
}
```

SWR revalidation: 依存作成後 `mutate(`/api/v1/.../issues/${issueId}/`)` で issue 詳細を再取得。

### 4.3 UX の細部(参考 Jira / Linear)

| 挙動                       | 推奨                                                                       |
| -------------------------- | -------------------------------------------------------------------------- |
| ハンドル表示               | ブロックホバー時のみ表示(常時だと煩雑)                                     |
| デフォルト relation_type   | `blocked_by`(右→左ドラッグ時)/ `blocking`(左→右ドラッグ時)                 |
| モディファイア             | Shift + ドラッグで relation_type 選択モーダル                              |
| ドラッグ中の自動スクロール | `@atlaskit/pragmatic-drag-and-drop-auto-scroll` を流用(既に依存済)         |
| 循環検知                   | フロントで `issue.relations` を参照し事前警告 → API 側が最終バリデーション |
| 失敗時の toast             | 既存の `setToast({ type: TOAST_TYPE.ERROR })` パターンに従う               |

### 4.4 注意点

- `enableDependency` prop は `base-layouts/gantt/layout.tsx:38` でデフォルト `false`。実際に Issue Gantt で有効化するのは `base-gantt-root.tsx:150`。**ここで条件を絞っている可能性があり**、自前実装前に何を見て true/false 判定しているか確認必須。
- `apps/web/ce` 配下を書き換えるため、将来 upstream の PR と競合し得る。独自ブランチは `preview` ベースで定期リベース推奨。
- `@/plane-web/components/gantt-chart` の export 一覧が変わると型エラーが出る。`ce/components/gantt-chart/index.ts` の `export * from "./dependency"` を維持すること。
- AGPL-3.0 のため、本改修を **SaaS として外部提供** する場合はソース公開義務が発生する。社内利用なら無問題。

---

## 5. 代替案(実装しない選択)

### 5.1 Issue 詳細モーダルから手動追加

`apps/web/core/components/issues/issue-detail/relation-select/` 配下に既存 UI があり、Gantt ではなく sidebar から `Blocked by` / `Blocking` を追加できる。日常運用はこれで代替可能。

### 5.2 API 直叩きスクリプト

CSV からの一括依存関係インポートなら、上記エンドポイントを叩く Node / Python スクリプトで十分。

### 5.3 他 OSS への移行

| ツール                                                        | 依存ドラッグ   | 備考                                                  |
| ------------------------------------------------------------- | -------------- | ----------------------------------------------------- |
| [OpenProject](https://www.openproject.org/) Community Edition | ○              | Gantt で Jira 同等の接続 UI あり。OSS PM の王道       |
| [Redmine](https://www.redmine.org/)                           | △ (プラグイン) | `redmine_gantt_tasks_dependencies` などプラグイン前提 |
| [Kanboard](https://kanboard.org/) + DHTMLX Gantt プラグイン   | △              | r/selfhosted でモデレーター推薦                       |
| [Vikunja](https://vikunja.io/)                                | -              | Gantt 自体は軽量、依存は関係テーブルで表現可          |
| [Taiga](https://www.taiga.io/)                                | ○              | 依存関係あり、Gantt は別途                            |

Plane の UX を保ったまま依存ドラッグだけ欲しい場合は、本文書の実装が最短。運用全体を入れ替えて良いなら OpenProject が最も機能均衡。

### 5.4 Plane Cloud / EE 契約

正規ルート。本機能のほか、Workflow、SSO 追加機能、Analytics 拡張なども同梱。

---

## 6. 参考リンク

- バックエンド実装: `apps/api/plane/app/views/issue/relation.py:37-284`
- CE スタブ: `apps/web/ce/components/gantt-chart/dependency/`
- 呼び出し側: `apps/web/core/components/gantt-chart/helpers/draggable.tsx`, `chart/main-content.tsx`
- PR: [#5915](https://github.com/makeplane/plane/pull/5915), [#6150](https://github.com/makeplane/plane/pull/6150)
- Feature Request: [#3051](https://github.com/makeplane/plane/issues/3051), [#3050](https://github.com/makeplane/plane/issues/3050)
- Plane 公式 docs(Cloud): https://docs.plane.so/ の Timeline / Dependencies セクション
- TS alias 仕組み: `apps/web/tsconfig.json`(`@/plane-web/*` → `./ce/*`)
- 本リポジトリのコンテキスト: `CLAUDE.md` の CE/core boundary セクション
