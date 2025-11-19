## Getting Started

Use this guide as the single entry point for local setup. It references the canonical sources (main `README.md`, `CONTRIBUTING.md`, and deployment configs) so you always know where the truth lives.

### 1. Prerequisites
- Node.js ≥ 22.18.0 and pnpm 10.x (`corepack enable` recommended).
- Docker + Docker Compose for API, Redis, Postgres, RabbitMQ.
- Python 3.11 with `pipx` if you plan to run backend management commands locally.

### 2. Local Web + API Stack
1. Follow the “Quick start” section in [`README.md`](../../README.md).
2. Run `pnpm install && pnpm dev` from `/home/stephen/plane` to start the Turbo pipeline.  
   - If the first run stalls, pre-build shared packages: `pnpm build --filter=@plane/types --filter=@plane/ui --filter=@plane/utils --filter=@plane/hooks`.
3. Start backend dependencies with `docker compose -f docker-compose-local.yml up -d`.
4. Visit `http://localhost:3000` (web), `3001` (admin), `3002` (space), and `8000` (API).

### 3. Troubleshooting
- **Port 9090 in use:** MinIO console conflicts; stop the existing process or change `MINIO_CONSOLE_PORT` in `docker-compose-local.yml`.
- **pnpm engine warning:** Upgrade Node to ≥ 22.18.0 for full support.
- **`pip-licenses` missing:** Install once via `pipx install pip-licenses` before running `scripts/generate-license-report.sh`.

### 4. Next Steps
- Read [`CONTRIBUTING.md`](../../CONTRIBUTING.md) for branch naming, commit style, and PR checklist.
- Consult [`docs/development/README.md`](../development/README.md) for lint/test commands and Turbo tips.
- Once you are ready to rebrand, jump to [`docs/rebranding/README.md`](../rebranding/README.md).




