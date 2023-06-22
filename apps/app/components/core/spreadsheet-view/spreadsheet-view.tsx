import React, { useState } from "react";

// next
import { useRouter } from "next/router";

// components
import { SpreadsheetColumns, SpreadsheetIssues } from "components/core";
import { Spinner } from "components/ui";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";
// types
import { ICurrentUserResponse, IIssue, Properties, UserAuth } from "types";
// constants
import { SPREADSHEET_COLUMN } from "constants/spreadsheet";

type Props = {
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
};

export const SpreadsheetView: React.FC<Props> = ({ user, userAuth }) => {
  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { spreadsheetIssues } = useSpreadsheetIssuesView();

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const columnData = SPREADSHEET_COLUMN.map((column) => ({
    ...column,
    isActive: properties
      ? column.propertyName === "labels"
        ? properties[column.propertyName as keyof Properties]
        : column.propertyName === "title"
        ? true
        : properties[column.propertyName as keyof Properties]
      : false,
  }));

  const gridTemplateColumns = columnData
    .filter((column) => column.isActive)
    .map((column) => column.colSize)
    .join(" ");

  return (
    <div className="h-full rounded-lg text-brand-secondary overflow-x-auto whitespace-nowrap bg-brand-base">
      <div className="sticky z-20 top-0 border-b border-brand-base bg-brand-surface-2 w-full min-w-max">
        <SpreadsheetColumns columnData={columnData} gridTemplateColumns={gridTemplateColumns} />
      </div>
      {spreadsheetIssues ? (
        <div className="flex flex-col h-full w-full bg-brand-base rounded-sm ">
          {spreadsheetIssues.map((issue: IIssue, index) => (
            <SpreadsheetIssues
              key={`${issue.id}_${index}`}
              issue={issue}
              expandedIssues={expandedIssues}
              setExpandedIssues={setExpandedIssues}
              gridTemplateColumns={gridTemplateColumns}
              properties={properties}
              user={user}
              userAuth={userAuth}
            />
          ))}
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  );
};
