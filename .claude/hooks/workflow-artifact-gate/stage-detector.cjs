const HARD_PROMPT = ["ship", "push", "deploy", "publish", "release", "pr"];
const SOFT_PROMPT = ["finalize", "commit"];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasVerb(text, verbs) {
  const joined = verbs.map(escapeRegex).join("|");
  const negated = new RegExp(`\\b(?:do not|don'?t|never|not)\\s+(?:\\w+\\s+){0,2}(?:${joined})\\b`, "i");
  if (negated.test(text)) return false;
  return new RegExp(`\\b(?:${joined})\\b`, "i").test(text);
}

function detectPromptStage(prompt) {
  const text = String(prompt || "");
  if (!text.trim()) return null;
  if (hasVerb(text, HARD_PROMPT)) {
    if (/\bpr\b|\bpull request\b/i.test(text)) return "pr";
    if (/\bpush\b/i.test(text)) return "push";
    if (/\bdeploy|publish\b/i.test(text)) return "deploy";
    return "ship";
  }
  if (hasVerb(text, SOFT_PROMPT)) {
    if (/\bcommit\b/i.test(text)) return "commit";
    return "finalize";
  }
  return null;
}

function detectCommandStage(command) {
  const text = String(command || "").trim();
  if (!text) return null;
  const git = String.raw`\bgit(?:\s+(?:-[A-Za-z](?:\s+\S+)?|--git-dir=\S+|--work-tree=\S+))*\s+`;
  if (new RegExp(`${git}commit\\b`, "i").test(text)) return "commit";
  if (new RegExp(`${git}push\\b`, "i").test(text)) return "push";
  if (/\bgh\s+pr\s+(?:create|merge|ready)\b/i.test(text)) return "pr";
  if (/\bgh\s+release\s+create\b/i.test(text)) return "ship";
  if (/\bwrangler\s+(?:pages\s+)?deploy\b/i.test(text)) return "deploy";
  if (/\b(?:vercel|netlify|firebase|fly|railway)\s+(?:deploy|up)\b/i.test(text)) return "deploy";
  if (/\b(?:npm|pnpm|yarn)\s+(?:run\s+)?(?:deploy|publish)\b/i.test(text)) return "deploy";
  if (/\b(?:ship|release)\b/i.test(text)) return "ship";
  return null;
}

function detectStage(payload = {}) {
  if (payload.stage) return String(payload.stage);
  const prompt = payload.prompt || payload.user_prompt;
  const promptStage = detectPromptStage(prompt);
  if (promptStage) return promptStage;
  if (payload.tool_name === "Bash" || payload.tool_input?.command) {
    return detectCommandStage(payload.tool_input?.command);
  }
  return null;
}

function isHardStage(stage, config = {}) {
  const hard = config.hardStages || ["ship", "push", "pr", "deploy"];
  return hard.includes(stage);
}

function isSoftStage(stage, config = {}) {
  const soft = config.softStages || ["finalize", "commit"];
  return soft.includes(stage);
}

module.exports = { detectStage, detectPromptStage, detectCommandStage, isHardStage, isSoftStage };
