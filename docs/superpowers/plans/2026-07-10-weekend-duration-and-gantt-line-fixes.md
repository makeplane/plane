# Weekend Duration & Gantt Dependency Line Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** レビューで確定した稼働日 duration 機能のバグ3件（再計算 duration の上限抜け・move 経路の duration 破壊・週末 target の三つ組不整合)、テスト欠落10項目、ガント依存線の直線退化を修正する。

**Architecture:** 中核不変条件を1つ導入する — **「スケジュール書き込み（serializer / bulk / propagation）を通過した行について、`planned_duration_working_days` が non-null かつ `start_date` non-null なら `add_working_days(start_date, duration) == target_date` が成立する」**。直接編集では往復整合しないレンジの duration を保存しない（None に落とす)、propagation では週末着地 target を直前の金曜へスナップして duration を維持する。正規化はスケジュール書き込み経路でのみ走るため、不変条件はその経路を通った行にのみ保証される — 全行で成立する根拠は次の前提: **この機能は未リリース（migration 0122 は本ブランチ初出）であり、不整合な既存データは存在しない**。この前提が崩れる環境に出す場合は backfill を別途計画すること。ガント線は `buildBezierPath` に最小ハンドル長を入れ（Tier 1)、確定線を角丸エルボー配線に切り替える（Tier 2）。

**Tech Stack:** Django/DRF + pytest（`apps/api`)、TypeScript + Vitest（`packages/utils`)、React/MobX（`apps/web`)。

## Global Constraints

- パッケージ管理は **pnpm のみ**（npm/yarn 禁止）。フォーマット/リントは oxfmt/oxlint（pre-commit が自動実行）。`--max-warnings` は引き上げない。
- `apps/web` 本体にユニットテストハーネスは**無い**。新設しない（CLAUDE.md）。フロント本体の検証は `pnpm check:types` と目視。
- 新しい UI 文字列は追加しない（i18n 変更なし）。DB マイグレーション追加なし（不変条件は書き込み時に自己修復されるため backfill 不要）。
- コミットは Conventional Commits（`fix:` / `test:` / `feat:`）。各コミット末尾に `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。
- **バックエンドテストの実行環境**（検証済みの手順。Plane の docker スタックは不要）:

  ```bash
  # 1) 使い捨て Postgres（テスト後に docker rm -f plane-test-pg で破棄）
  docker run -d --name plane-test-pg -e POSTGRES_PASSWORD=test -e POSTGRES_USER=test \
    -e POSTGRES_DB=plane_test -p 55432:5432 postgres:15.7-alpine

  # 2) venv が空の場合のみ: psycopg-c（pg_config 必須）を除外してインストール
  #    （-r は記述ファイル基準で解決されるため、両ファイルとも /tmp に絶対パスで生成する）
  cd apps/api
  grep -v "psycopg-c" requirements/base.txt > /tmp/plane-base-req.txt
  { echo "-r /tmp/plane-base-req.txt"; grep -v "^-r base.txt" requirements/test.txt; } > /tmp/plane-test-req.txt
  uv pip install -r /tmp/plane-test-req.txt

  # 3) 実行（以後、本計画で PYTEST と表記するコマンド。apps/api から実行すること）
  DATABASE_URL=postgresql://test:test@localhost:55432/plane_test \
  REDIS_URL=redis://localhost:6379 SECRET_KEY=test \
  APP_BASE_URL=http://localhost:3000 WEB_URL=http://localhost:3000 \
  DJANGO_SETTINGS_MODULE=plane.settings.test \
  uv run --no-sync python -m pytest -q -p no:cacheprovider
  ```

  既存の `plane/tests/contract/app/test_timeline_propagation.py::test_existing_bulk_update_endpoint_unchanged` は **Task 6 完了までは失敗する**。原因は2つ: (1) 本ブランチが bulk レスポンスを `{"message"}` から `{"message", "issues"}` に変えており、旧契約を固定するこのテストの assertion が成立しない（broker のある CI では assertion で落ちる)、(2) このテストは issue_activity を mock していないため、broker の無いローカルでは 500 で落ちる。Task 6 Step 2 でテスト自体を新契約に更新し mock を追加する。**Task 6 以降は既知失敗ゼロ** — すべての失敗を実装の問題として扱う。

## 背景の重要訂正（バグ②のスコープ）

CE の配線調査の結果、issue ガント4レイアウト（project/module/cycle/project-view）はすべて `BaseGanttRoot` を通り、**単一・完全ブロックの move は常に propagation エンドポイント**（duration 保持で正しい）に乗る。よってバグ②「move で duration が 5→3 に化ける」は**現 UI では再現しない潜在バグ**である。ただし bulk エンドポイント（`IssueBulkUpdateDateEndpoint`）は両端日付を受けると常に「target 編集＝duration 再計算」と解釈するため、(a) API 直叩き、(b) `BaseGanttRoot` の else 分岐に move が落ちる将来の配線変更、で発現する。修正はユーザー決定どおり**フロントの送信内容の防御的変更**（Task 5）と **contract テストによる意味論の固定**（Task 6）で行う。サーバ側の move 推定・intent フラグ追加はしない。

## File Structure

- `apps/api/plane/app/services/weekend_working_days.py` — `latest_working_day_on_or_before` 追加、`_recalculated_duration` 追加（往復整合ガード）
- `apps/api/plane/app/services/timeline_propagation/scheduling.py` — `working_day_target_on_or_before` ラッパー追加
- `apps/api/plane/app/services/timeline_propagation/propagation.py` — `_walk_backward` に週末スナップ
- `apps/api/plane/tests/unit/services/test_weekend_working_days.py` — ヘルパー/normalize テスト追加
- `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` — 週末着地・混在チェーン・resize バイパステスト追加
- `apps/api/plane/tests/contract/app/test_issue_bulk_update_dates.py` — **新規**: bulk エンドポイント contract テスト
- `apps/api/plane/tests/contract/app/test_issue_working_day_duration.py` — PATCH 契約回帰・Mutation Rules・境界値テスト追加
- `packages/utils/src/timeline-propagation/preview.ts` — 後方ウォークの週末スナップミラー
- `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` — 後方ウォーク/週末開始/duration マージテスト追加
- `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx` — else 分岐の move 防御
- `apps/web/ce/components/gantt-chart/dependency/build-bezier.ts` — MIN_HANDLE 下限 + `buildElbowPath` 追加
- `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx` — 確定線をエルボーに切替

検証済みの曜日表（本計画のテストが使う日付。すべて Python で実算済み）:

| 日付       | 曜日 |     | 日付       | 曜日 |
| ---------- | ---- | --- | ---------- | ---- |
| 2026-01-05 | 月   |     | 2026-05-04 | 月   |
| 2026-01-09 | 金   |     | 2026-05-07 | 木   |
| 2026-01-10 | 土   |     | 2026-05-08 | 金   |
| 2026-01-11 | 日   |     | 2026-05-09 | 土   |
| 2026-01-12 | 月   |     | 2026-05-10 | 日   |
| 2026-01-16 | 金   |     | 2026-05-11 | 月   |
| 2026-01-19 | 月   |     | 2026-05-13 | 水   |
| 2026-01-23 | 金   |     | 2027-05-31 | 月   |

- `count_working_days(2026-01-05, 2027-06-01)` = **367**（上限超えテスト用）
- `add_working_days(2026-01-05, 366)` = **2027-05-31**（上限ちょうどテスト用）

---

### Task 1: 週末スナップヘルパー `latest_working_day_on_or_before`

**Files:**

- Modify: `apps/api/plane/app/services/weekend_working_days.py`
- Test: `apps/api/plane/tests/unit/services/test_weekend_working_days.py`

**Interfaces:**

- Produces: `latest_working_day_on_or_before(d: date) -> date` — `d` が稼働日ならそのまま、土日なら直前の金曜を返す。Task 2, 3, 4 が前提にする。

- [ ] **Step 1: 失敗するテストを書く**

`test_weekend_working_days.py` の `TestWeekendWorkingDays` クラス末尾に追加:

```python
    def test_latest_working_day_on_or_before_weekday_is_identity(self):
        assert latest_working_day_on_or_before(date(2026, 1, 12)) == date(2026, 1, 12)

    def test_latest_working_day_on_or_before_saturday_snaps_to_friday(self):
        assert latest_working_day_on_or_before(date(2026, 1, 10)) == date(2026, 1, 9)

    def test_latest_working_day_on_or_before_sunday_snaps_to_friday(self):
        assert latest_working_day_on_or_before(date(2026, 1, 11)) == date(2026, 1, 9)
```

ファイル冒頭の import に `latest_working_day_on_or_before` を追加する。

- [ ] **Step 2: 失敗を確認**

Run: `PYTEST plane/tests/unit/services/test_weekend_working_days.py`
Expected: FAIL — `ImportError: cannot import name 'latest_working_day_on_or_before'`

- [ ] **Step 3: 実装**

`weekend_working_days.py` の `subtract_working_days` の直後に追加:

```python
def latest_working_day_on_or_before(d: date) -> date:
    """Return `d` when it is a working day, else the closest earlier working day."""
    current = d
    while is_weekend(current):
        current -= timedelta(days=1)
    return current
```

- [ ] **Step 4: パスを確認**

Run: `PYTEST plane/tests/unit/services/test_weekend_working_days.py`
Expected: PASS（既存分含め全件）

- [ ] **Step 5: コミット**

```bash
git add apps/api/plane/app/services/weekend_working_days.py \
        apps/api/plane/tests/unit/services/test_weekend_working_days.py
git commit -m "feat: add latest_working_day_on_or_before helper"
```

---

### Task 2: バグ①③ — 再計算 duration のラウンドトリップガード

target 直接編集で duration を再計算する分岐に「1..366 の範囲内」かつ「`add_working_days` で往復整合する」ガードを入れる。満たさないレンジ（週末着地・366超）は duration=None（explicit date 管理に戻る）。ユーザー指定日は一切変更しない。

**Files:**

- Modify: `apps/api/plane/app/services/weekend_working_days.py:113-120`
- Test: `apps/api/plane/tests/unit/services/test_weekend_working_days.py`
- Test: `apps/api/plane/tests/contract/app/test_issue_working_day_duration.py`

**Interfaces:**

- Consumes: Task 1 の `add_working_days` / `count_working_days`
- Produces: `normalize_working_day_schedule` の新しい意味論 — 「target 編集の再計算 duration は round-trip 整合時のみ non-null」。Task 3, 4, 6 が同じ意味論を前提にする。

- [ ] **Step 1: 失敗する unit テストを書く**

`TestWeekendWorkingDays` に追加（`normalize_working_day_schedule` は import 済み）:

```python
    def test_weekend_target_edit_clears_duration(self):
        start, target, duration = normalize_working_day_schedule(
            current_start_date=date(2026, 1, 5),
            current_target_date=date(2026, 1, 9),
            current_planned_duration_working_days=5,
            target_date=date(2026, 1, 11),  # Sunday — never round-trips
        )
        assert (start, target, duration) == (date(2026, 1, 5), date(2026, 1, 11), None)

    def test_target_edit_beyond_max_duration_clears_duration(self):
        start, target, duration = normalize_working_day_schedule(
            current_start_date=date(2026, 1, 5),
            current_target_date=date(2026, 1, 9),
            current_planned_duration_working_days=5,
            target_date=date(2027, 6, 1),  # 367 working days from start
        )
        assert (start, target, duration) == (date(2026, 1, 5), date(2027, 6, 1), None)

    def test_target_edit_at_max_duration_boundary_keeps_duration(self):
        start, target, duration = normalize_working_day_schedule(
            current_start_date=date(2026, 1, 5),
            current_target_date=date(2026, 1, 9),
            current_planned_duration_working_days=5,
            target_date=date(2027, 5, 31),  # exactly 366 working days, lands Monday
        )
        assert duration == 366

    def test_weekend_start_roundtrip_keeps_duration(self):
        start, target, duration = normalize_working_day_schedule(
            current_start_date=date(2026, 1, 10),  # Saturday start is allowed by spec
            current_target_date=None,
            current_planned_duration_working_days=None,
            target_date=date(2026, 1, 12),  # Monday; count=1 and add(Sat,1)==Monday
        )
        assert (start, target, duration) == (date(2026, 1, 10), date(2026, 1, 12), 1)
```

- [ ] **Step 2: 失敗を確認**

Run: `PYTEST plane/tests/unit/services/test_weekend_working_days.py`
Expected: FAIL — `test_weekend_target_edit_clears_duration` が `duration == 5`（週末着地でも count 値を保存する現行動作)、`test_target_edit_beyond_max_duration_clears_duration` が `duration == 367` で落ちる。他2件は PASS でよい。

- [ ] **Step 3: 実装**

`weekend_working_days.py` — `normalize_working_day_schedule` の直前に追加:

```python
def _recalculated_duration(start: date, target: date) -> int | None:
    """Duration derived from a direct target-date edit (caller guarantees start <= target).

    Only ranges that round-trip through `add_working_days` stay duration-managed:
    weekend-landing targets and ranges beyond MAX_WORKING_DAY_DURATION fall back
    to explicit-date behavior (None) instead of storing an inconsistent triple.

    The max-target bound is computed first so a far-future target (e.g. year
    9999 from a date picker) exits after ~500 iterations instead of walking
    the whole range day by day — `count_working_days` below is then bounded
    by the same ~500-day window.
    """
    max_target = add_working_days(start, MAX_WORKING_DAY_DURATION)
    if target > max_target:
        return None
    working_days = count_working_days(start, target)
    if working_days < 1:
        return None
    if add_working_days(start, working_days) != target:
        return None
    return working_days
```

（`target <= max_target` なら `count_working_days` の結果は必ず 366 以下になるため、明示的な `> MAX_WORKING_DAY_DURATION` チェックは不要。）

同ファイルの `elif target_provided:` 分岐（113-120行）を書き換え:

```python
    elif target_provided:
        if target is None:
            duration = None
        elif start is not None:
            if target < start:
                raise ValueError("Start date cannot exceed target date")
            duration = _recalculated_duration(start, target)
```

（`working_days = count_working_days(...)` と `duration = working_days if ... else None` の2行が `duration = _recalculated_duration(start, target)` に置き換わる。）

- [ ] **Step 4: unit のパスを確認**

Run: `PYTEST plane/tests/unit/services/test_weekend_working_days.py`
Expected: PASS（既存の `test_patch_target_date_recalculates` 相当も含め全件 — 稼働日着地レンジは従来どおり round-trip する）

- [ ] **Step 5: 失敗する contract テストを書く**

`test_issue_working_day_duration.py` の `TestIssueWorkingDayDuration` に追加:

```python
    def test_patch_weekend_target_keeps_date_and_clears_duration(
        self, session_client, workspace, project_with_member
    ):
        project, _state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-01-05",
            target_date="2026-01-09",
            planned_duration_working_days=5,
        )

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"target_date": "2026-01-11"},  # Sunday
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2026-01-11"  # user's date untouched
        assert issue.planned_duration_working_days is None

    def test_patch_multi_year_target_clears_duration_instead_of_overflowing(
        self, session_client, workspace, project_with_member
    ):
        project, _state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-01-05",
            target_date="2026-01-09",
            planned_duration_working_days=5,
        )

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"target_date": "2027-06-01"},  # 367 working days
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2027-06-01"
        assert issue.planned_duration_working_days is None
```

- [ ] **Step 6: contract のパスを確認**

Run: `PYTEST plane/tests/contract/app/test_issue_working_day_duration.py`
Expected: PASS（Step 3 実装済みのため即 PASS でよい — serializer と bulk endpoint は同じ `normalize_working_day_schedule` を通る）

- [ ] **Step 7: コミット**

```bash
git add apps/api/plane/app/services/weekend_working_days.py \
        apps/api/plane/tests/unit/services/test_weekend_working_days.py \
        apps/api/plane/tests/contract/app/test_issue_working_day_duration.py
git commit -m "fix: keep duration-managed schedules round-trip consistent on target edits"
```

---

### Task 3: バグ③ — propagation 後方ウォークの金曜スナップ

後方伝播で duration 管理 predecessor の必要 target が土日に落ちるとき、直前の金曜へスナップして duration を維持する（`target <= required_target` 制約はより早い金曜でも満たされる）。前方伝播は `add_working_days` が常に稼働日を返すため変更不要。

**Files:**

- Modify: `apps/api/plane/app/services/timeline_propagation/scheduling.py`
- Modify: `apps/api/plane/app/services/timeline_propagation/propagation.py`（`_walk_backward` 内、`required_target = ...` 付近）
- Test: `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py`

**Interfaces:**

- Consumes: Task 1 の `latest_working_day_on_or_before`
- Produces: `scheduling.working_day_target_on_or_before(target: date) -> date`（Task 4 の TS ミラーが同じ意味論を写す）

- [ ] **Step 1: 失敗するテストを書く**

`test_propagation.py` の `TestWorkingDayDurationPropagation` クラスに追加（既存の `_make_scheduled` / `_make_load_result` / `_make_adjacency` / `_make_intent` / `_make_versions` をそのまま使う）:

```python
    def test_backward_weekend_required_target_snaps_to_friday_for_duration_item(self):
        proj = uuid4()
        a = uuid4()
        b = uuid4()
        items = {
            a: _make_scheduled(
                a,
                proj,
                start=date(2026, 1, 12),
                target=date(2026, 1, 16),
                planned_duration_working_days=5,
            ),
            b: _make_scheduled(b, proj, start=date(2026, 1, 19), target=date(2026, 1, 23)),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b}}))
        intent = _make_intent(
            b,
            original_start=date(2026, 1, 19),
            original_target=date(2026, 1, 23),
            requested_start=date(2026, 1, 12),
            requested_target=date(2026, 1, 16),
        )

        result = propagate_move(graph, items, intent, _make_versions(b))

        assert result.is_success
        assert len(result.updates) == 2
        a_update = result.updates[1]
        assert a_update.id == a
        # required_target = Jan 11 (Sunday) → snapped to Friday Jan 9;
        # start derived from the stored working-day duration, so the triple
        # round-trips: add_working_days(Jan 5, 5) == Jan 9.
        assert a_update.target_date == date(2026, 1, 9)
        assert a_update.start_date == date(2026, 1, 5)
        assert a_update.planned_duration_working_days == 5
```

- [ ] **Step 2: 失敗を確認**

Run: `PYTEST plane/tests/unit/services/timeline_propagation/test_propagation.py -k backward_weekend`
Expected: FAIL — `target_date == date(2026, 1, 11)`（日曜のまま保存される現行動作）

- [ ] **Step 3: 実装**

`scheduling.py` — `start_for_working_duration` の直後に追加（import 行の `add_working_days, subtract_working_days` に `latest_working_day_on_or_before` を追加）:

```python
def working_day_target_on_or_before(target: date) -> date:
    """Snap a weekend-landing target to the closest earlier working day."""
    return latest_working_day_on_or_before(target)
```

`propagation.py` — `.scheduling` からの import に `working_day_target_on_or_before` を追加し、`_walk_backward` の該当部を書き換え:

```python
            required_target = previous_valid_target(min(visited_succ_starts))
            new_target = min(pred.target_date, required_target)
            shift_days = (pred.target_date - new_target).days

            if shift_days == 0:
                continue  # frontier-stop

            if pred.planned_duration_working_days is not None:
                # Working-day durations only round-trip through working-day
                # targets; pulling back to Friday still satisfies
                # `target <= required_target`.
                new_target = working_day_target_on_or_before(new_target)
                shift_days = (pred.target_date - new_target).days

            new_start = _start_before_target_shift(pred, new_target, shift_days)
```

（変更は `if pred.planned_duration_working_days is not None:` ブロックの挿入のみ。スナップは「引き戻しが必要なとき」だけ走る — shift 0 で早期 continue した既存挙動は変えない。）

- [ ] **Step 4: パスを確認**

Run: `PYTEST plane/tests/unit/services/timeline_propagation/test_propagation.py`
Expected: PASS（既存の後方テスト `test_duration_managed_predecessor_preserves_working_duration_when_pulled_left` は required_target が木曜=稼働日でスナップ不発のため影響なし）

- [ ] **Step 5: コミット**

```bash
git add apps/api/plane/app/services/timeline_propagation/scheduling.py \
        apps/api/plane/app/services/timeline_propagation/propagation.py \
        apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py
git commit -m "fix: snap weekend-landing propagation targets to Friday for duration items"
```

---

### Task 4: preview.ts の週末スナップミラー + TS テスト増強

サーバ（Task 3）と同じスナップを TS プレビューの後方ウォークに実装し、欠落していた後方ウォーク・週末開始・duration マージのテストを足す（レビュー欠落ランク 5, 6, 11 の TS 側）。

**Files:**

- Modify: `packages/utils/src/timeline-propagation/preview.ts`（`computeLoadedPreview` の leftward 分岐 + ヘルパー追加）
- Test: `packages/utils/src/timeline-propagation/__tests__/preview.test.ts`

**Interfaces:**

- Consumes: 既存の `_isWeekend(value: string): boolean`、`_subtractWorkingDays(target: string, duration: number): string | null`、`addDaysToDate`、`renderFormattedPayloadDate`
- Produces: `_latestWorkingDayOnOrBefore(value: string): string | null`（ファイル内 private）。Python `latest_working_day_on_or_before` と同じ意味論。

- [ ] **Step 1: 失敗するテストを書く**

`preview.test.ts` の `describe("computeLoadedPreview ...")` 内に追加:

```ts
it("backward: duration-managed predecessor derives start via working days (Python parity)", () => {
  const items_by_id: Record<string, LoadedWorkItem> = {
    "wi-A": {
      id: "wi-A",
      start_date: "2026-05-07",
      target_date: "2026-05-08",
      planned_duration_working_days: 2,
    },
    "wi-B": { id: "wi-B", start_date: "2026-05-11", target_date: "2026-05-12" },
  };
  const edges: LoadedGraphEdge[] = [{ predecessor_id: "wi-A", successor_id: "wi-B" }];

  const preview = computeLoadedPreview(edges, items_by_id, {
    id: "wi-B",
    original_start_date: "2026-05-11",
    original_target_date: "2026-05-12",
    requested_start_date: "2026-05-08",
    requested_target_date: "2026-05-09",
  });

  // Mirrors test_duration_managed_predecessor_preserves_working_duration_when_pulled_left.
  expect(preview.get("wi-A")).toEqual({ start_date: "2026-05-06", target_date: "2026-05-07" });
});

it("backward: weekend required target snaps to Friday for duration-managed predecessor", () => {
  const items_by_id: Record<string, LoadedWorkItem> = {
    "wi-A": {
      id: "wi-A",
      start_date: "2026-01-12",
      target_date: "2026-01-16",
      planned_duration_working_days: 5,
    },
    "wi-B": { id: "wi-B", start_date: "2026-01-19", target_date: "2026-01-23" },
  };
  const edges: LoadedGraphEdge[] = [{ predecessor_id: "wi-A", successor_id: "wi-B" }];

  const preview = computeLoadedPreview(edges, items_by_id, {
    id: "wi-B",
    original_start_date: "2026-01-19",
    original_target_date: "2026-01-23",
    requested_start_date: "2026-01-12",
    requested_target_date: "2026-01-16",
  });

  // Mirrors test_backward_weekend_required_target_snaps_to_friday_for_duration_item:
  // candidate target Jan 11 (Sun) → Friday Jan 9; start = subtract 5 working days.
  expect(preview.get("wi-A")).toEqual({ start_date: "2026-01-05", target_date: "2026-01-09" });
});

it("dragged: weekend requested start derives target from next Monday", () => {
  const items_by_id: Record<string, LoadedWorkItem> = {
    "wi-A": {
      id: "wi-A",
      start_date: "2026-01-05",
      target_date: "2026-01-05",
      planned_duration_working_days: 1,
    },
  };

  const preview = computeLoadedPreview([], items_by_id, {
    id: "wi-A",
    original_start_date: "2026-01-05",
    original_target_date: "2026-01-05",
    requested_start_date: "2026-01-10", // Saturday
    requested_target_date: "2026-01-10",
  });

  expect(preview.get("wi-A")).toEqual({ start_date: "2026-01-10", target_date: "2026-01-12" });
});
```

`describe("applyServerWorkItems ...")` 内に追加（既存 TEST-21 テストの `current` 構築スタイルを踏襲）:

```ts
it("merges planned_duration_working_days only when the server row carries the key", () => {
  const current = {
    "wi-A": {
      id: "wi-A",
      start_date: "2026-05-04",
      target_date: "2026-05-08",
      planned_duration_working_days: 5,
      updated_at: "2026-05-04T00:00:00Z",
    },
  };

  const withKey = applyServerWorkItems(current, [
    {
      id: "wi-A",
      start_date: "2026-05-07",
      target_date: "2026-05-13",
      planned_duration_working_days: 4,
      updated_at: "2026-05-05T00:00:00Z",
    },
  ]);
  expect(withKey["wi-A"].planned_duration_working_days).toBe(4);

  const withoutKey = applyServerWorkItems(current, [
    {
      id: "wi-A",
      start_date: "2026-05-07",
      target_date: "2026-05-13",
      updated_at: "2026-05-05T00:00:00Z",
    },
  ] as never);
  expect(withoutKey["wi-A"].planned_duration_working_days).toBe(5);
  expect(withoutKey["wi-A"].start_date).toBe("2026-05-07");
});
```

（`as never` は `TTimelinePropagationWorkItem` が duration キーを必須にしている場合の型回避。optional なら外すこと。）

- [ ] **Step 2: 失敗を確認**

Run: `pnpm --filter=@plane/utils test`
Expected: 週末スナップテストのみ FAIL — `target_date: "2026-01-11"`（日曜のまま)。他の新テスト3件は既存実装で PASS する（パリティの固定が目的）。

- [ ] **Step 3: 実装**

`preview.ts` — `_isWeekend` の直後にヘルパー追加:

```ts
function _latestWorkingDayOnOrBefore(value: string): string | null {
  let current = value;
  while (_isWeekend(current)) {
    const prev = renderFormattedPayloadDate(addDaysToDate(current, -1));
    if (!prev) return null;
    current = prev;
  }
  return current;
}
```

`computeLoadedPreview` の leftward 分岐を書き換え（`// No violation? leave it alone.` 以降）:

```ts
// No violation? leave it alone.
if (pred.target_date <= candidateTargetStr) continue;

// Working-day durations only round-trip through working-day targets —
// mirror the server's Friday snap (scheduling.working_day_target_on_or_before).
const effectiveTargetStr =
  pred.planned_duration_working_days != null ? _latestWorkingDayOnOrBefore(candidateTargetStr) : candidateTargetStr;
if (!effectiveTargetStr) continue;

const newStartStr =
  pred.planned_duration_working_days != null
    ? _subtractWorkingDays(effectiveTargetStr, pred.planned_duration_working_days)
    : _subtractCalendarDurationStart(pred, effectiveTargetStr);
if (!newStartStr) continue;

result.set(pred.id, { start_date: newStartStr, target_date: effectiveTargetStr });
```

（違反判定はスナップ前の candidate で行う — Python 側の「shift 0 なら continue、その後スナップ」と同じ順序。）

- [ ] **Step 4: パスを確認**

Run: `pnpm --filter=@plane/utils test`
Expected: PASS（既存12件 + 新4件 = 16件）

- [ ] **Step 5: コミット**

```bash
git add packages/utils/src/timeline-propagation/preview.ts \
        packages/utils/src/timeline-propagation/__tests__/preview.test.ts
git commit -m "fix: mirror weekend target snap in timeline preview backward walk"
```

---

### Task 5: バグ② — bulk 経路に落ちる move の防御（フロント）

`BaseGanttRoot.updateBlockDates` の else 分岐（bulk エンドポイント行き）に move が落ちた場合、duration 管理ブロックは `target_date` を送らない。サーバの既存ルール「start 編集は duration 保持で target 導出」（仕様 Mutation Rule 2）にそのまま乗る。

**Files:**

- Modify: `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx:190-199`（else 分岐）

**Interfaces:**

- Consumes: `issueTimelineStore.blocksMap[id].data`（`TIssue` 由来、`planned_duration_working_days` を含む)、`context.dragDirection`
- Produces: なし（送信ペイロードの変形のみ）

- [ ] **Step 1: 実装**

else 分岐の `await issues.updateIssueDates(...)` の直前に挿入し、呼び出しを `sanitizedUpdates` に差し替え:

```ts
      } else {
        // D-01b: resize / half-block / multi-row — unchanged path (verbatim).
        // A move that falls through here would read as a target edit on the
        // bulk endpoint and silently recalculate the stored working-day
        // duration — send start-only so the server derives target from the
        // stored duration instead (Mutation Rule 2).
        const sanitizedUpdates =
          context.dragDirection === "move"
            ? updates.map((update) => {
                // Only full-range payloads are converted. A target-only
                // half-block (duration stored without start_date is allowed
                // by spec) must pass through untouched — stripping its
                // target_date would empty the schedule patch and turn the
                // move into a silent no-op on the server.
                if (!update.start_date || !update.target_date) return update;
                const blockData = issueTimelineStore.blocksMap[update.id]?.data as
                  | { planned_duration_working_days?: number | null }
                  | undefined;
                if (blockData?.planned_duration_working_days == null) return update;
                const { target_date: _targetDate, ...startOnly } = update;
                return startOnly;
              })
            : updates;
        await issues.updateIssueDates(workspaceSlug.toString(), sanitizedUpdates, projectId.toString()).catch(() => {
```

（既存の `.catch(...)` 以降は変更なし。propagation 経路（isMove=true 側）は両端日付が必要なので触らない。）

- [ ] **Step 2: 型チェック**

Run: `pnpm check:types`
Expected: PASS（`apps/web` にユニットハーネスは無い — 意味論の固定は Task 6 の contract テストが担う）

- [ ] **Step 3: コミット**

```bash
git add apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx
git commit -m "fix: send start-only bulk updates for duration-managed gantt moves"
```

---

### Task 6: IssueBulkUpdateDateEndpoint の contract テスト（欠落ランク1）

このブランチで全面書き換えされた bulk エンドポイントの意味論を固定する: start-only は move（duration 保持)、両端は resize（duration 再計算)、週末着地は duration=None、不正 duration は 400、レスポンスは `issues` 配列。

**Files:**

- Create: `apps/api/plane/tests/contract/app/test_issue_bulk_update_dates.py`

**Interfaces:**

- Consumes: conftest の `session_client` / `workspace` / `create_user` fixture、`plane.tests.factories`、URL name `project-issue-dates`（`test_timeline_propagation.py` の既存 smoke テストと同じ）

- [ ] **Step 1: テストファイルを作成**

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import Mock

import pytest
from django.urls import reverse
from rest_framework import status

from plane.tests.factories import IssueFactory, ProjectFactory, ProjectMemberFactory

pytestmark = [pytest.mark.contract, pytest.mark.django_db]


@pytest.fixture
def project_with_member(workspace, create_user):
    project = ProjectFactory.create(workspace=workspace, created_by=create_user)
    ProjectMemberFactory.create(project=project, member=create_user, role=20)
    return project


@pytest.fixture(autouse=True)
def _mute_issue_side_effect_tasks(monkeypatch):
    monkeypatch.setattr("plane.app.views.issue.base.issue_activity.delay", Mock())


def _dates_url(workspace_slug, project_id):
    return reverse("project-issue-dates", kwargs={"slug": workspace_slug, "project_id": project_id})


class TestIssueBulkUpdateDates:
    def test_start_only_update_preserves_duration_and_derives_target(
        self, session_client, workspace, project_with_member
    ):
        """Move semantics (Mutation Rule 2): start edit keeps the stored duration."""
        issue = IssueFactory.create(
            project=project_with_member,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.post(
            _dates_url(workspace.slug, project_with_member.id),
            {"updates": [{"id": str(issue.id), "start_date": "2026-05-07"}]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.start_date.isoformat() == "2026-05-07"
        assert issue.target_date.isoformat() == "2026-05-13"  # Thu + 5 working days = Wed
        assert issue.planned_duration_working_days == 5

    def test_both_dates_update_recalculates_duration(self, session_client, workspace, project_with_member):
        """Resize semantics (Mutation Rule 3): explicit range wins, duration follows."""
        issue = IssueFactory.create(
            project=project_with_member,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.post(
            _dates_url(workspace.slug, project_with_member.id),
            {
                "updates": [
                    {"id": str(issue.id), "start_date": "2026-05-07", "target_date": "2026-05-11"}
                ]
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.planned_duration_working_days == 3  # Thu, Fri, Mon

    def test_weekend_landing_target_clears_duration(self, session_client, workspace, project_with_member):
        issue = IssueFactory.create(
            project=project_with_member,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.post(
            _dates_url(workspace.slug, project_with_member.id),
            {
                "updates": [
                    {"id": str(issue.id), "start_date": "2026-05-05", "target_date": "2026-05-10"}
                ]
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2026-05-10"  # Sunday kept as-is
        assert issue.planned_duration_working_days is None

    def test_invalid_duration_returns_400(self, session_client, workspace, project_with_member):
        issue = IssueFactory.create(
            project=project_with_member,
            start_date="2026-05-04",
            target_date="2026-05-08",
        )

        response = session_client.post(
            _dates_url(workspace.slug, project_with_member.id),
            {"updates": [{"id": str(issue.id), "planned_duration_working_days": 0}]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_response_carries_normalized_issue_rows(self, session_client, workspace, project_with_member):
        issue = IssueFactory.create(
            project=project_with_member,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.post(
            _dates_url(workspace.slug, project_with_member.id),
            {"updates": [{"id": str(issue.id), "start_date": "2026-05-07"}]},
            format="json",
        )

        body = response.json()
        assert set(body.keys()) == {"message", "issues"}
        assert body["issues"] == [
            {
                "id": str(issue.id),
                "start_date": "2026-05-07",
                "target_date": "2026-05-13",
                "planned_duration_working_days": 5,
            }
        ]
```

- [ ] **Step 2: 旧契約を固定している既存回帰テストを新契約に更新**

本ブランチは bulk レスポンスを意図的に `{"message"}` → `{"message", "issues"}` へ変更したため、旧契約の回帰テスト `test_timeline_propagation.py::test_existing_bulk_update_endpoint_unchanged` は broker のある環境で必ず失敗する。テストメソッド全体（`def test_existing_bulk_update_endpoint_unchanged` から assertion まで）を以下に置き換える:

```python
    def test_bulk_update_endpoint_contract(self, session_client, workspace, create_user, monkeypatch):
        """API-11 structural smoke against ``IssueBulkUpdateDateEndpoint``.

        The weekend working-day duration branch intentionally extended the
        response from ``{"message"}`` to ``{"message", "issues"}`` so the
        frontend can merge server-normalized schedules. Full duration
        semantics live in ``test_issue_bulk_update_dates.py``; this remains
        a structural smoke only.
        """
        monkeypatch.setattr("plane.app.views.issue.base.issue_activity.delay", Mock())
        # Set up a project + issue + project membership so the existing
        # @allow_permission([ROLE.ADMIN, ROLE.MEMBER]) decorator passes.
        project = ProjectFactory.create(workspace=workspace, created_by=create_user)
        ProjectMemberFactory.create(
            project=project, member=create_user, role=20
        )  # ADMIN
        issue = IssueFactory.create(project=project)

        url = reverse(
            "project-issue-dates",
            kwargs={"slug": workspace.slug, "project_id": project.id},
        )
        payload = {
            "updates": [
                {
                    "id": str(issue.id),
                    "start_date": "2026-06-01",
                    "target_date": "2026-06-05",
                }
            ]
        }

        response = session_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert set(body.keys()) == {"message", "issues"}
        assert len(body["issues"]) == 1
        assert set(body["issues"][0].keys()) == {
            "id",
            "start_date",
            "target_date",
            "planned_duration_working_days",
        }
```

ファイル冒頭に `from unittest.mock import Mock` が無ければ追加する。日付の中身は assert しない（構造スモークの位置づけを維持し、曜日依存を持ち込まない）。

- [ ] **Step 3: パスを確認**

Run: `PYTEST plane/tests/contract/app/test_issue_bulk_update_dates.py plane/tests/contract/app/test_timeline_propagation.py`
Expected: PASS 全件（新規5件＋更新済み smoke 含む既存分。broker 不要になったので既知失敗ゼロ）

- [ ] **Step 4: コミット**

```bash
git add apps/api/plane/tests/contract/app/test_issue_bulk_update_dates.py \
        apps/api/plane/tests/contract/app/test_timeline_propagation.py
git commit -m "test: pin bulk date update endpoint duration semantics and new response contract"
```

---

### Task 7: PATCH 契約回帰 + Mutation Rules + 境界値の contract/unit テスト（欠落ランク2, 3, 4, 7）

**Files:**

- Test: `apps/api/plane/tests/unit/services/test_weekend_working_days.py`
- Test: `apps/api/plane/tests/contract/app/test_issue_working_day_duration.py`

**Interfaces:**

- Consumes: Task 2 までの実装（挙動追加はなし。すべて既存挙動の固定）

- [ ] **Step 1: unit — duration 優先ルール（仕様 Mutation Rule 4）**

`TestWeekendWorkingDays` に追加:

```python
    def test_duration_wins_over_explicit_target_in_same_patch(self):
        start, target, duration = normalize_working_day_schedule(
            current_start_date=date(2026, 5, 4),
            current_target_date=date(2026, 5, 8),
            current_planned_duration_working_days=5,
            target_date=date(2026, 5, 6),
            planned_duration_working_days=2,
        )
        assert (start, target, duration) == (date(2026, 5, 4), date(2026, 5, 5), 2)
```

- [ ] **Step 2: contract — 4本追加**

`TestIssueWorkingDayDuration` に追加:

```python
    def test_patch_non_schedule_field_returns_schedule_body(
        self, session_client, workspace, project_with_member
    ):
        """204→200 契約変更の回帰テスト: schedule 以外の PATCH でも同じ body 形状を返す。"""
        project, _state = project_with_member
        issue = IssueFactory.create(project=project)

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"name": "Renamed issue"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert set(body.keys()) == {
            "id",
            "start_date",
            "target_date",
            "planned_duration_working_days",
            "updated_at",
        }
        assert body["id"] == str(issue.id)

    def test_patch_duration_and_target_together_duration_wins(
        self, session_client, workspace, project_with_member
    ):
        project, _state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"target_date": "2026-05-06", "planned_duration_working_days": 2},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2026-05-05"  # derived from duration, not the sent target
        assert issue.planned_duration_working_days == 2

    def test_patch_start_date_rederives_target_from_stored_duration(
        self, session_client, workspace, project_with_member
    ):
        """Mutation Rule 2 の API 経路（部分更新）検証。"""
        project, _state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"start_date": "2026-05-07"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2026-05-13"
        assert issue.planned_duration_working_days == 5

    def test_duration_validation_boundaries(self, session_client, workspace, project_with_member):
        project, state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-05-04",
            target_date="2026-05-08",
        )
        url = _issue_detail_url(workspace.slug, project.id, issue.id)

        for bad in (367, -1, "abc"):
            response = session_client.patch(url, {"planned_duration_working_days": bad}, format="json")
            assert response.status_code == status.HTTP_400_BAD_REQUEST, bad

        # 仕様: "A duration without start_date is allowed but cannot derive target_date."
        response = session_client.post(
            _issue_collection_url(workspace.slug, project.id),
            {"name": "No-start duration", "state_id": str(state.id), "planned_duration_working_days": 3},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert body["planned_duration_working_days"] == 3
        assert body["target_date"] is None

    def test_all_weekend_range_stores_dates_without_duration(
        self, session_client, workspace, project_with_member
    ):
        project, _state = project_with_member
        issue = IssueFactory.create(project=project, start_date="2026-05-09")  # Saturday

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"target_date": "2026-05-10"},  # Sunday — zero working days in range
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2026-05-10"
        assert issue.planned_duration_working_days is None
```

- [ ] **Step 3: パスを確認**

Run: `PYTEST plane/tests/unit/services/test_weekend_working_days.py plane/tests/contract/app/test_issue_working_day_duration.py`
Expected: PASS 全件（すべて既存挙動＋Task 2 ガードの固定。FAIL は実装回帰のシグナル）

- [ ] **Step 4: コミット**

```bash
git add apps/api/plane/tests/unit/services/test_weekend_working_days.py \
        apps/api/plane/tests/contract/app/test_issue_working_day_duration.py
git commit -m "test: pin PATCH contract, mutation rules, and duration boundaries"
```

---

### Task 8: propagation の混在チェーン + resize バイパスの unit テスト（欠落ランク8, 10）

**Files:**

- Test: `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py`

**Interfaces:**

- Consumes: Task 3 までの実装（挙動追加なし）

- [ ] **Step 1: テストを追加**

`TestWorkingDayDurationPropagation` に追加:

```python
    def test_duration_dragged_pushes_calendar_day_successor_unchanged_semantics(self):
        """混在チェーン: duration 無し successor は従来のカレンダー日シフトを維持する。"""
        proj = uuid4()
        a = uuid4()
        b = uuid4()
        items = {
            a: _make_scheduled(
                a,
                proj,
                start=date(2026, 5, 6),
                target=date(2026, 5, 7),
                planned_duration_working_days=2,
            ),
            # B spans Fri→Mon (weekend inside) and is NOT duration-managed.
            b: _make_scheduled(b, proj, start=date(2026, 5, 8), target=date(2026, 5, 11)),
        }
        graph = _make_load_result(_make_adjacency(successors={a: {b}}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 6),
            original_target=date(2026, 5, 7),
            requested_start=date(2026, 5, 7),
            requested_target=date(2026, 5, 8),
        )

        result = propagate_move(graph, items, intent, _make_versions(a))

        assert result.is_success
        b_update = result.updates[1]
        # Calendar-day behavior: +1 day shift, weekend-start allowed, span preserved.
        assert b_update.start_date == date(2026, 5, 9)   # Saturday
        assert b_update.target_date == date(2026, 5, 12)
        assert b_update.planned_duration_working_days is None

    def test_duration_dragged_ignores_requested_target_range_change(self):
        """range_duration ガードのバイパス仕様を固定: duration 管理 dragged の
        requested_target は無視され、常に stored duration から導出される。"""
        proj = uuid4()
        a = uuid4()
        items = {
            a: _make_scheduled(
                a,
                proj,
                start=date(2026, 5, 7),
                target=date(2026, 5, 8),
                planned_duration_working_days=2,
            ),
        }
        graph = _make_load_result(_make_adjacency(nodes={a}))
        intent = _make_intent(
            a,
            original_start=date(2026, 5, 7),
            original_target=date(2026, 5, 8),
            requested_start=date(2026, 5, 7),
            requested_target=date(2026, 5, 13),  # range grew — would fail for non-duration items
        )

        result = propagate_move(graph, items, intent, _make_versions(a))

        assert result.is_success
        assert result.updates[0].start_date == date(2026, 5, 7)
        assert result.updates[0].target_date == date(2026, 5, 8)  # derived, request ignored
```

- [ ] **Step 2: パスを確認**

Run: `PYTEST plane/tests/unit/services/timeline_propagation/test_propagation.py`
Expected: PASS（既存挙動の固定。2本目が FAIL する場合は intent の delta 計算が 0 でない可能性を疑う — requested_start は original と同一にしてある）

- [ ] **Step 3: コミット**

```bash
git add apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py
git commit -m "test: pin mixed-chain and resize-bypass propagation semantics"
```

---

### Task 9: 依存線 Tier 1 — 最小ハンドル長で直線退化を解消

`buildBezierPath` の制御点オフセットに下限を入れる。確定線（`dependency-paths.tsx`）とドラッグ中プレビュー（`draggable-dependency-path.tsx`）の両方が同じ関数を通るため一括で効く。

**Files:**

- Modify: `apps/web/ce/components/gantt-chart/dependency/build-bezier.ts:16-25`

**Interfaces:**

- Produces: `buildBezierPath` の挙動変更（シグネチャ不変）。Task 10 の `buildElbowPath` と同居する。

- [ ] **Step 1: 実装**

`buildBezierPath` を書き換え:

```ts
/**
 * Minimum horizontal control-handle length (px). Without a floor the curve
 * collapses onto its chord — a bare diagonal line — whenever the two anchors
 * are horizontally close (adjacent tasks), which is exactly the ugly case.
 */
const MIN_HANDLE = 24;

export function buildBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const horizontalOffset = Math.max(Math.abs(x2 - x1) / 2, MIN_HANDLE);
  // Horizontally extend the control points; leaving y untouched preserves
  // the smooth S-curve between two different rows.
  const cx1 = x1 + horizontalOffset;
  const cy1 = y1;
  const cx2 = x2 - horizontalOffset;
  const cy2 = y2;
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}
```

- [ ] **Step 2: 型チェック**

Run: `pnpm check:types`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add apps/web/ce/components/gantt-chart/dependency/build-bezier.ts
git commit -m "fix: floor bezier handle length so close dependency lines keep their curve"
```

---

### Task 10: 依存線 Tier 2 — 角丸エルボー配線（確定線）

確定済み依存線を直交エルボー（最小スタブ＋角丸、後続が手前なら回り込み）に切り替える。ドラッグ中プレビューは Tier 1 のベジェのまま。折れ線→角丸パス変換を汎用ヘルパーにし、セグメントが短い退化ケースは半径クランプで吸収する。

**Files:**

- Modify: `apps/web/ce/components/gantt-chart/dependency/build-bezier.ts`（`buildElbowPath` 追加）
- Modify: `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx:183`

**Interfaces:**

- Produces: `buildElbowPath(x1: number, y1: number, x2: number, y2: number): string`
- 削除ボタン位置の前提: 弦の中点 `(midX, midY)` は前方分岐（midX の縦セグメント上）でも回り込み分岐（midY の横セグメント上）でもパス上に載るため、`dependency-paths.tsx:184-185` の `midX`/`midY` 計算は**変更不要**。

- [ ] **Step 1: `buildElbowPath` を実装**

`build-bezier.ts` 末尾に追加:

```ts
type TPoint = { x: number; y: number };

/** Horizontal stub each block edge keeps before the path may turn (px). */
const ELBOW_STUB = 20;
/** Corner radius (px); clamped per-corner to half the shorter adjacent segment. */
const ELBOW_RADIUS = 8;

/**
 * Convert an orthogonal polyline into an SVG path with rounded corners.
 * Each corner radius is clamped to half of both adjacent segments so short
 * or degenerate segments never produce self-overlapping arcs.
 */
function roundedPathFromPolyline(points: TPoint[], radius: number): string {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const corner = points[i];
    const next = points[i + 1];
    const inLen = Math.hypot(corner.x - prev.x, corner.y - prev.y);
    const outLen = Math.hypot(next.x - corner.x, next.y - corner.y);
    if (inLen === 0 || outLen === 0) continue;
    const r = Math.min(radius, inLen / 2, outLen / 2);
    const inUx = (corner.x - prev.x) / inLen;
    const inUy = (corner.y - prev.y) / inLen;
    const outUx = (next.x - corner.x) / outLen;
    const outUy = (next.y - corner.y) / outLen;
    d += ` L ${corner.x - inUx * r} ${corner.y - inUy * r}`;
    d += ` Q ${corner.x} ${corner.y} ${corner.x + outUx * r} ${corner.y + outUy * r}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Orthogonal elbow route between a source block's right edge and a target
 * block's left edge. Forward links with enough gap drop vertically at the
 * horizontal midpoint; tight or backward links route out, across the row
 * midline, and back in — the classic Gantt wrap-around.
 */
export function buildElbowPath(x1: number, y1: number, x2: number, y2: number): string {
  if (x2 - x1 >= 2 * ELBOW_STUB) {
    const midX = (x1 + x2) / 2;
    return roundedPathFromPolyline(
      [
        { x: x1, y: y1 },
        { x: midX, y: y1 },
        { x: midX, y: y2 },
        { x: x2, y: y2 },
      ],
      ELBOW_RADIUS
    );
  }
  const outX = x1 + ELBOW_STUB;
  const inX = x2 - ELBOW_STUB;
  const midY = (y1 + y2) / 2;
  return roundedPathFromPolyline(
    [
      { x: x1, y: y1 },
      { x: outX, y: y1 },
      { x: outX, y: midY },
      { x: inX, y: midY },
      { x: inX, y: y2 },
      { x: x2, y: y2 },
    ],
    ELBOW_RADIUS
  );
}
```

- [ ] **Step 2: 確定線をエルボーに切り替え**

`dependency-paths.tsx` — import を変更:

```ts
import { buildElbowPath } from "./build-bezier";
```

183行目を変更:

```ts
const d = buildElbowPath(line.x1, line.y1, line.x2, line.y2);
```

（`buildBezierPath` の import が未使用になる場合は import から外す。`draggable-dependency-path.tsx` は変更しない。）

- [ ] **Step 3: 型チェック**

Run: `pnpm check:types`
Expected: PASS

- [ ] **Step 4: 目視検証（手動）**

`docker compose -f docker-compose-local.yml up` + `pnpm dev` でガントビューを開き、次の4配置で線を確認する:

1. 前方・十分な間隔 → 中点で縦に降りるエルボー
2. 前方・近接（翌日開始） → 回り込みルート（直線にならないこと）
3. 後続が手前（日付コンフリクト・赤線） → 回り込みルート
4. 線ホバー → × ボタンが線上に出る（弦中点がパス上に載る性質の確認）

ドラッグ中のプレビュー線は S 字ベジェのまま（Tier 1 の下限が効いて近接でも潰れない）ことも確認。

- [ ] **Step 5: コミット**

```bash
git add apps/web/ce/components/gantt-chart/dependency/build-bezier.ts \
        apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx
git commit -m "feat: route confirmed dependency lines as rounded elbows"
```

---

### Task 11: 総合検証

**Files:** 変更なし（検証のみ）

- [ ] **Step 1: バックエンド全対象テスト**

Run:

```bash
PYTEST plane/tests/unit/services/test_weekend_working_days.py \
       plane/tests/unit/services/timeline_propagation/test_propagation.py \
       plane/tests/contract/app/test_issue_working_day_duration.py \
       plane/tests/contract/app/test_issue_bulk_update_dates.py \
       plane/tests/contract/app/test_timeline_propagation.py
```

Expected: **全件 PASS、既知失敗ゼロ**（旧契約 smoke テストは Task 6 Step 2 で新契約に更新済み・broker 不要）。

- [ ] **Step 2: フロントテストと CI ゲート**

Run: `pnpm --filter=@plane/utils test && pnpm check`
Expected: vitest 16件 PASS、`check:format` / `check:lint` / `check:types` PASS。

- [ ] **Step 3: 後片付け**

```bash
docker rm -f plane-test-pg
rm -f /tmp/plane-base-req.txt /tmp/plane-test-req.txt
```

---

## 対応表（レビュー指摘 → タスク）

| レビュー指摘                             | タスク                                                   |
| ---------------------------------------- | -------------------------------------------------------- |
| バグ① 再計算 duration の上限抜け         | Task 2                                                   |
| バグ② move の経路間不整合（潜在）        | Task 5（防御）+ Task 6（意味論固定）                     |
| バグ③ 週末 target の三つ組不整合         | Task 2（直接編集）+ Task 3（BE 伝播）+ Task 4（FE 伝播） |
| 欠落ランク1 bulk endpoint contract       | Task 6                                                   |
| 欠落ランク2 PATCH 204→200 回帰           | Task 7                                                   |
| 欠落ランク3 duration 優先ルール          | Task 7                                                   |
| 欠落ランク4 start PATCH で target 再導出 | Task 7                                                   |
| 欠落ランク5 TS 後方ウォーク              | Task 4                                                   |
| 欠落ランク6 伝播の週末着地               | Task 3 + Task 4                                          |
| 欠落ランク7 バリデーション境界           | Task 7                                                   |
| 欠落ランク8 resize バイパス              | Task 8                                                   |
| 欠落ランク10 混在チェーン                | Task 8                                                   |
| 欠落ランク11 applyServerWorkItems マージ | Task 4                                                   |
| 依存線の直線退化                         | Task 9（Tier 1）+ Task 10（Tier 2）                      |

**スコープ外（別ブランチ推奨）:** e2e 2本（欠落ランク9, 12 — 環境の手動セットアップが必要、ユーザー決定で除外)、duration 入力 UI の3ファイル重複の共通化（Standards 指摘 — 挙動変更を伴わないリファクタなので本修正と混ぜない)、伝播 contract テスト（`test_timeline_propagation.py` への planned_duration 永続化検証 — Task 6 が bulk 側を固定するため優先度降格）。
