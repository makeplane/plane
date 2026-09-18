# Plane Deployment

Plane berjalan sebagai stack Docker Compose project `plane-app` dan menjadi source of truth untuk ticket, state, label, komentar, serta webhook.

## Lokasi

```text
/Users/burhanudinrasyid/Project/aider/plane-src/deployments/macmini/
├── docker-compose.yaml
├── .env                       # secret; lokal saja, jangan commit
└── .env.example               # template non-secret
```

## Start/update

```bash
cd /Users/burhanudinrasyid/Project/aider/plane-src/deployments/macmini
/opt/homebrew/bin/docker-compose --env-file .env -p plane-app -f docker-compose.yaml config
/opt/homebrew/bin/docker-compose --env-file .env -p plane-app -f docker-compose.yaml up -d
```

Pertahankan `-p plane-app`; nama ini mengikat stack ke volume `plane-app_*` dan network `plane-app_default`. Jangan menjalankan `down -v`.

## Data

PostgreSQL, Redis, RabbitMQ, MinIO, proxy config, dan log menggunakan named volumes Docker. Memindahkan folder Compose tidak memindahkan atau menghapus volume tersebut.

## Integrasi OpenHands

Konfigurasi webhook dan state/label contract ada di [../../docs/webhook-configuration.md](../../docs/webhook-configuration.md). Arsitektur executor dan bridge ada di [../../../openhands/docs/architecture.md](../../../openhands/docs/architecture.md).

## Port saat ini

Port mengikuti `.env`; deployment saat ini menggunakan HTTP `18080` dan HTTPS `18443`. Jangan hardcode port tanpa membaca env.
