# Plane BIH

## Đây là gì

Fork Plane CE v1.4.2 của BIH (AGPL-3.0, source công khai tại https://github.com/ethanbih/plane), thêm **phụ thuộc giữa các việc + tự lùi lịch** trên Gantt. Nhánh `bih/v1.4.2`. Từ đợt 5b có **1 migration** (`0123_bih_schedule_lag_holidays`, chỉ thêm cột/bảng).

## Tính năng

Chỉ áp cho Gantt work item của project (không áp cho epic). Hai nút trên thanh Gantt, nhớ trong localStorage:

- **Phụ thuộc** (`bih-gantt-show-dependencies`): vẽ mũi tên Finish-to-Start từ quan hệ `blocked_by`/`blocking` cùng project. Mũi tên đỏ khi việc sau bắt đầu không muộn hơn ngày kết thúc việc trước. Quan hệ tới việc **ở project khác** (chỉ project người dùng là thành viên) hiện thành mũi tên cụt nét đứt ở mép thanh, kèm nhãn mã việc (`PRJ-12`; nhiều việc cùng phía nối bằng ` · `), rê chuột xem tên. Đợt 7: mũi tên cụt **tô đỏ khi vi phạm** (ngày việc bên kia lấy từ `issues-detail`, chỉ cho project người dùng là thành viên), **bấm chọn rồi xoá** (× hoặc Delete, có Hoàn tác; chỉ khi role ≥ MEMBER ở project bên kia), và **tạo mới**: kéo tay nắm mép thả vào chỗ trống ⇒ hộp tìm việc (`search-issues`, chỉ hiện việc của project role ≥ MEMBER khác project hiện tại). Kéo-nối chạy cả bằng cảm ứng (pointer events; tay nắm luôn hiện và vùng chạm lớn ở thiết bị `pointer: coarse`).
- **Tự lùi lịch** (`bih-gantt-auto-schedule`, mặc định TẮT): khi bật, đổi ngày một việc sẽ tính việc sau phải lùi bao nhiêu, hiện hộp xem trước (ngày cũ → mới), người dùng chọn "Lùi N việc sau" hoặc "Chỉ đổi việc này".

Thao tác (cần quyền ADMIN/MEMBER của project):

- Kéo nắm ở **mép phải** (việc này làm trước) hoặc **mép trái** (việc này làm sau) sang thanh khác để nối. Khi kéo, mọi thanh hợp lệ được viền xanh, thanh không hợp lệ bị mờ, và một nhãn cạnh con trỏ giải thích (tự nối, đã nối, quan hệ khác, vòng lặp). Bấm mũi tên rồi × / Delete để xoá (toast "Hoàn tác"). Chỉ dùng chuột: màn cảm ứng xem được mũi tên nhưng chưa kéo-nối được.
- Tự lùi lịch chạy khi kéo/resize thanh trên Gantt **và** khi đổi Start/Due date ở sidebar màn chi tiết việc.

## Cách lập lịch hoạt động

- Chỉ Finish-to-Start. Ngày là chuỗi `YYYY-MM-DD`, tính bằng UTC, không đụng múi giờ.
- Việc sau bắt đầu sớm nhất = ngày kết thúc **muộn nhất** của mọi việc trước + 1 + **lag** (lag theo từng relation `blocked_by`, có thể âm, -365..365). Không bao giờ dời việc trước. Giữ nguyên thời lượng. Việc chỉ có ngày kết thúc (mốc) thì dời ngày kết thúc.
- **Chế độ tính** (mỗi người chọn, nhớ trong localStorage `bih-gantt-schedule-mode`): "Ngày lịch" (mặc định, như cũ) hoặc "Ngày làm việc": bỏ ngày không làm việc và ngày lễ của workspace; ngày bắt đầu nhích tới ngày làm việc kế tiếp, lag và thời lượng đếm theo ngày làm việc.
- **Tự kéo việc sau sớm lại** (`bih-gantt-pull-earlier`, mặc định TẮT): khi bật, việc sau được đưa về sớm nhất cho phép (kể cả sớm hơn hiện tại); khi tắt chỉ đẩy về sau. Không kéo sớm nếu có việc trước thiếu ngày kết thúc.
- Lan truyền theo thứ tự topo qua toàn chuỗi. Việc không có ngày: bỏ qua và cảnh báo. Việc trước không có ngày kết thúc: cảnh báo.
- Có vòng lặp: không lập lịch, chỉ lưu việc đang sửa.
- Ví dụ: A 1–3/11, B 4–6/11, C 7–9/11, A kết thúc dời thành 5/11 ⇒ B 6–8/11, C 9–11/11.

Lõi lịch có hai bản cùng quy tắc, cùng bộ ca test: TypeScript (`apps/web/core/components/gantt-chart/dependencies/scheduling.ts`, dùng cho xem trước) và Python (`apps/api/plane/utils/gantt_schedule.py`, dùng ở máy chủ).

## Backend (đợt 4, sửa `apps/api`)

- `POST …/issues/<id>/issue-relation/` với `blocked_by`/`blocking`: từ chối tự nối và vòng (400, kèm đường vòng); khoá workspace trong lúc tạo để hai người không nối thành vòng cùng lúc. Trùng vẫn bỏ qua im lặng như Plane gốc.
- `POST …/remove-relation/`: không có quan hệ ⇒ 404 (trước là 500).
- **Mới** `POST workspaces/<slug>/projects/<id>/issue-schedule/` (`IssueScheduleEndpoint`): máy chủ tự tính lại cascade, lưu atomic trong một transaction, chỉ trong project, quyền ADMIN/MEMBER. Body: `change`, `include_successors`, `dry_run`, `expected`. `expected` khác kết quả tính ⇒ 409 (có người sửa trước, kèm bản mới để xem lại). Vòng ⇒ 409. Tối đa 2000 việc phía sau.
- `issue-dates` (có sẵn): kiểm tra hết trước khi ghi, không còn để lại activity khi trả 400.
- Đợt 5b: `issue-schedule` nhận thêm `mode` (`calendar`|`working`) và `pull_earlier`; lịch làm việc theo **workspace**: `GET/PATCH workspaces/<slug>/schedule-settings/` (thành viên đọc, ADMIN sửa ngày làm việc ISO 1=T2..7=CN), `POST …/schedule-settings/holidays/` (thêm 1 ngày lễ hoặc `{preset:"vn_fixed", year}`: 1/1, 30/4, 1/5, 1/9, 2/9; Tết và Giỗ Tổ nhập tay), `DELETE …/holidays/<id>/`; lag: `GET/POST projects/<id>/issue-lags/` (chỉ lag ≠ 0). Engine Python/TS cùng quy tắc, cùng bộ ca test.
- Đợt 6 (khác project): **mới** `POST workspaces/<slug>/issue-schedule/` (`WorkspaceIssueScheduleEndpoint`, `bih_schedule.py`), cùng body/đáp ứng, việc cần đổi xác định theo `change.id`. Quy tắc quyền: chỉ project mà người dùng là thành viên **đang hoạt động** tham gia (project khác vô hình: không thấy, không tính, không báo). Ghi chỉ vào project role ≥ MEMBER; việc đổi ở project guest ⇒ 403, ở project không thành viên ⇒ 404. Việc ở project **guest** là cố định: không bao giờ bị dời, cạnh vào nó bị bỏ khỏi engine (không lan tiếp qua nó), nhưng ngày của nó vẫn ràng buộc việc sau nó; khi tiền bối thực sự dời, trả cảnh báo `{"id","reason":"no_permission"}`. Đáp ứng thêm `issues` = `{id: {name, sequence_id, project_id, project_identifier}}` cho mọi id trong `updates`/`warnings` để web ghi nhãn `PRJ-12`. Khoá: hàng workspace trước, rồi các việc ghi được `ORDER BY id FOR UPDATE` trong một truy vấn (không deadlock giữa project). Giữ 2000 việc phía sau, tính chung toàn workspace. Endpoint project cũ giữ nguyên. Không migration.
- Frontend gọi `issue-schedule` cấp workspace trước; 404 không kèm `message` (route thiếu, backend cũ) ⇒ nhớ và dùng endpoint project; 404 rồi vẫn thì quay về `issue-dates`. Frontend (đợt 3) gặp 404 (backend gốc) tự quay về `issue-dates` như đợt 3, nên rollback image backend vẫn chạy.

## Build image

Web (~2 phút):

```sh
docker build -f apps/web/Dockerfile.web -t bih/plane-frontend:v1.4.2-bih.<N> .
```

Backend (api, worker, beat, migrator dùng chung một image):

```sh
docker build -f apps/api/Dockerfile.api -t bih/plane-backend:v1.4.2-bih.<N> apps/api
```

Các image còn lại giữ `makeplane/*:v1.4.2`. Xoá `.pnpm-store/` ở gốc fork (nếu có) trước khi build web. Source trên VM ở `/opt/bih-plane-src` (thuộc root ⇒ git cần `sudo`). Thời gian đo: web ~1 phút 47 giây trên VM srv-AI, ~2 phút 15 giây trên máy dev.

## Dùng trong BIH-OPS

- Web: đặt `PLANE_FRONTEND_IMAGE=bih/plane-frontend:v1.4.2-bih.<N>` trong env Plane rồi `docker compose … up -d --no-deps plane-web`. Rollback: bỏ biến này, chạy lại lệnh.
- Backend: biến `PLANE_BACKEND_IMAGE` (đã có trong compose BIH-OPS), đổi cả 4 service backend cùng lúc. **Từ backend `bih.2` có migration 0123**: sao lưu DB trước, chạy `plane-migrator` (phải thấy "Applying db.0123…"), rồi mới đổi api/worker/beat.
- Rollback: backend cũ chạy được với DB đã migrate (chỉ thêm cột/bảng, cột `lag_days` có default). Web mới + backend cũ: các endpoint mới 404 ⇒ tự dùng ngày lịch, lag 0, ẩn mục lịch workspace. Web cũ + backend mới: chạy như đợt 4.
- Luôn dùng `--no-deps` khi đổi image một service để không khởi động lại db/api.
- Bản web mới có thể chạy với backend gốc (tự lùi dùng `issue-dates`, không có chặn vòng ở máy chủ). Backend mới chạy được với web gốc.

## Nâng Plane

`git fetch upstream --tags`, tạo nhánh `bih/<tag-mới>` từ tag mới. Rebase: `git rebase --onto <tag-mới> v1.4.2 bih/v1.4.2`. Sửa conflict, kiểm tra, build lại **cả** web **và** backend cùng phiên bản nền, rồi mới đổi `APP_RELEASE`. Chạy `packages/i18n` build: file `tsdown.config.ts` của i18n đã sửa để đóng gói kèm `src/locales` (thiếu thì bản build mất bản dịch).

File upstream bị sửa (dễ conflict khi nâng): web — `gantt-chart/{root,chart/root,chart/main-content,chart/header,helpers/draggable}.tsx`, `issue-layouts/gantt/use-gantt-dependencies.ts`, `issue-layouts/gantt/base-gantt-root.tsx`, `issue-detail/sidebar.tsx`, `store/timeline/base-timeline.store.ts`, `services/issue/issue.service.ts`, `packages/i18n/tsdown.config.ts`; api — `app/views/issue/{base,relation}.py`, `app/views/__init__.py`, `app/urls/{issue,workspace}.py`, `db/models/{__init__,issue}.py`. Code mới nằm ở file riêng: `gantt-chart/dependencies/`, `issue-layouts/gantt/use-gantt-dependencies.ts`, `issue-detail/use-detail-auto-schedule.tsx`, `plane/utils/gantt_schedule.py`, `components/bih-schedule/`, `app/views/issue/bih_schedule.py`, `db/models/bih_schedule.py`, migration `0123`.

## Kiểm tra

Web (đặt `pnpm_config_verify_deps_before_run=false` nếu pnpm đòi cài lại):

```sh
node --test apps/web/core/components/gantt-chart/dependencies/*.test.mjs
pnpm --filter web check:types
pnpm --filter web check:lint
```

Backend cần Django + Postgres + Redis, chạy trong Docker (image từ `apps/api/requirements/test.txt`), đặt `DATABASE_URL`, `POSTGRES_*`, `REDIS_URL`, `APP_BASE_URL`, `SECRET_KEY`:

```sh
python -m pytest plane/tests/contract/app/test_gantt_dependencies.py plane/tests/unit/utils/test_gantt_schedule.py
```

Engine Python thuần chạy được không cần Django: `python -m unittest discover -s plane/tests/unit/utils -p "test_gantt_schedule.py"` (từ `apps/api`; lệnh theo đường dẫn module lỗi vì `plane/__init__.py` import Celery).

- Đợt 7 (relation khác project, `relation.py`): `forbidden_projects` — tạo/xoá relation cần role ADMIN/MEMBER đang hoạt động ở **mọi** project có việc liên quan (kể cả project URL, kiểm lại sau khoá workspace; việc đã xoá mềm vẫn tính); sai ⇒ 403. Việc ở URL phải là việc sống của project URL, không thì 404. `issues-detail` (expand `issue_relation`/`issue_related`) thêm `start_date`/`target_date` của việc bên kia **chỉ khi** người dùng là thành viên project đó (`IssueListDetailSerializer(member_project_ids=…)`). Không migration. Hành vi mới: Guest/không thành viên ở project bên kia không nối được, cả từ màn chi tiết việc Plane gốc.

## Giới hạn đã biết

- Đợt 8 còn lại: lịch sử hoạt động của việc (`history/`) chỉ được ẩn mã việc relation khi việc bên kia không đọc được (khuyết điểm cũ của Plane gốc cho tên trong comment/activity khác chưa rà hết). Hoàn tác xoá phụ thuộc khác project giờ kiểm quyền cả hai project trước khi gửi.

- Chỉ Finish-to-Start. Lịch làm việc + ngày lễ sửa trong hộp "Cài đặt lập lịch" trên thanh Gantt (không có trang riêng ở cài đặt workspace). Ngày lễ trùng ngày không làm việc tự nghỉ bù sang ngày làm việc kế (đợt 8). Preset VN có Tết (giao thừa + mùng 1–4) và Giỗ Tổ cho 2026–2030; ngày nghỉ thật do nhà nước công bố từng năm nên admin vẫn phải đối chiếu và sửa tay.
- Phần sửa lịch workspace (quyền ADMIN) mới được test bằng test backend, chưa bấm thử trên trình duyệt.
- Khác project (đợt 6): lùi lịch và mũi tên cụt có kiểm quyền như trên, nhưng tạo/xoá phụ thuộc khác project đã làm ở đợt 7 (xem Backend đợt 7). Lag của relation khác project: đã có endpoint `POST/GET workspaces/<slug>/issue-lags/` (đợt 8) nhưng chưa có ô nhập trên mũi tên cụt (endpoint `issue-lags` chỉ trong project). Việc ở project người dùng không thuộc vô hình, nên việc sau nó không được dời và không có cảnh báo. `expected` bị bỏ qua khi `include_successors=false` (giống endpoint project). Khi tải 100 việc đầu, việc ngoài hàng đang hiển thị không có mũi tên cụt.
- Đã đo local với 606 việc + 300 phụ thuộc (Chrome): cuộn ~11 ms/bước, đổi zoom <1,6 s, heap ~75 MB; mọi thanh đều nằm trong DOM (Plane gốc không ảo hoá hàng). Gantt việc không có nhóm thu gọn. Tải tối đa 10.000 việc để vẽ mũi tên.
- Màn hẹp (375px): thanh công cụ cuộn ngang để thấy nút "Phụ thuộc"/"Tự lùi lịch".
- Nếu tạo relation ở màn chi tiết việc với backend gốc, vẫn có thể tạo vòng; lõi lịch phát hiện và dừng.
- Đường quay về `issue-dates` (backend cũ không có `issue-schedule`) giờ dùng `updateIssue` của store (ném lỗi) nên việc sau không được lưu nếu lưu việc đang sửa thất bại.
- Tạo/xoá phụ thuộc khoá workspace trong thời gian ngắn.
- Test tự động (đợt 7): logic thả/dựng mũi tên + hiệu năng 2000 việc ở `dependencies/drag-logic.test.mjs` (Node thuần, không dựng DOM; không có test trình duyệt tự động vì không thêm dependency); quyền khác project ở `test_gantt_cross_project.py`; sửa đồng thời 2 người dùng ở `test_gantt_concurrency.py` (PostgreSQL thật, nhiều luồng). Đã thử tay local (2 project member + 1 guest + 1 không thành viên): xem trước, lưu, cảnh báo guest, rollback backend cũ; chưa thử chế độ sáng.

## Đợt 8 (không migration)

- **Bảo mật**: related issue mà người dùng không đọc được (không là thành viên project còn sống, hoặc Guest bị hạn chế và không phải người tạo) chỉ trả `id`/`project_id`/`relation_type` ở mọi `expand=issue_relation,issue_related` (`serializers/bih_relation_visibility.py`, dùng trong `DynamicBaseSerializer` và `IssueListDetailSerializer`); `GET …/issue-relation/` bỏ hẳn các việc đó; lịch sử relation (`history/?activity_type=issue-property`) xoá mã việc. Review Codex tìm ra 3 lỗ này.
- `expected` kèm `include_successors=false` ⇒ 400. Nghỉ bù ngày lễ (Python + TS, cùng ca test, tuyến tính). Preset lễ VN có Tết + Giỗ Tổ 2026–2030 (bảng âm lịch `LUNAR_HOLIDAYS` trong `bih_schedule.py`).
- **Mới** `GET/POST workspaces/<slug>/issue-lags/` (`WorkspaceIssueLagsEndpoint`): lag relation khác project; đọc/ghi cần đọc được cả hai đầu, ghi cần Member/Admin ở project của **việc sau** (lấy từ `relation.issue.project_id`, không tin `relation.project`).
- Web: hoàn tác sau khi nối (cùng/khác project); mũi tên cụt có mã việc cho phụ thuộc tới hàng chưa tải/đang lọc (chỉ đọc); test render thật `dependency-layer.render.test.mjs` (bundle `.tsx` bằng esbuild có sẵn trong cây pnpm + `react-dom/server`, không thêm dependency; chưa test tương tác con trỏ).
- Chưa làm: SS/FF/SF. (Thanh chồng nhau, ô nhập lag khác project, test con trỏ: xem Đợt 10.)

## Đợt 10 (không migration, chỉ web)

- **Test con trỏ thật**: `dependency-layer.pointer.test.mjs` chạy `GanttDependencyLayer` trong jsdom (devDependency mới `jsdom` ở `apps/web`, Huy đã duyệt) với sự kiện mouse/pointer/keyboard.
- **Thanh chồng nhau**: `buildArrows` gán "làn" (0–2) theo từng predecessor cùng điểm cuối; `getDependencyPath(from, to, rowHeight, lane)` dịch chỗ gấp khúc 3 px mỗi làn (làn 0 giữ nguyên đường cũ). Cùng predecessor tỏa nhiều việc sau thì chung làn.
- **Lag khác project**: chọn mũi tên cụt (có quyền sửa) ⇒ menu có ô "Trễ (ngày)"; nhãn mũi tên cụt hiện `+Nd`. Web đọc `GET workspaces/<slug>/issue-lags/` khi có mũi tên cụt, ghi `POST` cùng URL (403 ⇒ toast cần Member ở project của việc sau). Hook `useGanttDependencies` có `setExternalLag`.
- `PATCH` lạ ở sidebar: chưa tái hiện sau 2 lần bắt mạng local; xem báo cáo đối chiếu.
- Thử tay local (web `bih.13`): đặt/đọc lag `OTHR-1 +3d` (đã xác nhận trong DB, đã trả về 0); hai tab sửa đồng thời ⇒ 409 "Lịch đã thay đổi — xem lại".

## Rollback đợt 10

Web `bih.12` (đợt 10 chỉ đổi web, không đổi backend/migration).

## Rollback đợt 8

Web `bih.11`/backend `bih.4` (hoặc xoá hai dòng `PLANE_*_IMAGE`). Không migration. Web mới + backend cũ: không hoàn tác được gì mới ngoài các toast, mũi tên cụt vẫn chạy.

## Rollback đợt 7

Web `bih.4`/backend `bih.3` trước đợt 7 (hoặc xoá hai dòng `PLANE_*_IMAGE`). Không migration. Web mới + backend cũ: mũi tên cụt không đỏ (thiếu ngày), tạo khác project không bị kiểm quyền.

## Rollback đợt 6

Đổi lại tag: web `bih.3`, backend `bih.2` (hoặc xoá hai dòng `PLANE_*_IMAGE` trong `plane.env` rồi `up -d --no-deps` các service). Không có migration đợt 6 nên không cần đảo DB. Web mới + backend cũ: lỗi 404 ⇒ tự dùng endpoint project, mũi tên cụt vẫn vẽ (dữ liệu từ expand của Plane).
