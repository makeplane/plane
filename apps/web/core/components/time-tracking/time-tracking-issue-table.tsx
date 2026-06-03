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
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type TTimeTrackingIssueTableProps = {
  byIssue: IWorkLogSummary["by_issue"];
  workspaceSlug: string;
  projectId: string;
};

export const TimeTrackingIssueTable: FC<TTimeTrackingIssueTableProps> = ({ byIssue, workspaceSlug, projectId }) => {
  const { setPeekIssue } = useIssueDetail();

  if (byIssue.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-subtle">
      <table className="w-full text-13">
        <thead>
          <tr className="border-b border-subtle bg-layer-1-hover">
            <th className="px-4 py-3 text-left text-12 font-medium tracking-wide text-tertiary uppercase">Issue</th>
            <th className="w-32 px-4 py-3 text-right text-12 font-medium tracking-wide text-tertiary uppercase">
              Logged
            </th>
          </tr>
        </thead>
        <tbody>
          {byIssue.map((issue) => (
            <tr
              key={issue.issue_id}
              className="border-b border-subtle transition-colors last:border-0 hover:bg-layer-1-hover"
            >
              <td className="px-4 py-3">
                {issue.issue_name ? (
                  <button
                    className="text-left font-medium text-primary transition-colors hover:text-accent-primary"
                    onClick={() => setPeekIssue({ workspaceSlug, projectId, issueId: issue.issue_id, nestingLevel: 0 })}
                  >
                    {issue.issue_name}
                  </button>
                ) : (
                  <span className="text-tertiary italic">(Deleted issue)</span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-medium text-primary">
                {formatMinutesToDisplay(issue.total_minutes)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
