import { createHash } from "node:crypto";

import type { JsonObject } from "../core/json.ts";

/**
 * Function names must match `^[a-zA-Z0-9_-]{1,64}$` for OpenAI-compatible APIs. Names that do not
 * are sanitised and suffixed with a short hash of the original so distinct names stay distinct.
 * Ported from employ_ai `chat-runtime/tool-calls.ts`.
 */
export function openAiToolName(name: string): string {
  if (/^[a-zA-Z0-9_-]{1,64}$/.test(name)) return name;
  const base =
    name
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 55) || "tool";
  return `${base}_${createHash("sha256").update(name).digest("hex").slice(0, 8)}`;
}

const jsonSchemaTypes = new Set(["object", "string", "number", "integer", "boolean", "array", "null"]);
const topLevelForbiddenKeys = ["allOf", "anyOf", "oneOf", "enum", "not"];

/**
 * Normalise an MCP tool's JSON Schema into what function-calling APIs accept: an object at the top,
 * no top-level unions, `type` arrays collapsed, required keys that exist. Ported from employ_ai.
 */
export function sanitizeToolInputSchema(schema: unknown): JsonObject {
  const sanitized = sanitizeSchemaNode(schema);
  const top: JsonObject = isJsonObject(sanitized) ? sanitized : { type: "object", properties: {} };
  if (top.type !== "object") top.type = "object";
  if (!isJsonObject(top.properties)) top.properties = {};
  for (const key of topLevelForbiddenKeys) delete top[key];
  return top;
}

function sanitizeSchemaNode(value: unknown): unknown {
  if (typeof value === "string") {
    if (!jsonSchemaTypes.has(value)) return { type: "object", properties: {} };
    return value === "object" ? { type: "object", properties: {} } : { type: value };
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeSchemaNode(item));
  if (!isJsonObject(value)) return value;

  const out: JsonObject = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === "type" && Array.isArray(entry)) {
      const nonNull = entry.filter((item) => item !== "null");
      const first = nonNull.find((item): item is string => typeof item === "string");
      out.type = first || "object";
      if (entry.includes("null")) out.nullable = true;
      continue;
    }
    if ((key === "properties" || key === "$defs" || key === "definitions") && isJsonObject(entry)) {
      out[key] = Object.fromEntries(Object.entries(entry).map(([name, item]) => [name, sanitizeSchemaNode(item)]));
    } else if (key === "items" || key === "additionalProperties") {
      out[key] = typeof entry === "boolean" ? entry : sanitizeSchemaNode(entry);
    } else if ((key === "anyOf" || key === "oneOf" || key === "allOf") && Array.isArray(entry)) {
      out[key] = entry.map((item) => sanitizeSchemaNode(item));
    } else if (key === "required" || key === "enum" || key === "examples") {
      out[key] = structuredClone(entry);
    } else {
      out[key] = isJsonObject(entry) || Array.isArray(entry) ? sanitizeSchemaNode(entry) : entry;
    }
  }

  const node = collapseNullableUnion(out, "anyOf") ?? collapseNullableUnion(out, "oneOf") ?? out;
  if (node.$ref) delete node.default;
  if (node.type === "object" && !isJsonObject(node.properties)) node.properties = {};
  if (node.type === "object" && Array.isArray(node.required)) {
    const props = isJsonObject(node.properties) ? node.properties : {};
    const required = node.required.filter((item): item is string => typeof item === "string" && item in props);
    if (required.length) node.required = required;
    else delete node.required;
  }
  return node;
}

function collapseNullableUnion(node: JsonObject, key: "anyOf" | "oneOf"): JsonObject | undefined {
  const variants = node[key];
  if (!Array.isArray(variants)) return undefined;
  const nonNull = variants.filter((item) => !(isJsonObject(item) && item.type === "null"));
  if (nonNull.length !== 1 || nonNull.length === variants.length) return undefined;
  const replacement: JsonObject = isJsonObject(nonNull[0]) ? { ...nonNull[0] } : {};
  replacement.nullable ??= true;
  for (const metaKey of ["title", "description", "default", "examples"]) {
    if (metaKey in node && !(metaKey in replacement) && !(metaKey === "default" && "$ref" in replacement)) {
      replacement[metaKey] = structuredClone(node[metaKey]);
    }
  }
  return sanitizeSchemaNode(replacement) as JsonObject;
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
