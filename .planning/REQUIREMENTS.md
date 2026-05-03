# Requirements: Plane Timeline Dependency — Date-Range Propagation

**Defined:** 2026-05-03
**Core Value:** ドラッグ移動が Precedence Boundary を超えても、サーバ権威で必要最小限の連鎖を all-or-nothing で再配置し、失敗時は明示的な reason code で UI に説明できる。

PRD: `docs/prd/timeline-dependency-date-range-propagation.md`(40 user stories)
ADRs: `docs/adr/0001-server-authoritative-dependency-schedule-propagation.md`, `docs/adr/0002-working-calendar-with-japan-holiday-preset.md`(deferred)
Domain: `CONTEXT.md`(Work Item / Precedence Dependency / Dependency Schedule Propagation / Precedence Boundary)

## v1 Requirements

各要件は PRD User Story および Implementation/Testing Decisions と紐付ける。
チェックは「ship + 検証」で打つ。

### Algorithm — Precedence Graph & Propagation Core

サーバ権威、deep module、TDD 単位で完結すべき箇所。

- [x] **PROP-01**: サーバは current project の同一プロジェクト範囲で `IssueRelation` を読み、`blocking` / `blocked_by` を **predecessor → successor** に正規化したグラフを構築できる(US-34, US-16) — Plan 01-02 (2026-05-03): `load_precedence_graph` in `apps/api/plane/app/services/timeline_propagation/graph.py` filters `blocked_by` and emits `Edge(predecessor=related_issue_id, successor=issue_id)`; pinned by `TestLoadPrecedenceGraphDirection` and `TestLoadPrecedenceGraphFilters::test_blocking_via_get_actual_relation_normalizes_to_one_edge`.
- [x] **PROP-02**: `relates_to` / `duplicate` はグラフに**含めない**(US-17, US-18) — Plan 01-02 (2026-05-03): loader drops every `relation_type != "blocked_by"`; pinned by `TestLoadPrecedenceGraphFilters::test_relates_to_is_dropped` and `test_duplicate_is_dropped`.
- [ ] **PROP-03**: 移動した Work Item が既存の Precedence Boundary を**1 つも違反しない**場合、その Work Item だけが更新される(US-2, US-5, US-10, US-11)
- [ ] **PROP-04**: rightward(後ろへ)の move が successor の Precedence Boundary を違反したとき、影響する successor だけを最小量で前進させる(US-4, US-10)
- [ ] **PROP-05**: leftward(前へ)の move が predecessor の Precedence Boundary を違反したとき、影響する predecessor だけを最小量で後退させる(US-3, US-11)
- [ ] **PROP-06**: 伝播は connected precedence path を**遷移的に**辿り、すべての影響枝を考慮する(chain / split / merge)(US-7, US-8, US-9)
- [ ] **PROP-07**: 既存の schedule gap は、Precedence Boundary 違反を起こさない限り**保存される**(圧縮しない)(US-6)
- [ ] **PROP-08**: 移動した Work Item の date-range duration(`target_date - start_date`)は保存される(US-13)
- [ ] **PROP-09**: 伝播される Work Item の date-range duration も保存される(US-14)
- [ ] **PROP-10**: 後続の `start_date` が直前先行の `target_date + 1 calendar day` に等しい(adjacency)場合は valid とみなす(US-12)
- [ ] **PROP-11**: 伝播は calendar-day date math で計算する(weekend/holiday は考慮しない)(Implementation Decision: calendar-day)
- [ ] **PROP-12**: 伝播は all-or-nothing で適用される(US-21)
- [ ] **PROP-13**: 伝播される Work Item 数の上限は 100。超過時は `PROPAGATION_LIMIT_EXCEEDED` で fail(US-29)
- [ ] **PROP-14**: 伝播ロジックは独立した service module(graph traversal / direction normalize / date-range move / limit / 失敗選択を小さい interface で隠蔽)として実装される(US-33)
- [x] **PROP-15**: precedence graph 上の循環(cycle)は伝播を停止し `DEPENDENCY_CYCLE` で fail(US-28) — Plan 01-02 (2026-05-03): graph-side cycle detection via iterative three-color DFS (`_detect_cycle` in `graph.py`) returns the closed cycle path tuple in `LoadResult.cycle` (Phase 2 will translate this into `DEPENDENCY_CYCLE` typed failure); pinned by `TestLoadPrecedenceGraphCycle::test_three_node_cycle_is_detected` and `test_self_edge_is_one_node_cycle`.
- [x] **PROP-16**: 同一プロジェクト範囲外に到達する依存パスは伝播全体を停止し `PROJECT_BOUNDARY_EXCEEDED` で fail(US-20) — Plan 01-02 (2026-05-03): graph-side classification only — `_make_edge` reads BOTH endpoints' `project_id` (preferring `issue_project_id` / `related_project_id` annotations) and routes ANY cross-project edge into `Adjacency.cross_project_edges` with `cross_project=True`, never entering same-project successors/predecessors (Phase 2/3 will translate reachability into `PROJECT_BOUNDARY_EXCEEDED`); pinned by `TestLoadPrecedenceGraphCrossProject::test_cross_project_successor_marked`.
- [ ] **PROP-17**: 伝播対象に `start_date` または `target_date` を欠く Work Item があれば伝播を停止し `INCOMPLETE_SCHEDULE` で fail(US-19)
- [x] **PROP-18**: 伝播はサービスレイヤとして resize は対象外、move(完全 schedule の移動)のみ対応(Implementation Decision: move only) — Plan 01-01 (2026-05-03): module-surface declaration in apps/api/plane/app/services/timeline_propagation/**init**.py and types.py module docstrings.

### API — Dedicated Propagation Endpoint

既存 bulk update から独立した、move intent 受け口。

- [ ] **API-01**: 専用の propagation endpoint が同一プロジェクト範囲で利用できる(Implementation Decision: dedicated endpoint)
- [ ] **API-02**: client は move intent(`work_item_id`, 元の schedule、`requested_start_date`, `requested_target_date`, `operation: "move"`)を送る。precomputed update list は受け付けない(US-35, Implementation Decision)
- [ ] **API-03**: 成功レスポンスは更新された全 Work Item の `id` / `start_date` / `target_date` / `updated_at` を返す(US-36)
- [ ] **API-04**: 成功レスポンスは propagation メタ情報(`requested_work_item_id`, `total_updated_count`, optional `client_preview_count`)を含む(Implementation Decision)
- [ ] **API-05**: 失敗レスポンスは安定した `{ code, message }` オブジェクトを返す(US-22, US-37)
- [ ] **API-06**: 初期失敗 code は `DEPENDENCY_CYCLE` / `PROJECT_BOUNDARY_EXCEEDED` / `INCOMPLETE_SCHEDULE` / `PROPAGATION_LIMIT_EXCEEDED` / `SCHEDULE_CHANGED` / `PERMISSION_DENIED` / `INVALID_DATE_RANGE` の 7 種(Implementation Decision)
- [ ] **API-07**: client が drag 開始時に持っていた `updated_at` または version と現在のサーバ値が乖離する場合は `SCHEDULE_CHANGED` で fail(US-27)
- [ ] **API-08**: 失敗時は **Work Item の dates が一切更新されない**(all-or-nothing 永続化)(US-21, Testing Decision)
- [ ] **API-09**: 既存 project permission を再利用し、unauthorized は `PERMISSION_DENIED` で fail(US-31)
- [ ] **API-10**: 不正な date range(例: `target_date < start_date`)は `INVALID_DATE_RANGE` で fail
- [ ] **API-11**: 既存 bulk date update endpoint は触らず、非伝播経路として残す(Implementation Decision)
- [ ] **API-12**: 伝播による Work Item 更新も既存の `updated_at` 更新規則に従い、audit に追跡可能(US-32)

### Frontend — Loaded-Graph Preview & Reconciliation

クライアントは advisory preview のみ。最終状態はサーバ応答で置換。

- [ ] **FE-01**: ドラッグ中、Gantt にロード済の Work Item に対して伝播を **preview** できる(simple / chain / branch)(US-23, Testing Decision)
- [ ] **FE-02**: preview はあくまで visual affordance であり、保存値ではない(Implementation Decision)
- [ ] **FE-03**: ドロップ時は新 propagation endpoint に move intent を送る
- [ ] **FE-04**: 成功時、サーバの updates で preview 状態を**置換する**(local 推定で上書きしない)(US-24)
- [ ] **FE-05**: 失敗時、preview を完全 rollback して元の schedule に戻し、reason を表示する(US-26, US-22)
- [ ] **FE-06**: サーバが preview に含まれていない Work Item を更新したとき、UI に「viewport 外でも N 件更新された」notification を出す(US-25)
- [ ] **FE-07**: safe limit 内(≤100)の伝播は確認ダイアログを出さずに保存する(US-30)
- [ ] **FE-08**: 既存の関係作成 cycle-check(UI 即時フィードバック)は残置(US-28 と二重保険、Implementation Decision)
- [ ] **FE-09**: 既存 timeline drag handler を新 endpoint に切替えるが、resize 経路は触らない(US-15)

### Errors & UX

- [ ] **ERR-01**: `DEPENDENCY_CYCLE` のとき、ユーザに「依存に循環があるため適用できない」旨を表示する(US-22)
- [ ] **ERR-02**: `PROJECT_BOUNDARY_EXCEEDED` のとき、「同一プロジェクト範囲外への伝播は未対応」旨を表示する
- [ ] **ERR-03**: `INCOMPLETE_SCHEDULE` のとき、「先に missing dates を埋めてください」旨を表示する
- [ ] **ERR-04**: `PROPAGATION_LIMIT_EXCEEDED` のとき、「100 件を超える更新は適用できない」旨を表示する
- [ ] **ERR-05**: `SCHEDULE_CHANGED` のとき、「他のユーザによる更新を検知、再読込してください」旨を表示する
- [ ] **ERR-06**: `PERMISSION_DENIED` のとき、「権限が不足しています」旨を表示する
- [ ] **ERR-07**: `INVALID_DATE_RANGE` のとき、「日付範囲が不正です」旨を表示する
- [ ] **ERR-08**: 失敗時は Timeline の状態を**ドラッグ前の見え方**に戻す(US-26)

### Tests

- [ ] **TEST-01**: backend service unit test: no-violation move(動かしたものだけ更新)(Testing Decision)
- [ ] **TEST-02**: backend service unit test: rightward propagation to one successor
- [ ] **TEST-03**: backend service unit test: leftward propagation to one predecessor
- [ ] **TEST-04**: backend service unit test: transitive chain
- [ ] **TEST-05**: backend service unit test: split successor branches
- [ ] **TEST-06**: backend service unit test: merge predecessor branches
- [ ] **TEST-07**: backend service unit test: gap preservation
- [ ] **TEST-08**: backend service unit test: exact boundary adjacency
- [ ] **TEST-09**: backend service unit test: incomplete scheduled work item → `INCOMPLETE_SCHEDULE`
- [ ] **TEST-10**: backend service unit test: cross-project dependency path → `PROJECT_BOUNDARY_EXCEEDED`
- [x] **TEST-11**: backend service unit test: cycle detection → `DEPENDENCY_CYCLE` — Plan 01-02 (2026-05-03): `TestLoadPrecedenceGraphCycle::test_three_node_cycle_is_detected` and `test_self_edge_is_one_node_cycle` in `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` cover three-node and self-edge cycle cases.
- [ ] **TEST-12**: backend service unit test: 100 work item limit → `PROPAGATION_LIMIT_EXCEEDED`
- [ ] **TEST-13**: backend service unit test: stale schedule rejection → `SCHEDULE_CHANGED`
- [ ] **TEST-14**: backend service unit test: invalid date range → `INVALID_DATE_RANGE`
- [ ] **TEST-15**: API contract test: 任意の失敗で permanent persistence が起きない(all-or-nothing)
- [ ] **TEST-16**: API contract test: 成功 payload に updated work item dates と `updated_at` が含まれる
- [ ] **TEST-17**: API contract test: 失敗 payload に stable code と user-readable message が含まれる
- [ ] **TEST-18**: API contract test: permission rejection は `PERMISSION_DENIED`(viewset 層)(US-31)
- [ ] **TEST-19**: frontend store test: loaded-graph preview(simple / chain / branch)
- [ ] **TEST-20**: frontend store test: failure 後の preview rollback
- [ ] **TEST-21**: frontend store test: server-returned updates が preview を置換
- [ ] **TEST-22**: frontend store test: hidden-update notification(`server count > preview count`)
- [ ] **TEST-23**: E2E happy path: drag → 依存 work item が動く → 永続化
- [ ] **TEST-24**: E2E failure path: drag → reject → UI が原状復帰

## v2 Requirements

(Working Calendar マイルストーンへ — `docs/timeline-dependency-follow-up-tasks.md`)

### Working Calendar(別マイルストーン)

- **WC-01**: workspace default + project override の Working Calendar モデル
- **WC-02**: editable working weekdays / non-working dates
- **WC-03**: Japan public holiday preset(2024-2030)を年単位 import
- **WC-04**: non-working date の出所(`manual` / `jp_holiday_preset`)
- **WC-05**: `planned_duration_working_days` フィールド(Plane の estimate と分離)
- **WC-06**: working-calendar ベースで `target_date = start_date + planned_duration` を自動計算
- **WC-07**: propagation が calendar-day から working-day に切替可能(本マイルストーンで API 形を保つ)
- **WC-08**: Gantt 軸は calendar-day 表示維持、non-working-day は highlight のみ

## Out of Scope

| Feature                                                | Reason                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| Working Calendar(working-day 計算)                     | ADR 0002 に分離、本マイルストーンの API 形だけは将来差替に対応 |
| 日本祝日プリセット                                     | Working Calendar に依存                                        |
| `planned_duration_working_days` フィールド             | Plane estimate との分離設計が未決                              |
| `start_date + planned_duration → target_date` 自動計算 | 同上                                                           |
| 週末/祝日スキップ伝播                                  | Working Calendar 前提                                          |
| Gantt 軸の non-working-day 非表示                      | 本機能の責務外                                                 |
| Resize(左/右ハンドル)の伝播                            | move のみで PRD scope                                          |
| Cross-project propagation                              | same-project 境界、超過時は code で fail                       |
| 専用 Undo アクション                                   | 本マイルストーンに含めない                                     |
| 確認ダイアログ(safe limit 内)                          | direct manipulation 維持                                       |
| Plane の estimate / time estimate モデル変更           | 本機能と無関係                                                 |
| 関係性なし Timeline console warning 修復               | propagation を阻害しない限り無関係                             |
| 依存関係作成 UI の置き換え                             | 既存実装を残す、relation データを参照するのみ                  |

## Traceability

各要件はちょうど一つの Phase に割り当てる(orphan なし、duplicate なし)。Phase 詳細は `.planning/ROADMAP.md` を参照。

| Requirement | Phase   | Status                        |
| ----------- | ------- | ----------------------------- |
| PROP-01     | Phase 1 | Done (Plan 01-02, 2026-05-03) |
| PROP-02     | Phase 1 | Done (Plan 01-02, 2026-05-03) |
| PROP-03     | Phase 2 | Pending                       |
| PROP-04     | Phase 2 | Pending                       |
| PROP-05     | Phase 2 | Pending                       |
| PROP-06     | Phase 2 | Pending                       |
| PROP-07     | Phase 2 | Pending                       |
| PROP-08     | Phase 2 | Pending                       |
| PROP-09     | Phase 2 | Pending                       |
| PROP-10     | Phase 2 | Pending                       |
| PROP-11     | Phase 2 | Pending                       |
| PROP-12     | Phase 2 | Pending                       |
| PROP-13     | Phase 2 | Pending                       |
| PROP-14     | Phase 2 | Pending                       |
| PROP-15     | Phase 1 | Done (Plan 01-02, 2026-05-03) |
| PROP-16     | Phase 1 | Done (Plan 01-02, 2026-05-03) |
| PROP-17     | Phase 2 | Pending                       |
| PROP-18     | Phase 1 | Done (Plan 01-01, 2026-05-03) |
| API-01      | Phase 3 | Done (Plan 03-01, 2026-05-04) |
| API-02      | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| API-03      | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| API-04      | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| API-05      | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| API-06      | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| API-07      | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| API-08      | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| API-09      | Phase 3 | Done (Plan 03-02, 2026-05-04 — 401 unauth + 403 envelope across non-member/GUEST/cross-project all GREEN) |
| API-10      | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| API-11      | Phase 3 | Done (Plan 03-01, 2026-05-04) |
| API-12      | Phase 3 | Pending                       |
| FE-01       | Phase 4 | Pending                       |
| FE-02       | Phase 4 | Pending                       |
| FE-03       | Phase 5 | Pending                       |
| FE-04       | Phase 4 | Pending                       |
| FE-05       | Phase 4 | Pending                       |
| FE-06       | Phase 4 | Pending                       |
| FE-07       | Phase 4 | Pending                       |
| FE-08       | Phase 4 | Pending                       |
| FE-09       | Phase 5 | Pending                       |
| ERR-01      | Phase 5 | Pending                       |
| ERR-02      | Phase 5 | Pending                       |
| ERR-03      | Phase 5 | Pending                       |
| ERR-04      | Phase 5 | Pending                       |
| ERR-05      | Phase 5 | Pending                       |
| ERR-06      | Phase 5 | Pending                       |
| ERR-07      | Phase 5 | Pending                       |
| ERR-08      | Phase 5 | Pending                       |
| TEST-01     | Phase 2 | Pending                       |
| TEST-02     | Phase 2 | Pending                       |
| TEST-03     | Phase 2 | Pending                       |
| TEST-04     | Phase 2 | Pending                       |
| TEST-05     | Phase 2 | Pending                       |
| TEST-06     | Phase 2 | Pending                       |
| TEST-07     | Phase 2 | Pending                       |
| TEST-08     | Phase 2 | Pending                       |
| TEST-09     | Phase 2 | Pending                       |
| TEST-10     | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| TEST-11     | Phase 1 | Done (Plan 01-02, 2026-05-03) |
| TEST-12     | Phase 2 | Pending                       |
| TEST-13     | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| TEST-14     | Phase 2 | Pending                       |
| TEST-15     | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| TEST-16     | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| TEST-17     | Phase 3 | Done (Plan 03-02, 2026-05-04) |
| TEST-18     | Phase 3 | Done (Plan 03-02, 2026-05-04 — 401 unauth + 403 non-member + 403 GUEST all GREEN) |
| TEST-19     | Phase 4 | Pending                       |
| TEST-20     | Phase 4 | Pending                       |
| TEST-21     | Phase 4 | Pending                       |
| TEST-22     | Phase 4 | Pending                       |
| TEST-23     | Phase 6 | Pending                       |
| TEST-24     | Phase 6 | Pending                       |

**Coverage:**

- v1 requirements: 71 total
- Mapped to phases: 71 (100%)
- Unmapped: 0 ✓
- Per-phase distribution: Phase 1 = 6, Phase 2 = 24, Phase 3 = 18, Phase 4 = 11, Phase 5 = 10, Phase 6 = 2 (sum = 71)

---

_Requirements defined: 2026-05-03_
_Last updated: 2026-05-03 — traceability mapped after roadmap finalization_
