# Git Branch Strategy

You MUST follow this branch strategy:

- `main` — production. NEVER push directly.
- `develop` — integration. NEVER push directly.
- `feature/*` — new features. Branch from `develop`.
- `bugfix/*` — bug fixes. Branch from `develop`.
- `hotfix/*` — urgent production fixes. Branch from `main`.

All changes MUST go through Pull Requests.
NEVER use `git push` to `main` or `develop` directly.
