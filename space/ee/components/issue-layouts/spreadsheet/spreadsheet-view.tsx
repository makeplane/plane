import React, { useRef } from "react";
import { observer } from "mobx-react";
// types
import { IIssueDisplayProperties } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common";
// constants
import { SPREADSHEET_PROPERTY_LIST } from "@/plane-web/constants/issue";
// local components
import { SpreadsheetTable } from "./spreadsheet-table";

type Props = {
  displayProperties: IIssueDisplayProperties;
  issueIds: string[] | undefined;
  canLoadMoreIssues: boolean;
  loadMoreIssues: () => void;
};

export const SpreadsheetView: React.FC<Props> = observer((props) => {
  const { displayProperties, issueIds, canLoadMoreIssues, loadMoreIssues } = props;
  // refs
  const containerRef = useRef<HTMLTableElement | null>(null);

  const spreadsheetColumnsList = SPREADSHEET_PROPERTY_LIST;

  if (!issueIds || issueIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <LogoSpinner />
      </div>
    );

  return (
    <div className="relative flex h-full w-full flex-col overflow-x-hidden whitespace-nowrap rounded-lg bg-custom-background-200 text-custom-text-200">
      <div ref={containerRef} className="vertical-scrollbar horizontal-scrollbar scrollbar-lg h-full w-full">
        <SpreadsheetTable
          displayProperties={displayProperties}
          issueIds={issueIds}
          containerRef={containerRef}
          canLoadMoreIssues={canLoadMoreIssues}
          loadMoreIssues={loadMoreIssues}
          spreadsheetColumnsList={spreadsheetColumnsList}
        />
      </div>
    </div>
  );
});
