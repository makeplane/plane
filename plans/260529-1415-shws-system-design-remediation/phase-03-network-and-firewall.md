---
phase: 3
title: Network-and-Firewall
status: completed
priority: P1
effort: 0.5-1d
dependencies:
  - 1
  - 2
---

# Phase 3: Network-and-Firewall

## Overview

Sửa các mâu thuẫn trong `04-network-design.md` (chủ yếu) + cross-ref `01/03/05/08`: hướng kết nối replication, cổng exporter thiếu, danh tính scraper, MinIO TLS, IP placeholder.

## Key Insights

- **B2 (🔴) hướng firewall replication ngược:** PostgreSQL streaming = **standby (DR) chủ động kết nối primary (PROD)**. `pg_hba` primary (`06 §10.1`) cho phép từ IP DR ⇒ xác nhận pull. Nhưng:
  - `04 §4.4` (shwsdb1dr inbound): "`shwsdb1p → shwsdb1dr:5432` WAL replication target (normal)" — SAI (đó là push).
  - `04 §5.2` (shwsdb1p outbound): "`shwsdb1p → shwsdb1dr:5432` Streaming replication ship" — SAI hướng.
  - `04 §4.2` (shwsdb1p inbound): "`shwsdb1dr → shwsdb1p:5432` (reverse/failback)" — đúng hướng nhưng **sai nhãn** (đây là luồng CHÍNH, không phải failback).
  - `04 §5.3` (shwsdb1dr outbound): "Pull-based streaming" — ĐÚNG.
  - Gốc lỗi: lẫn lộn _hướng dữ liệu_ (WAL chảy PROD→DR, vẽ trong diagram) với _hướng khởi tạo TCP_ (DR→PROD). Firewall theo hướng TCP.
- **B5 cổng exporter thiếu:** `08 §2` có cadvisor:8080, nginx:9113, redis:9121, rabbitmq:15692; `04 §4.1` chỉ mở 9100 + 9323. 9323 (docker daemon metrics) không khớp cadvisor (8080).
- **B9 scraper identity / monitoring stack:** `08` chốt "dùng Prometheus/Grafana bank sẵn"; `01 §13` còn để open Q "VM monitoring riêng?". `04` coi `shws-mon` là scraper; nếu scraper là Prometheus bank thì source IP khác ⇒ firewall sai.
- **B8 MinIO HTTP vs TLS:** `01 §2` "9000 HTTP"; `04 §4.2/§8.2` TLS; nếu TLS thì thiếu cert MinIO (`04 §8.1`, `05 §5.3`).
- **B12 IP placeholder:** `01` dùng `10.X.Y`; các file khác dùng `10.94.x.x` cụ thể.

## Requirements

- Mọi rule firewall replication phản ánh đúng hướng TCP pull (DR→PROD bình thường; PROD→DR chỉ khi failback, ghi rõ "chỉ failback").
- Port matrix `04` đầy đủ mọi exporter `08` khai báo, từ đúng source IP (scraper thực).
- MinIO chốt HTTP **hoặc** TLS nhất quán + cert nếu TLS.
- Placeholder IP nhất quán toàn bộ docs.

## Architecture — hướng replication đúng (đưa vào 04)

```
Bình thường (streaming):
  shwsdb1dr (standby) ──TCP:5432──► shwsdb1p (primary)   [DR khởi tạo, pull]
    → PROD inbound 5432 allow FROM 10.94.20.11 (DR)
    → DR   outbound 5432 allow TO   10.94.10.11 (PROD)

Failback (sau khi PROD lên lại, PROD tạm làm standby):
  shwsdb1p ──TCP:5432──► shwsdb1dr                       [chỉ giai đoạn failback]
    → đánh dấu rõ "FAILBACK ONLY"
```

## Related Code Files

- **Modify:** `04-network-design.md`
  - §4.2 shwsdb1p inbound: đổi nhãn dòng DR→PROD:5432 thành "**PG streaming (luồng chính, standby pull)**", bỏ chữ "reverse/failback".
  - §4.4 shwsdb1dr inbound: dòng PROD→DR:5432 → đổi thành "**5432 FROM shwsdb1p — FAILBACK ONLY**" (không phải normal).
  - §5.2 shwsdb1p outbound: bỏ/đổi "streaming ship" → "5432 TO shwsdb1dr — **FAILBACK ONLY**".
  - §5.3 giữ nguyên (đúng).
  - §4.1 shwsap1p inbound + §10.2: thêm cổng exporter còn thiếu **8080 (cadvisor), 9113 (nginx), 9121 (redis), 15692 (rabbitmq)** từ source = scraper thực; bỏ/giải thích 9323.
  - §4.2 shwsdb1p inbound: xác nhận 9100/9187 đủ; thêm nếu có exporter khác.
  - §8.1 + §8.2: chốt MinIO TLS → thêm cert `shwsdb1p.bank.local`(MinIO) hoặc ghi rõ "MinIO HTTP nội VLAN, chấp nhận" — đồng bộ với `01 §2`.
  - §2 + §13: thống nhất scraper identity (xem B9 quyết định bên dưới).
- **Modify:** `01-architecture-prod.md` §2 diagram + §13: đổi `10.X.Y` → `10.94.10.x` (đồng bộ) **hoặc** thêm note placeholder thống nhất; gỡ open Q "VM monitoring riêng" nếu chốt dùng bank (đồng bộ `08`); MinIO "HTTP" → khớp quyết định §8.
- **Modify:** `08-monitoring-design.md` §2: ghi rõ scraper = Prometheus bank (mgmt), source IP của bank Prometheus; bỏ phụ thuộc `shws-mon` nếu không dựng.
- **Modify:** `05-security-design.md` §5.3 cert inventory: thêm cert MinIO nếu chốt TLS.

## Decisions cần chốt trong phase (đề xuất default)

- **B9:** Default = **không dựng `shws-mon` riêng**; Prometheus bank scrape trực tiếp exporter qua mgmt VLAN. `04` ghi source = "Prometheus bank (IP do team monitoring cấp)"; gỡ open Q `01 §13`. (Nếu owner muốn giữ open → để 1 open Q duy nhất, không mâu thuẫn 08.)
- **B8 MinIO:** Default = **TLS** (đồng bộ "TLS everywhere" §8.2 + audit) → thêm cert. Nếu chọn HTTP nội VLAN → sửa `04 §4.2/§8.2` về HTTP cho khớp `01 §2`.

## Implementation Steps

1. Viết lại 4 dòng replication firewall (§4.2/§4.4/§5.2/§5.3) theo hướng pull + nhãn FAILBACK ONLY.
2. Bổ sung cổng exporter thiếu vào §4.1 (+§10.2 nếu liệt kê), source = scraper thực.
3. Chốt + đồng bộ scraper identity giữa `04 §2`, `08 §2`, `01 §13`.
4. Chốt MinIO HTTP/TLS, đồng bộ `01 §2` ↔ `04 §4.2/§8.2` ↔ cert inventory `04 §8.1`/`05 §5.3`.
5. Thống nhất IP placeholder (`01` → `10.94.x.x` + note "tạm, network team cấp").
6. Verify: grep `10.X.Y` → 0; mọi exporter trong `08 §2` có rule ở `04`; không còn dòng firewall mô tả PROD→DR:5432 là normal.

## Todo List

- [ ] Sửa hướng replication firewall (4 dòng)
- [ ] Thêm cổng exporter 8080/9113/9121/15692
- [ ] Chốt scraper identity (04/08/01)
- [ ] Chốt MinIO TLS/HTTP + cert
- [ ] Thống nhất IP placeholder

## Success Criteria

- [ ] Firewall replication chỉ allow pull DR→PROD ở chế độ thường; PROD→DR đánh dấu FAILBACK ONLY.
- [ ] Mọi exporter `08` khai báo đều có rule firewall tương ứng với source đúng.
- [ ] MinIO HTTP/TLS nhất quán 3 file; cert đầy đủ nếu TLS.
- [ ] Không còn placeholder `10.X.Y` lẫn `10.94` mâu thuẫn.

## Risk Assessment

- Nếu network team thực tế cấu hình replication theo VIP/proxy khác → hướng có thể đổi; ghi giả định "standard PG streaming pull" rõ ràng để network team xác nhận.

## Security Considerations

- Least-privilege firewall: chỉ mở đúng source IP scraper, không mở exporter cho cả mgmt subnet nếu tránh được.
- MinIO TLS củng cố audit in-transit (Thông tư 09 encryption-in-transit).

## Next Steps

- Phase 4 xử lý tầng DB/replication logic (pg_hba, slot, repo) — bổ trợ firewall ở phase này.
