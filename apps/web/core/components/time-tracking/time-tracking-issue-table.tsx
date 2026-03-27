/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Table of issues with logged time column.
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
      <table className="w-full text-13">
        <thead>
          <tr className="border-b border-subtle bg-layer-1-hover">
            <th className="px-4 py-3 text-left text-12 font-medium text-tertiary uppercase tracking-wide">Issue</th>
            <th className="px-4 py-3 text-right text-12 font-medium text-tertiary uppercase tracking-wide w-32">
              Logged
            </th>
          </tr>
        </thead>
        <tbody>
          {byIssue.map((issue) => (
            <tr
              key={issue.issue_id}
              className="border-b border-subtle last:border-0 hover:bg-layer-1-hover transition-colors"
            >
              <td className="px-4 py-3 text-primary font-medium">
                {issue.issue_name || <span className="italic text-tertiary">(Deleted issue)</span>}
              </td>
              <td className="px-4 py-3 text-right text-primary font-medium">
                {formatMinutesToDisplay(issue.total_minutes)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
