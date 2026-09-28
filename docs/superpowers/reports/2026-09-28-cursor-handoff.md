# Team Operations Dashboard — handoff cho Cursor

Ngày 2026-09-28. Đây là trạng thái kiểm tra tại lúc bàn giao, không phải chứng nhận hoàn tất. Nhiệm vụ gốc: thay dashboard hiện tại bằng màn hình vận hành theo ảnh tham chiếu, nhìn được **từng thành viên đang làm gì**, việc tồn đọng/quá hạn/bị chặn, tiến độ dự án và việc cần chú ý. Sau khi code và kiểm chứng đạt, đưa thay đổi vào checkout chính mà không làm mất các sửa đang có của người dùng.

## Vị trí và nguồn sự thật

- Worktree/branch: `/Users/tui/orca/workspaces/plane/team-operations-dashboard`, `ba0f3/team-operations-dashboard`; HEAD lúc bàn giao `5d327dd319e22f5f1e568dedd916f43fa88b3b14`.
- Checkout chính `/Users/tui/Repos/plane` vẫn ở `5d7b1bb48b` và **chưa merge**. Nó có nhiều sửa chưa commit về Wiki, Gantt, calendar, API tokens và docs. Tuyệt đối không reset/stash/ghi đè chúng tùy tiện. Bản sao diff/hash trước merge ở `/tmp/plane-dashboard-premerge/` (kiểm tra lại trước khi dùng).
- Spec: `docs/superpowers/specs/2026-09-27-workspace-dashboard-redesign.md`; plan: `docs/superpowers/plans/2026-09-27-team-operations-dashboard.md`; ảnh: `docs/superpowers/specs/assets/2026-09-27-dashboard-reference.png`. Spec/plan là yêu cầu, không phải bằng chứng đã đạt.
- Báo cáo hai worker cũ ở `docs/superpowers/reports/2026-09-27-team-dashboard-{backend,frontend}.md` có những kết luận “final” cũ; phải kiểm chứng lại bằng code/test/browser hiện tại. `BACKEND_RETRY_REMAINING.md` là danh sách tồn đọng lịch sử, một số mục đã sửa; cũng không coi nó là trạng thái hiện hành.

## Đã có trong branch

- Route `/{workspaceSlug}/dashboards` dùng Operations Shell, có Overview, Projects, Workload, Timeline, Insights; scope Team/My work, kỳ thời gian, bộ lọc, Refresh, KPI/drilldown. Overview đã render dữ liệu QA thật 240 work items từ API tại 3100/8100 ngày 27/9. Có preview tải công việc của 5 người và mục Needs attention. Màn Workload có code bảng theo nhân viên: open, started, overdue, blocked, due soon, completed in period, cùng unassigned/inactive. **Chưa có bằng chứng browser rằng bảng này đã tải xong và thao tác đúng sau bản sửa cuối.**
- API dashboard mới, selectors/snapshot, endpoints overview/attention/items/workload/projects/timeline, seed và benchmark QA, hợp đồng ở `packages/types`/`packages/shared-state`.
- `5d327dd319` và `12f78c05f2` là hai commit frontend cuối, xử lý abort/scope/Refresh. Cần tự chạy lại test và kiểm UI; log cũ không chứng minh HEAD hiện tại.
- Working tree còn `M apps/api/plane/tests/contract/app/test_dashboard_operations_app.py` và `?? BACKEND_RETRY_REMAINING.md`. Giữ lại, đọc diff rồi quyết định; đây là WIP worker trước, không được vô tình bỏ.

## Thiếu/bất định phải giải quyết trước khi nói “xong”

1. Xác minh contract backend và fix bug có thể thấy ngay: `apps/api/plane/analytics/dashboard/snapshot.py` so `actual_isolation == "repeatable_read"`, trong khi PostgreSQL `SHOW transaction_isolation` trả `repeatable read`. Test nested RR/read-only cần chứng minh đường này. Worker backend gặp lỗi `TestSnapshotIsolation::test_snapshot_context_manager_yields_and_restores`; rerun sau HEAD và chẩn đoán cụ thể. Test workload preview từng fail do kỳ vọng fixture; sửa test WIP chưa được xác nhận độc lập. Không tin dòng “252 passed” nếu cùng run còn một fail.
2. Rerun web dashboard tests ở HEAD. Lần chạy độc lập trước hai commit cuối: `tests/dashboards/v3/workspace-dashboard-v3.smoke.test.tsx` 9 pass/2 fail (deferred stale response, My work payload). Worker nói đã sửa sau đó, chưa có kiểm chứng độc lập. Typecheck cũ có 26 diagnostics y hệt baseline checkout chính; phải so tập lỗi, không chỉ đếm số.
3. Dùng browser **Orca** với QA profile cô lập để xác minh bảng Workload thật, bộ lọc Team/My work/project/date, Refresh, KPI/drilldown, Projects/Timeline/Insights, dark/light/responsive. Không đăng nhập QA bằng browser profile `default`: trước đây cookie localhost đụng phiên người dùng và gây logout. QA profile từng tạo: `2d219a53-0fc8-4885-9566-a65e0ff1e7c2`; cần kiểm tra runtime/tab còn sống. Không reset seed hay chạm dữ liệu chính.
4. Kiểm screenshot so với ảnh tham chiếu: Overview hiện render 6 KPI, progress, delivery, top projects, preview, attention nhưng vẫn có copy nội bộ kiểu “Five-state groups”, “Per-member cells”, và chưa có cycles/deadlines/project breakdown trên Overview theo spec. Đừng gọi bản này “lung linh/đạt spec” chỉ vì có data. Ưu tiên đội/việc tồn đọng dễ quét và hành động được; tránh tiếp tục nhồi bar chart.
5. Merge local chỉ khi biết chính xác kết quả và rủi ro. Giữ nguyên sửa chưa commit ở checkout chính. Trước đây 5 file docs ở checkout chính giống hệt branch và đã backup, nhưng kiểm lại vì trạng thái có thể đổi. Sau merge, kiểm dashboard ở app chính và API thực chạy; test QA trên branch không chứng minh code đã tới màn người dùng.

## Môi trường/test đã dùng

- QA web `http://localhost:3100` và QA API `http://localhost:8100`, stack `plane-dashboard-qa` qua `docker-compose-dashboard-qa.yml`; workspace seed `acme-qa`. Trạng thái runtime có thể đã đổi, kiểm trước khi dùng. Main web/API `3000/8000` là môi trường người dùng, không dùng QA login/profile ở đây.
- Backend test stack `plane-dashboard-ops-test` theo `docker-compose-test.yml`. Các test backend `transaction=True` tốn vài phút; chọn focused test phù hợp rồi tổng hợp evidence. Benchmark 10k issues/20 projects/50 members từng có p95 attention ~2.3s, worker sau đó báo tối ưu còn ~122ms nhưng cần xác minh số liệu/điều kiện đo. Không đánh đồng warm với cold, HTTP 200 với section OK.
- Log cũ chỉ để đối chiếu: `/tmp/plane-dashboard-independent-api.log` 237 pass ở HEAD cũ `e35561b6e1`; `/tmp/plane-dashboard-independent-web.log` 207 pass ở HEAD cũ; `/tmp/dashboard-merge-smoke.log` 9 pass/2 fail trước commit sửa cuối; `/tmp/plane-dashboard-main-types-baseline.log` 26 diagnostics; `/tmp/plane-dashboard-frontend-logs/check-types-9.log` trùng 26 diagnostics ở lần kiểm trước.

## Cách bàn giao mong muốn

Nhận quyền chỉnh **worktree này**, không mở worker OpenCode mới. Đầu tiên kiểm `git status`, diff WIP và test focused; báo người dùng ngắn gọn lỗi nào thực tế còn mở. Hoàn thiện theo spec, kiểm bằng Orca browser và chứng cứ thật, rồi merge local an toàn vào checkout chính nếu đạt. Không push/deploy. Nếu vẫn chưa đạt, ghi rõ không merge và lý do cụ thể; tránh báo hoàn tất từ báo cáo cũ. Tiết kiệm quota: không chạy full-suite lặp lại hoặc mở vòng sửa rộng khi focused checks đã chỉ ra lỗi.
