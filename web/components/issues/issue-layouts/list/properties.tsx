import { FC } from "react";
import { observer } from "mobx-react-lite";
import { Layers, Link, Paperclip } from "lucide-react";
// components
import { IssuePropertyState } from "../properties/state";
import { IssuePropertyPriority } from "../properties/priority";
import { IssuePropertyLabels } from "../properties/labels";
import { IssuePropertyAssignee } from "../properties/assignee";
import { IssuePropertyEstimates } from "../properties/estimates";
import { IssuePropertyDate } from "../properties/date";
// ui
import { Tooltip } from "@plane/ui";
// types
import { IIssue, IIssueDisplayProperties, IState, TIssuePriorities } from "types";

export interface IListProperties {
  columnId: string;
  issue: IIssue;
  handleIssues: (group_by: string | null, issue: IIssue) => void;
  displayProperties: IIssueDisplayProperties | undefined;
  isReadonly?: boolean;
}

export const ListProperties: FC<IListProperties> = observer((props) => {
  const { columnId: group_id, issue, handleIssues, displayProperties, isReadonly } = props;

  const handleState = (state: IState) => {
    handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, state: state.id });
  };

  const handlePriority = (value: TIssuePriorities) => {
    handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, priority: value });
  };

  const handleLabel = (ids: string[]) => {
    handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, labels: ids });
  };

  const handleAssignee = (ids: string[]) => {
    handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, assignees: ids });
  };

  const handleStartDate = (date: string) => {
    handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, start_date: date });
  };

  const handleTargetDate = (date: string) => {
    handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, target_date: date });
  };

  const handleEstimate = (value: number | null) => {
    handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, estimate_point: value });
  };

  return (
    <div className="relative flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      {/* basic properties */}
      {/* state */}
      {displayProperties && displayProperties?.state && (
        <IssuePropertyState
          projectId={issue?.project_detail?.id || null}
          value={issue?.state || null}
          defaultOptions={issue?.state_detail ? [issue.state_detail] : []}
          hideDropdownArrow
          onChange={handleState}
          disabled={isReadonly}
        />
      )}

      {/* priority */}
      {displayProperties && displayProperties?.priority && (
        <IssuePropertyPriority
          value={issue?.priority || null}
          onChange={handlePriority}
          disabled={isReadonly}
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
          disabled={isReadonly}
          hideDropdownArrow
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
          disabled={isReadonly}
          multiple
        />
      )}

      {/* start date */}
      {displayProperties && displayProperties?.start_date && (
        <IssuePropertyDate
          value={issue?.start_date || null}
          onChange={(date: string) => handleStartDate(date)}
          disabled={isReadonly}
          placeHolder="Start date"
        />
      )}

      {/* target/due date */}
      {displayProperties && displayProperties?.due_date && (
        <IssuePropertyDate
          value={issue?.target_date || null}
          onChange={(date: string) => handleTargetDate(date)}
          disabled={isReadonly}
          placeHolder="Target date"
        />
      )}

      {/* estimates */}
      {displayProperties && displayProperties?.estimate && (
        <IssuePropertyEstimates
          projectId={issue?.project_detail?.id || null}
          value={issue?.estimate_point || null}
          hideDropdownArrow
          onChange={handleEstimate}
          disabled={isReadonly}
        />
      )}

      {/* extra render properties */}
      {/* sub-issues */}
      {displayProperties && displayProperties?.sub_issue_count && !!issue?.sub_issues_count && (
        <Tooltip tooltipHeading="Sub-issues" tooltipContent={`${issue.sub_issues_count}`}>
          <div className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1">
            <Layers className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.sub_issues_count}</div>
          </div>
        </Tooltip>
      )}

      {/* attachments */}
      {displayProperties && displayProperties?.attachment_count && !!issue?.attachment_count && (
        <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`}>
          <div className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1">
            <Paperclip className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.attachment_count}</div>
          </div>
        </Tooltip>
      )}

      {/* link */}
      {displayProperties && displayProperties?.link && !!issue?.link_count && (
        <Tooltip tooltipHeading="Links" tooltipContent={`${issue.link_count}`}>
          <div className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1">
            <Link className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.link_count}</div>
          </div>
        </Tooltip>
      )}
    </div>
  );
});
