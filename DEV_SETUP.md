# Developer Quick Setup (Windows PowerShell)

This file provides a minimal set of steps to get a working local dev environment on Windows (PowerShell). The repo is a monorepo; prefer using Docker for parity, otherwise follow the native steps.

Prerequisites
- Node >= 22 (LTS as required by `package.json`)
- `pnpm` (tested with pnpm 10+)
- Python 3.12
- Git, Docker (optional but recommended)

Quick native setup (no Docker)
1. Open PowerShell (run as normal user). If you use `nvm` or `choco`, ensure Node meets `>=22.18.0`.
2. Install Node deps (root workspace):

```powershell
pnpm install
```

3. Start the workspace dev servers (root):

```powershell
pnpm run dev
```

This runs `turbo` tasks across workspaces. Individual apps can also be started from their directories using their `package.json` scripts.

API (Python) local setup
1. Create and activate a venv in `apps/api`:

```powershell
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install Python deps and run tests

```powershell
pip install -r requirements.txt
pytest -k unit
```

Linting and checks
- JavaScript/TypeScript: `pnpm -w run check` or `pnpm -w run fix:lint` (root scripts use `turbo`).
- Python: from repo root or `apps/api` run `ruff check --fix apps/api` (requires `ruff` installed in the active Python env).

Docker (recommended for parity)
- To start a development stack (uses repository compose files):

```powershell
docker-compose -f docker-compose-local.yml up --build
```

Or use the main compose for production-like setup:

```powershell
docker-compose up --build
```

Notes
- If host resources are constrained, prefer running a single app (e.g., `apps/api`) in Docker and run frontends locally.
- Windows path quirks: use PowerShell activation for virtualenv and ensure Docker Desktop is running before `docker-compose`.

Troubleshooting
- Node engine error: install correct Node version via `nvm` or use a Node version manager.
- Permission errors in PowerShell activating venv: run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` if necessary.

Safe `.env` handling
- Do NOT commit real secret `.env` files to the repo. This repository includes `.env.example` files for guidance. Use the helper script to create local `.env` files without overwriting anything:

```powershell
./scripts/create-env.ps1
```

- Edit the newly created `./.env` and `./apps/api/.env` with local values as needed. If you already have a local `.env`, the script will NOT overwrite it.
