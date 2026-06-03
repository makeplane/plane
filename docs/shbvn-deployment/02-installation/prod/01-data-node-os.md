# PROD 01 — DATA node: OS, SAN multipath, LVM/XFS, kernel tuning

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** SRE/Infra
**Host:** `shwsdb1p` (10.94.10.11) · RHEL 9.6 minimal

> Thiết kế gốc: [`../../01-system-design/07-storage-design.md`](../../01-system-design/07-storage-design.md), [`06-database-design.md`](../../01-system-design/06-database-design.md) §5.2. Chuẩn bị OS + storage cho PostgreSQL native.

---

## 1. Prerequisites

- [`../00-prerequisites.md`](../00-prerequisites.md) đã pass toàn bộ gate
- Bundle `os-tuning/` + `pg-stack-rhel9/` đã verify trên server
- 3 SAN LUN đã present (WWID từ ICTP)
- Quyền `sudo`

---

## 2. Verification (trước khi bắt đầu)

```bash
cat /etc/redhat-release            # RHEL 9.6 (đúng patch)
lsblk                              # thấy đĩa OS + (multipath) LUN
sudo multipath -ll 2>/dev/null || echo "multipath chưa cài (cài ở §4)"
free -h && nproc                   # 16 GB / 8 vCPU
timedatectl                        # timezone
```

---

## 3. Action — Base OS

### 3.1 Hostname, timezone, hosts

```bash
sudo hostnamectl set-hostname shwsdb1p.bank.local
sudo timedatectl set-timezone Asia/Ho_Chi_Minh

# /etc/hosts (giai đoạn đầu, trước khi DNS sẵn)
sudo tee -a /etc/hosts >/dev/null <<'EOF'
10.94.10.10  shwsap1p.bank.local shwsap1p
10.94.10.11  shwsdb1p.bank.local shwsdb1p
EOF
```

### 3.2 Cài gói nền từ bundle (offline)

```bash
cd /opt/shws-bundle/pg-stack-rhel9
sudo dnf install -y ./device-mapper-multipath*.rpm ./lvm2*.rpm ./xfsprogs*.rpm ./chrony*.rpm
```

### 3.3 Time sync (chrony → NTP bank)

```bash
sudo sed -i "s/^pool .*/server <NTP_BANK_IP> iburst/" /etc/chrony.conf
sudo systemctl enable --now chronyd
chronyc sources -v          # ^* trỏ NTP bank, offset nhỏ
```

> Đồng hồ lệch gây lỗi replication & audit timestamp → bắt buộc đúng.

---

## 4. Action — SAN multipath

Tham chiếu [`../../01-system-design/07-storage-design.md`](../../01-system-design/07-storage-design.md) §5.

```bash
sudo mpathconf --enable --with_multipathd y

# Ghi /etc/multipath.conf với WWID do ICTP cấp (thay <WWID-LUN-x>)
sudo tee /etc/multipath.conf >/dev/null <<'EOF'
defaults {
    user_friendly_names     yes
    find_multipaths         yes
    path_grouping_policy    multibus
    path_checker            tur
    failback                immediate
    no_path_retry           queue
}
multipaths {
    multipath { wwid <WWID-LUN-1>  alias shws-data }
    multipath { wwid <WWID-LUN-2>  alias shws-wal }
    multipath { wwid <WWID-LUN-3>  alias shws-backup }
}
EOF

sudo systemctl enable --now multipathd
sudo multipath -r            # reload map
multipath -ll                # mọi path "active ready"; 3 alias shws-data/wal/backup
```

**Validation §4:** `multipath -ll` hiển thị đủ 3 device, mỗi device ≥ 2 path `active ready running`. Nếu path `failed` → kiểm tra fabric với ICTP, KHÔNG tiếp tục.

---

## 5. Action — LVM + XFS, mount `/u01 /u02 /u03`

```bash
# PV + VG + LV cho từng LUN (su/sw align stripe — ICTP cấp giá trị)
for MAP in shws-data:vg_data:lv_pgdata:u01 \
           shws-wal:vg_wal:lv_pgwal:u02 \
           shws-backup:vg_bkp:lv_pgbackup:u03; do
  DEV="${MAP%%:*}"; REST="${MAP#*:}"; VG="${REST%%:*}"; REST="${REST#*:}"; LV="${REST%%:*}"; MNT="${REST##*:}"
  sudo pvcreate "/dev/mapper/${DEV}"
  sudo vgcreate "${VG}" "/dev/mapper/${DEV}"
  sudo lvcreate -l 100%FREE -n "${LV}" "${VG}"
done

# XFS (align stripe: thay su/sw theo ICTP)
sudo mkfs.xfs -d su=256k,sw=4 -l size=128m /dev/vg_data/lv_pgdata
sudo mkfs.xfs -d su=256k,sw=4 -l size=128m /dev/vg_wal/lv_pgwal
sudo mkfs.xfs -l size=128m                 /dev/vg_bkp/lv_pgbackup

sudo mkdir -p /u01 /u02 /u03

# /etc/fstab — mount theo design (noatime cho DB)
sudo tee -a /etc/fstab >/dev/null <<'EOF'
/dev/vg_data/lv_pgdata   /u01   xfs   defaults,noatime,nodiratime,inode64   0 0
/dev/vg_wal/lv_pgwal     /u02   xfs   defaults,noatime,nodiratime,inode64   0 0
/dev/vg_bkp/lv_pgbackup  /u03   xfs   defaults,noatime,inode64              0 0
EOF
sudo systemctl daemon-reload
sudo mount -a
```

**Validation §5:**

```bash
df -hT /u01 /u02 /u03      # XFS, đúng size 600/100/1000 GB
lsblk -f                   # LV → mount point đúng
```

---

## 6. Action — Kernel tuning (sysctl + hugepages)

Tham chiếu [`06-database-design.md`](../../01-system-design/06-database-design.md) §5.2.

```bash
sudo cp /opt/shws-bundle/os-tuning/99-postgres.conf /etc/sysctl.d/99-postgres.conf
sudo sysctl --system

# Kiểm tra giá trị áp dụng
sysctl vm.swappiness vm.nr_hugepages kernel.shmmax net.core.somaxconn
# Kỳ vọng: swappiness=1, nr_hugepages=2200, shmmax=8589934592, somaxconn=1024
```

Nội dung `99-postgres.conf` (đối chiếu thiết kế):

```ini
kernel.shmmax = 8589934592
kernel.shmall = 2097152
vm.swappiness = 1
vm.overcommit_memory = 2
vm.overcommit_ratio = 90
vm.dirty_background_ratio = 5
vm.dirty_ratio = 10
vm.nr_hugepages = 2200
net.core.somaxconn = 1024
net.ipv4.tcp_keepalive_time = 600
```

### 6.1 SELinux & firewalld

```bash
getenforce                                   # Enforcing (giữ nguyên, PG có policy sẵn)

# firewalld: chỉ mở 5432, 9000 từ APP node + 22 từ build, exporter từ mon
sudo firewall-cmd --permanent --new-zone=shws 2>/dev/null || true
sudo firewall-cmd --permanent --zone=shws --add-source=10.94.10.10/32   # APP
sudo firewall-cmd --permanent --zone=shws --add-port=5432/tcp --add-port=9000/tcp
sudo firewall-cmd --permanent --add-port=22/tcp        # SSH từ mgmt (siết source nếu được)
sudo firewall-cmd --reload
sudo firewall-cmd --list-all-zones | grep -A8 shws
```

> Port matrix chi tiết: [`../../01-system-design/04-network-design.md`](../../01-system-design/04-network-design.md) §4.2.

---

## 7. Validation tổng (DATA node OS)

- [ ] `multipath -ll`: 3 device, path `active ready`
- [ ] `/u01 /u02 /u03` mount XFS đúng size, `noatime`
- [ ] sysctl áp dụng (hugepages, swappiness)
- [ ] chrony sync NTP bank, offset < 100ms
- [ ] firewalld chỉ mở 5432/9000 từ APP, 22 từ mgmt
- [ ] `reboot` test → mount + multipath + sysctl tự động lên lại

```bash
sudo reboot
# Sau khi lên lại:
df -hT /u01 /u02 /u03 && multipath -ll && sysctl vm.nr_hugepages
```

---

## 8. Rollback

| Bước                 | Rollback                                                          |
| -------------------- | ----------------------------------------------------------------- |
| fstab sai → boot lỗi | Boot rescue, sửa `/etc/fstab`, `mount -a`                         |
| LVM tạo nhầm LUN     | `lvremove`/`vgremove`/`pvremove`, present lại LUN (phối hợp ICTP) |
| sysctl gây bất ổn    | Xóa `/etc/sysctl.d/99-postgres.conf`, `sysctl --system`, reboot   |
| multipath sai WWID   | Sửa `multipath.conf`, `multipath -r`                              |

> Chưa cài PostgreSQL ở bước này → rollback an toàn, không mất dữ liệu.

---

## 9. Troubleshooting

| Triệu chứng                         | Xử lý                                                    |
| ----------------------------------- | -------------------------------------------------------- |
| `multipath -ll` trống               | LUN chưa present / WWID sai → ICTP; `rescan-scsi-bus.sh` |
| `mount -a` lỗi "unknown filesystem" | chưa `mkfs.xfs` hoặc sai device mapper name              |
| hugepages không lên                 | RAM không đủ free lúc set; reboot sớm sau khi cấu hình   |
| chrony không sync                   | firewall UDP 123 outbound tới NTP bank bị chặn           |

---

## 10. Next & liên kết

→ Tiếp: [`02-data-node-postgres.md`](./02-data-node-postgres.md)

- Storage design: [`../../01-system-design/07-storage-design.md`](../../01-system-design/07-storage-design.md)
- Network/firewall: [`../../01-system-design/04-network-design.md`](../../01-system-design/04-network-design.md)
- Routine checklist (disk, multipath): [`../../03-operations/routine-maintenance.md`](../../03-operations/routine-maintenance.md)
