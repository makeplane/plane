# Stack technique du projet

> Fichier généré automatiquement par le subagent `stack-detector` lors de l'initialisation.
> Dernière détection : 2026-06-30
> Projet : **Plane** v1.3.1 — alternative open-source à Jira/Linear (AGPL-3.0)
> Repository : https://github.com/makeplane/plane

---

## Apps (monorepo)

| App | Chemin | Stack | Rôle |
|-----|--------|-------|------|
| `api` | `apps/api` | Django 4.2 (Python) | API REST + workers Celery |
| `web` | `apps/web` | React Router v7 (SSG) | Interface principale utilisateur |
| `admin` | `apps/admin` | React Router v7 (SSG) | Interface d'administration instance |
| `space` | `apps/space` | React Router v7 (SSR) | Vue publique des projets (embed) |
| `live` | `apps/live` | Express + Hocuspocus | Serveur de collaboration temps réel |
| `proxy` | `apps/proxy` | Caddy | Reverse proxy (Community Edition) |

---

## Frontend — `apps/web`

- **Framework :** React Router v7.15.1 (anciennement Remix), mode SSG (`ssr: false`)
- **Langage :** TypeScript 5.8.3
- **Build :** Vite 8.0.16
- **UI :** Tailwind CSS v4.1.17 + design system interne `@plane/ui` + Lucide React 0.469.0 + Headless UI 1.7
- **State management :** MobX 6.12.0 + MobX React 9.1.1 (stores centralisés dans `store/`)
- **Requêtes HTTP :** Axios 1.16.0 + SWR 2.2.4 (cache + revalidation)
- **Drag & Drop :** @atlaskit/pragmatic-drag-and-drop
- **Éditeur riche :** Tiptap (via package interne `@plane/editor`)
- **PDF :** @react-pdf/renderer
- **Internationalisation :** i18next 25.x + react-i18next 16.x (via `@plane/i18n`)
- **Formulaires :** react-hook-form 7.51.5
- **Charts :** Recharts 2.x
- **Port dev :** 3000

### Structure `apps/web`
```
app/
  (all)/          # Routes authentifiées
  (home)/         # Page d'accueil
  routes/         # Définitions des routes
  compat/next/    # Shims de compatibilité (migration depuis Next.js)
  types/          # Types React Router
  root.tsx        # Layout racine
  routes.ts       # Arbre de routes
store/            # Stores MobX
```

### Commandes `apps/web`
```bash
pnpm dev          # dev server port 3000
pnpm build        # build production (react-router build)
pnpm start        # serve le build statique (port 3000)
pnpm check:lint   # oxlint (--max-warnings=11957)
pnpm check:types  # react-router typegen + tsc --noEmit
pnpm check:format # oxfmt --check
pnpm fix:lint     # oxlint --fix
pnpm fix:format   # oxfmt
```

---

## Frontend — `apps/admin`

- **Framework :** React Router v7.15.1, mode SSG (`ssr: false`)
- **Langage :** TypeScript 5.8.3
- **Build :** Vite 8.0.16
- **UI :** Tailwind CSS v4 + `@plane/ui` + Lucide React
- **State management :** MobX 6.12.0
- **Requêtes HTTP :** Axios + SWR
- **Port dev :** 3001
- **Rôle :** panneau d'administration de l'instance Plane (configuration SMTP, SSO, licences, etc.)

### Commandes `apps/admin`
```bash
pnpm dev          # dev server port 3001
pnpm build        # build production
pnpm start        # serve le build statique (port 3001)
pnpm check:types  # react-router typegen + tsc --noEmit
```

---

## Frontend — `apps/space`

- **Framework :** React Router v7.15.1, mode **SSR** (`ssr: true`)
- **Langage :** TypeScript 5.8.3
- **Build :** Vite 8.0.16
- **UI :** Tailwind CSS v4 + `@plane/ui` + Lucide React
- **State management :** MobX 6.12.0 + MobX Utils
- **Serveur :** @react-router/serve (Node.js)
- **Port dev :** 3002
- **Rôle :** vue publique embarquable des issues/projets Plane (embed sur sites externes)

### Commandes `apps/space`
```bash
pnpm dev          # dev server port 3002 (SSR)
pnpm build        # build production
pnpm start        # PORT=3002 react-router-serve ./build/server/index.js
```

---

## Backend — `apps/api`

- **Framework :** Django 4.2.30 + Django REST Framework 3.15.2
- **Langage :** Python (version non précisée dans pyproject.toml — contrainte via .mise.toml)
- **ASGI / WSGI :** Uvicorn 0.29.0 (ASGI) + Django Channels 4.1.0 (WebSockets)
- **ORM :** Django ORM (pas d'ORM tiers — Doctrine/Eloquent style natif Django)
- **Base de données :** PostgreSQL 15.7 (driver psycopg 3.3.0)
- **Cache / Sessions :** Redis 5.0.4 + django-redis 5.4.0 / Valkey 7.2 (image Docker)
- **Task queue :** Celery 5.4.0 + django-celery-beat (tâches planifiées) + RabbitMQ 3.13 (broker)
- **Stockage fichiers :** S3-compatible via boto3 + django-storages (MinIO en self-hosted)
- **Auth :** Session-based (SessionAuthentication DRF) + JWT (PyJWT 2.13.0) + API Keys
  - OAuth providers dans `plane/authentication/provider/`
  - Middleware custom session dans `plane/authentication/middleware/session.py`
- **Permissions :** `rest_framework.permissions.IsAuthenticated` par défaut
- **Throttling :** AnonRateThrottle (30/minute) + API key rate limit (60/minute configurable)
- **OpenAPI :** drf-spectacular 0.28.0
- **AI :** openai 1.63.2 (intégration GPT — marquée deprecated dans .env.example)
- **Observabilité :** OpenTelemetry (SDK + exporteur OTLP gRPC) + Scout APM + PostHog (analytics)
- **Logging :** python-json-logger 4.0.0 + middleware RequestLoggerMiddleware custom
- **Linter :** Ruff (format + lint, line-length=120)

### Structure `apps/api`
```
plane/
  api/            # Endpoints API REST
  app/            # Logique applicative principale
  analytics/      # Module analytics
  authentication/ # Auth providers, middleware, vues
  bgtasks/        # Tâches Celery background
  db/             # Modèles Django (User custom dans db.User)
  license/        # Gestion licences
  middleware/     # Middlewares custom (logger, body size limit)
  seeds/          # Données de seed
  settings/       # common.py, production.py, local.py, test.py
  space/          # Vues pour l'app Space
  utils/          # Utilitaires
  web/            # Vues template Django
  urls.py         # Routage principal
  celery.py       # Config Celery
  asgi.py / wsgi.py
bin/              # Scripts Docker entrypoints
requirements/
  base.txt        # Dépendances communes
  production.txt  # Production
  test.txt        # Tests
  local.txt       # Développement local
```

### Commandes `apps/api`
```bash
# Développement
python manage.py runserver

# Migrations
python manage.py makemigrations
python manage.py migrate

# Workers
celery -A plane worker -l info
celery -A plane beat -l info

# Tests
pytest
python run_tests.py

# Linter
ruff check .
ruff format .
```

---

## Backend temps réel — `apps/live`

- **Framework :** Express 4.22.0 + Hocuspocus 2.15.2 (serveur CRDT/Y.js)
- **Langage :** TypeScript 5.8.3
- **CRDT :** Y.js + y-prosemirror + y-protocols (édition collaborative Tiptap)
- **Cache :** Redis via ioredis 5.7.0 (extension @hocuspocus/extension-redis)
- **PDF export :** @react-pdf/renderer + sharp (rendu serveur)
- **Effect :** Effect-TS (@effect/platform-node) pour gestion des effets asynchrones
- **Tests :** Vitest 4.x
- **Build :** tsdown (bundler TypeScript)
- **Rôle :** serveur de collaboration temps réel pour l'éditeur riche (pages/documents)

### Commandes `apps/live`
```bash
pnpm dev          # tsdown --watch + node (hot reload)
pnpm build        # tsc --noEmit + tsdown
pnpm start        # node --env-file=.env .
pnpm test         # vitest run
pnpm test:coverage # vitest run --coverage
```

---

## Proxy — `apps/proxy`

- **Technologie :** Caddy (reverse proxy)
- **Fichiers :** `Caddyfile.ce` (Community Edition) + `Caddyfile.aio.ce` (all-in-one)
- **Rôle :** point d'entrée HTTP/HTTPS, terminaison SSL, routage vers web/admin/space/api/live

---

## Packages internes (workspace `packages/`)

| Package | Rôle |
|---------|------|
| `@plane/ui` | Design system — composants React partagés |
| `@plane/editor` | Éditeur riche Tiptap — extensions custom, logique collaborative |
| `@plane/types` | Types TypeScript partagés |
| `@plane/hooks` | Hooks React partagés |
| `@plane/services` | Couche d'appel API (Axios) partagée entre les apps |
| `@plane/constants` | Constantes partagées |
| `@plane/utils` | Utilitaires partagés |
| `@plane/i18n` | Internationalisation (i18next) |
| `@plane/propel` | Non identifié (probablement routing/navigation helpers) |
| `@plane/shared-state` | État partagé cross-app |
| `@plane/decorators` | Décorateurs TypeScript (utilisé par live) |
| `@plane/logger` | Logger partagé (utilisé par live) |
| `@plane/tailwind-config` | Config Tailwind partagée |
| `@plane/typescript-config` | Config TypeScript partagée (tsconfig base) |
| `@plane/codemods` | Codemods jscodeshift (migrations de code) |

---

## Outils transverses

- **Gestionnaire de paquets :** pnpm 11.3.0 (avec catalog pour les versions partagées)
- **Monorepo :** Turborepo 2.9.18 (`turbo.json`)
- **Node.js minimum :** 22.18.0
- **Tests JS/TS :** Vitest 4.x (uniquement dans `apps/live` et certains packages)
- **Tests Python :** pytest + pytest-django (`pytest.ini`, reuse-db, nomigrations)
- **Linter JS/TS :** oxlint 1.51.0 (remplaçant ESLint, basé sur Rust/OXC)
- **Formateur JS/TS :** oxfmt 0.35.0 (basé sur OXC)
- **Linter Python :** Ruff (lint + format, line-length=120)
- **Git hooks :** Husky 9.1.7 + lint-staged 16.2.7 (oxfmt + oxlint au pre-commit)
- **CI/CD :** GitHub Actions (`.github/workflows/`)
  - `pull-request-build-lint-api.yml` — lint/build Python
  - `pull-request-build-lint-web-apps.yml` — lint/build JS
  - `build-branch.yml` — build sur push de branche
  - `codeql.yml` — analyse sécurité
  - `i18n-sync-check.yml` — vérification synchronisation i18n
- **Docker :** docker-compose.yml complet (web, admin, space, api, worker, beat-worker, migrator, live, proxy, plane-db, plane-redis, plane-mq, plane-minio)
- **Base de données Docker :** postgres:15.7-alpine
- **Cache Docker :** valkey/valkey:7.2.11-alpine (fork Redis open-source)
- **Message broker Docker :** rabbitmq:3.13.6-management-alpine
- **Stockage objet Docker :** minio/minio
- **Storybook :** 10.4.6 (présent dans le catalog — pour `@plane/ui`)
- **Sécurité :** Trivy (`.trivyignore`), CodeQL

---

## Infrastructure complète (docker-compose)

```
[Navigateur / Client]
       |
    [Proxy Caddy :80/:443]
       |
  ┌────┴─────────────────────────┐
  |     |          |             |
[web] [admin]  [space]         [live]
:3000  :3001   :3002  (SSR)    (Hocuspocus + Express)
  |     |          |             |
  └─────┴──────────┴─────────────┘
                |
            [api Django]
            /     |    \
     [plane-db] [plane-redis] [plane-mq]
     PostgreSQL  Valkey/Redis  RabbitMQ
                          |
                    [worker + beat-worker]
                       (Celery)
                          |
                    [plane-minio]
                    (S3-compatible)
```

---

## Notes importantes

- **Migration depuis Next.js :** les apps `web` et `admin` contiennent des shims de compatibilité (`app/compat/next/`) indiquant une migration récente depuis Next.js vers React Router v7. Des fichiers `.d.ts` simulent les types `next/link` et `next/navigation`.
- **Modèle utilisateur custom :** `AUTH_USER_MODEL = "db.User"` — ne pas utiliser `django.contrib.auth.models.User` directement.
- **Pas d'ORM tiers Python :** Django ORM natif uniquement (pas de SQLAlchemy).
- **pnpm catalog :** toutes les versions de dépendances partagées sont centralisées dans `pnpm-workspace.yaml` sous la clé `catalog:`. Toujours référencer `"catalog:"` et non une version fixe dans les `package.json` des apps.
- **apps/api et apps/proxy exclus du workspace pnpm** (`!apps/api`, `!apps/proxy` dans `pnpm-workspace.yaml`) — ils ont leur propre cycle de vie (Python / Caddy).
