import React, { useState } from "react";

// next
import { useRouter } from "next/router";

// components
import { SpreadsheetColumns, SpreadsheetIssues, ListInlineCreateIssueForm } from "components/core";
import { CustomMenu, Spinner } from "components/ui";
import { IssuePeekOverview } from "components/issues";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";
// types
import { ICurrentUserResponse, IIssue, Properties, UserAuth } from "types";
// constants
import { SPREADSHEET_COLUMN } from "constants/spreadsheet";
// icon
import { PlusIcon } from "@heroicons/react/24/outline";

type Props = {
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  openIssuesListModal?: (() => void) | null;
  disableUserActions: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
};

export const SpreadsheetView: React.FC<Props> = ({
  handleIssueAction,
  openIssuesListModal,
  disableUserActions,
  user,
  userAuth,
}) => {
  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);
  const [isInlineCreateIssueFormOpen, setIsInlineCreateIssueFormOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const type = cycleId ? "cycle" : moduleId ? "module" : "issue";

  const { spreadsheetIssues, mutateIssues } = useSpreadsheetIssuesView();

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
    <>
      <IssuePeekOverview
        handleMutation={() => mutateIssues()}
        projectId={projectId?.toString() ?? ""}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        readOnly={disableUserActions}
      />
      <div
        className={`h-full rounded-lg text-custom-text-200 overflow-x-auto whitespace-nowrap bg-custom-background-100 ${
          isInlineCreateIssueFormOpen ? "mb-24" : "mb-12"
        }`}
      >
        <div className="sticky z-[2] top-0 border-b border-custom-border-200 bg-custom-background-90 w-full min-w-max">
          <SpreadsheetColumns columnData={columnData} gridTemplateColumns={gridTemplateColumns} />
        </div>
        {spreadsheetIssues ? (
          <div className="flex flex-col h-full w-full bg-custom-background-100 rounded-sm">
            {spreadsheetIssues.map((issue: IIssue, index) => (
              <SpreadsheetIssues
                key={`${issue.id}_${index}`}
                index={index}
                issue={issue}
                expandedIssues={expandedIssues}
                setExpandedIssues={setExpandedIssues}
                gridTemplateColumns={gridTemplateColumns}
                properties={properties}
                handleIssueAction={handleIssueAction}
                disableUserActions={disableUserActions}
                user={user}
                userAuth={userAuth}
              />
            ))}
          </div>
        ) : (
          <Spinner />
        )}
      </div>

      <div
        className={`absolute bottom-0 left-0 z-10 group hover:rounded-sm bg-custom-background-100 hover:bg-custom-background-80 border-b border-custom-border-200 w-full min-w-max ${
          isInlineCreateIssueFormOpen ? "pb-2" : ""
        }`}
      >
        <ListInlineCreateIssueForm
          isOpen={isInlineCreateIssueFormOpen}
          handleClose={() => setIsInlineCreateIssueFormOpen(false)}
          prePopulatedData={{
            ...(cycleId && { cycle: cycleId.toString() }),
            ...(moduleId && { module: moduleId.toString() }),
          }}
        />

        {type === "issue"
          ? !disableUserActions &&
            !isInlineCreateIssueFormOpen && (
              <button
                className="flex gap-1.5 items-center pl-7 py-2.5 text-sm sticky left-0 z-[1] text-custom-text-200 border-custom-border-200 w-full"
                onClick={() => setIsInlineCreateIssueFormOpen(true)}
              >
                <PlusIcon className="h-4 w-4" />
                Add Issue
              </button>
            )
          : !disableUserActions &&
            !isInlineCreateIssueFormOpen && (
              <CustomMenu
                className="sticky left-0 z-[1] !w-full"
                customButton={
                  <button
                    className="flex gap-1.5 items-center pl-7 py-2.5 text-sm sticky left-0 z-[1] text-custom-text-200 border-custom-border-200 w-full"
                    type="button"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Issue
                  </button>
                }
                position="left"
                verticalPosition="top"
                optionsClassName="left-5 !w-36"
                noBorder
              >
                <CustomMenu.MenuItem onClick={() => setIsInlineCreateIssueFormOpen(true)}>
                  Create new
                </CustomMenu.MenuItem>
                {openIssuesListModal && (
                  <CustomMenu.MenuItem onClick={openIssuesListModal}>
                    Add an existing issue
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
            )}
      </div>
    </>
  );
};
