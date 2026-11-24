@AGENTS.md

# Claude Code notes for this fork

The rules below override AGENTS.md where they conflict.

## Branch and deploy

- **Direct pushes to `main` are forbidden.** Never commit on `main` or push to it, including force-pushes; changes reach it only through a PR that the user merges.
- For every task, create a branch `feature/<name>` (short kebab-case name) from a fresh `main`. This naming overrides the `branch-name` skill.

  ```bash
  git fetch origin main
  git switch --no-track -c feature/<name> origin/main
  ```

- Commit the work on that branch and push it with `git push -u origin feature/<name>`. This needs no separate confirmation.
- After pushing, give the user a link for creating the PR; do not create or merge the PR yourself unless asked:
  `https://github.com/ikopytok/plane/compare/main...feature/<name>?expand=1`
- PRs go to `main` of `ikopytok/plane` (remote `origin`), **never to `makeplane/plane`** (remote `upstream`). The AGENTS.md PR section and the `create-pull-request` skill's base branch describe the upstream workflow and do not apply here. If asked to create a PR with `gh`, always pass `--repo ikopytok/plane --base main`, because `gh` may default to the upstream repo.
- **Merging into `main` deploys to production** via `.github/workflows/deploy.yml`. It SSHes into the server, runs `git reset --hard origin/main`, then `docker compose up -d --build`. There is no staging environment. Pushing a feature branch does not deploy.
- CI (`.github/workflows/ci.yml`) runs on PRs to `main`: lint, types and build for the apps, plus API lint and tests. Upstream workflows were removed. Still run the local checks below before committing.
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
