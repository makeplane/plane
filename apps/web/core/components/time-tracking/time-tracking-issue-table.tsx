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
    <div className="overflow-x-auto rounded-lg border border-subtle">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-subtle bg-layer-1-hover">
            <th className="px-4 py-3 text-left text-xs font-semibold text-tertiary uppercase tracking-wide">Issue</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-tertiary uppercase tracking-wide w-32">
              Estimate
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-tertiary uppercase tracking-wide w-32">
              Logged
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-tertiary uppercase tracking-wide w-32">
              Variance
            </th>
          </tr>
        </thead>
        <tbody>
          {byIssue.map((issue) => {
            const variance = issue.estimate_time != null ? issue.total_minutes - issue.estimate_time : null;
            const varianceDisplay =
              variance != null
                ? variance === 0
                  ? "0m"
                  : `${variance > 0 ? "+" : ""}${formatMinutesToDisplay(Math.abs(variance))}`
                : "—";
            const varianceClass =
              variance == null
                ? "text-tertiary"
                : variance > 0
                  ? "text-red-500"
                  : variance < 0
                    ? "text-green-500"
                    : "text-secondary";

            return (
              <tr
                key={issue.issue_id}
                className="border-b border-subtle last:border-0 hover:bg-layer-1-hover transition-colors"
              >
                <td className="px-4 py-3 text-primary font-medium">
                  {issue.issue_name || <span className="italic text-tertiary">(Deleted issue)</span>}
                </td>
                <td className="px-4 py-3 text-right text-secondary">
                  {issue.estimate_time != null ? formatMinutesToDisplay(issue.estimate_time) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-primary font-medium">
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
