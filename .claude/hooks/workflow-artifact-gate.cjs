#!/usr/bin/env node
/**
 * Validates ck:fix/ck:cook review artifacts before finalize and external
 * ship-like actions. Hook mode is opt-in and crash fail-open. Manual CLI mode
 * always validates and returns non-zero when the gate blocks.
 */

const fs = require("fs");
const { isHookEnabled, loadConfig } = require("./lib/ck-config-utils.cjs");
const { resolveArtifactDir } = require("./workflow-artifact-gate/artifact-locator.cjs");
const { detectStage, isHardStage } = require("./workflow-artifact-gate/stage-detector.cjs");
const { validateArtifacts } = require("./workflow-artifact-gate/validator.cjs");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === "--stage") args.stage = argv[++i];
    else if (item === "--artifact-dir") args.artifactDir = argv[++i];
    else if (item === "--json") args.json = true;
  }
  return args;
}

function readPayload() {
  const input = fs.readFileSync(0, "utf8").trim();
  if (!input) return {};
  return JSON.parse(input);
}

function formatIssues(issues) {
  return issues
    .map((issue) => {
      const file = issue.file ? ` ${issue.file}` : "";
      const field = issue.field ? ` ${issue.field}` : "";
      return `- ${issue.type}:${file}${field} - ${issue.message}`;
    })
    .join("\n");
}

function messageFor(result, locator) {
  const lines = [
    `Workflow artifact gate: ${result.status.toUpperCase()} for ${result.stage}.`,
    `Artifact dir: ${result.artifactDir || "<not resolved>"} (${locator.source || "none"}).`,
  ];
  if (locator.reasons?.length) lines.push(`Locator: ${locator.reasons.join("; ")}.`);
  if (result.errors.length) lines.push("Blocking issues:\n" + formatIssues(result.errors));
  if (result.warnings.length) lines.push("Warnings:\n" + formatIssues(result.warnings));
  lines.push(
    "Manual check: node claude/hooks/workflow-artifact-gate.cjs --stage " + `${result.stage} --artifact-dir <dir>`
  );
  return lines.join("\n");
}

function emitSoft(message, event) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: event || "UserPromptSubmit",
        additionalContext: message,
      },
    })
  );
}

function emitBlock(message) {
  console.log(JSON.stringify({ continue: false, decision: "block", reason: message }));
}

function runValidation({ cwd, stage, artifactDir, config }) {
  const locator = resolveArtifactDir({ cwd, artifactDir });
  const result = validateArtifacts({
    artifactDir: locator.artifactDir,
    stage,
    config,
  });
  return { result, locator, message: messageFor(result, locator) };
}

function main() {
  if (process.env.CK_WORKFLOW_ARTIFACT_GATE_DISABLED === "1") process.exit(0);

  const args = parseArgs(process.argv);
  const manual = Boolean(args.stage);
  const payload = manual ? {} : readPayload();
  const cwd = payload.cwd || process.cwd();
  const fullConfig = loadConfig({ includeProject: false, includeAssertions: false, includeLocale: false });
  const gateConfig = fullConfig.workflowArtifactGate || {};

  if (!manual && (!isHookEnabled("workflow-artifact-gate") || gateConfig.enabled === false)) {
    process.exit(0);
  }

  const stage = args.stage || detectStage(payload);
  if (!stage) process.exit(0);
  const { result, message } = runValidation({
    cwd,
    stage,
    artifactDir: args.artifactDir,
    config: gateConfig,
  });

  if (manual) {
    console.log(args.json ? JSON.stringify(result, null, 2) : message);
    process.exit(result.status === "block" ? 2 : 0);
  }

  if (result.status === "block") {
    emitBlock(message);
    process.exit(2);
  }
  if (result.status === "warn" || !isHardStage(stage, gateConfig)) {
    emitSoft(message, payload.hook_event_name);
  }
  process.exit(0);
}

try {
  main();
} catch {
  process.exit(0);
}

module.exports = { parseArgs, runValidation, messageFor };
