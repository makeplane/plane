import React, { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { SpreadsheetColumns, SpreadsheetIssues } from "components/core";
import { IssuePeekOverview } from "components/issues";
// ui
import { CustomMenu, Spinner } from "components/ui";
// icon
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { ICurrentUserResponse, IIssue, IIssueDisplayFilterOptions, IIssueDisplayProperties, UserAuth } from "types";
import { IIssueUnGroupedStructure } from "store/issue";
// constants
import { SPREADSHEET_COLUMN } from "constants/spreadsheet";

type Props = {
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  openIssuesListModal?: (() => void) | null;
  disableUserActions: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
};

export const SpreadsheetLayout: React.FC<Props> = observer(
  ({ handleIssueAction, openIssuesListModal, disableUserActions, user, userAuth }) => {
    const [expandedIssues, setExpandedIssues] = useState<string[]>([]);

    const router = useRouter();
    const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

    const { issue: issueStore, issueFilter: issueFilterStore } = useMobxStore();

    const issues = issueStore.getIssues;
    const issueDisplayProperties = issueFilterStore.userDisplayProperties;

    const handleDisplayFiltersUpdate = useCallback(
      (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
        if (!workspaceSlug || !projectId) return;

        issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
          display_filters: {
            ...updatedDisplayFilter,
          },
        });
      },
      [issueFilterStore, projectId, workspaceSlug]
    );

    const type = cycleId ? "cycle" : moduleId ? "module" : "issue";

    const columnData = SPREADSHEET_COLUMN.map((column) => ({
      ...column,
      isActive: issueDisplayProperties
        ? column.propertyName === "labels"
          ? issueDisplayProperties[column.propertyName as keyof IIssueDisplayProperties]
          : column.propertyName === "title"
          ? true
          : issueDisplayProperties[column.propertyName as keyof IIssueDisplayProperties]
        : false,
    }));

    const gridTemplateColumns = columnData
      .filter((column) => column.isActive)
      .map((column) => column.colSize)
      .join(" ");

    return (
      <>
        <IssuePeekOverview
          projectId={projectId?.toString() ?? ""}
          workspaceSlug={workspaceSlug?.toString() ?? ""}
          readOnly={disableUserActions}
        />
        <div className="h-full rounded-lg text-custom-text-200 overflow-x-auto whitespace-nowrap bg-custom-background-100">
          <div className="sticky z-[2] top-0 border-b border-custom-border-200 bg-custom-background-90 w-full min-w-max">
            <SpreadsheetColumns
              columnData={columnData}
              displayFilters={issueFilterStore.userDisplayFilters}
              gridTemplateColumns={gridTemplateColumns}
              handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
            />
          </div>
          {issues ? (
            <div className="flex flex-col h-full w-full bg-custom-background-100 rounded-sm ">
              {(issues as IIssueUnGroupedStructure).map((issue: IIssue, index) => (
                <SpreadsheetIssues
                  key={`${issue.id}_${index}`}
                  index={index}
                  issue={issue}
                  expandedIssues={expandedIssues}
                  setExpandedIssues={setExpandedIssues}
                  gridTemplateColumns={gridTemplateColumns}
                  properties={issueDisplayProperties}
                  handleIssueAction={handleIssueAction}
                  disableUserActions={disableUserActions}
                  user={user}
                  userAuth={userAuth}
                />
              ))}
              <div
                className="relative group grid auto-rows-[minmax(44px,1fr)] hover:rounded-sm hover:bg-custom-background-80 border-b border-custom-border-200 w-full min-w-max"
                style={{ gridTemplateColumns }}
              >
                {type === "issue" ? (
                  <button
                    className="flex gap-1.5 items-center  pl-7 py-2.5 text-sm sticky left-0 z-[1] text-custom-text-200 bg-custom-background-100 group-hover:text-custom-text-100 group-hover:bg-custom-background-80 border-custom-border-200 w-full"
                    onClick={() => {
                      const e = new KeyboardEvent("keydown", { key: "c" });
                      document.dispatchEvent(e);
                    }}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Issue
                  </button>
                ) : (
                  !disableUserActions && (
                    <CustomMenu
                      className="sticky left-0 z-[1]"
                      customButton={
                        <button
                          className="flex gap-1.5 items-center  pl-7 py-2.5 text-sm sticky left-0 z-[1] text-custom-text-200 bg-custom-background-100 group-hover:text-custom-text-100 group-hover:bg-custom-background-80 border-custom-border-200 w-full"
                          type="button"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add Issue
                        </button>
                      }
                      position="left"
                      optionsClassName="left-5 !w-36"
                      noBorder
                    >
                      <CustomMenu.MenuItem
                        onClick={() => {
                          const e = new KeyboardEvent("keydown", { key: "c" });
                          document.dispatchEvent(e);
                        }}
                      >
                        Create new
                      </CustomMenu.MenuItem>
                      {openIssuesListModal && (
                        <CustomMenu.MenuItem onClick={openIssuesListModal}>Add an existing issue</CustomMenu.MenuItem>
                      )}
                    </CustomMenu>
                  )
                )}
              </div>
            </div>
          ) : (
            <Spinner />
          )}
        </div>
      </>
    );
  }
);
