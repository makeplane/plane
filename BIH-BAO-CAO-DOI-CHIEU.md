# Báo cáo đối chiếu: Gantt phụ thuộc + tự dời lịch (Plane BIH) so với `Task Plane.txt`

Ngày: 2026-11-03 · Nhánh `bih/v1.4.2` (đã push, commit đợt 10 chưa push) · Prod: web `bih.6`, backend `bih.5` (đợt 10 mới chạy local, web `bih.13`).

**Kết luận: toàn bộ yêu cầu bắt buộc đã làm xong. Đợt 10 (chưa push/deploy) bù nốt hai mục còn thiếu so với đề: test con trỏ thật (jsdom) và đường nối tránh đè khi thanh chồng nhau. Còn lại chỉ là mục không bắt buộc (xem cuối).**

## Phase 1: Khảo sát
| Yêu cầu | Trạng thái |
|---|---|
| Khảo sát repo, Timeline, relation, API, model, quyền, cross-project; có kế hoạch | Xong (đợt 1; ghi trong `BIH.md`) |

## Phase 2: Tạo và hiển thị phụ thuộc
| Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|
| Tay cầm ở hai đầu thanh khi hover | Xong | |
| Kéo thả sang việc khác, đường tạm, tô mục tiêu hợp lệ | Xong | |
| Lưu bằng API Plane có sẵn (`IssueRelation blocked_by`) | Xong | Không thêm bảng |
| Chặn tự nối, trùng, vòng | Xong | Cả frontend lẫn backend |
| Xoá bằng chọn đường nối | Xong | |
| Hoàn tác | Xong | Đợt 8: nút "Hoàn tác" sau khi nối (cùng và khác project) |
| Mũi tên, cập nhật khi cuộn/zoom/kéo, nhóm thu gọn, việc ngoài màn hình | Xong | Đợt 8: hàng chưa tải hoặc bị lọc hiện "mũi tên cụt" có mã việc, chỉ đọc |
| SVG overlay, tránh render thừa | Xong | Test 2000 việc dưới 500 ms |
| Thanh chồng nhau | Xong (đợt 10) | Predecessor khác nhau cùng điểm cuối được tách thành các làn riêng; cùng một predecessor tỏa ra nhiều việc sau vẫn chung làn. Đường quay lại giữa hai hàng lệch tối đa ±3 px |
| Trạng thái: thường, đỏ khi vi phạm, đang chọn, lý do khi không hợp lệ | Xong | |

## Phase 3: Tự dời lịch
| Yêu cầu | Trạng thái |
|---|---|
| FS, giữ độ dài, lan truyền dây chuyền, nhiều việc trước | Xong |
| Không tự dời việc trước; không dời sớm trừ khi bật | Xong |
| Lag cấu hình được | Xong |
| Lịch làm việc, ngày nghỉ, cuối tuần | Xong. Đợt 8: nghỉ bù, Tết, Giỗ Tổ 2026–2030 |
| Thiếu ngày, mốc, việc 0 ngày; ngày thuần không múi giờ | Xong |
| Phát hiện vòng trước khi lập lịch | Xong |
| Cài đặt: tự động ON/OFF, ngày làm việc/ngày lịch, dời sớm, hiện đường | Xong |
| Bản xem trước ngày cũ/mới, xác nhận hoặc huỷ | Xong |

## Phase 4: Backend
| Yêu cầu | Trạng thái |
|---|---|
| Kiểm tra ở backend, service dùng lại (`gantt_schedule.py`) | Xong |
| Atomic, chống đua (khoá dòng, `expected` → 409) | Xong |
| Tôn trọng quyền và project; không tự đổi ngày khác project khi chưa được phép | Xong. Ghi cần quyền ở cả hai project |
| Chống vòng cập nhật vô hạn | Xong |
| Chỉ thêm migration khi cần | Xong. Đợt 8 không có migration |
| Không để lộ việc không có quyền đọc | Xong. Phần thêm ở đợt 8 (relation, expand, lịch sử, Guest hạn chế) |

## Phase 5: Test (10 mục của đề)
| # | Mục | Trạng thái |
|---|---|---|
| 1 | Tạo/xoá phụ thuộc | Có (pytest contract) |
| 2 | Vẽ mũi tên | Có (render test, `dependency-layer.render.test.mjs`) |
| 3 | Tương tác kéo-thả | Có (đợt 10): `dependency-layer.pointer.test.mjs` chạy `GanttDependencyLayer` thật trong jsdom với sự kiện mouse/pointer/Escape (thả lên thanh, tay trái, chạm, thả ra ngoài, tự nối, Escape, pointercancel). Cộng test logic `drag-logic.test.mjs`; đã thử tay. |
| 4 | Chặn vòng | Có |
| 5 | Nhiều việc trước | Có |
| 6 | Dời dây chuyền | Có |
| 7 | Cuối tuần, ngày lễ | Có |
| 8 | Cập nhật đồng thời | Có (`test_gantt_concurrency.py`: 2 người cùng dời, `expected` cũ → 409, không deadlock, vòng đồng thời bị từ chối). Đợt 10: đã thử tay UI hai tab local — tab cũ bấm lưu sau khi tab kia đã lưu ⇒ toast "Lịch đã thay đổi — xem lại" và hộp xem trước tự làm mới. Chưa có test tự động UI. |
| 9 | Quyền khác project | Có |
| 10 | 500+ việc | Có (backend và frontend, chuỗi 500, nạp 2000) |

Kết quả gần nhất (đợt 10): Node 87 pass (+ test con trỏ jsdom), pytest 167 pass, types 0 lỗi, lint 0 lỗi, `makemigrations --check` không đổi; pytest 150 pass, types 0 lỗi, lint 0 lỗi, `makemigrations --check` không đổi.

## Phase 6 và sản phẩm bàn giao
| Hạng mục | Trạng thái |
|---|---|
| Thực hiện từng bước, chạy test/type/lint mỗi lần | Xong |
| Danh sách file đổi, API mới, migration | Xong (`BIH.md`, git log) |
| Hướng dẫn build/deploy Docker | Xong (`BIH.md`) |
| Tài liệu cách lập lịch + giới hạn + rollback | Xong (`BIH.md`, mục "Đợt 8" và "Rollback đợt 8") |
| Không phá tính năng cũ; giữ endpoint cũ để rollback | Xong |

## Còn thiếu hoặc còn mở
1. ~~Test kéo-thả bằng con trỏ thật~~ Xong đợt 10 (jsdom, devDependency `apps/web`).
2. ~~Thanh chồng nhau~~ Xong đợt 10 (làn riêng trong `buildArrows`/`getDependencyPath`).
3. ~~Ô nhập lag cho mũi tên cụt khác project~~ Xong đợt 10: chọn mũi tên cụt ⇒ ô "Trễ (ngày)", nhãn hiện `+Nd`; ghi qua `workspaces/<slug>/issue-lags/`, cần Member ở project của việc sau.
4. `PATCH` lạ trước `POST issue-schedule` ở sidebar: bắt mạng local 2 lần không tái hiện (chỉ thấy `POST` xem trước). Lần đầu có `PATCH` lưu ngày trước khi hiện hộp xem trước (activity ghi 1 lần). Nghi bấm ngày lúc `deps` chưa tải xong ⇒ rơi vào lưu thẳng. Chưa kết luận, cần thêm mẫu.
5. ~~SS/FF/SF~~ Xong đợt 10 (migration 0124, engine Python/TS, chọn loại trên mũi tên). Chưa có ô chọn loại cho mũi tên cụt khác project.
6. Ngày Tết/Giỗ Tổ tính từ bảng âm lịch, cần đối chiếu thông báo nghỉ chính thức từng năm.
7. Test UI đồng thời hai trình duyệt: đã thử tay (xem Phase 5 mục 8), chưa tự động.
