# Contributing to Plane

Thank you for showing an interest in contributing to Plane! All kinds of contributions are valuable to us. In this guide, we will cover how you can quickly onboard and make your first contribution.

## Submitting an issue

Before submitting a new issue, please search the [issues](https://github.com/makeplane/plane/issues) tab. Maybe an issue or a [Forum](https://forum.plane.so) thread already exists and might inform you of workarounds. Otherwise, you can give new information.

While we want to fix all the [issues](https://github.com/makeplane/plane/issues), before fixing a bug we need to be able to reproduce and confirm it. Please provide us with a minimal reproduction scenario using a repository or [Gist](https://gist.github.com/). Having a live, reproducible scenario gives us the information without asking questions back & forth with additional questions like:

- 3rd-party libraries being used and their versions
- a use-case that fails

Without said minimal reproduction, we won't be able to investigate all [issues](https://github.com/makeplane/plane/issues), and the issue might not be resolved.

You can open a new issue with this [issue form](https://github.com/makeplane/plane/issues/new).

### Naming conventions for issues

The issue forms pre-fill a title prefix. Keep it and follow it with a clear, concise description:

- For bugs: `[bug]: [short description]`
- For features and improvements: `[feature]: [short description]`

**Examples:**

- `[bug]: API token expiry time not saving correctly`
- `[feature]: Allow custom time selection for token expiration`

This helps us triage and manage issues more efficiently.

## Projects setup and Architecture

### Requirements

- Docker Engine installed and running. `docker-compose-local.yml` runs the API, its workers and the backing services: Postgres 15, Valkey 7.2 (Redis-compatible), RabbitMQ 3.13 and S3-compatible object storage
- Node.js 22.22.0 or newer (pinned in `.node-version` and `.mise.toml`)
- pnpm, activated through Corepack (`corepack enable pnpm`); the version is pinned in `package.json`
- Python 3.12 and [uv](https://docs.astral.sh/uv/) (only needed to run the API outside Docker)
- **Memory**: Minimum **12 GB RAM** recommended
  > ⚠️ Running the project on a system with only 8 GB RAM may lead to setup failures or memory crashes (especially during Docker container build/start or dependency install). Use cloud environments like GitHub Codespaces or upgrade local RAM if possible.

### Setup the project

The project is a monorepo, with backend api and frontend in a single repo.

The backend is a django project which is kept inside apps/api

1. Clone the repo

```bash
git clone https://github.com/makeplane/plane.git [folder-name]
cd [folder-name]
chmod +x setup.sh
```

2. Run setup.sh

```bash
./setup.sh
```

`setup.sh` copies each service’s `.env.example` to `.env` (root, `apps/api`, `apps/web`, `apps/admin`, `apps/space`, `apps/live`), generates a Django `SECRET_KEY` for the API and object-storage (MinIO) credentials shared by the root and API env files, then enables pnpm through Corepack and runs `pnpm install`. Review those files if you need custom values; the defaults work with the local Docker Compose stack.

#### Environment variables

If these are missing or wrong, the API and supporting services fail to connect on first run. Defaults come from `apps/api/.env.example` and `apps/live/.env.example` (copied by `setup.sh`):

| Variable       | Where                             | Purpose                                        | Local Docker default                                               |
| -------------- | --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL` | `apps/api/.env`                   | Postgres connection for the Django API         | `postgresql://plane:plane@plane-db:5432/plane`                     |
| `REDIS_URL`    | `apps/api/.env`, `apps/live/.env` | Redis/Valkey for cache, sessions, and realtime | API: `redis://plane-redis:6379/` · Live: `redis://localhost:6379/` |
| `PORT`         | `apps/live/.env`                  | Port the live (collab) server listens on       | `3100`                                                             |

Related values used to build those URLs (also in `apps/api/.env.example`): `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `REDIS_HOST`, `REDIS_PORT`.

Local app ports after a successful start:

- Web: [http://localhost:3000](http://localhost:3000)
- Admin (God mode): [http://localhost:3001](http://localhost:3001)
- Space: [http://localhost:3002](http://localhost:3002)
- Live: [http://localhost:3100](http://localhost:3100)
- API: [http://localhost:8000](http://localhost:8000)

3. Start the containers

```bash
docker compose -f docker-compose-local.yml up
```

4. Start web apps:

```bash
pnpm dev
```

5. Open your browser to http://localhost:3001/god-mode/ and register yourself as instance admin
6. Open up your browser to http://localhost:3000 then log in using the same credentials from the previous step

That’s it! You’re all set to begin coding. Remember to refresh your browser if changes don’t auto-reload. Happy contributing! 🎉

## Missing a Feature?

If a feature is missing, you can directly _request_ a new one [here](https://github.com/makeplane/plane/issues/new?template=--feature-request.yaml). You also can do the same by choosing "Feature request" when raising a [New Issue](https://github.com/makeplane/plane/issues/new/choose) on our GitHub Repository.
If you would like to _implement_ it, an issue with your proposal must be submitted first, to be sure that we can use it. Please consider the guidelines given below.

## Coding guidelines

To ensure consistency throughout the source code, please keep these rules in mind as you are working:

- All features or bug fixes must be tested by one or more specs (unit-tests).
- We lint with [OxLint](https://oxc.rs/docs/guide/usage/linter) using the shared `.oxlintrc.json` and format with [oxfmt](https://oxc.rs/docs/guide/usage/formatter) using `.oxfmtrc.json` (see [docs/linting.md](./docs/linting.md)). The backend in `apps/api` is linted with [Ruff](https://docs.astral.sh/ruff/) using `apps/api/ruff.toml`.
- See [AGENTS.md](./AGENTS.md) for the full command reference, code style, backend dependency (uv), migration and backend test workflows.

## Submitting a pull request

1. Branch off `preview` and open your pull request against `preview`.
2. Before pushing, run `pnpm check` (format, lint and types). For backend changes, also run `uv run ruff check .` in `apps/api` and the backend tests (`docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests`, see [apps/api/tests/RUNNING_TESTS.md](./apps/api/tests/RUNNING_TESTS.md)).
3. If you add a Django migration, generate it with `makemigrations` and commit the updated `apps/api/migrations_lockfile.txt` with it (see [AGENTS.md](./AGENTS.md#migrations)).
4. New source files need the copyright header from `COPYRIGHT.txt` (see [COPYRIGHT_CHECK.md](./COPYRIGHT_CHECK.md)).
5. Fill in the pull request template: description, type of change, screenshots for UI changes, and the test scenarios you ran.

## Ways to contribute

- Try Plane Cloud and the self hosting platform and give feedback
- Add new integrations
- Add or update translations
- Help with open [issues](https://github.com/makeplane/plane/issues) or [create your own](https://github.com/makeplane/plane/issues/new/choose)
- Share your thoughts and suggestions with us
- Help create tutorials and blog posts
- Request a feature by submitting a proposal
- Report a bug
- **Improve documentation** - fix incomplete or missing [docs](https://docs.plane.so/), bad wording, examples or explanations.

## Contributing to language support

This guide is designed to help contributors understand how to add or update translations in the application.

### Understanding translation structure

#### File organization

Translations are organized by language in the locales directory. Each language has its own folder with one JSON file per namespace (the namespaces are listed in `packages/i18n/src/constants/namespaces.ts`). English (`en/`) is the source of truth: every other language mirrors it file for file and key for key. Here's how it looks:

```
packages/i18n/src/locales/
    ├── en/
    │   ├── common.json
    │   ├── work-item.json
    │   └── ...             # one file per namespace
    ├── fr/
    │   ├── common.json
    │   └── ...
    └── [language]/
        └── ...
```

A key must be unique across all namespace files of a language.

#### Nested structure

To keep translations organized, we use a nested structure for keys. This makes it easier to manage and locate specific translations. For example:

```json
{
  "issue": {
    "label": "Work item",
    "title": {
      "label": "Work item title"
    }
  }
}
```

### Translation formatting guide

We use [i18next](https://www.i18next.com/) with ICU message format ([i18next-icu](https://github.com/i18next/i18next-icu)) to handle dynamic content, such as variables and pluralization. Here's how to format your translations:

#### Examples

- **Simple variables**

  ```json
  {
    "greeting": "Hello, {name}!"
  }
  ```

- **Pluralization**
  ```json
  {
    "items": "{count, plural, one {Work item} other {Work items}}"
  }
  ```

### Contributing guidelines

#### Updating existing translations

1. Locate the key in `locales/<language>/<namespace>.json`.

2. Update the value while ensuring the key structure remains intact.
3. Preserve any existing ICU formats (e.g., variables, pluralization).

#### Adding new translation keys

1. Add the key to the right namespace file in `locales/en/` first, then to the same file in **all** other languages, even if translations are not immediately available. Use English as a placeholder if needed.

2. Keep the nesting structure consistent across all languages.

3. If the new key requires dynamic content (e.g., variables or pluralization), ensure the ICU format is applied uniformly across all languages.

4. Run the sync check. It reports keys missing from a language, keys duplicated across namespaces, and keys that are both a value and a parent of other keys. CI runs it in `--ci` mode on every pull request that touches `packages/i18n`.

```bash
pnpm --filter=@plane/i18n sync:check
```

The TypeScript key types (`packages/i18n/src/types/keys.generated.ts`) are generated from the English files during build and type check. The file is git-ignored; do not edit it by hand.

### Adding new languages

Adding a new language involves several steps to ensure it integrates seamlessly with the project. Follow these instructions carefully:

1.  **Update type definitions**
    Add the new language to the TLanguage type in the language definitions file:

```ts
// packages/i18n/src/types/language.ts
export type TLanguage = "en" | "fr" | "your-lang";
```

2.  **Add language configuration**
    Include the new language in the list of supported languages:

```ts
// packages/i18n/src/constants/language.ts
export const SUPPORTED_LANGUAGES: ILanguageOption[] = [
  { label: "English", value: "en" },
  { label: "Your Language", value: "your-lang" },
];
```

3.  **Create translation files**
    1. Copy `locales/en/` to a new folder for your language (e.g., `locales/your-lang/`), keeping every namespace file.

    2. Translate all keys in every file.

    3. Run `pnpm --filter=@plane/i18n sync:check` and fix anything it reports.

No loader change is needed: namespace files are imported dynamically by language code (`packages/i18n/src/core/instance.ts`).

### Quality checklist

Before submitting your contribution, please ensure the following:

- All translation keys exist in every language file.
- Nested structures match across all language files.
- ICU message formats are correctly implemented.
- All languages load without errors in the application.
- Dynamic values and pluralization work as expected.
- There are no missing or untranslated keys.

#### Pro tips

- When in doubt, refer to the English translations for context.
- Verify pluralization works with different numbers.
- Ensure dynamic values (e.g., `{name}`) are correctly interpolated.
- Double-check that nested key access paths are accurate.

Happy translating! 🌍✨

## Need help? Questions and suggestions

Questions, suggestions, and thoughts are most welcome. We can also be reached in our [Forum](https://forum.plane.so).
