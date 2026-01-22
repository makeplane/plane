# Plane - Project Context

## Project Overview
Plane is an open-source project management tool designed to track issues, run cycles, and manage product roadmaps. It is a full-stack application organized as a monorepo.

## Architecture
The project uses a **monorepo** structure managed by **TurboRepo** and **pnpm workspaces**.

- **Backend (`apps/api`)**: Built with **Django** (Python 3.8+) and **Django REST Framework**. It uses **PostgreSQL** as the database and **Redis** for caching/queueing.
- **Frontends**:
  - **Web App (`apps/web`)**: The main application interface (React/TypeScript).
  - **Space (`apps/space`)**: Public-facing pages or workspaces (React/TypeScript).
  - **Admin (`apps/admin`)**: Instance administration panel (React/TypeScript).
  - **Live (`apps/live`)**: Real-time service (likely Node.js/Socket.io based on typical patterns, though acts as a separate service).
- **Shared Packages (`packages/`)**: Contains shared UI components (`ui`), configurations (`eslint-config`, `typescript-config`), and utilities used across the frontend applications.
- **Infrastructure**: Docker Compose is used for local development to spin up backing services like Postgres, Redis, and Minio.

## Key Directories
- `apps/`: Application source code.
  - `api/`: Django backend.
  - `web/`: Main React frontend.
  - `space/`: React frontend for public views.
  - `admin/`: React frontend for instance admin.
  - `live/`: Real-time service.
- `packages/`: Shared libraries and configurations.
- `deployments/`: Deployment configurations for Docker, Kubernetes, etc.
- `scripts/`: Utility scripts (if any).

## Development Workflow

### Prerequisites
- **Node.js**: v20+ (LTS)
- **pnpm**: Enabled via `corepack enable pnpm`
- **Python**: v3.8+
- **Docker**: Engine running
- **Postgres**: v14 (via Docker)
- **Redis**: v6.2.7 (via Docker)

### Setup
1.  **Initialize Environment**:
    ```bash
    ./setup.sh
    ```
    This script copies `.env.example` to `.env` for all services and generates a Django `SECRET_KEY`.

2.  **Start Backing Services**:
    ```bash
    docker compose -f docker-compose-local.yml up -d
    ```

3.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

4.  **Start Frontend Applications**:
    ```bash
    pnpm dev
    ```
    This uses TurboRepo to run the `dev` script across workspaces.

### Common Commands

- **Build Project**: `pnpm build` (runs `turbo run build`)
- **Linting**: `pnpm check:lint` (runs `turbo run check:lint`)
- **Formatting**: `pnpm check:format` (runs `turbo run check:format`)
- **Type Checking**: `pnpm check:types` (runs `turbo run check:types`)
- **Fix Lint/Format**: `pnpm fix`
- **Clean Artifacts**: `pnpm clean`

### Backend Specifics (`apps/api`)
- **Testing**: `pytest` is configured (`pytest.ini` present). Run tests via `run_tests.sh` (inferred) or standard pytest commands.
- **Dependencies**: Managed via `requirements.txt`.

### Frontend Specifics
- **Framework**: React with Vite.
- **Styling**: Tailwind CSS (inferred from `tailwind-config` package).
- **State Management**: Likely SWR or React Query (standard for this stack, verify in package.json if needed).

## Contribution Guidelines
- **Commit Messages**: Follow the convention:
  - `🐛 Bug: [description]`
  - `🚀 Feature: [description]`
  - `🛠️ Improvement: [description]`
  - `📘 Docs: [description]`
- **Code Style**: Enforced via ESLint and Prettier. Always run `pnpm fix` before committing.
- **Testing**: All new features and bug fixes must include unit tests.

## Documentation
- **Official Docs**: https://docs.plane.so/
- **Developer Docs**: https://developers.plane.so/
- **API Documentation**: Likely available at `/api/docs` or similar when running the backend.
