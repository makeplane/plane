import type { TIssueProperty, TIssuePropertyType } from "@plane/types";

function stringifyDisplayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string | number | boolean =>
          typeof item === "string" || typeof item === "number" || typeof item === "boolean"
      )
      .map(String)
      .join(", ");
  }
  return "";
}

export function formatCustomFieldDisplayValue(
  value: unknown,
  propertyType: TIssuePropertyType,
  _options?: TIssueProperty["options"]
): string | null {
  if (value === null || value === undefined || value === "") return null;

  switch (propertyType) {
    case "boolean":
      return value ? "Yes" : "No";
    case "multi_select":
      if (Array.isArray(value)) {
        return value.length > 0 ? stringifyDisplayValue(value) : null;
      }
      return stringifyDisplayValue(value) || null;
    case "select":
    case "date":
    case "number":
    case "text":
    default:
      return stringifyDisplayValue(value) || null;
  }
}

export function getCustomFieldOptionColor(
  value: unknown,
  propertyType: TIssuePropertyType,
  options?: TIssueProperty["options"]
): string | undefined {
  if (propertyType !== "select" || !options?.length || value == null) return undefined;
  const strValue = typeof value === "string" ? value : typeof value === "number" ? String(value) : undefined;
  if (!strValue) return undefined;
  return options.find((opt) => opt.value === strValue)?.color;
}

/** Custom fields on cards are on unless explicitly turned off in Display properties. */
export function isCustomFieldVisibleOnCard(
  displayProperties: { custom_fields?: Record<string, boolean> } | undefined,
  propertyId: string
): boolean {
  const visibility = displayProperties?.custom_fields;
  if (!visibility) return true;
  return visibility[propertyId] !== false;
}

export function getDefaultCustomFieldValue(property: TIssueProperty): unknown {
  if (property.default_value !== null && property.default_value !== undefined) {
    return property.default_value;
  }
  switch (property.property_type) {
    case "select":
      return property.options?.[0]?.value ?? null;
    case "multi_select": {
      const first = property.options?.[0]?.value;
      return first ? [first] : null;
    }
    case "boolean":
      return false;
    default:
      return null;
  }
}

export function getEffectiveCustomFieldValue(property: TIssueProperty, rawValue: unknown): unknown {
  if (rawValue !== null && rawValue !== undefined && rawValue !== "") {
    if (Array.isArray(rawValue) && rawValue.length === 0) {
      return getDefaultCustomFieldValue(property);
    }
    return rawValue;
  }
  return getDefaultCustomFieldValue(property);
}
