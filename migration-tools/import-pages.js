#!/usr/bin/env node
// Importer: markdown plan/SP/review docs → Questimus pages.
//
// Usage:
//   node import-pages.js --config config/legaliosa-v2.json [--dry-run]
//
// Requires the fork change (migration-karol.md §7.4) so API tokens work on the
// main API (pages live there). Idempotent via a local state file.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import { QuestimusClient } from "./lib/questimus-client.js";
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

function firstHeading(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

async function loadState(stateFile) {
  try {
    return JSON.parse(await readFile(stateFile, "utf8"));
  } catch {
    return { pages: {} };
  }
}

async function saveState(stateFile, state) {
  await mkdir(path.dirname(stateFile), { recursive: true });
  await writeFile(stateFile, JSON.stringify(state, null, 2));
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.config) {
    console.error("Usage: node import-pages.js --config <config.json> [--dry-run]");
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
  const stateFile = path.resolve(__dirname, cfg.pagesStateFile || cfg.stateFile || "state/import-state.json");
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
  }

  const report = { created: 0, skipped: 0, failed: [] };

  // Parent pages (e.g. a "Research" section): created once, cached by name.
  const parentCache = new Map();
  async function ensureParentPage(name) {
    if (parentCache.has(name)) return parentCache.get(name);
    if (args.dryRun) {
      console.log(`  [dry-run] would create parent page "${name}"`);
      parentCache.set(name, `parent:${name}`);
      return `parent:${name}`;
    }
    const pages = await client.listPages(cfg.workspaceSlug, projectId);
    const existing = (pages.results ?? pages).find((p) => p.name === name);
    if (existing) { parentCache.set(name, existing.id); return existing.id; }
    const created = await client.createPage(cfg.workspaceSlug, projectId, {
      name,
      description_html: "",
      access: 0,
    });
    parentCache.set(name, created.id);
    return created.id;
  }

  for (const group of cfg.pageGroups || []) {
    const pattern = path.posix.join(cfg.sourceDir.replace(/\\/g, "/"), group.pattern);
    const matches = await glob(pattern, { nodir: true });
    for (const file of matches.sort()) {
      const rel = path.relative(cfg.sourceDir, file).replace(/\\/g, "/");
      if (state.pages[rel]) { report.skipped++; continue; }

      const raw = await readFile(file, "utf8");
      const { data, body } = file.endsWith(".md") ? parseFrontmatter(raw) : { data: {}, body: raw };
      const heading = firstHeading(body);
      const name =
        group.name ||
        (group.nameFrom === "heading" && heading ? heading : null) ||
        (group.namePrefix || "") + path.basename(file, ".md");

      if (args.dryRun) {
        console.log(`  [dry-run] would create page "${name}"`);
        report.created++;
        continue;
      }

      try {
        const payload = {
          name,
          description_html: mdToHtml(body),
          access: 0, // public within the project
        };
        if (group.parentPage) payload.parent = await ensureParentPage(group.parentPage);
        const created = await client.createPage(cfg.workspaceSlug, projectId, payload);
        state.pages[rel] = created.id;
        report.created++;
      } catch (err) {
        report.failed.push({ file: rel, error: err.message });
      }
    }
  }

  if (!args.dryRun) await saveState(stateFile, state);
  console.log(`\nPage import report (${cfg.name}):`);
  console.log(`  created: ${report.created} · skipped: ${report.skipped} · failed: ${report.failed.length}`);
  for (const f of report.failed) console.log(`  FAILED ${f.file}: ${f.error}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
