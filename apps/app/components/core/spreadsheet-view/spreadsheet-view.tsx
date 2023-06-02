import React from "react";

// next
import { useRouter } from "next/router";

// components
import { SingleSpreadsheetIssue, SpreadsheetColumns } from "components/core";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";
// types
import { Properties, UserAuth } from "types";
// constants
import { SPREADSHEET_COLUMN } from "constants/spreadsheet";

type Props = {
  userAuth: UserAuth;
};

export const SpreadsheetView: React.FC<Props> = ({ userAuth }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { spreadsheetIssues } = useSpreadsheetIssuesView();

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const hasLabelsCountGreaterThanZero =
    spreadsheetIssues && spreadsheetIssues.some((item) => item.labels.length > 0);

  const columnData = SPREADSHEET_COLUMN.map((column) => ({
    ...column,
    isActive: properties
      ? column.propertyName === "labels"
        ? hasLabelsCountGreaterThanZero
          ? properties[column.propertyName as keyof Properties]
          : false
        : column.propertyName === "name"
        ? true
        : properties[column.propertyName as keyof Properties]
      : false,
  }));

  const gridTemplateColumns = columnData
    .filter((column) => column.isActive)
    .map((column) => column.colSize)
    .join(" ");

  return (
    <div className="h-full rounded-lg text-brand-secondary overflow-x-scroll pb-4 bg-brand-base">
      <SpreadsheetColumns columnData={columnData} gridTemplateColumns={gridTemplateColumns} />

      {spreadsheetIssues && (
        <div className="flex flex-col h-full w-full px-4 bg-brand-base rounded-sm ">
          {spreadsheetIssues.map((issue, index) => (
            <SingleSpreadsheetIssue
              issue={issue}
              gridTemplateColumns={gridTemplateColumns}
              properties={properties}
              userAuth={userAuth}
            />
          ))}
        </div>
      )}
    </div>
  );
};
