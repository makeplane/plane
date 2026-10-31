# Deploying the Team Ops modules

Covers Workday (which merges Time Tracking, Work Calendar and Work Reports), Hub, Teamflow, Dashboard, Leave and Teamspaces (migrations `team_ops.0001` to `0009`, plus Plane's own `db.0122` to `0125` which the server is missing).

**Nothing here has been run on the server.** The images were not built on this machine (no Docker); the code, migrations and frontend build were verified locally.

## What changes on the server

- Only the `api`, `worker`, `beat-worker`, `migrator` and `web` images. `admin`, `space`, `live`, Postgres, Redis, RabbitMQ and MinIO stay as they are.
- Database: 27 new `tops_*` tables, plus Plane's own migrations `db.0122`–`0125` (`0123` drops two columns of `api_tokens`; the server has one token with a custom `allowed_rate_limit` that will be lost; `0125` touches only project deploy boards, none on the server).
- The Hub stores files in Plane's existing private object storage (the same bucket and credentials as Plane's own uploads, under the prefix `team-ops/`). The storage service must be running and reachable from the `api` container. Optional: `TEAM_OPS_MAX_UPLOAD_BYTES` (default 20 MB) on the `api` container.
- The 30-minute "still working?" check-in is enforced by a Celery beat job every 5 minutes (`team-ops-freeze-unanswered-timers`), so **`beat-worker` and `worker` must be running**. Optional: `TEAM_OPS_CHECK_IN_MINUTES` (30) and `TEAM_OPS_CHECK_IN_GRACE_MINUTES` (5).
- **Secrets need their own key.** Generate one with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`, set it as `TEAM_OPS_SECRET_KEY` on the `api` container, and keep a copy somewhere other than the server. Without it, a key derived from Django's `SECRET_KEY` is used, and changing `SECRET_KEY` later would make every secret unreadable.
- No other new environment variable is required. `TEAM_OPS_ENABLED` defaults to on; set `TEAM_OPS_ENABLED=0` on the api, worker and beat containers to switch the API and the daily job off.

## Steps

1. **Backup (every time).** On the server, in `/opt/smartfactoryteam/plane/`: dump the database (`pg_dump -Fc`), copy the uploads volume (`tar` the volume directory with `sudo`; the MinIO image has no `tar`) and copy `plane.env`. Never run `docker compose down -v`. Keep a copy off the server.
2. **Build the images** from this repository on a machine with Docker (the server also works): `docker build -f apps/api/Dockerfile.api -t plane-api:teamops-1 apps/api` and `docker build -f apps/web/Dockerfile.web -t plane-web:teamops-1 .` (see `docker-compose.yml` in the repository root for the build arguments). Both images are built from the same commit; write its hash in the tag if you can.
3. **Rehearse on a copy first (staging).** Restore the dump into a throw-away Postgres, point a second compose project at it with the new images, run the `migrator`, and open: Workday (all five tabs), Hub, Teamflow, Team calendar, Report board, Calendar settings, Dashboard, Leave and Teamspaces as an admin, a team lead and a member. **Test files for real**: attach a PDF and an image in the Hub and in the Finish work form, open them from the message and from Teamflow, try a `.exe` and a renamed text file (both must be refused), and confirm a copied download link stops working after about five minutes. Finish a piece of work with *Needs attention* for another team and check it appears in that team's channel, under Mentions, and in Teamflow. Compare row counts of the original tables before and after (only `django_migrations`, `django_content_type` and `auth_permission` may change).
4. **Switch production.** In the server's compose file replace the `image:` of `api`, `worker`, `beat-worker`, `migrator` and `web` with the new tags, then `docker compose up -d migrator` (it applies the migrations and exits), then `docker compose up -d api worker beat-worker web`. Do not recreate the database, Redis or MinIO containers.
5. **Check.** `docker compose logs migrator` ends without error; sign in; open the pages above; in the admin account open Calendar settings and create a team and a holiday; the beat container logs the task `plane.team_ops.tasks.extend_weekly_plans_task` once a day at 00:30 UTC.
6. **Roll back if needed.** Point the `image:` lines back to the old tags and restart those containers. The new tables can stay (the old code ignores them). To remove them as well: `python manage.py migrate team_ops zero` with the new image (this deletes all Team Ops data, so export first). Plane's own `db.0122`–`0125` are not reversed by this; if they must be, restore the backup.

## What was verified before this document

| Check | Result |
|---|---|
| All migrations from zero on an empty database | applied |
| All migrations on a restore of the real server backup (22 users, 479 work items) | applied; 110 original tables unchanged except Django's own metadata tables; 27 new tables, none dropped (0006 to 0008 re-checked on its own on top of 0001–0005, then rolled back and re-applied) |
| `migrate team_ops zero` then migrate again on that restore | worked, original data intact |
| Team Ops backend tests | all pass (see the stage documents for counts) |
| Full backend suite against a clean checkout | no new failures (see the last section of the stage documents) |
| Frontend: `tsc`, `oxlint`, vitest, i18n sync, production build | clean |
| Pages opened in a real browser against a local database | Workday, Hub, Teamflow, all Work calendar pages, Work reports, Dashboard, Leave, Teamspaces |

## Known limits to remember

- **File upload and download were tested only against a fake storage** (no MinIO on the development machine). Test them first on staging.
- The Docker images and the server compose file were not touched or tested here.
- The calendar and the new pages are English only by decision; other Plane screens keep their translations.
- Machine translations in the Time tracking catalogs (Stage 1) still need a native review.
- Large workspaces (several hundred people) should page the team views by team.
