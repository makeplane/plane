/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Table of issues with logged time, estimated time, and variance columns.
 */

import type { FC } from "react";
import { formatMinutesToDisplay } from "@plane/constants";
import type { IWorkLogSummary } from "@plane/types";

type TTimeTrackingIssueTableProps = {
  byIssue: IWorkLogSummary["by_issue"];
};

export const TimeTrackingIssueTable: FC<TTimeTrackingIssueTableProps> = ({ byIssue }) => {
  if (byIssue.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-custom-border-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-custom-border-200 bg-custom-background-90">
            <th className="px-4 py-3 text-left text-xs font-semibold text-custom-text-300 uppercase tracking-wide">
              Issue
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-custom-text-300 uppercase tracking-wide w-32">
              Estimate
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-custom-text-300 uppercase tracking-wide w-32">
              Logged
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-custom-text-300 uppercase tracking-wide w-32">
              Variance
            </th>
          </tr>
        </thead>
        <tbody>
          {byIssue.map((issue) => {
            const variance =
              issue.estimate_time != null ? issue.total_minutes - issue.estimate_time : null;
            const varianceDisplay =
              variance != null
                ? variance === 0
                  ? "0m"
                  : `${variance > 0 ? "+" : ""}${formatMinutesToDisplay(Math.abs(variance))}`
                : "—";
            const varianceClass =
              variance == null
                ? "text-custom-text-300"
                : variance > 0
                  ? "text-red-500"
                  : variance < 0
                    ? "text-green-500"
                    : "text-custom-text-200";

            return (
              <tr
                key={issue.issue_id}
                className="border-b border-custom-border-100 last:border-0 hover:bg-custom-background-90 transition-colors"
              >
                <td className="px-4 py-3 text-custom-text-100 font-medium">{issue.issue_name}</td>
                <td className="px-4 py-3 text-right text-custom-text-200">
                  {issue.estimate_time != null ? formatMinutesToDisplay(issue.estimate_time) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-custom-text-100 font-medium">
                  {formatMinutesToDisplay(issue.total_minutes)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${varianceClass}`}>{varianceDisplay}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
