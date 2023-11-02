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
import { IIssue, IState, TIssuePriorities } from "types";

export interface IKanBanProperties {
  columnId: string;
  issue: IIssue;
  handleIssues: (group_by: string | null, issue: IIssue) => void;
  display_properties: any;
  isReadonly?: boolean;
  showEmptyGroup?: boolean;
}

export const KanBanProperties: FC<IKanBanProperties> = observer((props) => {
  const { columnId: group_id, issue, handleIssues, display_properties, isReadonly, showEmptyGroup } = props;

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
    <div className="relative flex gap-2 overflow-x-auto whitespace-nowrap">
      {/* basic properties */}
      {/* state */}
      {display_properties && display_properties?.state && (
        <IssuePropertyState
          projectId={issue?.project_detail?.id || null}
          value={issue?.state_detail || null}
          hideDropdownArrow
          onChange={handleState}
          disabled={false}
        />
      )}

      {/* priority */}
      {display_properties && display_properties?.priority && (
        <IssuePropertyPriority
          value={issue?.priority || null}
          onChange={handlePriority}
          disabled={false}
          hideDropdownArrow
        />
      )}

      {/* label */}
      {display_properties && display_properties?.labels && (showEmptyGroup || issue?.labels.length > 0) && (
        <IssuePropertyLabels
          projectId={issue?.project_detail?.id || null}
          value={issue?.labels || null}
          onChange={handleLabel}
          disabled={false}
          hideDropdownArrow
        />
      )}

      {/* assignee */}
      {display_properties && display_properties?.assignee && (showEmptyGroup || issue?.assignees?.length > 0) && (
        <IssuePropertyAssignee
          projectId={issue?.project_detail?.id || null}
          value={issue?.assignees || null}
          hideDropdownArrow
          onChange={handleAssignee}
          disabled={false}
        />
      )}

      {/* start date */}
      {display_properties && display_properties?.start_date && (showEmptyGroup || issue?.start_date) && (
        <IssuePropertyDate
          value={issue?.start_date || null}
          onChange={(date: string) => handleStartDate(date)}
          disabled={false}
          placeHolder="Start date"
        />
      )}

      {/* target/due date */}
      {display_properties && display_properties?.due_date && (showEmptyGroup || issue?.target_date) && (
        <IssuePropertyDate
          value={issue?.target_date || null}
          onChange={(date: string) => handleTargetDate(date)}
          disabled={false}
          placeHolder="Target date"
        />
      )}

      {/* estimates */}
      {display_properties && display_properties?.estimate && (
        <IssuePropertyEstimates
          projectId={issue?.project_detail?.id || null}
          value={issue?.estimate_point || null}
          hideDropdownArrow
          onChange={handleEstimate}
          disabled={false}
        />
      )}

      {/* extra render properties */}
      {/* sub-issues */}
      {display_properties && display_properties?.sub_issue_count && (
        <Tooltip tooltipHeading="Sub-issues" tooltipContent={`${issue.sub_issues_count}`}>
          <div className="flex-shrink-0 border-[0.5px] border-custom-border-300 overflow-hidden rounded flex justify-center items-center gap-2 px-2.5 py-1 h-5">
            <Layers className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.sub_issues_count}</div>
          </div>
        </Tooltip>
      )}

      {/* attachments */}
      {display_properties && display_properties?.attachment_count && (
        <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`}>
          <div className="flex-shrink-0 border-[0.5px] border-custom-border-300 overflow-hidden rounded flex justify-center items-center gap-2 px-2.5 py-1 h-5">
            <Paperclip className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.attachment_count}</div>
          </div>
        </Tooltip>
      )}

      {/* link */}
      {display_properties && display_properties?.link && (
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
