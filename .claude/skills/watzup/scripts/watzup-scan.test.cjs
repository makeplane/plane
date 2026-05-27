"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { buildPayload, parseArgs, readPlan, renderText } = require("./watzup-scan.cjs");

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `git ${args.join(" ")} failed\n${result.stderr}`);
  return (result.stdout || "").trim();
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function commitAll(repo, message) {
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", message]);
}

function createFixtureRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "watzup-scan-"));
  const repo = path.join(root, "repo");
  const remote = path.join(root, "remote.git");
  fs.mkdirSync(repo);
  git(repo, ["init"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  git(repo, ["config", "user.name", "Test User"]);
  git(repo, ["checkout", "-b", "main"]);
  writeFile(path.join(repo, "README.md"), "# fixture\n");
  commitAll(repo, "initial commit");

  git(root, ["init", "--bare", remote]);
  git(repo, ["remote", "add", "origin", remote]);
  git(repo, ["push", "-u", "origin", "main"]);

  git(repo, ["checkout", "-b", "feature/local"]);
  writeFile(
    path.join(repo, "plans", "260101-feature", "plan.md"),
    [
      "---",
      'title: "Fixture Feature"',
      "status: pending",
      "---",
      "",
      "# Fixture Feature",
      "",
      "SECRET_BODY_SHOULD_NOT_APPEAR",
      "",
      "| Phase | Name | Status |",
      "|-------|------|--------|",
      "| 1 | [Build](./phase-01-build.md) | Pending |",
    ].join("\n")
  );
  commitAll(repo, "feat: add unfinished plan");

  git(repo, ["checkout", "-b", "remote-work", "main"]);
  writeFile(path.join(repo, "remote.txt"), "remote branch\n");
  commitAll(repo, "feat: remote branch work");
  git(repo, ["push", "origin", "remote-work"]);
  git(repo, ["checkout", "feature/local"]);
  git(repo, ["fetch", "origin", "remote-work"]);

  const worktreePath = path.join(root, "worktree");
  git(repo, ["worktree", "add", "-b", "worktree-branch", worktreePath, "main"]);
  writeFile(path.join(worktreePath, "worktree.txt"), "worktree branch\n");
  commitAll(worktreePath, "feat: worktree branch work");

  return { root, repo, worktreePath };
}

test("parseArgs keeps fetch opt-in", () => {
  assert.equal(parseArgs(["--json"]).fetch, false);
  assert.equal(parseArgs(["--json", "--fetch"]).fetch, true);
});

test("parseArgs rejects invalid numeric limits", () => {
  assert.throws(() => parseArgs(["--max-branches", "nope"]), /positive integer/);
  assert.throws(() => parseArgs(["--plan-limit", "-1"]), /positive integer/);
  assert.throws(() => parseArgs(["--max-plan-refs"]), /requires a value/);
  assert.equal(parseArgs(["--max-plan-refs", "2"]).maxPlanRefs, 2);
});

test("parseArgs rejects missing since values", () => {
  assert.throws(() => parseArgs(["--since"]), /--since requires a value/);
  assert.throws(() => parseArgs(["--since", "--json"]), /--since requires a value/);
  assert.equal(parseArgs(["--since", "14 days ago"]).since, "14 days ago");
});

test("SKILL.md uses installed runtime scanner path first", () => {
  const skill = fs.readFileSync(path.join(__dirname, "..", "SKILL.md"), "utf8");
  assert.match(skill, /node \.claude\/skills\/watzup\/scripts\/watzup-scan\.cjs --json/);
});

test("readPlan marks pending phase plans as unfinished", () => {
  const plan = readPlan(
    [
      "---",
      'title: "Pending Plan"',
      "status: completed",
      "---",
      "| Phase | Name | Status |",
      "|-------|------|--------|",
      "| 1 | Build | Pending |",
    ].join("\n"),
    "plans/test/plan.md",
    { type: "test" }
  );

  assert.equal(plan.title, "Pending Plan");
  assert.equal(plan.unfinished, true);
});

test("readPlan marks pending phase plans as unfinished when status is not the final column", () => {
  const plan = readPlan(
    [
      "---",
      'title: "Effort Table"',
      "status: completed",
      "---",
      "| Phase | Name | Status | Effort |",
      "|-------|------|--------|--------|",
      "| 1 | Build | Pending | 1h |",
    ].join("\n"),
    "plans/test/plan.md",
    { type: "test" }
  );

  assert.equal(plan.title, "Effort Table");
  assert.equal(plan.unfinished, true);
});

test("readPlan checks the status column before other table cells", () => {
  const plan = readPlan(
    [
      "---",
      'title: "Completed Plan"',
      "status: completed",
      "---",
      "| Phase | Name | Status | Notes |",
      "|-------|------|--------|-------|",
      "| 1 | Build | Completed | Pending |",
    ].join("\n"),
    "plans/test/plan.md",
    { type: "test" }
  );

  assert.equal(plan.title, "Completed Plan");
  assert.equal(plan.unfinished, false);
});

test("buildPayload scans remote refs, worktrees, and unfinished plans without fetch by default", () => {
  const fixture = createFixtureRepo();
  try {
    const payload = buildPayload(
      { json: true, fetch: false, since: null, maxBranches: 20, commitsPerBranch: 2, planLimit: 10 },
      fixture.repo
    );

    assert.equal(payload.options.fetched, false);
    assert.ok(payload.refs.remote >= 2, "remote refs should be included");
    assert.ok(payload.branches.some((branch) => branch.name === "origin/remote-work"));
    const expectedWorktree = fs.realpathSync.native(fixture.worktreePath);
    assert.ok(payload.worktrees.some((worktree) => fs.realpathSync.native(worktree.path) === expectedWorktree));
    assert.ok(payload.plans.unfinished.some((plan) => plan.title === "Fixture Feature"));
    assert.ok(payload.nextSteps.length > 0);
    assert.equal(JSON.stringify(payload).includes("SECRET_BODY_SHOULD_NOT_APPEAR"), false);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("failed fetch reports fetched false and keeps stale-ref warning context", () => {
  const fixture = createFixtureRepo();
  try {
    git(fixture.repo, ["remote", "set-url", "origin", path.join(fixture.root, "missing.git")]);
    const payload = buildPayload(
      { json: true, fetch: true, since: null, maxBranches: 20, commitsPerBranch: 1, planLimit: 10, maxPlanRefs: 20 },
      fixture.repo
    );

    assert.equal(payload.options.fetchRequested, true);
    assert.equal(payload.options.fetched, false);
    assert.ok(payload.warnings.some((warning) => warning.includes("fetch failed")));
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("redact paths rewrites warning strings too", () => {
  const fixture = createFixtureRepo();
  try {
    git(fixture.repo, ["remote", "set-url", "origin", path.join(fixture.root, "missing.git")]);
    const payload = buildPayload({ fetch: true, redactPaths: true, maxPlanRefs: 20 }, fixture.repo);
    const serialized = JSON.stringify(payload);

    assert.equal(serialized.includes(fixture.root), false);
    assert.ok(payload.warnings.some((warning) => warning.includes("<path:")));
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("tracked plan scan is bounded separately from remote ref discovery", () => {
  const fixture = createFixtureRepo();
  try {
    const payload = buildPayload(
      { json: true, fetch: false, since: null, maxBranches: 20, commitsPerBranch: 1, planLimit: 10, maxPlanRefs: 1 },
      fixture.repo
    );

    assert.ok(payload.refs.total > 1);
    assert.ok(payload.warnings.some((warning) => warning.includes("Tracked plan scan limited to 1 ranked refs")));
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("buildPayload applies default bounds for partial programmatic options", () => {
  const fixture = createFixtureRepo();
  try {
    const payload = buildPayload({ fetch: false }, fixture.repo);

    assert.equal(payload.options.maxPlanRefs, 80);
    assert.equal(payload.options.maxBranches, 12);
    assert.equal(payload.options.planLimit, 8);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("detached HEAD still produces a useful handoff payload and text report", () => {
  const fixture = createFixtureRepo();
  try {
    git(fixture.repo, ["checkout", "--detach", "HEAD"]);
    const payload = buildPayload(
      { json: true, fetch: false, since: null, maxBranches: 20, commitsPerBranch: 1, planLimit: 10 },
      fixture.repo
    );
    const text = renderText(payload);

    assert.equal(payload.current.detached, true);
    assert.match(text, /detached@/);
    assert.match(text, /In-flight plans:/);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});
