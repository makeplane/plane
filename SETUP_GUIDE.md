# 🚀 Plane - Local Development Setup Guide

Complete guide to set up and run Plane on your local machine for development and testing.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Requirements](#system-requirements)
3. [Prerequisites Installation](#prerequisites-installation)
4. [Project Setup](#project-setup)
5. [Running the Application](#running-the-application)
6. [Accessing the Application](#accessing-the-application)
7. [Troubleshooting](#troubleshooting)
8. [Development Workflow](#development-workflow)
9. [Architecture Overview](#architecture-overview)
10. [Key Features](#key-features)

---

## 🎯 Project Overview

**Plane** is an open-source, modern project management platform built with:

- **Frontend**: React 18 + React Router 7 + Vite
- **Backend**: Django 4.2 + Django REST Framework
- **Database**: PostgreSQL 15
- **Cache**: Redis (Valkey)
- **Queue**: RabbitMQ + Celery
- **Real-time**: Node.js + Hocuspocus (Yjs)
- **Storage**: MinIO (S3-compatible)

**Key Capabilities**:
- Issue tracking with rich text editor
- Sprint/Cycle management
- Modules and Views
- Real-time collaboration
- Analytics and insights
- Multi-workspace support

---

## 💻 System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **RAM** | 12 GB (minimum) - 16 GB recommended |
| **CPU** | 4 cores (8 recommended) |
| **Storage** | 20 GB free space |
| **OS** | Windows 10/11, macOS, Linux |

> ⚠️ **Warning**: Systems with only 8 GB RAM may experience failures during Docker builds or runtime crashes.

### Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | ≥ 22.18.0 | Frontend and Live server |
| **pnpm** | 10.21.0 | Package manager |
| **Docker Desktop** | Latest | Container runtime |
| **Git** | Latest | Version control |
| **Python** | 3.8+ | Backend development (optional) |

---

## 📦 Prerequisites Installation

### Windows Setup

#### 1. Install Node.js

1. Download Node.js v22.18.0+ from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. Verify installation:
   ```powershell
   node --version  # Should be v22.18.0 or higher
   npm --version
   ```

#### 2. Install Docker Desktop

1. Download from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Install and restart your computer
3. Start Docker Desktop
4. Verify installation:
   ```powershell
   docker --version
   docker compose version
   ```

#### 3. Install Git

1. Download from [git-scm.com](https://git-scm.com/)
2. Install with default settings
3. Verify:
   ```powershell
   git --version
   ```

#### 4. Enable pnpm

```powershell
corepack enable
corepack prepare pnpm@10.21.0 --activate
pnpm --version
```

### macOS Setup

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@22

# Install Docker Desktop (download from docker.com)
# Or use Colima:
brew install colima docker docker-compose
colima start

# Enable pnpm
corepack enable
corepack prepare pnpm@10.21.0 --activate
```

### Linux (Ubuntu/Debian) Setup

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Enable pnpm
corepack enable
corepack prepare pnpm@10.21.0 --activate
```

---

## 🛠️ Project Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/makeplane/plane.git plane-project
cd plane-project
```

### Step 2: Run Setup Script

#### On Linux/macOS:

```bash
chmod +x setup.sh
./setup.sh
```

#### On Windows (PowerShell):

```powershell
# Use the Windows setup script
.\setup-windows.ps1
```

This script will:
- ✅ Copy all `.env.example` files to `.env`
- ✅ Generate Django SECRET_KEY
- ✅ Install Node.js dependencies with pnpm
- ✅ Set up environment files for all services

### Step 3: Verify Environment Files

After running the setup script, you should have these `.env` files:

```
.env                    # Root environment (Docker services)
apps/web/.env           # Web app environment
apps/api/.env           # Django API environment
apps/space/.env         # Space app environment
apps/admin/.env         # Admin app environment
apps/live/.env          # Live server environment
```

### Step 4: Configure Environment Variables (Optional)

Review and customize `.env` files as needed:

**Root `.env` (Docker services)**:
```env
# Database
POSTGRES_USER=plane
POSTGRES_PASSWORD=plane
POSTGRES_DB=plane

# Redis
REDIS_HOST=plane-redis
REDIS_PORT=6379

# MinIO (S3)
AWS_ACCESS_KEY_ID=access-key
AWS_SECRET_ACCESS_KEY=secret-key
USE_MINIO=1
```

**apps/web/.env**, **apps/admin/.env**, **apps/space/.env**:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WEB_BASE_URL=http://localhost:3000
VITE_ADMIN_BASE_URL=http://localhost:3001
VITE_SPACE_BASE_URL=http://localhost:3002
VITE_LIVE_BASE_URL=http://localhost:3100
```

---

## 🚀 Running the Application

### Step 1: Start Docker Services

Start the backing services (PostgreSQL, Redis, RabbitMQ, MinIO):

```bash
docker compose -f docker-compose-local.yml up -d
```

This will start:
- **plane-db**: PostgreSQL database (port 5432)
- **plane-redis**: Redis cache (port 6379)
- **plane-mq**: RabbitMQ message queue (port 5672, management on 15672)
- **plane-minio**: MinIO object storage (port 9000, console on 9090)

Verify services are running:
```bash
docker compose -f docker-compose-local.yml ps
```

### Step 2: Start Development Servers

In a new terminal, start all frontend and backend services:

```bash
pnpm dev
```

This starts:
- **Web app**: http://localhost:3000
- **Admin app**: http://localhost:3001
- **Space app**: http://localhost:3002
- **Live server**: http://localhost:3100

### Step 3: Start Backend API (Optional)

If you want to run the Django API locally (instead of in Docker):

#### First-time setup:

```bash
cd apps/api

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements/local.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

#### Run the API server:

```bash
cd apps/api
source venv/bin/activate  # Windows: venv\Scripts\activate
python manage.py runserver 8000
```

#### Run Celery workers (in separate terminals):

```bash
# Worker
cd apps/api
source venv/bin/activate
celery -A plane worker -l INFO

# Beat scheduler
cd apps/api
source venv/bin/activate
celery -A plane beat -l INFO
```

---

## 🌐 Accessing the Application

### Initial Setup

1. **Register as Instance Admin**
   - Open: http://localhost:3001/god-mode/
   - Fill in the registration form
   - This creates your admin account

2. **Access Main Application**
   - Open: http://localhost:3000
   - Log in with the same credentials
   - Create your first workspace

### Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:3000 | Main user dashboard |
| **Admin Panel** | http://localhost:3001/god-mode/ | Instance administration |
| **Space** | http://localhost:3002/spaces | Public sharing space |
| **Live Server** | http://localhost:3100/live | Real-time collaboration |
| **API** | http://localhost:8000 | REST API backend |
| **API Docs** | http://localhost:8000/api/schema/swagger-ui/ | Swagger documentation |
| **MinIO Console** | http://localhost:9090 | Object storage admin |
| **RabbitMQ Management** | http://localhost:15672 | Queue management (guest/guest) |

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Docker Services Won't Start

**Problem**: `docker compose` fails or containers keep restarting

**Solutions**:
```bash
# Check Docker is running
docker info

# Check logs
docker compose -f docker-compose-local.yml logs

# Reset everything
docker compose -f docker-compose-local.yml down -v
docker compose -f docker-compose-local.yml up -d
```

#### 2. Port Already in Use

**Problem**: Error like "port 3000 is already allocated"

**Solution**:
```bash
# Find process using the port (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Find process using the port (Linux/macOS)
lsof -i :3000
kill -9 <PID>
```

#### 3. pnpm install fails

**Problem**: Dependency installation errors

**Solutions**:
```bash
# Clear pnpm cache
pnpm store prune

# Delete node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# Ensure you have Node.js 22+
node --version
```

#### 4. Out of Memory Errors

**Problem**: Docker or Node processes crash with memory errors

**Solutions**:
- Increase Docker Desktop memory allocation (Settings → Resources → Memory)
- Set to at least 8 GB (12 GB recommended)
- Close unnecessary applications
- Run fewer services concurrently

#### 5. Database Connection Errors

**Problem**: API can't connect to PostgreSQL

**Solutions**:
```bash
# Check PostgreSQL is running
docker compose -f docker-compose-local.yml ps plane-db

# Check logs
docker compose -f docker-compose-local.yml logs plane-db

# Restart database
docker compose -f docker-compose-local.yml restart plane-db

# Verify connection
docker exec -it plane-db psql -U plane -d plane
```

#### 6. MinIO Upload Errors

**Problem**: File uploads fail

**Solutions**:
- Verify MinIO is running: http://localhost:9090
- Login: `access-key` / `secret-key`
- Ensure `uploads` bucket exists
- Check `USE_MINIO=1` in `.env`

---

## 💡 Development Workflow

### Common Commands

```bash
# Start all services
docker compose -f docker-compose-local.yml up -d
pnpm dev

# Stop all services
docker compose -f docker-compose-local.yml down
# Ctrl+C in the pnpm dev terminal

# View logs
docker compose -f docker-compose-local.yml logs -f
docker compose -f docker-compose-local.yml logs -f plane-db

# Rebuild a specific service
docker compose -f docker-compose-local.yml up -d --build plane-db

# Clean everything (removes volumes)
docker compose -f docker-compose-local.yml down -v
pnpm clean
```

### Code Quality

```bash
# Lint all code
pnpm check:lint

# Format all code
pnpm fix:format

# Fix linting issues
pnpm fix

# Type check
pnpm check

# Build production version
pnpm build
```

### Working with Individual Apps

```bash
# Web app only
cd apps/web
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm check:lint   # Lint code

# Admin app only
cd apps/admin
pnpm dev

# Space app only
cd apps/space
pnpm dev

# Live server only
cd apps/live
pnpm dev
```

### Database Operations

```bash
# Access PostgreSQL
docker exec -it plane-db psql -U plane -d plane

# Run migrations
cd apps/api
python manage.py migrate

# Create migration
python manage.py makemigrations

# Django admin
python manage.py createsuperuser
```

---

## 🏗️ Architecture Overview

### Monorepo Structure

```
plane/
├── apps/
│   ├── web/          # Main React dashboard (port 3000)
│   ├── admin/        # Admin panel (port 3001)
│   ├── space/        # Public sharing (port 3002)
│   ├── api/          # Django REST API (port 8000)
│   ├── live/         # Real-time server (port 3100)
│   └── proxy/        # Caddy reverse proxy
├── packages/
│   ├── ui/           # Shared UI components
│   ├── types/        # TypeScript types
│   ├── services/     # API clients
│   ├── hooks/        # React hooks
│   ├── editor/       # Rich text editor
│   └── i18n/         # Internationalization
├── deployments/      # Deployment configs
└── docker-compose-local.yml
```

### Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│  ┌──────────┐  ┌───────────┐  ┌────────┐  ┌──────────┐│
│  │   Web    │  │   Admin   │  │  Space │  │   Live   ││
│  │  :3000   │  │   :3001   │  │  :3002 │  │  :3100   ││
│  └──────────┘  └───────────┘  └────────┘  └──────────┘│
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     API Layer                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Django REST Framework (:8000)              │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Background Tasks                       │
│  ┌──────────┐  ┌────────────────┐                      │
│  │  Celery  │  │  Celery Beat   │                      │
│  │  Worker  │  │   Scheduler    │                      │
│  └──────────┘  └────────────────┘                      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │PostgreSQL│  │  Redis   │  │ RabbitMQ │  │ MinIO  │ │
│  │  :5432   │  │  :6379   │  │  :5672   │  │ :9000  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, React Router 7, Vite, MobX, TipTap, TanStack Table |
| **Backend** | Django 4.2, DRF, Uvicorn, Gunicorn |
| **Database** | PostgreSQL 15 |
| **Cache** | Redis (Valkey) |
| **Queue** | RabbitMQ + Celery |
| **Storage** | MinIO (S3-compatible) |
| **Real-time** | Hocuspocus, Yjs CRDT, WebSockets |
| **Build** | Turbo, pnpm workspaces |
| **Container** | Docker, Docker Compose |

---

## ✨ Key Features

### 1. **Issues (Work Items)**
- Rich text editor with TipTap
- File attachments via MinIO
- Sub-issues and dependencies
- Custom properties and labels
- Issue linking and references

### 2. **Cycles (Sprints)**
- Sprint planning and execution
- Burn-down charts
- Progress tracking
- Velocity metrics

### 3. **Modules**
- Break down large projects
- Module dependencies
- Progress visualization

### 4. **Views**
- Customizable filters
- Multiple layouts (List, Kanban, Calendar, Gantt)
- Saved and shared views
- Private and public views

### 5. **Pages**
- Rich text documentation
- AI-powered writing assistance
- Convert notes to issues
- Collaborative editing

### 6. **Analytics**
- Real-time dashboards
- Custom reports
- Trend analysis
- Export capabilities

### 7. **Workspace Management**
- Multi-workspace support
- Role-based permissions
- Team invitations
- Instance administration (God Mode)

### 8. **Real-time Collaboration**
- Live cursor tracking
- Concurrent editing with CRDT
- WebSocket-based sync
- Conflict-free merging

---

## 📚 Additional Resources

- **Product Documentation**: https://docs.plane.so/
- **Developer Documentation**: https://developers.plane.so/
- **Contributing Guide**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **GitHub Repository**: https://github.com/makeplane/plane
- **Discord Community**: https://discord.com/invite/A92xrEGCge
- **Twitter**: https://twitter.com/planepowers

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Search [GitHub Issues](https://github.com/makeplane/plane/issues)
3. Join [Discord](https://discord.com/invite/A92xrEGCge) for community support
4. Review [Developer Docs](https://developers.plane.so/)

---

## 🎉 You're Ready!

You now have a complete local Plane development environment. Happy coding!

**Quick Start Checklist**:
- ✅ Prerequisites installed (Node, Docker, pnpm)
- ✅ Repository cloned
- ✅ Setup script executed
- ✅ Docker services running
- ✅ Frontend apps running
- ✅ Instance admin registered
- ✅ First workspace created

**Next Steps**:
- Explore the codebase
- Make your first contribution
- Join the community
- Build something amazing!
