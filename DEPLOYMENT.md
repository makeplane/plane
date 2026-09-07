# Deploying Workspaces

End-to-end guide for building this Plane fork from source and running it on a VPS, including the
Engineering Operations extension (`PROJECT.md`) and the Odoo attendance bridge.

Assumes an Ubuntu VPS with **8 GB RAM**, a domain you control, and **Docker Compose v2.24 or
newer**. A first run takes 20–35 minutes, nearly all of it the image build.

| If you want to…                             | Go to                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Deploy from scratch                         | [§1](#1-before-you-touch-the-server) through [§6](#6-verify)                         |
| Understand why the files look like this     | [`docs/deployment/architecture.md`](docs/deployment/architecture.md)                 |
| Move an existing install onto this layout   | [`docs/deployment/migration.md`](docs/deployment/migration.md)                       |
| Upgrade, back up, or roll back              | [§9 Operating it](#9-operating-it)                                                   |
| Understand what the ops layer does          | [`docs/engineering-operations.md`](docs/engineering-operations.md)                   |
| Know which Odoo endpoints are still missing | [`odoo-implementation/ODOO_MODULE_SPEC.md`](odoo-implementation/ODOO_MODULE_SPEC.md) |

---

## Architecture

```text
browser ──HTTPS──▶ nginx :443 ──127.0.0.1:8080──▶ Caddy ──▶ web      /*
                   (yours, on the host)            (in the  api      /api /auth /static
                                                    stack)  live     /live (websocket)
                                                            space    /spaces
                                                            admin    /god-mode
                                                            minio    /uploads
                                                              │
              worker  ─┐                                      └─ api ──X-Atlas-Key──▶ Odoo bridge
              beat    ─┼─ celery ── RabbitMQ                          (outbound only)
              migrator ┘             Postgres · Valkey
```

Two proxies on purpose. Your nginx keeps 443 and terminates TLS; the stack's bundled Caddy keeps
the path routing it already ships with and binds to loopback. Rebuilding Caddy's routes in nginx
would mean publishing five container ports and hand-writing every location block, so nginx has a
single `location /`.

**The beat scheduler is not optional here.** It is what runs the operations reminders — missing
work logs, missing check-ins, blocked and overdue work, requests waiting on a PM. Without it the
rest of the product works and the notifications simply never arrive.

### The three compose files

| File                                 | What it decides                                                      |
| ------------------------------------ | -------------------------------------------------------------------- |
| `docker-compose.yml`                 | Which services exist, how images build, what each container receives |
| `deployments/production/compose.yml` | Health checks, start-up ordering, log rotation                       |
| `deployments/workspaces/compose.yml` | The edge: Caddy on loopback, trust the host nginx                    |

You never type those paths. `COMPOSE_FILE` in `.env` chains them, so plain `docker compose …`
is always the right command. [`docs/deployment/architecture.md`](docs/deployment/architecture.md)
explains why the split is where it is.

---

## 1. Before you touch the server

### Push the code

The server deploys from git. Commit and push to your fork first, or you will build stock Plane
and wonder where the Operations section went.

```bash
git status --short          # nothing important uncommitted
git push origin preview
```

### Point the DNS

```bash
dig +short workspaces.hgsoftware.com.np   # should print the VPS IP
```

Replace `workspaces.hgsoftware.com.np` consistently everywhere below.

> [!WARNING]
> **HTTPS is a prerequisite of attendance, not a hardening step.** Browser geolocation only works
> in a secure context. On plain HTTP the check-in button reports location unavailable and nobody
> can clock in at all.

### If attendance is wanted, start the allow-list now

`/api/v1/*` on the Odoo host is restricted at its reverse proxy to the Atlas API host's IP. This
VPS is a new client and will be denied until its address is added — and that is someone else's
machine, so it can take a day. [§8](#8-switch-attendance-on) has the detail; the change itself is
one line:

```nginx
# on the Odoo host (VM01)
location /api/v1/ {
    allow 172.16.10.54;          # the Atlas API host
    allow <this VPS public IP>;  # add this line
    deny all;
    proxy_pass http://odoo;
}
```

---

## 2. Docker and the code

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # log out and back in

docker compose version          # must be v2.24.0 or newer
```

v2.24 is a hard floor: the overlays use `!override`, and on older Compose the port lists _merge_
instead of being replaced — Caddy then tries to take 80 and 443 and collides with nginx.
`init-env.sh` checks the version for you and refuses to run on anything older.

```bash
sudo mkdir -p /opt/workspaces && sudo chown $USER:$USER /opt/workspaces
git clone -b preview <your-fork-url> /opt/workspaces
cd /opt/workspaces
```

> [!NOTE]
> **`setup.sh` is the development bootstrap, not this one.** It ends with `corepack enable` and
> `pnpm install`, which need a Node toolchain the server does not have and the Docker build does
> not use. The server uses `deployments/workspaces/init-env.sh` instead.

---

## 3. Configuration

One file: `.env` in the repository root. Compose reads it for its own interpolation, the Django
containers load all of it, and every other container receives exactly the values
`docker-compose.yml` forwards to it. Nothing else needs editing.

```bash
deployments/workspaces/init-env.sh workspaces.hgsoftware.com.np
```

That copies `deployments/workspaces/.env.example`, fills in the domain, generates all six secrets with
`openssl rand -hex 32`, `chmod 600`s the result, and refuses to overwrite an existing `.env`. It
finishes by running `docker compose config` so you find out immediately if anything is wrong.

Then read the file. Two things it cannot decide for you:

- **`ODOO_BASE_URL` / `ODOO_API_KEY`** — leave blank unless you are doing [§8](#8-switch-attendance-on).
- **`COMPOSE_PROJECT_NAME`** — it fixes the volume prefix (`workspaces_pgdata`, …). If a stack
  already runs on this host, it must match that stack's prefix or your first `up` starts with
  empty volumes. Check with `docker volume ls`.

### What the important variables do

| Variable                 | Why it matters                                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SECRET_KEY`             | Signs sessions and password-reset links. Blank ⇒ each container invents its own ⇒ users logged out at random                                                                                                                                                              |
| `CORS_ALLOWED_ORIGINS`   | Django derives `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` and `CSRF_TRUSTED_ORIGINS` from it. One `https://` origin, no trailing slash. Any `http:` entry switches secure cookies off for _all_ of them and sign-in fails with a CSRF error that never names the cause |
| `WEB_URL`                | Its scheme becomes the public prefix of every uploaded file. `http://` here ⇒ images blocked as mixed content                                                                                                                                                             |
| `SITE_ADDRESS`           | What Caddy binds to. Keep it `:80`; a hostname makes Caddy try to fetch its own certificate, which nginx already holds                                                                                                                                                    |
| `TRUSTED_PROXIES`        | Who may set `X-Forwarded-*`. `private_ranges` = the docker bridge nginx arrives from. Not `0.0.0.0/0`, which lets anyone spoof a client IP                                                                                                                                |
| `LISTEN_HTTP_PORT`       | The loopback port nginx forwards to. Must match `proxy_pass` in your nginx vhost                                                                                                                                                                                          |
| `FILE_SIZE_LIMIT`        | Upload ceiling. Django and Caddy read it; nginx's `client_max_body_size` must be at least as large                                                                                                                                                                        |
| `LIVE_SERVER_SECRET_KEY` | Guards the live server's admin endpoints. The container exits without it                                                                                                                                                                                                  |

---

## 4. nginx and TLS

Two passes, because of a chicken and egg: the real vhost names certificate files that do not exist
yet, and nginx refuses to load a file pointing at a missing certificate.

**Pass one.** A bare port-80 site, just so certbot has something to work with:

```bash
sudo tee /etc/nginx/sites-available/workspaces.conf >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name workspaces.hgsoftware.com.np;
    root /var/www/html;
}
EOF
sudo ln -sf /etc/nginx/sites-available/workspaces.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Get the certificate.** The domain must already resolve to this VPS and port 80 must be reachable
from the internet:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d workspaces.hgsoftware.com.np
```

Besides the certificate, that also writes `/etc/letsencrypt/options-ssl-nginx.conf` and
`ssl-dhparams.pem`, which the real vhost includes.

**Pass two.** Install the real vhost. This overwrites certbot's edits to the placeholder file, but
the certificate it obtained stays on disk:

```bash
sudo cp deployments/workspaces/nginx.conf /etc/nginx/sites-available/workspaces.conf
sudo nginx -t && sudo systemctl reload nginx
```

No `sed` step: the template already carries `workspaces.hgsoftware.com.np` and port 8080. If `nginx -t`
reports `ssl-dhparams.pem` missing, generate it and test again:

```bash
sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
```

The template carries the websocket upgrade map, the forwarded headers, gzip, HSTS and a
`client_max_body_size` matching `FILE_SIZE_LIMIT`. Two lines are load-bearing:

- **`X-Forwarded-Proto`** is how Django decides a request is secure. Drop it and every session
  cookie is issued as though the site were plain HTTP, which presents as a login that submits,
  succeeds, and lands you back on the sign-in page.
- **`Upgrade` / `Connection`** are what make `/live/` work. Without them pages load but never
  sync, and nothing logs an error.

Renewal is certbot's systemd timer, already installed. Confirm with `systemctl list-timers | grep
certbot`, and test the renewal path without touching the live certificate:

```bash
sudo certbot renew --dry-run
```

---

## 5. Bring the stack up

```bash
docker compose up -d --build     # first build: 20-35 min
```

There is nothing to remember and no alias to define: `COMPOSE_FILE` in `.env` already selects the
base file plus the production and Workspaces overlays. If you ever need to see what that resolves to:

```bash
docker compose config --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["services"]["proxy"]["ports"])'
# [{'mode': 'ingress', 'host_ip': '127.0.0.1', 'target': 80, 'published': '8080', 'protocol': 'tcp'}]
```

One mapping, on loopback. If you see `0.0.0.0` or a second mapping on 443, the overlays did not
apply — check `COMPOSE_FILE` and your Compose version.

Start-up order is enforced, so this takes a minute longer than an unordered stack and that is the
point:

```text
workspaces-db, workspaces-redis, workspaces-mq, workspaces-minio   → healthy
migrator                                       → runs the migrations, exits 0
api, worker, beat-worker                       → start only after the migrator succeeded
live, proxy                                    → last
```

```bash
docker compose ps -a
# migrator     Exited (0)      ← correct, it is a one-shot; -a is needed to see it
# api          Up (healthy)
# worker,
# beat-worker  Up              ← no health check; they serve no HTTP
```

Then open `https://workspaces.hgsoftware.com.np/god-mode` and create the instance administrator. That account
configures the instance; ordinary members sign up on the main app afterwards.

---

## 6. Verify

```bash
deployments/workspaces/verify.sh https://workspaces.hgsoftware.com.np
```

That is the regression checklist as an executable. It checks every container's health, that the
proxy is bound to loopback only, that Caddy accepts its configuration, that each container
received the configuration it needs _and nothing it must not_, that all eight routes answer, that
nginx forwards the scheme correctly, that the upload limit is enforced, that websockets upgrade,
and that the beat scheduler registered the four reminders. It exits non-zero with the count of
failures.

What it deliberately does not cover is the product itself. After it passes, in a browser:

- [ ] **Operations** appears in the left sidebar, below Projects.
- [ ] `/<workspace>/operations` loads and the four dashboard tabs (My work, Project manager, QA,
      DevOps) each render without an error panel.
- [ ] **Work logs** — today's draft appears without you creating it, autosaves as you type, and
      **File it** refuses an empty log.
- [ ] **Requests** — file one, move it New → PM review → Approved, then convert it into a work
      item. The new work item opens, carries the description and priority, and the ticket becomes
      read-only with a link to it.
- [ ] **Records** — create one; it does **not** appear in any project's work item list.
- [ ] **Deployments** — record one, set it to Deployed, and confirm the completed time filled
      itself in.
- [ ] **Analytics** and **Reports** — the sections load. Empty numbers on a new install are
      correct; an error panel is not.

The dashboards read zero on a brand-new workspace and that is correct — they measure work that has
moved through the workflow. Come back after a sprint.

---

## 7. Set up Engineering Operations

### 7a. Apply the workflow to your workspace

`PROJECT.md` fixes a nine-state workflow, a label vocabulary and nine work item types. The
bootstrap creates them. It is **additive and idempotent** — anything that already exists is left
exactly as it is, and nothing is ever deleted, so it is safe to re-run.

```bash
# See what it would do first
docker compose exec api python manage.py bootstrap_engineering_ops --workspace <your-slug> --dry-run

# Then do it
docker compose exec api python manage.py bootstrap_engineering_ops --workspace <your-slug>
```

The one non-additive thing it does is rename a project's `Done` state to `Deployed`, and only
while no work item is sitting in it. Past that point the name is part of somebody's history and it
is left alone — you will get a separate `Deployed` state instead.

A workspace admin can do the same thing from the UI at **Operations → Settings → Apply the
engineering workflow**. Same code path.

> [!NOTE]
> If your projects already have their own state names, skip the bootstrap and map them instead:
> **Operations → Settings → State mapping**. Every dashboard and metric is phrased in semantic
> buckets (`qa`, `blocked`, `developer_owned`…), and that screen is what tells them which of your
> states fill each one. Leave it wrong and the dashboards read zero without erroring.

### 7b. Confirm the reminders are scheduled

`verify.sh` already counts them. To see which:

```bash
docker compose exec api python manage.py shell -c "
from django_celery_beat.models import PeriodicTask
for t in PeriodicTask.objects.filter(name__startswith='engineering-ops'):
    print(t.name, '->', t.task, '[enabled]' if t.enabled else '[DISABLED]')
"
```

The work-log and attendance reminders are hourly and each checks the workspace's _local_ hour
before firing (17:00 and 10:00 by default, configurable in Operations → Settings). Running one by
hand outside those hours correctly queues nothing:

```bash
docker compose exec api python manage.py shell -c "
from workspaces.bgtasks.operations_reminder_task import remind_blocked_and_overdue
print(remind_blocked_and_overdue(), 'notifications queued')
"
```

---

## 8. Switch attendance on

The stack runs fine without this. With `ODOO_BASE_URL` unset the status endpoint reports the
feature unavailable, the navbar control hides itself and the attendance screen says so plainly —
no errors, nothing broken.

Do the [allow-list](#if-attendance-is-wanted-start-the-allow-list-now) first; it is on another
machine and until it is done your first end-to-end test fails with a 403 from nginx rather than
anything in Plane.

```dotenv
# .env
ODOO_BASE_URL=https://<the odoo host>   # no trailing slash
ODOO_API_KEY=<from Odoo → Settings → Atlas Bridge>
```

> [!WARNING]
> **Never regenerate that key.** Atlas is a second consumer of the same bridge and holds the same
> key. Generating a new one in Odoo silently breaks Atlas. Read the existing key; don't create
> one. (`odoo-implementation/README.md` is the addon's own document and tells you to generate one
> — that instruction does not apply here.)

```bash
docker compose up -d --force-recreate api worker beat-worker
# the environment is read at container creation; a restart alone won't pick it up
```

### Prove the bridge, then the enforcement

```bash
# 1 · the bridge, from the VPS itself
KEY=<key>; ODOO=https://<odoo host>
curl -s -o /dev/null -w '%{http_code}\n' "$ODOO/api/v1/health"   # 401 — key required
curl -s -H "X-Atlas-Key: $KEY" "$ODOO/api/v1/health"             # 200 — names the db
# a 403 here is the allow-list, not your code
```

```bash
# 2 · through Plane, signed in as yourself
curl -s -b <cookie jar> https://workspaces.hgsoftware.com.np/api/attendance/me/

# the test that proves the enforcement is real —
# the bridge would happily accept this, Plane must not
curl -s -X POST -b <cookie jar> -H 'Content-Type: application/json' \
  -d '{}' https://workspaces.hgsoftware.com.np/api/attendance/check-in/
# expect 400 location_required
```

Then in the browser:

- [ ] The control appears in the top bar, immediately left of your avatar.
- [ ] Check in — then confirm the record appears in Odoo's attendance view **with the coordinates
      on it**, not just in the UI.
- [ ] Check out; the hours land.
- [ ] Deny location, try to check in — refused, and **nothing written to Odoo**. Verify the second
      half in Odoo.
- [ ] Deny location and check _out_ — this must still succeed, or an open session is stranded with
      Odoo counting hours.
- [ ] Open two tabs and check in from both — no duplicate session, no alarming error.
- [ ] Break `ODOO_API_KEY` on purpose — the control disappears and the rest of the workspace is
      unaffected.

**One thing to pass on:** bridge punches are labelled _Atlas_ in Odoo, so a Workspaces punch and an
Atlas punch look identical there. Separating them would need a new value in the addon, which is a
module upgrade on VM01 and out of scope.

### What works and what doesn't yet

The deployed bridge serves three endpoints: today's status, check in, check out. Four more are
called but **not yet served**, and they answer `200` with `{"available": false}` rather than an
error:

| Screen                     | State                                                                             |
| -------------------------- | --------------------------------------------------------------------------------- |
| Navbar check in / out      | Works                                                                             |
| Attendance → Today         | Works                                                                             |
| Attendance → History       | Needs `GET /api/v1/attendance/history`                                            |
| Attendance → Leave         | Needs `GET /api/v1/leave/me`                                                      |
| Attendance → Holidays      | Needs `GET /api/v1/holidays`                                                      |
| Attendance → Working hours | Needs `GET /api/v1/employees/working-hours`                                       |
| Attendance → Who is in     | Works — falls back to a cached per-person fan-out until `/attendance/team` exists |

Contracts for the missing endpoints are in
[`odoo-implementation/ODOO_MODULE_SPEC.md`](odoo-implementation/ODOO_MODULE_SPEC.md). Once the Odoo
module ships they start returning data with no change on this side and no redeploy.

### Prove the email mapping before the team notices

Every Workspaces account is supposed to match an Odoo employee by email. Intent drifts — a married
name, a `@hgn` vs `@hgsoftware` address, one contractor added in a hurry. Check once; it turns a
fortnight of one-off complaints into a list.

```bash
docker compose exec -T api python manage.py shell -c \
  "from workspaces.db.models import User; print('\n'.join(User.objects.filter(is_active=True).values_list('email', flat=True)))" \
  | tr 'A-Z' 'a-z' | sort > /tmp/workspaces-users.txt

curl -s -H "X-Atlas-Key: $KEY" "$ODOO/api/v1/employees" \
  | jq -r '.employees[].work_email // empty' | tr 'A-Z' 'a-z' | sort > /tmp/odoo-emails.txt

comm -23 /tmp/workspaces-users.txt /tmp/odoo-emails.txt   # accounts with no employee
```

---

## 9. Operating it

### Upgrading

```bash
cd /opt/workspaces
deployments/workspaces/backup.sh                  # always, first

# tag the current images so you can roll back to them
for s in api web admin space live proxy; do
  docker tag workspaces-$s:latest workspaces-$s:previous
done

git pull
docker compose up -d --build
deployments/workspaces/verify.sh https://workspaces.hgsoftware.com.np
```

The migrator runs automatically and the api, worker and beat wait for it to exit 0 before starting
— so a failed migration stops the deploy instead of leaving a running api on a half-migrated
schema. Watch it with `docker compose logs -f migrator`, then `docker compose logs -f api`.

### Rolling back

```bash
for s in api web admin space live proxy; do
  docker tag workspaces-$s:previous workspaces-$s:latest
done
docker compose up -d --no-build
```

That reverses the code. It does **not** reverse a migration — if the upgrade migrated the schema,
restore the database too.

### Backups

```bash
deployments/workspaces/backup.sh                  # ./backups/<timestamp>/
deployments/workspaces/backup.sh /mnt/backups     # somewhere with more room
```

Dumps Postgres and tars the uploads volume, writes `SHA256SUMS`, and keeps the newest seven sets
(`BACKUP_KEEP` to change that). A nightly cron entry:

```cron
15 2 * * *  cd /opt/workspaces && deployments/workspaces/backup.sh /mnt/backups >> /var/log/workspaces-backup.log 2>&1
```

`.env` is deliberately **not** in the backup and deliberately **not** in git. Keep it somewhere
safe yourself — `SECRET_KEY` is what decrypts the instance settings inside the database dump, so a
dump without the matching key is only most of a backup.

### Restoring a backup

```bash
docker compose down
docker volume rm workspaces_pgdata workspaces_uploads

docker compose up -d workspaces-db workspaces-minio        # recreates empty volumes
gunzip -c backups/<stamp>/postgres.sql.gz | docker compose exec -T workspaces-db psql -U workspaces -d workspaces
docker run --rm -v workspaces_uploads:/data -v "$PWD/backups/<stamp>":/backup \
  alpine:3.20 tar xzf /backup/uploads.tar.gz -C /data

docker compose up -d
```

Restore with the same `.env` the dump was taken under, or the encrypted instance settings will not
decrypt.

### Logs

```bash
docker compose logs -f api           # service names, not container names
docker compose logs -f beat-worker
docker compose logs -f migrator
```

Each container's json log is capped at 10 MB × 5 files by the production overlay, so a chatty
service cannot fill the disk.

---

## 10. Symptoms worth recognising

Each of these presents as something other than its cause.

| What you see                                                | What it actually is                                                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `proxy` restarting, log says _server block without any key_ | `SITE_ADDRESS` is not reaching the proxy container. `docker compose exec proxy printenv SITE_ADDRESS`                       |
| `proxy` log: _wrong argument count … after max_size_        | `FILE_SIZE_LIMIT` is set but empty. Caddy's inline defaults only fire when a variable is **absent**                         |
| Uploads 404 through the proxy but work in MinIO             | `AWS_S3_BUCKET_NAME` empty ⇒ the bucket routes collapsed to `/`. Same empty-vs-absent rule                                  |
| Stack won't start, port in use                              | The overlays weren't applied, so Caddy tried to take 80/443. Check `COMPOSE_FILE` in `.env` and Compose ≥ 2.24              |
| Users logged out at random                                  | `SECRET_KEY` blank, so each container generated its own                                                                     |
| Login submits, returns to sign-in                           | `CORS_ALLOWED_ORIGINS` contains an `http:` origin, or nginx isn't sending `X-Forwarded-Proto`                               |
| `could not translate host name "${POSTGRES_HOST}"`          | A `DATABASE_URL` with `${…}` placeholders reached Django unexpanded — comment it out or write it in full                    |
| `api` never leaves `health: starting`                       | `docker compose logs api`. Usually the database URL or a missing `SECRET_KEY`                                               |
| `live` exits immediately                                    | `API_BASE_URL` or `LIVE_SERVER_SECRET_KEY` missing. The container prints which                                              |
| `worker`/`beat-worker` restarting                           | RabbitMQ wasn't ready. The production overlay fixes the ordering — check you passed all three compose files                 |
| First `up` starts with an empty database                    | `COMPOSE_PROJECT_NAME` doesn't match the existing volume prefix. `docker volume ls`                                         |
| Operations sidebar entry missing                            | You are on a stale web image. `docker compose up -d --build web`                                                            |
| Operations pages load, every number is zero                 | Either a genuinely new workspace, or the state mapping doesn't match your states — §7a                                      |
| Deep link 404s on refresh, works when clicked               | Caddy's SPA fallback isn't serving `index.html` — you are not on the stack's own web image                                  |
| Reminders never arrive                                      | The beat worker is down, or `engineering-ops-*` is missing from `PeriodicTask` — §7b                                        |
| Work log won't submit                                       | Correct. An empty log is refused so the "missing logs" count can't be zeroed by clicking the button                         |
| Ticket won't convert                                        | It must be **Approved** first, you must be a member of the target project, and it converts exactly once                     |
| Check-in button absent                                      | Expected when `ODOO_BASE_URL` is unset. Otherwise the bridge is unreachable — look for `workspaces.external` in the api log |
| 403 from the bridge                                         | The VPS IP isn't in the Odoo allow-list (§1)                                                                                |
| "Location is unavailable"                                   | The page isn't on HTTPS, or the certificate isn't trusted                                                                   |
| One person can't check in                                   | Their Workspaces email doesn't match an Odoo `work_email`. The message names the fix; the server logs it at warning level   |
| Attendance history says "not available yet"                 | Expected. That bridge endpoint doesn't exist — §8                                                                           |
| Images upload but don't render                              | `WEB_URL` is `http://`, so file URLs are mixed content                                                                      |
| Pages load but never sync                                   | The websocket upgrade headers are missing from the nginx location block                                                     |
| Large uploads fail with a generic browser error             | `client_max_body_size` in nginx is below `FILE_SIZE_LIMIT`; nginx rejects the body before Caddy or Django see it            |

---

## The order that matters

Three steps are on machines other than the VPS, and each blocks a later phase in a way that reads
like a bug in the code. Do them early:

1. **Push the commit** — the server deploys from git.
2. **Point the DNS** — TLS gates attendance entirely.
3. **Get the VPS IP onto the Odoo allow-list** — someone else may have to do this for you.

And one that is easy to forget because nothing complains: **run the bootstrap (§7a)**. The
migration creates the tables; the bootstrap creates the workflow the dashboards are phrased in.
Skip it and everything loads, nothing errors, and every number is zero.
