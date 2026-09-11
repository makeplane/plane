# 📊 Plane - Project Overview & Analysis

Complete analysis of the Plane project for rebranding and customization.

---

## 🎯 Executive Summary

**Plane** is a comprehensive, open-source project management platform comparable to Jira, Linear, or Asana. It's built with modern technologies and offers enterprise-grade features while remaining highly customizable.

### Key Strengths

✅ **Modern Tech Stack** - React 18, Django 4.2, PostgreSQL, real-time collaboration
✅ **Feature-Rich** - Issues, sprints, analytics, real-time editing
✅ **Well-Architected** - Monorepo, microservices-ready, scalable
✅ **Production-Ready** - Docker support, comprehensive documentation
✅ **Active Development** - Regular updates, strong community

### Key Considerations

⚠️ **Resource-Intensive** - Requires 12+ GB RAM for development
⚠️ **Complex Architecture** - Multiple services and technologies
⚠️ **AGPL License** - Open-source requirements for modifications
⚠️ **Learning Curve** - Large codebase with many features

---

## 🏗️ Architecture Overview

### Application Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      PLANE PLATFORM                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web App   │  │ Admin Panel │  │    Space    │        │
│  │  (React)    │  │   (React)   │  │   (React)   │        │
│  │   :3000     │  │    :3001    │  │    :3002    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────────────────────┐         │
│  │ Live Server │  │      Django API              │         │
│  │  (Node.js)  │  │   (REST Framework)          │         │
│  │   :3100     │  │        :8000                │         │
│  └─────────────┘  └─────────────────────────────┘         │
│                                                             │
│  ┌────────┐  ┌───────┐  ┌──────────┐  ┌───────┐          │
│  │ Postgres│ │ Redis  │  │ RabbitMQ │  │ MinIO │          │
│  │  :5432  │ │ :6379  │  │  :5672   │  │ :9000 │          │
│  └────────┘  └───────┘  └──────────┘  └───────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.3.1 | UI framework |
| | React Router | 7.9.5 | Routing & SSR |
| | Vite | 7.1.11 | Build tool |
| | MobX | 6.12.0 | State management |
| | Tailwind CSS | Latest | Styling |
| | TipTap | 2.22.3 | Rich text editor |
| **Backend** | Django | 4.2.26 | Web framework |
| | DRF | 3.15.2 | REST API |
| | Celery | 5.4.0 | Async tasks |
| | Uvicorn | 0.29.0 | ASGI server |
| **Database** | PostgreSQL | 15.7 | Primary database |
| | Redis | 7.2.11 | Cache/sessions |
| **Queue** | RabbitMQ | 3.13.6 | Message broker |
| **Storage** | MinIO | Latest | S3-compatible storage |
| **Real-time** | Hocuspocus | 2.15.2 | Collaboration server |
| | Yjs | 13.6.20 | CRDT for sync |
| **DevOps** | Docker | Latest | Containerization |
| | Turbo | 2.6.1 | Monorepo builds |
| | pnpm | 10.21.0 | Package manager |

---

## 📂 Project Structure

### Directory Overview

```
plane/
│
├── apps/                           # Main applications
│   ├── web/                        # Main dashboard (React Router + Vite)
│   │   ├── app/                    # React Router app directory
│   │   │   ├── routes/             # Page routes
│   │   │   ├── components/         # React components
│   │   │   └── root.tsx            # App root
│   │   ├── core/                   # Business logic
│   │   ├── ce/                     # Community Edition features
│   │   ├── ee/                     # Enterprise Edition features
│   │   ├── public/                 # Static assets
│   │   ├── styles/                 # Global styles
│   │   ├── vite.config.ts          # Vite configuration
│   │   └── package.json            # Dependencies
│   │
│   ├── admin/                      # Admin panel (React Router + Vite)
│   │   ├── app/                    # Admin routes (God mode)
│   │   └── package.json
│   │
│   ├── space/                      # Public sharing app
│   │   ├── app/                    # Space routes
│   │   └── package.json
│   │
│   ├── api/                        # Django backend
│   │   ├── plane/                  # Main Django project
│   │   │   ├── app/                # Core application
│   │   │   │   ├── views/          # API endpoints
│   │   │   │   ├── serializers/    # Data serializers
│   │   │   │   ├── urls/           # URL routing
│   │   │   │   └── permissions/    # Access control
│   │   │   ├── db/                 # Database models
│   │   │   │   └── models/         # Django models
│   │   │   ├── settings/           # Django configuration
│   │   │   ├── bgtasks/            # Celery tasks
│   │   │   └── utils/              # Utilities
│   │   ├── requirements/           # Python dependencies
│   │   └── manage.py               # Django CLI
│   │
│   ├── live/                       # Real-time collaboration server
│   │   ├── src/                    # TypeScript source
│   │   │   ├── index.ts            # Server entry
│   │   │   └── extensions/         # Hocuspocus extensions
│   │   └── package.json
│   │
│   └── proxy/                      # Caddy reverse proxy
│       └── Caddyfile.ce            # Proxy configuration
│
├── packages/                       # Shared libraries
│   ├── ui/                         # UI component library
│   │   ├── src/components/         # Reusable components
│   │   └── storybook/              # Component docs
│   │
│   ├── types/                      # TypeScript type definitions
│   ├── services/                   # API client services
│   ├── hooks/                      # React hooks
│   ├── constants/                  # Shared constants
│   ├── utils/                      # Utility functions
│   ├── editor/                     # Rich text editor package
│   ├── i18n/                       # Internationalization
│   │   └── src/locales/            # Translation files
│   │       ├── en/                 # English
│   │       └── fr/                 # French
│   │
│   ├── shared-state/               # Global state management
│   ├── eslint-config/              # Shared ESLint config
│   ├── tailwind-config/            # Shared Tailwind config
│   └── typescript-config/          # Shared TypeScript config
│
├── deployments/                    # Deployment configurations
│   ├── aio/                        # All-in-one deployment
│   ├── kubernetes/                 # K8s manifests
│   └── swarm/                      # Docker Swarm
│
├── docker-compose.yml              # Production compose
├── docker-compose-local.yml        # Development compose
├── turbo.json                      # Turbo configuration
├── pnpm-workspace.yaml             # pnpm workspaces
├── package.json                    # Root package
├── .env.example                    # Environment template
├── setup.sh                        # Linux/Mac setup
├── setup-windows.ps1               # Windows setup (PowerShell)
├── setup-windows.bat               # Windows setup (Batch)
├── SETUP_GUIDE.md                  # Setup documentation
├── REBRANDING_GUIDE.md             # Customization guide
└── README.md                       # Project readme
```

---

## ✨ Feature Inventory

### Core Features (Essential)

| Feature | Description | Complexity | Priority |
|---------|-------------|------------|----------|
| **Issues** | Task/issue tracking with rich text | High | 🔴 Critical |
| **Projects** | Project organization | Medium | 🔴 Critical |
| **Workspaces** | Multi-tenant workspaces | Medium | 🔴 Critical |
| **Cycles** | Sprint/iteration management | Medium | 🟡 High |
| **Views** | Customizable issue views | Medium | 🟡 High |
| **Analytics** | Dashboards and reports | Medium | 🟡 High |
| **States** | Issue status workflow | Low | 🔴 Critical |
| **Labels** | Issue categorization | Low | 🟡 High |
| **Members** | Team collaboration | Medium | 🔴 Critical |
| **Permissions** | Role-based access | Medium | 🔴 Critical |

### Advanced Features (Optional)

| Feature | Description | Complexity | Removable? |
|---------|-------------|------------|------------|
| **Modules** | Project modules/epics | Medium | ✅ Yes |
| **Pages** | Rich text docs with AI | High | ✅ Yes |
| **Space** | Public issue sharing | Medium | ✅ Yes |
| **Real-time** | Live collaboration | Very High | ⚠️ With Pages |
| **Integrations** | Slack, OpenAI, etc. | Medium | ✅ Selective |
| **God Mode** | Instance admin panel | Medium | ⚠️ Keep |
| **Webhooks** | External integrations | Low | ✅ Yes |

### UI Features

| Feature | Description | Views Available |
|---------|-------------|----------------|
| **List View** | Traditional list | ✅ |
| **Kanban** | Board view | ✅ |
| **Calendar** | Calendar view | ✅ |
| **Spreadsheet** | Table view | ✅ |
| **Gantt** | Timeline view | ❌ Not implemented |
| **Filters** | Advanced filtering | ✅ |
| **Search** | Global search | ✅ |
| **Shortcuts** | Keyboard shortcuts | ✅ |

---

## 📊 Complexity Analysis

### Lines of Code (Estimated)

| Component | Lines | Language | Complexity |
|-----------|-------|----------|------------|
| Web App | ~50,000 | TypeScript/TSX | High |
| Admin App | ~5,000 | TypeScript/TSX | Low |
| Space App | ~10,000 | TypeScript/TSX | Medium |
| API Backend | ~40,000 | Python | High |
| Live Server | ~2,000 | TypeScript | Medium |
| Shared Packages | ~20,000 | TypeScript | Medium |
| **Total** | **~127,000** | Mixed | **High** |

### Development Effort

| Task | Estimated Time | Difficulty |
|------|----------------|------------|
| **Setup & Learning** | 1-2 weeks | Medium |
| **Basic Rebranding** | 1-2 weeks | Low |
| **Feature Removal** | 2-4 weeks | Medium |
| **Custom Features** | 4-12 weeks | High |
| **Production Deploy** | 1-2 weeks | Medium |

---

## 🎨 Branding Elements

### Current Brand Assets

**Logo Locations:**
- `/apps/web/public/logo.svg`
- `/apps/web/public/favicon/`
- Email templates in `/apps/api/plane/templates/`

**Color Scheme:**
- Defined in `/packages/tailwind-config/index.ts`
- Custom color variables throughout components

**Typography:**
- Primary: Inter (sans-serif)
- Monospace: JetBrains Mono

**Terminology:**
- Issues (not Tasks or Tickets)
- Cycles (not Sprints)
- Modules (not Epics)
- Workspace (not Organization)

### Customization Targets

🎨 **Easy to Change:**
- Logo and favicons
- Color scheme
- Typography
- Terminology (via i18n)
- Email templates

🔧 **Medium Difficulty:**
- UI component styles
- Layout and spacing
- Navigation structure
- Default workflows

🚧 **Complex:**
- Core business logic
- Database schema
- API structure
- Real-time features

---

## 🔐 Security Considerations

### Current Security Features

✅ **Authentication:**
- Email/password
- Magic link (passwordless)
- Google OAuth
- JWT tokens

✅ **Authorization:**
- Role-based permissions (Admin, Member, Guest)
- Workspace-level isolation
- Project-level permissions

✅ **API Security:**
- CORS configuration
- Rate limiting
- CSRF protection
- Input sanitization

✅ **Data Protection:**
- PostgreSQL with proper permissions
- Encrypted passwords (Django default)
- Secure session handling

### Recommendations for Production

- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Implement audit logging
- [ ] Enable 2FA (add custom)
- [ ] Regular security updates
- [ ] Penetration testing
- [ ] GDPR compliance (if EU users)

---

## 💰 Cost Analysis

### Development Costs (Estimated)

| Resource | Cost | Notes |
|----------|------|-------|
| **Developer Time** | $50-150/hr | Varies by location |
| **Basic Rebrand** | $5,000-10,000 | 1-2 weeks |
| **Feature Custom** | $20,000-50,000 | 4-8 weeks |
| **Full Custom** | $50,000-150,000 | 3-6 months |

### Infrastructure Costs (Monthly)

**Small Scale (< 100 users):**
| Service | Provider | Cost |
|---------|----------|------|
| VPS (8 GB RAM) | DigitalOcean | $48/mo |
| Database | Managed PostgreSQL | $15/mo |
| Storage | S3/Spaces | $5-20/mo |
| CDN | Cloudflare | Free |
| **Total** | | **~$70-85/mo** |

**Medium Scale (100-500 users):**
| Service | Provider | Cost |
|---------|----------|------|
| VPS (16 GB RAM) | DigitalOcean | $96/mo |
| Database | Managed PostgreSQL | $50/mo |
| Storage | S3/Spaces | $20-50/mo |
| Redis | Managed Redis | $30/mo |
| CDN | Cloudflare Pro | $20/mo |
| **Total** | | **~$220-250/mo** |

**Large Scale (500+ users):**
- Kubernetes cluster: $500-2000/mo
- Managed databases: $200-500/mo
- CDN & storage: $100-300/mo
- Monitoring & logs: $50-200/mo
- **Total: $850-3000+/mo**

---

## 📈 Scalability

### Current Capacity

| Metric | Small VPS | Medium VPS | Cluster |
|--------|-----------|------------|---------|
| **Concurrent Users** | 10-50 | 50-200 | 500+ |
| **Projects** | 100s | 1,000s | 10,000+ |
| **Issues** | 10,000s | 100,000s | Millions |
| **Storage** | 50 GB | 500 GB | Unlimited |

### Bottlenecks & Solutions

**Database:**
- Bottleneck: Complex queries, large datasets
- Solution: Indexes, read replicas, connection pooling

**Frontend:**
- Bottleneck: Bundle size, initial load
- Solution: Code splitting, lazy loading, CDN

**Real-time:**
- Bottleneck: WebSocket connections
- Solution: Horizontal scaling of live server

**File Storage:**
- Bottleneck: Upload/download speed
- Solution: CDN, S3 multipart uploads

---

## 🚀 Deployment Options

### Option 1: Single VPS (Recommended for Start)

**Pros:**
- ✅ Simple setup
- ✅ Low cost ($50-100/mo)
- ✅ Easy to manage

**Cons:**
- ❌ Single point of failure
- ❌ Limited scaling
- ❌ Downtime for updates

**Best For:** < 100 users, POC, internal tools

### Option 2: Kubernetes Cluster

**Pros:**
- ✅ Highly scalable
- ✅ Auto-healing
- ✅ Zero-downtime deploys

**Cons:**
- ❌ Complex setup
- ❌ Higher cost ($500+/mo)
- ❌ Requires DevOps expertise

**Best For:** > 500 users, SaaS, mission-critical

### Option 3: Platform-as-a-Service

**Pros:**
- ✅ Minimal DevOps
- ✅ Auto-scaling
- ✅ Managed services

**Cons:**
- ❌ Higher cost
- ❌ Vendor lock-in
- ❌ Less control

**Best For:** Fast launch, limited DevOps team

---

## 🎯 Recommendations

### For Rebranding

**Priority 1 (Week 1-2):**
1. ✅ Change logo and favicons
2. ✅ Update color scheme
3. ✅ Modify terminology
4. ✅ Rebrand emails
5. ✅ Update meta tags

**Priority 2 (Week 3-4):**
1. ✅ Customize UI components
2. ✅ Remove unused features
3. ✅ Adjust workflows
4. ✅ Test thoroughly

**Priority 3 (Week 5+):**
1. ✅ Add custom features
2. ✅ Integrate external services
3. ✅ Deploy to production
4. ✅ Gather user feedback

### Features to Keep

✅ **Must Keep:**
- Issues/Work Items
- Projects & Workspaces
- Views & Filters
- Analytics
- Members & Permissions
- God Mode (Admin)

✅ **Probably Keep:**
- Cycles (if using agile)
- Labels & States
- File uploads
- Search

### Features to Consider Removing

⚠️ **Evaluate:**
- **Pages** - If using external docs (Notion, etc.)
- **Modules** - If Cycles are sufficient
- **Space** - If no public sharing needed
- **Real-time** - If removing Pages

**Savings from Removal:**
- Reduced complexity
- Lower resource usage
- Simplified deployment
- Easier maintenance

---

## 📚 Learning Path

### Week 1: Orientation
- [ ] Run the app locally
- [ ] Explore all features
- [ ] Review codebase structure
- [ ] Read documentation

### Week 2: Customization
- [ ] Change branding elements
- [ ] Modify color scheme
- [ ] Update terminology
- [ ] Test changes

### Week 3-4: Development
- [ ] Remove unwanted features
- [ ] Customize workflows
- [ ] Add integrations
- [ ] Build custom features

### Week 5-6: Deployment
- [ ] Set up staging environment
- [ ] Deploy to production
- [ ] Configure monitoring
- [ ] Create backups

### Ongoing: Maintenance
- [ ] Monitor performance
- [ ] Fix bugs
- [ ] Add features
- [ ] Update dependencies

---

## 🎉 Conclusion

Plane is a robust, feature-rich project management platform with:

**Strengths:**
- Modern, maintainable codebase
- Comprehensive features
- Strong architecture
- Active community

**Challenges:**
- Large codebase requires learning
- Resource-intensive
- Complex deployment
- AGPL license considerations

**Verdict:** Excellent foundation for custom project management solution with proper planning and resources.

---

## 📞 Support Resources

- **Setup Guide:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Rebranding Guide:** [REBRANDING_GUIDE.md](./REBRANDING_GUIDE.md)
- **Quick Start:** [QUICK_START_WINDOWS.md](./QUICK_START_WINDOWS.md)
- **Official Docs:** https://developers.plane.so/
- **Community:** https://discord.com/invite/A92xrEGCge
- **GitHub:** https://github.com/makeplane/plane

---

*Last Updated: Based on Plane v1.1.0*
