@AGENTS.md

# Claude Code notes for this fork

The rules below override AGENTS.md where they conflict.

## Branch and deploy

- Work directly on `main`. Do not create feature branches or open PRs against `preview`; the AGENTS.md PR section describes the upstream workflow and does not apply here.
- **Every push to `main` deploys to production** via `.github/workflows/deploy.yml`. It SSHes into the server, runs `git reset --hard origin/main`, then `docker compose up -d --build`. There is no staging environment and no other CI (upstream workflows were removed), so local checks are the only gate before prod.
- Do not push unless the user explicitly asks for it. Before pushing, say that the push will deploy to prod.
- Migrations in `apps/api` reach the production database on deploy. Treat them as irreversible and point them out to the user before committing.

## Before every commit

Run lint and type checks for each package you changed, and fix any failures before committing:

```bash
pnpm turbo run check:lint check:types --filter=<package>
```

- Package names come from each `package.json`: apps are `web`, `admin`, `space`, `live`; packages are `@plane/<dir>` (e.g. `@plane/editor`, `@plane/utils`).
- If you changed a shared package (`packages/*`), also check the apps that depend on it, e.g. `--filter=...@plane/utils` to include dependents.
- If you changed `packages/i18n` locale files, also run `pnpm --filter=@plane/i18n check:sync`.
- If you changed `apps/api` (Python), run `cd apps/api && uv run ruff check .` instead of the turbo checks. Add `uv run ruff format --check .` if formatting matters for the change.
- The husky pre-commit hook only runs `lint-staged` (oxfmt + oxlint on staged files). It does **not** run type checks, so do not rely on it.

## `.env` files

- Do not read, create, edit, or delete any `.env` file (`.env`, `apps/*/.env`, `.env.local`, etc.), and never commit them. They hold real secrets.
- `.env.example` files are templates and may be edited when adding a new variable, but never put real values in them.
- If a task needs an env change, tell the user which variable to set and let them do it.
