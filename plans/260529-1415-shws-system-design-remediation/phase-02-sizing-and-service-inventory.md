---
phase: 2
title: Sizing-and-Service-Inventory
status: completed
priority: P1
effort: 0.5d
dependencies: []
---

# Phase 2: Sizing-and-Service-Inventory

## Overview

Sửa các con số sizing sai và bổ sung container thực tế bị bỏ sót. Đối chiếu nguồn chuẩn = `docker-compose.shb.yml` (đã verify): services = `web, admin, space, live, api, worker, beat-worker, migrator, proxy` (+ `plane-redis/plane-mq/plane-minio/plane-db` từ base compose).

## Key Insights (đã verify với code)

- **B1:** `01 §9` và `02 §8` ghi tổng PROD "**12 vCPU / 28 GB**" — SAI. APP 8/16 + DATA 8/16 = **16 vCPU / 32 GB** (`09 §3`, `00 §8` chốt 8/16 mỗi node). Số 12/28 là tàn dư từ sizing cũ trước khi nâng DB lên 8/16.
- **B3:** compose thực có `live` (websocket realtime) + `migrator` (one-shot migrate) — KHÔNG xuất hiện trong bảng tài nguyên `01 §4.1`, `02 §4`. `live` chạy thường trực, tốn RAM/CPU chưa được cấp. Tên thực là `beat-worker` (doc gọi `beat`).
- **B12 (naming):** `01 §3.1` gọi `redis`/`rabbitmq`; compose thực = `plane-redis`/`plane-mq`/`plane-db`/`plane-minio` (có `container_name`). `05 §8.3` đang dùng tên đúng.

## Requirements

- Tổng sizing PROD nhất quán = 16 vCPU / 32 GB ở mọi nơi.
- Bảng container PROD/UAT phản ánh đúng compose: thêm `live`, `migrator`; đổi `beat`→`beat-worker`; thống nhất tên `plane-*`.
- RAM/CPU budget cộng lại ≤ 16 GB / 8 vCPU mỗi node sau khi thêm `live`.

## Architecture — phân bổ lại APP node (gợi ý, tinh chỉnh khi viết)

Thêm `live` vào bảng `01 §4.1`. Đề xuất rút từ headroom OS/api để vẫn ~15.5 GB:

| Container          | CPU         | RAM limit  | Ghi chú                                           |
| ------------------ | ----------- | ---------- | ------------------------------------------------- |
| live               | 0.3         | 256–384 MB | Node.js websocket (realtime) — **mới**            |
| migrator           | (ephemeral) | —          | chạy lúc deploy rồi exit; không tính steady-state |
| (các service khác) | giữ nguyên  | giữ nguyên | rà lại tổng                                       |

> migrator: ghi chú "one-shot, chạy migrate khi deploy, không chiếm tài nguyên thường trực" — liên kết `06 §15` (migration workflow).

## Related Code Files

- **Modify:** `01-architecture-prod.md`
  - §3.1 bảng container APP: thêm `live`, `migrator`; đổi `beat`→`beat-worker`; thống nhất `plane-redis`/`plane-rabbitmq`(?) — chọn tên khớp compose (`plane-mq` cho RabbitMQ, `plane-redis`).
  - §4.1 bảng tài nguyên: thêm dòng `live`; cộng lại tổng; chú thích migrator.
  - §9 bảng so sánh: `12 vCPU / 28 GB` → `16 vCPU / 32 GB`; giữ lập luận "tăng cost 1 VM" nhưng số đúng.
- **Modify:** `02-architecture-test-uat.md`
  - §3.2 bảng container: thêm `live`, `migrator`; `beat`→`beat-worker`.
  - §4 bảng tài nguyên UAT: thêm `live`; cộng lại.
  - §8 bảng so sánh: `PROD 12 vCPU / 28 GB` → `16 vCPU / 32 GB`.
- **Modify:** `09-capacity-planning.md` §3.2 (cơ sở sizing APP — thêm `live` vào liệt kê RAM); §3 bảng nếu có tổng.
- **Modify (naming nhỏ):** `05-security-design.md` §8.3 đã đúng tên — đảm bảo không nhắc `plane-db` trên APP node (PROD APP không có DB).

## Implementation Steps

1. Grep `12 vCPU`, `28 GB`, `28GB`, `12vCPU` trong 11 file → sửa hết về 16/32.
2. Thêm `live` + `migrator` + đổi `beat-worker` vào `01 §3.1`, `02 §3.2`.
3. Thêm dòng `live` vào bảng tài nguyên `01 §4.1`, `02 §4`; cân lại tổng ≤ 16 GB; ghi chú migrator ephemeral.
4. Đồng bộ tên container `plane-redis`/`plane-mq`/`plane-minio`/`plane-db` toàn bộ 01/02 (khớp compose + `05 §8.3`).
5. Cập nhật `09 §3.2` liệt kê RAM gồm `live`.
6. Verify: tổng vCPU/RAM khớp `09 §3`; grep tên container cũ (`\bredis\b`,`\brabbitmq\b` như service-name độc lập) còn sót.

## Todo List

- [ ] Sửa 12/28 → 16/32 (01 §9, 02 §8, mọi nơi)
- [ ] Thêm live + migrator + beat-worker (01 §3.1, 02 §3.2)
- [ ] Bảng tài nguyên thêm live, cân tổng (01 §4.1, 02 §4)
- [ ] Đồng bộ tên plane-\* container
- [ ] Cập nhật 09 §3.2

## Success Criteria

- [ ] Không còn "12 vCPU / 28 GB" trong bất kỳ file nào; tổng PROD = 16/32 nhất quán.
- [ ] `live` có dòng tài nguyên; `migrator` được ghi chú; `beat-worker` đúng tên.
- [ ] Tên container trong docs khớp 100% compose thực tế.

## Risk Assessment

- Thêm `live` có thể đẩy tổng RAM APP vượt 16 GB nếu giữ nguyên các limit cũ → phải rút headroom (OS/api) hoặc note "RAM là ràng buộc, theo dõi, nâng 24 GB nếu cần" (đã có ở `01 §10`).

## Security Considerations

- Không ảnh hưởng bảo mật; thuần chỉnh số/inventory.

## Next Steps

- Phase 3 dùng inventory container đúng để rà cổng exporter/firewall.
