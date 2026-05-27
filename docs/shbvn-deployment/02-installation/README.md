# 02 — Hướng dẫn Cài đặt (HDCĐ)

Tài liệu cài đặt step-by-step cho 3 môi trường. Đối tượng đọc: SRE, DevOps, người triển khai.

## Mô hình cài đặt — Air-gap

```
   BUILD STATION              ────USB/SFTP────►       BANK INTERNAL NETWORK
   (có internet)                                      (no internet)

   • Download RPMs                                    • Verify md5/GPG
   • docker pull + save                               • Copy bundle lên server
   • git clone repo                                   • Run install script
   • pip download wheels                              • Validate
   • Tạo bundle .tar.gz
```

Mọi step "dnf install / docker pull / pip install / git clone" KHÔNG hoạt động trong bank. Phải dùng bundle offline.

## Danh sách tài liệu

### Chung

| #   | File                                                         | Nội dung                                          | Status   |
| --- | ------------------------------------------------------------ | ------------------------------------------------- | -------- |
| 00  | [`00-prerequisites.md`](./00-prerequisites.md)               | Hardware, network, account, cert sẵn sàng         | 🟡 Draft |
| 01  | [`01-build-station-bundle.md`](./01-build-station-bundle.md) | Quy trình tạo offline bundle trên máy có internet | 🟡 Draft |

### PROD ([`prod/`](./prod/))

| #   | File                                                                   | Nội dung                                        | Status   |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------- | -------- |
| 01  | [`prod/01-data-node-os.md`](./prod/01-data-node-os.md)                 | Cài RHEL 9.6, multipath SAN, XFS, kernel tuning | 🟡 Draft |
| 02  | [`prod/02-data-node-postgres.md`](./prod/02-data-node-postgres.md)     | Cài PG 15.7 native từ offline RPM, init, config | 🟡 Draft |
| 03  | [`prod/03-data-node-backup.md`](./prod/03-data-node-backup.md)         | pgBackRest config + cron + test restore         | 🟡 Draft |
| 04  | [`prod/04-app-node-docker.md`](./prod/04-app-node-docker.md)           | Cài Docker offline, deploy Plane stack          | 🟡 Draft |
| 05  | [`prod/05-validation-checklist.md`](./prod/05-validation-checklist.md) | Smoke test, sanity check sau cài                | 🟡 Draft |

### TEST/UAT ([`test-uat/`](./test-uat/))

| #   | File                                                                 | Nội dung                                   | Status   |
| --- | -------------------------------------------------------------------- | ------------------------------------------ | -------- |
| 01  | [`test-uat/01-vm-prepare.md`](./test-uat/01-vm-prepare.md)           | Chuẩn bị 1 VM (RHEL 9.6) + Docker offline  | 🟡 Draft |
| 02  | [`test-uat/02-docker-allinone.md`](./test-uat/02-docker-allinone.md) | Deploy all-in-one (giữ plane-db container) | 🟡 Draft |
| 03  | [`test-uat/03-validation.md`](./test-uat/03-validation.md)           | Smoke test UAT + sign-off                  | 🟡 Draft |

### DR Site ([`dr-site/`](./dr-site/))

| #   | File                                                                   | Nội dung                               | Status   |
| --- | ---------------------------------------------------------------------- | -------------------------------------- | -------- |
| 01  | [`dr-site/01-data-node-replica.md`](./dr-site/01-data-node-replica.md) | Cài PG standby + streaming replication | 🟡 Draft |
| 02  | [`dr-site/02-failover-test.md`](./dr-site/02-failover-test.md)         | Drill promote replica → primary        | 🟡 Draft |

## Bundle structure

Mỗi tài liệu cài đặt giả định bundle đã có trên server target. Bundle gồm:

```
bundle-2026-XX-XX/
├── pg-stack-rhel9/           # RPM PG 15, pgBackRest, deps
├── docker-stack/              # Docker CE + image .tar
├── plane-source/              # SHBVN fork source code
├── monitoring-stack/          # Prometheus, Grafana, exporters (optional)
├── os-tuning/                 # configs, systemd units, scripts
└── CHECKSUMS.txt              # md5/sha256 verification
```

Tạo bundle: theo `01-build-station-bundle.md`.

## Quy ước viết tài liệu cài đặt

Mỗi file phải có:

1. **Prerequisites** — bundle nào, version nào, account nào
2. **Verification** — md5/GPG check trước khi cài
3. **Step-by-step** — lệnh chính xác + output mong đợi
4. **Validation** — cách verify bước này thành công
5. **Rollback** — nếu sai, làm gì
6. **Troubleshooting** — lỗi thường gặp

## Liên kết

- Thiết kế làm cơ sở: [`../01-system-design/`](../01-system-design/)
- Runbook vận hành sau cài: [`../03-operations/runbooks/`](../03-operations/runbooks/)
- Validation criteria: [`../04-testing/`](../04-testing/)
