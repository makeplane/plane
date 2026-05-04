# Phase 6: End-to-End Coverage & Polish - Pattern Map

**Mapped:** 2026-05-04
**Files analyzed:** 4 new/modified files
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File                                            | Role                | Data Flow                       | Closest Analog                                                            | Match Quality |
| ------------------------------------------------------------ | ------------------- | ------------------------------- | ------------------------------------------------------------------------- | ------------- |
| `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` | test (spec)         | request-response + event-driven | `apps/web/e2e/specs/timeline-dependency-drag.spec.ts`                     | exact         |
| `apps/web/e2e/pages/timeline.page.ts`                        | POM (page object)   | event-driven (mouse)            | same file — existing `startDragFromEdge` / `dropOnEdge` / `block` methods | exact         |
| `apps/web/e2e/fixtures/api.ts`                               | fixture/service     | request-response (HTTP)         | same file — existing `createIssue` / `deleteIssue`                        | exact         |
| `apps/web/e2e/fixtures/test-fixtures.ts`                     | fixture/composition | CRUD + event-driven             | same file — existing `issuePair` / `timeline` fixtures                    | exact         |

---

## Pattern Assignments

### `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` (NEW spec)

**Analog:** `apps/web/e2e/specs/timeline-dependency-drag.spec.ts`

**Imports pattern** (lines 1):

```typescript
import { test, expect } from "../fixtures/test-fixtures";
```

Spec files NEVER import from `@playwright/test` directly — always from the local `test-fixtures` re-export. `expect` comes from the same barrel.

**Describe + numbering pattern** (lines 3-4):

```typescript
test.describe("timeline dependency propagation", () => {
  test("#1 [TEST-23] happy path: drag predecessor moves successor and persists", async ({ page, propagationTimeline, propagationPair, api }) => {
```

- Single `test.describe` per file, label matches feature slug.
- Test names: `#N [TEST-NN] <description>` — resets at `#1` per file (not global sequence).
- Destructure fixtures from the `{ }` parameter; `page` is always available.

**`waitForResponse` before action pattern** (lines 7-10 of analog):

```typescript
const responsePromise = page.waitForResponse(
  (r) => r.url().includes(`/issues/${src.id}/issue-relation/`) && r.request().method() === "POST",
  { timeout: 10_000 }
);

await timeline.dragRightTo(src.id, tgt.id); // action AFTER promise created

const resp = await responsePromise; // await AFTER action
```

CRITICAL: `waitForResponse` promise MUST be created BEFORE the action that triggers the network request. For Phase 6 the URL filter changes to `/timeline-propagation/` and the method stays `"POST"`. Raise timeout to `15_000` for propagation endpoint (server does DB writes).

**Phase 6 specific: TEST-23 network + DOM + persistence assertion sequence:**

```typescript
// 1. Network assertion
const responsePromise = page.waitForResponse(
  (r) => r.url().includes("/timeline-propagation/") && r.request().method() === "POST",
  { timeout: 15_000 }
);

// Pre-drag bounding boxes (captured BEFORE drag)
const preDragBoxSrc = await propagationTimeline.getBlockBox(src.id);
const preDragBoxTgt = await propagationTimeline.getBlockBox(tgt.id);

await propagationTimeline.dragBlockBy(src.id, 4);

const resp = await responsePromise;
expect(resp.status()).toBe(200);
const body = await resp.json();
expect(body).toMatchObject({ requested_work_item_id: src.id });
expect(body.total_updated_count).toBeGreaterThanOrEqual(2);

// 2. DOM assertion — MobX reactivity flush via expect.poll (D-12b)
await expect
  .poll(async () => (await propagationTimeline.getBlockBox(tgt.id)).x, { timeout: 5_000 })
  .toBeGreaterThan(preDragBoxTgt.x + dayWidth - 2);

// 3. Persistence assertion
const serverTgt = (body.work_items as Array<{ id: string; start_date: string; target_date: string }>).find(
  (wi) => wi.id === tgt.id
);
expect(serverTgt).toBeDefined();
const persisted = await api.getIssue(tgt.id);
expect(persisted.start_date).toBe(serverTgt!.start_date);
expect(persisted.target_date).toBe(serverTgt!.target_date);
```

**Phase 6 specific: TEST-24 failure path assertion sequence (D-04a):**

```typescript
// clearIssueDate AFTER propagationTimeline has rendered (D-07a)
await api.clearIssueDate(tgt.id, "target_date");

const preDragBoxSrc = await propagationTimeline.getBlockBox(src.id);
const preDragBoxTgt = await propagationTimeline.getBlockBox(tgt.id);

const responsePromise = page.waitForResponse(
  (r) => r.url().includes("/timeline-propagation/") && r.request().method() === "POST",
  { timeout: 15_000 }
);

await propagationTimeline.dragBlockBy(src.id, 4);

// 1. Network: 422 + code
const resp = await responsePromise;
expect(resp.status()).toBe(422);
const body = await resp.json();
expect(body).toMatchObject({ code: "INCOMPLETE_SCHEDULE" });

// 2. Toast: text-based assertion (no data-testid on @plane/propel/toast)
await expect(page.getByText("Schedule update failed")).toBeVisible({ timeout: 8_000 });
await expect(page.getByText("A dependent work item is missing start or target dates.")).toBeVisible();

// 3. DOM rollback: both blocks within ±2px of pre-drag positions (D-04c)
await expect
  .poll(async () => (await propagationTimeline.getBlockBox(src.id)).x, { timeout: 5_000 })
  .toBeCloseTo(preDragBoxSrc.x, 0); // 0 = within ±0.5 => use custom check if needed
await expect
  .poll(async () => (await propagationTimeline.getBlockBox(tgt.id)).x, { timeout: 5_000 })
  .toBeCloseTo(preDragBoxTgt.x, 0);
```

**Inline comment style** (lines 21-22 of analog):

```typescript
// 描画: src が blocking として iterate され、`${src.id}-blocking-${tgt.id}` の data-key で線が出る
await expect(page.locator(`[data-dependency-key="${src.id}-blocking-${tgt.id}"]`)).toBeVisible();
```

Japanese inline comments are the established voice. Phase 6 continues this for non-obvious assertions.

---

### `apps/web/e2e/pages/timeline.page.ts` (UPDATE — additive)

**Analog:** same file, existing `startDragFromEdge` / `dropOnEdge` / `block` methods

**Existing `block(issueId)` locator pattern** (lines 25-27):

```typescript
block(issueId: string): Locator {
  return this.page.locator(`[data-block-id="${issueId}"]`);
}
```

The `data-block-id` attribute is set at `apps/web/core/components/gantt-chart/blocks/block.tsx:117`:

```tsx
data-block-id={block.id}
```

This is the primary DOM seam for all block-level assertions. Never use `id="gantt-block-${block.id}"` — that is an implementation detail; `data-block-id` is the contract.

**Existing `waitForBlock` pattern** (lines 21-23):

```typescript
async waitForBlock(issueId: string): Promise<void> {
  await this.page.locator(`[data-block-id="${issueId}"]`).waitFor({ state: "visible", timeout: 10_000 });
}
```

**Existing `boundingBox()` usage in `dropOnEdge`** (lines 85-92):

```typescript
const box = await block.boundingBox();
if (!box) {
  throw new Error(`target block ${issueId} has no bounding box (off-screen or zero-sized)`);
}
const x = edge === "left" ? box.x + box.width * 0.25 : box.x + box.width * 0.75;
const y = box.y + box.height / 2;
await this.page.mouse.move(x, y, { steps: DRAG_STEPS });
```

`DRAG_STEPS = 20` is the established constant. `dragBlockBy` uses the same `steps: 20`.

**Existing `dispatchEvent("mousedown", ...)` fallback pattern** (lines 70-81):

```typescript
await handle.dispatchEvent("mousedown", {
  button: 0,
  buttons: 1,
  clientX: handleBox.x,
  clientY: handleBox.y,
  bubbles: true,
  cancelable: true,
});
// dispatchEvent 後にポインタを handle の中央に移動し、
// document の mousemove リスナが dragPoint を更新できるようにする。
await this.page.mouse.move(handleBox.x, handleBox.y);
```

This pattern bypasses `pointer-events:none` on handle elements. The block body div (`draggable.tsx:57-62`) is NOT `pointer-events:none` before drag starts, so `page.mouse.down()` is the first choice for `dragBlockBy`. Use `dispatchEvent` as fallback only if smoke testing reveals missed `onMouseDown`.

**New `getBlockBox` method to add:**

```typescript
async getBlockBox(issueId: string): Promise<{ x: number; y: number; width: number; height: number }> {
  // hover を挟むことで RenderIfVisible が viewport 外でも stable になる
  await this.block(issueId).hover();
  const box = await this.block(issueId).boundingBox();
  if (!box) throw new Error(`block ${issueId} has no bounding box (off-screen or zero-sized)`);
  return box;
}
```

**New `getDayWidthFromBlock` helper to add** (D-03a — DOM derivation, no chart-coords.ts import):

```typescript
async getDayWidthFromBlock(issueId: string, issue: { start_date: string; target_date: string }): Promise<number> {
  const box = await this.block(issueId).boundingBox();
  if (!box) throw new Error(`block ${issueId} has no bounding box`);
  const start = new Date(issue.start_date);
  const end = new Date(issue.target_date);
  // (daysDiff + 1): block.tsx の `(daysDiff + 1) * dayWidth` と一致 — start 当日含む inclusive count
  const dayCount = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return box.width / dayCount;
}
```

**New `dragBlockBy` method to add** (D-03, D-12):

```typescript
async dragBlockBy(issueId: string, deltaDays: number, issue?: { start_date: string; target_date: string }): Promise<void> {
  await this.block(issueId).hover();

  const box = await this.block(issueId).boundingBox();
  if (!box) throw new Error(`block ${issueId} has no bounding box`);

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // dayWidth は呼び出し元が事前に getDayWidthFromBlock で取得して渡すか、
  // issue 引数から直接計算する
  let pixelDelta: number;
  if (issue) {
    const dayWidth = await this.getDayWidthFromBlock(issueId, issue);
    pixelDelta = deltaDays * dayWidth;
  } else {
    throw new Error("dragBlockBy requires `issue` argument to derive dayWidth (D-03a)");
  }

  // D-12: native mouse.down を第一選択(ブロックボディは pointer-events:none ではない)
  await this.page.mouse.move(centerX, centerY);
  await this.page.mouse.down();

  // 既存の DRAG_STEPS 定数と一致
  await this.page.mouse.move(centerX + pixelDelta, centerY, { steps: DRAG_STEPS });

  await this.page.mouse.up();
}
```

**`aria-label` selector pattern for handles** (lines 52-55):

```typescript
const ariaLabel =
  edge === "right"
    ? "Drag to create dependency from this work item"
    : "Drag to create dependency blocking this work item";
const handle = blockEl.locator(`[aria-label="${ariaLabel}"]`);
```

This is the existing handle-drag seam. `dragBlockBy` does NOT use `aria-label` — it targets the block body div directly via `[data-block-id]` center coordinate. The `aria-label` pattern is listed here for completeness as the existing dependency-handle seam.

---

### `apps/web/e2e/fixtures/api.ts` (UPDATE — additive)

**Analog:** same file, existing `createIssue` / `deleteIssue` methods

**CSRF + storageState initialization pattern** (lines 1-34):

```typescript
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type APIRequestContext, expect, request as apiRequest } from "@playwright/test";
import { env } from "./env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_STATE = path.join(__dirname, "..", "..", "playwright", ".auth", "user.json");

export async function createApi(): Promise<Api> {
  const context = await apiRequest.newContext({
    baseURL: env.apiBaseURL,
    storageState: AUTH_STATE,
  });
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
```

All new methods live INSIDE the `Api` class and use `this.ctx.post/patch/get/delete` with `headers: { "X-CSRFTOKEN": this.csrf }`.

**`createIssue` POST pattern** (lines 42-62):

```typescript
async createIssue(name: string, daysFromNow = { start: 0, end: 7 }): Promise<CreatedIssue> {
  // ...date calculation...
  const resp = await this.ctx.post(`/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/`, {
    data: payload,
    headers: { "X-CSRFTOKEN": this.csrf },
  });
  expect(resp.status(), `createIssue failed: ${resp.status()} ${await resp.text()}`).toBe(201);
  const body = (await resp.json()) as CreatedIssue;
  return body;
}
```

Copy this structure for `createIssueRelation` and `getIssue`. Status assertion uses template literal with `resp.text()` for diagnostics.

**`deleteIssue` idempotent cleanup pattern** (lines 64-71):

```typescript
async deleteIssue(issueId: string): Promise<void> {
  const resp = await this.ctx.delete(
    `/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/${issueId}/`,
    { headers: { "X-CSRFTOKEN": this.csrf } }
  );
  // 204 No Content を期待。既に削除済み(404)は許容(冪等な cleanup)
  expect([204, 404], `deleteIssue unexpected status: ${resp.status()}`).toContain(resp.status());
}
```

For `clearIssueDate`: use `expect([200, 204], ...)` pattern (same multi-status tolerance, since PATCH response is [ASSUMED]).

**New `createIssueRelation` to add:**

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
  expect(resp.status(), `createIssueRelation failed: ${resp.status()} ${await resp.text()}`).toBe(201);
}
```

URL verified at `apps/api/plane/app/urls/issue.py:236-239`. Body shape verified against `timeline-dependency-drag.spec.ts:16-19`.

**New `clearIssueDate` to add:**

```typescript
async clearIssueDate(issueId: string, field: "start_date" | "target_date"): Promise<void> {
  const resp = await this.ctx.patch(
    `/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/${issueId}/`,
    {
      data: { [field]: null },
      headers: { "X-CSRFTOKEN": this.csrf },
    }
  );
  // Plane IssueViewSet.partial_update のステータスは smoke で確定する([ASSUMED] — 200 or 204)
  expect([200, 204], `clearIssueDate unexpected status: ${resp.status()}`).toContain(resp.status());
}
```

**New `getIssue` to add:**

```typescript
async getIssue(issueId: string): Promise<CreatedIssue> {
  const resp = await this.ctx.get(
    `/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/${issueId}/`,
    { headers: { "X-CSRFTOKEN": this.csrf } }
  );
  expect(resp.status(), `getIssue failed: ${resp.status()} ${await resp.text()}`).toBe(200);
  return (await resp.json()) as CreatedIssue;
}
```

---

### `apps/web/e2e/fixtures/test-fixtures.ts` (UPDATE — additive)

**Analog:** same file, existing `issuePair` and `timeline` fixtures

**Fixture type declaration pattern** (lines 5-11):

```typescript
type Fixtures = {
  api: Api;
  issuePair: { src: CreatedIssue; tgt: CreatedIssue };
  timeline: TimelinePage;
};
```

Add `propagationPair` and `propagationTimeline` to this type block. Shape of `propagationPair` is identical to `issuePair` (`{ src: CreatedIssue; tgt: CreatedIssue }`) — same type, different seeding contract.

**`base.extend<Fixtures>` and `api` fixture pattern** (lines 13-19):

```typescript
export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  api: async ({}, use) => {
    const api = await createApi();
    await use(api);
    await api.dispose();
  },
```

`api` fixture has no deps (`{}` empty destructure). The `eslint-disable` comment suppresses the `no-empty-pattern` warning — keep it. All other fixtures destructure `{ api }` from their deps.

**`issuePair` fixture pattern — unique naming + Promise.allSettled teardown** (lines 21-33):

```typescript
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
```

`Promise.allSettled` guarantees cleanup runs even when a prior step throws. `propagationPair` follows this identical pattern; it uses **different day offsets** (D-06b: src start+0/end+3, tgt start+5/end+8) and calls `api.createIssueRelation` after both issues are created.

**`timeline` fixture pattern — POM construction + waitForBlock** (lines 35-41):

```typescript
timeline: async ({ page, issuePair }, use) => {
  const tp = new TimelinePage(page);
  await tp.gotoIssueGantt();
  await tp.waitForBlock(issuePair.src.id);
  await tp.waitForBlock(issuePair.tgt.id);
  await use(tp);
},
```

`propagationTimeline` is identical but depends on `propagationPair` instead of `issuePair`. It does NOT call `gotoIssueGantt` again if already on the page — but since each test gets a fresh fixture instance, the full goto is always executed. Copy verbatim, replacing `issuePair` → `propagationPair`.

**New `propagationPair` fixture to add:**

```typescript
propagationPair: async ({ api }, use, testInfo) => {
  // D-06b: src start+0/end+3, tgt start+5/end+8 (2-day gap, 3-day durations)
  // tgt.start (+5) > src.target (+3) so the 4-day drag creates a boundary violation
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
```

**New `propagationTimeline` fixture to add:**

```typescript
propagationTimeline: async ({ page, propagationPair }, use) => {
  const tp = new TimelinePage(page);
  await tp.gotoIssueGantt();
  await tp.waitForBlock(propagationPair.src.id);
  await tp.waitForBlock(propagationPair.tgt.id);
  await use(tp);
},
```

---

## Shared Patterns

### `waitForResponse` before action

**Source:** `apps/web/e2e/specs/timeline-dependency-drag.spec.ts` lines 7-14
**Apply to:** TEST-23 and TEST-24 in the new spec

```typescript
// BEFORE action:
const responsePromise = page.waitForResponse(
  (r) => r.url().includes("/timeline-propagation/") && r.request().method() === "POST",
  { timeout: 15_000 }
);
// action:
await propagationTimeline.dragBlockBy(src.id, 4, src);
// await AFTER:
const resp = await responsePromise;
```

### `data-block-id` selector seam

**Source:** `apps/web/core/components/gantt-chart/blocks/block.tsx:117`
**Apply to:** `getBlockBox`, `waitForBlock`, `block()` locator in `timeline.page.ts`

```tsx
// Production code (READ-ONLY):
data-block-id={block.id}
// Test locator:
this.page.locator(`[data-block-id="${issueId}"]`)
```

This is the ONLY stable DOM seam for block-level assertions. `id="gantt-block-${block.id}"` exists but is an internal convenience, not a test contract.

### CSRF + `X-CSRFTOKEN` header

**Source:** `apps/web/e2e/fixtures/api.ts` lines 29-33, 55-58
**Apply to:** All three new `Api` methods (`createIssueRelation`, `clearIssueDate`, `getIssue`)

```typescript
headers: { "X-CSRFTOKEN": this.csrf }
```

The CSRF token is fetched once in `createApi()` and stored as `this.csrf`. Every mutating request (POST/PATCH/DELETE) must include this header. GET requests also include it for session consistency.

### `expect.poll` for post-async DOM assertions

**Source:** Playwright docs + Phase 6 D-12b (new pattern, no existing analog in `timeline-dependency-drag.spec.ts`)
**Apply to:** All DOM assertions in TEST-23 and TEST-24 that depend on MobX `runInAction` completing

```typescript
// MobX の runInAction バッチ後の React re-render を待つ
await expect
  .poll(async () => (await propagationTimeline.getBlockBox(tgt.id)).x, { timeout: 5_000 })
  .toBeGreaterThan(preDragBoxTgt.x + dayWidth - 2);
```

The existing 3 specs do NOT use `expect.poll` because SVG path rendering is synchronous after the 201 response. Propagation block re-render flows through `commitWithServerResult` → `runInAction` → React re-render, which is async and requires polling.

### Toast text-based assertion

**Source:** Phase 6 D-04a; `packages/propel/src/toast/toast.tsx` (no `data-testid`)
**Apply to:** TEST-24 toast assertions

```typescript
// @plane/propel/toast は data-testid を持たないため i18n 英語テキストが唯一の seam
await expect(page.getByText("Schedule update failed")).toBeVisible({ timeout: 8_000 });
await expect(page.getByText("A dependent work item is missing start or target dates.")).toBeVisible();
```

i18n source: `packages/i18n/src/locales/en/translations.ts:2769,2772`. Toast auto-dismisses after 5000ms (verified from `@base-ui-components/react` d.ts). The `timeout: 8_000` on the first assertion is a safety margin; the second assertion inherits the default.

### `Promise.allSettled` teardown

**Source:** `apps/web/e2e/fixtures/test-fixtures.ts` line 32
**Apply to:** `propagationPair` fixture teardown

```typescript
await Promise.allSettled([api.deleteIssue(src.id), api.deleteIssue(tgt.id)]);
```

Guarantees cleanup even when the prior step throws. `IssueRelation` rows are cascade-deleted when `src` is deleted (Django `on_delete=CASCADE` — verified at `apps/api/plane/db/models/issue.py:288-289`).

### `#N [TEST-NN]` test naming with traceability tag

**Source:** `apps/web/e2e/specs/timeline-dependency-drag.spec.ts` lines 4, 25, 51 (existing `#N` pattern); Phase 6 D-11 adds `[TEST-NN]`
**Apply to:** Both tests in the new spec

```typescript
test("#1 [TEST-23] happy path: drag predecessor moves successor and persists", ...)
test("#2 [TEST-24] failure path: incomplete-schedule rejects drag and rolls back UI", ...)
```

---

## No Analog Found

No files in Phase 6 are without a codebase analog. All 4 target files have existing counterparts with exact or near-exact match quality.

However, two **patterns** have no existing analog and are new introductions in Phase 6:

| Pattern                        | File               | Reason                                                                                                           |
| ------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `expect.poll` for async DOM    | new spec           | Existing 3 specs assert synchronously; propagation re-render is async via `commitWithServerResult`               |
| `dayWidth` from DOM derivation | `timeline.page.ts` | No prior test reads block geometry for pixel calculations; `chart-coords.ts` import explicitly forbidden (D-03b) |

---

## Key Selector / Pattern Reference

| Seam                        | Selector / Pattern                                                                                       | Source                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Block element               | `[data-block-id="${issueId}"]`                                                                           | `block.tsx:117`                                     |
| Block onMouseDown wire      | `onMouseDown={(e) => enableBlockMove && handleBlockDrag(e, "move")}`                                     | `draggable.tsx:61`                                  |
| `enableBlockMove` guard     | `enableBlockMove && !!isBlockComplete` where `isBlockComplete = block?.start_date && block?.target_date` | `block.tsx:79,146`                                  |
| Right handle aria-label     | `"Drag to create dependency from this work item"`                                                        | `timeline.page.ts:53`                               |
| Left handle aria-label      | `"Drag to create dependency blocking this work item"`                                                    | `timeline.page.ts:55`                               |
| Propagation endpoint filter | `r.url().includes("/timeline-propagation/") && r.request().method() === "POST"`                          | Phase 3 D-01, RESEARCH.md §1                        |
| Toast title text (en)       | `"Schedule update failed"`                                                                               | `packages/i18n/src/locales/en/translations.ts:2769` |
| Toast description text (en) | `"A dependent work item is missing start or target dates."`                                              | `packages/i18n/src/locales/en/translations.ts:2772` |
| Success response shape      | `{ requested_work_item_id, total_updated_count, work_items[] }`                                          | Phase 3 endpoint, RESEARCH.md §3                    |
| Failure response shape      | `{ code: "INCOMPLETE_SCHEDULE", message: "..." }` with HTTP 422                                          | RESEARCH.md §4                                      |
| Relation URL                | `/api/workspaces/<slug>/projects/<id>/issues/<srcId>/issue-relation/`                                    | `apps/api/plane/app/urls/issue.py:236-239`          |
| Issue PATCH URL             | `/api/workspaces/<slug>/projects/<id>/issues/<id>/`                                                      | `apps/api/plane/app/urls/issue.py`                  |
| Day count formula           | `Math.round((end - start) / msPerDay) + 1` (inclusive, matches `(daysDiff+1)*dayWidth`)                  | `block.tsx:99-106`, RESEARCH.md §DOM                |

---

## Metadata

**Analog search scope:** `apps/web/e2e/` (specs, pages, fixtures), `apps/web/core/components/gantt-chart/` (block, draggable)
**Files scanned:** 6 (4 e2e files + block.tsx + draggable.tsx)
**Pattern extraction date:** 2026-05-04
