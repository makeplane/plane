# Deployment and Continuous Integration Reference

Complete guide for deploying Mintlify documentation with various hosting platforms and CI/CD pipelines.

## Auto-Deploy from Git

Mintlify automatically deploys from connected Git repositories.

### GitHub Integration

1. **Connect Repository:**
   - Go to Mintlify dashboard
   - Click "Connect Repository"
   - Authorize GitHub access
   - Select repository

2. **Configure Branch:**
   - Set main branch (e.g., `main`, `master`)
   - Optionally enable preview deployments for PRs

3. **Auto-Deploy:**
   - Push to main branch triggers production deployment
   - Pull requests trigger preview deployments
   - Deployment status shows in GitHub checks

### GitLab Integration

1. **Connect Repository:**
   - Go to Mintlify dashboard
   - Select GitLab integration
   - Authorize GitLab access
   - Choose repository and branch

2. **Deploy on Push:**
   - Commits to configured branch auto-deploy
   - Merge requests can trigger previews

### GitHub Enterprise Server

For self-hosted GitHub instances:

1. **Configuration:**
   - Provide GitHub Enterprise Server URL
   - Generate personal access token with repo permissions
   - Add webhook URL to repository

2. **Webhook Setup:**
   ```
   Payload URL: https://api.mintlify.com/webhook/github-enterprise
   Content type: application/json
   Events: Push, Pull request
   ```

## Preview Deployments

Preview documentation changes before merging.

### Pull Request Previews

Automatically generate preview deployments for PRs:

1. **Enable in Dashboard:**
   - Navigate to Settings > Deployments
   - Enable "Preview Deployments"
   - Choose PR branches to deploy

2. **Access Previews:**
   - Preview URL appears in PR checks
   - Format: `https://preview-{pr-number}.mintlify.app`
   - Auto-updates on new commits

3. **Cleanup:**
   - Previews auto-delete after PR merge/close
   - Configurable retention period

### Branch Previews

Deploy specific branches for testing:

1. **Configure Branch Patterns:**
   ```json
   {
     "deployments": {
       "preview": {
         "branches": ["staging", "dev", "feature/*"]
       }
     }
   }
   ```

2. **Access:**
   - URL format: `https://{branch-name}.mintlify.app`
   - Auto-deploy on branch push

## Custom Domain

Connect custom domain to documentation.

### DNS Configuration

1. **Add DNS Records:**

   **Apex domain (example.com):**
   ```
   Type: TXT
   Name: @
   Value: mintlify-domain-verification={verification-code}

   Type: CNAME (or ALIAS/ANAME)
   Name: @
   Value: mintlify-dns.com
   ```

   **Subdomain (docs.example.com):**
   ```
   Type: TXT
   Name: docs
   Value: mintlify-domain-verification={verification-code}

   Type: CNAME
   Name: docs
   Value: mintlify-dns.com
   ```

2. **Verify in Dashboard:**
   - Go to Settings > Custom Domain
   - Enter domain name
   - Click "Verify DNS"
   - Wait for SSL certificate provisioning (5-15 minutes)

### Multiple Domains

Point multiple domains to same documentation:

```
docs.example.com → Primary domain
documentation.example.com → Redirect to primary
help.example.com → Redirect to primary
```

Configure redirects in dashboard or via DNS.

## Subpath Hosting

Host documentation on subpath (e.g., `example.com/docs`).

### Reverse Proxy Configuration

**Nginx:**

```nginx
location /docs {
    proxy_pass https://your-site.mintlify.app;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Rewrite path
    rewrite ^/docs(/.*)?$ $1 break;
}
```

**Apache:**

```apache
<Location /docs>
    ProxyPass https://your-site.mintlify.app
    ProxyPassReverse https://your-site.mintlify.app
    ProxyPreserveHost On

    # Rewrite
    RewriteEngine On
    RewriteRule ^/docs(/.*)?$ $1 [PT]
</Location>
```

**Cloudflare Workers:**

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  if (url.pathname.startsWith('/docs')) {
    const newUrl = url.pathname.replace(/^\/docs/, '')
    return fetch(`https://your-site.mintlify.app${newUrl}`, {
      headers: request.headers
    })
  }

  return fetch(request)
}
```

### Base Path Configuration

Configure base path in `docs.json`:

```json
{
  "basePath": "/docs"
}
```

All routes prefixed with `/docs`:
- `/docs/introduction`
- `/docs/api/users`
- `/docs/guides/quickstart`

## Platform-Specific Deployment

### Vercel

Deploy Mintlify docs alongside Next.js app.

1. **Install Mintlify:**
   ```bash
   npm install -D mintlify
   ```

2. **Add Build Script:**
   ```json
   {
     "scripts": {
       "docs:build": "mintlify build",
       "docs:dev": "mintlify dev"
     }
   }
   ```

3. **Configure Vercel:**
   ```json
   {
     "buildCommand": "npm run docs:build",
     "outputDirectory": ".mintlify/out",
     "routes": [
       {
         "src": "/docs/(.*)",
         "dest": "/.mintlify/out/$1"
       }
     ]
   }
   ```

4. **Deploy:**
   ```bash
   vercel
   ```

### Cloudflare Pages

1. **Build Settings:**
   - Build command: `mintlify build`
   - Build output directory: `.mintlify/out`
   - Root directory: `/` (or docs subfolder)

2. **Environment Variables:**
   - Set `NODE_VERSION=18` or higher

3. **Deploy:**
   - Connect GitHub repository
   - Configure branch: `main`
   - Cloudflare auto-builds on push

### AWS (Route 53 + CloudFront)

Host static Mintlify build on AWS.

1. **Build Docs:**
   ```bash
   mintlify build
   ```

2. **Upload to S3:**
   ```bash
   aws s3 sync .mintlify/out s3://docs-bucket/ \
     --delete \
     --cache-control "public, max-age=3600"
   ```

3. **CloudFront Distribution:**
   - Origin: S3 bucket
   - Default root object: `index.html`
   - Error pages: Route 404 to `/404.html`

4. **Route 53:**
   - Create A record (alias to CloudFront distribution)
   - Enable IPv6 (AAAA record)

5. **SSL Certificate:**
   - Request certificate in AWS Certificate Manager
   - Validate domain ownership
   - Attach to CloudFront distribution

## Monorepo Setup

Deploy documentation from monorepo structure.

### Directory Structure

```
monorepo/
├── packages/
│   ├── app/
│   ├── api/
│   └── docs/           # Mintlify documentation
│       ├── docs.json
│       ├── introduction.mdx
│       └── api/
└── package.json
```

### Configuration

**Root `package.json`:**

```json
{
  "workspaces": ["packages/*"],
  "scripts": {
    "docs:dev": "npm run dev --workspace=packages/docs",
    "docs:build": "npm run build --workspace=packages/docs"
  }
}
```

**`packages/docs/package.json`:**

```json
{
  "name": "docs",
  "version": "1.0.0",
  "scripts": {
    "dev": "mintlify dev",
    "build": "mintlify build"
  },
  "devDependencies": {
    "mintlify": "latest"
  }
}
```

### CI/CD for Monorepo

**GitHub Actions:**

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]
    paths:
      - 'packages/docs/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build docs
        run: npm run docs:build

      - name: Deploy
        run: npx mintlify deploy
        env:
          MINTLIFY_TOKEN: ${{ secrets.MINTLIFY_TOKEN }}
```

## CI/CD Validation

Validate documentation in CI pipeline.

### GitHub Actions

```yaml
name: Validate Docs

on:
  pull_request:
    paths:
      - 'docs/**'
      - 'docs.json'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install Mintlify
        run: npm install -g mintlify

      - name: Validate config
        run: mint validate

      - name: Check broken links
        run: mint broken-links

      - name: Check accessibility
        run: mint a11y

      - name: Validate OpenAPI
        run: mint openapi-check
```

### GitLab CI

```yaml
validate-docs:
  image: node:18
  stage: test
  only:
    changes:
      - docs/**
      - docs.json
  script:
    - npm install -g mintlify
    - mint validate
    - mint broken-links
    - mint openapi-check
```

### CircleCI

```yaml
version: 2.1

jobs:
  validate:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run:
          name: Install Mintlify
          command: npm install -g mintlify
      - run:
          name: Validate
          command: |
            mint validate
            mint broken-links
            mint a11y

workflows:
  docs:
    jobs:
      - validate:
          filters:
            branches:
              only:
                - main
                - develop
```

## Authentication

Protect documentation with authentication.

### Mintlify Auth (Built-in)

1. **Enable in Dashboard:**
   - Go to Settings > Authentication
   - Enable "Require Authentication"
   - Choose auth method

2. **Auth Methods:**
   - Email allowlist
   - Google OAuth
   - GitHub OAuth
   - Custom SSO (SAML)

3. **Configure:**
   ```json
   {
     "auth": {
       "enabled": true,
       "method": "google",
       "allowedDomains": ["company.com"]
     }
   }
   ```

### Custom Authentication

Integrate with existing auth system:

1. **Reverse Proxy:**
   - Place auth layer before Mintlify
   - Validate session/token
   - Proxy authenticated requests

2. **Example (Nginx + OAuth2 Proxy):**
   ```nginx
   location /docs {
       auth_request /oauth2/auth;
       error_page 401 = /oauth2/sign_in;

       proxy_pass https://your-site.mintlify.app;
   }
   ```

## Content Security Policy (CSP)

Configure CSP headers for security.

### Required CSP Directives

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mintlify.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.mintlify.com;
  frame-src 'self' https://mintlify.com;
```

### Cloudflare Configuration

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newHeaders = new Headers(response.headers)

  newHeaders.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://mintlify.com"
  )

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}
```

## Environment-Specific Configuration

Manage configurations per environment.

### Multiple Config Files

```
docs/
├── docs.json              # Production config
├── docs.staging.json      # Staging config
├── docs.development.json  # Development config
```

### Build with Environment Config

```bash
# Development
MINTLIFY_CONFIG=docs.development.json mint dev

# Staging
MINTLIFY_CONFIG=docs.staging.json mint build

# Production
mint build  # Uses docs.json by default
```

### Environment Variables

Inject environment-specific values:

```json
{
  "name": "${DOCS_SITE_NAME}",
  "api": {
    "playground": {
      "proxy": "${API_BASE_URL}"
    }
  },
  "integrations": {
    "ga4": {
      "measurementId": "${GA4_MEASUREMENT_ID}"
    }
  }
}
```

**GitHub Actions:**

```yaml
- name: Build docs
  run: mint build
  env:
    DOCS_SITE_NAME: "My Docs"
    API_BASE_URL: "https://api.example.com"
    GA4_MEASUREMENT_ID: "G-XXXXXXXXXX"
```

## Cache Configuration

Optimize caching for better performance.

### CDN Cache Headers

```
Cache-Control: public, max-age=3600, s-maxage=86400
```

### Cloudflare Page Rules

```
URL: docs.example.com/*
Settings:
  - Cache Level: Standard
  - Edge Cache TTL: 1 day
  - Browser Cache TTL: 1 hour
```

### Invalidation

Invalidate cache after deployment:

**Cloudflare:**
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

**AWS CloudFront:**
```bash
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"
```

## Deployment Checklist

Pre-deployment validation:

- [ ] Run `mint validate` - Check configuration
- [ ] Run `mint broken-links` - Verify all links work
- [ ] Run `mint a11y` - Check accessibility
- [ ] Run `mint openapi-check` - Validate API specs
- [ ] Test preview deployment
- [ ] Verify custom domain DNS
- [ ] Check SSL certificate
- [ ] Test authentication (if enabled)
- [ ] Validate CSP headers
- [ ] Review analytics integration
- [ ] Check mobile responsiveness
- [ ] Test search functionality
- [ ] Verify social preview images
