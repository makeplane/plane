const fs = require("fs");
const path = require("path");

const POINTER_PATH = path.join(".claude", "workflow-artifacts.json");
const RECENT_MS = 24 * 60 * 60 * 1000;

function safeResolve(cwd, value) {
  if (!value || typeof value !== "string") return null;
  if (value.includes("\0")) return null;
  const resolved = path.isAbsolute(value) ? path.normalize(value) : path.resolve(cwd, value);
  const root = path.resolve(cwd);
  if (!path.isAbsolute(value) && resolved !== root && !resolved.startsWith(root + path.sep)) {
    return null;
  }
  return resolved;
}

function readPointer(cwd) {
  const pointerPath = path.join(cwd, POINTER_PATH);
  try {
    const data = JSON.parse(fs.readFileSync(pointerPath, "utf8"));
    return { data, pointerPath };
  } catch {
    return null;
  }
}

function findHarnessDirs(cwd) {
  const roots = [path.join(cwd, "plans", "reports", "harness"), path.join(cwd, "plans")];
  const dirs = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    if (root.endsWith(path.join("reports", "harness"))) {
      for (const name of fs.readdirSync(root, { withFileTypes: true })) {
        if (name.isDirectory()) dirs.push(path.join(root, name.name));
      }
      continue;
    }
    for (const plan of fs.readdirSync(root, { withFileTypes: true })) {
      if (!plan.isDirectory()) continue;
      const harness = path.join(root, plan.name, "reports", "harness");
      if (fs.existsSync(harness)) dirs.push(harness);
    }
  }
  const now = Date.now();
  return dirs.filter((dir) => {
    try {
      return now - fs.statSync(dir).mtimeMs <= RECENT_MS;
    } catch {
      return false;
    }
  });
}

function resolveArtifactDir({ cwd = process.cwd(), artifactDir = null, env = process.env } = {}) {
  const reasons = [];
  const explicit = safeResolve(cwd, artifactDir);
  if (explicit) return { artifactDir: explicit, source: "flag", reasons };
  if (artifactDir) reasons.push("explicit artifact dir was invalid");

  const fromEnv = safeResolve(cwd, env.CK_WORKFLOW_ARTIFACT_DIR);
  if (fromEnv) return { artifactDir: fromEnv, source: "env", reasons };
  if (env.CK_WORKFLOW_ARTIFACT_DIR) reasons.push("env artifact dir was invalid");

  const pointer = readPointer(cwd);
  if (pointer?.data?.artifactDir) {
    const fromPointer = safeResolve(cwd, pointer.data.artifactDir);
    if (fromPointer && fs.existsSync(fromPointer)) {
      return { artifactDir: fromPointer, source: "pointer", pointerPath: pointer.pointerPath, reasons };
    }
    reasons.push("active artifact pointer is stale or invalid");
  }

  const fallback = findHarnessDirs(cwd);
  if (fallback.length === 1) {
    return { artifactDir: fallback[0], source: "fallback", reasons };
  }
  if (fallback.length > 1) reasons.push("fallback is ambiguous; set CK_WORKFLOW_ARTIFACT_DIR");
  return { artifactDir: null, source: null, reasons };
}

module.exports = { POINTER_PATH, resolveArtifactDir, safeResolve, readPointer, findHarnessDirs };
