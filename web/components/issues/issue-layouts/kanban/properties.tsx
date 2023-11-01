// mobx
import { observer } from "mobx-react-lite";
// lucide icons
import { Layers, Link, Paperclip } from "lucide-react";
// components
import { IssuePropertyState } from "../properties/state";
import { IssuePropertyPriority } from "../properties/priority";
import { IssuePropertyLabels } from "../properties/labels";
import { IssuePropertyAssignee } from "../properties/assignee";
import { IssuePropertyEstimates } from "../properties/estimates";
import { IssuePropertyDate } from "../properties/date";
import { Tooltip } from "@plane/ui";
import {
  IEstimatePoint,
  IIssue,
  IIssueDisplayProperties,
  IIssueLabels,
  IState,
  IUserLite,
  TIssuePriorities,
} from "types";

export interface IKanBanProperties {
  sub_group_id: string;
  columnId: string;
  issue: IIssue;
  handleIssues: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => void;
  displayProperties: IIssueDisplayProperties;
  states: IState[] | null;
  labels: IIssueLabels[] | null;
  members: IUserLite[] | null;
  estimates: IEstimatePoint[] | null;
}

export const KanBanProperties: React.FC<IKanBanProperties> = observer((props) => {
  const {
    sub_group_id,
    columnId: group_id,
    issue,
    handleIssues,
    displayProperties,
    states,
    labels,
    members,
    estimates,
  } = props;

  const handleState = (state: IState) => {
    handleIssues(
      !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
      !group_id && group_id === "null" ? null : group_id,
      { ...issue, state: state.id }
    );
  };

  const handlePriority = (value: TIssuePriorities) => {
    handleIssues(
      !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
      !group_id && group_id === "null" ? null : group_id,
      { ...issue, priority: value }
    );
  };

  const handleLabel = (ids: string[]) => {
    handleIssues(
      !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
      !group_id && group_id === "null" ? null : group_id,
      { ...issue, labels: ids }
    );
  };

  const handleAssignee = (ids: string[]) => {
    handleIssues(
      !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
      !group_id && group_id === "null" ? null : group_id,
      { ...issue, assignees: ids }
    );
  };

  const handleStartDate = (date: string) => {
    handleIssues(
      !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
      !group_id && group_id === "null" ? null : group_id,
      { ...issue, start_date: date }
    );
  };

  const handleTargetDate = (date: string) => {
    handleIssues(
      !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
      !group_id && group_id === "null" ? null : group_id,
      { ...issue, target_date: date }
    );
  };

  const handleEstimate = (value: number | null) => {
    handleIssues(
      !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
      !group_id && group_id === "null" ? null : group_id,
      { ...issue, estimate_point: value }
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap whitespace-nowrap">
      {/* basic properties */}
      {/* state */}
      {displayProperties && displayProperties?.state && (
        <IssuePropertyState
          value={issue?.state_detail || null}
          onChange={handleState}
          states={states}
          disabled={false}
          hideDropdownArrow
        />
      )}

      {/* priority */}
      {displayProperties && displayProperties?.priority && (
        <IssuePropertyPriority
          value={issue?.priority || null}
          onChange={handlePriority}
          disabled={false}
          hideDropdownArrow
        />
      )}

      {/* label */}
      {displayProperties && displayProperties?.labels && (
        <IssuePropertyLabels
          value={issue?.labels || null}
          onChange={handleLabel}
          labels={labels}
          disabled={false}
          hideDropdownArrow
        />
      )}

      {/* assignee */}
      {displayProperties && displayProperties?.assignee && (
        <IssuePropertyAssignee
          value={issue?.assignees || null}
          hideDropdownArrow
          onChange={handleAssignee}
          members={members}
          disabled={false}
        />
      )}

      {/* start date */}
      {displayProperties && displayProperties?.start_date && (
        <IssuePropertyDate
          value={issue?.start_date || null}
          onChange={(date: string) => handleStartDate(date)}
          disabled={false}
          placeHolder="Start date"
        />
      )}

      {/* target/due date */}
      {displayProperties && displayProperties?.due_date && (
        <IssuePropertyDate
          value={issue?.target_date || null}
          onChange={(date: string) => handleTargetDate(date)}
          disabled={false}
          placeHolder="Target date"
        />
      )}

      {/* estimates */}
      {displayProperties && displayProperties?.estimate && (
        <IssuePropertyEstimates
          value={issue?.estimate_point || null}
          onChange={handleEstimate}
          estimatePoints={estimates}
          disabled={false}
          hideDropdownArrow
        />
      )}

      {/* extra render properties */}
      {/* sub-issues */}
      {displayProperties && displayProperties?.sub_issue_count && (
        <Tooltip tooltipHeading="Sub-issues" tooltipContent={`${issue.sub_issues_count}`}>
          <div className="flex-shrink-0 border-[0.5px] border-custom-border-300 overflow-hidden rounded flex justify-center items-center gap-2 px-2.5 py-1 h-5">
            <Layers className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.sub_issues_count}</div>
          </div>
        </Tooltip>
      )}

      {/* attachments */}
      {displayProperties && displayProperties?.attachment_count && (
        <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`}>
          <div className="flex-shrink-0 border-[0.5px] border-custom-border-300 overflow-hidden rounded flex justify-center items-center gap-2 px-2.5 py-1 h-5">
            <Paperclip className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.attachment_count}</div>
          </div>
        </Tooltip>
      )}

      {/* link */}
      {displayProperties && displayProperties?.link && (
        <Tooltip tooltipHeading="Links" tooltipContent={`${issue.link_count}`}>
          <div className="flex-shrink-0 border-[0.5px] border-custom-border-300 overflow-hidden rounded flex justify-center items-center gap-2 px-2.5 py-1 h-5">
            <Link className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.link_count}</div>
          </div>
        </Tooltip>
      )}
    </div>
  );
});
