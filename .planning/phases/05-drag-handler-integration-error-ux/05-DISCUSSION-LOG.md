# Phase 5: Drag Handler Integration & Error UX — Discussion Log

**Date:** 2026-05-04
**Mode:** default (standard discuss-phase)
**User:** all 8 questions answered with the **Recommended** option (no deviations, no notes).

---

## Selected gray areas

User selected via AskUserQuestion (multiSelect) — implicitly all 4 first-round areas + 4 second-round areas were presented and answered.

## Round 1

### Q1. move drag を新エンドポイントに切り替える際、どこを書き換える?

- **Header:** Integration
- **Options presented:**
  - (Recommended) `base-gantt-root` の updateBlockDates を分岐 — base-gantt-root.tsx の `updateBlockDates` prop 内で、move 由来 (1件&日付のみ) なら `commitWithServerResult`、resize 由来なら既存 `updateIssueDates` を呼ぶ。`use-gantt-resizable.ts` は触らない。最小侵襲。
  - `use-gantt-resizable` の mouseup を分岐 — hook 内で分岐するため move 専用ロジックを近接配置できるが共通 hook を編集する。
  - 新規 `useGanttMoveDrag` hook を追加 — move ブランチ専用の新 hook を切り出す。コード量は最大、resize と完全分離。
- **User selected:** `base-gantt-root の updateBlockDates を分岐 (Recommended)`
- **Captured as:** D-01 (split inside `base-gantt-root.tsx::updateBlockDates`), D-01a (payload-shape predicate), D-01b (resize path unchanged), D-01c (issue-Gantt-only routing).

### Q2. ドラッグ中、影響を受ける後続/先行ブロックの見た目はどうする?

- **Header:** Preview UX
- **Options presented:**
  - (Recommended) 影響ブロックも mousemove ごとに動かす — beginPreview on mousedown, updatePreview on mousemove, IssueGanttBlock が previewById を observer で読む。Phase 4 helper の意図に最も忠実。
  - ドラッグ中は dragged のみ動かす、mouseup 後にプレビュー反映 — mouseup で beginPreview→commit を一括発火。実装はシンプル、UX は動的さ低下。
  - ドラッグ中も mouseup 後もサーバ応答だけで更新 — Phase 4 の preview 機能を Phase 5 で消費しない (Phase 6 で導入)。
- **User selected:** `影響ブロックも mousemove ごとに動かす (Recommended)`
- **Captured as:** D-02 (per-mousemove updatePreview, observer wiring), D-02a (dragged DOM stays direct), D-02b (sibling re-render via MobX observer), D-02c ("affected" = preview ids minus dragged).

### Q3. 失敗時の toast はコードごとにどこまで作り分ける?

- **Header:** Error UX
- **Options presented:**
  - (Recommended) コードごとにメッセージだけ差し替え — 全 7 コードとも setToast type=ERROR、title 共通、message のみ i18n key で切替。最小実装で全コード網羅、後で個別強化可。
  - severity をコードごとに分ける — SCHEDULE_CHANGED は WARNING、PERMISSION_DENIED は ERROR 等、コード→severity マップを定義。階層は出るがマップ定義の議論が増える。
  - コードごとに action ボタンも付与 — SCHEDULE_CHANGED→「最新を取得」、DEPENDENCY_CYCLE→「依存関係を確認」等の action ボタンを toast に付ける。スコープが広がる。
- **User selected:** `コードごとにメッセージだけ差し替え (Recommended)`
- **Captured as:** D-04 (single severity, per-code message key), D-04a (no action buttons), D-04b (no per-code severity), D-04c (`unexpectedError` separate fallback message), D-04d (default toast lifecycle).

### Q4. total_updated_count > preview_count のとき、どう通知する?

- **Header:** Hidden update
- **Options presented:**
  - (Recommended) INFO toast、自動 dismiss — setToast type=INFO、message='N 件の追加 Work Item が更新されました'、auto-dismiss、確認ダイアログなし (PRD §safe-limit)。
  - Gantt 上部に inline banner — dismiss 可能 banner で目立つが新コンポーネントが要る。
  - INFO toast + 「View」アクション — 該当 hidden id 群を視覚化。実装コスト中、UX 価値高だがスコープ膨張。
- **User selected:** `INFO toast、自動 dismiss (Recommended)`
- **Captured as:** D-05 (INFO toast with ICU plural), D-05a (no banner / no scroll-to), D-05b (success-only), D-05c (read after commit before next beginPreview).

## Round 2

### Q5. 新規追加する 7 コード + hidden-update の i18n key をどの namespace に置く?

- **Header:** i18n keys
- **Options presented:**
  - (Recommended) `timeline.propagation.*` — `timeline.propagation.error.*` + `timeline.propagation.hidden_update_notification`。ドメイン名がキーに入るため grep しやすい。
  - `gantt.errors.*` — 既存 gantt UI キーと同一 namespace だが「propagation」というドメイン名が見えずスコープが使い回されたときに意図が亡失。
  - `errors.timeline_propagation.*` — トップレベル errors 配下に集約。エラーをまとめたいポリシーなら適するが、現状 translations.json はドメイン単位グルーピングが主流。
- **User selected:** `timeline.propagation.* (Recommended)`
- **Captured as:** D-06 (10 new keys under `timeline.propagation.*`), D-06a (en + ja required this phase), D-06b (`translations.{json,ts}` per existing convention), D-06c (no language registration changes).

### Q6. mouseup 後・サーバ応答までの間、ドラッグしたブロックはどう見せる?

- **Header:** In-flight
- **Options presented:**
  - (Recommended) preview 位置に留まる、表示変更なし — previewById に反映された位置のまま、スピナーや透明化もしない。localhost はサブ秒で応答、確認ダイアログ不可のポリシーに一致。
  - preview 位置 + 薄い loading 表示 — ドラッグブロックに opacity-50 やボーダー色変更等。UX 明示的だが CSS と store 読み込みが増える。
  - 元位置にスナップバック + loading toast — mouseup で dragged を元位置に戻し INFO toast を出し、成功時に commit。UX と予測可能性が低下、preview 位置を見せた Phase 4 の設計意図とずれる。
- **User selected:** `preview 位置に留まる、表示変更なし (Recommended)`
- **Captured as:** D-07 (no visual change in-flight), D-07a (no drag-blocking gate), D-07b (`unexpectedError` renders as same toast).

### Q7. ドラッグ中に Esc を押されたときの振る舞いは?

- **Header:** Esc cancel
- **Options presented:**
  - (Recommended) Phase 5 ではサポートしない — PRD/ROADMAP に Esc 言及なし。今日の挙動と同じ。
  - Esc で rollback しドラッグ中断 — keydown listener 追加 + cleanup の負債。
- **User selected:** `Phase 5 ではサポートしない (Recommended)`
- **Captured as:** D-08 (no Esc handler), D-08a (rationale: keep diff small; seam already shipped).

### Q8. expected_updated_at(stale check の底値)はいつキャプチャする?

- **Header:** Snapshot
- **Options presented:**
  - (Recommended) mousedown 時点でスナップショット — beginPreview() で保持、mouseup まで他セッションが同じ issue を更新したら SCHEDULE_CHANGED。Phase 4 D-05b の snapshot 意図に一致。
  - mouseup 直前にキャプチャ — commit 直前に最新の updated_at を store から押さえる。ドラッグ中の他者更新を安易妥協的に受け入れてしまうため、「ドラッグ中に動いた」ケースを見逃しやすい。
- **User selected:** `mousedown 時点でスナップショット (Recommended)`
- **Captured as:** D-09 (snapshot at mousedown), D-09a (concurrent socket update → SCHEDULE_CHANGED is correct), D-09b (mouseup-snapshot would silently absorb concurrent edits — rejected).

---

## Notes

- No "Other" / freeform answers were used. No notes added by user.
- No scope-creep was raised by the user; all questions stayed inside Phase 5's domain (drag handler integration + error UX).
- All Phase 4 / Phase 3 contracts were treated as locked carry-overs (URL, store API, error code list, write-back surface, helper immutability). The Recommended options consistently respected those locks.
- No SPEC.md exists for this phase; CONTEXT.md is the locked decision artifact for plan-phase.

## Claude's discretion items (rolled into D-XX call-outs)

The "Claude's Discretion" section of CONTEXT.md lists 6 specific call-outs the user may want to revisit during plan-phase:

1. Sibling block re-render strategy (D-02 / D-02b — pure MobX-observer reactivity vs direct DOM writes)
2. Branch predicate for "is this a move" (D-01a — payload-shape detection vs explicit flag)
3. No action buttons in error toasts (D-04a — strongest case is `SCHEDULE_CHANGED` "Refresh")
4. No Esc-cancel (D-08 — 1-listener follow-up if product wants it)
5. In-flight visual silence (D-07 — revisit if remote latency profile changes)
6. Issue-Gantt-only routing (D-01c / D-03b — module/cycle/project Gantt stays on bulk-update)

## Deferred ideas tally

13 items deferred (see `<deferred>` in 05-CONTEXT.md):

- Esc-to-cancel · Action buttons in error toasts · Per-code severity · In-flight loading affordance · Inline banner for hidden update · Module/Cycle/Project Gantt propagation · Vitest in `apps/web` · `updateIssueDates` migration · `AbortController` · Telemetry · Locales beyond en + ja · Sticky toasts / custom timeouts · (any future product asks for richer wire-error metadata)

---

_Discussion log captured for human reference only. Downstream agents (researcher, planner, executor) consume `05-CONTEXT.md`, not this file._
