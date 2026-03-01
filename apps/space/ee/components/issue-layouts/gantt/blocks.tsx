/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// ui
import { StateGroupIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useStates } from "@/hooks/store/use-state";

type Props = {
  issueId: string;
};

export const IssueGanttBlock = observer(function IssueGanttBlock(props: Props) {
  const { issueId } = props;
  // store hooks
  const { getStateById } = useStates();
  const { getIssueById, setPeekId } = useIssueDetails();
  // derived values
  const issueDetails = getIssueById(issueId);
  const stateDetails = issueDetails && getStateById(issueDetails.state_id ?? undefined);

  const handleIssuePeekOverview = () => issueDetails && setPeekId(issueDetails.id);
  const { queryParam } = queryParamGenerator({ peekId: issueId });

  return (
    <Link
      id={`issue-${issueId}`}
      href={`?${queryParam}`}
      className="relative flex h-full w-full cursor-pointer items-center rounded"
      style={{
        backgroundColor: stateDetails?.color,
      }}
      onClick={handleIssuePeekOverview}
    >
      <div className="absolute left-0 top-0 h-full w-full bg-surface-1/50" />
      <Tooltip
        tooltipContent={
          <div className="space-y-1">
            <h5>{issueDetails?.name}</h5>
            <div>
              {renderFormattedDate(issueDetails?.start_date ?? "")} to{" "}
              {renderFormattedDate(issueDetails?.target_date ?? "")}
            </div>
          </div>
        }
        position="bottom-start"
        className="z-auto"
      >
        <div className="relative w-full overflow-hidden truncate px-2.5 py-1 text-13 text-primary">
          {issueDetails?.name}
        </div>
      </Tooltip>
    </Link>
  );
});

// rendering issues on gantt sidebar
export const IssueGanttSidebarBlock = observer(function IssueGanttSidebarBlock(props: Props) {
  const { issueId } = props;
  // router
  const { anchor } = useParams();
  // store hooks
  const { getStateById } = useStates();
  const { project_details } = usePublish(anchor.toString());
  const { getIssueById, setPeekId } = useIssueDetails();
  // derived values
  const issueDetails = getIssueById(issueId);
  const projectIdentifier = project_details?.identifier;
  const stateDetails = issueDetails && getStateById(issueDetails?.state_id ?? undefined);

  const handleIssuePeekOverview = () => issueDetails && setPeekId(issueId);
  const { queryParam } = queryParamGenerator({ peekId: issueId });

  return (
    <Link
      href={`?${queryParam}`}
      onClick={handleIssuePeekOverview}
      className="line-clamp-1 w-full cursor-pointer text-13 text-primary"
    >
      <div className="relative flex h-full w-full cursor-pointer items-center gap-2">
        {stateDetails && <StateGroupIcon stateGroup={stateDetails?.group} color={stateDetails?.color} />}
        <div className="flex-shrink-0 text-11 text-tertiary">
          {projectIdentifier} {issueDetails?.sequence_id}
        </div>
        <Tooltip tooltipContent={issueDetails?.name}>
          <span className="flex-grow truncate text-13 font-medium">{issueDetails?.name}</span>
        </Tooltip>
      </div>
    </Link>
  );
});
