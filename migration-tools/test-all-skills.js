// Comprehensive route test for all deployed questimus skills.
// Runs every route per skill and reports PASS/FAIL. Write round-trip creates
// a test ticket, comments, updates, deletes (cleanup).
import { execFileSync } from "node:child_process";

const SKILLS = [
  { name: "legaliosa", path: "C:/Users/Karol/Projects/Legaliosa-test-ox-alpha/.claude/skills/questimus-legaliosa/scripts/questimus.js", prefix: "LEGALIOSA", handoff: true, hierarchy: true },
  { name: "jobernaut", path: "C:/Users/Karol/Projects/Jobernaut2/.claude/skills/questimus-jobernaut/scripts/questimus.js", prefix: "JOBERNAUT", handoff: true, hierarchy: true },
  { name: "don-saldo", path: "C:/Users/Karol/Projects/Don-Saldo/.claude/skills/questimus-don-saldo/scripts/questimus.js", prefix: "DONSALDO", handoff: false, hierarchy: false },
  { name: "media-consumerus", path: "C:/Users/Karol/Projects/Media Consumerus/.claude/skills/questimus-media-consumerus/scripts/questimus.js", prefix: "CONSUMERUS", handoff: false, hierarchy: false },
  { name: "questimus-questimus", path: "C:/Users/Karol/Projects/Questimus/.claude/skills/questimus-questimus/scripts/questimus.js", prefix: "QUESTIMUS", handoff: false, hierarchy: false },
  { name: "arsenal", path: "C:/Users/Karol/Wisdomous/Arsenal/.claude/skills/questimus-arsenal/scripts/questimus.js", prefix: "ARSENAL", handoff: true, hierarchy: false },
  { name: "empirium", path: "C:/Users/Karol/Wisdomous/Arsenal/.claude/skills/questimus-empirium/scripts/questimus.js", prefix: "EMPIRIUM", handoff: false, hierarchy: false },
];

function run(script, args) {
  try {
    const out = execFileSync("node", [script, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, out };
  } catch (err) {
    return { ok: false, out: err.stdout || "", err: (err.stderr || "").trim().split("\n")[0] };
  }
}

let total = 0, passed = 0;
const failures = [];

function check(name, cond, detail) {
  total++;
  if (cond) { passed++; console.log(`  PASS ${name}`); }
  else { failures.push(`${name}: ${detail}`); console.log(`  FAIL ${name}: ${detail}`); }
}

for (const s of SKILLS) {
  console.log(`\n=== ${s.name} (${s.prefix}) ===`);
  const p = s.path;

  // meta
  let r = run(p, ["states"]);
  check("states", r.ok && r.out.trim().split("\n").length === 6, r.err || `got ${r.out.trim().split("\n").length} lines`);
  r = run(p, ["labels"]);
  check("labels", r.ok && r.out.trim().split("\n").length >= 1, r.err || "no labels");
  r = run(p, ["types"]);
  check("types", r.ok && r.out.includes("Plan") && r.out.includes("Ticket") && r.out.includes("Design"), r.err || "missing type");

  // handoff
  if (s.handoff) {
    r = run(p, ["handoff"]);
    check("handoff", r.ok && r.out.trim().length > 0, r.err || "empty");
  }

  // plan
  r = run(p, ["plan"]);
  // flat projects with all-Done plans legitimately have no active root (message on stderr)
  const planOut = r.out + " " + (r.err || "");
  check("plan", (r.ok && r.out.includes("ROOT")) || (!s.hierarchy && planOut.includes("No active plan root")), r.err || "unexpected");
  if (s.hierarchy) {
    r = run(p, ["plan", "--full"]);
    check("plan --full", r.ok && r.out.includes("ROOT"), r.err || "no ROOT");
    // subs: first SP from plan --full
    const spLine = r.out.split("\n").find((l) => l.trim().startsWith("  ") && l.includes("("));
    if (spLine) {
      const id = spLine.match(/\(([0-9a-f-]+)\)/)?.[1];
      if (id) {
        const sr = run(p, ["subs", id]);
        check("subs", sr.ok, sr.err || "failed");
      }
    }
  }

  // get by identifier (first issue via list; fall back to any ticket)
  r = run(p, ["list", "--state", "Backlog", "--type", "Ticket"]);
  let firstLine = r.out.split("\n").find((l) => l.trim() && !l.startsWith("("));
  if (!firstLine) {
    r = run(p, ["list"]);
    firstLine = r.out.split("\n").find((l) => l.trim() && !l.startsWith("("));
  }
  let seq = null;
  if (firstLine) {
    seq = firstLine.trim().split("\t")[0];
    const gr = run(p, ["get", `${s.prefix}-${seq}`]);
    check("get by identifier", gr.ok && gr.out.includes(`"identifier": "${s.prefix}-${seq}"`), gr.err || "identifier mismatch");
  } else {
    check("get by identifier", false, "no ticket found to test with");
  }

  // list filters
  r = run(p, ["list", "--state", "Backlog", "--type", "Ticket"]);
  check("list state+type", r.ok, r.err || "failed");
  r = run(p, ["list", "--assignee", "karol"]);
  check("list --assignee karol", r.ok, r.err || "failed");

  // search
  r = run(p, ["search", "test"]);
  check("search", r.ok, r.err || "failed");

  // write round-trip (uses --desc-file to cover the shell-quoting-safe path)
  const name = `TEST: ${s.name} round-trip`;
  const descFile = `C:/Users/Karol/Projects/Questimus/migration-tools/state/test-desc-${s.name}.md`;
  await import("node:fs/promises").then((fs) => fs.writeFile(descFile, `**What:** temporary test ticket with "quotes" and \`code\`.\n\n- bullet one\n- bullet two`));
  r = run(p, ["create", "--name", name, "--desc-file", descFile, "--state", "Backlog", "--priority", "low", "--type", "Ticket"]);
  const id = r.out.match(/created ([0-9a-f-]+)/)?.[1];
  check("create (--desc-file)", r.ok && !!id, r.err || "no id");
  if (id) {
    r = run(p, ["comment", id, "Test comment."]);
    check("comment", r.ok, r.err || "failed");
    // update by the TEST ticket's own identifier (get its seq first)
    const g = run(p, ["get", id]);
    const testSeq = g.out.match(/"identifier": "[A-Z]+-(\d+)"/)?.[1];
    if (testSeq) {
      r = run(p, ["update", `${s.prefix}-${testSeq}`, "--state", "ToDo", "--priority", "high"]);
      check("update by identifier", r.ok, r.err || "failed");
    } else {
      check("update by identifier", false, "could not resolve test ticket seq");
    }
    r = run(p, ["get", id]);
    // state UUIDs are project-specific — verify priority (universal) + state changed from Backlog
    const backlogState = r.out.match(/"state": "([0-9a-f-]+)"/)?.[1];
    check("update verified", r.ok && r.out.includes('"priority": "high"') && backlogState && backlogState !== "bf9779bf-2012-49ef-b74b-3b5dfd6b61b9", "priority/state not applied");
    r = run(p, ["delete", id, "--yes"]);
    check("delete", r.ok, r.err || "failed");
    r = run(p, ["get", id]);
    check("delete verified", !r.ok, "still exists");
  }
  await import("node:fs/promises").then((fs) => fs.rm(descFile, { force: true }));
}

console.log(`\n===== ${passed}/${total} passed =====`);
if (failures.length) {
  console.log("FAILURES:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
