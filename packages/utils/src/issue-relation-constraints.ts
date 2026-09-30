/**
 * Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Mirror of `plane/utils/issue_relation_constraints.py`. Both sides have to answer the same
 * question the same way, so any rule changed here has to be changed there too.
 */

export type TTimelineRelationType =
  | "blocked_by"
  | "blocking"
  | "start_before"
  | "start_after"
  | "finish_before"
  | "finish_after";

export const TIMELINE_RELATION_TYPES: TTimelineRelationType[] = [
  "blocked_by",
  "blocking",
  "start_before",
  "start_after",
  "finish_before",
  "finish_after",
];

export type TWorkItemTimelineDates = {
  start_date?: string | Date | null;
  target_date?: string | Date | null;
};

const toDate = (value: string | Date | null | undefined): Date | null => {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const isOnOrBefore = (left: Date | null, right: Date | null): boolean => {
  if (!left || !right) return true;
  return left.getTime() <= right.getTime();
};

const isStrictlyBefore = (left: Date | null, right: Date | null): boolean => {
  if (!left || !right) return true;
  return left.getTime() < right.getTime();
};

export const isStartBeforeSatisfied = (
  issueStart: string | Date | null | undefined,
  relatedStart: string | Date | null | undefined
): boolean => isOnOrBefore(toDate(issueStart), toDate(relatedStart));

export const isStartAfterSatisfied = (
  issueStart: string | Date | null | undefined,
  relatedStart: string | Date | null | undefined
): boolean => isStartBeforeSatisfied(relatedStart, issueStart);

export const isFinishBeforeSatisfied = (
  issueFinish: string | Date | null | undefined,
  relatedFinish: string | Date | null | undefined
): boolean => isOnOrBefore(toDate(issueFinish), toDate(relatedFinish));

export const isFinishAfterSatisfied = (
  issueFinish: string | Date | null | undefined,
  relatedFinish: string | Date | null | undefined
): boolean => isFinishBeforeSatisfied(relatedFinish, issueFinish);

/**
 * Finish-to-start: the blocker has to be done before the blocked work item starts.
 *
 * Both dates are inclusive calendar days, so a blocker finishing on the day the blocked item
 * starts still overlaps it. Hence the strict comparison, unlike the start/finish pairs above.
 */
export const isBlockedBySatisfied = (
  issueStart: string | Date | null | undefined,
  blockerFinish: string | Date | null | undefined
): boolean => isStrictlyBefore(toDate(blockerFinish), toDate(issueStart));

export const isTimelineRelationSatisfied = (
  relationType: TTimelineRelationType,
  issueDates: TWorkItemTimelineDates,
  relatedDates: TWorkItemTimelineDates
): boolean => {
  switch (relationType) {
    case "blocked_by":
      return isBlockedBySatisfied(issueDates.start_date, relatedDates.target_date);
    case "blocking":
      return isBlockedBySatisfied(relatedDates.start_date, issueDates.target_date);
    case "start_before":
      return isStartBeforeSatisfied(issueDates.start_date, relatedDates.start_date);
    case "start_after":
      return isStartAfterSatisfied(issueDates.start_date, relatedDates.start_date);
    case "finish_before":
      return isFinishBeforeSatisfied(issueDates.target_date, relatedDates.target_date);
    case "finish_after":
      return isFinishAfterSatisfied(issueDates.target_date, relatedDates.target_date);
    default: {
      const _exhaustive: never = relationType;
      return _exhaustive;
    }
  }
};
