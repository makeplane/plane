#!/usr/bin/env node
// Idempotent workspace setup: ensure projects, states, labels, modules exist.
//
// Usage:
//   node setup-workspace.js --config config/legaliosa-v2.json [--dry-run]
//
// The config's `setup` section (optional) lists projects/states/labels/modules.
// If absent, only the project named in the config is ensured (with default
// states Backlog/Unstarted/Started/Completed/Cancelled).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QuestimusClient } from "./lib/questimus-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_STATES = [
  { name: "Backlog", group: "backlog", color: "#94a3b8" },
  { name: "ToDo", group: "unstarted", color: "#3f76ff" },
  { name: "In Progress", group: "started", color: "#f59e0b" },
  { name: "Blocked", group: "started", color: "#ef4444" },
  { name: "Cancelled", group: "cancelled", color: "#6b7280" },
  { name: "Done", group: "completed", color: "#16a34a" },
];

// Resolve filter placeholders: {{karolUserId}}, {{state:Name}}, {{label:Name}}, {{type:Name}}
function resolveFilterValue(value, ctx) {
  if (typeof value !== "string") return value;
  return value.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    if (key === "karolUserId") return ctx.karolUserId || "";
    if (key.startsWith("state:")) return ctx.states.get(key.slice(6))?.id || "";
    if (key.startsWith("label:")) return ctx.labels.get(key.slice(6))?.id || "";
    if (key.startsWith("type:")) return ctx.types[key.slice(5)] || "";
    return "";
  });
}

function resolveFilters(rawFilters, ctx) {
  const filters = {};
  for (const [k, val] of Object.entries(rawFilters || {})) {
    const resolved = Array.isArray(val)
      ? val.map((x) => resolveFilterValue(x, ctx)).filter(Boolean)
      : resolveFilterValue(val, ctx);
    if (Array.isArray(resolved) ? resolved.length : resolved) filters[k] = resolved;
  }
  return filters;
}

async function listAll(client, fetcher) {
  const res = await fetcher();
  return Array.isArray(res) ? res : (res.results ?? []);
}

function parseArgs(argv) {
  const args = { config: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--config") args.config = argv[++i];
    else if (argv[i] === "--dry-run") args.dryRun = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.config) {
    console.error("Usage: node setup-workspace.js --config <config.json> [--dry-run]");
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

  // Issue type UUIDs (workspace-level; created by db/setup_issue_types.py)
  let types = {};
  try {
    types = JSON.parse(await readFile(path.resolve(__dirname, "state/types.json"), "utf8"));
  } catch {
    console.warn("  ! state/types.json not found — {{type:...}} view placeholders will be empty");
  }

  const report = { projects: 0, states: 0, labels: 0, modules: 0, views: 0 };

  // Projects to ensure: from config.setup.projects, or just the config's project
  const projects = cfg.setup?.projects?.length
    ? cfg.setup.projects
    : [{ name: cfg.projectName, identifier: cfg.projectIdentifier || "TASK" }];

  for (const p of projects) {
    let project = null;
    if (!args.dryRun) {
      const existing = (await client.listProjects(cfg.workspaceSlug)).results ?? [];
      project = existing.find((x) => x.name === p.name);
    }
    let projectId;
    if (!project) {
      if (args.dryRun) {
        console.log(`  [dry-run] would create project "${p.name}"`);
        report.projects++;
        projectId = "dry-run";
      } else {
        project = await client.createProject(cfg.workspaceSlug, {
          name: p.name,
          identifier: p.identifier || "TASK",
          description: p.description || "",
          network: 0, // secret (only members see it)
        });
        report.projects++;
        console.log(`  created project "${p.name}" (${project.id})`);
        projectId = project.id;
      }
    } else {
      projectId = project.id;
    }

    // States
    const states = args.dryRun ? [] : ((await client.listStates(cfg.workspaceSlug, projectId)).results ?? []);
    const byName = new Map(states.map((s) => [s.name, s]));
    const wantedList = p.states || DEFAULT_STATES;
    const wanted = new Set(wantedList.map((s) => s.name));

    // Normalize Plane's auto-created defaults to the config's state set (§5.2):
    // the project's default state cannot be deleted — if its name isn't in the
    // wanted set, rename it to the wanted backlog state (keeps the default flag
    // + backlog group; Phase 1 ran Backlog→"Open", the 2026-09-08 model change
    // runs "Open"→Backlog). Other non-default leftovers (e.g. "Todo") are deleted.
    let renamedId = null;
    const defaultState = states.find((s) => s.default);
    const backlogTarget = wantedList.find((s) => s.group === "backlog");
    if (defaultState && backlogTarget && !byName.has(backlogTarget.name) && defaultState.name !== backlogTarget.name) {
      if (args.dryRun) {
        console.log(`  [dry-run] would rename state "${defaultState.name}" → "${backlogTarget.name}" (keeps default flag)`);
      } else {
        const updated = await client.updateState(cfg.workspaceSlug, projectId, defaultState.id, {
          name: backlogTarget.name,
          color: backlogTarget.color,
        });
        byName.set(backlogTarget.name, updated);
        renamedId = defaultState.id;
        console.log(`  renamed state "${defaultState.name}" → "${backlogTarget.name}"`);
      }
    }

    for (const s of wantedList) {
      if (byName.has(s.name)) continue;
      if (args.dryRun) { console.log(`  [dry-run] would create state "${s.name}"`); report.states++; continue; }
      await client.createState(cfg.workspaceSlug, projectId, s);
      report.states++;
      console.log(`  created state "${s.name}"`);
    }

    // Delete leftover default states not in the wanted set (e.g. "Todo").
    // The API rejects default states and non-empty states — those are left alone.
    for (const s of states) {
      if (s.id === renamedId) continue;
      if (wanted.has(s.name)) continue;
      if (args.dryRun) { console.log(`  [dry-run] would delete leftover state "${s.name}"`); continue; }
      try {
        await client.deleteState(cfg.workspaceSlug, projectId, s.id);
        console.log(`  deleted leftover state "${s.name}"`);
      } catch {
        console.log(`  left state "${s.name}" (default or non-empty — API rejected the delete)`);
      }
    }

    // Labels
    const labels = args.dryRun ? [] : ((await client.listLabels(cfg.workspaceSlug, projectId)).results ?? []);
    const labelNames = new Set(labels.map((l) => l.name));
    for (const name of p.labels || []) {
      if (labelNames.has(name)) continue;
      if (args.dryRun) { console.log(`  [dry-run] would create label "${name}"`); report.labels++; continue; }
      await client.createLabel(cfg.workspaceSlug, projectId, { name });
      report.labels++;
      console.log(`  created label "${name}"`);
    }

    // Views (per project) — main API (token works after the fork change §7.4).
    // Every project gets the `defaults` views + any project-specific extras.
    const projectViews = [
      ...(cfg.setup?.views?.defaults || []),
      ...(cfg.setup?.views?.projects?.[p.name] || []),
    ];
    if (projectViews.length) {
      const existingViews = args.dryRun ? [] : await listAll(client, () => client.listProjectViews(cfg.workspaceSlug, projectId));
      const viewNames = new Set(existingViews.map((v) => v.name));
      const labelByName = new Map(labels.map((l) => [l.name, l]));
      const ctx = { karolUserId: cfg.setup?.karolUserId, states: byName, labels: labelByName, types };
      for (const v of projectViews) {
        if (viewNames.has(v.name)) continue;
        const filters = resolveFilters(v.filters, ctx);
        if (args.dryRun) { console.log(`  [dry-run] would create view "${v.name}" (${p.name})`); report.views++; continue; }
        await client.createProjectView(cfg.workspaceSlug, projectId, { name: v.name, filters });
        report.views++;
        console.log(`  created view "${v.name}" (${p.name})`);
      }
    }

    // Modules
    for (const m of p.modules || []) {
      if (args.dryRun) { console.log(`  [dry-run] would create module "${m.name}"`); report.modules++; continue; }
      await client.createModule(cfg.workspaceSlug, projectId, { name: m.name, description: m.description || "" });
      report.modules++;
      console.log(`  created module "${m.name}"`);
    }
  }

  // Workspace views (e.g. "Next") — main API
  const wsViews = cfg.setup?.views?.workspace || [];
  if (wsViews.length) {
    const existingWs = args.dryRun ? [] : await listAll(client, () => client.listWorkspaceViews(cfg.workspaceSlug));
    const wsNames = new Set(existingWs.map((v) => v.name));
    const ctx = { karolUserId: cfg.setup?.karolUserId, states: new Map(), labels: new Map(), types };
    for (const v of wsViews) {
      if (wsNames.has(v.name)) continue;
      const filters = resolveFilters(v.filters, ctx);
      if (args.dryRun) { console.log(`  [dry-run] would create workspace view "${v.name}"`); report.views++; continue; }
      await client.createWorkspaceView(cfg.workspaceSlug, { name: v.name, filters });
      report.views++;
      console.log(`  created workspace view "${v.name}"`);
    }
  }

  console.log(`\nSetup report (${cfg.name}):`);
  console.log(`  projects: ${report.projects} · states: ${report.states} · labels: ${report.labels} · modules: ${report.modules} · views: ${report.views}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
