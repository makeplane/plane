#!/usr/bin/env node
// Regenerate the 9 questimus-<project> skills (all except questimus-legaliosa,
// which is the hand-maintained template) from the legaliosa pattern.
// Fetches each project's states/labels via its bot token, then writes the
// skill folder into the Arsenal vault. Idempotent.
//
// Usage: node generate-questimus-skills.js
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = "C:/Users/Karol/Wisdomous/Arsenal/library/skills";
const BASE = "http://localhost:7000";
const WORKSPACE = "main";
const KAROL_ID = "a8f10b92-1ff5-4916-9ffa-6f96e40aeafb";
const TYPES = {
  Plan: "c163bb6f-cdcf-4ec9-b04e-5cbbfbea86b1",
  Ticket: "27259b7c-9dc4-4788-9aea-80232d81e0df",
  Design: "1e3bef1b-854e-4964-ad03-1741f776472e",
};

const tokens = JSON.parse(await readFile(path.resolve(__dirname, "state/tokens.json"), "utf8"));

const PROJECTS = [
  {
    name: "jobernaut", projectName: "Jobernaut", projectId: "e29b82c3-5ee5-4f98-9451-6f8c30abb6d6",
    prefix: "JOBERNAUT",
    planNotes: `The plan hierarchy is **version-agnostic**: the active plan root is the Plan-typed issue with **no parent** and **state ≠ Done**. Today that is "Plan v2" (JOBERNAUT-7); when v2 completes, "Plan v3" becomes the root. **Plan v1 (archive) is Done — never touch it.**

- Plan v2 → SP-13…SP-19 → T-13-01…T-16-03 (T-XX prefix = its SP; SP-17/18/19 have no task units yet).
- Each level has its own state: mark Ts Done → then the SP → then the plan root.
- \`depends-on\` between Ts is modeled as \`blocked_by\` relations.`,
  },
  {
    name: "don-saldo", projectName: "Don Saldo", projectId: "a2a2dfb3-3055-4071-bba1-2c2b9994ceec",
    prefix: "DONSALDO",
    planNotes: `This project has **no plan hierarchy** — plans are flat Plan-typed issues (the \`docs/plans\` files: mypy cleanup, stress test, balance-sheet fixes, migration, ZUGFeRD, roadmaps, …). List them with \`list --type Plan\`.`,
  },
  {
    name: "media-consumerus", projectName: "Media Consumerus", projectId: "8bad552c-f6d8-469c-847c-871145a9a72c",
    prefix: "CONSUMERUS",
    planNotes: `This project has **no plan hierarchy** — the archive/v1 plans are flat Plan-typed issues (state Done). List them with \`list --type Plan\`.`,
  },
  {
    name: "kleinanzeigen", projectName: "Kleinanzeigen", projectId: "25186a9a-765d-4bb9-8832-f3979d8b29da",
    prefix: "KLEINANZEIGE",
    planNotes: `This project has **no plan hierarchy** — it holds a small set of tickets only.`,
  },
  {
    name: "personal", projectName: "Personal", projectId: "eee28721-a38a-4155-b7da-242f43b175dc",
    prefix: "PERSONAL",
    planNotes: `This project has **no plan hierarchy** — ideas, todos, research notes and errands as tickets. Labels: \`idea\`, \`todo\`, \`someday\`, \`research\`.`,
  },
  {
    name: "pop", projectName: "Personal Operating Profile", projectId: "9d9a7d97-dcdb-40fc-aab1-bad91bcc1904",
    prefix: "POP",
    planNotes: `This project has **no plan hierarchy** — a small set of tickets only.`,
  },
  {
    name: "arsenal", projectName: "Arsenal", projectId: "a536b2d7-3078-4d66-b558-39096988f650",
    prefix: "ARSENAL",
    planNotes: `The Arsenal vault planning lives here as **flat Plan-typed issues** (no SP/T nesting): active plans (plan-18…plan-20, states per Karol) + done/archive plans (state Done). The **HANDOFF page** is the session entry point (see route-handoff.md). List plans with \`list --type Plan\`.`,
  },
  {
    name: "empirium", projectName: "Empirium", projectId: "537cada0-eb71-4e2b-bbb8-51229d962a57",
    prefix: "EMPIRIUM",
    planNotes: `This project has **no plan hierarchy** — 3 vault-migration plans as flat Plan-typed issues (Migration Plan In Progress; Phase1 Manifest + merge plan Done). List them with \`list --type Plan\`.`,
  },
  {
    name: "questimus", projectName: "Questimus", projectId: "ca67c7ab-6b87-454e-be68-e1a6cc9c2fe3",
    prefix: "QUESTIMUS",
    planNotes: `This project tracks Questimus itself: the migration plan (Plan issue) + feature/dev tickets. No SP/T hierarchy.`,
  },
];

async function api(token, url) {
  const res = await fetch(BASE + url, { headers: { "X-Api-Key": token } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

const scriptTemplate = await readFile("C:/Users/Karol/Wisdomous/Arsenal/library/skills/questimus-legaliosa/scripts/questimus.js", "utf8");

for (const p of PROJECTS) {
  const token = tokens[p.name]?.agent || tokens[p.name]?.app;
  const dir = path.join(VAULT, `questimus-${p.name}`);
  await mkdir(path.join(dir, "references"), { recursive: true });
  await mkdir(path.join(dir, "scripts"), { recursive: true });

  const states = (await api(token, `/api/v1/workspaces/${WORKSPACE}/projects/${p.projectId}/states/`)).results ?? [];
  const labels = (await api(token, `/api/v1/workspaces/${WORKSPACE}/projects/${p.projectId}/labels/`)).results ?? [];
  let handoffId = null;
  const pages = await api(token, `/api/workspaces/${WORKSPACE}/projects/${p.projectId}/pages/`);
  const list = Array.isArray(pages) ? pages : (pages.results ?? []);
  const h = list.find((x) => x.name === "HANDOFF");
  if (h) handoffId = h.id;

  const stateRows = states.map((s) => `| ${s.name} | \`${s.id}\` |`).join("\n");
  const labelRows = labels.map((l) => `| ${l.name} | \`${l.id}\` |`).join("\n");
  const labelNames = labels.map((l) => `\`${l.name}\``).join(", ");

  const skillMd = `---
name: questimus-${p.name}
description: "Work on ${p.projectName} tickets and plans in Questimus: read the HANDOFF page (if present), list/create/update/comment on/resolve work-items in the ${p.projectName} project via the Questimus REST API (scoped to project ${p.projectId} in workspace main)."
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
triggers:
  - questimus
  - work on next ticket
  - work on tickets
  - triage reports
  - resolve issues
  - read the handoff
  - what is in the plan
---

# Questimus — ${p.projectName} project skill

This skill is the interface to the **${p.projectName}** project in Questimus. It is deployed per-project: only this skill is present in the ${p.projectName} context, so generic triggers apply. The project name appears in the description only (for disambiguation in sessions that carry multiple questimus skills).

## How to use this skill

- **Read the routes on demand** — this file is the orchestrator; the exact recipes live in \`references/\`:
  - \`references/route-meta.md\` — states/labels/types UUIDs (hardcoded) + re-resolve fallback
${handoffId ? "  - \`references/route-handoff.md\` — the HANDOFF page (read + update)\n" : ""}  - \`references/route-plan.md\` — the plan structure
  - \`references/route-ticket.md\` — tickets: list/read/create/update/comment/search/delete + field semantics
- **Prefer the CLI** — \`scripts/questimus.js\` wraps the API (auth, UUID resolution, clean output). Raw API calls are documented in the routes as fallback.

## Scope

- **Workspace:** \`main\` · **Project:** \`${p.projectName}\` (id \`${p.projectId}\`)
- **Base URL:** \`http://localhost:7000\`
- **Token:** read from \`.token\` in this skill folder (gitignored; deployed by \`Arsenal/scripts/deploy-tokens.ps1\`). Never print, never commit, never paste into chat.
- **Auth:** \`X-Api-Key: plane_api_<token>\` header. Rate limit 60/min per token (local install raised to 1000/min).
- **Token scope:** read/write ONLY the ${p.projectName} project. 401/403 = wrong token or missing membership — stop and report.

## Conventions

- **States (${states.length}):** ${states.map((s) => `\`${s.name}\``).join(" · ")} — UUIDs in route-meta.
- **Types (3):** \`Plan\` (hierarchy) · \`Ticket\` (default) · \`Design\` (design/UI-UX work items) — UUIDs in route-meta.
- **Labels:** ${labelNames} — UUIDs in route-meta.
- **Priorities:** \`urgent | high | medium | low\`.
- **Identifiers:** zero-padded keys (\`${p.prefix}-001\`) in the UI; the API accepts the raw sequence (\`${p.prefix}-7\`).
- **Descriptions are HTML** — the CLI converts markdown for you (\`--desc-md\` or \`--desc-file\`); raw API calls must send \`description_html\`.

## Workflows

### Start a session
1. Read the **HANDOFF page** (\`node scripts/questimus.js handoff\`)${handoffId ? "" : " (if one exists)"} — the single working record of open work.
2. Read the plan structure (\`node scripts/questimus.js plan\`) to see what's next.

### Triage a user report
1. List \`user-report\`-labeled issues: \`node scripts/questimus.js list --label user-report\`.
2. Reproduce/assess; dedupe via \`search\`; set priority; move to **ToDo** (triage does NOT start work).
3. Comment with the triage result.

### Work on a ticket
1. Read the ticket (\`get\`) and its context (related tickets via \`search\`).
2. Move to **In Progress** (\`update --state In Progress\`), do the work, comment progress.
3. Verify against the ticket's DoD; move to **Done** and add label \`verified\`.

### Resolve a user report
1. Confirm the fix; comment with the resolution; move to **Done**.
2. Not reproducible: comment and move to **Blocked** or **Cancelled**.

### Create a ticket (new work / ideas)
1. \`search\` first (dedupe).
2. \`create --name … --desc-md … --state Backlog --priority … --type Ticket [--label …]\` — use \`--desc-file <path>\` when the description contains quotes or special characters (shell quoting mangles \`--desc-md\`).

## Rules

- Never print or commit the token; never paste it into chat.
- Prefer the CLI; keep payloads minimal.
- 401/403 → token wrong or lacks membership — stop and report, no workarounds.
- 409 on create with external ids → already exists — reuse; without external ids → unexpected, report.
- 429 → the CLI retries 3× with backoff; if it still fails, report to the user.
- Delete is permanent — only with explicit user confirmation; prefer \`Cancelled\`.
- The v1 list endpoint ignores filters — use the CLI \`list\` (JSON filters) for any filtered listing.

## Post-run review

After finishing a work session with this skill (any real work done — triage, ticket work, plan/HANDOFF updates), run the **post-run-review** skill against this run: it checks the run against this skill's spec (stale UUIDs, changed endpoints, broken recipes) and returns a recommendation-only verdict. Report the verdict to the user. This keeps the skill from silently rotting as Questimus changes.
`;

  const metaMd = `# Route: meta — states, labels, types (${p.projectName})

Hardcoded UUIDs (stable per project; re-resolve via the endpoints below if a call 404s).

## States (${states.length})

| Name | UUID |
|---|---|
${stateRows}

## Types (3, workspace-level)

| Name | UUID | Use |
|---|---|---|
| Plan | \`${TYPES.Plan}\` | hierarchy items (plan roots, SPs, Ts) |
| Ticket | \`${TYPES.Ticket}\` | default; app reports, backlog, ideas |
| Design | \`${TYPES.Design}\` | design/UI-UX work items (e.g. mockup work) |

## Labels

| Name | UUID |
|---|---|
${labelRows}

## Re-resolve (fallback)

\`\`\`
node scripts/questimus.js states
node scripts/questimus.js labels
node scripts/questimus.js types
\`\`\`

## People

| Name | UUID | Use |
|---|---|---|
| Karol | \`${KAROL_ID}\` | all imported work is assigned to Karol; \`list --assignee karol\` resolves it |
`;

  let handoffMd = "";
  if (handoffId) {
    handoffMd = `# Route: HANDOFF page (${p.projectName})

The ${p.projectName} HANDOFF lives in Questimus as a **page** (the repo file is no longer the working copy). The page id is stable — only the content changes.

## Read it

\`\`\`
node scripts/questimus.js handoff
\`\`\`

## Raw API (fallback)

\`\`\`
GET /api/workspaces/main/projects/${p.projectId}/pages/${handoffId}/
→ { name: "HANDOFF", description_html: "…" }
\`\`\`

## Update it (append/trim session records)

\`\`\`
PATCH /api/workspaces/main/projects/${p.projectId}/pages/${handoffId}/
{ "description_html": "<full new content>" }
\`\`\`
The HANDOFF is a living document — when a session finishes work, update it (mark SP/T progress, next-task pointers) so the next session starts from it.
`;
  }

  const planMd = `# Route: plan structure (${p.projectName})

${p.planNotes}

## Read it

\`\`\`
node scripts/questimus.js plan            # active plan root (Plan type, no parent, not Done)
node scripts/questimus.js plan --full    # + children (recursive, where a hierarchy exists)
node scripts/questimus.js list --type Plan   # all Plan-typed issues (flat projects)
\`\`\`

## Raw API (fallback)

\`\`\`
GET /api/workspaces/main/projects/${p.projectId}/issues/?filters={"issue_type__in":["${TYPES.Plan}"]}&per_page=1000
GET /api/workspaces/main/projects/${p.projectId}/issues/{id}/sub-issues/   # children of any work item
GET /api/v1/workspaces/main/work-items/${p.prefix}-7/                       # detail by identifier
\`\`\`
`;

  const ticketMd = `# Route: tickets & work items (${p.projectName})

Tickets are work items (type Ticket by default). ${p.projectName} specifics: identifier prefix \`${p.prefix}\`.

## Read

\`\`\`
node scripts/questimus.js get ${p.prefix}-123     # by identifier (or uuid)
node scripts/questimus.js list                  # all (per_page=1000 — projects fit in one call)
node scripts/questimus.js list --state Done --type Ticket --label SP-04 --priority high
node scripts/questimus.js list --assignee karol # assigned to Karol
node scripts/questimus.js subs <id>            # children (only hierarchy items have them)
node scripts/questimus.js search <query>       # name / sequence / identifier
\`\`\`

## Create a ticket

\`\`\`
node scripts/questimus.js create --name "Title" --desc-md "**What:** …" --state Backlog --priority medium --type Ticket [--label …]
\`\`\`
- **Search first** (dedupe) before creating.
- \`--desc-md\` converts markdown; \`--desc-html\` passes HTML through; **\`--desc-file <path>\` reads markdown from a file** (use it when the description contains quotes or special characters — shell quoting mangles \`--desc-md\`).
- \`--ext-source\`/\`--ext-id\` are optional (idempotency for app reports).

## Update (partial — only send what changes)

\`\`\`
node scripts/questimus.js update <id> --state In Progress
node scripts/questimus.js update <id> --state Done --label verified
node scripts/questimus.js update <id> --priority high
\`\`\`

## Comment

\`\`\`
node scripts/questimus.js comment <id> "Triage: reproduced, root cause …, moving to ToDo."
\`\`\`

## Delete (PERMANENT — only with explicit user confirmation)

\`\`\`
node scripts/questimus.js delete <id> --yes
\`\`\`
Deletion is permanent and only allowed for the item creator or an admin. Prefer \`Cancelled\` state over delete unless the item is truly wrong.

## Relations

\`\`\`
POST /api/v1/workspaces/main/projects/${p.projectId}/work-items/{wid}/relations/
{ "relation_type": "blocked_by|blocking|duplicate|relates_to", "issues": ["<target-id>"] }
\`\`\`

## Raw API (fallback)

\`\`\`
GET    /api/v1/workspaces/main/work-items/${p.prefix}-123/          # detail (state/type/labels = UUIDs)
PATCH  /api/v1/workspaces/main/projects/${p.projectId}/work-items/{wid}/   # partial update
POST   /api/v1/workspaces/main/projects/${p.projectId}/work-items/          # create
POST   …/work-items/{wid}/comments/   { "comment_html": "…" }
GET    …/work-items/{wid}/comments/                               # read the discussion
GET    /api/v1/workspaces/main/work-items/search/?search=…         # → { issues: […] } (field is "issues")
GET    /api/workspaces/main/projects/${p.projectId}/issues/?filters={json}  # filtered list (JSON filters param!)
DELETE …/work-items/{wid}/                                        # permanent
\`\`\`

## Field semantics

- **v1 detail:** \`state\`, \`type\`, \`labels\`, \`assignees\`, \`parent\` are **UUIDs**; \`description_html\` is HTML.
- **main API list:** \`type_id\`, \`state_detail.name\`, \`labels\`/\`assignees\` are objects; \`state_id\`; \`parent_id\`.
- **Filtering:** only the main API list filters, via the **JSON \`filters\` query param** (URL-encoded): \`{"state_id__in":[…], "label_id__in":[…], "assignee_id__in":[…], "priority__in":[…], "issue_type__in":[…]}\` with \`and\`/\`or\`/\`not\`. Flat params are ignored. \`total_count\` is the **unfiltered** project total — trust \`results\`.
- **Pagination:** \`per_page\` default/max 1000; paginate via \`next_cursor\` only if a project exceeds 1000.
- **409 on create** happens only with \`external_source\`+\`external_id\` that already exist (idempotency) — reuse the returned id. Without external ids a 409 is unexpected — report it.
- **429:** the script retries 3× with backoff; if it still fails, report to the user.
`;

  const script = scriptTemplate
    .replace('const PROJECT_ID = "8e602174-4cd1-490e-bf06-23d7ebde6e0d"; // Legaliosa', `const PROJECT_ID = "${p.projectId}"; // ${p.projectName}`)
    .replace('identifier: `LEGALIOSA-${d.sequence_id}`,', `identifier: \`${p.prefix}-\${d.sequence_id}\`,`)
    .replace("// Questimus CLI — Legaliosa project skill.", `// Questimus CLI — ${p.projectName} project skill.`);

  const arsenalYml = `---
name: "questimus-${p.name}"
type: skill
category: "questimus"
description: "Work on ${p.projectName} tickets and plans in Questimus via the REST API (scoped to project ${p.projectId} in workspace main)."
my_version: "0.1.0"
my_version_notes: >
  0.1.0 (2026-09-09): initial build — SKILL.md orchestrator + references/route-{meta,plan,ticket}${handoffId ? ",handoff" : ""}.md
  + scripts/questimus.js CLI (auth via .token, name→UUID resolution, markdown→HTML, 429 retry ×3, --yes delete guard).
  Replicated from the questimus-legaliosa pattern (verified end-to-end). .token deployed by scripts/deploy-tokens.ps1 (gitignored).
deploy_global: false
tags: ["questimus", "project-management", "${p.name}", "api"]
added: 2026-09-09
---
`;
  const changelog = `# questimus-${p.name} (skill) — changelog

## 2026-09-09 | feat | Initial build (replicated from questimus-legaliosa pattern) | 0.1.0

- SKILL.md orchestrator + \`references/route-{meta,plan,ticket}${handoffId ? ",handoff" : ""}.md\` + \`scripts/questimus.js\` CLI.
- All recipes verified live (hardcoded state/label/type UUIDs, JSON \`filters\` param, \`sub-issues/\` endpoint, search response field \`issues\`, \`per_page\` max 1000).
- \`.token\` per skill (gitignored), deployed by \`Arsenal/scripts/deploy-tokens.ps1\`.
- Post-run-review step: run after every work session.
`;

  await writeFile(path.join(dir, "SKILL.md"), skillMd);
  await writeFile(path.join(dir, "references", "route-meta.md"), metaMd);
  if (handoffMd) await writeFile(path.join(dir, "references", "route-handoff.md"), handoffMd);
  await writeFile(path.join(dir, "references", "route-plan.md"), planMd);
  await writeFile(path.join(dir, "references", "route-ticket.md"), ticketMd);
  await writeFile(path.join(dir, "scripts", "questimus.js"), script);
  await writeFile(path.join(dir, "scripts", "package.json"), JSON.stringify({ name: `questimus-${p.name}-scripts`, private: true, type: "module" }, null, 2) + "\n");
  await writeFile(path.join(dir, "_arsenal.yml"), arsenalYml);
  await writeFile(path.join(dir, "changelog.md"), changelog);

  console.log(`generated questimus-${p.name} (${states.length} states, ${labels.length} labels, handoff=${handoffId ?? "none"})`);
}
console.log("done");
