/**
 * Questimus fork change (migration-karol.md §7.10): zero-pad the issue sequence
 * to a minimum of 3 digits for display — "QUESTIMUS-1" → "QUESTIMUS-001".
 *
 * Display-only: the API keeps the raw integer `sequence_id`; nothing about
 * keys, URLs or storage changes. Keys composed through these helpers are
 * consistent across lists, detail views, activities, notifications and ⌘K.
 */

export const padIssueSequence = (sequenceId: string | number | null | undefined): string =>
  sequenceId === null || sequenceId === undefined || sequenceId === ""
    ? ""
    : String(sequenceId).padStart(3, "0");

export const getIssueKey = (
  identifier: string | null | undefined,
  sequenceId: string | number | null | undefined
): string => (identifier ? `${identifier}-${padIssueSequence(sequenceId)}` : "");
