#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULTS = {
  maxBranches: 12,
  commitsPerBranch: 3,
  planLimit: 8,
  maxPlanRefs: 80,
};

function parsePositiveInt(value, name, fallback) {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${name} requires a value`);
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 500) {
    throw new Error(`${name} must be a positive integer between 1 and 500`);
  }
  return parsed;
}

function parseRequiredValue(argv, index, name) {
  const value = argv[index + 1];
  if (value === undefined || value === null || value === "" || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function parseArgs(argv) {
  const options = { json: false, fetch: false, since: null, ...DEFAULTS };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--fetch") options.fetch = true;
    else if (arg === "--since") {
      options.since = parseRequiredValue(argv, index, "--since");
      index += 1;
    } else if (arg === "--max-branches") options.maxBranches = parsePositiveInt(argv[++index], "--max-branches");
    else if (arg === "--commits-per-branch")
      options.commitsPerBranch = parsePositiveInt(argv[++index], "--commits-per-branch");
    else if (arg === "--plan-limit") options.planLimit = parsePositiveInt(argv[++index], "--plan-limit");
    else if (arg === "--max-plan-refs") options.maxPlanRefs = parsePositiveInt(argv[++index], "--max-plan-refs");
    else if (arg === "--redact-paths") options.redactPaths = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function printHelp() {
  console.log(`watzup-scan

Usage:
  node .claude/skills/watzup/scripts/watzup-scan.cjs [--json] [--fetch]

Options:
  --json                  Emit machine-readable evidence
  --fetch                 Run git fetch --all --prune before scanning
  --since <date>          Limit per-branch commit samples, e.g. "14 days ago"
  --max-branches <n>      Branches to summarize in handoff output
  --commits-per-branch <n> Commit subjects per summarized branch
  --plan-limit <n>        Unfinished plans to include in short output
  --max-plan-refs <n>     Ranked refs to inspect for tracked plan files
  --redact-paths          Replace absolute paths with stable labels`);
}

function runGit(args, cwd, { ok = [0] } = {}) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (!ok.includes(result.status)) {
    const message = (result.stderr || result.stdout || "").trim();
    throw new Error(`git ${args.join(" ")} failed${message ? `: ${message}` : ""}`);
  }
  return (result.stdout || "").trimEnd();
}

function tryGit(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  return {
    ok: result.status === 0,
    stdout: (result.stdout || "").trimEnd(),
    stderr: (result.stderr || "").trimEnd(),
    status: result.status,
  };
}

function getGitRoot(cwd) {
  return runGit(["rev-parse", "--show-toplevel"], cwd);
}

function parseWorktrees(output) {
  const records = [];
  let current = null;
  for (const line of output.split("\n")) {
    if (!line.trim()) continue;
    const [key, ...rest] = line.split(" ");
    const value = rest.join(" ");
    if (key === "worktree") {
      current = { path: value, head: null, branch: null, detached: false, bare: false };
      records.push(current);
    } else if (current && key === "HEAD") current.head = value;
    else if (current && key === "branch") current.branch = value.replace(/^refs\/heads\//, "");
    else if (current && key === "detached") current.detached = true;
    else if (current && key === "bare") current.bare = true;
  }
  return records;
}

function getWorktrees(root) {
  return parseWorktrees(runGit(["worktree", "list", "--porcelain"], root));
}

function getRefs(root) {
  const format = [
    "%(refname)",
    "%(refname:short)",
    "%(objectname:short)",
    "%(committerdate:iso8601)",
    "%(subject)",
  ].join("\t");
  const output = runGit(["for-each-ref", `--format=${format}`, "refs/heads", "refs/remotes"], root);
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [refname, shortName, commit, date, ...subjectParts] = line.split("\t");
      const isRemote = refname.startsWith("refs/remotes/");
      return {
        refname,
        name: shortName,
        commit,
        date,
        subject: subjectParts.join("\t"),
        type: isRemote ? "remote" : "local",
      };
    })
    .filter((ref) => !ref.refname.endsWith("/HEAD"));
}

function getCurrentState(root, worktrees) {
  const branch = tryGit(["branch", "--show-current"], root).stdout || null;
  const head = runGit(["rev-parse", "--short", "HEAD"], root);
  const status = tryGit(["status", "--short"], root).stdout;
  const currentWorktree = worktrees.find((record) => path.resolve(record.path) === path.resolve(root)) || null;
  return {
    root,
    branch,
    head,
    detached: !branch,
    dirty: status.length > 0,
    statusLines: status ? status.split("\n").slice(0, 20) : [],
    worktree: currentWorktree,
  };
}

function rankRefs(refs, state, worktrees) {
  const checkedOut = new Set(worktrees.map((record) => record.branch).filter(Boolean));
  return refs
    .map((ref) => {
      let rank = 0;
      if (state.branch && ref.name === state.branch) rank += 1000;
      if (checkedOut.has(ref.name)) rank += 500;
      if (ref.type === "local") rank += 100;
      const time = Date.parse(ref.date);
      return { ...ref, checkedOut: checkedOut.has(ref.name), rank, time: Number.isFinite(time) ? time : 0 };
    })
    .sort((a, b) => b.rank - a.rank || b.time - a.time || a.name.localeCompare(b.name));
}

function getBranchCommits(root, ref, options) {
  const args = ["log", ref.refname, `--max-count=${options.commitsPerBranch}`, "--pretty=format:%h%x09%s%x09%cr"];
  if (options.since) args.splice(2, 0, `--since=${options.since}`);
  const result = tryGit(args, root);
  if (!result.ok || !result.stdout) return [];
  return result.stdout.split("\n").map((line) => {
    const [shortHash, subject, relativeDate] = line.split("\t");
    return { shortHash, subject, relativeDate };
  });
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return {};
  const data = {};
  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;
    let value = field[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[field[1]] = value;
  }
  return data;
}

function normalizeStatus(value) {
  const status = String(value || "")
    .toLowerCase()
    .trim();
  if (["completed", "complete", "done"].includes(status)) return "completed";
  if (["cancelled", "canceled"].includes(status)) return "cancelled";
  if (status.includes("progress") || status === "active") return "in-progress";
  if (status.includes("review")) return "in-review";
  return status || "pending";
}

function extractTitle(content, planPath) {
  const frontmatter = parseFrontmatter(content);
  if (frontmatter.title) return frontmatter.title;
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return path.basename(path.dirname(planPath));
}

function parseTableCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function cleanTableCell(cell) {
  return cell.replace(/[*_`]/g, "").trim();
}

function isSeparatorCell(cell) {
  return /^:?-{3,}:?$/.test(cell.trim());
}

function isIncompleteStatusCell(cell) {
  return ["pending", "in-progress", "active", "todo"].includes(normalizeStatus(cleanTableCell(cell)));
}

function hasIncompletePhase(content) {
  let statusColumn = null;
  for (const line of content.split("\n")) {
    if (!/^\s*\|/.test(line)) {
      statusColumn = null;
      continue;
    }
    const cells = parseTableCells(line);
    if (cells.every(isSeparatorCell)) continue;

    const headerStatusColumn = cells.findIndex((cell) => cleanTableCell(cell).toLowerCase() === "status");
    if (headerStatusColumn !== -1) {
      statusColumn = headerStatusColumn;
      continue;
    }

    const candidates = statusColumn === null ? cells : [cells[statusColumn]];
    if (candidates.some((cell) => cell && isIncompleteStatusCell(cell))) return true;
  }
  return false;
}

function readPlan(content, planPath, source) {
  const frontmatter = parseFrontmatter(content);
  const status = normalizeStatus(frontmatter.status);
  const incompletePhase = hasIncompletePhase(content);
  const unfinished = !["completed", "cancelled"].includes(status) || incompletePhase;
  return {
    id: `${source.ref || source.worktree || "filesystem"}:${planPath}`,
    title: extractTitle(content, planPath),
    path: planPath,
    status,
    unfinished,
    source,
    hash: crypto.createHash("sha1").update(content).digest("hex").slice(0, 12),
  };
}

function findFilesystemPlanFiles(plansDir, warnings, depth = 0, results = []) {
  if (depth > 4 || !fs.existsSync(plansDir)) return results;
  let entries;
  try {
    entries = fs.readdirSync(plansDir, { withFileTypes: true });
  } catch (error) {
    warnings.push(`could not read plans directory ${plansDir}: ${error.message}`);
    return results;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || ["node_modules", "reports", "research", "templates"].includes(entry.name))
      continue;
    const fullPath = path.join(plansDir, entry.name);
    if (entry.isDirectory()) {
      const planFile = path.join(fullPath, "plan.md");
      if (fs.existsSync(planFile)) results.push(planFile);
      else findFilesystemPlanFiles(fullPath, warnings, depth + 1, results);
    }
  }
  return results;
}

function scanFilesystemPlans(worktrees, warnings) {
  const plans = [];
  for (const worktree of worktrees) {
    if (!worktree.path || !fs.existsSync(worktree.path)) continue;
    for (const planFile of findFilesystemPlanFiles(path.join(worktree.path, "plans"), warnings)) {
      try {
        const content = fs.readFileSync(planFile, "utf8");
        plans.push(
          readPlan(content, path.relative(worktree.path, planFile), {
            type: "filesystem",
            worktree: worktree.path,
            branch: worktree.branch || null,
          })
        );
      } catch (error) {
        warnings.push(`could not read plan ${planFile}: ${error.message}`);
      }
    }
  }
  return plans;
}

function scanTrackedPlans(root, refs) {
  const plans = [];
  for (const ref of refs) {
    const listed = tryGit(["ls-tree", "-r", "--name-only", ref.refname, "--", "plans"], root);
    if (!listed.ok || !listed.stdout) continue;
    const planPaths = listed.stdout.split("\n").filter((file) => file.endsWith("/plan.md"));
    for (const planPath of planPaths) {
      const shown = tryGit(["show", `${ref.refname}:${planPath}`], root);
      if (shown.ok && shown.stdout) {
        plans.push(readPlan(shown.stdout, planPath, { type: "git-ref", ref: ref.name, refType: ref.type }));
      }
    }
  }
  return plans;
}

function dedupePlans(plans) {
  const byKey = new Map();
  for (const plan of plans) {
    const key = `${plan.path}:${plan.hash}`;
    if (!byKey.has(key)) byKey.set(key, { ...plan, sources: [plan.source] });
    else byKey.get(key).sources.push(plan.source);
  }
  return [...byKey.values()];
}

function rankPlan(plan, current) {
  let score = 0;
  for (const source of plan.sources || [plan.source]) {
    if (source.worktree && path.resolve(source.worktree) === path.resolve(current.root)) score += 1000;
    if (current.branch && (source.branch === current.branch || source.ref === current.branch)) score += 500;
    if (source.type === "filesystem") score += 100;
    if (source.refType === "local") score += 50;
  }
  return score;
}

function sortPlans(plans, current) {
  return plans.sort((a, b) => rankPlan(b, current) - rankPlan(a, current) || a.title.localeCompare(b.title));
}

function buildNextSteps(payload) {
  const steps = [];
  if (payload.current.dirty) steps.push("Review or commit current worktree changes before handoff.");
  if (payload.current.detached)
    steps.push("Create or switch to a named branch before shipping work from this checkout.");
  const currentBranch = payload.branches.find((branch) => branch.name === payload.current.branch);
  if (currentBranch) steps.push(`Continue from current branch ${currentBranch.name} if this is the active feature.`);
  if (payload.plans.unfinished.length > 0) {
    steps.push(`Resume unfinished plan: ${payload.plans.unfinished[0].title}.`);
  }
  const activeRemote = payload.branches.find((branch) => branch.type === "remote");
  if (activeRemote)
    steps.push(`Check recent remote branch ${activeRemote.name} for related work before duplicating effort.`);
  if (steps.length === 0) steps.push("No obvious in-flight work found; start from the highest-priority user request.");
  return steps.slice(0, 5);
}

function buildPayload(options, cwd = process.cwd()) {
  options = { json: false, fetch: false, since: null, redactPaths: false, ...DEFAULTS, ...options };
  const root = getGitRoot(cwd);
  const warnings = [];
  let fetched = false;
  if (options.fetch) {
    const fetchResult = tryGit(["fetch", "--all", "--prune"], root);
    fetched = fetchResult.ok;
    if (!fetchResult.ok) warnings.push(`fetch failed: ${fetchResult.stderr || fetchResult.stdout}`);
  } else {
    warnings.push("Remote branches are scanned from local refs. Use --fetch to refresh first.");
  }

  const worktrees = getWorktrees(root);
  const current = getCurrentState(root, worktrees);
  const refs = rankRefs(getRefs(root), current, worktrees);
  const branches = refs.slice(0, options.maxBranches).map((ref) => ({
    name: ref.name,
    refname: ref.refname,
    type: ref.type,
    commit: ref.commit,
    date: ref.date,
    subject: ref.subject,
    checkedOut: ref.checkedOut,
    commits: getBranchCommits(root, ref, options),
  }));

  const planRefs = refs.slice(0, options.maxPlanRefs);
  if (refs.length > planRefs.length) {
    warnings.push(`Tracked plan scan limited to ${planRefs.length} ranked refs out of ${refs.length}.`);
  }
  const plans = sortPlans(
    dedupePlans([...scanFilesystemPlans(worktrees, warnings), ...scanTrackedPlans(root, planRefs)]),
    current
  );
  const unfinished = plans.filter((plan) => plan.unfinished).slice(0, options.planLimit);
  const completedRecent = plans.filter((plan) => !plan.unfinished).slice(0, options.planLimit);
  const payload = {
    generatedAt: new Date().toISOString(),
    options: {
      fetched,
      fetchRequested: options.fetch,
      remoteRefsDefault: true,
      maxBranches: options.maxBranches,
      commitsPerBranch: options.commitsPerBranch,
      planLimit: options.planLimit,
      maxPlanRefs: options.maxPlanRefs,
    },
    repo: { root },
    current,
    worktrees,
    refs: {
      total: refs.length,
      local: refs.filter((ref) => ref.type === "local").length,
      remote: refs.filter((ref) => ref.type === "remote").length,
    },
    branches,
    plans: { unfinished, completedRecent, total: plans.length },
    warnings,
  };
  payload.nextSteps = buildNextSteps(payload);
  if (options.redactPaths) redactPaths(payload);
  return payload;
}

function redactPaths(payload) {
  const labels = new Map();
  let count = 0;
  const labelFor = (value) => {
    if (!value) return value;
    if (String(value).startsWith("<path:")) return value;
    if (!labels.has(value)) {
      count += 1;
      labels.set(value, `<path:${count}:${path.basename(value)}>`);
    }
    return labels.get(value);
  };
  const redactText = (value) => {
    if (typeof value !== "string") return value;
    let redacted = value;
    for (const [actual, label] of labels.entries()) {
      redacted = redacted.split(actual).join(label);
    }
    return redacted.replace(/(?:\/[^\s:'"]+)+/g, (match) => labelFor(match));
  };
  payload.repo.root = labelFor(payload.repo.root);
  payload.current.root = labelFor(payload.current.root);
  if (payload.current.worktree?.path) payload.current.worktree.path = labelFor(payload.current.worktree.path);
  for (const worktree of payload.worktrees) worktree.path = labelFor(worktree.path);
  for (const plan of [...payload.plans.unfinished, ...payload.plans.completedRecent]) {
    plan.id = redactText(plan.id);
    for (const source of plan.sources || []) {
      if (source.worktree) source.worktree = labelFor(source.worktree);
    }
  }
  payload.warnings = payload.warnings.map(redactText);
}

function renderText(payload) {
  const branchLabel = payload.current.branch || `detached@${payload.current.head}`;
  const lines = [
    "Watzup handoff evidence",
    `Current: ${branchLabel} (${payload.current.dirty ? "dirty" : "clean"})`,
    `Refs: ${payload.refs.local} local, ${payload.refs.remote} remote; worktrees: ${payload.worktrees.length}`,
    "",
    "Recent work:",
  ];
  for (const branch of payload.branches.slice(0, 5)) {
    const marks = [branch.type];
    if (branch.checkedOut) marks.push("worktree");
    lines.push(`- ${branch.name} [${marks.join(", ")}] ${branch.commit} ${branch.subject || ""}`.trim());
  }
  lines.push("", "In-flight plans:");
  if (payload.plans.unfinished.length === 0) lines.push("- none found");
  for (const plan of payload.plans.unfinished.slice(0, 5)) {
    const source = plan.sources?.[0]?.ref || plan.sources?.[0]?.branch || plan.sources?.[0]?.type;
    lines.push(`- ${plan.title} (${plan.status}, ${source})`);
  }
  lines.push("", "Next steps:");
  payload.nextSteps.forEach((step, index) => lines.push(`${index + 1}. ${step}`));
  if (payload.warnings.length > 0) {
    lines.push("", "Warnings:");
    payload.warnings.forEach((warning) => lines.push(`- ${warning}`));
  }
  return lines.join("\n");
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }
    const payload = buildPayload(options);
    console.log(options.json ? JSON.stringify(payload, null, 2) : renderText(payload));
  } catch (error) {
    console.error(`watzup-scan failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  buildPayload,
  parseArgs,
  parseFrontmatter,
  readPlan,
  renderText,
};
