import React from "react";

// next
import { useRouter } from "next/router";

// components
import { SingleSpreadsheetIssue, SpreadsheetColumns } from "components/core";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";
// types
import { ICurrentUserResponse, Properties, UserAuth } from "types";
// constants
import { SPREADSHEET_COLUMN } from "constants/spreadsheet";

type Props = {
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
};

export const SpreadsheetView: React.FC<Props> = ({ user, userAuth }) => {
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
    <div className="h-full rounded-lg text-brand-secondary overflow-x-auto whitespace-nowrap px-4 bg-brand-base">
      <div className="sticky z-10 top-0 border-b border-brand-base w-full min-w-max">
        <SpreadsheetColumns columnData={columnData} gridTemplateColumns={gridTemplateColumns} />
      </div>

      {spreadsheetIssues && (
        <div className="flex flex-col h-full w-full bg-brand-base rounded-sm ">
          {spreadsheetIssues.map((issue, index) => (
            <div className="border-b border-brand-base w-full min-w-max">
              <SingleSpreadsheetIssue
                issue={issue}
                gridTemplateColumns={gridTemplateColumns}
                properties={properties}
                user={user}
                userAuth={userAuth}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
