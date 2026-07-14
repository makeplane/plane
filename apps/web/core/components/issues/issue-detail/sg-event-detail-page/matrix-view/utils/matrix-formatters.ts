import type { MatrixEntityDimension } from "../types/matrix.types";

const EMPTY_MATRIX_VALUES = new Set(["", "--", "\u2014", "n/a", "na", "none", "null", "undefined"]);

export const normalizeMatrixKey = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const hasUsableMatrixValue = (value: string | null | undefined) => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return !EMPTY_MATRIX_VALUES.has(normalized);
};

export const formatMatrixLabel = (value: string | null | undefined, fallback = "Unknown") => {
  const normalized = String(value ?? "").trim();
  if (!hasUsableMatrixValue(normalized)) return fallback;

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/.test(word)) return word;
      if (word.length <= 3 && /^[a-z]+$/i.test(word) && ["rbi", "hbp", "fga"].includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

const encodeMatrixIdPart = (value: string) => encodeURIComponent(value.trim().toLowerCase());

export const buildMatrixEntityId = (dimension: MatrixEntityDimension, label: string) =>
  `entity:${dimension}:${encodeMatrixIdPart(label)}`;

export const buildMatrixActionId = (actionId: string) => `action:${encodeMatrixIdPart(actionId)}`;

export const buildMatrixCellId = (entityId: string, actionId: string) =>
  `cell:${encodeURIComponent(entityId)}:${encodeURIComponent(actionId)}`;

export const calculateMatrixAverage = (total: number, itemCount: number, precision = 2) => {
  if (!Number.isFinite(total) || itemCount <= 0) return 0;
  const factor = 10 ** Math.max(0, precision);
  return Math.round((total / itemCount) * factor) / factor;
};
