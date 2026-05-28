const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { validateArtifacts, scanSecrets } = require("../workflow-artifact-gate/validator.cjs");
const { resolveArtifactDir } = require("../workflow-artifact-gate/artifact-locator.cjs");
const { detectCommandStage, detectPromptStage } = require("../workflow-artifact-gate/stage-detector.cjs");

const FIXTURES = path.join(__dirname, "fixtures", "workflow-artifacts");
const HOOK = path.resolve(__dirname, "..", "workflow-artifact-gate.cjs");

function fixture(name) {
  return path.join(FIXTURES, name);
}

function runHook(payload, cwd) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    cwd,
  });
}

function makeTempProject(artifactDir, config = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ck-artifacts-"));
  fs.mkdirSync(path.join(dir, ".claude"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, ".claude", ".ck.json"),
    JSON.stringify({
      hooks: { "workflow-artifact-gate": true },
      workflowArtifactGate: { enabled: true, ...config },
    })
  );
  fs.writeFileSync(
    path.join(dir, ".claude", "workflow-artifacts.json"),
    JSON.stringify({
      artifactDir,
      skill: "ck:cook",
      mode: "auto",
      updatedAt: new Date().toISOString(),
    })
  );
  return dir;
}

function copyFixtureToTemp(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ck-artifact-fixture-"));
  fs.cpSync(fixture(name), dir, { recursive: true });
  return dir;
}

test("valid low-risk artifacts pass hard validation", () => {
  const result = validateArtifacts({ artifactDir: fixture("valid-low-risk"), stage: "push" });
  assert.equal(result.status, "pass");
});

test("valid high-risk auto passes after human approval", () => {
  const result = validateArtifacts({ artifactDir: fixture("valid-high-risk-approved"), stage: "push" });
  assert.equal(result.status, "pass");
});

test("high-risk auto blocks even when autoStopRequired is false", () => {
  const dir = copyFixtureToTemp("valid-high-risk-approved");
  fs.writeFileSync(
    path.join(dir, "risk-gate.json"),
    JSON.stringify({
      highRisk: true,
      reasons: ["production config touched"],
      autoStopRequired: false,
      humanApproved: false,
      largeDiff: false,
    })
  );
  const result = validateArtifacts({ artifactDir: dir, stage: "push" });
  assert.equal(result.status, "block");
  assert(result.errors.some((issue) => issue.type === "high-risk-auto-stop"));
});

test("unknown mode blocks inconsistent high-risk artifacts", () => {
  const dir = copyFixtureToTemp("valid-high-risk-approved");
  const context = JSON.parse(fs.readFileSync(path.join(dir, "context-snippets.json"), "utf8"));
  context.mode = "automated";
  fs.writeFileSync(path.join(dir, "context-snippets.json"), JSON.stringify(context));
  fs.writeFileSync(
    path.join(dir, "risk-gate.json"),
    JSON.stringify({
      highRisk: true,
      reasons: ["deploy touched"],
      autoStopRequired: false,
      humanApproved: false,
      largeDiff: false,
    })
  );
  const result = validateArtifacts({ artifactDir: dir, stage: "push" });
  assert.equal(result.status, "block");
  assert(result.errors.some((issue) => issue.file === "context-snippets.json" && issue.field === "mode"));
  assert(result.errors.some((issue) => issue.file === "risk-gate.json" && issue.field === "autoStopRequired"));
});

test("high-risk auto blocks when risk gate is missing", () => {
  const result = validateArtifacts({ artifactDir: fixture("missing-risk-gate-auto"), stage: "push" });
  assert.equal(result.status, "block");
  assert(result.errors.some((issue) => issue.type === "missing-risk-gate-auto"));
});

test("blocked review blocks validation", () => {
  const result = validateArtifacts({ artifactDir: fixture("blocked-review"), stage: "finalize" });
  assert.equal(result.status, "block");
  assert(result.errors.some((issue) => issue.type === "blocked-review"));
});

test("hard stage blocks broken or unknown contract status", () => {
  for (const [contractStatus, errorType] of [
    ["BROKEN", "broken-contract-status"],
    ["UNKNOWN", "hard-stage-known-contract"],
  ]) {
    const dir = copyFixtureToTemp("valid-low-risk");
    const review = JSON.parse(fs.readFileSync(path.join(dir, "review-decision.json"), "utf8"));
    review.contractStatus = contractStatus;
    fs.writeFileSync(path.join(dir, "review-decision.json"), JSON.stringify(review));

    const result = validateArtifacts({ artifactDir: dir, stage: "push" });
    assert.equal(result.status, "block");
    assert(result.errors.some((issue) => issue.type === errorType));
  }
});

test("hard stage blocks unverified adversarial proof", () => {
  const dir = copyFixtureToTemp("valid-low-risk");
  const adversarial = JSON.parse(fs.readFileSync(path.join(dir, "adversarial-validation.json"), "utf8"));
  adversarial.unverifiedClaims = ["risk boundary claim has not been proven"];
  adversarial.missingProof = ["regression command output missing"];
  fs.writeFileSync(path.join(dir, "adversarial-validation.json"), JSON.stringify(adversarial));

  const result = validateArtifacts({ artifactDir: dir, stage: "push" });
  assert.equal(result.status, "block");
  assert(result.errors.some((issue) => issue.type === "hard-stage-unverified-claims"));
  assert(result.errors.some((issue) => issue.type === "hard-stage-missing-proof"));
});

test("hard stage blocks verification with only skipped commands", () => {
  const dir = copyFixtureToTemp("valid-low-risk");
  const verification = JSON.parse(fs.readFileSync(path.join(dir, "verification.json"), "utf8"));
  verification.commands = verification.commands.map((command) => ({
    ...command,
    status: "skipped",
    summary: "skipped during repro",
  }));
  fs.writeFileSync(path.join(dir, "verification.json"), JSON.stringify(verification));

  const result = validateArtifacts({ artifactDir: dir, stage: "push" });
  assert.equal(result.status, "block");
  assert(result.errors.some((issue) => issue.type === "hard-stage-needs-passing-verification"));
});

test("soft stage warns on entirely missing artifact directory", () => {
  const result = validateArtifacts({ artifactDir: path.join(FIXTURES, "does-not-exist"), stage: "finalize" });
  assert.equal(result.status, "warn");
  assert(result.warnings.some((issue) => issue.type === "missing-dir"));
});

test("malformed JSON blocks validation", () => {
  const result = validateArtifacts({ artifactDir: fixture("malformed-json"), stage: "finalize" });
  assert.equal(result.status, "block");
  assert(result.errors.some((issue) => issue.type === "malformed-json"));
});

test("secret-like artifact content is rejected without value output", () => {
  const result = validateArtifacts({ artifactDir: fixture("secret-leak"), stage: "push" });
  assert.equal(result.status, "block");
  const issue = result.errors.find((item) => item.type === "secret-like-content");
  assert(issue);
  assert.equal(issue.field, "commands[0].summary");
  assert(!JSON.stringify(issue).includes("sk-thisIsASecretTokenValue"));
});

test("secret scanner ignores redacted values", () => {
  assert.deepEqual(scanSecrets({ summary: "Authorization: Bearer *** REDACTED ***" }), []);
});

test("artifact locator resolves pointer before fallback", () => {
  const cwd = makeTempProject(fixture("pointer-resolution"));
  const result = resolveArtifactDir({ cwd });
  assert.equal(result.source, "pointer");
  assert.equal(result.artifactDir, fixture("pointer-resolution"));
});

test("stage detector maps prompts and bash commands", () => {
  assert.equal(detectPromptStage("please finalize this work"), "finalize");
  assert.equal(detectPromptStage("do not push yet"), null);
  assert.equal(detectCommandStage("git push origin HEAD"), "push");
  assert.equal(detectCommandStage("git -C /repo push origin HEAD"), "push");
  assert.equal(detectCommandStage("gh pr create --fill"), "pr");
  assert.equal(detectCommandStage("gh pr merge 123 --squash"), "pr");
  assert.equal(detectCommandStage("gh release create v1.2.3"), "ship");
  assert.equal(detectCommandStage("wrangler pages deploy ./dist"), "deploy");
  assert.equal(detectCommandStage("wrangler deploy"), "deploy");
});

test("hook exits open when config disables gate", () => {
  const cwd = makeTempProject(fixture("blocked-review"), { enabled: false });
  const run = runHook(
    {
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command: "git push origin HEAD" },
      cwd,
    },
    cwd
  );
  assert.equal(run.status, 0);
  assert.equal(run.stdout.trim(), "");
});

test("hook hard-blocks git push with blocked artifacts", () => {
  const cwd = makeTempProject(fixture("blocked-review"));
  const run = runHook(
    {
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command: "git push origin HEAD" },
      cwd,
    },
    cwd
  );
  assert.equal(run.status, 2);
  assert.match(run.stdout, /blocked-review/);
});

test("hook warns for finalize with missing artifacts", () => {
  const cwd = makeTempProject(path.join(FIXTURES, "does-not-exist"));
  const run = runHook(
    {
      hook_event_name: "UserPromptSubmit",
      prompt: "finalize this implementation",
      cwd,
    },
    cwd
  );
  assert.equal(run.status, 0);
  assert.match(run.stdout, /missing-dir/);
});
