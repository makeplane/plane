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

/* oxlint-disable react/display-name */
import { useRef, forwardRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// components
import { Tooltip } from "@plane/propel/tooltip";
// plane imports
import { cn, formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useStates } from "@/hooks/store/use-state";
// types
import type { IIssue } from "@/types/issue";

type Props = {
  issue: IIssue;
};

export const CalendarIssueBlock = observer(
  forwardRef<HTMLAnchorElement, Props>((props, ref) => {
    const { issue } = props;
    // states
    // refs
    const blockRef = useRef(null);
    // hooks
    const { anchor } = useParams();
    const { project_details } = usePublish(anchor.toString());
    const { getStateById } = useStates();
    const { getIsIssuePeeked, setPeekId } = useIssueDetails();

    const stateColor = getStateById(issue?.state_id ?? "")?.color || "";

    const { queryParam } = queryParamGenerator({ peekId: issue?.id });

    const handleIssuePeekOverview = () => setPeekId(issue?.id);

    return (
      <Link
        id={`issue-${issue.id}`}
        href={`?${queryParam}`}
        onClick={handleIssuePeekOverview}
        className="block w-full text-13 text-primary rounded-sm border-b md:border-[1px] border-subtle-1 hover:border-strong-1"
        ref={ref}
      >
        <>
          <div
            ref={blockRef}
            className={cn(
              "group/calendar-block flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded-sm  md:px-1 px-4 py-1.5 bg-surface-1 hover:bg-layer-1",
              {
                "border border-accent-strong hover:border-accent-strong": getIsIssuePeeked(issue.id),
              }
            )}
          >
            <div className="flex h-full items-center gap-1.5 truncate">
              <span
                className="h-full w-0.5 flex-shrink-0 rounded"
                style={{
                  backgroundColor: stateColor,
                }}
              />
              <div className="flex-shrink-0 text-13 md:text-11 text-tertiary">
                {formatProjectWorkItemIdentifierForDisplay(project_details?.identifier || "", issue.sequence_id)}
              </div>
              <Tooltip tooltipContent={issue.name}>
                <div className="truncate text-13 font-medium md:font-normal md:text-11">{issue.name}</div>
              </Tooltip>
            </div>
          </div>
        </>
      </Link>
    );
  })
);

CalendarIssueBlock.displayName = "CalendarIssueBlock";
