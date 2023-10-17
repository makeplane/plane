import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CheckIcon,
  ChevronDownIcon,
  Eraser,
  ListFilter,
  MoveRight,
} from "lucide-react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import {
  SpreadsheetAssigneeColumn,
  SpreadsheetCreatedOnColumn,
  SpreadsheetDueDateColumn,
  SpreadsheetEstimateColumn,
  SpreadsheetLabelColumn,
  SpreadsheetPriorityColumn,
  SpreadsheetStartDateColumn,
  SpreadsheetStateColumn,
  SpreadsheetUpdatedOnColumn,
} from "components/issues";
// ui
import { CustomMenu } from "components/ui";
// types
import {
  IIssue,
  IIssueDisplayFilterOptions,
  IIssueLabels,
  IStateResponse,
  IUserLite,
  TIssueOrderByOptions,
} from "types";
// constants
import { SPREADSHEET_PROPERTY_DETAILS } from "constants/spreadsheet";

type Props = {
  disableUserActions: boolean;
  displayFilters: IIssueDisplayFilterOptions;
  expandedIssues: string[];
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  handleUpdateIssue: (issueId: string, data: Partial<IIssue>) => void;
  issues: IIssue[] | undefined;
  property: string;
  members?: IUserLite[] | undefined;
  labels?: IIssueLabels[] | undefined;
  states?: IStateResponse | undefined;
};

export const SpreadsheetColumn: React.FC<Props> = (props) => {
  const {
    disableUserActions,
    displayFilters,
    expandedIssues,
    handleDisplayFilterUpdate,
    handleUpdateIssue,
    issues,
    property,
    members,
    labels,
    states,
  } = props;

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

  const propertyDetails = SPREADSHEET_PROPERTY_DETAILS[property];

  return (
    <div className="relative flex flex-col h-max w-full bg-custom-background-100">
      <div className="flex items-center min-w-[9rem] px-4 py-2.5 text-sm font-medium z-[1] h-11 w-full sticky top-0 bg-custom-background-90 border border-l-0 border-custom-border-100">
        <CustomMenu
          customButtonClassName="!w-full"
          className="!w-full"
          customButton={
            <div
              className={`relative group flex items-center justify-between gap-1.5 cursor-pointer text-sm text-custom-text-200 hover:text-custom-text-100 w-full py-3 px-2 ${
                activeSortingProperty === property ? "bg-custom-background-80" : ""
              }`}
            >
              {activeSortingProperty === property && (
                <div className="absolute top-1 right-1.5 bg-custom-primary rounded-full flex items-center justify-center h-3.5 w-3.5">
                  <ListFilter className="h-3 w-3 text-white" />
                </div>
              )}

              {propertyDetails.title}
              <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
            </div>
          }
          width="xl"
        >
          <CustomMenu.MenuItem onClick={() => handleOrderBy(propertyDetails.ascendingOrderKey, property)}>
            <div
              className={`group flex gap-1.5 px-1 items-center justify-between ${
                selectedMenuItem === `${propertyDetails.ascendingOrderKey}_${property}`
                  ? "text-custom-text-100"
                  : "text-custom-text-200 hover:text-custom-text-100"
              }`}
            >
              <div className="flex gap-2 items-center">
                {property === "assignee" || property === "labels" ? (
                  <>
                    <ArrowDownWideNarrow className="h-4 w-4 stroke-[1.5]" />
                    <span>A</span>
                    <MoveRight className="h-3.5 w-3.5" />
                    <span>Z</span>
                  </>
                ) : property === "due_date" || property === "created_on" || property === "updated_on" ? (
                  <>
                    <ArrowDownWideNarrow className="h-4 w-4 stroke-[1.5]" />
                    <span>New</span>
                    <MoveRight className="h-3.5 w-3.5" />
                    <span>Old</span>
                  </>
                ) : (
                  <>
                    <ArrowDownWideNarrow className="h-4 w-4 stroke-[1.5]" />
                    <span>First</span>
                    <MoveRight className="h-3.5 w-3.5" />
                    <span>Last</span>
                  </>
                )}
              </div>

              <CheckIcon
                className={`h-3.5 w-3.5 opacity-0 group-hover:opacity-100 ${
                  selectedMenuItem === `${propertyDetails.ascendingOrderKey}_${property}` ? "opacity-100" : ""
                }`}
              />
            </div>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem
            className={`mt-0.5 ${
              selectedMenuItem === `${propertyDetails.descendingOrderKey}_${property}` ? "bg-custom-background-80" : ""
            }`}
            key={property}
            onClick={() => {
              handleOrderBy(propertyDetails.descendingOrderKey, property);
            }}
          >
            <div
              className={`group flex gap-1.5 px-1 items-center justify-between ${
                selectedMenuItem === `${propertyDetails.descendingOrderKey}_${property}`
                  ? "text-custom-text-100"
                  : "text-custom-text-200 hover:text-custom-text-100"
              }`}
            >
              <div className="flex gap-2 items-center">
                {property === "assignee" || property === "labels" ? (
                  <>
                    <ArrowUpNarrowWide className="h-4 w-4 stroke-[1.5]" />
                    <span>Z</span>
                    <MoveRight className="h-3.5 w-3.5" />
                    <span>A</span>
                  </>
                ) : property === "due_date" ? (
                  <>
                    <ArrowUpNarrowWide className="h-4 w-4 stroke-[1.5]" />
                    <span>Old</span>
                    <MoveRight className="h-3.5 w-3.5" />
                    <span>New</span>
                  </>
                ) : (
                  <>
                    <ArrowUpNarrowWide className="h-4 w-4 stroke-[1.5]" />
                    <span>Last</span>
                    <MoveRight className="h-3.5 w-3.5" />
                    <span>First</span>
                  </>
                )}
              </div>

              <CheckIcon
                className={`h-3.5 w-3.5 opacity-0 group-hover:opacity-100 ${
                  selectedMenuItem === `${propertyDetails.descendingOrderKey}_${property}` ? "opacity-100" : ""
                }`}
              />
            </div>
          </CustomMenu.MenuItem>
          {selectedMenuItem &&
            selectedMenuItem !== "" &&
            displayFilters?.order_by !== "-created_at" &&
            selectedMenuItem.includes(property) && (
              <CustomMenu.MenuItem
                className={`mt-0.5${selectedMenuItem === `-created_at_${property}` ? "bg-custom-background-80" : ""}`}
                key={property}
                onClick={() => {
                  handleOrderBy("-created_at", property);
                }}
              >
                <div className={`group flex gap-1.5 px-1 items-center justify-between `}>
                  <div className="flex gap-1.5 items-center">
                    <span className="relative flex items-center justify-center h-6 w-6">
                      <Eraser className="h-3.5 w-3.5" />
                    </span>

                    <span>Clear sorting</span>
                  </div>
                </div>
              </CustomMenu.MenuItem>
            )}
        </CustomMenu>
      </div>
      <div className="h-full min-w-[9rem] w-full">
        {issues?.map((issue) => {
          if (property === "state")
            return (
              <SpreadsheetStateColumn
                key={`${property}-${issue.id}`}
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue.id, data)}
                states={states}
              />
            );

          if (property === "priority")
            return (
              <SpreadsheetPriorityColumn
                key={`${property}-${issue.id}`}
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue.id, data)}
              />
            );

          if (property === "estimate")
            return (
              <SpreadsheetEstimateColumn
                key={`${property}-${issue.id}`}
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue.id, data)}
              />
            );
          if (property === "assignee")
            return (
              <SpreadsheetAssigneeColumn
                key={`${property}-${issue.id}`}
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                members={members}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue.id, data)}
              />
            );
          if (property === "labels")
            return (
              <SpreadsheetLabelColumn
                key={`${property}-${issue.id}`}
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                labels={labels}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue.id, data)}
              />
            );
          if (property === "start_date")
            return (
              <SpreadsheetStartDateColumn
                key={`${property}-${issue.id}`}
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue.id, data)}
              />
            );
          if (property === "due_date")
            return (
              <SpreadsheetDueDateColumn
                key={`${property}-${issue.id}`}
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue.id, data)}
              />
            );
          if (property === "created_on")
            return (
              <SpreadsheetCreatedOnColumn
                key={`${property}-${issue.id}`}
                expandedIssues={expandedIssues}
                issue={issue}
              />
            );
          if (property === "updated_on")
            return (
              <SpreadsheetUpdatedOnColumn
                key={`${property}-${issue.id}`}
                expandedIssues={expandedIssues}
                issue={issue}
              />
            );

          return null;
        })}
      </div>
    </div>
  );
};
