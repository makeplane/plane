"use client";

import { MutableRefObject, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// types
import { IIssueDisplayProperties } from "@plane/types";
// ui
import { Tooltip } from "@plane/ui";
// components
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/with-display-properties-HOC";
// helper
import { cn } from "@/helpers/common.helper";
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

export const SpreadsheetIssueRow = observer((props: Props) => {
  const { displayProperties, issueId, isScrolled, spreadsheetColumnsList } = props;

  return (
    <tr className={cn("bg-custom-background-100 transition-[background-color]")}>
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

const IssueRowDetails = observer((props: IssueRowDetailsProps) => {
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
      <td
        id={`issue-${issueId}`}
        ref={cellRef}
        tabIndex={0}
        className="sticky left-0 z-10 group/list-block bg-custom-background-100"
      >
        <Link
          href={`?${queryParam}`}
          onClick={handleIssuePeekOverview}
          className={cn(
            "group clickable cursor-pointer h-11 w-[28rem] flex items-center text-sm after:absolute border-r-[0.5px] z-10 border-custom-border-200 bg-transparent group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10",
            {
              "border-b-[0.5px]": !getIsIssuePeeked(issueDetail.id),
              "border border-custom-primary-70 hover:border-custom-primary-70": getIsIssuePeeked(issueDetail.id),
              "shadow-[8px_22px_22px_10px_rgba(0,0,0,0.05)]": isScrolled.current,
            }
          )}
        >
          <div className="flex items-center gap-0.5 min-w-min py-2.5 pl-6">
            <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="key">
              <div className="relative flex cursor-pointer items-center text-center text-xs hover:text-custom-text-100">
                <p className={`flex font-medium leading-7`}>
                  {project_details?.identifier}-{issueDetail.sequence_id}
                </p>
              </div>
            </WithDisplayPropertiesHOC>
          </div>

          <div className="flex items-center gap-2 justify-between h-full w-full pr-4 pl-6 truncate">
            <div className="w-full line-clamp-1 text-sm text-custom-text-100">
              <div className="w-full overflow-hidden">
                <Tooltip tooltipContent={issueDetail.name}>
                  <div
                    className="h-full w-full cursor-pointer truncate pr-4 text-left text-[0.825rem] text-custom-text-100 focus:outline-none"
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
