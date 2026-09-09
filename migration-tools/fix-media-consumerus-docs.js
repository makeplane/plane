#!/usr/bin/env node
// One-off fix (2026-09-09, Phase 5 review): the Media Consumerus "Backlog" and
// "TODOS" doc tickets were full-document dumps duplicating the standalone
// issues. This script:
//   1. enriches each E-issue (E1..E10) with its detailed "### E<n>" section
//      body from BACKLOG.md (the issues only carried the summary-table row)
//   2. merges TODOS.md section 2 (language-filter original note) into TODOS-E2
//      (its resolution says "Original note kept below for record")
//   3. creates 3 deferred tickets for the deduped TODOS sections (4, 5, 6)
//   4. archives + deletes the "Backlog" and "TODOS" doc tickets
//
// Idempotent via state/media-consumerus-fix.json (enriched ids, created
// external ids, deleted page ids). Usage:
//   node fix-media-consumerus-docs.js [--dry-run]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QuestimusClient, QuestimusError } from "./lib/questimus-client.js";
import { mdToHtml } from "./lib/markdown.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");

const cfg = JSON.parse(await readFile(path.resolve(__dirname, "config/media-consumerus.json"), "utf8"));
const baseUrl = process.env.QUESTIMUS_URL || cfg.baseUrl;
const apiKey = process.env.QUESTIMUS_TOKEN || cfg.apiKey;
if (!apiKey && !dryRun) {
  console.error("No API key: set QUESTIMUS_TOKEN or config.apiKey (not needed for --dry-run)");
  process.exit(1);
}
const client = new QuestimusClient({ baseUrl, apiKey });

const stateFile = path.resolve(__dirname, cfg.stateFile);
const state = JSON.parse(await readFile(stateFile, "utf8"));
const fixStateFile = path.resolve(__dirname, "state/media-consumerus-fix.json");
let fixState = { enriched: [], created: [], deletedPages: [] };
try {
  fixState = JSON.parse(await readFile(fixStateFile, "utf8"));
} catch {}

const report = { enriched: 0, merged: 0, created: 0, deletedPages: 0, failed: [] };

// Resolve project + types + states + labels
let projectId = "dry-run";
let types = {};
let stateByName = new Map();
let labelByName = new Map();
if (!dryRun) {
  const projects = await client.listProjects(cfg.workspaceSlug);
  const project = (projects.results ?? projects).find((p) => p.name === cfg.projectName);
  if (!project) { console.error(`Project "${cfg.projectName}" not found`); process.exit(1); }
  projectId = project.id;
  types = JSON.parse(await readFile(path.resolve(__dirname, cfg.typesFile), "utf8"));
  const states = (await client.listStates(cfg.workspaceSlug, projectId)).results ?? [];
  for (const s of states) stateByName.set(s.name, s);
  const labels = (await client.listLabels(cfg.workspaceSlug, projectId)).results ?? [];
  for (const l of labels) labelByName.set(l.name, l);
}
const backlogStateId = stateByName.get("Backlog")?.id ?? "state:Backlog";
const deferredLabelId = labelByName.get("deferred")?.id ?? "label:deferred";

// ---- 1. Enrich E-issues with their detailed BACKLOG.md sections ----
const backlogRaw = await readFile(path.resolve(cfg.sourceDir, "BACKLOG.md"), "utf8");
const backlogSections = backlogRaw.split(/^###\s+/m).slice(1);
// state keys: "BACKLOG.md#E1" .. "BACKLOG.md#E10", "BACKLOG.md#~~E4~~" (strikethrough ids)
const eIssueBySectionId = new Map();
for (const [key, id] of Object.entries(state.issues)) {
  if (!key.startsWith("BACKLOG.md#")) continue;
  eIssueBySectionId.set(key.slice("BACKLOG.md#".length).replace(/~~/g, ""), id);
}
for (const sec of backlogSections) {
  const idM = sec.match(/^(?:~~)?([A-Za-z]+\d+)/);
  if (!idM) continue;
  const issueId = eIssueBySectionId.get(idM[1]);
  if (!issueId) continue;
  if (fixState.enriched.includes(issueId)) { report.enriched++; continue; }
  const sectionHtml = mdToHtml(sec.trim());
  if (dryRun) {
    console.log(`  [dry-run] would enrich ${idM[1]} (${issueId}) with its BACKLOG.md section`);
    report.enriched++;
    continue;
  }
  try {
    const issue = await client.getWorkItem(cfg.workspaceSlug, projectId, issueId);
    const updated = await client.updateWorkItem(cfg.workspaceSlug, projectId, issueId, {
      description_html: `${issue.description_html}\n\n---\n\n${sectionHtml}`,
    });
    fixState.enriched.push(issueId);
    report.enriched++;
    console.log(`  enriched E${idM[1]} (${updated.name})`);
  } catch (err) {
    report.failed.push({ file: `BACKLOG.md#${idM[1]}`, error: err.message });
  }
}

// ---- 2. Merge TODOS.md section 2 (language-filter original note) into TODOS-E2 ----
const todosRaw = await readFile(path.resolve(cfg.sourceDir, "TODOS.md"), "utf8");
const todosSections = todosRaw.split(/^##\s+/m).slice(1);
const todosE2Id = state.issues["TODOS.md#E2"];
if (todosE2Id && !fixState.enriched.includes(todosE2Id)) {
  const sec = todosSections[1]; // section 2 = the original note (resolved by section 1)
  const lines = sec.split(/\r?\n/);
  const head = lines[0].trim();
  const body = lines.slice(1).join("\n").trim();
  const noteHtml = mdToHtml(`**Original note (kept for record):**\n\n### ${head}\n\n${body}`);
  if (dryRun) {
    console.log(`  [dry-run] would merge TODOS.md section 2 into TODOS-E2 (${todosE2Id})`);
    report.merged++;
  } else {
    try {
      const issue = await client.getWorkItem(cfg.workspaceSlug, projectId, todosE2Id);
      await client.updateWorkItem(cfg.workspaceSlug, projectId, todosE2Id, {
        description_html: `${issue.description_html}\n\n---\n\n${noteHtml}`,
      });
      fixState.enriched.push(todosE2Id);
      report.merged++;
      console.log(`  merged original note into TODOS-E2 (${issue.name})`);
    } catch (err) {
      report.failed.push({ file: "TODOS.md#E2 (merge)", error: err.message });
    }
  }
}

// ---- 3. Create deferred tickets for the deduped TODOS sections (4, 5, 6) ----
const newDeferred = [
  { index: 3, externalId: "TODOS-E1-update-race" },
  { index: 4, externalId: "TODOS-E2-sync-catalog" },
  { index: 5, externalId: "TODOS-E2-retry" },
];
for (const nd of newDeferred) {
  if (fixState.created.includes(nd.externalId)) { report.created++; continue; }
  const sec = todosSections[nd.index];
  const lines = sec.split(/\r?\n/);
  const head = lines[0].trim();
  const body = lines.slice(1).join("\n").trim();
  const titleM = head.match(/[—–]\s*(.+)$/) || head.match(/\s-\s(.+)$/);
  const name = titleM ? titleM[1].trim() : head;
  if (dryRun) {
    console.log(`  [dry-run] would create "${name}" (Backlog, deferred)`);
    report.created++;
    continue;
  }
  try {
    const created = await client.createWorkItem(cfg.workspaceSlug, projectId, {
      name,
      description_html: mdToHtml(`**Source:** \`TODOS.md#${head.match(/^([A-Za-z]+\d+)/)?.[1]}\`\n\n${body}`),
      state: backlogStateId,
      priority: "medium",
      labels: [deferredLabelId],
      assignees: [cfg.assigneeId],
      type_id: types.Ticket,
      external_source: cfg.externalSource,
      external_id: nd.externalId,
    });
    fixState.created.push(nd.externalId);
    report.created++;
    console.log(`  created "${created.name}" (${nd.externalId})`);
  } catch (err) {
    if (err instanceof QuestimusError && err.status === 409) {
      fixState.created.push(nd.externalId);
      report.created++;
      console.log(`  ${nd.externalId} already exists (409) — recorded`);
    } else {
      report.failed.push({ file: nd.externalId, error: err.message });
    }
  }
}

// ---- 4. Delete the "Backlog" and "TODOS" doc ticket issues ----
// (the doc: state entries are work-item ids — the pages themselves were
// already archived + deleted in the pages→tickets transformation)
for (const [rel, issueId] of Object.entries(state.issues)) {
  if (!rel.startsWith("doc:")) continue;
  if (rel === "doc:design/DESIGN.md") continue; // kept — no duplication
  if (fixState.deletedPages.includes(issueId)) { report.deletedPages++; continue; }
  if (dryRun) {
    console.log(`  [dry-run] would delete doc ticket "${rel}" (${issueId})`);
    report.deletedPages++;
    continue;
  }
  try {
    await client.deleteWorkItem(cfg.workspaceSlug, projectId, issueId);
    fixState.deletedPages.push(issueId);
    report.deletedPages++;
    console.log(`  deleted doc ticket ${rel} (${issueId})`);
  } catch (err) {
    report.failed.push({ file: rel, error: err.message });
  }
}

if (!dryRun) {
  await mkdir(path.dirname(fixStateFile), { recursive: true });
  await writeFile(fixStateFile, JSON.stringify(fixState, null, 2));
}
console.log(`\nFix report (media-consumerus docs):`);
console.log(`  enriched: ${report.enriched} · merged: ${report.merged} · created: ${report.created} · pages deleted: ${report.deletedPages} · failed: ${report.failed.length}`);
for (const f of report.failed) console.log(`  FAILED ${f.file}: ${f.error}`);
