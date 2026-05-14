/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Utility: generates and triggers CSV download for the capacity summary report.
 */

import { download, generateCsv, mkConfig } from "export-to-csv";
import { format } from "date-fns";
import type { ICapacityMember } from "@plane/types";

/**
 * Triggers a browser CSV download for the capacity summary data.
 * Must stay byte-identical in output to the original inline handleExport.
 */
export function downloadCapacitySummaryCsv(workspaceSlug: string, members: ICapacityMember[]): void {
  const csvConfig = mkConfig({
    fieldSeparator: ",",
    filename: `${workspaceSlug}-capacity-report-${format(new Date(), "yyyy-MM-dd")}`,
    decimalSeparator: ".",
    useKeysAsHeaders: true,
  });

  const exportData = members.map((member) => ({
    "Member Name": member.display_name,
    "Total Logged (h)": (member.total_logged_minutes / 60).toFixed(2),
    ...Object.keys(member.days || {}).reduce<Record<string, string>>((acc, date) => {
      acc[date] = (((member.days && member.days[date]) || 0) / 60).toFixed(2);
      return acc;
    }, {}),
  }));

  const csv = generateCsv(csvConfig)(exportData as Array<Record<string, string>>);
  download(csvConfig)(csv);
}
