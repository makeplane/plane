/**
 * Best-effort repair of truncated JSON model output (closes open strings and
 * brackets). Ported unchanged from the crm-new reference — pure JS.
 */

export const repairTruncatedJson = (text: string): unknown => {
  let json = text.trim();
  // Strip markdown fences the models sometimes add despite JSON mode
  json = json.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  if (json.startsWith("[")) json = json.substring(1).trim();
  if (json.endsWith("]")) json = json.substring(0, json.length - 1).trim();

  try {
    return JSON.parse(json);
  } catch {
    // truncated — fall through and close open delimiters
  }

  let inString = false;
  let escape = false;
  const stack: string[] = [];
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") {
      if (stack.length > 0) stack.pop();
    }
  }
  let suffix = "";
  if (inString) suffix += '"';
  while (stack.length > 0) suffix += stack.pop();
  return JSON.parse(json + suffix);
};

export const parseJsonResponse = <T>(text: string | undefined | null): T => {
  if (!text) throw new Error("AI did not return content");
  try {
    return JSON.parse(text) as T;
  } catch {
    return repairTruncatedJson(text) as T;
  }
};
