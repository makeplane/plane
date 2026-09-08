#!/usr/bin/env node
// Routes checkbox-list files (e.g. Now.md) to per-project issues.
//
// Now.md is a cross-project overview: each entry belongs to a different
// project. This script reads the file, matches each item against a routing
// map (config/now-routing.json), and creates the issue in the routed project
// (type Ticket, label from the route). Nesting (indentation) is preserved as
// sub-issues when parent and child route to the same project.
//
// Usage:
//   node import-now.js --config config/now-routing.json [--dry-run]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QuestimusClient, QuestimusError } from "./lib/questimus-client.js";
import { mdToHtml } from "./lib/markdown.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { config: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--config") args.config = argv[++i];
    else if (argv[i] === "--dry-run") args.dryRun = true;
  }
  return args;
}

// Parse checkbox items with nesting depth (indentation) and category (headings).
function parseCheckboxItems(raw) {
  const items = [];
  let category = "";
  const stack = []; // depths of open parents
  for (const line of raw.split(/\r?\n/)) {
    const h = line.match(/^#{1,3}\s+(.+)$/);
    if (h) { category = h[1].trim(); continue; }
    const cb = line.match(/^(\s*)-\s*\[( |x|X)\]\s+(.+)$/);
    if (!cb) continue;
    const depth = Math.floor(cb[1].replace(/\t/g, "  ").length / 2);
    const checked = cb[2].toLowerCase() === "x";
    const text = cb[3].trim();
    // parent = last item with depth < this depth
    let parent = null;
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    if (stack.length) parent = stack[stack.length - 1];
    const item = { depth, checked, text, category, parent };
    items.push(item);
    stack.push(item);
  }
  return items;
}

async function loadState(stateFile) {
  try {
    return JSON.parse(await readFile(stateFile, "utf8"));
  } catch {
    return { issues: {} };
  }
}

async function saveState(stateFile, state) {
  await mkdir(path.dirname(stateFile), { recursive: true });
  await writeFile(stateFile, JSON.stringify(state, null, 2));
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.config) {
    console.error("Usage: node import-now.js --config <config.json> [--dry-run]");
    process.exit(1);
  }

  const cfg = JSON.parse(await readFile(path.resolve(__dirname, args.config), "utf8"));
  const baseUrl = process.env.QUESTIMUS_URL || cfg.baseUrl;
  const apiKey = process.env.QUESTIMUS_TOKEN || cfg.apiKey;
  if (!apiKey && !args.dryRun) {
    console.error("No API key: set QUESTIMUS_TOKEN or config.apiKey (not needed for --dry-run)");
    process.exit(1);
  }
  const client = new QuestimusClient({ baseUrl, apiKey });
  const stateFile = path.resolve(__dirname, cfg.stateFile || "state/now.json");
  const state = await loadState(stateFile);

  let types = {};
  if (cfg.typesFile) {
    try {
      types = JSON.parse(await readFile(path.resolve(__dirname, cfg.typesFile), "utf8"));
    } catch {
      console.warn(`  ! types file ${cfg.typesFile} not found — types will be unset`);
    }
  }

  // Project cache: name → { id, states, labels }
  const projectCache = new Map();
  async function resolveProject(name) {
    if (projectCache.has(name)) return projectCache.get(name);
    if (args.dryRun) {
      const p = { id: `project:${name}`, states: new Map(), labels: new Map() };
      projectCache.set(name, p);
      return p;
    }
    const projects = (await client.listProjects(cfg.workspaceSlug)).results ?? [];
    const project = projects.find((p) => p.name === name);
    if (!project) throw new Error(`Project "${name}" not found`);
    const states = (await client.listStates(cfg.workspaceSlug, project.id)).results ?? [];
    const labels = (await client.listLabels(cfg.workspaceSlug, project.id)).results ?? [];
    const p = {
      id: project.id,
      states: new Map(states.map((s) => [s.name, s])),
      labels: new Map(labels.map((l) => [l.name, l])),
    };
    projectCache.set(name, p);
    return p;
  }

  async function ensureState(project, name) {
    if (project.states.has(name)) return project.states.get(name).id;
    if (args.dryRun) { console.log(`  [dry-run] would create state "${name}"`); return `state:${name}`; }
    const created = await client.createState(cfg.workspaceSlug, project.id, { name, group: name === "Done" ? "completed" : "backlog", color: "#94a3b8" });
    project.states.set(name, created);
    return created.id;
  }

  async function ensureLabel(project, name) {
    if (project.labels.has(name)) return project.labels.get(name).id;
    if (args.dryRun) { console.log(`  [dry-run] would create label "${name}"`); return `label:${name}`; }
    const created = await client.createLabel(cfg.workspaceSlug, project.id, { name });
    project.labels.set(name, created);
    return created.id;
  }

  const raw = await readFile(path.resolve(cfg.sourceFile), "utf8");
  const items = parseCheckboxItems(raw);

  const report = { created: 0, skipped: 0, failed: [] };
  const byRel = new Map(); // rel → issue id (for parent links)

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rel = `${path.basename(cfg.sourceFile)}#cb${i + 1}`;
    if (state.issues[rel]) { report.skipped++; continue; }

    // Route: first matching route wins; children inherit the parent's route
    let route = null;
    if (item.parent && item.parent.route) {
      route = item.parent.route;
    } else {
      route = (cfg.routes || []).find((r) => item.text.toLowerCase().includes(r.match.toLowerCase())) || null;
    }
    item.route = route; // children inherit this
    const projectName = route?.project || cfg.defaultProject || "Personal";
    const labelName = route?.label || cfg.defaultLabel || "todo";

    let project;
    try {
      project = await resolveProject(projectName);
    } catch (err) {
      report.failed.push({ file: rel, error: err.message });
      continue;
    }

    const stateName = item.checked ? "Done" : "Open";
    const stateId = await ensureState(project, stateName);
    const labelId = await ensureLabel(project, labelName);
    const priority = item.text.includes("🔴") ? "urgent" : item.text.includes("📅") ? "high" : "medium";

    const payload = {
      name: item.text.length > 200 ? `${item.text.slice(0, 200)}…` : item.text,
      description_html: mdToHtml(`**Category:** ${item.category}\n\n${item.text}`),
      state: stateId,
      priority,
      labels: [labelId],
      external_source: cfg.externalSource || "empirium-now",
      external_id: `now-${i + 1}`,
    };
    if (types.Ticket) payload.type_id = types.Ticket;

    // Parent link: only when the parent routed to the same project
    if (item.parent) {
      const parentRel = `${path.basename(cfg.sourceFile)}#cb${items.indexOf(item.parent) + 1}`;
      const parentId = byRel.get(parentRel);
      if (parentId && !parentId.startsWith("dry:")) payload.parent = parentId;
      else if (args.dryRun) payload.parent = `parent:${parentRel}`;
    }

    if (args.dryRun) {
      console.log(`  [dry-run] would create "${payload.name.slice(0, 60)}…" → ${projectName} [${labelName}] (${stateName})`);
      byRel.set(rel, `dry:${rel}`);
      report.created++;
      continue;
    }

    try {
      let created;
      let isDuplicate = false;
      try {
        created = await client.createWorkItem(cfg.workspaceSlug, project.id, payload);
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
      byRel.set(rel, created.id);
      if (isDuplicate) report.skipped++;
      else report.created++;
    } catch (err) {
      report.failed.push({ file: rel, error: err.message });
    }
  }

  if (!args.dryRun) await saveState(stateFile, state);
  console.log(`\nNow import report:`);
  console.log(`  created: ${report.created} · skipped: ${report.skipped} · failed: ${report.failed.length}`);
  for (const f of report.failed) console.log(`  FAILED ${f.file}: ${f.error}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
