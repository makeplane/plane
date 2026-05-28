const REQUIRED_FILES = [
  "context-snippets.json",
  "risk-gate.json",
  "verification.json",
  "review-decision.json",
  "adversarial-validation.json",
];

const DECISIONS = new Set(["PASS", "PASS_WITH_RISK", "BLOCKED"]);
const CONTRACT_STATUSES = new Set(["OK", "CHANGED", "BROKEN", "UNKNOWN"]);
const MODES = new Set([
  "interactive",
  "auto",
  "fast",
  "parallel",
  "no-test",
  "code",
  "review",
  "quick",
  "standard",
  "deep",
]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function push(errors, path, message) {
  errors.push({ path, message });
}

function validateContext(value) {
  const errors = [];
  if (!isObject(value)) return [{ path: "context-snippets.json", message: "must be an object" }];
  for (const key of ["skill", "mode", "task", "scoutSummary"]) {
    if (!hasText(value[key])) push(errors, key, "must be a non-empty string");
  }
  if (hasText(value.mode) && !MODES.has(value.mode)) {
    push(errors, "mode", "must be a known workflow mode");
  }
  for (const key of ["acceptanceCriteria", "touchpoints", "publicContracts", "blastRadius"]) {
    if (!hasArray(value[key])) push(errors, key, "must be a non-empty array");
  }
  return errors;
}

function validateRiskGate(value) {
  const errors = [];
  if (!isObject(value)) return [{ path: "risk-gate.json", message: "must be an object" }];
  for (const key of ["highRisk", "autoStopRequired", "humanApproved", "largeDiff"]) {
    if (typeof value[key] !== "boolean") push(errors, key, "must be boolean");
  }
  if (!Array.isArray(value.reasons)) push(errors, "reasons", "must be an array");
  if (value.highRisk === true && value.reasons?.length === 0) {
    push(errors, "reasons", "must explain high risk");
  }
  if (value.highRisk === true && value.autoStopRequired !== true) {
    push(errors, "autoStopRequired", "must be true when highRisk is true");
  }
  return errors;
}

function validateVerification(value) {
  const errors = [];
  if (!isObject(value)) return [{ path: "verification.json", message: "must be an object" }];
  if (!hasArray(value.commands)) {
    push(errors, "commands", "must include at least one command");
    return errors;
  }
  value.commands.forEach((command, index) => {
    const base = `commands[${index}]`;
    if (!isObject(command)) return push(errors, base, "must be an object");
    if (!hasText(command.command)) push(errors, `${base}.command`, "must be a non-empty string");
    if (!["pass", "fail", "skipped"].includes(command.status)) {
      push(errors, `${base}.status`, "must be pass, fail, or skipped");
    }
    if (!Number.isInteger(command.exitCode)) push(errors, `${base}.exitCode`, "must be an integer");
    if (!hasText(command.timestamp)) push(errors, `${base}.timestamp`, "must be a timestamp string");
    if (!hasText(command.summary)) push(errors, `${base}.summary`, "must summarize output");
  });
  return errors;
}

function validateReviewDecision(value) {
  const errors = [];
  if (!isObject(value)) return [{ path: "review-decision.json", message: "must be an object" }];
  if (!DECISIONS.has(value.decision)) push(errors, "decision", "must be PASS, PASS_WITH_RISK, or BLOCKED");
  if (typeof value.score !== "number" || value.score < 0 || value.score > 10) {
    push(errors, "score", "must be a number from 0 to 10");
  }
  if (!Number.isInteger(value.criticalCount) || value.criticalCount < 0) {
    push(errors, "criticalCount", "must be a non-negative integer");
  }
  for (const key of ["acceptanceCoverage", "regressionProof", "blockingReasons"]) {
    if (!Array.isArray(value[key])) push(errors, key, "must be an array");
  }
  if (!CONTRACT_STATUSES.has(value.contractStatus)) {
    push(errors, "contractStatus", "must be OK, CHANGED, BROKEN, or UNKNOWN");
  }
  return errors;
}

function validateAdversarial(value) {
  const errors = [];
  if (!isObject(value)) return [{ path: "adversarial-validation.json", message: "must be an object" }];
  if (!DECISIONS.has(value.decision)) push(errors, "decision", "must be PASS, PASS_WITH_RISK, or BLOCKED");
  for (const key of ["disprovenClaims", "unverifiedClaims", "missingProof", "reachableRegressions"]) {
    if (!Array.isArray(value[key])) push(errors, key, "must be an array");
  }
  return errors;
}

module.exports = {
  REQUIRED_FILES,
  validateContext,
  validateRiskGate,
  validateVerification,
  validateReviewDecision,
  validateAdversarial,
};
