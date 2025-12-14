# Quickstart Guide: FamilyFlow Implementation

**Feature**: FamilyFlow - Agile Home Management  
**Date**: 2025-12-12 | **Updated**: 2025-01-27 (Native Deployment)

## Overview

This guide provides a quick start for implementing FamilyFlow, transforming the Plane application into a family-oriented SCRUM management system. The implementation maintains the existing monorepo architecture while refactoring domain models and adding family-specific features. **This version supports native (non-Docker) deployment on Digital Ocean droplets with single-command execution via PM2.**

## Prerequisites

**Local Development**:
- Node.js >= 22.18.0
- Python 3.12
- pnpm 10.24.0+
- Redis (install via Homebrew: `brew install redis` or `apt install redis-server`)
- PM2 (install globally: `npm install -g pm2`)

**Production Deployment (Digital Ocean)**:
- Digital Ocean droplet (Ubuntu 22.04 LTS recommended)
- Supabase account and project
- SSH access to droplet

## Setup Steps

### 1. Database Setup (Supabase)

1. Create a new Supabase project or use existing one
2. Get connection string from Supabase dashboard:
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
   ```
3. Get Supabase project details:
   - Project Reference ID (for RLS policies)
   - Anon Key
   - Service Role Key (optional, for admin operations)

### 2. Local Development Setup

1. **Install System Dependencies**:
   ```bash
   # macOS (Homebrew)
   brew install redis
   brew services start redis
   
   # Linux (Ubuntu/Debian)
   sudo apt update
   sudo apt install redis-server
   sudo systemctl start redis
   sudo systemctl enable redis
   ```

2. **Install Application Dependencies**:
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Install project dependencies
   pnpm install
   ```

3. **Configure Local Environment**:
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Update apps/api/.env with:
   # - SUPABASE_DB_URL (your Supabase connection string)
   # - SUPABASE_URL (https://xxx.supabase.co)
   # - SUPABASE_PROJECT_REF
   # - SUPABASE_ANON_KEY
   # - REDIS_URL=redis://localhost:6379/0 (for caching and Celery broker)
   # - SECRET_KEY (generate a Django secret key)
   ```

4. **Run Database Migrations**:
   ```bash
   cd apps/api
   python manage.py migrate
   ```

5. **Start Development Servers**:
   ```bash
   # Option A: Use PM2 (single command)
   pm2 start ecosystem.config.js --env development
   
   # Option B: Use pnpm dev (if configured for native services)
   pnpm dev
   
   # View PM2 status
   pm2 status
   pm2 logs
   ```

### 3. Production Deployment (Digital Ocean)

**See `DEPLOYMENT.md` for detailed deployment guide. Quick start:**

1. **Provision Digital Ocean Droplet**:
   - Create Ubuntu 22.04 LTS droplet
   - Minimum: 2 CPU, 4GB RAM
   - Recommended: 4 CPU, 8GB RAM

2. **Initial Server Setup** (run `setup-server.sh`):
   ```bash
   # On your local machine
   scp setup-server.sh root@your-droplet-ip:/root/
   ssh root@your-droplet-ip
   chmod +x setup-server.sh
   ./setup-server.sh
   ```

3. **Deploy Application**:
   ```bash
   # SSH into droplet
   ssh your-user@your-droplet-ip
   
   # Clone repository
   git clone your-repo-url
   cd scrumfamily
   
   # Copy environment template
   cp apps/api/.env.example apps/api/.env
   # Edit .env with production values (use nano/vim)
   nano apps/api/.env
   
   # Run deployment script
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Start Application**:
   ```bash
   # Start all services with PM2
   pm2 start ecosystem.config.js --env production
   
   # Save PM2 configuration to auto-start on boot
   pm2 save
   pm2 startup
   # Follow instructions to enable systemd integration
   ```

5. **Verify Deployment**:
   ```bash
   pm2 status
   pm2 logs
   curl http://localhost:8000/api/health  # Test API
   ```

## Implementation Order

### Phase 1: Database & Models (Foundation)

1. **Create Django Models** (`apps/api/plane/db/models/`):
   - Start with `family.py`, `family_member.py`
   - Then `backlog_item.py`, `sprint.py`, `task.py`
   - Finally `standup_entry.py`, `retrospective.py`, `achievement.py`

2. **Create Migrations**:
   ```bash
   cd apps/api
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Configure Supabase RLS Policies**:
   - Enable RLS on all tables
   - Create policies for family-level isolation
   - Test policies with Django ORM queries

### Phase 2: API Endpoints (Backend)

1. **Create Serializers** (`apps/api/plane/app/serializers/`):
   - `FamilySerializer`, `FamilyMemberSerializer`
   - `BacklogItemSerializer`, `SprintSerializer`, `TaskSerializer`
   - `StandupEntrySerializer`, `RetrospectiveSerializer`

2. **Create ViewSets** (`apps/api/plane/app/views/`):
   - Follow existing Plane ViewSet patterns
   - Use Django REST Framework ViewSets
   - Implement filtering, pagination, ordering

3. **Update URL Routing**:
   - Add new routes to `apps/api/plane/urls.py`
   - Follow RESTful conventions

4. **Test API Endpoints**:
   ```bash
   cd apps/api
   pytest plane/app/views/
   ```

### Phase 3: Frontend Models & Services

1. **Create TypeScript Types** (`packages/types/src/`):
   - Add FamilyFlow type definitions
   - Match API response schemas

2. **Create API Services** (`packages/services/src/`):
   - `family.service.ts`
   - `backlog.service.ts`
   - `sprint.service.ts`
   - `standup.service.ts`

3. **Create MobX Stores** (`packages/shared-state/src/store/` or `apps/web/core/store/`):
   - `backlog.store.ts`
   - `sprint.store.ts`
   - `standup.store.ts`
   - `gamification.store.ts`

### Phase 4: UI Components (Frontend)

1. **Backlog Management** (`apps/web/core/components/backlog/`):
   - Backlog list component
   - Create/edit backlog item form
   - Category filtering

2. **Sprint Planning** (`apps/web/core/components/sprint-board/`):
   - Sprint creation form
   - Sprint board with swim lanes
   - Task drag-and-drop
   - Story point assignment

3. **Sprint Board** (`apps/web/core/components/sprint-board/`):
   - Visual board component
   - Workflow state columns
   - Task cards
   - Real-time updates (Supabase Realtime)

4. **Burndown Charts** (`apps/web/core/components/burndown/`):
   - Chart component (use Recharts)
   - Data aggregation from sprint tasks
   - Ideal vs actual burndown line

5. **Standups** (`apps/web/core/components/standup/`):
   - Daily standup form
   - Standup summary view
   - Standup history

6. **Kid-Friendly Interface** (`apps/web/core/components/kids/`):
   - Simplified navigation
   - Task list for children
   - Achievement display
   - Gamification UI

### Phase 5: Real-time Integration

1. **Supabase Realtime Setup**:
   - Install Supabase JS client in frontend
   - Subscribe to task changes
   - Update MobX stores on changes

2. **Test Real-time Updates**:
   - Open multiple browser tabs
   - Update task state in one tab
   - Verify updates in other tabs

### Phase 6: Gamification

1. **Achievement System**:
   - Implement achievement calculation logic
   - Create badge icons/assets
   - Display achievements in UI

2. **Points & Rewards**:
   - Calculate points on task completion
   - Display points in child interface
   - Configure reward thresholds

## Testing Strategy

### Backend Tests

```bash
cd apps/api
pytest plane/db/models/test_family.py
pytest plane/app/views/test_backlog.py
```

### Frontend Tests

```bash
pnpm test -- apps/web/core/components/backlog
```

### Integration Tests

Test full user flows:
1. Create family → Add members → Create backlog → Plan sprint → Track progress

## Key Files to Create/Modify

### Backend (Django)

- `apps/api/plane/db/models/family.py` - NEW
- `apps/api/plane/db/models/backlog_item.py` - NEW
- `apps/api/plane/db/models/sprint.py` - NEW
- `apps/api/plane/app/serializers/family.py` - NEW
- `apps/api/plane/app/views/family/` - NEW
- `apps/api/plane/settings/supabase.py` - NEW (Supabase config)

### Frontend (React)

- `packages/types/src/family.ts` - NEW (TypeScript types)
- `packages/services/src/family/` - NEW (API services)
- `apps/web/core/store/backlog.store.ts` - NEW (MobX store)
- `apps/web/core/components/backlog/` - NEW (UI components)
- `apps/web/core/components/sprint-board/` - NEW (UI components)

### Configuration

- `railway.toml` - NEW (Railway service config)
- `.env.example` - UPDATE (add Supabase vars)

## Common Patterns

### Creating a Model

1. Create model in `apps/api/plane/db/models/`
2. Add to `apps/api/plane/db/models/__init__.py`
3. Run `makemigrations`
4. Create migration file
5. Review migration, then `migrate`

### Creating an API Endpoint

1. Create serializer in `apps/api/plane/app/serializers/`
2. Create ViewSet in `apps/api/plane/app/views/`
3. Register route in `apps/api/plane/urls.py`
4. Create tests
5. Update OpenAPI spec

### Creating a Frontend Component

1. Create TypeScript types in `packages/types/`
2. Create API service in `packages/services/`
3. Create MobX store (if needed)
4. Create component in `apps/web/core/components/`
5. Add route in `apps/web/app/routes.ts`

## Deployment Checklist

- [ ] Supabase database configured
- [ ] Digital Ocean droplet provisioned
- [ ] System services installed (Redis for caching and Celery broker)
- [ ] PM2 installed and configured
- [ ] Environment variables configured (`.env` file)
- [ ] Database migrations run
- [ ] Application builds successfully
- [ ] All PM2 processes running
- [ ] API endpoints tested
- [ ] Frontend accessible
- [ ] Real-time updates working
- [ ] Tests passing
- [ ] PM2 auto-start configured (systemd)

## Troubleshooting

### Database Connection Issues

- Verify Supabase connection string format
- Check SSL mode (`sslmode=require`)
- Ensure IP allowlist includes Railway IPs

### Real-time Not Working

- Verify Supabase Realtime is enabled for tables
- Check RLS policies allow read access
- Verify frontend Supabase client configuration

### PM2 Process Issues

- Check process status: `pm2 status`
- View logs: `pm2 logs [process-name]`
- Restart processes: `pm2 restart all`
- Check process monitoring: `pm2 monit`

### Digital Ocean Deployment Issues

- Verify system services are running: `sudo systemctl status redis`
- Check firewall rules: `sudo ufw status`
- Verify environment variables: `cat apps/api/.env`
- Check PM2 startup: `pm2 startup` and follow instructions
- View system logs: `journalctl -u pm2-*`
- Check PM2 process status: `pm2 status`
- View PM2 logs: `pm2 logs [process-name]`
- Restart PM2 processes: `pm2 restart all`

### Database Connection Issues

- Verify Supabase connection string format
- Check SSL mode (`sslmode=require`)
- Ensure IP allowlist includes Digital Ocean droplet IP
- Test connection: `psql $SUPABASE_DB_URL`

## Next Steps

After completing implementation:

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Implement tasks in priority order (P1 → P2 → P3)
3. Test each user story independently
4. Deploy to Railway staging environment
5. Conduct user acceptance testing

## Resources

- [Supabase Django Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Digital Ocean Droplet Setup](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-22-04)
- [Django REST Framework Docs](https://www.django-rest-framework.org/)
- [React Router v7 Docs](https://reactrouter.com/)
- [MobX Documentation](https://mobx.js.org/README.html)
- [Redis Documentation](https://redis.io/docs/)

