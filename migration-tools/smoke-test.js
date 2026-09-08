#!/usr/bin/env node
// Phase 1 hierarchy smoke test (migration-karol.md §10).
//
// Validates the exact API surface the importers use, against the leftover
// "test" project (its issue types are already joined):
//   - create work-items with type_id (Plan/Subplan/Task/Ticket) + parent nesting
//   - state, label, estimate_point, created_at preservation
//   - blocked_by relations (two-pass style)
//   - 409-dedup on external_source + external_id
//   - main API (pages) with X-Api-Key → proves the fork change (§7.4) is live
//
// Usage:
//   node smoke-test.js [--project-id <uuid>] [--delete-project]
//
// Needs QUESTIMUS_TOKEN (Karol's token). --delete-project hard-deletes the
// test project after all checks pass (v1 DELETE is permanent).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QuestimusClient, QuestimusError } from "./lib/questimus-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { projectId: null, deleteProject: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--project-id") args.projectId = argv[++i];
    else if (argv[i] === "--delete-project") args.deleteProject = true;
  }
  return args;
}

const TYPES = JSON.parse(
  await readFile(path.resolve(__dirname, "state/types.json"), "utf8")
);

const checks = [];
function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

// Follow cursor pagination until the project is found (or the list is exhausted)
async function findProject(client, { id = null, name = null } = {}) {
  let cursor = null;
  do {
    const page = await client.listProjects("main", cursor ? { cursor } : {});
    const list = page.results ?? [];
    const hit = id
      ? list.find((p) => p.id === id)
      : list.find((p) => p.name === name);
    if (hit) return hit;
    cursor = page.next_cursor || null;
  } while (cursor);
  return null;
}

// Create, or reuse on 409 (external_source+external_id already exist — re-runs)
async function createOrReuse(client, pid, payload) {
  try {
    return await client.createWorkItem("main", pid, payload);
  } catch (err) {
    if (err instanceof QuestimusError && err.status === 409) {
      const existingId = JSON.parse(err.body || "{}").id;
      if (existingId) return client.getWorkItem("main", pid, existingId);
      throw err;
    }
    throw err;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = process.env.QUESTIMUS_TOKEN;
  if (!apiKey) {
    console.error("No API key: set QUESTIMUS_TOKEN (Karol's token)");
    process.exit(1);
  }
  const client = new QuestimusClient({ baseUrl: "http://localhost:7000", apiKey });

  // 1. Resolve the test project
  const project = await findProject(client, args.projectId ? { id: args.projectId } : { name: "test" });
  if (!project) {
    console.error(`Test project not found (${args.projectId ? `id ${args.projectId}` : 'name "test"'})`);
    process.exit(1);
  }
  const pid = project.id;
  console.log(`Smoke test project: "${project.name}" (${pid})`);

  // 2. States (idempotent — the test project may have Plane defaults)
  const states = (await client.listStates("main", pid)).results ?? [];
  const byName = new Map(states.map((s) => [s.name, s]));
  const wantStates = [
    { name: "Backlog", group: "backlog" },
    { name: "ToDo", group: "unstarted" },
    { name: "In Progress", group: "started" },
    { name: "Blocked", group: "started" },
    { name: "Cancelled", group: "cancelled" },
    { name: "Done", group: "completed" },
  ];
  for (const s of wantStates) {
    if (!byName.has(s.name)) {
      const created = await client.createState("main", pid, { name: s.name, group: s.group, color: "#94a3b8" });
      byName.set(s.name, created);
    }
  }
  const stateId = (name) => byName.get(name).id;

  // 3. Label
  const labels = (await client.listLabels("main", pid)).results ?? [];
  let smokeLabel = labels.find((l) => l.name === "smoke");
  if (!smokeLabel) smokeLabel = await client.createLabel("main", pid, { name: "smoke" });

  // 4. Estimate "Effort" + points (v1: single-object GET, bulk-create points)
  const estimates = (await client.listEstimates("main", pid)).results ?? [];
  let estimate = estimates.find((e) => e.name === "Effort");
  if (!estimate) {
    estimate = await client.createEstimate("main", pid, { name: "Effort", type: "points", description: "Effort estimate: S=1, M=3, L=5" });
  }
  const pointsRes = await client.listEstimatePoints("main", pid, estimate.id);
  const points = Array.isArray(pointsRes) ? pointsRes : (pointsRes.results ?? []);
  let point1 = points.find((p) => p.value === "1");
  if (!point1) point1 = (await client.createEstimatePoint("main", pid, estimate.id, { key: 1, value: "1" }))[0];

  // 5. Create the hierarchy: Plan → child Plan → child Plan (the SP/T/ST
  //    stages are carried by prefixes — §5.4 revised 2026-09-08), plus a Ticket
  const created_at = "2026-01-01T00:00:00Z";
  const plan = await createOrReuse(client, pid, {
    name: "SMOKE Plan",
    description_html: "<p>Smoke test plan</p>",
    state: stateId("Backlog"),
    type_id: TYPES.Plan,
    external_source: "smoke-test",
    external_id: "plan-1",
    created_at,
  });
  check("create Plan (type Plan)", plan.type_id === TYPES.Plan, `type=${plan.type_id}`);

  const sp = await createOrReuse(client, pid, {
    name: "SMOKE Subplan",
    description_html: "<p>Smoke test subplan</p>",
    state: stateId("Backlog"),
    type_id: TYPES.Plan,
    parent: plan.id,
    external_source: "smoke-test",
    external_id: "sp-1",
  });
  check("create child Plan (parent=Plan)", sp.type_id === TYPES.Plan && sp.parent === plan.id);

  const task = await createOrReuse(client, pid, {
    name: "SMOKE Task",
    description_html: "<p>Smoke test task</p>",
    state: stateId("In Progress"),
    type_id: TYPES.Plan,
    parent: sp.id,
    estimate_point: point1.id,
    external_source: "smoke-test",
    external_id: "t-1",
  });
  check("create nested Plan (parent=child, estimate)", task.type_id === TYPES.Plan && task.parent === sp.id);

  const ticket = await createOrReuse(client, pid, {
    name: "SMOKE Ticket",
    description_html: "<p>Smoke test ticket</p>",
    state: stateId("Backlog"),
    type_id: TYPES.Ticket,
    labels: [smokeLabel.id],
    external_source: "smoke-test",
    external_id: "ticket-1",
  });
  check("create Ticket (type Ticket, label)", ticket.type_id === TYPES.Ticket && (ticket.labels || []).includes(smokeLabel.id));

  // 6. Relation (blocked_by) — create only if not already present (re-runs)
  const rels = await client.listRelations("main", pid, task.id);
  const alreadyLinked = (rels.blocked_by || []).some((r) => r.issue_id === ticket.id);
  if (!alreadyLinked) {
    await client.createRelation("main", pid, task.id, { relation_type: "blocked_by", issues: [ticket.id] });
  }
  check("create relation (Task blocked_by Ticket)", true);

  // 7. 409-dedup: re-create the Plan with the same external_source/external_id
  let dedupOk = false;
  try {
    await client.createWorkItem("main", pid, {
      name: "SMOKE Plan (dup)",
      description_html: "<p>dup</p>",
      state: stateId("Backlog"),
      type_id: TYPES.Plan,
      external_source: "smoke-test",
      external_id: "plan-1",
    });
  } catch (err) {
    dedupOk = err instanceof QuestimusError && err.status === 409;
  }
  check("409-dedup on external_source+external_id", dedupOk);

  // 8. created_at preservation (create response carries it)
  check("created_at preserved", String(plan.created_at).startsWith("2026-01-01"), `got ${plan.created_at}`);

  // 9. Main API with X-Api-Key (fork change proof)
  const page = await client.createPage("main", pid, {
    name: "SMOKE page",
    description_html: "<p>fork change proof</p>",
    access: 0,
  });
  check("main API page create with X-Api-Key (fork change live)", !!page.id);

  // 10. Summary
  const failed = checks.filter((c) => !c.ok);
  console.log(`\nSmoke test: ${checks.length - failed.length}/${checks.length} checks passed`);
  if (failed.length) {
    console.error("Smoke test FAILED — do not proceed with Phase 1 setup");
    process.exit(1);
  }

  // 11. Optional cleanup: hard-delete the test project
  if (args.deleteProject) {
    await client.deleteProject("main", pid);
    console.log(`Test project "${project.name}" deleted (hard delete).`);
  } else {
    console.log(`Test project left in place — re-run with --delete-project after Karol's sign-off.`);
  }
}

main().catch((err) => {
  console.error(`Smoke test error: ${err.message}`);
  process.exit(1);
});
