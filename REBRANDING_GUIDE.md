# 🎨 Plane - Rebranding & Feature Enhancement Guide

A comprehensive guide for rebranding Plane and customizing features for your specific needs.

---

## 📋 Table of Contents

1. [Rebranding Overview](#rebranding-overview)
2. [Visual Identity Changes](#visual-identity-changes)
3. [Feature Assessment](#feature-assessment)
4. [Recommended Customizations](#recommended-customizations)
5. [Feature Enhancement Ideas](#feature-enhancement-ideas)
6. [Technical Considerations](#technical-considerations)
7. [Deployment Strategy](#deployment-strategy)

---

## 🎯 Rebranding Overview

### Current Brand Identity

**Plane** is positioned as:
- Open-source project management platform
- Modern, minimalist design
- Developer-friendly interface
- Enterprise-grade features

### Key Areas for Rebranding

1. **Visual Identity**
   - Logo and branding assets
   - Color scheme
   - Typography
   - UI/UX design language

2. **Naming & Messaging**
   - Product name
   - Taglines and messaging
   - Feature names (Issues → Work Items, Cycles → Sprints, etc.)
   - Documentation

3. **Functionality**
   - Feature set customization
   - Workflow modifications
   - Integration priorities

---

## 🎨 Visual Identity Changes

### 1. Logo & Brand Assets

#### Files to Modify:

```
📁 Logo Files:
apps/web/public/favicon/          # Favicon files
apps/admin/public/favicon/        # Admin favicon
apps/space/public/favicon/        # Space favicon

📁 Images & Graphics:
apps/web/public/                  # Public assets
packages/ui/src/                  # UI component assets

📁 README & Docs:
README.md                         # Main logo reference
```

#### Action Items:
- [ ] Replace favicon.ico files in all apps
- [ ] Update logo SVG/PNG in `public/` folders
- [ ] Update social media preview images
- [ ] Modify README.md header image
- [ ] Update email template logos (apps/api/plane/templates/)

**Example Files:**
```bash
# Primary logo locations
apps/web/public/logo.svg
apps/web/public/favicon/favicon.ico
apps/admin/public/favicon/favicon.ico
apps/space/public/favicon/favicon.ico
```

### 2. Color Scheme

#### Primary Configuration Files:

```typescript
📁 Tailwind Configuration:
packages/tailwind-config/index.ts    # Global colors

📁 Theme Files:
apps/web/styles/                     # Global styles
packages/ui/src/                     # Component styles
```

#### Current Color Palette:

The project uses Tailwind CSS with custom color definitions. Key colors to modify:

```javascript
// packages/tailwind-config/index.ts
{
  colors: {
    custom: {
      primary: {...},      // Main brand color
      background: {...},   // Background colors
      text: {...},         // Text colors
      border: {...},       // Border colors
      sidebar: {...},      // Sidebar colors
    }
  }
}
```

#### Action Items:
- [ ] Define new brand color palette (primary, secondary, accent)
- [ ] Update Tailwind config with new colors
- [ ] Update CSS custom properties
- [ ] Test color contrast for accessibility (WCAG AA)
- [ ] Update dark mode colors

**Recommended Tools:**
- [Coolors.co](https://coolors.co/) - Color palette generator
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - WCAG compliance

### 3. Typography

#### Font Configuration:

```typescript
📁 Font Files:
apps/web/app/styles/fonts.css       # Font imports
packages/tailwind-config/index.ts    # Font family config
```

Current fonts:
- **Sans-serif**: Inter (primary UI font)
- **Monospace**: JetBrains Mono (code)

#### Action Items:
- [ ] Choose new brand fonts (Google Fonts, Adobe Fonts, custom)
- [ ] Add font files to project
- [ ] Update Tailwind font family configuration
- [ ] Update font imports in CSS
- [ ] Test font loading performance

### 4. UI Component Library

The project uses a custom UI library in `packages/ui/`.

#### Key Components to Rebrand:

```
packages/ui/src/components/
├── button/             # Buttons
├── badge/              # Badges and labels
├── card/               # Cards
├── dropdown/           # Dropdowns
├── modal/              # Modals
├── navigation/         # Navigation components
└── ...
```

#### Action Items:
- [ ] Review component designs
- [ ] Update button styles and variants
- [ ] Customize input field styles
- [ ] Modify modal and dialog designs
- [ ] Update navigation bar appearance
- [ ] Customize sidebar design

### 5. Application Title & Meta Tags

#### Files to Update:

```typescript
📁 HTML Meta Tags:
apps/web/app/root.tsx               # Root component with meta
apps/admin/app/root.tsx             # Admin meta
apps/space/app/root.tsx             # Space meta

📁 Environment Variables:
apps/web/.env                       # App configuration
```

#### Action Items:
- [ ] Update `<title>` tags
- [ ] Modify meta descriptions
- [ ] Change Open Graph titles and descriptions
- [ ] Update Twitter Card metadata
- [ ] Modify app manifest files

**Example:**
```tsx
// apps/web/app/root.tsx
export const meta: MetaFunction = () => [
  { title: "Your Brand - Project Management" },
  { name: "description", content: "Your custom description" },
  { property: "og:title", content: "Your Brand" },
  // ... more meta tags
];
```

---

## 📊 Feature Assessment

### Core Features Analysis

| Feature | Keep? | Modify? | Remove? | Notes |
|---------|-------|---------|---------|-------|
| **Issues/Work Items** | ✅ | 🔧 | ❌ | Core feature - customize terminology |
| **Cycles (Sprints)** | ✅ | 🔧 | ❌ | Essential for agile teams |
| **Modules** | ✅ | 🔧 | ⚠️ | May overlap with other grouping |
| **Views** | ✅ | 🔧 | ❌ | Critical for customization |
| **Pages** | ⚠️ | 🔧 | ⚠️ | May be redundant if using external docs |
| **Analytics** | ✅ | 🔧 | ❌ | Valuable for insights |
| **Drive** (coming soon) | ⚠️ | 🔧 | ⚠️ | Not implemented yet |
| **Real-time Collaboration** | ✅ | 🔧 | ⚠️ | Complex but powerful |
| **Multi-workspace** | ✅ | 🔧 | ❌ | Essential for multi-tenancy |
| **God Mode (Admin)** | ✅ | 🔧 | ❌ | Necessary for instance management |
| **Public Sharing (Space)** | ⚠️ | 🔧 | ⚠️ | Use case dependent |

**Legend:**
- ✅ Keep as-is or with minor changes
- 🔧 Modify significantly
- ⚠️ Evaluate based on use case
- ❌ Consider removing

### Features to Potentially Remove

#### 1. **Pages Feature**

**Reasons to Remove:**
- You may already use external documentation tools (Notion, Confluence)
- Adds complexity to the UI
- Real-time collaboration infrastructure is resource-intensive

**Impact:**
- Removes live server dependency
- Simplifies architecture
- Reduces resource usage

**How to Remove:**
```bash
# Files to modify/remove:
apps/live/                          # Can be removed entirely
apps/web/app/routes/pages/          # Remove pages routes
packages/editor/                     # May still be used in issues

# Database migrations to create (mark pages as deprecated)
# Update navigation to remove Pages link
# Remove Pages from API endpoints
```

**Estimated Effort:** Medium (1-2 weeks)

#### 2. **Public Space (Public Issue Sharing)**

**Reasons to Remove:**
- May not need public issue tracking
- Security concerns with public data
- Additional maintenance overhead

**How to Remove:**
```bash
# Remove Space app:
apps/space/                         # Remove entire app

# Remove from build:
# Update turbo.json
# Update docker-compose files
# Remove space-related API endpoints
```

**Estimated Effort:** Low (2-3 days)

#### 3. **Modules**

**Reasons to Consider Removal:**
- May overlap with other organizational structures
- Cycles (Sprints) might be sufficient
- Simplifies project hierarchy

**How to Remove:**
```bash
# API changes:
apps/api/plane/app/views/module/    # Remove module views

# Frontend changes:
apps/web/app/routes/modules/        # Remove module routes

# Database:
# Create migration to deprecate module tables
```

**Estimated Effort:** Medium (1-2 weeks)

---

## 🔧 Recommended Customizations

### 1. Terminology Changes

Customize feature names to match your brand's language:

#### Configuration File:

```typescript
📁 Internationalization:
packages/i18n/src/locales/en/translations.json
```

#### Common Terminology Changes:

| Current | Alternative Options |
|---------|-------------------|
| Issues | Tasks, Items, Tickets, Work Items |
| Cycles | Sprints, Iterations, Milestones |
| Modules | Epics, Projects, Initiatives |
| Workspace | Organization, Team, Account |
| God Mode | Admin Panel, System Settings |

#### How to Change:

1. Edit translation files:
```json
// packages/i18n/src/locales/en/translations.json
{
  "issue": {
    "label": "Task",        // Changed from "Issue"
    "title": "Task Title"
  },
  "cycle": {
    "label": "Sprint"       // Changed from "Cycle"
  }
}
```

2. Search and replace in codebase (be careful):
```bash
# Use with caution - review changes
grep -r "Issue" apps/web/app/ | wc -l
# Manually update key user-facing strings
```

### 2. Workflow Customizations

#### Default Issue States

Modify default issue states to match your workflow:

```python
# apps/api/plane/db/models/state.py
# Customize default states

# Example custom workflow:
- Backlog
- Ready
- In Progress
- In Review
- Testing
- Done
```

#### Custom Properties

Add custom fields specific to your use case:

```typescript
// Define custom properties for issues
- Estimated Hours
- Actual Hours
- Customer Impact (High/Medium/Low)
- Feature Flag
- Release Version
```

### 3. Integration Priorities

Choose which integrations to keep/add:

**Currently Supported:**
- ✅ Slack
- ✅ OpenAI (AI features)
- ✅ Webhooks

**Consider Adding:**
- GitHub/GitLab integration
- Jira import/export
- Microsoft Teams
- Google Calendar
- Zapier/Make.com
- Custom SSO (SAML, OAuth)

### 4. Email Template Customization

Customize email notifications:

```
📁 Email Templates:
apps/api/plane/templates/emails/
```

**Templates to Customize:**
- Issue assignment notifications
- Mention notifications
- Cycle completion
- Workspace invitations

### 5. Authentication Options

Current support:
- Email/Password
- Magic Link (email-based)
- Google OAuth

**Consider Adding:**
- Microsoft Azure AD
- SAML SSO
- LDAP integration
- Custom OAuth providers

---

## 💡 Feature Enhancement Ideas

### 1. Enhanced Time Tracking

**Current State:** Basic time estimation
**Enhancement:**
- Built-in time tracker (start/stop timer)
- Automatic time logging
- Time reports and analytics
- Billable vs non-billable hours

**Implementation Complexity:** Medium
**Estimated Time:** 2-3 weeks

### 2. Advanced Reporting

**Current State:** Basic analytics dashboard
**Enhancement:**
- Custom report builder
- Export to Excel/PDF
- Scheduled report emails
- Stakeholder-friendly reports

**Implementation Complexity:** High
**Estimated Time:** 4-6 weeks

### 3. Resource Management

**New Feature:**
- Team capacity planning
- Resource allocation view
- Workload balancing
- Skill-based assignment

**Implementation Complexity:** High
**Estimated Time:** 6-8 weeks

### 4. Client Portal

**New Feature:**
- Separate client-facing interface
- Limited issue visibility
- Client feedback collection
- Progress sharing

**Implementation Complexity:** High
**Estimated Time:** 6-8 weeks

### 5. Mobile Apps

**Current State:** Web-only (responsive design)
**Enhancement:**
- React Native mobile apps
- Offline support
- Push notifications
- Mobile-optimized workflows

**Implementation Complexity:** Very High
**Estimated Time:** 12-16 weeks

### 6. Advanced Automation

**Current State:** Basic workflow automation
**Enhancement:**
- No-code automation builder
- Trigger-action workflows
- Conditional logic
- Integration with external tools

**Implementation Complexity:** High
**Estimated Time:** 8-10 weeks

### 7. Gantt Chart View

**Current State:** Calendar view available
**Enhancement:**
- Interactive Gantt chart
- Dependency visualization
- Timeline drag-and-drop
- Critical path analysis

**Implementation Complexity:** Medium-High
**Estimated Time:** 4-6 weeks

**Recommended Library:** [Frappe Gantt](https://github.com/frappe/gantt) or [DHTMLX Gantt](https://dhtmlx.com/docs/products/dhtmlxGantt/)

### 8. AI-Powered Features

**Current State:** Basic AI in Pages
**Enhancement:**
- AI issue description generation
- Smart task prioritization
- Predictive analytics (completion estimates)
- Automated task categorization
- Natural language queries

**Implementation Complexity:** High
**Estimated Time:** 6-10 weeks

### 9. White-Label Options

**For SaaS/Multi-tenant:**
- Per-workspace branding
- Custom domains
- Workspace-level themes
- Branded emails

**Implementation Complexity:** Medium
**Estimated Time:** 3-4 weeks

---

## 🛠️ Technical Considerations

### 1. Monorepo Architecture

**Current Structure:**
```
Turborepo + pnpm workspaces
├── apps/        # Applications
└── packages/    # Shared libraries
```

**Benefits:**
- ✅ Code sharing across apps
- ✅ Unified build system
- ✅ Consistent dependencies

**Considerations:**
- Large codebase - may be slow on older machines
- All apps share Node.js version
- Build times can be long

**Recommendation:** Keep monorepo structure unless you plan to drastically simplify

### 2. Database Schema

**Current Database:** PostgreSQL with comprehensive schema

**Before Making Changes:**
1. ✅ Review existing migrations
2. ✅ Create backup before schema changes
3. ✅ Test migrations in development
4. ✅ Plan rollback strategy

**Key Tables:**
- `workspaces` - Multi-tenancy
- `projects` - Projects within workspaces
- `issues` - Core work items
- `cycles` - Sprint/iteration management
- `states` - Issue states/statuses
- `labels` - Labels and tags
- `users` - User accounts

### 3. API Design

**Current API:** Django REST Framework

**API Versioning:**
```
/api/v1/workspaces/
/api/v1/projects/
/api/v1/issues/
```

**When Adding Features:**
- Maintain backward compatibility
- Version breaking changes
- Update API documentation (Swagger)
- Test with existing clients

### 4. Real-time Architecture

**Current Setup:** Hocuspocus + Yjs (CRDT)

**Resource Requirements:**
- Separate Node.js server (port 3100)
- WebSocket connections
- Memory-intensive for large documents

**If Removing Pages:**
- Consider removing live server entirely
- Reduce infrastructure costs
- Simplify deployment

### 5. Performance Optimization

**Areas to Optimize:**

1. **Frontend Bundle Size**
   - Code splitting
   - Lazy loading routes
   - Tree shaking unused code

2. **Database Queries**
   - Add indexes for common queries
   - Optimize N+1 queries
   - Implement query caching

3. **API Response Times**
   - Redis caching
   - Database connection pooling
   - Async task processing

4. **Asset Delivery**
   - CDN for static assets
   - Image optimization
   - Gzip compression

### 6. Security Hardening

**Checklist:**

- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable CSRF protection
- [ ] Sanitize user inputs
- [ ] Regular dependency updates
- [ ] Security audit of custom code
- [ ] Implement CSP headers
- [ ] Add logging and monitoring

---

## 🚀 Deployment Strategy

### 1. Development → Staging → Production

**Recommended Workflow:**

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Development │ ───> │   Staging   │ ───> │ Production  │
│  (Local)    │      │  (VPS/AWS)  │      │  (VPS/AWS)  │
└─────────────┘      └─────────────┘      └─────────────┘
```

### 2. VPS Deployment Options

#### Option A: Docker Compose (Recommended for Small-Medium Scale)

**Requirements:**
- VPS with 8+ GB RAM (16 GB recommended)
- Ubuntu 20.04/22.04 or similar
- Docker and Docker Compose

**Setup:**
```bash
# On VPS
git clone <your-repo>
cd plane
cp .env.example .env
# Edit .env with production values
docker compose up -d
```

**Pros:**
- ✅ Simple setup
- ✅ Easy to manage
- ✅ Good for single-server deployments

**Cons:**
- ❌ Single point of failure
- ❌ Limited horizontal scaling

#### Option B: Kubernetes (For Large Scale)

**Requirements:**
- Kubernetes cluster (managed or self-hosted)
- kubectl configured
- Helm (optional but recommended)

**Setup:**
```bash
# Use provided Kubernetes manifests
cd deployments/kubernetes
kubectl apply -f .
```

**Pros:**
- ✅ Highly scalable
- ✅ Auto-healing
- ✅ Load balancing

**Cons:**
- ❌ Complex setup
- ❌ Higher resource requirements
- ❌ Steeper learning curve

#### Option C: Platform-as-a-Service

**Options:**
- Railway.app
- Render.com
- Fly.io
- DigitalOcean App Platform

**Pros:**
- ✅ Minimal DevOps
- ✅ Automatic scaling
- ✅ Built-in SSL

**Cons:**
- ❌ Higher cost
- ❌ Less control
- ❌ Vendor lock-in

### 3. Environment Configuration

**Production .env Checklist:**

```env
# Security
SECRET_KEY=<generate-strong-random-key>
DEBUG=0
ALLOWED_HOSTS=yourdomain.com

# Database (use managed service recommended)
POSTGRES_HOST=your-db-host
POSTGRES_DB=plane_prod
POSTGRES_USER=plane_prod
POSTGRES_PASSWORD=<strong-password>

# Redis (use managed service recommended)
REDIS_HOST=your-redis-host
REDIS_PASSWORD=<strong-password>

# S3 Storage (use AWS S3 or DigitalOcean Spaces)
USE_MINIO=0
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET_NAME=plane-uploads

# SSL/HTTPS
CERT_EMAIL=admin@yourdomain.com
SITE_ADDRESS=yourdomain.com
```

### 4. Domain & SSL Setup

**Steps:**

1. **Point Domain to VPS:**
   ```
   A Record: @ -> <VPS-IP>
   A Record: www -> <VPS-IP>
   ```

2. **SSL Certificate:**
   - Caddy (included) handles automatic Let's Encrypt SSL
   - Or use Cloudflare for SSL proxy

3. **Update Environment:**
   ```env
   SITE_ADDRESS=yourdomain.com
   CERT_EMAIL=admin@yourdomain.com
   ```

### 5. Backup Strategy

**Critical Data:**
- PostgreSQL database
- Uploaded files (S3/MinIO)
- Environment configurations

**Backup Methods:**

```bash
# Database backup
pg_dump -h localhost -U plane plane > backup.sql

# Restore
psql -h localhost -U plane plane < backup.sql

# S3 backup (if using MinIO)
mc mirror myminio/uploads /backup/uploads
```

**Automated Backups:**
- Daily PostgreSQL dumps
- S3 versioning enabled
- Retention policy (keep 30 days)

### 6. Monitoring & Logging

**Tools to Set Up:**

1. **Application Monitoring:**
   - Sentry (error tracking) - already integrated
   - PostHog (analytics) - already integrated

2. **Infrastructure Monitoring:**
   - Prometheus + Grafana
   - Datadog
   - New Relic

3. **Logging:**
   - Centralized logging (ELK stack, Loki)
   - Docker logs: `docker compose logs -f`

4. **Uptime Monitoring:**
   - UptimeRobot
   - Pingdom
   - StatusCake

### 7. CI/CD Pipeline

**Recommended Setup:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to VPS
        run: |
          ssh user@vps "cd /app && git pull && docker compose up -d --build"
```

---

## 📝 Step-by-Step Rebranding Checklist

### Phase 1: Planning (Week 1)

- [ ] Define new brand identity (name, colors, logo)
- [ ] Decide which features to keep/remove
- [ ] Plan UI/UX changes
- [ ] Create brand assets (logo, colors, fonts)
- [ ] Set up staging environment

### Phase 2: Visual Rebranding (Week 2-3)

- [ ] Replace logo files
- [ ] Update color scheme in Tailwind config
- [ ] Change typography
- [ ] Modify UI component styles
- [ ] Update favicons
- [ ] Rebrand email templates
- [ ] Update meta tags and titles

### Phase 3: Feature Customization (Week 3-5)

- [ ] Update terminology in i18n files
- [ ] Remove unwanted features (if any)
- [ ] Customize workflows and states
- [ ] Add custom properties
- [ ] Configure integrations

### Phase 4: Testing (Week 5-6)

- [ ] Visual regression testing
- [ ] Feature testing
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Performance testing
- [ ] Security audit

### Phase 5: Deployment (Week 6-7)

- [ ] Set up production VPS
- [ ] Configure domain and SSL
- [ ] Set up backups
- [ ] Configure monitoring
- [ ] Deploy to production
- [ ] Smoke testing

### Phase 6: Post-Launch (Ongoing)

- [ ] Monitor performance
- [ ] Gather user feedback
- [ ] Iterate on features
- [ ] Plan enhancements

---

## 🎓 Learning Resources

### Official Plane Resources

- [Product Docs](https://docs.plane.so/)
- [Developer Docs](https://developers.plane.so/)
- [GitHub Repo](https://github.com/makeplane/plane)
- [Discord Community](https://discord.com/invite/A92xrEGCge)

### Technology Stack Resources

- **React Router**: https://reactrouter.com/
- **Django REST Framework**: https://www.django-rest-framework.org/
- **Tailwind CSS**: https://tailwindcss.com/
- **MobX**: https://mobx.js.org/
- **TipTap**: https://tiptap.dev/
- **Docker**: https://docs.docker.com/

### Design Resources

- **Figma**: Design prototypes
- **Tailwind UI**: Component examples
- **Hero Icons**: Icon library
- **Unsplash**: Free images

---

## 🤝 Support & Contributions

### Getting Help

1. Review this guide and SETUP_GUIDE.md
2. Check official documentation
3. Search GitHub issues
4. Ask in Discord community

### Contributing Back

If you create useful features:
- Consider contributing back to Plane
- Share your modifications with community
- Help others with similar customizations

---

## 📄 License Considerations

**Plane License:** AGPL-3.0

**Key Points:**
- ✅ Can modify and rebrand
- ✅ Can use commercially
- ⚠️ Must keep AGPL-3.0 license
- ⚠️ Must disclose source code if distributing
- ⚠️ Must share modifications under same license

**For SaaS/Hosted Service:**
- AGPL requires sharing source code
- Consider commercial license from Plane team
- Or keep your modifications open-source

**Consult Legal:** For commercial use, consult with legal advisor about AGPL compliance.

---

## 🎉 Conclusion

Rebranding Plane gives you a powerful, customizable project management platform tailored to your needs. Follow this guide systematically, test thoroughly, and don't hesitate to iterate based on user feedback.

**Good luck with your rebranding! 🚀**

---

**Questions or Issues?**
- Refer to SETUP_GUIDE.md for technical setup
- Join Plane Discord for community support
- Review official documentation for advanced topics
