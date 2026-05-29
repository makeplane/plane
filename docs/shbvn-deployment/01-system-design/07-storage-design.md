# 07 — Storage Design (EMC SAN)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-26
**Phiên bản:** 0.1
**Owner:** duonglx
**Liên quan:** [01-architecture-prod.md](./01-architecture-prod.md) §5, [06-database-design.md](./06-database-design.md) §4, [03-architecture-dr-site.md](./03-architecture-dr-site.md), [`ADR-008`](../05-change-log/decisions/adr-008-storage-emc-san.md)

---

## 1. Phạm vi

Thiết kế tầng lưu trữ cho **Shinhan Workspace (SHWS)** PROD: LUN layout trên EMC SAN, multipath, LVM, filesystem XFS, mount convention, và phân chia I/O. **Ngoài phạm vi:** chi tiết cấu hình array EMC (RAID group, cache policy, replication cross-site) — do **ICTP (hạ tầng)** quản, xem [`ADR-009`](../05-change-log/decisions/adr-009-dc-dr-replication-layering.md).

---

## 2. Nguyên tắc thiết kế

| Nguyên tắc          | Áp dụng                                                      |
| ------------------- | ------------------------------------------------------------ |
| Tách I/O pattern    | WAL (sequential write) tách LUN khỏi data (random R/W)       |
| Convention `/u0X`   | Theo chuẩn DBA banking — DBA quen, audit dễ                  |
| RAID theo mục đích  | Data/WAL = RAID-10 (hiệu năng); backup = RAID-5 (dung lượng) |
| LVM trên LUN        | Mở rộng online (`lvextend` + `xfs_growfs`), không downtime   |
| Multipath bắt buộc  | Failover SAN path < 1 giây, không gián đoạn DB               |
| Local cho ephemeral | OS + log trên VHDX local, không tốn LUN SAN                  |

---

## 3. LUN layout — DATA node (`shwsdb1p`)

| Mount      | LUN        | Size       | RAID    | FS  | Mục đích                | I/O pattern                       |
| ---------- | ---------- | ---------- | ------- | --- | ----------------------- | --------------------------------- |
| `/u01`     | SAN LUN-1  | 600 GB     | RAID-10 | XFS | PostgreSQL data + MinIO | Random R/W                        |
| `/u02`     | SAN LUN-2  | 100 GB     | RAID-10 | XFS | WAL (`pg_wal`)          | Sequential write                  |
| `/u03`     | SAN LUN-3  | 1 TB       | RAID-5  | XFS | pgBackRest repo         | Sequential write, đọc khi restore |
| `/`        | local VHDX | 80 GB      | —       | XFS | OS                      | —                                 |
| `/var/log` | local VHDX | (trên `/`) | —       | XFS | PG + OS log             | Sequential write                  |

### 3.1 Cây thư mục trên LUN

```
/u01/  (LUN-1, 600 GB)
├── pgsql/15/data/        # PostgreSQL data_directory (heap + index)
└── minio/                # MinIO object storage (attachments, avatars)

/u02/  (LUN-2, 100 GB)
└── pgsql/15/wal/         # pg_wal — symlink từ $PGDATA/pg_wal

/u03/  (LUN-3, 1 TB)
├── pgbackup/             # pgBackRest repo (repo1-path)
└── (spool/log của pgBackRest đặt local: /var/spool/pgbackrest, /var/log/pgbackrest)
```

> **Path/size canonical (chốt 2026-05-26):** PGDATA `/u01/pgsql/15/data` · WAL `/u02/pgsql/15/wal` · repo `/u03/pgbackup`; LUN 600/100/1000 GB. Đã đồng bộ với [01-architecture-prod.md](./01-architecture-prod.md) §5 và [06-database-design.md](./06-database-design.md) §4. **File 07 này là nguồn chuẩn** cho storage layout.

### 3.2 Lý do tách LUN

- **WAL riêng (`/u02`):** sequential write của WAL không tranh với random write của heap → throughput cao hơn ~20%. Nếu `/u01` đầy, WAL vẫn flush được trên `/u02` → tránh DB freeze. Cũng cho phép snapshot WAL riêng.
- **Backup riêng (`/u03`) RAID-5:** tiết kiệm dung lượng vs RAID-10 cho dữ liệu append-heavy ít cần IOPS cao; hỏng không ảnh hưởng PROD live.
- **Data + MinIO chung `/u01`:** compromise chấp nhận được — MinIO write thưa (object, không phải random page write), không nghẽn DB. Tách riêng nếu file growth lớn (xem [09-capacity-planning.md](./09-capacity-planning.md)).

---

## 4. LUN layout — APP node (`shwsap1p`)

| Mount  | Nguồn      | Size   | FS  | Mục đích                         |
| ------ | ---------- | ------ | --- | -------------------------------- |
| `/`    | local VHDX | 80 GB  | XFS | OS                               |
| `/u01` | local VHDX | 100 GB | XFS | Docker data root (`/u01/docker`) |

APP node **không cần SAN LUN** — stateless, mọi state nằm ở DATA node. Di chuyển `/var/lib/docker` → `/u01/docker` (bind/symlink) để image + volume không làm đầy `/`.

---

## 5. Multipath (device-mapper-multipath)

EMC SAN expose mỗi LUN qua nhiều path (HBA/fabric). `multipathd` gom path → 1 device ảo, tự failover khi path chết.

### 5.1 Cấu hình `/etc/multipath.conf` (tham khảo — ICTP cấp WWID thực tế)

```
defaults {
    user_friendly_names     yes
    find_multipaths         yes
    path_grouping_policy    multibus
    path_checker            tur
    failback                immediate
    no_path_retry           queue
}

multipaths {
    multipath {
        wwid    <WWID-LUN-1>          # ICTP cung cấp
        alias   shws-data
    }
    multipath {
        wwid    <WWID-LUN-2>
        alias   shws-wal
    }
    multipath {
        wwid    <WWID-LUN-3>
        alias   shws-backup
    }
}
```

### 5.2 Verify

```bash
multipath -ll                      # mọi path "active ready", group đủ path
systemctl status multipathd        # enabled, running
```

Kiểm tra hàng ngày (xem [`../03-operations/routine-maintenance.md`](../03-operations/routine-maintenance.md) D8): không path nào `failed`/`faulty`.

---

## 6. LVM + XFS

### 6.1 Stack

```
EMC LUN (multipath device /dev/mapper/shws-data)
   └── PV (pvcreate)
        └── VG (vgcreate vg_data)
             └── LV (lvcreate -l 100%FREE -n lv_pgdata)
                  └── XFS (mkfs.xfs)
                       └── mount /u01
```

### 6.2 Tham số XFS (DB workload)

```bash
mkfs.xfs -d su=256k,sw=4 -l size=128m /dev/vg_data/lv_pgdata
# su/sw align stripe RAID (ICTP cấp stripe size); log size 128m cho metadata-heavy
```

Mount option (`/etc/fstab`):

```
/dev/vg_data/lv_pgdata   /u01   xfs   defaults,noatime,nodiratime,inode64   0 0
/dev/vg_wal/lv_pgwal     /u02   xfs   defaults,noatime,nodiratime,inode64   0 0
/dev/vg_bkp/lv_pgbackup  /u03   xfs   defaults,noatime,inode64              0 0
```

- **`noatime`:** bỏ ghi access time → giảm write thừa cho DB.
- **`inode64`:** cho phép inode toàn bộ volume (volume lớn).

### 6.3 Mở rộng online (khi disk > 80%)

```bash
# ICTP mở rộng LUN trên array trước, OS rescan:
echo 1 > /sys/block/<dev>/device/rescan
multipathd resize map shws-data
pvresize /dev/mapper/shws-data
lvextend -l +100%FREE /dev/vg_data/lv_pgdata
xfs_growfs /u01                     # XFS chỉ grow online được, không shrink
```

> XFS **không shrink** — sizing dư từ đầu hoặc tạo LV mới. Xem [09-capacity-planning.md](./09-capacity-planning.md) §scaling.

---

## 7. DR node storage

DR DATA node (`shwsdb1dr`) **mirror layout PROD**: 3 LUN `/u01//u02//u03`, cùng convention, cùng multipath. pgBackRest repo `/u03` của DR là **repo độc lập** (DR backup từ standby), không phải bản sao repo PROD. Replication file MinIO + platform DC→DR do **DELL EMC storage replication (ICTP)** đảm nhiệm — xem [`ADR-009`](../05-change-log/decisions/adr-009-dc-dr-replication-layering.md). SHWS không cấu hình storage-level replication.

---

## 8. Backup & retention dung lượng

| Đối tượng       | Mount           | Retention           | Ước tính dung lượng (M+12, DB ~20 GB) |
| --------------- | --------------- | ------------------- | ------------------------------------- |
| pgBackRest full | `/u03/pgbackup` | 4 fulls             | ~80 GB (4 × ~20 GB nén lz4 ~50%)      |
| pgBackRest diff | `/u03/pgbackup` | 7 diffs             | ~20 GB                                |
| WAL archive     | `/u03/pgbackup` | 7 ngày (diff-based) | ~30–50 GB                             |
| **Tổng `/u03`** |                 |                     | **~150 GB / 1 TB → ~15%**             |

Offsite copy sang NAS bank (rsync daily, retention 90 ngày) — xem [06-database-design.md](./06-database-design.md) §9.4. NAS path do Infra cấp (TBD).

---

## 9. Failure modes & mitigation

| Failure                       | Tác động            | Mitigation                                                                     |
| ----------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| 1 SAN path hỏng               | Không tác động      | Multipath failover < 1s                                                        |
| Toàn bộ path tới LUN-1 (data) | DB không đọc data   | `no_path_retry queue` giữ I/O; ICTP khôi phục fabric; nếu lâu → failover DR    |
| LUN-1 (data) corrupt          | DB không khởi động  | Restore từ pgBackRest (`/u03`) — xem `backup-restore.md`                       |
| LUN-2 (WAL) hỏng              | Không commit tx mới | Recovery từ checkpoint gần nhất; có thể mất tx chưa archive                    |
| LUN-3 (backup) hỏng           | Mất backup local    | Offsite NAS copy; DR repo độc lập vẫn còn                                      |
| `/u01` đầy (>90%)             | DB dừng ghi         | Alert >80%; mở rộng online (§6.3); WAL trên `/u02` riêng nên không freeze ngay |
| `/u02` (WAL) đầy              | DB freeze           | Alert >80%; `max_slot_wal_keep_size=4GB` auto-drop slot kẹt                    |

---

## 10. Câu hỏi mở

1. ~~Path + size canonical~~ → **CHỐT (2026-05-26):** PGDATA `/u01/pgsql/15/data`, WAL `/u02/pgsql/15/wal`, repo `/u03/pgbackup`; LUN 600/100/1000 GB. Đã đồng bộ 01/06/07.
2. **Stripe size SAN:** ICTP cấp `su/sw` thực tế cho mkfs.xfs align.
3. **WWID LUN:** ICTP cấp WWID 3 LUN cho `multipath.conf`.
4. **IOPS spec LUN:** test IOPS trước go-live (xem [`../04-testing/`](../04-testing/)); LUN-1 cần IOPS đủ cho random DB workload.
5. **NAS offsite:** path, protocol (NFS/CIFS), capacity, retention — Infra confirm.
6. **TDE / encryption-at-rest:** theo phát biểu canonical [05](./05-security-design.md) §10.1 — EMC array-level encryption do **ICTP** xác nhận; GĐ1 chỉ encrypt pgBackRest repo + VLAN/physical.

---

## 11. Cross-references

- Kiến trúc PROD (storage tóm tắt): [01-architecture-prod.md](./01-architecture-prod.md) §5
- Database design (PG path, backup): [06-database-design.md](./06-database-design.md) §4, §9
- DR site + EMC replication: [03-architecture-dr-site.md](./03-architecture-dr-site.md)
- ADR-008 (EMC SAN): [`../05-change-log/decisions/adr-008-storage-emc-san.md`](../05-change-log/decisions/adr-008-storage-emc-san.md)
- ADR-009 (DC-DR 2 layer): [`../05-change-log/decisions/adr-009-dc-dr-replication-layering.md`](../05-change-log/decisions/adr-009-dc-dr-replication-layering.md)
- Capacity planning: [09-capacity-planning.md](./09-capacity-planning.md)
- Routine checklist (disk, multipath): [`../03-operations/routine-maintenance.md`](../03-operations/routine-maintenance.md)
