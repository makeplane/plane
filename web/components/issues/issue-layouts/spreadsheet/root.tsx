import React, { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useUser from "hooks/use-user";
import useProjectDetails from "hooks/use-project-details";
// components
// import { SpreadsheetColumns, SpreadsheetIssues } from "components/core";
import { IssuePeekOverview } from "components/issues";
// ui
import { CustomMenu } from "components/ui";
import { Spinner } from "@plane/ui";
// icon
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IIssueDisplayFilterOptions, IIssueDisplayProperties } from "types";
import { IIssueUnGroupedStructure } from "store/issue";
// constants
import { SPREADSHEET_COLUMN } from "constants/spreadsheet";

export const SpreadsheetLayout: React.FC = observer(() => {
  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { user } = useUser();
  const { projectDetails } = useProjectDetails();

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

  const isAllowed = projectDetails?.member_role === 20 || projectDetails?.member_role === 15;

  return (
    <>
      <IssuePeekOverview
        projectId={projectId?.toString() ?? ""}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        readOnly={!isAllowed}
      />
      <div className="h-full rounded-lg text-custom-text-200 overflow-x-auto whitespace-nowrap bg-custom-background-100">
        <div className="sticky z-[2] top-0 border-b border-custom-border-200 bg-custom-background-90 w-full min-w-max">
          {/* <SpreadsheetColumns
            columnData={columnData}
            displayFilters={issueFilterStore.userDisplayFilters}
            gridTemplateColumns={gridTemplateColumns}
            handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
          /> */}
        </div>
        {/* {issues ? (
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
                handleIssueAction={() => {}}
                disableUserActions={!isAllowed}
                user={user}
                userAuth={{
                  isViewer: projectDetails?.member_role === 5,
                  isGuest: projectDetails?.member_role === 10,
                  isMember: projectDetails?.member_role === 15,
                  isOwner: projectDetails?.member_role === 20,
                }}
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
                isAllowed && (
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
                    {true && <CustomMenu.MenuItem onClick={() => {}}>Add an existing issue</CustomMenu.MenuItem>}
                  </CustomMenu>
                )
              )}
            </div>
          </div>
        ) : (
          <Spinner />
        )} */}
      </div>
    </>
  );
});
