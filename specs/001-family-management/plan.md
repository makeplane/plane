# Implementation Plan: Un-Dockerize FamilyFlow for Single-Command Deployment

**Branch**: `001-family-management` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: User requirement to un-dockerize the application so it can run with a single command on a Digital Ocean droplet, with Supabase as the database. This requires redoing Phase 1 (Setup) and Phase 2 (Foundational infrastructure).

## Summary

Transform FamilyFlow from a Docker-based deployment to a native single-command deployment suitable for Digital Ocean droplets. The application will run all services (Django API, Celery workers, frontend) via PM2 process manager, with infrastructure services (Redis, RabbitMQ) as system services. Database remains Supabase (cloud-hosted PostgreSQL). The goal is to enable deployment and startup with a single command (`pm2 start ecosystem.config.js`) while maintaining all existing functionality and ensuring production-ready process management.

**Key Changes**:
- Replace Docker Compose with PM2 ecosystem configuration
- Configure system services for Redis and RabbitMQ
- Create deployment scripts for Digital Ocean droplet
- Update environment configuration for native deployment
- Remove Docker-specific dependencies and entrypoint scripts

## Technical Context

**Language/Version**: Python 3.12 (Django backend), TypeScript 5.8.3 (React frontend), Node.js >=22.18.0  
**Primary Dependencies**: Django 4.2.27, Django REST Framework 3.15.2, React 18.3.1, React Router 7.9.5, MobX 6.12.0, Vite 7.1.11, Turborepo 2.6.3, PM2 (new), Gunicorn, Celery  
**Storage**: Supabase (PostgreSQL-compatible database, cloud-hosted), Supabase Storage (object storage)  
**Infrastructure Services**: Redis (local system service), RabbitMQ (local system service), Nginx (optional, for reverse proxy/SSL)  
**Testing**: pytest 7.4.0 (backend), Vitest (frontend), pytest-django 4.5.2  
**Target Platform**: Digital Ocean droplet (Ubuntu 22.04 LTS), Linux server, Web browsers (frontend)  
**Project Type**: Web application (monorepo with frontend and backend)  
**Performance Goals**: Support 2-10 family members per family, sub-5 second load times, real-time task state updates within 2 seconds, handle 50+ backlog items per family  
**Constraints**: Must run with single command, no Docker overhead, maintain existing code structure, use Supabase for database, support Digital Ocean droplet deployment  
**Scale/Scope**: Multiple families (each with 2-10 members), up to 100 concurrent families, unlimited backlog items and sprints per family

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Compliance Checks

1. **Type Safety First**: No changes to TypeScript/React code structure - all existing type safety maintained
2. **Monorepo Architecture**: Maintains Turborepo structure - no changes to workspace organization
3. **Component-Based Development**: No changes to React component patterns
4. **State Management Discipline**: No changes to MobX store patterns
5. **API Design Standards**: No changes to Django REST Framework patterns
6. **Database Optimization**: ✅ **Supabase maintained** - continues using Supabase as required by constitution
7. **Testing Requirements**: Existing test structure maintained - add tests for deployment scripts
8. **Security First**: Environment variables, authentication patterns unchanged - add server security considerations
9. **Code Style Consistency**: No code changes - only deployment/infrastructure configuration
10. **Performance Standards**: Same performance goals - no degradation expected (potentially improved without Docker overhead)
11. **Accessibility Requirements**: No UI changes - requirements maintained
12. **Error Handling**: No changes to error handling patterns
13. **Deployment Platform**: ⚠️ **CHANGE REQUIRED** - Constitution specifies Railway, but user requests Digital Ocean. This requires justification.

### ⚠️ Constitution Violation - Requires Justification

**Violation**: Constitution Principle XIII specifies "Applications MUST be deployed to Railway", but user explicitly requests Digital Ocean droplet deployment.

**Justification**: 
- User has specific requirement for Digital Ocean deployment (explicit user input)
- Digital Ocean provides simpler, more cost-effective single-server deployment
- No code changes required - only deployment configuration changes
- Constitution can be amended to support multiple deployment targets
- Railway deployment configuration can remain for future use

**Resolution**: Accept this violation with explicit documentation. Railway configuration remains in codebase for future use, but primary deployment target becomes Digital Ocean for this implementation.

**Status**: ✅ **APPROVED** - Violation is justified by explicit user requirement. Railway remains as alternative deployment option.

## Project Structure

### Documentation (this feature)

```text
specs/001-family-management/
├── plan.md              # This file (updated for un-dockerization)
├── research.md          # Phase 0 output (updated for deployment strategy)
├── data-model.md        # Phase 1 output (no changes - data model unchanged)
├── quickstart.md        # Phase 1 output (updated with native deployment instructions)
├── contracts/           # Phase 1 output (no changes - API contracts unchanged)
├── tasks.md             # Phase 2 output (updated with un-dockerization tasks)
└── DEPLOYMENT.md        # NEW: Digital Ocean deployment guide
```

### Source Code (repository root)

```text
# Existing monorepo structure maintained
apps/
├── api/                 # Django backend (no structural changes)
│   ├── plane/
│   ├── bin/             # Entrypoint scripts (update for native execution)
│   └── manage.py
├── web/                 # React frontend (no structural changes)
└── ...

packages/                # Shared packages (no changes)
├── ui/
├── types/
└── ...

# NEW: Deployment configuration files
ecosystem.config.js      # PM2 process configuration
deploy.sh                # Digital Ocean deployment script
setup-server.sh          # Initial server setup script
.env.example             # Updated environment variable template
```

**Structure Decision**: Monorepo structure remains unchanged. New deployment files added at repository root. No changes to application code structure - only deployment/infrastructure configuration.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Digital Ocean instead of Railway | User explicitly requires Digital Ocean droplet deployment for single-command execution and cost optimization | Railway deployment is maintained as alternative, but doesn't meet user's single-server, single-command requirement |

## Phase 0: Research & Discovery ✅

**Status**: Complete

**Research Areas**:
1. ✅ Single-command process management (PM2 selected)
2. ✅ Infrastructure services (Redis, RabbitMQ as system services)
3. ✅ Digital Ocean deployment strategy
4. ✅ Environment configuration management
5. ✅ Build and deployment automation
6. ✅ Service startup dependencies
7. ✅ Logging and monitoring
8. ✅ Security considerations

**Output**: `research.md` updated with un-dockerization strategy

## Phase 1: Setup & Infrastructure Configuration

**Purpose**: Configure native deployment infrastructure and replace Docker-specific configurations

### 1.1 PM2 Ecosystem Configuration

**Tasks**:
- Create `ecosystem.config.js` at repository root
- Configure PM2 to manage:
  - Django API server (Gunicorn)
  - Celery worker
  - Celery beat scheduler
  - Frontend static file server (or document Nginx configuration)
- Set up process dependencies and startup order
- Configure logging and auto-restart policies

**Deliverables**:
- `ecosystem.config.js` - PM2 process configuration

### 1.2 Deployment Scripts

**Tasks**:
- Create `deploy.sh` - Update deployment script for Digital Ocean
- Create `setup-server.sh` - Initial server setup script
- Update `.env.example` with native deployment variables
- Remove Docker-specific environment variables

**Deliverables**:
- `deploy.sh` - Automated deployment script
- `setup-server.sh` - Server initialization script
- Updated `.env.example` - Environment variable template

### 1.3 Entrypoint Script Updates

**Tasks**:
- Review `apps/api/bin/docker-entrypoint-*.sh` scripts
- Create native equivalents or adapt for PM2 execution
- Ensure all Django management commands work without Docker context
- Update machine signature generation for native environments

**Deliverables**:
- Updated or new entrypoint scripts for native execution
- Documentation of script changes

### 1.4 Infrastructure Service Configuration

**Tasks**:
- Document Redis installation and configuration
- Document RabbitMQ installation and configuration
- Update connection strings for local services
- Configure systemd services for Redis/RabbitMQ auto-start

**Deliverables**:
- `DEPLOYMENT.md` - Deployment guide with infrastructure setup instructions

### 1.5 Database Configuration

**Tasks**:
- Verify Supabase connection configuration (already done in Phase 1 of original plan)
- Ensure `apps/api/plane/settings/supabase.py` works in native deployment
- Test database connection from native environment
- Update environment variable documentation

**Deliverables**:
- Verified Supabase connection (no changes needed - already configured)

### 1.6 Update Agent Context

**Tasks**:
- Run `.specify/scripts/bash/update-agent-context.sh claude`
- Add PM2, Digital Ocean deployment context
- Update deployment platform references

**Deliverables**:
- Updated `CLAUDE.md` or agent-specific context file

**Phase 1 Output**: `ecosystem.config.js`, `deploy.sh`, `setup-server.sh`, updated `.env.example`, `DEPLOYMENT.md`, updated agent context

## Phase 2: Foundational Infrastructure (Re-implementation)

**Purpose**: Ensure all foundational components work in native deployment environment

### 2.1 Verify Core Models

**Tasks**:
- Verify Family and FamilyMember models work with Supabase
- Test database migrations in native environment
- Ensure RLS policies are correctly applied
- Test model queries and relationships

**Deliverables**:
- Verified models working with native deployment (no code changes expected)

### 2.2 Verify API Endpoints

**Tasks**:
- Test all API endpoints in native environment
- Verify authentication/authorization works
- Test serializers and ViewSets
- Ensure proper error handling

**Deliverables**:
- Verified API working (no code changes expected)

### 2.3 Verify Frontend Services

**Tasks**:
- Test frontend build process
- Verify API service calls work with native backend
- Test MobX stores and reactivity
- Ensure frontend can connect to backend API

**Deliverables**:
- Verified frontend working (no code changes expected)

### 2.4 Process Integration Testing

**Tasks**:
- Test PM2 startup and shutdown
- Verify all processes start correctly
- Test process auto-restart on failure
- Verify logging works correctly
- Test graceful reloads

**Deliverables**:
- Working PM2 configuration with all processes running

### 2.5 Deployment Validation

**Tasks**:
- Test full deployment on Digital Ocean droplet
- Verify all services start with single command
- Test deployment script end-to-end
- Verify production environment configuration

**Deliverables**:
- Validated deployment process
- Updated `DEPLOYMENT.md` with verified instructions

**Phase 2 Output**: Validated native deployment with all foundational components working

## Implementation Strategy

### Development Workflow

1. **Local Development**:
   - Install Redis and RabbitMQ locally (via Homebrew on macOS or apt on Linux)
   - Use `pm2 start ecosystem.config.js --env development`
   - Frontend runs via `pnpm dev` (or PM2 can manage it)

2. **Production Deployment**:
   - Follow `DEPLOYMENT.md` guide
   - Run `setup-server.sh` on fresh Digital Ocean droplet
   - Run `deploy.sh` for updates
   - PM2 manages all processes automatically

### Migration Path

**From Docker to Native**:
1. Complete Phase 1 (PM2 configuration, scripts)
2. Test locally with native services
3. Deploy to Digital Ocean droplet
4. Verify all functionality works
5. Remove Docker-specific files (optional - keep for reference)

**Rollback Plan**:
- Docker configuration remains in repository
- Can switch back to Docker deployment if needed
- No code changes means rollback is configuration-only

### Testing Strategy

- **Unit Tests**: No changes - existing tests work as-is
- **Integration Tests**: Update to work without Docker network
- **Deployment Tests**: Test deployment script on fresh droplet
- **Smoke Tests**: Verify all services start and respond correctly

## Success Criteria

1. ✅ Application runs with single command: `pm2 start ecosystem.config.js`
2. ✅ All services (API, workers, frontend) start and run correctly
3. ✅ Database connections work (Supabase)
4. ✅ Infrastructure services (Redis, RabbitMQ) are available
5. ✅ Deployment script successfully sets up fresh droplet
6. ✅ Process monitoring and auto-restart work correctly
7. ✅ Logging is accessible and useful
8. ✅ No Docker dependencies remain for production deployment

## Dependencies & Execution Order

### Phase 1 Dependencies

- **1.1 PM2 Configuration**: No dependencies - can start immediately
- **1.2 Deployment Scripts**: Can run in parallel with 1.1
- **1.3 Entrypoint Scripts**: Depends on understanding PM2 requirements (after 1.1)
- **1.4 Infrastructure Config**: Can run in parallel
- **1.5 Database Config**: Already complete - just verification
- **1.6 Agent Context**: After all other Phase 1 tasks

### Phase 2 Dependencies

- **2.1-2.3 Verification**: Can run in parallel after Phase 1 complete
- **2.4 Process Integration**: Depends on all Phase 1 tasks
- **2.5 Deployment Validation**: Depends on all previous tasks

### Parallel Opportunities

- Most Phase 1 tasks can run in parallel (1.1, 1.2, 1.4)
- Phase 2 verification tasks (2.1, 2.2, 2.3) can run in parallel
- Only deployment validation (2.5) requires sequential execution

## Next Steps

1. Complete Phase 1 tasks (PM2 config, scripts, documentation)
2. Complete Phase 2 verification and validation
3. Deploy to Digital Ocean droplet
4. Update `quickstart.md` with native deployment instructions
5. Generate tasks via `/speckit.tasks` for detailed implementation checklist
