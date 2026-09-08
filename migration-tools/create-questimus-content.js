#!/usr/bin/env node
// Phase 2: create the Questimus project's initial content (migration-karol.md §10):
//   - this migration plan → page
//   - the 7 tickets (type UI, home dashboard, HTML renderer, monetization,
//     cleanup, cycles test, design-migration epic)
//
// Usage:
//   node create-questimus-content.js [--dry-run]
//
// Needs QUESTIMUS_TOKEN (Karol's token). Idempotent via external_source/external_id
// (409-dedup) + a local state file.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QuestimusClient, QuestimusError } from "./lib/questimus-client.js";
import { mdToHtml } from "./lib/markdown.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
  }
  return args;
}

const TYPES = JSON.parse(await readFile(path.resolve(__dirname, "state/types.json"), "utf8"));

// Ticket definitions (content from migration-karol.md §10)
const TICKETS = [
  {
    name: "Questimus Migration Plan",
    type: "Plan",
    description:
      "The migration of all tickets/todos/ideas/plans into Questimus — this plan document (page in this project) is the source of truth. Mark Done in Phase 12 (wrap-up).",
  },
  {
    name: "HTML renderer",
    type: "Ticket",
    description:
      "Native rendering of HTML mockups/design files in Questimus, with per-file comments — prerequisite for migrating the design folders later.",
  },
  {
    name: "Design-folder migration",
    type: "Plan",
    description:
      "Migrate planning/design/ into Questimus once the renderer exists — future, out of scope for this migration (D3: mockups stay in repos for now).",
  },
  {
    name: "Manual cleanup",
    type: "Plan",
    description:
      "After all batches: verify everything migrated correctly, then delete the old files/folders yourself (no pointers, folders stay untouched until then).",
  },
  {
    name: "Issue type UI",
    type: "Ticket",
    description:
      "This Plane version has no type selector/badge in the GUI (the issue_type list column shows the issue key, not the type; types are API/DB-only). Add a type selector to the issue modal + a type badge in list/detail. Implemented in Phase 3.",
  },
  {
    name: "Home dashboard + My Issues widget",
    type: "Ticket",
    description:
      "The home-dashboard components exist but are not routed (dead code) — wire them up so the Home page shows: My Issues across projects, the Now list (assigned to me, urgent/high OR due ≤ 7 days) and Today (due today/overdue) — computed per request. Implemented in Phase 3.",
  },
  {
    name: "Monetization research",
    type: "Ticket",
    description:
      "AGPL-3.0 allows selling the fork (that's how Plane itself monetizes Plane Cloud); obligations: fork stays AGPL, source offer to hosted users, no Plane trademarks. Audit Plane's paid tiers (One / Pro / Enterprise — cloud tiers) feature-by-feature against the self-hosted code — what exists, what would need activation, what's genuinely missing — plus hosting/monetization options for Questimus.",
  },
  {
    name: "Cycles test",
    type: "Plan",
    description: "Try weekly cycles in Personal (\"This week\" cycle) — time-boxed planning.",
  },
];

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = process.env.QUESTIMUS_TOKEN;
  if (!apiKey && !args.dryRun) {
    console.error("No API key: set QUESTIMUS_TOKEN (Karol's token)");
    process.exit(1);
  }
  const client = new QuestimusClient({ baseUrl: "http://localhost:7000", apiKey });

  const stateFile = path.resolve(__dirname, "state/questimus-content.json");
  let state = { page: null, issues: {} };
  try {
    state = JSON.parse(await readFile(stateFile, "utf8"));
  } catch {
    /* first run */
  }

  // Resolve the Questimus project
  let projectId = "dry-run";
  if (!args.dryRun) {
    const projects = (await client.listProjects("main")).results ?? [];
    const project = projects.find((p) => p.name === "Questimus");
    if (!project) {
      console.error('Project "Questimus" not found — run setup-workspace.js first');
      process.exit(1);
    }
    projectId = project.id;
  }

  const report = { page: 0, tickets: 0, skipped: 0, failed: [] };

  // 1. This plan → page
  if (!state.page) {
    const planMd = await readFile(path.resolve(__dirname, "..", "migration-karol.md"), "utf8");
    if (args.dryRun) {
      console.log('  [dry-run] would create page "Questimus Migration Plan"');
      report.page++;
    } else {
      const page = await client.createPage("main", projectId, {
        name: "Questimus Migration Plan",
        description_html: mdToHtml(planMd),
        access: 0,
      });
      state.page = page.id;
      report.page++;
      console.log(`  created page "Questimus Migration Plan" (${page.id})`);
    }
  } else {
    report.skipped++;
  }

  // 2. The 7 tickets
  for (const t of TICKETS) {
    const rel = `ticket:${t.name}`;
    if (state.issues[rel]) { report.skipped++; continue; }
    const payload = {
      name: t.name,
      description_html: mdToHtml(t.description),
      state: null, // resolved below
      type_id: TYPES[t.type],
      external_source: "questimus-content",
      external_id: t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    };
    if (!args.dryRun) {
      // Resolve the Backlog state (created by setup-workspace.js)
      const states = (await client.listStates("main", projectId)).results ?? [];
      const backlog = states.find((s) => s.name === "Backlog");
      if (!backlog) {
        report.failed.push({ file: rel, error: 'state "Backlog" not found' });
        continue;
      }
      payload.state = backlog.id;
    }
    if (args.dryRun) {
      console.log(`  [dry-run] would create ticket "${t.name}" [${t.type}]`);
      report.tickets++;
      continue;
    }
    try {
      let created;
      let isDuplicate = false;
      try {
        created = await client.createWorkItem("main", projectId, payload);
      } catch (err) {
        if (err instanceof QuestimusError && err.status === 409) {
          const existingId = JSON.parse(err.body || "{}").id;
          if (!existingId) throw err;
          created = { id: existingId };
          isDuplicate = true;
        } else {
          throw err;
        }
      }
      state.issues[rel] = created.id;
      if (isDuplicate) report.skipped++;
      else { report.tickets++; console.log(`  created ticket "${t.name}" (${created.id})`); }
    } catch (err) {
      report.failed.push({ file: rel, error: err.message });
    }
  }

  if (!args.dryRun) {
    await mkdir(path.dirname(stateFile), { recursive: true });
    await writeFile(stateFile, JSON.stringify(state, null, 2));
  }
  console.log(`\nQuestimus content report:`);
  console.log(`  page: ${report.page} · tickets: ${report.tickets} · skipped: ${report.skipped} · failed: ${report.failed.length}`);
  for (const f of report.failed) console.log(`  FAILED ${f.file}: ${f.error}`);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
