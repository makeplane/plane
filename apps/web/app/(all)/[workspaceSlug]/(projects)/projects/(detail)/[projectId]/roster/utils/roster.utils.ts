import type { IRosterPlayer, IRosterPlayerPayload, TRosterPlayerStatus } from "@plane/types";
import { ROSTER_HEADER_MAP, STATUS_VALUES } from "../roster.constants";

export const toDisplayStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

export const formatTimestamp = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
    : "—";

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const getMappedValue = (row: Record<string, unknown>, aliases: string[]) => {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeHeader(key), value] as const);
  for (const alias of aliases) {
    const match = normalizedEntries.find(([normalizedKey]) => normalizedKey === normalizeHeader(alias));
    if (match) return match[1];
  }
  return undefined;
};

const toOptionalString = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const normalizeImportedStatus = (value: unknown): TRosterPlayerStatus => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return "active";
  if (STATUS_VALUES.includes(normalized as TRosterPlayerStatus)) return normalized as TRosterPlayerStatus;
  throw new Error(`Invalid status value "${String(value)}". Use active, injured, inactive, or pending.`);
};

export const mapImportedRows = (rows: Record<string, unknown>[]): IRosterPlayerPayload[] =>
  rows.reduce<IRosterPlayerPayload[]>((accumulator, row, index) => {
    const mappedRow: IRosterPlayerPayload = {
      player_name: String(getMappedValue(row, ROSTER_HEADER_MAP.player_name) ?? "").trim(),
      jersey_number: toOptionalString(getMappedValue(row, ROSTER_HEADER_MAP.jersey_number)),
      position: toOptionalString(getMappedValue(row, ROSTER_HEADER_MAP.position)),
      height: toOptionalString(getMappedValue(row, ROSTER_HEADER_MAP.height)),
      weight: toOptionalString(getMappedValue(row, ROSTER_HEADER_MAP.weight)),
      class_year: toOptionalString(getMappedValue(row, ROSTER_HEADER_MAP.class_year)),
      status: (() => {
        try {
          return normalizeImportedStatus(getMappedValue(row, ROSTER_HEADER_MAP.status));
        } catch (error) {
          throw new Error(`Row ${index + 2}: ${error instanceof Error ? error.message : "Invalid status value."}`);
        }
      })(),
      notes: toOptionalString(getMappedValue(row, ROSTER_HEADER_MAP.notes)),
    };

    const hasRosterValue = [
      mappedRow.player_name,
      mappedRow.jersey_number,
      mappedRow.position,
      mappedRow.height,
      mappedRow.weight,
      mappedRow.class_year,
      mappedRow.notes,
    ].some((value) => value !== null && value !== "");

    if (hasRosterValue) accumulator.push(mappedRow);
    return accumulator;
  }, []);

export const getPreviewRows = (rows: IRosterPlayerPayload[]) => rows.slice(0, 5);

export const getUniqueRosterValues = <K extends "position" | "status" | "class_year">(
  players: IRosterPlayer[],
  key: K
) => {
  const uniqueValues = new Set<string>();

  players.forEach((player) => {
    const value = player[key];
    if (typeof value !== "string") return;

    const normalizedValue = value.trim();
    if (!normalizedValue) return;

    uniqueValues.add(normalizedValue);
  });

  return Array.from(uniqueValues);
};
