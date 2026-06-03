# 00 — Prerequisites (Điều kiện tiên quyết cài đặt PROD)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** SRE, DBA, Infra, Network
**Phạm vi:** Checklist PHẢI hoàn tất TRƯỚC khi bắt đầu cài đặt PROD 2-node.

> Thiết kế gốc: [`../01-system-design/`](../01-system-design/). Đây là cổng kiểm soát (gate) — không bắt đầu cài nếu còn mục ❌.

---

## 1. Khi nào dùng

Đọc & tick toàn bộ checklist này trước khi chạy bất kỳ bước nào trong [`prod/`](./prod/). Mỗi mục thiếu là một blocker.

---

## 2. Hardware / VM (Hyper-V)

| Hạng mục             | PROD APP (`shwsap1p`)       | PROD DATA (`shwsdb1p`)       | ✅/❌ |
| -------------------- | --------------------------- | ---------------------------- | ----- |
| vCPU                 | 8                           | 8                            |       |
| RAM                  | 16 GB                       | 16 GB                        |       |
| Disk OS (local VHDX) | 80 GB XFS                   | 80 GB XFS                    |       |
| Disk thêm            | 100 GB VHDX (`/u01/docker`) | 3 SAN LUN (xem §4)           |       |
| OS                   | RHEL 9.6 minimal            | RHEL 9.6 minimal + dev tools |       |
| Hyper-V Integration  | Đã cài                      | Đã cài                       |       |

> **Minor version RHEL:** Chốt **RHEL 9.6** (2026-05-27). Vẫn xác nhận patch level chính xác (9.6.z) với Infra **trước** khi build bundle — RPM phải khớp đúng minor đã cài (xem [`01-build-station-bundle.md`](./01-build-station-bundle.md)).

---

## 3. Network sẵn sàng

Tham chiếu [`../01-system-design/04-network-design.md`](../01-system-design/04-network-design.md).

- [ ] IP đã cấp cho 2 node (placeholder pattern: APP `10.94.10.10`, DATA `10.94.10.11`)
- [ ] VLAN PROD `10.94.10.0/24` cô lập, **không** định tuyến internet
- [ ] Firewall mở đúng port matrix:
  - User subnet → `shwsap1p:443` (TCP/TLS)
  - `shwsap1p` → `shwsdb1p:5432, 9000` (TCP/TLS)
  - Build station (mgmt) → cả 2 node `:22` (SSH)
  - `shws-mon` → exporter ports `9100/9187/9323`
  - **Default DENY** mọi chiều khác
- [ ] DNS nội bộ tạo record: `shwsap1p.bank.local`, `shwsdb1p.bank.local`, CNAME `shws.bank.local` (TTL 60s)
- [ ] DNS server bank IP (cho `/etc/resolv.conf`)
- [ ] NTP server bank reachable (UDP 123) — bắt buộc cho DB
- [ ] Outbound tới bank services: LDAP/SwingSSO, SMTP 587, SIEM syslog 514/6514

---

## 4. SAN LUN (DATA node) — do ICTP cấp

Tham chiếu [`../01-system-design/07-storage-design.md`](../01-system-design/07-storage-design.md).

- [ ] 3 LUN đã present tới `shwsdb1p` qua multipath:
  - LUN-1 600 GB RAID-10 → `/u01` (PGDATA + MinIO)
  - LUN-2 100 GB RAID-10 → `/u02` (WAL)
  - LUN-3 1 TB RAID-5 → `/u03` (pgBackRest repo)
- [ ] **WWID** của 3 LUN (ICTP cấp) cho `multipath.conf`
- [ ] **Stripe size** SAN (`su`/`sw`) cho align `mkfs.xfs`
- [ ] Multipath (≥ 2 path/LUN) đã verify ở tầng fabric

---

## 5. Accounts & quyền

- [ ] Tài khoản OS có `sudo` trên cả 2 node (deploy user)
- [ ] SSH key build station → 2 node đã trao đổi (key-based, không password)
- [ ] Bí mật DB chuẩn bị (sinh khi cài, lưu KeePass): mật khẩu `plane_app`, `monitoring`, cipher pgBackRest
- [ ] LDAP/SwingSSO: service account + bind DN + endpoint (FQDN, port 636)
- [ ] SMTP relay: host, port, có cần auth không

---

## 6. Certificate (bank internal CA)

Tham chiếu [`../01-system-design/05-security-design.md`](../01-system-design/05-security-design.md) §4, [`04-network-design.md`](../01-system-design/04-network-design.md) §8.

- [ ] CA root/intermediate bank (`bank-ca.crt`)
- [ ] Server cert + key cho `shws.bank.local` (user-facing TLS)
- [ ] Server cert + key cho `shwsdb1p` (PostgreSQL `ssl=on` + mTLS)
- [ ] Client cert `replicator` (mTLS replication — dùng ở phase DR)
- [ ] Cert lifetime + lịch gia hạn ghi vào calendar (alert 30 ngày trước hết hạn)

---

## 7. Offline bundle đã nhận & verify

Bundle tạo trên build station theo [`01-build-station-bundle.md`](./01-build-station-bundle.md), chuyển vào bank qua USB/SFTP.

- [ ] Bundle `bundle-shws-YYYYMMDD.tar.gz` có mặt trên server target
- [ ] `CHECKSUMS.txt` verify khớp (md5/sha256) — xem §8
- [ ] Bundle chứa đủ: `pg-stack-rhel9/`, `docker-stack/`, `plane-dist/`, `os-tuning/`, (optional `monitoring-stack/`)

```bash
# Verify checksum bundle (trên server target)
cd /opt/shws-bundle
sha256sum -c CHECKSUMS.txt
# Kỳ vọng: mọi dòng "OK"
```

Dừng lại nếu bất kỳ dòng nào `FAILED` → bundle hỏng/thiếu, tạo lại trên build station.

---

## 8. Verification gate (tóm tắt)

| Nhóm     | Điều kiện pass                              |
| -------- | ------------------------------------------- |
| VM       | 2 VM đúng spec, OS cài, SSH được            |
| Network  | Port matrix mở đúng, DNS/NTP reachable      |
| Storage  | 3 LUN present, WWID + stripe size có        |
| Accounts | sudo + SSH key + bí mật DB chuẩn bị         |
| Cert     | CA + server cert + (replicator client cert) |
| Bundle   | checksum OK, đủ thành phần                  |

→ Tất cả ✅ mới sang [`prod/01-data-node-os.md`](./prod/01-data-node-os.md).

---

## 9. Câu hỏi mở

- [ ] Xác nhận patch level RHEL 9.6.z chính xác với Infra — RPM bundle phải khớp
- [ ] IP thực tế (thay placeholder `10.94.x`)
- [ ] WWID + stripe size LUN (ICTP)
- [ ] NAS offsite share point cho backup (Infra) — dùng ở [`prod/03-data-node-backup.md`](./prod/03-data-node-backup.md)
- [ ] LDAP/SMTP/SIEM endpoint cụ thể

---

## 10. Liên kết

- Tạo bundle: [`01-build-station-bundle.md`](./01-build-station-bundle.md)
- Cài OS DATA node: [`prod/01-data-node-os.md`](./prod/01-data-node-os.md)
- Thiết kế network: [`../01-system-design/04-network-design.md`](../01-system-design/04-network-design.md)
- Thiết kế storage: [`../01-system-design/07-storage-design.md`](../01-system-design/07-storage-design.md)
- Thiết kế security: [`../01-system-design/05-security-design.md`](../01-system-design/05-security-design.md)
