# Báo cáo đối chiếu: Gantt phụ thuộc + tự dời lịch (Plane BIH) so với `Task Plane.txt`

Ngày: 2026-11-03 · Nhánh `bih/v1.4.2` (đã push, commit cuối `9d9cb6508`) · Prod: web `bih.6`, backend `bih.5`.

**Kết luận: toàn bộ yêu cầu bắt buộc đã làm xong và đã deploy. Chưa "xong tuyệt đối": thiếu test tương tác con trỏ cho kéo-thả, và một vài mục hoàn thiện (xem cuối).**

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
| Thanh chồng nhau | **Một phần** | Hiển thị được, chưa tránh đường đè lên nhau |
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
| 3 | Tương tác kéo-thả | **Thiếu phần con trỏ.** Có test logic (`drag-logic.test.mjs`), chưa có test sự kiện con trỏ thật; cần jsdom/Playwright (thêm dependency, phải hỏi Huy). Đã thử tay. |
| 4 | Chặn vòng | Có |
| 5 | Nhiều việc trước | Có |
| 6 | Dời dây chuyền | Có |
| 7 | Cuối tuần, ngày lễ | Có |
| 8 | Cập nhật đồng thời | Có (`test_gantt_concurrency.py`: 2 người cùng dời, `expected` cũ → 409, không deadlock, vòng đồng thời bị từ chối). Chưa có test UI hai trình duyệt. |
| 9 | Quyền khác project | Có |
| 10 | 500+ việc | Có (backend và frontend, chuỗi 500, nạp 2000) |

Kết quả gần nhất: Node 66 pass, pytest 150 pass, types 0 lỗi, lint 0 lỗi, `makemigrations --check` không đổi.

## Phase 6 và sản phẩm bàn giao
| Hạng mục | Trạng thái |
|---|---|
| Thực hiện từng bước, chạy test/type/lint mỗi lần | Xong |
| Danh sách file đổi, API mới, migration | Xong (`BIH.md`, git log) |
| Hướng dẫn build/deploy Docker | Xong (`BIH.md`) |
| Tài liệu cách lập lịch + giới hạn + rollback | Xong (`BIH.md`, mục "Đợt 8" và "Rollback đợt 8") |
| Không phá tính năng cũ; giữ endpoint cũ để rollback | Xong |

## Còn thiếu hoặc còn mở
1. Test kéo-thả bằng con trỏ thật (cần duyệt dependency).
2. Thanh chồng nhau: chưa tránh đường đè.
3. Ô nhập lag cho mũi tên cụt khác project (endpoint `issue-lags` có, chưa có UI).
4. Một `PATCH` lạ trước `POST issue-schedule` ở sidebar, chưa tìm ra nguồn (cần bắt mạng).
5. Chỉ hỗ trợ FS; SS/FF/SF cần migration (đề chỉ yêu cầu FS trước).
6. Ngày Tết/Giỗ Tổ tính từ bảng âm lịch, cần đối chiếu thông báo nghỉ chính thức từng năm.
7. Test UI đồng thời hai trình duyệt chưa làm.
