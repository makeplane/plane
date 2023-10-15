import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import {
  // ListInlineCreateIssueForm,
  SpreadsheetAssigneeColumn,
  SpreadsheetCreatedOnColumn,
  SpreadsheetDueDateColumn,
  SpreadsheetEstimateColumn,
  SpreadsheetIssuesColumn,
  SpreadsheetLabelColumn,
  SpreadsheetPriorityColumn,
  SpreadsheetStartDateColumn,
  SpreadsheetStateColumn,
  SpreadsheetUpdatedOnColumn,
} from "components/core";
import { CustomMenu, Icon } from "components/ui";
import { IssuePeekOverview } from "components/issues";
import { Spinner } from "@plane/ui";
// types
import { IIssue, IIssueDisplayFilterOptions, IIssueDisplayProperties, TIssueOrderByOptions } from "types";
// icon
import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react";

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  issues: IIssue[] | undefined;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  handleUpdateIssue: (issueId: string, data: Partial<IIssue>) => void;
  openIssuesListModal?: (() => void) | null;
  disableUserActions: boolean;
};

export const SpreadsheetView: React.FC<Props> = observer((props) => {
  const {
    displayProperties,
    displayFilters,
    handleDisplayFilterUpdate,
    issues,
    handleIssueAction,
    handleUpdateIssue,
    openIssuesListModal,
    disableUserActions,
  } = props;

  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const [isInlineCreateIssueFormOpen, setIsInlineCreateIssueFormOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const { workspaceSlug, cycleId, moduleId } = router.query;

  const type = cycleId ? "cycle" : moduleId ? "module" : "issue";

  const { storedValue: selectedMenuItem, setValue: setSelectedMenuItem } = useLocalStorage(
    "spreadsheetViewSorting",
    ""
  );
  const { storedValue: activeSortingProperty, setValue: setActiveSortingProperty } = useLocalStorage(
    "spreadsheetViewActiveSortingProperty",
    ""
  );

  const handleOrderBy = (order: TIssueOrderByOptions, itemKey: string) => {
    handleDisplayFilterUpdate({ order_by: order });

    setSelectedMenuItem(`${order}_${itemKey}`);
    setActiveSortingProperty(order === "-created_at" ? "" : itemKey);
  };

  const renderColumn = (
    header: string,
    propertyName: string,
    Component: React.ComponentType<any>,
    ascendingOrder: TIssueOrderByOptions,
    descendingOrder: TIssueOrderByOptions
  ) => (
    <div className="relative flex flex-col h-max w-full bg-custom-background-100">
      <div className="flex items-center min-w-[9rem] px-4 py-2.5 text-sm font-medium z-[1] h-11 w-full sticky top-0 bg-custom-background-90 border border-l-0 border-custom-border-100">
        <CustomMenu
          customButtonClassName="!w-full"
          className="!w-full"
          customButton={
            <div
              className={`relative group flex items-center justify-between gap-1.5 cursor-pointer text-sm text-custom-text-200 hover:text-custom-text-100 w-full py-3 px-2 ${
                activeSortingProperty === propertyName ? "bg-custom-background-80" : ""
              }`}
            >
              {activeSortingProperty === propertyName && (
                <div className="absolute top-1 right-1.5">
                  <Icon
                    iconName="filter_list"
                    className="flex items-center justify-center h-3.5 w-3.5 rounded-full bg-custom-primary text-xs text-white"
                  />
                </div>
              )}

              {header}
              <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
            </div>
          }
          width="xl"
        >
          <CustomMenu.MenuItem
            onClick={() => {
              handleOrderBy(ascendingOrder, propertyName);
            }}
          >
            <div
              className={`group flex gap-1.5 px-1 items-center justify-between ${
                selectedMenuItem === `${ascendingOrder}_${propertyName}`
                  ? "text-custom-text-100"
                  : "text-custom-text-200 hover:text-custom-text-100"
              }`}
            >
              <div className="flex gap-2 items-center">
                {propertyName === "assignee" || propertyName === "labels" ? (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon iconName="east" className="absolute left-0 rotate-90 text-xs leading-3" />
                      <Icon iconName="sort" className="absolute right-0 text-sm" />
                    </span>
                    <span>A</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>Z</span>
                  </>
                ) : propertyName === "due_date" || propertyName === "created_on" || propertyName === "updated_on" ? (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon iconName="east" className="absolute left-0 rotate-90 text-xs leading-3" />
                      <Icon iconName="sort" className="absolute right-0 text-sm" />
                    </span>
                    <span>New</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>Old</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon iconName="east" className="absolute left-0 rotate-90 text-xs leading-3" />
                      <Icon iconName="sort" className="absolute right-0 text-sm" />
                    </span>
                    <span>First</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>Last</span>
                  </>
                )}
              </div>

              <CheckIcon
                className={`h-3.5 w-3.5 opacity-0 group-hover:opacity-100 ${
                  selectedMenuItem === `${ascendingOrder}_${propertyName}` ? "opacity-100" : ""
                }`}
              />
            </div>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem
            className={`mt-0.5 ${
              selectedMenuItem === `${descendingOrder}_${propertyName}` ? "bg-custom-background-80" : ""
            }`}
            key={propertyName}
            onClick={() => {
              handleOrderBy(descendingOrder, propertyName);
            }}
          >
            <div
              className={`group flex gap-1.5 px-1 items-center justify-between ${
                selectedMenuItem === `${descendingOrder}_${propertyName}`
                  ? "text-custom-text-100"
                  : "text-custom-text-200 hover:text-custom-text-100"
              }`}
            >
              <div className="flex gap-2 items-center">
                {propertyName === "assignee" || propertyName === "labels" ? (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon iconName="east" className="absolute left-0 -rotate-90 text-xs leading-3" />
                      <Icon iconName="sort" className="absolute rotate-180 transform scale-x-[-1] right-0 text-sm" />
                    </span>
                    <span>Z</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>A</span>
                  </>
                ) : propertyName === "due_date" ? (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon iconName="east" className="absolute left-0 -rotate-90 text-xs leading-3" />
                      <Icon iconName="sort" className="absolute rotate-180 transform scale-x-[-1] right-0 text-sm" />
                    </span>
                    <span>Old</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>New</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon iconName="east" className="absolute left-0 -rotate-90 text-xs leading-3" />
                      <Icon iconName="sort" className="absolute rotate-180 transform scale-x-[-1] right-0 text-sm" />
                    </span>
                    <span>Last</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>First</span>
                  </>
                )}
              </div>

              <CheckIcon
                className={`h-3.5 w-3.5 opacity-0 group-hover:opacity-100 ${
                  selectedMenuItem === `${descendingOrder}_${propertyName}` ? "opacity-100" : ""
                }`}
              />
            </div>
          </CustomMenu.MenuItem>
          {selectedMenuItem &&
            selectedMenuItem !== "" &&
            displayFilters?.order_by !== "-created_at" &&
            selectedMenuItem.includes(propertyName) && (
              <CustomMenu.MenuItem
                className={`mt-0.5${
                  selectedMenuItem === `-created_at_${propertyName}` ? "bg-custom-background-80" : ""
                }`}
                key={propertyName}
                onClick={() => {
                  handleOrderBy("-created_at", propertyName);
                }}
              >
                <div className={`group flex gap-1.5 px-1 items-center justify-between `}>
                  <div className="flex gap-1.5 items-center">
                    <span className="relative flex items-center justify-center h-6 w-6">
                      <Icon iconName="ink_eraser" className="text-sm" />
                    </span>

                    <span>Clear sorting</span>
                  </div>
                </div>
              </CustomMenu.MenuItem>
            )}
        </CustomMenu>
      </div>
      <div className="h-full min-w-[9rem] w-full">
        {issues?.map((issue) => (
          <Component
            key={issue.id}
            issue={issue}
            projectId={issue.project_detail.id}
            handleUpdateIssue={handleUpdateIssue}
            expandedIssues={expandedIssues}
            properties={displayProperties}
            isNotAllowed={disableUserActions}
          />
        ))}
      </div>
    </div>
  );

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      setIsScrolled(scrollLeft > 0);
    }
  };

  useEffect(() => {
    const currentContainerRef = containerRef.current;

    if (currentContainerRef) {
      currentContainerRef.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentContainerRef) {
        currentContainerRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <>
      <IssuePeekOverview
        projectId={currentProjectId ?? ""}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        readOnly={disableUserActions}
      />
      <div className="relative flex h-full w-full rounded-lg text-custom-text-200 overflow-x-auto whitespace-nowrap bg-custom-background-200">
        <div className="h-full w-full flex flex-col">
          <div ref={containerRef} className="flex max-h-full h-full overflow-y-auto">
            {issues ? (
              <>
                <div className="sticky left-0 w-[28rem] z-[2]">
                  <div
                    className="relative flex flex-col h-max w-full bg-custom-background-100 z-[2]"
                    style={{
                      boxShadow: isScrolled ? "8px -9px 12px rgba(0, 0, 0, 0.15)" : "",
                    }}
                  >
                    <div className="flex items-center text-sm font-medium z-[2] h-11 w-full sticky top-0 bg-custom-background-90 border border-l-0 border-custom-border-100">
                      {displayProperties.key && (
                        <span className="flex items-center px-4 py-2.5 h-full w-24 flex-shrink-0">ID</span>
                      )}
                      <span className="flex items-center px-4 py-2.5 h-full w-full flex-grow">Issue</span>
                    </div>

                    {issues.map((issue: IIssue, index) => (
                      <SpreadsheetIssuesColumn
                        key={`${issue.id}_${index}`}
                        issue={issue}
                        projectId={issue.project_detail.id}
                        expandedIssues={expandedIssues}
                        setExpandedIssues={setExpandedIssues}
                        setCurrentProjectId={setCurrentProjectId}
                        properties={displayProperties}
                        handleIssueAction={handleIssueAction}
                        disableUserActions={disableUserActions}
                      />
                    ))}
                  </div>
                </div>
                {displayProperties.state &&
                  renderColumn("State", "state", SpreadsheetStateColumn, "state__name", "-state__name")}

                {displayProperties.priority &&
                  renderColumn("Priority", "priority", SpreadsheetPriorityColumn, "priority", "-priority")}
                {displayProperties.assignee &&
                  renderColumn(
                    "Assignees",
                    "assignee",
                    SpreadsheetAssigneeColumn,
                    "assignees__first_name",
                    "-assignees__first_name"
                  )}
                {displayProperties.labels &&
                  renderColumn("Label", "labels", SpreadsheetLabelColumn, "labels__name", "-labels__name")}
                {displayProperties.start_date &&
                  renderColumn("Start Date", "start_date", SpreadsheetStartDateColumn, "-start_date", "start_date")}
                {displayProperties.due_date &&
                  renderColumn("Due Date", "due_date", SpreadsheetDueDateColumn, "-target_date", "target_date")}
                {displayProperties.estimate &&
                  renderColumn("Estimate", "estimate", SpreadsheetEstimateColumn, "estimate_point", "-estimate_point")}
                {displayProperties.created_on &&
                  renderColumn("Created On", "created_on", SpreadsheetCreatedOnColumn, "-created_at", "created_at")}
                {displayProperties.updated_on &&
                  renderColumn("Updated On", "updated_on", SpreadsheetUpdatedOnColumn, "-updated_at", "updated_at")}
              </>
            ) : (
              <div className="flex flex-col justify-center items-center h-full w-full">
                <Spinner />
              </div>
            )}
          </div>

          <div className="border-t border-custom-border-100">
            <div className="mb-3 z-50 sticky bottom-0 left-0">
              {/* <ListInlineCreateIssueForm
                isOpen={isInlineCreateIssueFormOpen}
                handleClose={() => setIsInlineCreateIssueFormOpen(false)}
                prePopulatedData={{
                  ...(cycleId && { cycle: cycleId.toString() }),
                  ...(moduleId && { module: moduleId.toString() }),
                }}
              /> */}
            </div>

            {type === "issue"
              ? !disableUserActions &&
                !isInlineCreateIssueFormOpen && (
                  <button
                    className="flex gap-1.5 items-center text-custom-primary-100 pl-4 py-2.5 text-sm sticky left-0 z-[1] w-full"
                    onClick={() => setIsInlineCreateIssueFormOpen(true)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    New Issue
                  </button>
                )
              : !disableUserActions &&
                !isInlineCreateIssueFormOpen && (
                  <CustomMenu
                    className="sticky left-0 z-10"
                    customButton={
                      <button
                        className="flex gap-1.5 items-center text-custom-primary-100 pl-4 py-2.5 text-sm sticky left-0 z-[1] border-custom-border-200 w-full"
                        type="button"
                      >
                        <PlusIcon className="h-4 w-4" />
                        New Issue
                      </button>
                    }
                    optionsClassName="left-5 !w-36"
                    noBorder
                  >
                    <CustomMenu.MenuItem onClick={() => setIsInlineCreateIssueFormOpen(true)}>
                      Create new
                    </CustomMenu.MenuItem>
                    {openIssuesListModal && (
                      <CustomMenu.MenuItem onClick={openIssuesListModal}>Add an existing issue</CustomMenu.MenuItem>
                    )}
                  </CustomMenu>
                )}
          </div>
        </div>
      </div>
    </>
  );
});
