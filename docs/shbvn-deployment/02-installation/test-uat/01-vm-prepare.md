# UAT 01 — Chuẩn bị VM (RHEL 9.6) + Docker offline

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** SRE/QA
**Host:** `shwsap1t` (10.94.30.10) · RHEL 9.6 · all-in-one

> Thiết kế gốc: [`../../01-system-design/02-architecture-test-uat.md`](../../01-system-design/02-architecture-test-uat.md). UAT là 1 VM Docker all-in-one, đơn giản hơn PROD (không SAN, không HA).

---

## 1. Prerequisites

- [`../00-prerequisites.md`](../00-prerequisites.md) (phần chung: bundle, cert) — UAT bỏ qua mục SAN/DR
- VM Hyper-V: 8 vCPU / 16 GB / 30 GB OS + 100 GB VHDX (`/u01`)
- Bundle `docker-stack/` + `plane-dist/` đã verify
- Cert `shwsap1t.bank.local` (bank internal CA)
- VM kết nối được LDAP/SwingSSO + SMTP bank (auth + mail test)

---

## 2. Verification

```bash
cat /etc/redhat-release          # RHEL 9.6
nproc && free -h                 # 8 / 16 GB
lsblk                            # thấy VHDX 100 GB cho /u01
```

---

## 3. Action — Base OS

```bash
sudo hostnamectl set-hostname shwsap1t.bank.local
sudo timedatectl set-timezone Asia/Ho_Chi_Minh

# NTP
sudo dnf install -y /opt/shws-bundle/pg-stack-rhel9/chrony*.rpm 2>/dev/null || true
sudo sed -i "s/^pool .*/server <NTP_BANK_IP> iburst/" /etc/chrony.conf
sudo systemctl enable --now chronyd
```

### 3.1 Mount `/u01` (local VHDX, XFS) cho Docker data-root

```bash
# VHDX thứ 2 (vd /dev/sdb) → 1 partition XFS
sudo mkfs.xfs /dev/sdb
sudo mkdir -p /u01
echo "/dev/sdb  /u01  xfs  defaults,noatime,inode64  0 0" | sudo tee -a /etc/fstab
sudo mount -a
df -hT /u01
```

> UAT **không** dùng SAN/multipath/LVM — chỉ 1 VHDX local cho `/u01/docker`.

---

## 4. Action — Docker CE offline + data-root

```bash
cd /opt/shws-bundle/docker-stack
sudo dnf install -y ./docker-ce*.rpm ./docker-ce-cli*.rpm ./containerd.io*.rpm \
                    ./docker-buildx-plugin*.rpm ./docker-compose-plugin*.rpm

sudo mkdir -p /u01/docker
sudo tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "data-root": "/u01/docker",
  "log-driver": "json-file",
  "log-opts": { "max-size": "100m", "max-file": "3" }
}
EOF
sudo systemctl enable --now docker
docker info | grep "Docker Root Dir"     # /u01/docker
```

---

## 5. Action — Network & cert

```bash
# firewalld: chỉ mở 443 từ subnet user QA + 22 từ mgmt
sudo firewall-cmd --permanent --add-port=443/tcp --add-port=22/tcp
sudo firewall-cmd --reload

# Đặt cert TLS cho proxy (dùng ở 02-docker-allinone)
sudo mkdir -p /opt/plane-app/certs
sudo cp /opt/shws-secrets/shwsap1t.crt /opt/plane-app/certs/
sudo cp /opt/shws-secrets/shwsap1t.key /opt/plane-app/certs/
```

> Outbound cần mở (xem [`04-network-design.md`](../../01-system-design/04-network-design.md) §5.4): LDAP/SwingSSO 636, SMTP 587, NTP 123, DNS 53. **Không** cần kết nối DATA node PROD (UAT có DB container riêng).

---

## 6. Validation

- [ ] `cat /etc/redhat-release` = RHEL 9.6, hostname `shwsap1t`
- [ ] `/u01` mount XFS, `docker info` data-root = `/u01/docker`
- [ ] chrony sync NTP bank
- [ ] firewall mở 443 + 22; outbound LDAP/SMTP thông (`nc -vz <LDAP> 636`)
- [ ] cert `shwsap1t.bank.local` có tại `/opt/plane-app/certs`

---

## 7. Rollback

- VM UAT là disposable: lỗi cấu hình → **Hyper-V checkpoint revert** hoặc cài lại VM (< 30 phút).
- `daemon.json` sai → sửa, `systemctl restart docker`.

---

## 8. Troubleshooting

| Triệu chứng                   | Xử lý                                            |
| ----------------------------- | ------------------------------------------------ |
| docker không start            | data-root `/u01` chưa mount; `mount -a` trước    |
| `/u01` không mount sau reboot | sai fstab device name (`/dev/sdb`); kiểm `lsblk` |
| outbound LDAP/SMTP chặn       | firewall bank; phối hợp Network team             |

---

## 9. Next & liên kết

→ Tiếp: [`02-docker-allinone.md`](./02-docker-allinone.md)

- Kiến trúc UAT: [`../../01-system-design/02-architecture-test-uat.md`](../../01-system-design/02-architecture-test-uat.md)
- Network (UAT VLAN 10.94.30.0/24): [`../../01-system-design/04-network-design.md`](../../01-system-design/04-network-design.md)
- Tạo bundle: [`../01-build-station-bundle.md`](../01-build-station-bundle.md)
