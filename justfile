# Plane local development task runner.
# Requires `just` (https://github.com/casey/just). Run `just` to list recipes.

set fallback := true

# Compose file used for every Docker recipe.
compose := "docker compose -f docker-compose-local.yml"
# Django settings module used by management commands inside the api container.
settings := "plane.settings.local"

# Show the list of available recipes (default).
default:
    @just --list

# --- Environment setup ---

# Generate .env files for every service and install node modules (runs setup.sh).
setup:
    ./setup.sh

# --- Docker lifecycle ---

# Build images, then start all services in the background.
up:
    {{compose}} up -d

# Build images, then start all services attached (streams logs, Ctrl-C to stop).
up-fg:
    {{compose}} up

# Stop and remove containers and networks (volumes are kept).
down:
    {{compose}} down

# Start previously created (stopped) containers.
start:
    {{compose}} start

# Stop running containers without removing them.
stop:
    {{compose}} stop

# Restart all services (optional: pass a service name).
restart service='':
    {{compose}} restart {{service}}

# Build or rebuild service images.
build:
    {{compose}} build

# Rebuild service images from scratch, ignoring the cache.
rebuild:
    {{compose}} build --no-cache

# Start only infrastructure services (db, redis, mq, minio).
infra:
    {{compose}} up -d plane-db plane-redis plane-mq plane-minio

# --- Logs & status ---

# Follow logs (optional: pass a service name, e.g. `just logs api`).
logs service='':
    {{compose}} logs -f {{service}}

# Follow worker and beat-worker logs together.
worker-logs:
    {{compose}} logs -f worker beat-worker

# List containers and their status.
ps:
    {{compose}} ps

# Show live resource usage for running containers.
stats:
    {{compose}} stats

# --- Backend (Django / api) ---

# Run database migrations via the migrator service.
migrate:
    {{compose}} up migrator

# Open a shell in a running service (default: api).
shell service='api':
    {{compose}} exec {{service}} /bin/bash

# Run an arbitrary manage.py command in the api container, e.g. `just manage showmigrations`.
manage *args:
    {{compose}} exec api python manage.py {{args}} --settings={{settings}}

# Generate new Django migrations (optional: pass an app label).
makemigrations app='':
    {{compose}} exec api python manage.py makemigrations {{app}} --settings={{settings}}

# Open the Django shell.
django-shell:
    {{compose}} exec api python manage.py shell --settings={{settings}}

# Create a Django superuser interactively.
createsuperuser:
    {{compose}} exec api python manage.py createsuperuser --settings={{settings}}

# Collect static files.
collectstatic:
    {{compose}} exec api python manage.py collectstatic --noinput --settings={{settings}}

# --- Database ---

# Open a psql session against the local Postgres database.
dbshell:
    {{compose}} exec plane-db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'

# Dump the database to a local file (default: plane-backup.sql).
db-backup file='plane-backup.sql':
    {{compose}} exec -T plane-db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "{{file}}"

# Restore the database from a dump file (default: plane-backup.sql).
db-restore file='plane-backup.sql':
    {{compose}} exec -T plane-db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' < "{{file}}"

# --- Frontend / Node ---

# Install node modules with pnpm.
fe-install:
    pnpm install

# Start the frontend dev servers (web: 3000, admin: 3001/god-mode).
fe-dev:
    pnpm dev

# Build all packages and apps.
fe-build:
    pnpm build

# Run all frontend checks (format, lint, types).
fe-check:
    pnpm check

# Auto-fix frontend format and lint issues.
fe-fix:
    pnpm fix

# --- Cleanup ---

# Stop and remove containers, networks, and named volumes (deletes local data).
clean:
    {{compose}} down -v

# Remove this project's containers, networks, and locally-built images.
# keeps volumes/data; does not touch other Docker projects.
prune:
    {{compose}} down --rmi local --remove-orphans
