const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const toFieldText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return toFieldText(asRecord(value).name);
  }
  return "";
};

export const normalizeRawTagFieldKey = (value: unknown) =>
  toFieldText(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const findExactRawTagFieldValue = (tag: Record<string, unknown>, names: readonly string[]) => {
  const normalizedNames = new Set(names.map(normalizeRawTagFieldKey).filter(Boolean));

  for (const [key, value] of Object.entries(tag)) {
    if (!normalizedNames.has(normalizeRawTagFieldKey(key))) continue;
    const directValue = toFieldText(value);
    if (directValue) return directValue;
  }

  const dataEntries = Array.isArray(tag.data) ? tag.data : [];
  for (const entry of dataEntries) {
    const entryRecord = asRecord(entry);
    const entryKey = normalizeRawTagFieldKey(
      entryRecord.tag ??
        entryRecord.field ??
        entryRecord.field_name ??
        entryRecord.fieldName ??
        entryRecord.name ??
        entryRecord.key
    );
    if (!normalizedNames.has(entryKey)) continue;
    const entryValue = toFieldText(
      entryRecord.value ?? entryRecord.field_value ?? entryRecord.fieldValue ?? entryRecord.val
    );
    if (entryValue) return entryValue;
  }

  return "";
};
