/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCalendarKind, TTeamCalendarDay } from "@plane/types";

/** Every category of a person-day, in the order the team view lists them. */
export const CALENDAR_KINDS: TCalendarKind[] = ["ONSITE", "REMOTE", "OFF", "LEAVE", "HOLIDAY", "UNPLANNED"];

export type TKindCounts = Record<TCalendarKind, number>;

const emptyCounts = (): TKindCounts => ({ ONSITE: 0, REMOTE: 0, OFF: 0, LEAVE: 0, HOLIDAY: 0, UNPLANNED: 0 });

/** How many days each person has in each category over the given days of the team view. */
export const countByPerson = (days: TTeamCalendarDay[]): Record<string, TKindCounts> => {
  const result: Record<string, TKindCounts> = {};
  for (const day of days) {
    for (const kind of CALENDAR_KINDS) {
      for (const userId of day.users[kind] ?? []) {
        result[userId] ??= emptyCounts();
        result[userId][kind] += 1;
      }
    }
  }
  return result;
};

export type TKindShare = { kind: TCalendarKind; count: number; percent: number };

/** Each category's share of all counted person-days, for the statistics bar. Empty categories are left out. */
export const getKindShares = (totals: TKindCounts): TKindShare[] => {
  const all = CALENDAR_KINDS.reduce((sum, kind) => sum + (totals[kind] ?? 0), 0);
  if (all === 0) return [];
  return CALENDAR_KINDS.filter((kind) => totals[kind] > 0).map((kind) => ({
    kind,
    count: totals[kind],
    percent: (totals[kind] / all) * 100,
  }));
};

/** The people whose name contains the query, ignoring case and surrounding spaces. Everyone when it is empty. */
export const filterPeopleByName = (
  userIds: string[],
  getName: (userId: string) => string | undefined,
  query: string
): string[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return userIds;
  return userIds.filter((userId) => (getName(userId) ?? "").toLowerCase().includes(needle));
};

/** The first few people to show as avatars on a day, in the order of the categories (planned work first). */
export const getDayPeople = (day: TTeamCalendarDay, limit: number): { shown: string[]; extra: number } => {
  const everyone = (["ONSITE", "REMOTE", "LEAVE", "OFF"] as const).flatMap((kind) => day.users[kind] ?? []);
  return { shown: everyone.slice(0, limit), extra: Math.max(0, everyone.length - limit) };
};
