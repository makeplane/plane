"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { spawnSync, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const HOOK = path.resolve(__dirname, "..", "simplify-gate.cjs");

function makeRepo({ enableGate = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "simplify-gate-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, stdio: "ignore" });
  git("init", "--initial-branch=main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "Test");
  fs.writeFileSync(path.join(dir, "README.md"), "# repo\n");
  // Gate defaults to OFF (opt-in). Most tests exercise enabled-gate behavior,
  // so commit a .ck.json enabling it (committed so it doesn't pollute diff signals).
  // Tests that need default-off pass enableGate=false.
  if (enableGate) {
    fs.writeFileSync(
      path.join(dir, ".ck.json"),
      JSON.stringify({
        simplify: { gate: { enabled: true } },
      })
    );
  }
  git("add", ".");
  git("commit", "-m", "init");
  return dir;
}

function runHook(payload, env = {}) {
  return spawnSync("node", [HOOK], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function writeBigFile(dir, name, lines) {
  const body = Array.from({ length: lines }, (_, i) => `line ${i}`).join("\n") + "\n";
  fs.writeFileSync(path.join(dir, name), body);
}

function parseStdout(stdout) {
  const trimmed = (stdout || "").trim();
  if (!trimmed) return null;
  return JSON.parse(trimmed);
}

test("exits silently when prompt has no ship/commit verb", () => {
  const dir = makeRepo();
  writeBigFile(dir, "big.ts", 1000);
  const r = runHook({ cwd: dir, prompt: "add a new feature please" });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), "");
});

test("exits silently when verb present but diff is small", () => {
  const dir = makeRepo();
  fs.writeFileSync(path.join(dir, "small.ts"), "one\ntwo\n");
  const r = runHook({ cwd: dir, prompt: "ship this" });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), "");
});

test("hard-blocks ship verb when LOC threshold breached", () => {
  const dir = makeRepo();
  writeBigFile(dir, "big.ts", 600);
  const r = runHook({ cwd: dir, prompt: "ship it" });
  assert.strictEqual(r.status, 2);
  const out = parseStdout(r.stdout);
  assert.strictEqual(out.continue, false);
  assert.strictEqual(out.decision, "block");
  assert.match(out.reason, /Unsimplified diff/);
  assert.match(out.reason, /600 LOC/);
  assert.match(out.reason, /code-simplifier/);
});

test("hard-blocks merge/pr/deploy/publish too", () => {
  const dir = makeRepo();
  writeBigFile(dir, "big.ts", 600);
  for (const verb of ["merge", "pr", "deploy", "publish"]) {
    const r = runHook({ cwd: dir, prompt: `${verb} the change` });
    assert.strictEqual(r.status, 2, `${verb} should hard-block`);
  }
});

test("soft-warns commit/finalize/release verbs", () => {
  const dir = makeRepo();
  writeBigFile(dir, "big.ts", 600);
  for (const verb of ["commit", "finalize", "release"]) {
    const r = runHook({ cwd: dir, prompt: `${verb} the change` });
    assert.strictEqual(r.status, 0, `${verb} should soft-warn`);
    const out = parseStdout(r.stdout);
    assert.strictEqual(out.hookSpecificOutput.hookEventName, "UserPromptSubmit");
    assert.match(out.hookSpecificOutput.additionalContext, /Unsimplified diff/);
  }
});

test("blocks when fileCount threshold breached even with small per-file diff", () => {
  const dir = makeRepo();
  for (let i = 0; i < 10; i++) {
    writeBigFile(dir, `f${i}.ts`, 5);
  }
  const r = runHook({ cwd: dir, prompt: "ship it" });
  assert.strictEqual(r.status, 2);
  const out = parseStdout(r.stdout);
  assert.match(out.reason, /10 files/);
});

test("blocks when single file exceeds singleFileLoc threshold", () => {
  const dir = makeRepo();
  writeBigFile(dir, "huge.ts", 250);
  const r = runHook({ cwd: dir, prompt: "ship it" });
  assert.strictEqual(r.status, 2);
  const out = parseStdout(r.stdout);
  assert.match(out.reason, /single file \+250 LOC/);
});

test('ignores false-positive prompts with negation or "ship on"', () => {
  const dir = makeRepo();
  writeBigFile(dir, "big.ts", 600);
  const cases = [
    "Don't ship that yet",
    "What ports does the API ship on?",
    "Check the relationship between X and Y",
    "Update the merger function",
    "never ship a Friday hotfix",
  ];
  for (const prompt of cases) {
    const r = runHook({ cwd: dir, prompt });
    assert.strictEqual(r.status, 0, `prompt should not block: ${prompt}`);
    assert.strictEqual(r.stdout.trim(), "", `should be silent for: ${prompt}`);
  }
});

test("CK_SIMPLIFY_DISABLED=1 short-circuits regardless of signals", () => {
  const dir = makeRepo();
  writeBigFile(dir, "big.ts", 600);
  const r = runHook({ cwd: dir, prompt: "ship it" }, { CK_SIMPLIFY_DISABLED: "1" });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), "");
});

test("default config (no .ck.json) leaves gate OFF — exits silently even on big diff + ship verb", () => {
  const dir = makeRepo({ enableGate: false });
  writeBigFile(dir, "big.ts", 600);
  const r = runHook({ cwd: dir, prompt: "ship it" });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), "");
});

test("respects .ck.json simplify.gate.enabled=false", () => {
  const dir = makeRepo();
  writeBigFile(dir, "big.ts", 600);
  fs.writeFileSync(
    path.join(dir, ".ck.json"),
    JSON.stringify({
      simplify: { gate: { enabled: false } },
    })
  );
  const r = runHook({ cwd: dir, prompt: "ship it" });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), "");
});

test("honors custom thresholds from .ck.json", () => {
  const dir = makeRepo();
  writeBigFile(dir, "mid.ts", 100);
  fs.writeFileSync(
    path.join(dir, ".ck.json"),
    JSON.stringify({
      simplify: {
        threshold: { locDelta: 50, fileCount: 100, singleFileLoc: 10000 },
        gate: { enabled: true },
      },
    })
  );
  const r = runHook({ cwd: dir, prompt: "ship it" });
  assert.strictEqual(r.status, 2);
  const out = parseStdout(r.stdout);
  assert.match(out.reason, /\d+ LOC/);
});

test("honors custom verbs from .ck.json", () => {
  const dir = makeRepo();
  writeBigFile(dir, "big.ts", 600);
  fs.writeFileSync(
    path.join(dir, ".ck.json"),
    JSON.stringify({
      simplify: { gate: { enabled: true, hardVerbs: ["launch"], softVerbs: [] } },
    })
  );
  const blocked = runHook({ cwd: dir, prompt: "launch the rocket" });
  assert.strictEqual(blocked.status, 2);

  const ignored = runHook({ cwd: dir, prompt: "ship it" });
  assert.strictEqual(ignored.status, 0);
});

test("exits 0 when git diff fails (non-repo cwd)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "no-git-"));
  const r = runHook({ cwd: tmp, prompt: "ship it" });
  assert.strictEqual(r.status, 0);
});

test("exits 0 when payload omits prompt", () => {
  const dir = makeRepo();
  writeBigFile(dir, "big.ts", 600);
  const r = runHook({ cwd: dir });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), "");
});

test("exits 0 when payload is missing/invalid JSON on stdin", () => {
  const r = spawnSync("node", [HOOK], { input: "", encoding: "utf8" });
  assert.strictEqual(r.status, 0);
});
