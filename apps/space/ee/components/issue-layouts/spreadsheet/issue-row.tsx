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

import type { MutableRefObject } from "react";
import { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// types
import type { IIssueDisplayProperties } from "@plane/types";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// components
import { WorkItemIdentifier } from "@/components/issues/work-item-identifier";
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/with-display-properties-HOC";
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
// local components
import { IssueColumn } from "./issue-column";

interface Props {
  displayProperties: IIssueDisplayProperties;
  issueId: string;
  isScrolled: MutableRefObject<boolean>;
  spreadsheetColumnsList: (keyof IIssueDisplayProperties)[];
}

export const SpreadsheetIssueRow = observer(function SpreadsheetIssueRow(props: Props) {
  const { displayProperties, issueId, isScrolled, spreadsheetColumnsList } = props;

  return (
    <tr className="transition-[background-color]">
      {/* first column/ issue name and key column */}
      <IssueRowDetails
        issueId={issueId}
        displayProperties={displayProperties}
        isScrolled={isScrolled}
        spreadsheetColumnsList={spreadsheetColumnsList}
      />
    </tr>
  );
});

interface IssueRowDetailsProps {
  displayProperties: IIssueDisplayProperties;
  issueId: string;
  isScrolled: MutableRefObject<boolean>;
  spreadsheetColumnsList: (keyof IIssueDisplayProperties)[];
}

const IssueRowDetails = observer(function IssueRowDetails(props: IssueRowDetailsProps) {
  const { anchor } = useParams();
  const { project_details } = usePublish(anchor.toString());
  const { displayProperties, issueId, isScrolled, spreadsheetColumnsList } = props;
  // refs
  const cellRef = useRef(null);
  // hooks
  const { getIsIssuePeeked, setPeekId, getIssueById } = useIssueDetails();

  const handleIssuePeekOverview = () => {
    setPeekId(issueId);
  };

  const { queryParam } = queryParamGenerator({ peekId: issueId });

  const issueDetail = getIssueById(issueId);

  if (!issueDetail) return null;

  return (
    <>
      <td id={`issue-${issueId}`} ref={cellRef} tabIndex={0} className="sticky left-0 z-10 group/list-block">
        <Link
          href={`?${queryParam}`}
          onClick={handleIssuePeekOverview}
          className={cn(
            "group clickable cursor-pointer h-11 w-[28rem] flex items-center text-13 after:absolute border-[0.5px] z-10 border-subtle-1 bg-layer-2 hover:bg-layer-2-hover group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10",
            {
              "border-accent-strong hover:border-accent-strong": getIsIssuePeeked(issueDetail.id),
              "shadow-[8px_22px_22px_10px_rgba(0,0,0,0.05)]": isScrolled.current,
            }
          )}
        >
          <div className="flex items-center gap-0.5 min-w-min py-2.5 pl-6">
            <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="key">
              <div className="relative flex cursor-pointer items-center text-center text-11 hover:text-primary">
                <WorkItemIdentifier
                  workItem={issueDetail}
                  projectIdentifier={project_details?.identifier || ""}
                  identifierClassName="flex font-medium leading-7"
                  size="xs"
                />
              </div>
            </WithDisplayPropertiesHOC>
          </div>

          <div className="flex items-center gap-2 justify-between h-full w-full pr-4 pl-6 truncate">
            <div className="w-full line-clamp-1 text-14 text-primary">
              <div className="w-full overflow-hidden">
                <Tooltip tooltipContent={issueDetail.name}>
                  <div
                    className="h-full w-full cursor-pointer truncate pr-4 text-left text-[0.825rem] text-primary focus:outline-none"
                    tabIndex={-1}
                  >
                    {issueDetail.name}
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
        </Link>
      </td>
      {/* Rest of the columns */}
      {spreadsheetColumnsList.map((property) => (
        <IssueColumn
          key={property}
          displayProperties={displayProperties}
          issueDetail={issueDetail}
          property={property}
        />
      ))}
    </>
  );
});
