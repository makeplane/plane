# /design — to-code mode

Pixel-perfect Figma → React conversion (TypeScript, Vite, TailwindCSS V4)
using the **coderio** helper script. High visual fidelity via a
protocol-then-code pipeline with checkpoints and robust error handling.
Merged from the former `design-to-code` skill.

## Gate — read this before running

**This mode is the exception to every other design mode.** It:

1. **Opts in only when the user explicitly asks** to convert a real Figma
   design to code ("convert this Figma to React", "turn this design into
   code"). Never start it proactively.
2. **Warns before running.** Say, before the first command: *"to-code
   will write application files (React components under `src/`, plus a
   `process/` workspace) into this project, and reads your Figma file via
   the Figma REST API using the `FIGMA_TOKEN` you provide. It is the only
   design mode that writes application code."* Proceed only on
   confirmation.
3. **Only mode that writes application code.** Everything else in the
   `design` skill writes to `design/`. This mode writes a React
   component tree into the project's `src/` (and a `process/` + `scripts/`
   workspace at the project root) — that scope is intentional and must
   stay explicit, never silent.
4. **Pinned dependency.** The helper's `scripts/to-code/package.json`
   pins `coderio` to **1.0.3**. Do not bump it without review; do not fall
   back to an unpinned `npx coderio@latest`.
5. **Figma token never hardcoded.** The token is read from the
   `FIGMA_ACCESS_TOKEN` environment variable you set per run — never
   written into a file, shell history, or any deck/output document.

If any of this is refused, stop and hand back to a non-code mode (e.g.
`handoff` for a written spec instead of code).

## When you use it (entry triggers)

User wants actual generated React+TypeScript components from a real Figma
file: "convert this Figma to code", "turn this design into a React app",
"restore this UI in code".

Distinct from `handoff` (produces a written developer spec — measurements,
tokens, states — **no code**) and from `frontend` mode (freehand UI
building from a mockup brief, no Figma ingestion).

## Where on the spine

**No Explore** — the design is already fixed in Figma, so there are no
variants to compare. Mapping:

- **Consult** — the design already exists (the Figma file). Read
  `design/DESIGN.md` if present and confirm the target stack
  (React + Vite + Tailwind v4) is acceptable; note any token/skin
  constraints the generated code should honor.
- **Build** — run the protocol → code pipeline below.
- **Verify** — thumbnail-fidelity check + compile check (see Verify).

## Workflow overview

```
Phase 0: SETUP    → install pinned deps, optional scaffold
Phase 1: PROTOCOL → fetch Figma data, generate structure, extract props
Phase 2: CODE     → generate components and assets, integrate
```

## Mechanics

### Phase 0 — Setup

**Prerequisites.** Node 18+, a Figma **personal access token** (Figma →
Settings → Personal Access Tokens), and a React + Vite project scaffolded.
Install the pinned helper deps once:

```bash
npm install
```

run inside `<skill>/scripts/to-code/` (reads `coderio@1.0.3` from its
`package.json`). The helper itself is `scripts/to-code/coderio-skill.mjs`
— it ships with the skill; nothing needs copying.

Set the token for the run:

```bash
# PowerShell (Windows)
$env:FIGMA_ACCESS_TOKEN = 'figd_...'
# bash / zsh
export FIGMA_ACCESS_TOKEN='figd_...'
```

Invoke the helper from the **project root** so its workspace (`process/`,
`scripts/`, `src/`) resolves to the project, not the skill:

```bash
node .claude/skills/design/scripts/to-code/coderio-skill.mjs <command> …
```

The helper creates `process/` (Figma data + thumbnail), `scripts/`
(prompt/output JSON), and `src/assets` (downloaded images) on first run.

**Step 0.2 — scaffold (optional).** If starting a new project:

```bash
node .claude/skills/design/scripts/to-code/coderio-skill.mjs scaffold-prompt "MyApp"
```

Follow the instructions printed by the command to create the initial
files.

### Phase 1 — Protocol (structure & props)

**Step 1.1 — fetch data.** The user supplies their own Figma file URL and
their own token (read from `FIGMA_ACCESS_TOKEN`). The helper contacts only
the official Figma REST API at the URL the user provides — no fixed
third-party endpoint:

```bash
node .claude/skills/design/scripts/to-code/coderio-skill.mjs fetch-figma "https://figma.com/file/<FILE>" "$env:FIGMA_ACCESS_TOKEN"
# on POSIX: "$FIGMA_ACCESS_TOKEN"
```

Verify `process/thumbnail.png` exists (the AI uses it as the visual truth
for every later step).

**Step 1.2 — structure.**

```bash
node .claude/skills/design/scripts/to-code/coderio-skill.mjs structure-prompt > scripts/structure-prompt.md
```

AI task: **ATTACH** `process/thumbnail.png` (mandatory) · **READ**
`scripts/structure-prompt.md` · **INSTRUCTION**: "Generate the component
structure JSON from the prompt and thumbnail. Focus on visual grouping.
Use text content to name components accurately (e.g. 'SafeProducts', not
'FAQ')." Save the JSON to `scripts/structure-output.json`, then:

```bash
node .claude/skills/design/scripts/to-code/coderio-skill.mjs save-structure
```

**Step 1.3 — extract props (iterative).**

```bash
node .claude/skills/design/scripts/to-code/coderio-skill.mjs list-components
```

For **EACH** component in the list:

1. Generate the prompt: `props-prompt "ComponentName" >
   scripts/current-props-prompt.md`.
2. AI task: **ATTACH** the thumbnail (mandatory), **READ** the prompt,
   **INSTRUCTION**: "Extract props and state data. Be pixel-perfect with
   text and image paths." Paste the JSON into
   `scripts/ComponentName-props.json`.
3. Save & validate:

```bash
node .claude/skills/design/scripts/to-code/coderio-skill.mjs save-props "ComponentName"
```

If `save-props` fails with "Props validation failed" (empty props), the AI
did not see the thumbnail — redo step 2 with the thumbnail attached.

### Phase 2 — Code generation

**Step 2.1 — plan tasks.**

```bash
node .claude/skills/design/scripts/to-code/coderio-skill.mjs list-gen-tasks
```

Returns a task list with indices (0, 1, 2…).

**Step 2.2 — generate components, in index order (children before
parents).**

```bash
node .claude/skills/design/scripts/to-code/coderio-skill.mjs code-prompt 0 > scripts/code-prompt.md
```

AI task: **ATTACH** `process/thumbnail.png` (mandatory) · **READ**
`scripts/code-prompt.md` · **INSTRUCTION**: "Generate the React component
code. Match the thumbnail EXACTLY. Use STRICT text content from input
data — do not hallucinate." Paste the code into `scripts/code-output.txt`,
then:

```bash
node .claude/skills/design/scripts/to-code/coderio-skill.mjs save-code 0
```

If the component has `states` referencing assets (e.g. `@/assets/foo.png`),
the helper appends an asset-import instruction to the code prompt: import
the asset at the top of the file (`import image_foo from
'@/assets/foo.png';`) and use the variable `image_foo` in the `states`
array instead of the string path.

**Step 2.3 — final integration.** Inject the root component into
`App.tsx` (path found in the last task of Phase 2.1).

## Troubleshooting

- **"Props validation failed"** — the AI generated empty props. Check that
  `process/thumbnail.png` was attached and visible; retry the props step.
- **"Module not found"** — a parent was saved before its child. `save-code`
  must run in index order (0, 1, 2…) so child components exist first.
- **"Visuals don't match"** — was the thumbnail attached? The AI relies on
  it for spacing and layout nuances not present in the raw Figma data.
- **Compile errors after integration** — verify the root component import
  path matches the `gen-tasks.json` output and that all asset imports
  resolved under `src/assets`.

## Verify

1. **Fidelity** — generated components match the thumbnail (spacing,
   layout, text); no hallucinated content strings.
2. **Ordering** — all `save-code` steps ran in index order.
3. **Tokens** — colors/type pulled from Figma are consistent with the
   project's token spine; run
   `scripts/tokens/validate-tokens.cjs --dir src` when the project has
   tokens.
4. **Compile** — `tsc`/build passes with no missing modules or assets.
5. **Scope check** — confirm the diff only touched the declared scope
   (`src/`, `scripts/`, `process/`) and nothing under `planning/` — this
   mode never writes there.

## Inputs

`[Figma URL] [target stack if not React+Vite+Tailwind]` — plus the user's
`FIGMA_ACCESS_TOKEN` in the environment. The design itself is the spec.
