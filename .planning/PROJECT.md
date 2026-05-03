# Plane Timeline Dependency — Date-Range Propagation

## What This Is

Plane Timeline (Gantt チャート) で Work Item のドラッグ移動時に、Precedence Dependency
(`blocking` / `blocked_by`) を尊重して関連 Work Item の `start_date` / `target_date` を
**サーバ権威で all-or-nothing 伝播**させる機能。本マイルストーンは Plane 本家互換の
date-range model に閉じた「最初の Plane-compatible 実装」をスコープとする。Working Calendar /
日本祝日 / planned working-day duration は明示的に follow-up 扱い。

ユーザは Plane を内製プロジェクト管理基盤として採用しているチーム。Issue Gantt を主スケジュール
ビューとして使い、ドラッグで日付調整するワークフローを既に運用している。現状はドラッグした
Work Item 1 件しか動かず、依存連鎖が壊れたまま見えるため手動補修が発生している。

## Core Value

**ドラッグ移動が Precedence Boundary を超えても、サーバ権威で必要最小限の連鎖を all-or-nothing
で再配置し、失敗時は明示的な reason code で UI に説明できる。** Timeline の見た目と
依存グラフの整合性が常に保たれることが本機能の唯一の価値。部分更新は valid な結果ではない。

## Requirements

### Validated

<!-- Plane の既存実装で動作している機能。本マイルストーンの土台になる。-->

- ✓ Issue Gantt レイアウトで Work Item を date-range で表示・ドラッグ移動できる — `apps/web/ce/components/gantt-chart/`
- ✓ 単一 Work Item の `start_date` / `target_date` を bulk update API で更新できる — `apps/api/plane/app/views/issue/`
- ✓ Issue 間に `blocking` / `blocked_by` / `relates_to` / `duplicate` の `IssueRelation` を作成できる — `apps/api/plane/app/views/issue/relation.py`
- ✓ Gantt 上で右/左ハンドルからドラッグして blocking/blocked_by 関係を作成できる — `apps/web/ce/components/gantt-chart/dependency/use-dependency-drag.ts`(commit `f01289047c`)
- ✓ 依存線を SVG で描画(`blocking` のみ iterate、`blocked_by` は mirror として 1 本に集約) — `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx`
- ✓ 関係作成時のクライアントサイド循環ガード(即時フィードバック用) — `apps/web/ce/components/gantt-chart/dependency/cycle-check.ts`
- ✓ Playwright E2E 基盤(認証 + storageState + Issue 依存ドラッグ 3 ケース) — `apps/web/e2e/`
- ✓ `data-block-id` / `data-dependency-key` E2E アサート用 attribute — `apps/web/core/components/gantt-chart/blocks/block.tsx`, `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx`
- ✓ ドラフト ADR/PRD/CONTEXT/follow-up tasks ドキュメント整備済 — `docs/adr/`, `docs/prd/`, `CONTEXT.md`, `docs/timeline-dependency-follow-up-tasks.md`

### Active

<!-- 本マイルストーンで実装するもの。すべて「shipped かつ検証 OK」になるまでは仮説扱い。-->

- [ ] Same-project precedence graph loader(`IssueRelation` を predecessor→successor 正規化、サイクル検出付き)
- [ ] Date-range scheduling helper(duration 保存、boundary 判定、minimum-movement 計算、calendar-day date math)
- [ ] Backend propagation service(deep module、graph 走査 + 方向正規化 + 移動 + limit + 失敗選択を小さい interface で隠蔽)
- [ ] 既存 bulk update から独立した propagation API endpoint(move intent を受け取り、updated work items を返す)
- [ ] All-or-nothing transactional persistence(任意の失敗で完全ロールバック)
- [ ] Stable error code object 返却(`DEPENDENCY_CYCLE` / `PROJECT_BOUNDARY_EXCEEDED` / `INCOMPLETE_SCHEDULE` / `PROPAGATION_LIMIT_EXCEEDED` / `SCHEDULE_CHANGED` / `PERMISSION_DENIED` / `INVALID_DATE_RANGE`)
- [ ] 100 Work Item の伝播上限(safe limit)
- [ ] Stale schedule 検出(client が drag 開始時に持っていた `updated_at`/version との比較)
- [ ] フロントエンド loaded-graph preview(ドラッグ中、見えている Work Item のみ仮表示)
- [ ] サーバレスポンスでの preview 状態置換(hidden update があれば notification)
- [ ] 失敗時の preview rollback と reason 表示
- [ ] バックエンド propagation service 単体テスト(no-violation / forward / backward / chain / split / merge / gap / boundary / incomplete / cross-project / cycle / 100-limit / stale / invalid range)
- [ ] API contract test(all-or-nothing、success payload、failure code/message、permission)
- [ ] フロントエンド store unit test(loaded-graph preview、rollback、server replace、hidden notification)
- [ ] Playwright E2E happy path + 失敗 path

### Out of Scope

<!-- 本マイルストーンでは触らない。理由付きで残す。-->

- Working Calendar による working-day 計算 — ADR 0002 で別マイルストーン化、PRD 明示
- 日本祝日プリセット — Working Calendar に依存、follow-up `docs/timeline-dependency-follow-up-tasks.md`
- `planned_duration_working_days` フィールド — Plane の estimate 体系と分離する設計議論が未決
- `start_date + planned duration → target_date` の自動計算 — 上に同じ
- 週末/祝日スキップ伝播 — Working Calendar が前提
- Gantt 軸の non-working-day 非表示 — 本機能の責務外
- 左/右ハンドルの resize による伝播 — PRD 明示の out-of-scope(move のみ)
- Cross-project propagation — same-project boundary のみサポート、超えたら `PROJECT_BOUNDARY_EXCEEDED` で fail
- 専用 Undo アクション — 本マイルストーンでは追加しない
- safe limit 内 propagation の確認ダイアログ — direct manipulation 維持のため省略
- Plane の estimate / time estimate モデル変更 — 関係なし、touch しない
- 既存 Timeline console warnings の修復 — 本機能をブロックしない限り out-of-scope
- 依存関係作成 UI の置き換え — 既存 drag 作成は残置、関係データを propagation で参照するのみ

## Context

**Codebase:** Plane モノレポ(pnpm workspace + Turborepo)。本機能は 3 層に跨る:

- `apps/api`(Django + Celery + Postgres)— 権威性のある propagation service と endpoint
- `apps/web`(React Router v7 + MobX + Tiptap + pragmatic-DnD)— Gantt drag handler、preview store、UI
- `packages/services`(`@plane/services`)— REST client。新 endpoint 用 client method を追加

**前提:**

- `apps/api` は pnpm workspace **対象外**(`pnpm-workspace.yaml`)。Python 側は別の toolchain
  (`apps/api/run_tests.py` または `pytest` 直接、`DJANGO_SETTINGS_MODULE=plane.settings.test`)
- Django テスト harness は pytest + `--reuse-db --nomigrations`、coverage 90% 強制(`--coverage` 時)
- フロントエンドのテスト harness は限定的(`apps/live` は Vitest、`apps/web` は **未導入**)。
  本マイルストーンで MobX store の unit test を入れる場合、Vitest 導入の是非を Phase 4 で判断
- E2E は既存 Playwright 環境(`apps/web/e2e/`)を再利用、新規ケースを追加
- OxLint 警告バジェットは ratcheting(現 web=11957、api=対象外)。新規コードは warnings 0 を目標
- ce/core 分離(`@/plane-web/*` → `apps/web/ce/`、`@/*` → `apps/web/core/`)。ee 由来コードは
  OSS tree に存在しないため CE スコープで完結する設計が必須

**Domain:** 本リポジトリの `CONTEXT.md` で確立した Ubiquitous Language を使う:
Work Item / Precedence Dependency / Dependency Schedule Propagation / Precedence Boundary。
"issue" は内部スキーマ用語、"relation" は無方向関係を含むため propagation 議論には使わない。

**Prior art:**

- Issue Gantt の依存線は `dependency-paths.tsx` が `relationMap[srcId].blocking` のみ iterate、
  `blocked_by` は描画上 mirror 集約。propagation も同じく direction normalize が必要
- Timeline drag は pragmatic-DnD 由来ではなく **ネイティブ `mousedown`/`mousemove`/`mouseup` +
  `document.elementFromPoint`** で実装(spec §2.4 参照)。E2E は HTML5 DnD 不可、`page.mouse.*`
  を使用
- E2E setup は `playwright/.auth/user.json` を `setup` project で生成する pattern。本機能の
  E2E 追加もこの pattern を踏襲

## Constraints

- **Architecture**: ADR 0001 を遵守 — server is authoritative、full same-project precedence graph
  を resolve、all-or-nothing、failure には reason code を含める
- **Compatibility**: ADR 0002 の Working Calendar は **採用しない**。ただし date math 部を独立
  helper にして将来の calendar-day → working-day 切替を API 形を変えずに行える設計にする
- **API stability**: 失敗 code はテキストではなく `{ code, message }` 形式の安定オブジェクトで
  返す。UI 文言とテストは code に依存
- **Tech stack**: Django のサービスは pure Python(NetworkX 等の追加依存は避ける)。BFS/DFS は
  自前実装で十分、依存最小化
- **Performance**: 1 ドラッグで最大 100 Work Item 更新まで。超過は `PROPAGATION_LIMIT_EXCEEDED`
- **Permissions**: 既存 project permission を再利用、propagation 専用権限は追加しない
- **Testing**: backend service が最も篤くカバーされる(authoritative). テストは外形的な
  「graph + 入力 → persisted updates / response payload / 可視 client state」の観点で書き、
  内部実装の helper 名・走査順は assert しない

## Key Decisions

| Decision                                                                   | Rationale                                                                                                                | Outcome                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Server is authoritative; client preview is advisory                        | ADR 0001 に従う。クライアントは paginated graph しか持たないため hidden dependency を破壊しうる                          | ✓ Pending(本マイルストーンで実装) |
| Working Calendar / 日本祝日 を follow-up に分離                            | ADR 0002 の scheduling extension は別マイルストーン。propagation を先に出荷して fast-feedback を得る                     | — Pending                         |
| Backend propagation service を deep module として実装                      | graph 走査 / direction 正規化 / 日付計算 / limit / 失敗選択 を小さい interface で隠蔽し、API/View 層と独立に TDD する    | — Pending                         |
| Dedicated propagation endpoint(既存 bulk date update を overload しない)   | validation / response / failure semantics が異なる。混在させると分岐が増える                                             | — Pending                         |
| Date math は helper に分離(calendar-day を後で working-day に差し替え可能) | ADR 0002 の future implementation との互換性を API 形を変えずに保つ                                                      | — Pending                         |
| Sequential phase execution(parallelization=false)                          | Phase は backend deep module → API → frontend store → E2E の順で contract が固まる必要がある。並列化は不要な手戻りを生む | — Pending                         |
| 既存 cycle-check (UI 即時フィードバック)は残置 + サーバ側でも cycle 検出   | ADR 0001 通り server が最終判定。UI は responsiveness のための重複実装                                                   | — Pending                         |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-05-03 after initialization_
