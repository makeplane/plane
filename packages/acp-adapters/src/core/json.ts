export type JsonObject = Record<string, unknown>;

export function objectValue(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

export function arrayValue(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

export function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function parseJsonObject(text: string): JsonObject {
  if (!text.trim()) return {};
  try {
    return objectValue(JSON.parse(text));
  } catch {
    return {};
  }
}
