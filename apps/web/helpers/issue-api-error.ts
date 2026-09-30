/**
 * Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

type TTranslate = (key: string, params?: Record<string, unknown>) => string;

// Error codes emitted by plane/utils/issue_relation_constraints.py, mapped to the i18n subtree
// holding the localized sentence for each relation type.
const RELATION_CONFLICT_KINDS: Record<string, string> = {
  relation_date_conflict: "date",
  relation_status_conflict: "status",
};

/**
 * Reads a field that the backend may send either as a bare string or wrapped in a list.
 *
 * Views return the error payload verbatim, while a serializer routes it through DRF, which turns
 * every value into a single-element list.
 */
const readField = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) return value[0];
  return undefined;
};

const getRelationConflictMessage = (payload: Record<string, unknown>, t: TTranslate): string | undefined => {
  const kind = RELATION_CONFLICT_KINDS[readField(payload.error_code) ?? ""];
  const relationType = readField(payload.relation_type);
  if (!kind || !relationType) return undefined;

  const key = `issue.relation.conflict.${kind}.${relationType}`;
  const message = t(key, {
    issue: readField(payload.issue_ref) ?? "",
    related: readField(payload.related_ref) ?? "",
  });

  // The translation store echoes the key back when it holds no entry for it, in which case the
  // English sentence the backend already sent is the better answer.
  return message === key ? undefined : message;
};

export const getIssueApiErrorMessage = (error: unknown, fallback: string, t?: TTranslate): string => {
  if (!error) return fallback;
  if (typeof error === "string" && error.trim()) return error;

  if (typeof error === "object") {
    const payload = error as Record<string, unknown>;

    if (t) {
      const conflictMessage = getRelationConflictMessage(payload, t);
      if (conflictMessage) return conflictMessage;
    }

    const directError = readField(payload.error);
    if (directError) return directError;

    const directMessage = readField(payload.message);
    if (directMessage) return directMessage;

    const nonFieldError = readField(payload.non_field_errors);
    if (nonFieldError) return nonFieldError;

    const detail = readField(payload.detail);
    if (detail) return detail;

    for (const value of Object.values(payload)) {
      const fieldError = readField(value);
      if (fieldError) return fieldError;
    }
  }

  return fallback;
};
