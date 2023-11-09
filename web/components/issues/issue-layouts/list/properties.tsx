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

export interface IKanBanProperties {
  columnId: string;
  issue: IIssue;
  handleIssues: (group_by: string | null, issue: IIssue) => void;
  displayProperties: IIssueDisplayProperties;
  isReadonly?: boolean;
  showEmptyGroup?: boolean;
}

export const KanBanProperties: FC<IKanBanProperties> = observer((props) => {
  const { columnId: group_id, issue, handleIssues, displayProperties, isReadonly, showEmptyGroup } = props;

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
          value={issue?.state_detail || null}
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
      {displayProperties && displayProperties?.labels && (showEmptyGroup || issue?.labels.length > 0) && (
        <IssuePropertyLabels
          projectId={issue?.project_detail?.id || null}
          value={issue?.labels || null}
          onChange={handleLabel}
          disabled={isReadonly}
          hideDropdownArrow
        />
      )}

      {/* assignee */}
      {displayProperties && displayProperties?.assignee && (showEmptyGroup || issue?.assignees?.length > 0) && (
        <IssuePropertyAssignee
          projectId={issue?.project_detail?.id || null}
          value={issue?.assignees || null}
          hideDropdownArrow
          onChange={handleAssignee}
          disabled={isReadonly}
          multiple
        />
      )}

      {/* start date */}
      {displayProperties && displayProperties?.start_date && (showEmptyGroup || issue?.start_date) && (
        <IssuePropertyDate
          value={issue?.start_date || null}
          onChange={(date: string) => handleStartDate(date)}
          disabled={isReadonly}
          placeHolder="Start date"
        />
      )}

      {/* target/due date */}
      {displayProperties && displayProperties?.due_date && (showEmptyGroup || issue?.target_date) && (
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
