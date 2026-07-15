/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { download, generateCsv, mkConfig } from "export-to-csv";
import type { TTimesheetData } from "./transform";
import { formatDuration } from "./transform";

export const exportTimesheetCsv = (data: TTimesheetData, workspaceSlug: string, startDate: string, endDate: string) => {
  const csvConfig = mkConfig({
    fieldSeparator: ",",
    filename: `${workspaceSlug}-timesheet-${startDate}-${endDate}`,
    decimalSeparator: ".",
    useKeysAsHeaders: true,
  });

  const rows: Record<string, string | number>[] = [];

  for (const user of data.users) {
    for (const issue of user.issues) {
      const row: Record<string, string | number> = {
        User: user.displayName,
        "Work item": issue.projectIdentifier
          ? `${issue.projectIdentifier}-${issue.sequenceId} ${issue.name}`
          : issue.name,
      };
      for (const day of data.days) {
        row[day.date] = formatDuration(issue.perDay[day.date] ?? 0) || "0:00";
      }
      row.Total = formatDuration(issue.total) || "0:00";
      rows.push(row);
    }
  }

  const csv = generateCsv(csvConfig)(rows);
  download(csvConfig)(csv);
};
