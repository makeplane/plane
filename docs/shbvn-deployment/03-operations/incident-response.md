# Incident Response — Operations

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-26
**Owner:** duonglx · **Audience:** Oncall, SRE, DBA, TL, Management

> Quy trình xử lý sự cố production **Shinhan Workspace (SHWS)**. Liên quan: severity matrix [`README.md`](./README.md), alert routing [`monitoring-alerting.md`](./monitoring-alerting.md), incident log [`../05-change-log/incident-log.md`](../05-change-log/incident-log.md). Tuân thủ yêu cầu incident response của Thông tư 09/2020/TT-NHNN ([05-security-design.md](../01-system-design/05-security-design.md) §10).

---

## 1. Severity & SLA

| Severity | Định nghĩa                                 | RTO      | Escalation ngay       |
| -------- | ------------------------------------------ | -------- | --------------------- |
| **P1**   | Toàn hệ down / mất dữ liệu                 | < 1 giờ  | TL + DBA + Management |
| **P2**   | Tính năng chính lỗi / performance degraded | < 4 giờ  | TL + DBA/SRE          |
| **P3**   | Tính năng phụ lỗi, có workaround           | < 24 giờ | Ticket                |
| **P4**   | Cosmetic / minor                           | < 1 tuần | Backlog               |

Nghi ngờ giữa 2 mức → chọn mức **cao hơn**, hạ sau khi đánh giá.

---

## 2. Vòng đời sự cố

```
DETECT → TRIAGE → MITIGATE → RESOLVE → RECOVER → POST-MORTEM
(alert/   (sev +   (giảm tác   (fix căn  (verify   (P1/P2:
 user)     owner)   động ngay)   nguyên)   ổn định)  RCA)
```

### 2.1 Detect

- Nguồn: Prometheus alert (xem [`monitoring-alerting.md`](./monitoring-alerting.md)), daily check (form), hoặc user report.
- Ghi **thời điểm phát hiện** (mốc tính RTO/MTTR).

### 2.2 Triage (5 phút đầu)

- [ ] Gán **severity** (§1) + **Incident Commander (IC)** — người điều phối (oncall mặc định).
- [ ] Mở **incident channel** (theo kênh bank) + bản ghi timeline.
- [ ] P1/P2 → escalate ngay theo §1. P1 → thông báo Management.

### 2.3 Mitigate (giảm tác động trước, fix căn nguyên sau)

- Ưu tiên **khôi phục dịch vụ**, không phải tìm root cause ngay.
- Hành động nhanh phổ biến: restart container/service, failover DR, rollback deploy, mở rộng disk.

### 2.4 Resolve & Recover

- Áp fix căn nguyên (hoặc giữ workaround tạm + ticket follow-up).
- Verify health, theo dõi ổn định một khoảng trước khi đóng.

### 2.5 Post-mortem (P1/P2 bắt buộc)

- RCA blameless trong 48h → ghi [`incident-log.md`](../05-change-log/incident-log.md).

---

## 3. Playbook theo triệu chứng

| Triệu chứng                        | Sev gợi ý | Bước đầu                                                                    | Runbook                                                                                |
| ---------------------------------- | --------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| API health != 200 / toàn site down | P1        | check `docker compose ps` app node; restart proxy/api; nếu DB chết → DR     | [`runbooks/dr-failover.md`](./runbooks/dr-failover.md)                                 |
| DB không phản hồi / PG down        | P1        | `systemctl status postgresql-15`; xem log; restart; nếu data hỏng → restore | [`runbooks/backup-restore.md`](./runbooks/backup-restore.md)                           |
| Mất dữ liệu / DELETE nhầm          | P1        | KHÔNG ghi đè thêm; PITR về trước sự cố                                      | [`runbooks/backup-restore.md`](./runbooks/backup-restore.md) §4.3                      |
| Error rate 5xx cao                 | P2        | xem nginx/api log; rollback deploy gần nhất nếu vừa deploy                  | [`runbooks/app-deploy-new-version.md`](./runbooks/app-deploy-new-version.md) §rollback |
| Latency p95/p99 tăng               | P2/P3     | check slow query (`pg_stat_statements`), CPU/RAM, RabbitMQ queue            | [06](../01-system-design/06-database-design.md) §16                                    |
| Replication lag lớn                | P2        | check WAN (ICTP), slot size, `max_wal_size`; nguy cơ fill `/u02`            | [`runbooks/dr-failover.md`](./runbooks/dr-failover.md)                                 |
| Disk `/u0X` > 90%                  | P2        | xác định LUN; mở rộng online; rà retention                                  | [07](../01-system-design/07-storage-design.md) §6.3                                    |
| Backup fail / stale                | P2        | `pgbackrest check`; xem `/u03` free; chạy backup thủ công                   | [`runbooks/backup-restore.md`](./runbooks/backup-restore.md)                           |
| Container restart loop             | P2/P3     | `docker compose logs <svc>`; rollback image nếu sau deploy                  | [`runbooks/app-deploy-new-version.md`](./runbooks/app-deploy-new-version.md)           |
| Cert hết hạn / TLS lỗi             | P2        | renew cert bank CA; reload service                                          | [05](../01-system-design/05-security-design.md) §5                                     |
| Nghi security breach / leak        | P1        | cô lập, KHÔNG xóa log; báo Security Officer ngay                            | §5                                                                                     |
| DC mất hoàn toàn                   | P1        | kích DR failover (cần Mgmt approve)                                         | [`runbooks/dr-failover.md`](./runbooks/dr-failover.md)                                 |

---

## 4. Vai trò khi xử lý sự cố

| Vai trò                | Trách nhiệm                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Incident Commander** | Điều phối, quyết định, giữ timeline, liên lạc Management. KHÔNG tự fix (điều phối) |
| **DBA**                | DB issue: restore, replication, query, failover                                    |
| **SRE/Ops**            | App stack, OS, network, container, disk                                            |
| **ICTP (hạ tầng)**     | EMC storage, SAN, VM Hyper-V, fabric — SHWS escalate khi nghi tầng hạ tầng         |
| **Security Officer**   | Sự cố bảo mật (breach, leak) — quyết cô lập + báo cáo                              |
| **Management**         | Approve P1 (DR failover), comms ra ngoài, BCP                                      |

---

## 5. Sự cố bảo mật (đặc biệt)

1. **Cô lập** trước, KHÔNG tắt máy (giữ volatile evidence) trừ khi đang lan rộng.
2. **KHÔNG xóa log** — log là bằng chứng (forward SIEM đã giữ, xem [05](../01-system-design/05-security-design.md) §6).
3. Báo **Security Officer + Management** ngay (P1).
4. Rotate secret nghi lộ (xem [05](../01-system-design/05-security-design.md) §4.3 "Compromise event → immediately").
5. RCA + báo cáo Compliance theo Thông tư 09.

---

## 6. Communication

| Đối tượng                 | Khi nào                   | Nội dung                                  |
| ------------------------- | ------------------------- | ----------------------------------------- |
| Oncall/team               | Ngay khi detect           | Triệu chứng, sev, IC                      |
| Management                | P1 ngay; P2 nếu kéo dài   | Tác động business, ETA, cần quyết định gì |
| End user (qua bank comms) | P1/P2 ảnh hưởng diện rộng | Thông báo gián đoạn + ETA (do bank phát)  |
| Compliance/Audit          | Sau P1/P2                 | RCA + biện pháp khắc phục                 |

> Kênh comms cụ thể (email/Teams/SMS) theo quy định bank — TBD (§8).

---

## 7. Sau sự cố — Incident log & RCA

Mọi P1/P2 ghi [`../05-change-log/incident-log.md`](../05-change-log/incident-log.md):

- Timeline (detect → resolve), severity, tác động (user/data/downtime).
- RTO/RPO thực tế đạt được.
- Root cause (5 whys), fix tạm + fix căn nguyên.
- Action items phòng tái diễn (gán owner + hạn).

RCA **blameless** — tập trung hệ thống/quy trình, không đổ lỗi cá nhân.

---

## 8. Câu hỏi mở

1. **Kênh comms + oncall rotation:** tool/kênh bank dùng (Teams/SMS/PagerDuty)? Lịch oncall ai?
2. **IC mặc định:** giai đoạn 1 ai là Incident Commander (oncall hay TL)?
3. **SLA báo Management:** ngưỡng thời gian P2 phải báo Mgmt?
4. **Thông báo user:** bank có template/quy trình thông báo gián đoạn dịch vụ riêng?
5. **Tích hợp ticketing:** dùng hệ ticket nào (Jira/bank ITSM) cho P3/P4 + action items?

---

## 9. Liên kết

- Severity matrix + maintenance window: [`README.md`](./README.md)
- Alert routing: [`monitoring-alerting.md`](./monitoring-alerting.md)
- Runbooks: [`runbooks/`](./runbooks/)
- Incident log (RCA): [`../05-change-log/incident-log.md`](../05-change-log/incident-log.md)
- Security design (breach, audit): [`../01-system-design/05-security-design.md`](../01-system-design/05-security-design.md)
- Routine maintenance: [`routine-maintenance.md`](./routine-maintenance.md)
