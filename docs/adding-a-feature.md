# Adding a feature end to end

A checklist for changes that touch the Django API, the web app, navigation and
the Railway deployment at the same time. The workspace/project chat (PR #2,
commit `4797df7`) is the worked example; grep for `chat` to see each step in
the codebase.

Read `AGENTS.md` and `CLAUDE.md` first. This file only adds the things that
were not obvious while building the chat.

## 1. Backend (apps/api)

Order of work, with the chat file for each step:

| Step           | Where                                                          | Notes                                                                                                                                                                                                       |
| -------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model          | `plane/db/models/<feature>.py`                                 | Extend `WorkspaceBaseModel` (adds workspace, project, soft delete, created_by via crum). Use a conditional `UniqueConstraint` with `deleted_at__isnull=True` so soft-deleted rows do not block re-creation. |
| Register model | `plane/db/models/__init__.py`                                  | Import it, or `makemigrations` will not see it.                                                                                                                                                             |
| Migration      | `python manage.py makemigrations db`                           | Check the number does not collide with `preview`; the chat took `0123`.                                                                                                                                     |
| Serializer     | `plane/app/serializers/<feature>.py` + `__init__.py`           | Use `UserLiteSerializer` for people; it exposes `avatar_url` and needs `select_related("avatar_asset")` on the queryset.                                                                                    |
| View           | `plane/app/views/workspace/<feature>.py` + `views/__init__.py` | Extend `BaseViewSet`. Roles come from `plane.app.permissions.ROLE` (`ADMIN=20`, `MEMBER=15`, `GUEST=5`). Return 403 as `{"error": "..."}`; the frontend reads `error` for toasts.                           |
| URLs           | `plane/app/urls/<feature>.py` + `urls/__init__.py`             | Explicit `path()` entries mapped with `as_view({...})`, mounted under `api/`.                                                                                                                               |

Rules that bit us:

- `WorkspaceMember` and `ProjectMember` are separate. A workspace guest is
  not a project member; check the membership that matches the URL scope.
- Soft delete (`instance.delete()`) enqueues a Celery task. In any environment
  without RabbitMQ that raises `OperationalError: Connection refused` and the
  request 500s. For scripts and tests set
  `from plane.celery import app; app.conf.task_always_eager = True`.
- `User.objects.create_user` requires `username=`.
- Nothing in the API pushes to clients. Design list endpoints so the web app
  can poll: an `after=<timestamp>` filter for new rows and a `before=` cursor
  with `has_more` for history.

## 2. Frontend (apps/web and packages)

| Step               | Where                                                                                                                                                                                                                  | Notes                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Types              | `packages/types/src/<feature>.ts`, export from `index.ts`                                                                                                                                                              | Reuse `IUserLite` for senders/creators.                                                                                                                                                  |
| Service            | `apps/web/core/services/<feature>.service.ts`                                                                                                                                                                          | Extend `APIService`; every URL ends with `/`.                                                                                                                                            |
| Store              | `apps/web/core/store/<feature>/<feature>.store.ts`                                                                                                                                                                     | MobX with `makeObservable`; `computedFn` for parameterised getters; `runInAction` after awaits; lodash-es `set`/`unset` for keyed maps. Loader state uses `TLoader` from `@plane/types`. |
| Register store     | `apps/web/core/store/root.store.ts`                                                                                                                                                                                    | Add the field, construct it in the constructor and again in `resetOnSignOut`.                                                                                                            |
| Hook               | `apps/web/core/hooks/store/use-<feature>.ts`                                                                                                                                                                           | Returns `context.<feature>Store`.                                                                                                                                                        |
| Components         | `apps/web/core/components/<feature>/`                                                                                                                                                                                  | `observer` components. Permissions via `useUserPermissions().allowPermissions([EUserPermissions.ADMIN, ...], EUserPermissionsLevel.WORKSPACE                                             | PROJECT, slug, projectId?)`. |
| Pages              | `apps/web/app/(all)/[workspaceSlug]/(projects)/<feature>/{header,layout,page}.tsx` and `.../projects/(detail)/[projectId]/<feature>/...`                                                                               | Copy the shape of a neighbouring page (Stickies for workspace, Pages for project).                                                                                                       |
| Routes             | `apps/web/app/routes/core.ts`                                                                                                                                                                                          | Routes are explicit; a page file alone is not routed. Add the layout and route next to its siblings.                                                                                     |
| Workspace sidebar  | `packages/constants/src/workspace.ts` (`WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS` and `..._LINKS`), `apps/web/core/components/workspace/sidebar/sidebar-item.tsx` (`staticItems`), `sidebar/helper.tsx` (icon `case`) | All three, or the entry renders without an icon or not at all.                                                                                                                           |
| Project navigation | `apps/web/core/components/navigation/use-navigation-items.ts`, `workspace/sidebar/project-navigation.tsx`, `navigation/tab-navigation-utils.ts`                                                                        | The first two duplicate the item list on purpose; the third maps `key` to a URL for tabs.                                                                                                |
| i18n               | `packages/i18n/src/locales/en/navigation.json`                                                                                                                                                                         | Other locales fall back to `en`.                                                                                                                                                         |

UI pieces that already exist and are worth reusing: `Avatar`, `AlertModalCore`
(requires `isSubmitting`), `ModalCore` with `EModalPosition`/`EModalWidth`,
`Input` (prop is `inputSize`), `Button` from `@plane/propel/button`, `setToast`
from `@plane/propel/toast`, `getFileURL`, `calculateTimeAgo`,
`renderFormattedDate`/`renderFormattedTime` and `cn` from `@plane/utils`.

Lint rules the pre-commit hook enforces as errors (`oxlint --deny-warnings`
runs on every staged file, including pre-existing warnings in a file you only
touched):

- `jsx-a11y/no-autofocus`: use a ref and focus in `useEffect`.
- `unicorn/no-array-sort`: `toSorted` is not available (the web tsconfig lib
  predates es2023). Sort a copy and add
  `// oxlint-disable-next-line unicorn/no-array-sort -- <reason>`.
- `eslint/no-shadow`: rename inner callback parameters.
- Formatting is `oxfmt`, not prettier.

## 3. Verify before committing

```bash
pnpm turbo run check:types --filter=web
pnpm --filter=web exec oxlint --deny-warnings <changed files relative to apps/web>
pnpm exec oxfmt <changed files>
```

Backend, without installing Python locally: build `apps/api/Dockerfile.api`
(`WORKDIR /code`), start throwaway Postgres and Redis containers on a shared
network, then run `migrate`, `makemigrations --check`, `check` and a smoke
script through `python manage.py shell < script.py`. Env needed:
`DJANGO_SETTINGS_MODULE=plane.settings.production`, `SECRET_KEY`,
`DATABASE_URL`, `REDIS_URL`, `AMQP_URL`, `USE_MINIO=0`. On Git Bash export
`MSYS_NO_PATHCONV=1` before bind-mounting. DRF's `APIClient` with
`force_authenticate` is enough to exercise every endpoint and permission
branch without an HTTP server.

Git noise on Windows: `LF will be replaced by CRLF` warnings and `package.json`
files that show as modified with an empty diff are safe to ignore; do not
stage the package.json changes.

## 4. Ship

1. Commit on a feature branch cut from `preview` (see `.claude/skills/branch-name`).
2. To deploy, fast-forward `feat/railway-proxy-live` to the commit and push.
   Every push rebuilds all eight Railway services and runs migrations through
   the migrator pre-deploy command, so batch changes.
3. Watch the rollout with the CLI (the GraphQL API rejects the CLI token for
   `serviceInstance` queries):

   ```bash
   railway deployment list -s API --limit 1 --json
   railway logs -s API -d <deployment id> | grep Applying
   ```

   The service named `Beat` in the dashboard is `Beat Worker` on the CLI.

4. Confirm live: the API route should answer 401 rather than 404 when
   unauthenticated, and the web manifest at `/assets/manifest-*.js` lists the
   new route.
5. Open the PR with `.claude/skills/create-pull-request`, always passing
   `--repo miracledevlol/plane` to `gh` (this clone resolves to
   `makeplane/plane` by default). Merge with a merge commit and never delete
   `feat/railway-proxy-live`; Railway deploys from it.
6. If a Railway dashboard setting changed, update
   `deployments/railway/README.md` in the same PR.
