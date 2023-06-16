import React from "react";

// next
import { useRouter } from "next/router";

// components
import { SpreadsheetColumns, SpreadsheetIssues } from "components/core";
import { Spinner } from "components/ui";
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

  const columnData = SPREADSHEET_COLUMN.map((column) => ({
    ...column,
    isActive: properties
      ? column.propertyName === "labels"
        ? properties[column.propertyName as keyof Properties]
        : column.propertyName === "name" || column.propertyName === "position"
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
      {spreadsheetIssues ? (
        <div className="flex flex-col h-full w-full bg-brand-base rounded-sm ">
          {spreadsheetIssues
            .filter((i) => !i.parent)
            .map((issue, index) => (
              <SpreadsheetIssues
                issue={issue}
                index={index}
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
