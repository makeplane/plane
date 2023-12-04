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
import { IIssue, IIssueDisplayProperties, IState, TIssuePriorities } from "types";

export interface IKanBanProperties {
  sub_group_id: string;
  columnId: string;
  issue: IIssue;
  handleIssues: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => void;
  displayProperties: IIssueDisplayProperties | null;
  showEmptyGroup: boolean;
  isReadOnly: boolean;
}

export const KanBanProperties: React.FC<IKanBanProperties> = observer((props) => {
  const { sub_group_id, columnId: group_id, issue, handleIssues, displayProperties, isReadOnly } = props;

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
          projectId={issue?.project_detail?.id || null}
          value={issue?.state || null}
          defaultOptions={issue?.state_detail ? [issue.state_detail] : []}
          onChange={handleState}
          disabled={isReadOnly}
          hideDropdownArrow
        />
      )}

      {/* priority */}
      {displayProperties && displayProperties?.priority && (
        <IssuePropertyPriority
          value={issue?.priority || null}
          onChange={handlePriority}
          disabled={isReadOnly}
          hideDropdownArrow
        />
      )}

      {/* label */}
      {displayProperties && displayProperties?.labels && (
        <IssuePropertyLabels
          projectId={issue?.project_detail?.id || null}
          value={issue?.labels || null}
          defaultOptions={issue?.label_details ? issue.label_details : []}
          onChange={handleLabel}
          disabled={isReadOnly}
          hideDropdownArrow
        />
      )}

      {/* start date */}
      {displayProperties && displayProperties?.start_date && (
        <IssuePropertyDate
          value={issue?.start_date || null}
          onChange={(date: string) => handleStartDate(date)}
          disabled={isReadOnly}
          placeHolder="Start date"
        />
      )}

      {/* target/due date */}
      {displayProperties && displayProperties?.due_date && (
        <IssuePropertyDate
          value={issue?.target_date || null}
          onChange={(date: string) => handleTargetDate(date)}
          disabled={isReadOnly}
          placeHolder="Target date"
        />
      )}

      {/* assignee */}
      {displayProperties && displayProperties?.assignee && (
        <IssuePropertyAssignee
          projectId={issue?.project_detail?.id || null}
          value={issue?.assignees || null}
          defaultOptions={issue?.assignee_details ? issue.assignee_details : []}
          hideDropdownArrow
          onChange={handleAssignee}
          disabled={isReadOnly}
          multiple
        />
      )}

      {/* estimates */}
      {displayProperties && displayProperties?.estimate && (
        <IssuePropertyEstimates
          projectId={issue?.project_detail?.id || null}
          value={issue?.estimate_point || null}
          onChange={handleEstimate}
          disabled={isReadOnly}
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
