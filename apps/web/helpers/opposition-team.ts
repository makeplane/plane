export type TOppositionTeamOption = {
  name: string;
  logo: string;
};

export const normalizeOppositionTeam = (value: unknown): TOppositionTeamOption | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const name = typeof (value as { name?: unknown }).name === "string" ? (value as { name: string }).name.trim() : "";
  const logo = typeof (value as { logo?: unknown }).logo === "string" ? (value as { logo: string }).logo.trim() : "";

  if (!name) return null;

  return { name, logo };
};

export const parseOppositionTeam = (value: unknown): TOppositionTeamOption | null => {
  const normalizedObject = normalizeOppositionTeam(value);
  if (normalizedObject) return normalizedObject;

  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  try {
    const parsedValue = JSON.parse(trimmedValue);
    const normalizedParsedValue = normalizeOppositionTeam(parsedValue);
    if (normalizedParsedValue) return normalizedParsedValue;
  } catch {
    return { name: trimmedValue, logo: "" };
  }

  return { name: trimmedValue, logo: "" };
};

export const serializeOppositionTeam = (team: TOppositionTeamOption | null): string | null => {
  if (!team) return null;

  const normalizedTeam = normalizeOppositionTeam(team);
  if (!normalizedTeam) return null;

  return JSON.stringify(normalizedTeam);
};
