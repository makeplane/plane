/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TTimeReportResponse } from "@/services/time-report.service";

export type TDayColumn = {
  date: string;
  label: string;
};

export type TIssueRow = {
  issueId: string;
  name: string;
  sequenceId: number;
  projectId: string;
  projectIdentifier: string;
  total: number;
  perDay: Record<string, number>;
};

export type TUserRow = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  total: number;
  perDay: Record<string, number>;
  issues: TIssueRow[];
};

export type TTimesheetData = {
  days: TDayColumn[];
  users: TUserRow[];
  columnTotals: Record<string, number>;
  grandTotal: number;
};

export const getDayColumns = (startDate: string, endDate: string): TDayColumn[] => {
  const days: TDayColumn[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const dayCount = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  for (let offset = 0; offset < dayCount; offset++) {
    const cursor = new Date(start);
    cursor.setDate(cursor.getDate() + offset);
    days.push({
      date: cursor.toISOString().slice(0, 10),
      label: cursor.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
    });
  }

  return days;
};

export const formatDuration = (seconds: number): string => {
  if (!seconds) return "";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
};

export const buildTimesheetData = (response: TTimeReportResponse | undefined): TTimesheetData => {
  if (!response) {
    return { days: [], users: [], columnTotals: {}, grandTotal: 0 };
  }

  const days = getDayColumns(response.start_date, response.end_date);
  const columnTotals: Record<string, number> = Object.fromEntries(days.map((day) => [day.date, 0]));
  let grandTotal = 0;

  const userMap = new Map<string, TUserRow>();

  for (const entry of response.entries) {
    if (!entry.user_id) continue;

    const userMeta = response.users[entry.user_id];
    let userRow = userMap.get(entry.user_id);
    if (!userRow) {
      userRow = {
        userId: entry.user_id,
        displayName: userMeta?.display_name || [userMeta?.first_name, userMeta?.last_name].filter(Boolean).join(" ") || "Unknown",
        avatarUrl: userMeta?.avatar_url ?? null,
        total: 0,
        perDay: Object.fromEntries(days.map((day) => [day.date, 0])),
        issues: [],
      };
      userMap.set(entry.user_id, userRow);
    }

    const issueMeta = response.issues[entry.issue_id];
    let issueRow = userRow.issues.find((issue) => issue.issueId === entry.issue_id);
    if (!issueRow) {
      issueRow = {
        issueId: entry.issue_id,
        name: issueMeta?.name ?? "",
        sequenceId: issueMeta?.sequence_id ?? 0,
        projectId: issueMeta?.project_id ?? entry.project_id,
        projectIdentifier: issueMeta?.project_identifier ?? "",
        total: 0,
        perDay: Object.fromEntries(days.map((day) => [day.date, 0])),
      };
      userRow.issues.push(issueRow);
    }

    issueRow.perDay[entry.date] = (issueRow.perDay[entry.date] ?? 0) + entry.duration_seconds;
    issueRow.total += entry.duration_seconds;

    userRow.perDay[entry.date] = (userRow.perDay[entry.date] ?? 0) + entry.duration_seconds;
    userRow.total += entry.duration_seconds;

    columnTotals[entry.date] = (columnTotals[entry.date] ?? 0) + entry.duration_seconds;
    grandTotal += entry.duration_seconds;
  }

  const users = Array.from(userMap.values()).toSorted((a, b) => b.total - a.total);
  for (const user of users) {
    user.issues.sort((a, b) => b.total - a.total);
  }

  return { days, users, columnTotals, grandTotal };
};
