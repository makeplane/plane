import { observer } from "mobx-react-lite";
// components
import { SpreadsheetColumn } from "components/issues";
// types
import {
  IIssue,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueLabels,
  IStateResponse,
  IUserLite,
} from "types";

type Props = {
  displayFilters: IIssueDisplayFilterOptions;
  displayProperties: IIssueDisplayProperties;
  disableUserActions: boolean;
  expandedIssues: string[];
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  handleUpdateIssue: (issue: IIssue, data: Partial<IIssue>) => void;
  issues: IIssue[] | undefined;
  members?: IUserLite[] | undefined;
  labels?: IIssueLabels[] | undefined;
  states?: IStateResponse | undefined;
};

export const SpreadsheetColumnsList: React.FC<Props> = observer((props) => {
  const {
    disableUserActions,
    displayFilters,
    displayProperties,
    expandedIssues,
    handleDisplayFilterUpdate,
    handleUpdateIssue,
    issues,
    members,
    labels,
    states,
  } = props;

  return (
    <>
      {displayProperties.state && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          states={states}
          property="state"
        />
      )}
      {displayProperties.priority && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          property="priority"
        />
      )}
      {displayProperties.assignee && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          members={members}
          property="assignee"
        />
      )}
      {displayProperties.labels && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          labels={labels}
          property="labels"
        />
      )}{" "}
      {displayProperties.start_date && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          property="start_date"
        />
      )}
      {displayProperties.due_date && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          property="due_date"
        />
      )}
      {displayProperties.estimate && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          property="estimate"
        />
      )}
      {displayProperties.created_on && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          property="created_on"
        />
      )}
      {displayProperties.updated_on && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          property="updated_on"
        />
      )}
      {displayProperties.link && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          property="link"
        />
      )}
      {displayProperties.attachment_count && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          property="attachment_count"
        />
      )}
      {displayProperties.sub_issue_count && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          disableUserActions={disableUserActions}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          property="sub_issue_count"
        />
      )}
    </>
  );
});
