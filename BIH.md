# Plane BIH

## Đây là gì

Fork Plane CE v1.4.2 của BIH (AGPL-3.0, source công khai tại https://github.com/ethanbih/plane), thêm **phụ thuộc giữa các việc + tự lùi lịch** trên Gantt. Nhánh `bih/v1.4.2`. Từ đợt 5b có **1 migration** (`0123_bih_schedule_lag_holidays`, chỉ thêm cột/bảng).

## Tính năng

Chỉ áp cho Gantt work item của project (không áp cho epic). Hai nút trên thanh Gantt, nhớ trong localStorage:

- **Phụ thuộc** (`bih-gantt-show-dependencies`): vẽ mũi tên Finish-to-Start từ quan hệ `blocked_by`/`blocking` cùng project. Mũi tên đỏ khi việc sau bắt đầu không muộn hơn ngày kết thúc việc trước.
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
- Frontend gọi `issue-schedule`; gặp 404 (backend gốc) tự quay về `issue-dates` như đợt 3, nên rollback image backend vẫn chạy.

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

## Giới hạn đã biết

- Chỉ Finish-to-Start. Lịch làm việc + ngày lễ sửa trong hộp "Cài đặt lập lịch" trên thanh Gantt (không có trang riêng ở cài đặt workspace). Ngày lễ trùng cuối tuần không tự bù; preset VN không có Tết/Giỗ Tổ và ngày liền kề Quốc khánh chỉ ước lượng (1/9) — admin chỉnh tay. Lag/ngày lễ chỉ có ở Gantt và màn chi tiết việc, chưa có ở list.
- Phần sửa lịch workspace (quyền ADMIN) mới được test bằng test backend, chưa bấm thử trên trình duyệt.
- Chỉ trong cùng project; không vẽ, không lùi lịch qua project khác. Relation khác project do Plane gốc cho tạo vẫn không kiểm quyền project bên kia.
- Đã đo local với 606 việc + 300 phụ thuộc (Chrome): cuộn ~11 ms/bước, đổi zoom <1,6 s, heap ~75 MB; mọi thanh đều nằm trong DOM (Plane gốc không ảo hoá hàng). Gantt việc không có nhóm thu gọn. Tải tối đa 10.000 việc để vẽ mũi tên.
- Màn hẹp (375px): thanh công cụ cuộn ngang để thấy nút "Phụ thuộc"/"Tự lùi lịch".
- Nếu tạo relation ở màn chi tiết việc với backend gốc, vẫn có thể tạo vòng; lõi lịch phát hiện và dừng.
- `issueOperations.update` của Plane tự nuốt lỗi: ở đường quay về `issue-dates`, việc sau có thể được lưu dù lưu việc đang sửa thất bại.
- Tạo/xoá phụ thuộc khoá workspace trong thời gian ngắn.
- Chưa có test dựng mũi tên/kéo-nối bằng trình duyệt, chưa có test khác project.
