# Tasks: Un-Dockerize FamilyFlow for Single-Command Deployment

**Input**: Design documents from `/specs/001-family-management/`
**Prerequisites**: plan.md (required), spec.md (for context), research.md, data-model.md (for verification)

**Tests**: Tests are OPTIONAL - verification tasks included for Phase 2, but no new test development needed.

**Organization**: Tasks are organized by Phase 1 (Setup) and Phase 2 (Foundational verification) as outlined in plan.md. User stories from spec.md are already implemented - this task list focuses on infrastructure changes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Not applicable - these are infrastructure tasks, not user story tasks
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/api/` (backend), `apps/web/` (frontend)
- **Monorepo**: `packages/` for shared code
- **Deployment files**: Repository root (`ecosystem.config.js`, `deploy.sh`, etc.)

## Phase 1: Setup & Infrastructure Configuration

**Purpose**: Configure native deployment infrastructure and replace Docker-specific configurations

**⚠️ CRITICAL**: Phase 1 must be complete before Phase 2 verification can begin

### 1.1 PM2 Ecosystem Configuration

- [X] T001 [P] Create PM2 ecosystem configuration file at repository root `ecosystem.config.js` with process definitions for Django API (Gunicorn), Celery worker, Celery beat, and frontend static server
- [X] T002 [P] Configure PM2 process dependencies and startup order in `ecosystem.config.js` (API waits for DB, workers wait for Redis/RabbitMQ)
- [X] T003 [P] Configure PM2 logging and auto-restart policies in `ecosystem.config.js` (log paths, rotation, max restarts, autorestart settings)
- [X] T004 [P] Configure PM2 environment variable loading in `ecosystem.config.js` (development and production environments)

### 1.2 Deployment Scripts

- [X] T005 [P] Create Digital Ocean deployment script `deploy.sh` at repository root with steps: pull latest code, install dependencies, run migrations, build frontend, collect static files, restart PM2
- [X] T006 [P] Create initial server setup script `setup-server.sh` at repository root with system dependencies installation (Node.js 22+, Python 3.12, Redis, RabbitMQ, PM2, Nginx optional)
- [X] T007 [P] Update root `.env.example` file with native deployment environment variables (remove Docker-specific vars, add REDIS_URL, RABBITMQ_URL for local services)
- [X] T008 [P] Update `apps/api/.env.example` file with native deployment variables matching root `.env.example`
- [X] T009 [P] Add deployment script documentation and usage instructions to deployment scripts (comments in scripts, README sections)

### 1.3 Entrypoint Script Updates

- [X] T010 [P] Review `apps/api/bin/docker-entrypoint-api-local.sh` and identify Docker-specific commands to remove or adapt
- [X] T011 [P] Create or update `apps/api/bin/entrypoint-api.sh` for native execution (remove Docker wait commands, adapt machine signature generation for native hosts)
- [X] T012 [P] Review `apps/api/bin/docker-entrypoint-worker.sh` and create native equivalent `apps/api/bin/entrypoint-worker.sh`
- [X] T013 [P] Review `apps/api/bin/docker-entrypoint-beat.sh` and create native equivalent `apps/api/bin/entrypoint-beat.sh`
- [X] T014 [P] Review `apps/api/bin/docker-entrypoint-migrator.sh` and create native equivalent `apps/api/bin/entrypoint-migrator.sh`
- [X] T015 [P] Update machine signature generation in entrypoint scripts to work with native Linux/Mac hostnames and network interfaces (remove Docker-specific detection)

### 1.4 Infrastructure Service Configuration

- [X] T016 [P] Create `DEPLOYMENT.md` guide at `specs/001-family-management/DEPLOYMENT.md` with Redis installation instructions for Ubuntu 22.04 (apt install, systemd enable, configuration)
- [X] T017 [P] Add RabbitMQ installation instructions to `DEPLOYMENT.md` (apt install, systemd enable, default vhost configuration)
- [X] T018 [P] Document systemd service auto-start configuration in `DEPLOYMENT.md` (enable Redis and RabbitMQ to start on boot)
- [X] T019 [P] Document Nginx optional configuration in `DEPLOYMENT.md` (reverse proxy setup, SSL with Let's Encrypt, static file serving)
- [X] T020 [P] Add connection string examples for local services in `DEPLOYMENT.md` (REDIS_URL=redis://localhost:6379/0, RabbitMQ default connection)
- [X] T021 [P] Document PM2 systemd integration in `DEPLOYMENT.md` (pm2 startup command, systemd service configuration)

### 1.5 Database Configuration

- [X] T022 [P] Verify `apps/api/plane/settings/supabase.py` configuration works without Docker network (test connection string parsing, SSL mode handling)
- [X] T023 [P] Test Supabase database connection from native environment (create test script or manual verification)
- [X] T024 [P] Verify environment variable loading for Supabase config in native deployment (SUPABASE_DB_URL, SUPABASE_URL, SUPABASE_PROJECT_REF, SUPABASE_ANON_KEY)
- [X] T025 [P] Update `.env.example` files with Supabase connection documentation (connection string format, where to find credentials)

### 1.6 Update Agent Context

- [X] T026 Update agent context file by running `.specify/scripts/bash/update-agent-context.sh claude` to add PM2 and Digital Ocean deployment context

---

## Phase 2: Foundational Infrastructure (Re-implementation Verification)

**Purpose**: Ensure all foundational components work in native deployment environment

**⚠️ CRITICAL**: Phase 2 verification ensures existing features continue to work after infrastructure changes

### 2.1 Verify Core Models

- [X] T027 [P] Test Family model queries in native environment (verify Supabase connection, test CRUD operations)
- [X] T028 [P] Test FamilyMember model queries in native environment (verify relationships, test role-based access patterns)
- [X] T029 [P] Run database migrations in native environment and verify all FamilyFlow models are created correctly (`python manage.py migrate`)
- [X] T030 [P] Verify Supabase RLS policies are correctly applied by testing family-level data isolation with native database connection
- [X] T031 [P] Test model relationships and queries (Family → FamilyMembers, Family → BacklogItems, etc.) in native environment

### 2.2 Verify API Endpoints

- [X] T032 [P] Test Family API endpoints in native environment (`/api/families/` - list, create, retrieve, update)
- [X] T033 [P] Test FamilyMember API endpoints in native environment (`/api/families/<id>/members/` - list, create, update)
- [X] T034 [P] Test BacklogItem API endpoints in native environment (`/api/families/<id>/backlog/` - list, create, update, delete, reorder)
- [X] T035 [P] Verify authentication and authorization work correctly with native API server (test parent/child permissions)
- [X] T036 [P] Test API error handling and validation in native environment (invalid requests, missing permissions, etc.)

### 2.3 Verify Frontend Services

- [X] T037 [P] Test frontend build process in native environment (`pnpm build` - verify build completes successfully)
- [X] T038 [P] Verify frontend API service calls work with native backend (test API_BASE_URL configuration, CORS settings if needed)
- [X] T039 [P] Test MobX stores and reactivity in native deployment (verify stores connect to API, state updates correctly)
- [X] T040 [P] Test frontend components render correctly when connecting to native backend (BacklogList, BacklogItemCard, etc.)
- [X] T041 [P] Verify frontend can access API endpoints without Docker network issues (test from browser dev tools)

### 2.4 Process Integration Testing

- [X] T042 Test PM2 startup with `pm2 start ecosystem.config.js --env development` and verify all processes start (API, worker, beat, frontend)
- [X] T043 Verify PM2 process auto-restart on failure (intentionally crash a process, verify it restarts)
- [X] T044 Test PM2 logging (verify logs are written to `~/.pm2/logs/`, check log rotation works)
- [X] T045 Test PM2 graceful reload (`pm2 reload all` - verify zero-downtime reload works)
- [X] T046 Test PM2 shutdown (`pm2 stop all` - verify all processes stop cleanly)
- [X] T047 Verify PM2 process monitoring (`pm2 monit` - check CPU/memory usage displays correctly)

### 2.5 Deployment Validation

- [X] T048 Test full deployment script `deploy.sh` execution on local machine or test droplet (verify all steps complete successfully)
- [X] T049 Verify single command startup works: `pm2 start ecosystem.config.js --env production` starts all services correctly
- [X] T050 Test deployment on Digital Ocean droplet (provision droplet, run `setup-server.sh`, run `deploy.sh`, verify application works)
- [X] T051 Verify PM2 auto-start on server boot (test systemd integration, server restart, PM2 processes start automatically)
- [X] T052 Update `DEPLOYMENT.md` with verified deployment steps and troubleshooting section based on actual deployment experience
- [X] T053 Verify production environment configuration (SECRET_KEY, DEBUG=False, ALLOWED_HOSTS, SSL configuration if using Nginx)

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and documentation updates

- [X] T054 [P] Update `quickstart.md` with verified native deployment instructions (remove outdated Docker steps, add PM2 instructions)
- [X] T055 [P] Add PM2 troubleshooting section to `DEPLOYMENT.md` (common issues, log locations, restart procedures)
- [X] T056 [P] Create or update README.md deployment section with single-command execution instructions
- [X] T057 [P] Document local development workflow with PM2 in `DEPLOYMENT.md` or README (development vs production PM2 configs)
- [X] T058 [P] Add security hardening notes to `DEPLOYMENT.md` (firewall configuration, SSH key setup, non-root user execution)
- [X] T059 [P] Verify all environment variables are documented in `.env.example` files with clear descriptions
- [X] T060 [P] Update any CI/CD documentation to reference new deployment process (if CI/CD exists or is planned)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational Verification (Phase 2)**: Depends on Phase 1 completion - BLOCKS production deployment validation
- **Polish (Phase 3)**: Depends on Phase 2 completion - final documentation and cleanup

### Within Phase 1

- **PM2 Configuration (1.1)**: No dependencies - can start immediately
- **Deployment Scripts (1.2)**: Can run in parallel with 1.1
- **Entrypoint Scripts (1.3)**: Can run in parallel, but should reference PM2 requirements from 1.1
- **Infrastructure Config (1.4)**: Can run in parallel
- **Database Config (1.5)**: Can run in parallel (Supabase already configured)
- **Agent Context (1.6)**: Should run after other Phase 1 tasks complete

### Within Phase 2

- **Core Models (2.1)**: Can run in parallel after Phase 1
- **API Endpoints (2.2)**: Can run in parallel with 2.1
- **Frontend Services (2.3)**: Can run in parallel with 2.1, 2.2
- **Process Integration (2.4)**: Depends on PM2 config (Phase 1.1) and requires API/workers running
- **Deployment Validation (2.5)**: Depends on all previous Phase 2 tasks

### Parallel Opportunities

- Most Phase 1 tasks can run in parallel (T001-T025 marked with [P])
- Phase 2 verification tasks (T027-T041) can run in parallel
- Phase 3 tasks (T054-T060) can run in parallel after Phase 2

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all Phase 1 configuration tasks together:
Task: "Create PM2 ecosystem configuration file ecosystem.config.js"
Task: "Create Digital Ocean deployment script deploy.sh"
Task: "Create initial server setup script setup-server.sh"
Task: "Create DEPLOYMENT.md guide with Redis installation instructions"
Task: "Verify apps/api/plane/settings/supabase.py configuration works"

# These can all run simultaneously as they touch different files
```

---

## Implementation Strategy

### MVP First (Infrastructure Only)

1. Complete Phase 1: Setup (PM2 config, scripts, documentation)
2. Complete Phase 2: Foundational verification (ensure existing features work)
3. **STOP and VALIDATE**: Test single-command startup locally
4. Deploy to Digital Ocean droplet if ready

### Incremental Delivery

1. Complete Phase 1.1 (PM2 config) → Test locally with `pm2 start`
2. Complete Phase 1.2 (Deployment scripts) → Test `deploy.sh` locally
3. Complete Phase 1.3-1.6 (Entrypoint scripts, docs, verification) → Full local setup
4. Complete Phase 2.1-2.4 (Verification) → Local validation complete
5. Complete Phase 2.5 (Deployment validation) → Production deployment tested
6. Complete Phase 3 (Polish) → Documentation complete

### Testing Strategy

- **Local Testing**: Test all Phase 1 and Phase 2 tasks on local machine first
- **Droplet Testing**: Only T048-T052 require actual Digital Ocean droplet
- **Rollback Plan**: Docker configuration remains - can revert if needed
- **Verification**: Each Phase 2 task verifies existing functionality still works

---

## Notes

- [P] tasks = different files, no dependencies
- All Phase 1 tasks can proceed in parallel (marked with [P])
- Phase 2 verification tasks test that existing features (already implemented) still work
- No user story tasks needed - user stories are already implemented, this is infrastructure only
- Commit after each task or logical group
- Test locally before deploying to droplet
- Keep Docker configuration files for reference (no need to delete)

---

## Success Criteria

After completing all tasks:

1. ✅ Application runs with single command: `pm2 start ecosystem.config.js`
2. ✅ All services (API, workers, frontend) start and run correctly
3. ✅ Database connections work (Supabase verified)
4. ✅ Infrastructure services (Redis, RabbitMQ) are available as system services
5. ✅ Deployment script (`deploy.sh`) successfully updates application
6. ✅ Process monitoring and auto-restart work correctly
7. ✅ Logging is accessible via PM2
8. ✅ No Docker dependencies required for production deployment
