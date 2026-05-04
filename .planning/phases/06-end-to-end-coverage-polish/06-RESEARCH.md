# Phase 6: End-to-End Coverage & Polish - Research

**Researched:** 2026-05-04
**Domain:** Playwright E2E — Timeline Propagation Integration
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01**: New spec file `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` with `test.describe("timeline dependency propagation")` holding TEST-23 and TEST-24.
- **D-01b**: Test naming `"#1 [TEST-23] happy path: drag predecessor moves successor and persists"` / `"#2 [TEST-24] failure path: incomplete-schedule rejects drag and rolls back UI"`.
- **D-02**: TEST-24 uses `INCOMPLETE_SCHEDULE` — triggered by clearing `tgt.target_date` via API before the drag.
- **D-03**: Add `dragBlockBy(issueId, deltaDays)` + `getBlockBox(issueId)` to `apps/web/e2e/pages/timeline.page.ts`. Existing methods stay byte-identical.
- **D-03a**: `dayWidth` derived from DOM (block bounding-box / day count). No import of `chart-coords.ts`.
- **D-03c**: Rightward drag only.
- **D-04**: TEST-23 three-tier assertion: network (200 + body) → DOM (src and tgt shifted) → persistence (`getIssue` match).
- **D-04a**: TEST-24 three-tier assertion: network (422 + `{code, message}`) → toast text → DOM rollback (both blocks within ±2px of pre-drag positions).
- **D-04b**: Locale assumption `en`.
- **D-04c**: ±2px tolerance; moved ≥ `dayWidth - 2px`.
- **D-05**: Add `createIssueRelation`, `clearIssueDate`, `getIssue` to `apps/web/e2e/fixtures/api.ts`.
- **D-06**: New fixtures `propagationPair` + `propagationTimeline` in `test-fixtures.ts`. Day spacing: src start+0/end+3, tgt start+5/end+8, drag +4 days.
- **D-07a**: TEST-24 — `clearIssueDate` called AFTER `propagationTimeline` has rendered tgt; browser local store retains stale populated `target_date`.
- **D-08**: Local-only execution. No CI integration.
- **D-08a**: Locale precondition: workspace must run in `en`.
- **D-09**: No changes to `playwright.config.ts`.
- **D-10**: 0 new OxLint warnings; 0 new external dependencies; 0 `turbo.json` or `.gitignore` edits.
- **D-11**: Test names carry `[TEST-23]` / `[TEST-24]` tags for traceability.
- **D-12**: Native `page.mouse.down/move/up` first; fall back to `dispatchEvent("mousedown", ...)` if smoke testing reveals missed event.
- **D-12a**: `enableBlockMove && isBlockComplete` guard holds for both TEST-23 and TEST-24 drags because the browser local store is not updated by `clearIssueDate`.
- **D-12b**: Use `expect.poll` for post-drag DOM assertions (allows MobX reactivity to flush).
- **D-13a**: First plan task = placeholder spec + `pnpm --filter=web test:e2e --grep "[TEST-23]"` self-test.

### Claude's Discretion

- Block-mousedown pattern (D-12): start with native `page.mouse.down()`; fall back to `dispatchEvent` if smoke fails.
- Bounding-box tolerance (D-04c): `±2px` default; raise to `±3px` only if observed flake justifies.
- `propagationPair` fixture vs. inline (D-06): new fixture is the default.
- Locale assumption `en` (D-04b / D-08a): flag if dev workspace runs in `ja`.

### Deferred Ideas (OUT OF SCOPE)

- `SCHEDULE_CHANGED` E2E variant
- `PROPAGATION_LIMIT_EXCEEDED` / `DEPENDENCY_CYCLE` / `PROJECT_BOUNDARY_EXCEEDED` E2E variants
- Hidden-update notification E2E coverage
- Drag chain/branch/merge propagation E2E
- Mid-drag visual preview E2E assertion
- CI integration
- Visual regression / screenshot diff
- `@plane/propel/toast` `data-testid` addition
- `block-mousedown` via `dispatchEvent` (captured as fallback only)
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                    | Research Support                                                                                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-23 | E2E happy path: drag predecessor → dependent work item moves → schedule persists end-to-end                    | Wire contract §1 confirms 200 + `work_items[]`; DOM derivation §3 gives `dayWidth`; persistence read path §6 confirms direct DB read bypasses cache               |
| TEST-24 | E2E failure path: drag triggers known protocol error → UI returns to original schedule + error message visible | Wire contract §1 confirms 422 + `{code, message}` for `INCOMPLETE_SCHEDULE`; toast §4 gives text assertions; failure-path behavior §7 confirms rollback semantics |

</phase_requirements>

---

## Summary

Phase 6 は全 6 フェーズのマイルストーン最終工程であり、生産コードを一切変更せず Playwright スイートに 2 本のスペック（TEST-23 ハッピーパス・TEST-24 失敗パス）を追加する。すべてのプロダクション側配管（バックエンド伝播アルゴリズム・DRF エンドポイント・MobX ストア・ドラッグハンドラ・トーストリゾルバ）はフェーズ 1–5 でシップ済み。

リサーチの主眼は「プランナーが PLAN.md を書くのに必要な具体的事実」—ワイヤーの URL・リクエスト/レスポンス形状・HTTP ステータスコードのマッピング・DOM イベントフロー・バウンディングボックス導出レシピ・トーストの DOM 安定性・API ヘルパーの正確な仕様—を網羅的に確定することにある。

**Primary recommendation:** プランを 2 分割とする。Plan 01 でフィクスチャ・API ヘルパー・POM メソッドを追加してスモークテストで検証し、Plan 02 で TEST-23 → TEST-24 を順に実装する。Plan 01 が GREEN になるまで Plan 02 には着手しない（D-13a の self-test を Plan 01 の第 1 タスクとすることでインフラ腐敗を早期検知する）。

---

## Architectural Responsibility Map

| Capability                                 | Primary Tier                                                 | Secondary Tier                                  | Rationale                                                                  |
| ------------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------- |
| Network interception (`waitForResponse`)   | E2E Test Layer                                               | —                                               | Playwright はブラウザ→API 間の HTTP を傍受する。プロダクション層は変更不要 |
| Block-body drag simulation (`dragBlockBy`) | E2E Test Layer (POM)                                         | Browser (React onMouseDown → useGanttResizable) | POM が native `page.mouse` でイベントを発火し、React ハンドラが受け取る    |
| `previewById` MobX 状態 → DOM 反映         | Frontend (GanttChartBlock observer)                          | E2E Test Layer (expect.poll)                    | MobX `runInAction` バッチ書き込み後の再レンダをポーリングで待つ            |
| Toast 表示                                 | Frontend (@plane/propel/toast via @base-ui-components/react) | E2E Test Layer (getByText)                      | `data-testid` 不在のため i18n テキストを seam として使う                   |
| Persistence assertion                      | API (Django IssueViewSet GET)                                | E2E Test Layer (api.getIssue)                   | `bulk_update` コミット後の DB 直読み                                       |
| IssueRelation seed                         | API (IssueRelationViewSet POST)                              | E2E Test Layer (api.createIssueRelation)        | リレーション作成は UI ドラッグではなく API 直叩きでシード                  |
| `target_date` クリア                       | API (IssueViewSet PATCH)                                     | E2E Test Layer (api.clearIssueDate)             | TEST-24 の `INCOMPLETE_SCHEDULE` を server-side で仕込む                   |

---

## Wire Contract Confirmation

### 1. エンドポイント URL（確定）

`POST /api/workspaces/<slug>/projects/<uuid:project_id>/timeline-propagation/`

- URL 定義: `apps/api/plane/app/urls/issue.py:258` [VERIFIED: file read]
- URL name: `project-timeline-propagation`
- `waitForResponse` フィルタ: `r.url().includes("/timeline-propagation/") && r.request().method() === "POST"` [VERIFIED: file read]
- 注意: `/api/v1/...` ではなく `/api/...`（session-cookie 認証側）

### 2. リクエストボディ（確定）

`TimelinePropagationRequestSerializer` から:

```typescript
// apps/api/plane/app/serializers/timeline_propagation.py:35-48 より確定
{
  work_item_id: string,            // UUID
  original_start_date: string,     // YYYY-MM-DD
  original_target_date: string,    // YYYY-MM-DD
  expected_updated_at: string,     // ISO 8601 with microseconds (Django DateTimeField デフォルト)
  requested_start_date: string,    // YYYY-MM-DD
  requested_target_date: string,   // YYYY-MM-DD
  operation: "move",               // ChoiceField, "resize" は 400 で拒否
  client_preview_count?: number    // optional, min_value=0, allow_null=True
}
```

`commitWithServerResult` が実際に送るフィールド（`apps/web/ce/store/timeline/timeline-propagation.store.ts:249-258`）:

```typescript
const body: TTimelinePropagationRequest = {
  work_item_id: snap.dragged.id,
  original_start_date: snap.dragged.original_start_date,
  original_target_date: snap.dragged.original_target_date,
  expected_updated_at: snap.expected_updated_at,
  requested_start_date: args.requested_start_date,
  requested_target_date: args.requested_target_date,
  operation: "move",
  client_preview_count: this.previewById.size,
};
```

**TEST-23 の wire assertion:**

```typescript
expect(resp.request().postDataJSON()).toMatchObject({
  work_item_id: src.id,
  operation: "move",
});
```

### 3. 成功レスポンス（HTTP 200）

`apps/api/plane/app/views/issue/timeline_propagation.py:355-378` より:

```json
{
  "requested_work_item_id": "<uuid string>",
  "total_updated_count": 2,
  "client_preview_count": null,
  "work_items": [
    {
      "id": "<uuid string>",
      "start_date": "YYYY-MM-DD",
      "target_date": "YYYY-MM-DD",
      "updated_at": "<ISO 8601 datetime>"
    }
  ]
}
```

- `total_updated_count` は src + tgt が共に更新される場合 ≥ 2
- `work_items` は更新された全 Issue を含む（src と伝播対象の tgt）
- **TEST-23 の network assertion:** `resp.status() === 200` かつ `body.requested_work_item_id === src.id` かつ `body.total_updated_count >= 2`

### 4. 失敗エンベロープ（HTTP 422）

`apps/api/plane/app/views/issue/timeline_propagation.py:110-119` より:

```json
{
  "code": "INCOMPLETE_SCHEDULE",
  "message": "<server-side diagnostic English string>"
}
```

**STATUS_BY_CODE マッピング（確定）:**

| PropagationErrorCode         | HTTP Status |
| ---------------------------- | ----------- |
| `PERMISSION_DENIED`          | 403         |
| `SCHEDULE_CHANGED`           | 409         |
| `DEPENDENCY_CYCLE`           | 422         |
| `PROJECT_BOUNDARY_EXCEEDED`  | 422         |
| `INCOMPLETE_SCHEDULE`        | **422**     |
| `PROPAGATION_LIMIT_EXCEEDED` | 422         |
| `INVALID_DATE_RANGE`         | 422         |

[VERIFIED: `apps/api/plane/app/views/issue/timeline_propagation.py:99-107`]

**TEST-24 の network assertion:**

```typescript
expect(resp.status()).toBe(422);
const body = await resp.json();
expect(body).toMatchObject({ code: "INCOMPLETE_SCHEDULE" });
```

### 5. `expected_updated_at` フォーマット

DRF `DateTimeField` のデフォルト出力は ISO 8601 with microseconds: `"2026-05-04T12:34:56.789012Z"`。`bulk_update` で `updated_at` を明示セット（`auto_now` をバイパス）し、成功レスポンスの `work_items[].updated_at` は全アイテムで同一の `now` を共有（Pitfall 1 対応済み）。

---

## Drag Mechanics

### 1. onMouseDown イベントフロー（確定）

```
page.mouse.down() on block body center
  → [data-block-id=X] outer div (pointer-events: auto, unless !isBlockVisibleOnChart)
    → ChartDraggable (draggable.tsx:61):
        onMouseDown={(e) => enableBlockMove && handleBlockDrag(e, "move")}
          → enableBlockMove = isAllowed (prop from BaseGanttRoot)
          → isBlockComplete check は GanttChartBlock で行われ、
             ChartDraggable に渡す前に enableBlockMove && !!isBlockComplete でゲート (block.tsx:146)
    → useGanttResizable.handleBlockDrag(e, "move")
      → if e.button !== 0: return (early exit)
      → propagationCallbacks.beginPreview({...}) が呼ばれる
      → document.addEventListener("mousemove", handleMouseMove)
      → document.addEventListener("mouseup", handleMouseUp)
```

[VERIFIED: `apps/web/core/components/gantt-chart/helpers/draggable.tsx:61`, `blocks/block.tsx:146`, `use-gantt-resizable.ts:70-106`]

### 2. ブロックボディは pointer-events-none ではない

`draggable.tsx:57-62` より:

```tsx
<div
  className={cn("relative z-[6] flex h-8 w-full items-center rounded-sm", {
    "pointer-events-none": isMoving,  // ドラッグ中のみ none
  })}
  onMouseDown={(e) => enableBlockMove && handleBlockDrag(e, "move")}
>
```

**結論:** ブロックボディは `isMoving` が `undefined` の状態（ドラッグ開始前）では `pointer-events: auto`。`page.mouse.down()` で直接イベントを受け取れる。`dispatchEvent` は fallback（D-12 確認）。

### 3. TEST-24 での `isBlockComplete` ガード（D-12a 確認）

`block.tsx:79,146`:

```tsx
const isBlockComplete = block?.start_date && block?.target_date;
// ...
enableBlockMove={enableBlockMove && !!isBlockComplete}
```

`block` は `IssuesTimeLineStore.blocksMap` から取得する。`clearIssueDate` は API 経由でサーバサイドのみ変更し、**ブラウザのローカルストアには通知されない**（D-07b: WebSocket 購読なし）。よって TEST-24 の drag 時点では `block.target_date` はまだ populated → `isBlockComplete === true` → ドラッグが発火する。[VERIFIED: `base-gantt-root.tsx:117-134`で `blocksMap` を使用]

### 4. `dragBlockBy` の実装方針（D-12 方針）

```typescript
async dragBlockBy(issueId: string, deltaDays: number): Promise<void> {
  // 1. ブロックをホバーして interactable にする
  await this.block(issueId).hover();

  // 2. バウンディングボックスを取得
  const box = await this.block(issueId).boundingBox();
  if (!box) throw new Error(`block ${issueId} has no bounding box`);

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // 3. dayWidth を DOM から導出（後述 §DOM Derivation Recipes）
  const dayWidth = await this.getDayWidthFromBlock(issueId);

  // 4. native mouse.down（D-12 第一選択）
  await this.page.mouse.move(centerX, centerY);
  await this.page.mouse.down();

  // 5. steps: 20 で移動（既存 DRAG_STEPS 定数と一致）
  const pixelDelta = deltaDays * dayWidth;
  await this.page.mouse.move(centerX + pixelDelta, centerY, { steps: 20 });

  // 6. 解放
  await this.page.mouse.up();
}
```

**fallback:** もし smoke testing で `page.mouse.down()` が React `onMouseDown` を発火しない場合:

```typescript
// dispatchEvent fallback（handle-drag の既存パターンと対称）
await this.block(issueId).dispatchEvent("mousedown", {
  button: 0,
  buttons: 1,
  clientX: centerX,
  clientY: centerY,
  bubbles: true,
  cancelable: true,
});
await this.page.mouse.move(centerX, centerY); // document mousemove リスナをアンカー
await this.page.mouse.move(centerX + pixelDelta, centerY, { steps: 20 });
await this.page.mouse.up();
```

---

## DOM Derivation Recipes

### 1. `dayWidth` の導出（D-03a 確認）

**公式:** `block.tsx` の `getPositionFromDateOnGantt` + `block.position` は `(daysDiff + 1) * dayWidth` を使う（`block.tsx:101`の `previewMarginRight` 計算および `use-gantt-resizable.ts:148`の `(moveMouseX - offsetX) / dayWidth) * dayWidth` 量子化）。

**テストでの導出レシピ:**

```typescript
async getDayWidthFromBlock(issueId: string, issue: CreatedIssue): Promise<number> {
  const box = await this.block(issueId).boundingBox();
  if (!box) throw new Error(`block ${issueId} has no bounding box`);
  const start = new Date(issue.start_date);
  const end = new Date(issue.target_date);
  const dayCount = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return box.width / dayCount;
}
```

`propagationPair` の `tgt` は start+5 / end+8 → dayCount = 4 → `dayWidth = tgt.box.width / 4`。

**off-by-one 確認:** `(daysDiff + 1) * dayWidth` の式で daysDiff = target - start（calendar days）であり、start_date 当日も含む（+1）。よって 3-day duration（start+5 から start+8 まで）は dayDiff = 3、dayCount = 4。[VERIFIED: `block.tsx:99-106`, `use-gantt-resizable.ts:148`]

### 2. pre/post-drag バウンディングボックスキャプチャ

```typescript
// TEST-23 / TEST-24 共通パターン
const preDragBoxSrc = await timeline.getBlockBox(src.id);
const preDragBoxTgt = await timeline.getBlockBox(tgt.id);

// waitForResponse を先にセット（レース防止）
const responsePromise = page.waitForResponse(
  (r) => r.url().includes("/timeline-propagation/") && r.request().method() === "POST",
  { timeout: 15_000 }
);

await timeline.dragBlockBy(src.id, 4); // +4 days rightward

const resp = await responsePromise;

// MobX reactivity flush を待ってからアサート（D-12b）
await expect
  .poll(
    async () => {
      const box = await timeline.getBlockBox(tgt.id);
      return box?.x;
    },
    { timeout: 5_000 }
  )
  .not.toBeCloseTo(preDragBoxTgt.x, -1); // TEST-23
```

### 3. `getBlockBox` の実装

```typescript
async getBlockBox(issueId: string): Promise<{ x: number; y: number; width: number; height: number }> {
  await this.block(issueId).hover();  // RenderIfVisible が viewport 外でも stable になるよう
  const box = await this.block(issueId).boundingBox();
  if (!box) throw new Error(`block ${issueId} has no bounding box`);
  return box;
}
```

---

## Toast Selector Strategy

### 1. `data-testid` 不在の確認（D-04a）

`packages/propel/src/toast/toast.tsx` 全体を確認:

- `BaseToast.Root` — `data-testid` なし [VERIFIED: file read, line 120-165]
- `BaseToast.Title` — `className="text-h6-medium text-primary"` のみ。`data-testid` なし [VERIFIED: line 180]
- `BaseToast.Description` — `className="text-body-xs-regular text-tertiary"` のみ。`data-testid` なし [VERIFIED: line 184]

**結論:** テキストベースのアサーションが唯一の seam（D-04a 確認）。

### 2. アサーション文字列（確定）

`packages/i18n/src/locales/en/translations.ts:2769,2772` [VERIFIED: file read]:

| i18n key                                         | 英語テキスト                                                |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `timeline.propagation.error.title`               | `"Schedule update failed"`                                  |
| `timeline.propagation.error.incomplete_schedule` | `"A dependent work item is missing start or target dates."` |

**TEST-24 toast assertions:**

```typescript
await expect(page.getByText("Schedule update failed")).toBeVisible({ timeout: 8_000 });
await expect(page.getByText("A dependent work item is missing start or target dates.")).toBeVisible();
```

### 3. Toast の auto-dismiss タイムアウト

`@base-ui-components/react` v1.0.0-beta.3 の `useToastManager.d.ts`:

```typescript
timeout?: number;  // default 5000 (ms)
```

[VERIFIED: node_modules の `.d.ts` を直読み]

**デフォルト 5000ms (5秒)**。`setToast` 呼び出し時に `timeout` を指定していない（`toast-resolver.ts:44-48`）ため、トーストは **5秒間** 表示される。`page.waitForResponse` → `getByText` の間に十分な余裕があり、単一の `expect(...).toBeVisible()` で安定する。ポーリング不要。

### 4. マルチトースト共存

TEST-23 では hidden-update INFO トーストは発火しない: `propagationPair` の日程設計（src+tgt 2 アイテム）では `hiddenUpdateCount === 0` になる（seeded 2 issues は両方 loaded subset 内に収まるため、`diffHiddenUpdate` の戻り値は 0）。`baseGanttRoot.tsx:167-170` の `if (hidden > 0)` ゲートにより INFO トーストは抑制される。[VERIFIED: `base-gantt-root.tsx:167-170`, D-06b]

TEST-24 では ERROR トーストのみが発火。複数トーストが重なるケースは発生しない。

---

## API Helper Recipes

### 1. `createIssueRelation`

**URL:** `POST /api/workspaces/<slug>/projects/<project_id>/issues/<srcIssueId>/issue-relation/`

[VERIFIED: `apps/api/plane/app/urls/issue.py:236-239`]

**Body:**

```json
{
  "relation_type": "blocking",
  "issues": ["<tgtIssueId>"]
}
```

[VERIFIED: `apps/web/e2e/specs/timeline-dependency-drag.spec.ts:16-19` — Phase 1 spec がこの形式で呼んでいる]

**Expected status:** 201 Created

**実装:**

```typescript
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
  expect(resp.status(), `createIssueRelation failed: ${resp.status()}`).toBe(201);
}
```

**カスケード削除の確認:** `IssueRelation` モデル:

```python
# apps/api/plane/db/models/issue.py:288-289
class IssueRelation(ProjectBaseModel):
    issue = models.ForeignKey(Issue, related_name="issue_relation", on_delete=models.CASCADE)
    related_issue = models.ForeignKey(Issue, related_name="issue_related", on_delete=models.CASCADE)
```

[VERIFIED: file read] `on_delete=models.CASCADE` — `deleteIssue(src.id)` で `IssueRelation` 行も自動削除される。追加の teardown ロジック不要（D-05b 確認）。

### 2. `clearIssueDate`

**URL:** `PATCH /api/workspaces/<slug>/projects/<project_id>/issues/<issueId>/`

**Body:**

```json
{ "target_date": null }
```

**Expected status:** 200 OK（Plane の `IssueViewSet.partial_update` は 200 を返す — `createIssue` が POST で 201 を返すのと対称的に、PATCH は 200）

**検証が必要な点:** Plane の `IssueSerializer` が `target_date: null` を受け付けるかどうか。`start_date` / `target_date` フィールドは Django の `DateField(null=True, blank=True)` として定義されているため、`null` 値を PATCH ボディに含めて送ることができる。[ASSUMED — Plane の Issue 更新 API が null 日付を受け入れることは一般的なパターンだが、IssueSerializer のバリデーション詳細は実行確認が必要]

**実装:**

```typescript
async clearIssueDate(
  issueId: string,
  field: "start_date" | "target_date"
): Promise<void> {
  const resp = await this.ctx.patch(
    `/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/${issueId}/`,
    {
      data: { [field]: null },
      headers: { "X-CSRFTOKEN": this.csrf },
    }
  );
  // Plane IssueViewSet.partial_update は 200 を返す（204 ではない）
  expect([200, 204], `clearIssueDate unexpected status: ${resp.status()}`).toContain(resp.status());
}
```

**プランへの指示:** 実際のステータスコードは smoke testing で確定する。`expect([200, 204])` で許容範囲を持たせる。

### 3. `getIssue`

**URL:** `GET /api/workspaces/<slug>/projects/<project_id>/issues/<issueId>/`

**Expected status:** 200 OK

**返却シェイプ:** `createIssue` が POST で返す `CreatedIssue` と同一のフィールドセット（`id`, `start_date`, `target_date`）を含む。GET のレスポンスは POST より多くのフィールドを含むが、`CreatedIssue` 型は必要なフィールドの部分集合なので型安全。[ASSUMED — GET レスポンスの全フィールドセットは未検証だが、POST が返すフィールドを GET も返すことは Plane の REST 慣例に一致]

**実装:**

```typescript
async getIssue(issueId: string): Promise<CreatedIssue> {
  const resp = await this.ctx.get(
    `/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/${issueId}/`,
    { headers: { "X-CSRFTOKEN": this.csrf } }
  );
  expect(resp.status(), `getIssue failed: ${resp.status()}`).toBe(200);
  return (await resp.json()) as CreatedIssue;
}
```

**TEST-23 persistence assertion のパターン:**

```typescript
// レスポンスボディから期待値を取得
const body = (await resp.json()) as { work_items: Array<{ id: string; start_date: string; target_date: string }> };
const serverTgt = body.work_items.find((wi) => wi.id === tgt.id);
expect(serverTgt).toBeDefined();

// API 経由で DB を直接読む（caching なし）
const persisted = await api.getIssue(tgt.id);
expect(persisted.start_date).toBe(serverTgt!.start_date);
expect(persisted.target_date).toBe(serverTgt!.target_date);
```

---

## Persistence Read Path

### キャッシュ層の分析

`bulk_update` → DB コミット → `api.getIssue` (Playwright `APIRequestContext`) の読み取りパス:

1. `Issue.objects.bulk_update(instances, ["start_date", "target_date", "updated_at"])` は `transaction.atomic()` ブロック内で実行（`timeline_propagation.py:253-255`）。
2. Django の `transaction.on_commit` で登録された Celery タスクはコミット後に発火するが、`bulk_update` 自体はコミット時点で完了している。
3. Playwright の `APIRequestContext` は `storageState`（Cookie）を共有するが、**Redis キャッシュは Django View ごとに手動で制御される**。`IssueViewSet.retrieve` は Plane の典型的なキャッシュ戦略を持たない（SWR はフロントエンド側のキャッシュであり Node.js API helper とは無関係）。
4. `Issue.issue_objects.get(id=...)` は直接 DB クエリ。

**結論:** `getIssue` は DB を直読みするため、`bulk_update` コミット後に即座に新しい値が返される。Redis キャッシュによる stale read のリスクなし。[ASSUMED — Plane の `IssueViewSet.retrieve` が Redis キャッシュを使用していないことは heuristic に基づく; 実行確認で検証可]

---

## Failure-Path Behavior

### TEST-24 のフロー詳細（D-07a / D-12a 分析）

**Phase 1: セットアップ完了後**

- ブラウザ: `IssuesTimeLineStore.blocksMap[tgt.id]` に `target_date` が populated で存在
- サーバ: `tgt.target_date = null` (`clearIssueDate` 呼び出し後)

**Phase 2: `propagationTimeline.gotoIssueGantt()` + `waitForBlock(tgt.id)` 完了後**

- ブラウザのローカルストアはページロード時の `fetchIssues` で hydrate された状態。`clearIssueDate` の後にリフェッチは行われない（WebSocket 通知なし = D-07b）
- `block.tsx:79`: `isBlockComplete = block?.start_date && block?.target_date` → **true**（ローカルストアのデータを使用）

**Phase 3: `clearIssueDate(tgt.id, "target_date")` 呼び出し**

- サーバサイドのみ変更。ブラウザには通知されない。
- `isBlockComplete` は **依然として true**

**Phase 4: `dragBlockBy(src.id, 4)` 実行**

- `handleBlockDrag(e, "move")` が発火 → `propagationCallbacks.beginPreview({...})`
- `getEdgesAndItems()` がローカルストアの snapshot を取得: `tgt` の `target_date` はまだ populated（ローカルは stale）
- `computeLoadedPreview` がプレビューを計算 → `previewById` に `src` と `tgt` の移動後座標をセット
- `page.mouse.move` で `updatePreview` が呼ばれ続ける

**Phase 5: `handleMouseUp` → `updateBlockDates` → `commitWithServerResult`**

- `propagationStore.commitWithServerResult` が実行
- `service.propagateMove(...)` → API POST
- サーバ: `tgt.target_date IS NULL` を検知 → `INCOMPLETE_SCHEDULE` エラー → HTTP 422

**Phase 6: 失敗レスポンス受信（store の failure path）**
`timeline-propagation.store.ts:288-307`:

```typescript
// _doCommit catch ブロック
runInAction(() => {
  this.previewById.clear(); // ← previewById クリア → DOM rollback
  this.isPreviewActive = false;
  this.snapshot = null;
  this.lastError = thrown; // { code: "INCOMPLETE_SCHEDULE", message: "..." }
  this.unexpectedError = null;
});
```

**Phase 7: `base-gantt-root.tsx` failure branch**
`timeline_propagation.py` commit → `_doCommit` が error return → `BaseGanttRoot.updateBlockDates`:

```typescript
if (propagationStore.unexpectedError) {
  showPropagationErrorToast("UNEXPECTED", t);
} else {
  showPropagationErrorToast(result.code, t); // "INCOMPLETE_SCHEDULE"
}
```

→ `setToast({ type: TOAST_TYPE.ERROR, title: "Schedule update failed", message: "A dependent work item..." })`

### ドラッグされたブロック (`src`) の DOM rollback

`block.tsx` の render path:

- `previewById.clear()` により `previewById.get(src.id) === undefined`
- `previewMarginLeft = undefined`、`previewWidth = undefined`
- `renderedMarginLeft = block.position?.marginLeft`（issue map からの canonical position）
- `renderedWidth = block.position?.width`（同上）

**結論:** `previewById.clear()` で `src` ブロックの DOM 位置も元に戻る。direct DOM writes (`resizableRef.current.style`) は `mouseup` 後の React re-render で上書きされる（`isMoving` が `undefined` に戻り `resizableRef.current.style` への書き込みが止まる）。[VERIFIED: `use-gantt-resizable.ts:187-210`, `block.tsx:107-108`]

### 後継 (`tgt`) ブロックの DOM rollback

同様に `previewById.get(tgt.id) === undefined` → `block.position` fallback → 元の位置に戻る。

---

## Manual Smoke ↔ Automated Mapping

Phase 5 D-11a の 14 手動シナリオと Phase 6 の自動化対応:

| #   | シナリオ                                                           | Phase 6 自動化                                        |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| 1   | 依存関係のない単独 Issue のドラッグ（前進）                        | ❌ 手動のまま                                         |
| 2   | 依存関係のない単独 Issue のドラッグ（後退）                        | ❌ 手動のまま                                         |
| 3   | **blocking 関係がある状態でのドラッグ（boundary violation なし）** | ✅ TEST-23 (部分的 — violation あるシナリオ)          |
| 4   | **blocking 関係でのドラッグ（successor を 1 つ前進させる）**       | ✅ **TEST-23** (D-06b の day spacing で発生)          |
| 5   | blocking 関係でのドラッグ（predecessor を後退させる）              | ❌ 手動のまま（leftward 方向は D-03c でスコープ外）   |
| 6   | chain propagation（2 跳以上）                                      | ❌ 手動のまま（seeding scale が小さいため発生しない） |
| 7   | branch propagation                                                 | ❌ 手動のまま                                         |
| 8   | merge propagation                                                  | ❌ 手動のまま                                         |
| 9   | `INCOMPLETE_SCHEDULE` 失敗 + rollback                              | ✅ **TEST-24**                                        |
| 10  | `DEPENDENCY_CYCLE` 失敗 + rollback                                 | ❌ 手動のまま                                         |
| 11  | `SCHEDULE_CHANGED` 失敗 + rollback                                 | ❌ 手動のまま（deferred）                             |
| 12  | `PROPAGATION_LIMIT_EXCEEDED` 失敗 + rollback                       | ❌ 手動のまま                                         |
| 13  | 成功後の hidden-update INFO toast                                  | ❌ 手動のまま（2-issue seeding では未発生）           |
| 14  | mid-drag preview visual（sibling が動くこと）                      | ❌ 手動のまま（タイミング非決定的）                   |

**自動化カバレッジ:** 14 シナリオ中 2 件自動化（TEST-23 = #4、TEST-24 = #9）。残り 12 件は手動スモーク。

---

## Validation Architecture (Nyquist)

### Test Framework

| Property           | Value                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| Framework          | Playwright (`@playwright/test` at `apps/web`)                         |
| Config file        | `apps/web/e2e/playwright.config.ts` (READ-ONLY — no changes)          |
| Quick run command  | `pnpm --filter=web test:e2e --grep "timeline dependency propagation"` |
| Full suite command | `pnpm --filter=web test:e2e`                                          |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                | Test Type      | Automated Command                                 | File Exists? |
| ------- | ------------------------------------------------------- | -------------- | ------------------------------------------------- | ------------ |
| TEST-23 | drag predecessor → dependent work item moves → persists | E2E Playwright | `pnpm --filter=web test:e2e --grep "\[TEST-23\]"` | ❌ Wave 1    |
| TEST-24 | drag → `INCOMPLETE_SCHEDULE` → UI rolls back + toast    | E2E Playwright | `pnpm --filter=web test:e2e --grep "\[TEST-24\]"` | ❌ Wave 1    |

### Sampling Rate

- **Per task commit:** `pnpm --filter=web test:e2e --grep "placeholder"` (D-13a self-test, Plan 01 Task 1)
- **Per wave merge:** `pnpm --filter=web test:e2e` (全 5 テスト: 既存 3 + 新規 2)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps (Plan 01 で対応)

- [ ] `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` — TEST-23 + TEST-24 を含む新規ファイル
- [ ] `apps/web/e2e/fixtures/api.ts` の `createIssueRelation` / `clearIssueDate` / `getIssue` メソッド追加
- [ ] `apps/web/e2e/fixtures/test-fixtures.ts` の `propagationPair` + `propagationTimeline` fixture 追加
- [ ] `apps/web/e2e/pages/timeline.page.ts` の `dragBlockBy` + `getBlockBox` + `getDayWidthFromBlock` メソッド追加

---

## Risks & Pitfalls

### Pitfall 1: `page.mouse.down()` が React onMouseDown を miss する

**何が起きるか:** Playwright の native `page.mouse.down()` は `MouseEvent` を合成するが、React の synthetic event バブリングと噛み合わない環境では `onMouseDown` が呼ばれないことがある。
**なぜ起きるか:** Playwright と React の event delegation の微妙な差異。既存の `startDragFromEdge` がハンドル要素に `dispatchEvent` を使うのはこれを回避するため（ハンドルは `pointer-events:none` という追加理由もある）。
**防ぎ方:** Plan 01 Task 3 の smoke test (`dragBlockBy` 単独テスト) でブロックが実際に移動するか確認。失敗したら `dispatchEvent` fallback に切り替える（D-12）。
**警告サイン:** `dragBlockBy` 後も `src` ブロックの bounding box が変わらない。

### Pitfall 2: MobX reactivity flush のレース

**何が起きるか:** `page.mouse.up()` の直後に `getBlockBox` を呼ぶと MobX の `runInAction` がまだ完了していないため、古い bounding box を取得する。
**なぜ起きるか:** `commitWithServerResult` は async で、レスポンス受信→`runInAction`→React re-render までに時間がかかる。
**防ぎ方:** `page.waitForResponse` を先に `await` してからアサート。DOM アサートは `expect.poll` + 5秒 timeout を使う（D-12b）。`waitForResponse` は `dragBlockBy` の前に `page.waitForResponse(...)` Promise を作成し、drag 後に `await responsePromise` する（既存パターン踏襲）。

### Pitfall 3: `dayWidth` 計算の off-by-one

**何が起きるか:** `dayCount` を `target - start` (exclusive) で計算すると 1 日ずれ、`dayWidth` が過大になる。
**なぜ起きるか:** ガントの `(daysDiff + 1) * dayWidth` 式は start_date 当日を含む inclusive count。
**防ぎ方:** `dayCount = Math.round((end - start) / msPerDay) + 1` を使う（§DOM Derivation Recipes §1 の公式）。`propagationPair` の `tgt`（start+5 / end+8 = 4 days）で `dayCount = 4` になることをスモーク確認。

### Pitfall 4: ロケール前提の崩壊

**何が起きるか:** 開発者のワークスペースが `ja` で動いている場合、`page.getByText("Schedule update failed")` が一致しない。
**なぜ起きるか:** Phase 5 のトーストは `t(TITLE_KEY)` で翻訳されるため、UI ロケールに依存する。
**防ぎ方:** README.md の「前提」節に「テスト用ワークスペースの UI 言語を `en` に設定してください」を追記（D-08a）。スモーク失敗時のデバッグに README を参照させる。

### Pitfall 5: `isBlockComplete` ガードが TEST-24 でブロックをドラッグ不能にする

**何が起きるか:** `clearIssueDate` の後にブラウザ側でリフェッチが走ると `block.target_date = null` になり `isBlockComplete = false` → `enableBlockMove = false` → ドラッグ発火せず。
**なぜ起きるか:** なんらかの WebSocket / SWR リフェッチが `clearIssueDate` 呼び出し後に `tgt` を更新する可能性。
**防ぎ方:** D-07b が WebSocket購読なしを保証しているが、`propagationTimeline` fixture が `gotoIssueGantt` + `waitForBlock` を完了した直後に `clearIssueDate` を呼ぶ（re-fetch を挟まない）設計にする。テスト内で `clearIssueDate` を `dragBlockBy` の直前に配置する（間に `waitForSelector` 等を入れない）。

### Pitfall 6: `propagationPair` の teardown で `IssueRelation` を別途削除しようとする

**何が起きるか:** `deleteIssue(src.id)` のみで `IssueRelation` 行が残る、と誤解してリレーション削除ヘルパーを追加しようとする。
**なぜ起きるか:** 勘違い。
**防ぎ方:** `IssueRelation.issue` FK が `on_delete=models.CASCADE` のため `deleteIssue(src.id)` で自動的にリレーション行が削除される（§API Helper Recipes §1 確認）。D-05b 通り、追加teardown 不要。

### Pitfall 7: `waitForResponse` を drag の後にセットする

**何が起きるか:** `dragBlockBy` の後に `page.waitForResponse(...)` をセットすると、レスポンスがすでに受信済みのため永遠に待機する（または別のレスポンスを拾う）。
**なぜ起きるか:** Playwright の `waitForResponse` はレスポンスの「到着」を監視する。drag が先に終わってレスポンスが来た後に `waitForResponse` を呼んでも機能しない。
**防ぎ方:** 既存の `timeline-dependency-drag.spec.ts` パターン通り、**drag 前** に `const responsePromise = page.waitForResponse(...)` を作成し、drag 後に `await responsePromise` する。

### Pitfall 8: 既存 3 スペックの regression

**何が起きるか:** `timeline.page.ts` や `test-fixtures.ts` の変更が既存の `#1`, `#2`, `#3` spec を壊す。
**なぜ起きるか:** POM / fixture への追加が既存メソッドのシグネチャや副作用に干渉する。
**防ぎ方:** 変更は **additive のみ**（既存メソッドは byte-identical）。新規フィクスチャ `propagationPair` / `propagationTimeline` は独立した Fixture キーとして追加し、既存の `issuePair` / `timeline` には手を加えない（D-06a）。Plan 01 の各タスク後に `pnpm --filter=web test:e2e --grep "timeline dependency drag"` で既存 3 テストが GREEN であることを確認。

### Pitfall 9: `clearIssueDate` の HTTP status が期待と異なる

**何が起きるか:** `expect(resp.status()).toBe(200)` が 204 で失敗する（またはその逆）。
**なぜ起きるか:** Plane の `IssueViewSet.partial_update` が返す status は実行確認が必要（[ASSUMED]タグ付き）。
**防ぎ方:** `expect([200, 204], ...).toContain(resp.status())` で許容範囲を持たせる（§API Helper Recipes §2 の実装参照）。smoke test で実際の status を記録しておく。

### Pitfall 10: OxLint 警告バジェット超過

**何が起きるか:** `pnpm --filter=web check:lint` が `--max-warnings 11957` 超過で失敗する。
**なぜ起きるか:** 新規テストファイルに `no-shadow`, `no-unused-expressions`, `prefer-const` 等の違反があると既存バジェットを圧迫する。
**防ぎ方:** `apps/web/e2e/` の既存ファイル（`timeline-dependency-drag.spec.ts`, `api.ts` 等）は **0 warnings** で通過している（D-10 確認）。新規コードも同じ規律を維持。`pnpm --filter=web check:lint` を各タスク後に実行して 0 warnings を確認。

---

## First Minimum Task

D-13a の self-test:

1. `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` を作成し、単一の `test.skip("placeholder [TEST-23]", ...)` を含む最小スペックとして配置。
2. `pnpm --filter=web test:e2e --grep "\[TEST-23\]"` を実行 → **0 failures, 1 skipped** であることを確認。
3. これにより: Chromium バイナリの存在、`.env.e2e` の読み込み、`storageState` の有効性、`playwright.config.ts` の設定が全て検証される。

```typescript
// apps/web/e2e/specs/timeline-dependency-propagation.spec.ts の最小形
import { test } from "../fixtures/test-fixtures";

test.describe("timeline dependency propagation", () => {
  test.skip("#1 [TEST-23] happy path: drag predecessor moves successor and persists", () => {});
  test.skip("#2 [TEST-24] failure path: incomplete-schedule rejects drag and rolls back UI", () => {});
});
```

---

## Plan Decomposition Recommendation

**推奨: 2 プラン分割**

作業量は小さいが、インフラ検証と spec 実装を分離することで、インフラ問題が spec 実装に紛れ込まないようにする。

### Plan 01: フィクスチャ・POM・API ヘルパー + self-test

| Task | 作業                                                                                                                                                         | 検証                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| 01   | placeholder spec 作成 + `pnpm --filter=web test:e2e --grep "[TEST-23]"` self-test (D-13a)                                                                    | 0 failures, 1 skipped                   |
| 02   | `api.ts` に `createIssueRelation` 追加 + smoke: relation seed + cascade 確認                                                                                 | `expect(resp.status()).toBe(201)`       |
| 03   | `api.ts` に `clearIssueDate` 追加 + smoke: status code 確認                                                                                                  | `expect([200, 204]).toContain(status)`  |
| 04   | `api.ts` に `getIssue` 追加 + smoke: `tgt` の dates が取得できること                                                                                         | `expect(issue.start_date).toBeTruthy()` |
| 05   | `test-fixtures.ts` に `propagationPair` + `propagationTimeline` 追加 + smoke: fixture teardown 後に issues が消えること                                      | cascade 確認                            |
| 06   | `timeline.page.ts` に `getBlockBox` + `getDayWidthFromBlock` + `dragBlockBy` 追加 + smoke: drag で src ブロックが移動すること（relation なしで単純ドラッグ） | bounding box シフト確認                 |
| 07   | 既存 3 spec の regression guard: `pnpm --filter=web test:e2e --grep "timeline dependency drag"`                                                              | 3 GREEN                                 |
| 08   | OxLint check: `pnpm --filter=web check:lint`                                                                                                                 | 0 new warnings                          |

### Plan 02: TEST-23 + TEST-24 実装

| Task | 作業                                                                                             | 検証                                                  |
| ---- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| 01   | placeholder を削除し、TEST-23 を実装（network → DOM → persistence 3-tier assertions）            | `pnpm --filter=web test:e2e --grep "[TEST-23]"` GREEN |
| 02   | TEST-24 を実装（`clearIssueDate` → drag → network 422 → toast → DOM rollback 3-tier assertions） | `pnpm --filter=web test:e2e --grep "[TEST-24]"` GREEN |
| 03   | full suite run 2 回（冪等性確認）                                                                | 5 tests × 2 = 10 PASSED                               |
| 04   | README.md に locale 前提条件を 1 行追加（D-08a）                                                 | —                                                     |

**単一プランが適切なケース:** 開発者が Plan 01 の全タスクを単一セッションで完了し、インフラ問題が全くなかった場合、両プランを統合しても良い。ただしインフラ rot（Chromium バイナリ未インストール等）のリスクを考慮すると 2 分割が安全。

---

## Common Pitfalls

### Pitfall A: Toast の `data-testid` を追加しようとする

Phase 6 スコープ外。`getByText` による text-based assertion で代替可能（D-04a、§Toast Selector Strategy 確認）。

### Pitfall B: `chart-coords.ts` を import して `dayWidth` を定数として使う

D-03b で明示的に禁止。DOM 導出レシピ（§DOM Derivation Recipes §1）を使う。

### Pitfall C: `propagationPair` の day spacing を変更する

D-06b でロック済み。src start+0/end+3、tgt start+5/end+8、drag +4 days。これにより `tgt.start = +5` が `src.target = +3 + 4 = +7` を下回るため boundary violation が発生し伝播が起動する（`tgt.start = +5 < src_new_target = +7 + 1 = +8`、よって tgt が right-shift される）。

---

## Assumptions Log

| #   | Claim                                                                                             | Section               | Risk if Wrong                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| A1  | `clearIssueDate` (PATCH `/issues/<id>/`) が `target_date: null` を受け付け、200 または 204 を返す | API Helper Recipes §2 | status code assertion が失敗。Plane の Issue serializer が null を拒否する場合は別の INCOMPLETE_SCHEDULE トリガー方法が必要 |
| A2  | `getIssue` (GET `/issues/<id>/`) が `CreatedIssue` 型の全フィールドを含むレスポンスを返す         | API Helper Recipes §3 | `start_date` / `target_date` が GET レスポンスに含まれない場合、型キャストが silent fail になる                             |
| A3  | `IssueViewSet.retrieve` が Redis キャッシュを使用していない（`bulk_update` 直後に最新値を返す）   | Persistence Read Path | stale read による persistence assertion の偽陰性。実行確認で検証可                                                          |

**Assumptions Log が空でない場合:** Plan 01 の smoke test タスク（02–04）で各 `[ASSUMED]` 点を実行確認する。

---

## Environment Availability

Phase 6 は既存ローカルスタックを前提とする。新規ツールは不要。

| Dependency                            | Required By                   | Available                                   | Version | Fallback                             |
| ------------------------------------- | ----------------------------- | ------------------------------------------- | ------- | ------------------------------------ |
| Docker (docker-compose-local.yml)     | Django API + Postgres + Redis | ✓ (assumed per dev env)                     | —       | なし                                 |
| pnpm dev (web:3000)                   | Playwright baseURL            | ✓ (assumed per dev env)                     | —       | なし                                 |
| Chromium binary                       | Playwright test runner        | ✓ 要インストール                            | —       | `pnpm --filter=web test:e2e:install` |
| `apps/web/e2e/.env.e2e`               | env vars                      | ✓ (既存 README §初回セットアップで作成済み) | —       | なし                                 |
| `apps/web/playwright/.auth/user.json` | storageState                  | 毎回 setup project が自動再生成             | —       | 自動                                 |

---

## Security Domain

Phase 6 は E2E テストコードのみ追加する。プロダクションコードへの変更はゼロ。以下の ASVS カテゴリはテストコード自体には適用されない:

- V2 Authentication: `auth.setup.ts` が既存のまま処理
- V5 Input Validation: テストは API helper 経由で送るデータを制御しており、バリデーション回避は目的としない
- V6 Cryptography: 無関係

CSRF token は `createApi()` が既存パターンで自動取得。Phase 6 の新規 API ヘルパーは同じ `this.csrf` / `X-CSRFTOKEN` 規則を踏襲する。

---

## Sources

### Primary (HIGH confidence)

- `apps/api/plane/app/views/issue/timeline_propagation.py` — URL, STATUS_BY_CODE, request/response shape, bulk_update transaction semantics
- `apps/api/plane/app/serializers/timeline_propagation.py` — request field names and types confirmed
- `apps/api/plane/app/urls/issue.py:236-261` — URL path for issue-relation + timeline-propagation
- `apps/api/plane/db/models/issue.py:287-289` — `IssueRelation.on_delete=CASCADE` confirmed
- `apps/web/e2e/specs/timeline-dependency-drag.spec.ts` — existing patterns (waitForResponse before action, data-block-id selectors)
- `apps/web/e2e/pages/timeline.page.ts` — DRAG_STEPS=20, dispatchEvent pattern for handle drag
- `apps/web/e2e/fixtures/api.ts` — Api class CSRF pattern, CreatedIssue type
- `apps/web/e2e/fixtures/test-fixtures.ts` — extend<Fixtures> pattern, Promise.allSettled teardown
- `apps/web/core/components/gantt-chart/blocks/block.tsx` — data-block-id, isBlockComplete guard, previewById DOM path
- `apps/web/core/components/gantt-chart/helpers/draggable.tsx:61` — onMouseDown wire confirmed
- `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` — drag event flow, handleMouseUp unwind
- `apps/web/ce/store/timeline/timeline-propagation.store.ts` — previewById.clear() on failure confirmed
- `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx` — failure branch, toast dispatch
- `packages/propel/src/toast/toast.tsx` — no data-testid confirmed, BaseToast.Title/Description text seam
- `packages/i18n/src/locales/en/translations.ts:2769,2772` — exact English toast strings
- `apps/api/plane/app/services/timeline_propagation/errors.py` — PropagationErrorCode enum
- `packages/services/src/issue/timeline-propagation.service.ts` — URL pattern for waitForResponse filter

### Secondary (MEDIUM confidence)

- `@base-ui-components/react` v1.0.0-beta.3 `useToastManager.d.ts` (from OrbStack docker volume) — default timeout=5000ms confirmed

### Tertiary (LOW / ASSUMED)

- `clearIssueDate` PATCH status code (200 vs 204) — requires smoke test confirmation
- `getIssue` GET response shape matches `CreatedIssue` — requires smoke test confirmation
- `IssueViewSet.retrieve` Redis cache-free — requires execution confirmation

---

## Metadata

**Confidence breakdown:**

- Wire Contract Confirmation: HIGH — serializer/view code directly read
- Drag Mechanics: HIGH — draggable.tsx + use-gantt-resizable.ts + block.tsx code directly read
- DOM Derivation Recipes: HIGH — block.tsx formula directly read; arithmetic verified
- Toast Selector Strategy: HIGH — toast.tsx + translations.ts + base-ui-components d.ts directly read
- API Helper Recipes (createIssueRelation): HIGH — spec + urlconf + model FK directly read
- API Helper Recipes (clearIssueDate): MEDIUM — Plane convention; HTTP status ASSUMED
- API Helper Recipes (getIssue): MEDIUM — REST convention; exact shape ASSUMED
- Persistence Read Path: MEDIUM — bulk_update + transaction code read; Redis state ASSUMED
- Failure-Path Behavior: HIGH — store.\_doCommit, block.tsx previewById path, base-gantt-root failure branch all directly read

**Research date:** 2026-05-04
**Valid until:** 2026-06-04 (Playwright API is stable; Plane codebase changes within the milestone branch only)

---

## RESEARCH COMPLETE

Phase 6 のリサーチが完了した。主な知見:

1. **ワイヤー契約が全確定:** URL (`/timeline-propagation/`)、リクエスト 8 フィールド、成功 200 レスポンス (`requested_work_item_id` / `total_updated_count` / `work_items[]`)、失敗 422 エンベロープ (`{code, message}`) を直接コードから検証した。
2. **ブロックボディは pointer-events-none ではない:** `draggable.tsx:61` の `onMouseDown` は `page.mouse.down()` native で直接発火できる（`dispatchEvent` は fallback）。
3. **TEST-24 の `isBlockComplete` ガードは意図通り機能する:** `clearIssueDate` はサーバサイドのみ変更し WebSocket 通知がないため、ブラウザのローカルストアは stale (populated) のまま — ドラッグが発火し、サーバが 422 を返した後 `previewById.clear()` が両ブロックの DOM を元に戻す。
4. **トーストは 5 秒間表示される:** `@base-ui-components/react` の default timeout=5000ms を d.ts から確認。単一 `getByText` assertion で安定する。
5. **プラン 2 分割を推奨:** Plan 01 でフィクスチャ/POM/ヘルパーを smoke-tested 状態で確立し、Plan 02 で TEST-23 → TEST-24 を実装する。
