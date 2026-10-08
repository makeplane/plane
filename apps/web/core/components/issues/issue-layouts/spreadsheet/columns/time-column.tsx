/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import type { TIssue } from "@plane/types";
import { Row } from "@plane/ui";
import { formatTimeDuration } from "@plane/utils";
// hooks
import { useProjectIssueTimeTotals } from "@/hooks/time-tracking/use-project-issue-time-totals";
import { useTimeTrackingPermissions } from "@/hooks/time-tracking/use-time-tracking-permissions";

type Props = {
  issue: TIssue;
};

/** "Time logged": completed time on the work item, from one shared request per project. */
export const SpreadsheetTimeColumn = observer(function SpreadsheetTimeColumn(props: Props) {
  const { issue } = props;
  const { workspaceSlug } = useParams();
  const { canView } = useTimeTrackingPermissions(workspaceSlug?.toString());
  const { getTotalByIssueId } = useProjectIssueTimeTotals(
    canView ? workspaceSlug?.toString() : undefined,
    issue.project_id
  );
  const total = getTotalByIssueId(issue.id);

  return (
    <Row className="flex h-11 w-full items-center border-b-[0.5px] border-subtle px-2.5 px-page-x py-1 text-11 group-[.selected-issue-row]:bg-accent-primary/5 hover:bg-layer-1 group-[.selected-issue-row]:hover:bg-accent-primary/10">
      {total ? (
        <span className="tabular-nums">{formatTimeDuration(total)}</span>
      ) : (
        <span className="text-placeholder">-</span>
      )}
    </Row>
  );
});
