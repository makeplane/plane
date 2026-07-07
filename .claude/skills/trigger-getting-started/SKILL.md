---
name: trigger-getting-started
description: >
  Bootstrap Trigger.dev into an existing project from scratch: authenticate the
  CLI, install @trigger.dev/sdk and @trigger.dev/build, write trigger.config.ts
  with the project ref and task dirs, scaffold a /trigger directory with a first
  task, wire tsconfig and .gitignore, set TRIGGER_SECRET_KEY, and run the dev
  server. Load this when a project has no trigger.config.ts yet and the user
  asks to "add Trigger.dev", "set up Trigger.dev", "initialize Trigger.dev", or
  get a first task running, including in a monorepo. Once the project is set up
  and you are writing task code, switch to the trigger-authoring-tasks skill.
type: core
library: trigger.dev
library_version: "4.5.1"
sources:
  - docs/quick-start.mdx
  - docs/manual-setup.mdx
  - docs/config/config-file.mdx
  - docs/triggering.mdx
---

# Getting started with Trigger.dev

Set up Trigger.dev in an existing project. The end state is: the SDK installed, a
`trigger.config.ts` pointing at a project ref, a `/trigger` directory with at least
one exported task, and `trigger dev` running so the task shows up in the dashboard.

The fastest path is the CLI's own wizard, which performs every mechanical step below
and also offers to install the MCP server and these agent skills:

```bash
npx trigger.dev@latest init
```

Prefer `init` when you can. Do the manual steps further down when `init` does not fit
(monorepos, an existing config to extend, or a non-interactive environment).

## Two steps need the human

Most of setup is automatable, but two steps require a person and cannot be done
headlessly. When you reach them, stop and ask the user to do them, then continue:

1. **Authenticating the CLI.** `npx trigger.dev@latest login` opens a browser for the
   user to sign in. If they have no account, point them to https://cloud.trigger.dev
   (or a self-hosted instance) first. You cannot complete this for them.
2. **The secret key and project ref.** `TRIGGER_SECRET_KEY` and the project ref
   (`proj_...`) come from the dashboard. Ask the user to copy the **DEV** secret key
   from the project's API Keys page, and to pick or create the project so you have its
   ref. `trigger init` can select the project interactively once the user is logged in.

Treat these as handoffs: state exactly what you need, wait for the user, then resume.

## Manual setup

### 1. Authenticate (human step)

```bash
npx trigger.dev@latest login
# self-hosted:
npx trigger.dev@latest login --api-url https://your-trigger-instance.com
```

### 2. Install the packages

`@trigger.dev/sdk` is a runtime dependency; `@trigger.dev/build` is a dev dependency.
Pin both to the same version as the `trigger.dev` CLI you run; the CLI warns on a
mismatch during `dev`/`deploy`.

```bash
npm add @trigger.dev/sdk@latest
npm add --save-dev @trigger.dev/build@latest
```

### 3. Write `trigger.config.ts`

Create it in the project root (or `trigger.config.mjs` for JavaScript). The `project`
ref and `dirs` are the only required fields.

```ts
import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "<project ref>", // e.g. "proj_abc123", from the dashboard
  dirs: ["./src/trigger"], // where your tasks live
  maxDuration: 3600,
  retries: {
    enabledInDev: false,
    default: { maxAttempts: 3, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000, randomize: true },
  },
});
```

Use the Bun runtime by adding `runtime: "bun"`. Build extensions (`prismaExtension`,
`puppeteer`, `additionalFiles`, etc.) come from `@trigger.dev/build` and go in
`build.extensions`.

### 4. Add a first task

Create the directory that matches `dirs` and export a task from it. Every task must be
a named export with a project-unique `id`.

```ts
// src/trigger/example.ts
import { task } from "@trigger.dev/sdk";

export const helloWorld = task({
  id: "hello-world",
  run: async (payload: { name: string }) => {
    return { message: `Hello ${payload.name}!` };
  },
});
```

### 5. Wire tsconfig and gitignore

Add `trigger.config.ts` to the `include` array in `tsconfig.json`, and add `.trigger`
to `.gitignore` (the CLI writes local dev state there).

```jsonc
// tsconfig.json
{ "include": ["trigger.config.ts" /* ...existing */] }
```

```bash
# .gitignore
.trigger
```

### 6. Set the secret key (human step)

For triggering from your own code, set `TRIGGER_SECRET_KEY` to the DEV key from the
dashboard's API Keys page. Self-hosted users also set `TRIGGER_API_URL`.

```bash
# .env (or .env.local for Next.js)
TRIGGER_SECRET_KEY=tr_dev_xxxxxxxx
```

### 7. Run the dev server

```bash
npx trigger.dev@latest dev
```

Leave it running. Tasks register with the dashboard, where the user can fire a test run
from the task's test page. On first run the CLI offers to install the MCP server and
agent skills; recommend both.

## Triggering from your app

Once a task exists, trigger it from backend code with a **type-only** import so the
task code is never bundled into your app. Trigger by id, not by calling the task object.

```ts
import { tasks } from "@trigger.dev/sdk";
import type { helloWorld } from "@/trigger/example"; // type-only

const handle = await tasks.trigger<typeof helloWorld>("hello-world", { name: "Ada" });
```

`TRIGGER_SECRET_KEY` must be set wherever this runs. Framework specifics live in the
Next.js / Remix / Node.js guides.

## Monorepos

Two layouts, both supported: put tasks in a shared package (`@repo/tasks` with its own
`trigger.config.ts`, consumed via `workspace:*`), or install Trigger.dev directly in the
app that needs it. Run `trigger dev` from the directory that holds `trigger.config.ts`.
See the manual setup docs for full Turborepo examples before scaffolding either.

## Common mistakes

1. **Trying to do the human-only steps headlessly.** You cannot complete `trigger login`
   or read the dashboard secret key for the user.
   - Wrong: spawning `trigger login` and waiting on it to finish in an agent session.
   - Correct: ask the user to log in and to paste the DEV key, then continue.

2. **Mismatched CLI and SDK versions.** A `trigger.dev` CLI on a different major than
   `@trigger.dev/sdk` breaks dev/deploy.
   - Wrong: `npx trigger.dev@latest dev` against an old pinned SDK.
   - Correct: keep `trigger.dev`, `@trigger.dev/sdk`, and `@trigger.dev/build` on the same version.

3. **Importing from `@trigger.dev/sdk/v3` or using `client.defineJob()`.** Both are old.
   - Correct: always import from `@trigger.dev/sdk`; define work with `task()`.

4. **Tasks not exported, or outside `dirs`.** A task that is not a named export inside a
   configured directory will not be picked up.
   - Correct: `export const ... = task({ ... })` in a file under a `dirs` path.

5. **Importing the task instance into backend code.** This bundles the task.
   - Wrong: `import { helloWorld } from "@/trigger/example"` in a route handler.
   - Correct: `import type { helloWorld }` plus `tasks.trigger<typeof helloWorld>("hello-world", payload)`.

6. **Forgetting `TRIGGER_SECRET_KEY`.** Triggering from your app fails without it; the
   `dev` server itself works once the CLI is logged in.

## References

Sibling skills:

- **trigger-authoring-tasks** for writing the tasks themselves once setup is done: retries, waits,
  queues, scheduled tasks, triggering, and the full `trigger.config.ts`.
- **trigger-realtime-and-frontend** for showing live run status in a frontend.
- **trigger-authoring-chat-agent** and **trigger-chat-agent-advanced** for building AI chat agents.

Docs:

- [Quick start](https://trigger.dev/docs/quick-start)
- [Manual setup](https://trigger.dev/docs/manual-setup)
- [Configuration file](https://trigger.dev/docs/config/config-file)

## Version

Generated for @trigger.dev/sdk 4.5.1. Re-run the trigger.dev skills installer after upgrading.
