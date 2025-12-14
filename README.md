<p align="center">
  <h1 align="center">🤠 Scrumdidly</h1>
  <p align="center"><b>Agile Home Management</b></p>
</p>

<p align="center">
  <a href="https://scrumdidly.com"><b>Live App</b></a> •
  <a href="#-installation">Installation</a> •
  <a href="#-features">Features</a> •
  <a href="#-local-development">Development</a>
</p>

---

## About Scrumdidly

**Scrumdidly** is a household management application that adapts enterprise-grade SCRUM methodology for modern families juggling busy schedules, shared responsibilities, and collaborative goals. Unlike traditional productivity tools, Scrumdidly recognizes that running a household is a complex team endeavor requiring coordination, transparency, and iterative planning.

With an easy-going cowboy spirit and family-friendly style, the application transforms family life into manageable weeks—where family members collectively plan, prioritize, and execute household tasks, missions, and goals. Parents and older children participate in **"family standups"** (brief daily check-ins), **week planning sessions** (weekly family meetings), and **retrospectives** (reflection on what worked and what didn't).

Scrumdidly helps families move from reactive chaos to proactive planning, fostering accountability, teaching project management skills to children, and ensuring everyone has visibility into the family's shared workload. **It's SCRUM for the home—because families are teams too.**

🌐 **Live Application**: [https://scrumdidly.com](https://scrumdidly.com)

---

## 🌟 Key Features

### Family Backlog
A prioritized list of household tasks, chores, missions, events, and goals that need attention. Everything your family needs to accomplish lives in one organized, transparent place.

### Week Planning
Visual boards where families allocate tasks for the upcoming week, assign effort ratings (1-5 scale based on difficulty), and set realistic commitments. See your week at a glance and adjust as needed.

### Missions
Parent-created overarching projects that organize related tasks and goals under meaningful themes. Whether it's "Kitchen Renovation," "Summer Vacation Planning," or "School Year Prep," missions help families tackle big goals together.

### Swim Lanes
Customizable categories like "Chores," "School/Activities," "Home Projects," "Family Time," and "Individual Goals." Organize your family's work in ways that make sense for your unique household.

### Kid-Friendly Interface
Age-appropriate views with gamification elements, progress trackers, and reward systems. Make household management engaging and educational for children while teaching valuable life skills.

### Burndown Charts
Visual progress tracking that shows family momentum and helps adjust workload. See how your family is progressing through the week and identify when you might be overcommitted.

### Family History
Inactive family members remain visible in historical records, preserving continuity as family dynamics change. Your family's journey is always accessible, even as kids grow up and move out.

### Retrospective Tools
Guided prompts for families to reflect and improve their collaboration. Learn what worked, what didn't, and how to make next week even better.

---

## 🚀 Installation

Scrumdidly can be deployed on your own infrastructure for complete control over your family's data.

### Quick Start (Digital Ocean)

The easiest way to get started is with a single-command deployment on Digital Ocean:

1. **Provision Digital Ocean Droplet** (Ubuntu 22.04 LTS recommended)
2. **Run Initial Setup**:
   ```bash
   ./setup-server.sh
   ```
3. **Deploy Application**:
   ```bash
   ./deploy.sh production
   ```
4. **Start Services**:
   ```bash
   make start ENV=production
   # or
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

### Detailed Deployment Guide

For complete deployment instructions, see:
- [Deployment Guide](specs/001-family-management/DEPLOYMENT.md) - Comprehensive deployment documentation
- [Quickstart Guide](specs/001-family-management/quickstart.md) - Quick setup instructions

### Key Deployment Features

- **Single Command Startup**: `make start` or `pm2 start ecosystem.config.js --env production`
- **Process Management**: PM2 handles API, workers, and frontend
- **Auto-Restart**: Processes automatically restart on failure
- **Systemd Integration**: Auto-start on server reboot
- **Zero-Downtime Reloads**: Graceful process reloads
- **SSL Support**: Built-in nginx reverse proxy with SSL/TLS support

### Prerequisites

**Production Deployment**:
- Digital Ocean droplet (Ubuntu 22.04 LTS recommended)
- Supabase account and project (for database and storage)
- Domain name (optional, for SSL certificates)
- SSH access to droplet

**Local Development**:
- Node.js >= 22.18.0
- Python 3.12
- pnpm 10.24.0+
- Redis (for caching and task queue)
- PM2 (for process management)

---

## 🛠️ Local Development

### Prerequisites

- Node.js >= 22.18.0
- Python 3.12
- pnpm 10.24.0+
- Redis
- PM2

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd scrumfamily
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   # Edit .env files with your configuration
   ```

4. **Set up Supabase**:
   - Create a Supabase project
   - Get your database connection string
   - Configure environment variables (see [Quickstart Guide](specs/001-family-management/quickstart.md))

5. **Start Redis**:
   ```bash
   # macOS
   brew services start redis
   
   # Linux
   sudo systemctl start redis
   ```

6. **Run database migrations**:
   ```bash
   cd apps/api
   source venv/bin/activate  # or your virtual environment
   python manage.py migrate
   ```

7. **Start the application**:
   ```bash
   # From project root
   make start
   # or
   pm2 start ecosystem.config.js --env development
   ```

8. **Access the application**:
   - Web app: http://localhost:3000
   - Admin interface: http://localhost:8000/god-mode/
   - API: http://localhost:8000/api/

### Development Commands

```bash
# Start all services
make start

# Stop all services
make stop

# Restart all services
make restart

# View logs
make logs
make logs LOGS=api  # View specific service logs

# Run migrations
make migrate

# Build frontend
make build

# Check service health
make health
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more development guidelines.

---

## ⚙️ Built With

[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![PM2](https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white)](https://pm2.keymetrics.io/)

---

## 📖 Documentation

- [Deployment Guide](specs/001-family-management/DEPLOYMENT.md) - Complete deployment instructions
- [Quickstart Guide](specs/001-family-management/quickstart.md) - Quick setup guide
- [Task Management](specs/001-family-management/tasks.md) - Feature implementation tasks

---

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, your help makes Scrumdidly better for families everywhere.

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Ways to Contribute

- Report bugs or submit feature requests
- Improve documentation
- Submit pull requests
- Share feedback and ideas

---

## 🛡️ Security

If you discover a security vulnerability, please report it responsibly. We take all legitimate reports seriously and will investigate them promptly.

See [SECURITY.md](./SECURITY.md) for more information.

---

## 📝 License

This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE.txt).

---

## 🙏 Acknowledgments

Scrumdidly is built on the foundation of [Plane](https://plane.so), an open-source project management tool. We've adapted and extended it to serve the unique needs of families managing their homes together.

---

<p align="center">
  <b>Happy planning, families! 🤠</b>
</p>
