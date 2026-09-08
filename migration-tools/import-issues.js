#!/usr/bin/env node
// Generic importer: markdown tickets (frontmatter + body) → Questimus work-items.
//
// Usage:
//   node import-issues.js --config config/legaliosa-v2.json [--dry-run]
//
// Handles two ticket artifacts (config-driven):
//   1. Numbered tickets in `ticketsDir` (e.g. tickets/0119-*.md, tickets/done/*)
//      — id from the filename prefix ("0119"), module from `sub_plan` (SP05),
//      relations from `blocked_by`.
//   2. Task units in `taskDir` matching `taskPattern` (e.g. T-01-01-*.md)
//      — id from the filename prefix ("T-01-01"), module derived (T-01-01 → SP-01),
//      relations from `depends-on`.
//
// Behavior:
//   - Two passes: pass 1 creates work-items, pass 2 creates relations.
//   - Idempotent: the v1 API returns 409 + existing id when external_source +
//     external_id already exist (treated as already imported); a local state file
//     (config.stateFile) maps source path → work-item id and resolves relations.
//   - --dry-run prints what would happen without calling the API (and does not
//     write the state file).
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QuestimusClient, QuestimusError } from "./lib/questimus-client.js";
import { parseFrontmatter } from "./lib/frontmatter.js";
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

async function walk(dir, out = [], exclude = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (exclude.includes(entry.name)) continue; // e.g. archive/ (v1 subplans must not be imported)
      await walk(full, out, exclude);
    } else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function firstHeading(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

// Parse all markdown tables in a document. Returns [{ header: [..], rows: [[..]] }].
function parseMarkdownTables(md) {
  const tables = [];
  const lines = md.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith("|")) {
      const header = line.split("|").slice(1, -1).map((c) => c.trim());
      i++;
      if (i < lines.length && /^\|[\s:|-]+\|?$/.test(lines[i].trim())) i++; // separator row
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
        i++;
      }
      tables.push({ header, rows });
    } else {
      i++;
    }
  }
  return tables;
}

function toList(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map(String);
  return String(value).split(/[,;\s]+/).filter(Boolean);
}

// Ground-truth id from the filename prefix: "0119-foo.md" → "0119",
// "T-01-01-foo.md" → "T-01-01", "SP-01-foo.md" → "SP-01".
// (Frontmatter ids with leading zeros are corrupted by YAML octal parsing,
// so the filename is authoritative.)
function idFromFilename(file) {
  const base = path.basename(file, ".md");
  const m = base.match(/^(\d+)/);
  if (m) return m[1];
  const sp = base.match(/^(SP-\d+)/i);
  if (sp) return sp[1].toUpperCase();
  const t = base.match(/^(T-\d+-\d+)/i);
  if (t) return t[1].toUpperCase();
  const st = base.match(/^(ST-\d+)/i);
  if (st) return st[1].toUpperCase();
  return base;
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
    console.error("Usage: node import-issues.js --config <config.json> [--dry-run]");
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
  const stateFile = path.resolve(__dirname, cfg.stateFile || "state/import-state.json");
  const state = await loadState(stateFile);

  // Resolve project by name (skipped in dry-run — no API calls)
  let projectId = "dry-run";
  if (!args.dryRun) {
    const projects = await client.listProjects(cfg.workspaceSlug);
    const project = (projects.results ?? projects).find((p) => p.name === cfg.projectName);
    if (!project) {
      console.error(`Project "${cfg.projectName}" not found in workspace "${cfg.workspaceSlug}"`);
      process.exit(1);
    }
    projectId = project.id;
    console.log(`Project: ${project.name} (${projectId})`);
  }

  // States + labels: load, create missing (idempotent)
  const stateByName = new Map();
  const labelByName = new Map();
  if (!args.dryRun) {
    const stateList = (await client.listStates(cfg.workspaceSlug, projectId)).results ?? [];
    for (const s of stateList) stateByName.set(s.name, s);
    const labelList = (await client.listLabels(cfg.workspaceSlug, projectId)).results ?? [];
    for (const l of labelList) labelByName.set(l.name, l);
  }

  const dryStates = new Set();
  const dryLabels = new Set();
  async function ensureState(name, group = "backlog") {
    if (stateByName.has(name)) return stateByName.get(name).id;
    if (args.dryRun) {
      if (!dryStates.has(name)) { dryStates.add(name); console.log(`  [dry-run] would create state "${name}"`); }
      return `state:${name}`;
    }
    const created = await client.createState(cfg.workspaceSlug, projectId, { name, group, color: "#94a3b8" });
    stateByName.set(name, created);
    return created.id;
  }

  async function ensureLabel(name) {
    if (labelByName.has(name)) return labelByName.get(name).id;
    if (args.dryRun) {
      if (!dryLabels.has(name)) { dryLabels.add(name); console.log(`  [dry-run] would create label "${name}"`); }
      return `label:${name}`;
    }
    const created = await client.createLabel(cfg.workspaceSlug, projectId, { name });
    labelByName.set(name, created);
    return created.id;
  }

  // Estimates: one "Effort" system per project with points 1/3/5 (S/M/L)
  let estimateCache = null;
  const dryEstimate = new Set();
  async function ensureEstimate() {
    if (estimateCache) return estimateCache;
    if (args.dryRun) {
      if (!dryEstimate.has("estimate")) { dryEstimate.add("estimate"); console.log('  [dry-run] would create estimate "Effort"'); }
      return { id: "estimate:Effort" };
    }
    const list = (await client.listEstimates(cfg.workspaceSlug, projectId)).results ?? [];
    estimateCache = list.find((e) => e.name === cfg.estimateName);
    if (!estimateCache) {
      estimateCache = await client.createEstimate(cfg.workspaceSlug, projectId, {
        name: cfg.estimateName, type: "points", description: "Effort estimate: S=1, M=3, L=5",
      });
    }
    return estimateCache;
  }

  async function ensureEstimatePoint(value) {
    const estimate = await ensureEstimate();
    if (args.dryRun) {
      if (!dryEstimate.has(value)) { dryEstimate.add(value); console.log(`  [dry-run] would create estimate point "${value}"`); }
      return `point:${value}`;
    }
    // The v1 estimate-points list is a plain array (not paginated)
    const pointsRes = await client.listEstimatePoints(cfg.workspaceSlug, projectId, estimate.id);
    const points = Array.isArray(pointsRes) ? pointsRes : (pointsRes.results ?? []);
    const existing = points.find((p) => p.value === value);
    if (existing) return existing.id;
    const pointCfg = (cfg.estimatePoints || []).find((p) => p.value === value);
    // The create endpoint is a bulk create — the response is an array
    const created = await client.createEstimatePoint(cfg.workspaceSlug, projectId, estimate.id, {
      key: pointCfg?.key ?? 1, value,
    });
    return (Array.isArray(created) ? created[0] : created).id;
  }

  // ---- Collect items ----
  // Planning model (migration-karol.md §5.4): PLAN → SP → T → ST as nested
  // work items (types Plan/Subplan/Task/Subtask), tickets separate (type
  // Ticket, no parent). Parents are created before children (depth order).
  const ticketsDir = cfg.ticketsDir ? path.resolve(cfg.sourceDir, cfg.ticketsDir) : null;
  const doneDir = cfg.doneDir ? path.resolve(cfg.sourceDir, cfg.doneDir) : null;
  const excludeDirs = cfg.excludeDirs || []; // subfolders skipped by all recursive walks
  const items = [];

  // 1. Plan file → type Plan (the root of the hierarchy)
  if (cfg.planFile) {
    const file = path.resolve(cfg.sourceDir, cfg.planFile);
    const raw = await readFile(file, "utf8");
    const { data, body } = parseFrontmatter(raw);
    items.push({
      file, rel: cfg.planFile, body, data,
      isDone: false, externalId: "PLAN", type: "Plan", depth: 0, parentExternalId: null,
      effort: null, relations: [], labelNames: [],
    });
  }

  // 2. SP files → type Subplan (children of PLAN)
  if (cfg.spPattern) {
    const spDir = path.resolve(cfg.sourceDir, cfg.spDir || ".");
    const prefix = cfg.spPattern.split("*")[0];
    for (const file of await walk(spDir, [], excludeDirs)) {
      if (!path.basename(file).startsWith(prefix)) continue;
      if (items.some((i) => i.file === file)) continue;
      const rel = path.relative(cfg.sourceDir, file).replace(/\\/g, "/");
      const raw = await readFile(file, "utf8");
      const { data, body } = parseFrontmatter(raw);
      items.push({
        file, rel, body, data,
        isDone: false, externalId: idFromFilename(file), type: "Subplan", depth: 1,
        parentExternalId: "PLAN",
        effort: null, relations: [], labelNames: [],
      });
    }
  }

  // 3. Task units (T-*.md) → type Task (children of their SP)
  if (cfg.taskDir) {
    const taskDir = path.resolve(cfg.sourceDir, cfg.taskDir);
    const prefix = cfg.taskPattern ? cfg.taskPattern.split("*")[0] : "T-";
    for (const file of await walk(taskDir, [], excludeDirs)) {
      if (!path.basename(file).startsWith(prefix)) continue;
      if (items.some((i) => i.file === file)) continue; // avoid double-walk
      const rel = path.relative(cfg.sourceDir, file).replace(/\\/g, "/");
      const raw = await readFile(file, "utf8");
      const { data, body } = parseFrontmatter(raw);
      const taskId = idFromFilename(file); // e.g. "T-01-01"
      const sp = taskId.match(/^T-(\d+)/);
      items.push({
        file, rel, body, data,
        isDone: false, externalId: taskId, type: "Task", depth: 2,
        parentExternalId: sp ? `SP-${sp[1].padStart(2, "0")}` : "PLAN",
        effort: null,
        relations: toList(data[cfg.dependsOnField || "depends-on"]).map((id) => ({ type: "blocked_by", id })),
        labelNames: [],
      });
    }
  }

  // 4. Subtask units (ST-*.md, future convention) → type Subtask (children of their T)
  if (cfg.stPattern) {
    const stDir = path.resolve(cfg.sourceDir, cfg.stDir || ".");
    const prefix = cfg.stPattern.split("*")[0];
    for (const file of await walk(stDir, [], excludeDirs)) {
      if (!path.basename(file).startsWith(prefix)) continue;
      if (items.some((i) => i.file === file)) continue;
      const rel = path.relative(cfg.sourceDir, file).replace(/\\/g, "/");
      const raw = await readFile(file, "utf8");
      const { data, body } = parseFrontmatter(raw);
      const stId = idFromFilename(file); // e.g. "ST-01"
      const t = stId.match(/^ST-(\d+)/);
      items.push({
        file, rel, body, data,
        isDone: false, externalId: stId, type: "Subtask", depth: 3,
        parentExternalId: t ? `T-${t[1].padStart(2, "0")}-01` : null,
        effort: null, relations: [], labelNames: [],
      });
    }
  }

  // 5. Numbered tickets → type Ticket (separate from the plan hierarchy)
  if (ticketsDir) {
    for (const file of await walk(ticketsDir, [], excludeDirs)) {
      const rel = path.relative(cfg.sourceDir, file).replace(/\\/g, "/");
      const raw = await readFile(file, "utf8");
      const { data, body } = parseFrontmatter(raw);
      const subPlan = data[cfg.subPlanField || "sub_plan"];
      const spLabel = subPlan
        ? String(subPlan).toUpperCase().startsWith("SP") ? String(subPlan).toUpperCase() : `SP-${subPlan}`
        : null;
      items.push({
        file, rel, body, data,
        isDone: doneDir ? file.startsWith(doneDir + path.sep) : false,
        externalId: idFromFilename(file), type: "Ticket", depth: 0, parentExternalId: null,
        effort: data.effort || (cfg.effortFromBody ? (body.match(/Effort:\s*([SML])\b/i)?.[1] ?? null) : null) || null,
        relations: toList(data[cfg.blockedByField || "blocked_by"]).map((id) => ({ type: "blocked_by", id })),
        labelNames: cfg.ticketSpLabels && spLabel ? [spLabel] : [],
      });
    }
  }

  // Table sources (e.g. BACKLOG.md summary tables) — one issue per data row
  for (const ts of cfg.tableSources || []) {
    const file = path.resolve(cfg.sourceDir, ts.file);
    const raw = await readFile(file, "utf8");
    const tables = parseMarkdownTables(raw);
    const table = tables[ts.tableIndex ?? 0];
    if (!table) { console.warn(`  ! no table found in ${ts.file}`); continue; }
    const col = (row, name) => (name ? row[table.header.indexOf(name)] ?? "" : "");
    for (const row of table.rows) {
      const id = col(row, ts.columns.id);
      const name = col(row, ts.columns.name);
      if (!name) continue;
      const priority = col(row, ts.columns.priority);
      const dropped = /dropped/i.test(name + " " + priority);
      const effort = ts.columns.effort ? (col(row, ts.columns.effort).match(/^(S|M|L)$/)?.[1] ?? null) : null;
      const detail = [
        ts.columns.priority && `**Priority:** ${priority}`,
        ts.columns.effort && `**Effort:** ${col(row, ts.columns.effort)}`,
        ts.columns.mergeRisk && `**Merge-risk:** ${col(row, ts.columns.mergeRisk)}`,
        ts.columns.source && `**Source:** ${col(row, ts.columns.source)}`,
      ].filter(Boolean).join("\n\n");
      items.push({
        file, rel: `${ts.file}#${id}`, body: detail, name,
        data: { status: dropped ? "dropped" : "open", severity: ts.priorityMap?.[priority] },
        isDone: false,
        externalId: id, type: "Ticket", depth: 0, parentExternalId: null,
        effort,
        relations: [],
        labelNames: dropped ? [] : (ts.label ? [ts.label] : []),
      });
    }
  }

  // Section sources (e.g. TODOS.md "## E2 — title" sections) — one issue per section
  for (const ss of cfg.sectionSources || []) {
    const file = path.resolve(cfg.sourceDir, ss.file);
    const raw = await readFile(file, "utf8");
    const sections = raw.split(/^##\s+/m).slice(1);
    for (const sec of sections) {
      const lines = sec.split(/\r?\n/);
      const head = lines[0].trim();
      const body = lines.slice(1).join("\n").trim();
      const resolved = /^✅\s*RESOLVED/i.test(head);
      const idM = head.match(/\(?([A-Za-z]+\d+)/);
      const titleM = head.match(/[—–]\s*(.+)$/) || head.match(/\s-\s(.+)$/); // em/– dash first; hyphens in dates must not match
      if (!idM) continue;
      items.push({
        file, rel: `${ss.file}#${idM[1]}`, body,
        name: titleM ? titleM[1].trim() : head,
        data: { status: resolved ? "done" : "open" },
        isDone: false,
        externalId: idM[1], type: "Ticket", depth: 0, parentExternalId: null,
        effort: null,
        relations: [],
        labelNames: resolved ? [] : (ss.label ? [ss.label] : []),
      });
    }
  }

  // Checkbox sources (e.g. Ideas.md, Now.md, per-app task lists) — one issue per
  // "- [ ] / - [x]" item; the nearest preceding heading becomes the category.
  for (const cs of cfg.checkboxSources || []) {
    const file = path.resolve(cfg.sourceDir, cs.file);
    const raw = await readFile(file, "utf8");
    const lines = raw.split(/\r?\n/);
    let category = "";
    let idx = 0;
    for (const line of lines) {
      const h = line.match(/^#{1,3}\s+(.+)$/);
      if (h) { category = h[1].trim(); continue; }
      const cb = line.match(/^\s*-\s*\[( |x|X)\]\s+(.+)$/);
      if (!cb) continue;
      idx++;
      const checked = cb[1].toLowerCase() === "x";
      const text = cb[2].trim();
      const priority = cs.priorityFromText
        ? Object.entries(cs.priorityFromText).find(([marker]) => text.includes(marker))?.[1]
        : undefined;
      items.push({
        file, rel: `${cs.file}#cb${idx}`, body: `**Category:** ${category}\n\n${text}`,
        name: text.length > 200 ? `${text.slice(0, 200)}…` : text,
        data: { status: checked ? "done" : "open", severity: priority },
        isDone: false,
        externalId: `${cs.file.replace(/\.md$/, "")}-${idx}`, type: "Ticket", depth: 0, parentExternalId: null,
        effort: null,
        relations: [],
        labelNames: [cs.label || "todo"],
      });
    }
  }

  // ---- Pass 1: create work-items ----
  // Issue types (created DB-side by db/setup_issue_types.py; ids in typesFile)
  let types = {};
  if (cfg.typesFile) {
    try {
      types = JSON.parse(await readFile(path.resolve(__dirname, cfg.typesFile), "utf8"));
    } catch {
      console.warn(`  ! types file ${cfg.typesFile} not found — run setup_issue_types.py first (types will be unset)`);
    }
  }

  const report = { created: 0, skipped: 0, failed: [], relations: 0 };
  const byExternalId = new Map(); // external id → work-item id

  // Parents before children: Plan (0) → SP (1) → T (2) → ST (3); tickets (0) any order
  const ordered = [...items].sort((a, b) => (a.depth - b.depth) || a.rel.localeCompare(b.rel));

  for (const item of ordered) {
    if (state.issues[item.rel]) { report.skipped++; continue; }

    const name = item.name || item.data[cfg.titleField || "title"] || firstHeading(item.body) || path.basename(item.file, ".md");
    const stateName = item.isDone ? "Done" : (cfg.stateMapping?.[item.data.status] ?? "Backlog");
    const stateId = await ensureState(stateName);
    const labels = [];
    for (const ln of item.labelNames || []) labels.push(await ensureLabel(ln));
    if (item.data.status === "blocked" && cfg.labels?.blocked) labels.push(await ensureLabel(cfg.labels.blocked));
    if (item.data[cfg.verifiedField || "verified"] && cfg.labels?.verified) labels.push(await ensureLabel(cfg.labels.verified));

    const payload = {
      name,
      description_html: mdToHtml((cfg.sourceLine ? `**Source:** \`${item.rel}\`\n\n` : "") + item.body),
      state: stateId,
      priority: cfg.priorityMapping?.[item.data[cfg.priorityField || "severity"]] ?? "medium",
      external_source: cfg.externalSource,
      external_id: item.externalId,
    };
    if (labels.length) payload.labels = labels;
    if (item.data[cfg.createdField || "created"]) {
      // Normalize to ISO: gray-matter yields a Date object; the lenient fallback
      // yields a date-only string ("2026-08-15") which DRF's DateTimeField rejects
      const d = new Date(item.data[cfg.createdField || "created"]);
      if (!isNaN(d.getTime())) payload.created_at = d.toISOString();
    }
    if (item.effort && cfg.effortMapping?.[item.effort]) {
      payload.estimate_point = await ensureEstimatePoint(cfg.effortMapping[item.effort]);
    }
    // Issue type (migration-karol.md §5.4, revised 2026-09-08): the hierarchy
    // stages (SP/T/ST) are carried by the item prefixes — Subplan/Task/Subtask
    // all map to the single "Plan" type; tickets stay "Ticket".
    const typeName = item.type === "Subplan" || item.type === "Task" || item.type === "Subtask" ? "Plan" : item.type;
    if (typeName && types[typeName]) payload.type_id = types[typeName];
    if (item.parentExternalId) {
      const parentId = byExternalId.get(item.parentExternalId);
      if (parentId && !parentId.startsWith("dry:")) payload.parent = parentId;
      else if (args.dryRun) payload.parent = `parent:${item.parentExternalId}`;
      else console.warn(`  ! ${item.rel}: parent "${item.parentExternalId}" not found (created without parent)`);
    }

    if (args.dryRun) {
      const typeTag = item.type ? ` [${item.type}]` : "";
      const parentTag = item.parentExternalId ? ` → ${item.parentExternalId}` : "";
      console.log(`  [dry-run] would create "${name}" (${stateName})${typeTag}${parentTag}`);
      state.issues[item.rel] = `dry:${item.rel}`; // in-memory only (state file not saved in dry-run)
      byExternalId.set(item.externalId, `dry:${item.rel}`);
      report.created++;
      continue;
    }

    try {
      let created;
      let isDuplicate = false;
      try {
        created = await client.createWorkItem(cfg.workspaceSlug, projectId, payload);
      } catch (err) {
        if (err instanceof QuestimusError && err.status === 409) {
          // Already imported (external_source + external_id exist) — reuse it
          const existingId = JSON.parse(err.body || "{}").id;
          if (!existingId) throw err;
          created = { id: existingId };
          isDuplicate = true;
        } else {
          throw err;
        }
      }
      state.issues[item.rel] = created.id;
      byExternalId.set(item.externalId, created.id);
      if (isDuplicate) report.skipped++;
      else report.created++;
    } catch (err) {
      report.failed.push({ file: item.rel, error: err.message });
    }
  }

  // ---- Pass 2: relations ----
  for (const item of items) {
    const issueId = state.issues[item.rel];
    if (!issueId) continue;
    for (const rel of item.relations) {
      const targetId = byExternalId.get(rel.id);
      if (!targetId) {
        console.warn(`  ! ${item.rel}: ${rel.type} "${rel.id}" not found (skipped)`);
        continue;
      }
      if (args.dryRun || issueId.startsWith("dry:") || targetId.startsWith("dry:")) {
        console.log(`  [dry-run] would link ${item.rel} ${rel.type} ${rel.id}`);
        report.relations++;
        continue;
      }
      try {
        await client.createRelation(cfg.workspaceSlug, projectId, issueId, { relation_type: rel.type, issues: [targetId] });
        report.relations++;
      } catch (err) {
        report.failed.push({ file: item.rel, error: `relation: ${err.message}` });
      }
    }
  }

  if (!args.dryRun) await saveState(stateFile, state);
  console.log(`\nImport report (${cfg.name}):`);
  console.log(`  created: ${report.created} · skipped: ${report.skipped} · relations: ${report.relations} · failed: ${report.failed.length}`);
  for (const f of report.failed) console.log(`  FAILED ${f.file}: ${f.error}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
