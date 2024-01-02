import { observer } from "mobx-react-lite";
// hooks
import { useProject } from "hooks/store";
// components
import { SpreadsheetColumn } from "components/issues";
// types
import { TIssue, IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueLabel, IState } from "@plane/types";

type Props = {
  displayFilters: IIssueDisplayFilterOptions;
  displayProperties: IIssueDisplayProperties;
  canEditProperties: (projectId: string | undefined) => boolean;
  expandedIssues: string[];
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  handleUpdateIssue: (issue: TIssue, data: Partial<TIssue>) => void;
  issues: TIssue[] | undefined;
  labels?: IIssueLabel[] | undefined;
  states?: IState[] | undefined;
};

export const SpreadsheetColumnsList: React.FC<Props> = observer((props) => {
  const {
    canEditProperties,
    displayFilters,
    displayProperties,
    expandedIssues,
    handleDisplayFilterUpdate,
    handleUpdateIssue,
    issues,
    labels,
    states,
  } = props;
  // store hooks
  const { currentProjectDetails } = useProject();

  const isEstimateEnabled: boolean = currentProjectDetails?.estimate !== null;

  return (
    <>
      {displayProperties.state && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          canEditProperties={canEditProperties}
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
          canEditProperties={canEditProperties}
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
          canEditProperties={canEditProperties}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          property="assignee"
        />
      )}
      {displayProperties.labels && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          canEditProperties={canEditProperties}
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
          canEditProperties={canEditProperties}
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
          canEditProperties={canEditProperties}
          expandedIssues={expandedIssues}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          handleUpdateIssue={handleUpdateIssue}
          issues={issues}
          property="due_date"
        />
      )}
      {displayProperties.estimate && isEstimateEnabled && (
        <SpreadsheetColumn
          displayFilters={displayFilters}
          canEditProperties={canEditProperties}
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
          canEditProperties={canEditProperties}
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
          canEditProperties={canEditProperties}
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
          canEditProperties={canEditProperties}
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
          canEditProperties={canEditProperties}
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
          canEditProperties={canEditProperties}
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
