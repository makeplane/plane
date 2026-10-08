/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TTimeEntry, TTimeEntryIssueDetail, TTimeTrackingError } from "@plane/types";

type TTranslate = (key: string, params?: Record<string, unknown>) => string;

export const getTimeTrackingErrorCode = (error: unknown): string | undefined =>
  (error as TTimeTrackingError | undefined)?.code;

/** A readable message for an API error: the translated error code, else the server's message. */
export const getTimeTrackingErrorMessage = (t: TTranslate, error: unknown): string => {
  const { code, error: serverMessage } = (error ?? {}) as Partial<TTimeTrackingError>;
  if (code) {
    const key = `time-tracking.errors.${code}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return serverMessage || t("time-tracking.errors.generic");
};

/** "WEB-42" */
export const getWorkItemKey = (detail: Pick<TTimeEntryIssueDetail, "project_identifier" | "sequence_id">) =>
  `${detail.project_identifier}-${detail.sequence_id}`;

/** "WEB-42 Fix login", or the project name for project time */
export const getEntryTitle = (entry: Pick<TTimeEntry, "issue_detail" | "project_detail">) =>
  entry.issue_detail ? `${getWorkItemKey(entry.issue_detail)} ${entry.issue_detail.name}` : entry.project_detail.name;

/** A work item option for WorkItemSelect from an entry's issue detail. */
export const toWorkItemOption = (detail: TTimeEntryIssueDetail | null | undefined) =>
  detail
    ? {
        id: detail.id,
        sequence_id: detail.sequence_id,
        name: detail.name,
        project_identifier: detail.project_identifier,
      }
    : null;

/** Same-day start/end times from a date and two HH:MM strings, as ISO strings in the browser's zone. */
export const combineDateAndTime = (date: string, time: string): string => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes).toISOString();
};

/** "HH:MM" of an ISO datetime in the browser's zone. */
export const toTimeInputValue = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};
