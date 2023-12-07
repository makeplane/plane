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
  SpreadsheetAttachmentColumn,
  SpreadsheetCreatedOnColumn,
  SpreadsheetDueDateColumn,
  SpreadsheetEstimateColumn,
  SpreadsheetLabelColumn,
  SpreadsheetLinkColumn,
  SpreadsheetPriorityColumn,
  SpreadsheetStartDateColumn,
  SpreadsheetStateColumn,
  SpreadsheetSubIssueColumn,
  SpreadsheetUpdatedOnColumn,
} from "components/issues";
// ui
import { CustomMenu } from "@plane/ui";
// types
import { IIssue, IIssueDisplayFilterOptions, IIssueLabel, IState, IUserLite, TIssueOrderByOptions } from "types";
// constants
import { SPREADSHEET_PROPERTY_DETAILS } from "constants/spreadsheet";

type Props = {
  disableUserActions: boolean;
  displayFilters: IIssueDisplayFilterOptions;
  expandedIssues: string[];
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  handleUpdateIssue: (issue: IIssue, data: Partial<IIssue>) => void;
  issues: IIssue[] | undefined;
  property: string;
  members?: IUserLite[] | undefined;
  labels?: IIssueLabel[] | undefined;
  states?: IState[] | undefined;
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
    <div className="flex flex-col h-max w-full max-w-max bg-custom-background-100">
      <div className="flex items-center min-w-[8rem] px-4 py-1 text-sm font-medium z-[1] h-11 w-full sticky top-0 bg-custom-background-90 border border-l-0 border-custom-border-100">
        <CustomMenu
          customButtonClassName="!w-full"
          className="!w-full"
          customButton={
            <div className="flex items-center justify-between gap-1.5 cursor-pointer text-sm text-custom-text-200 hover:text-custom-text-100 w-full py-2">
              <div className="flex items-center gap-1.5">
                {<propertyDetails.icon className="h-4 w-4 text-custom-text-400" />}
                {propertyDetails.title}
              </div>
              <div className="flex ml-3">
                {activeSortingProperty === property && (
                  <div className="rounded-full flex items-center justify-center h-3.5 w-3.5">
                    <ListFilter className="h-3 w-3" />
                  </div>
                )}
                <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
              </div>
            </div>
          }
          width="xl"
          placement="bottom-end"
        >
          <CustomMenu.MenuItem onClick={() => handleOrderBy(propertyDetails.ascendingOrderKey, property)}>
            <div
              className={`flex gap-1.5 px-1 items-center justify-between ${
                selectedMenuItem === `${propertyDetails.ascendingOrderKey}_${property}`
                  ? "text-custom-text-100"
                  : "text-custom-text-200 hover:text-custom-text-100"
              }`}
            >
              <div className="flex gap-2 items-center">
                <ArrowDownWideNarrow className="h-3 w-3 stroke-[1.5]" />
                <span>{propertyDetails.ascendingOrderTitle}</span>
                <MoveRight className="h-3 w-3" />
                <span>{propertyDetails.descendingOrderTitle}</span>
              </div>

              {selectedMenuItem === `${propertyDetails.ascendingOrderKey}_${property}` && (
                <CheckIcon className="h-3 w-3" />
              )}
            </div>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={() => handleOrderBy(propertyDetails.descendingOrderKey, property)}>
            <div
              className={`flex gap-1.5 px-1 items-center justify-between ${
                selectedMenuItem === `${propertyDetails.descendingOrderKey}_${property}`
                  ? "text-custom-text-100"
                  : "text-custom-text-200 hover:text-custom-text-100"
              }`}
            >
              <div className="flex gap-2 items-center">
                <ArrowUpNarrowWide className="h-3 w-3 stroke-[1.5]" />
                <span>{propertyDetails.descendingOrderTitle}</span>
                <MoveRight className="h-3 w-3" />
                <span>{propertyDetails.ascendingOrderTitle}</span>
              </div>

              {selectedMenuItem === `${propertyDetails.descendingOrderKey}_${property}` && (
                <CheckIcon className="h-3 w-3" />
              )}
            </div>
          </CustomMenu.MenuItem>
          {selectedMenuItem &&
            selectedMenuItem !== "" &&
            displayFilters?.order_by !== "-created_at" &&
            selectedMenuItem.includes(property) && (
              <CustomMenu.MenuItem
                className={`mt-0.5 ${selectedMenuItem === `-created_at_${property}` ? "bg-custom-background-80" : ""}`}
                key={property}
                onClick={() => handleOrderBy("-created_at", property)}
              >
                <div className="flex items-center gap-2 px-1">
                  <Eraser className="h-3 w-3" />
                  <span>Clear sorting</span>
                </div>
              </CustomMenu.MenuItem>
            )}
        </CustomMenu>
      </div>

      <div className="h-full min-w-[8rem] w-full">
        {issues?.map((issue) => (
          <div
            key={`${property}-${issue.id}`}
            className={`h-11 border-b-[0.5px] border-custom-border-200 ${
              disableUserActions ? "" : "cursor-pointer hover:bg-custom-background-80"
            }`}
          >
            {property === "state" ? (
              <SpreadsheetStateColumn
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue, data)}
                states={states}
              />
            ) : property === "priority" ? (
              <SpreadsheetPriorityColumn
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue, data)}
              />
            ) : property === "estimate" ? (
              <SpreadsheetEstimateColumn
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue, data)}
              />
            ) : property === "assignee" ? (
              <SpreadsheetAssigneeColumn
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                members={members}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue, data)}
              />
            ) : property === "labels" ? (
              <SpreadsheetLabelColumn
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                labels={labels}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue, data)}
              />
            ) : property === "start_date" ? (
              <SpreadsheetStartDateColumn
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue, data)}
              />
            ) : property === "due_date" ? (
              <SpreadsheetDueDateColumn
                disabled={disableUserActions}
                expandedIssues={expandedIssues}
                issue={issue}
                onChange={(data: Partial<IIssue>) => handleUpdateIssue(issue, data)}
              />
            ) : property === "created_on" ? (
              <SpreadsheetCreatedOnColumn expandedIssues={expandedIssues} issue={issue} />
            ) : property === "updated_on" ? (
              <SpreadsheetUpdatedOnColumn expandedIssues={expandedIssues} issue={issue} />
            ) : property === "link" ? (
              <SpreadsheetLinkColumn expandedIssues={expandedIssues} issue={issue} />
            ) : property === "attachment_count" ? (
              <SpreadsheetAttachmentColumn expandedIssues={expandedIssues} issue={issue} />
            ) : property === "sub_issue_count" ? (
              <SpreadsheetSubIssueColumn expandedIssues={expandedIssues} issue={issue} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
