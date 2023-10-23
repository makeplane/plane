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
import { IIssue } from "types";

export interface IKanBanProperties {
  columnId: string;
  issue: any;
  handleIssues?: (group_by: string | null, issue: IIssue) => void;
  display_properties: any;
  states: any;
  labels: any;
  members: any;
  priorities: any;
}

export const KanBanProperties: FC<IKanBanProperties> = observer((props) => {
  const { columnId: group_id, issue, handleIssues, display_properties, states, labels, members, priorities } = props;

  const handleState = (id: string) => {
    if (handleIssues) handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, state: id });
  };

  const handlePriority = (id: string) => {
    if (handleIssues) handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, priority: id });
  };

  const handleLabel = (ids: string[]) => {
    if (handleIssues) handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, labels: ids });
  };

  const handleAssignee = (ids: string[]) => {
    if (handleIssues) handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, assignees: ids });
  };

  const handleStartDate = (date: string) => {
    if (handleIssues) handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, start_date: date });
  };

  const handleTargetDate = (date: string) => {
    if (handleIssues) handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, target_date: date });
  };

  const handleEstimate = (id: string) => {
    if (handleIssues)
      handleIssues(!group_id && group_id === "null" ? null : group_id, { ...issue, estimate_point: id });
  };

  return (
    <div className="relative flex gap-2 overflow-x-auto whitespace-nowrap">
      {/* basic properties */}
      {/* state */}
      {display_properties && display_properties?.state && states && (
        <IssuePropertyState
          value={issue?.state || null}
          dropdownArrow={false}
          onChange={(id: string) => handleState(id)}
          disabled={false}
          list={states}
        />
      )}

      {/* priority */}
      {display_properties && display_properties?.priority && priorities && (
        <IssuePropertyPriority
          value={issue?.priority || null}
          dropdownArrow={false}
          onChange={(id: string) => handlePriority(id)}
          disabled={false}
          list={priorities}
        />
      )}

      {/* label */}
      {display_properties && display_properties?.labels && labels && (
        <IssuePropertyLabels
          value={issue?.labels || null}
          dropdownArrow={false}
          onChange={(ids: string[]) => handleLabel(ids)}
          disabled={false}
          list={labels}
        />
      )}

      {/* assignee */}
      {display_properties && display_properties?.assignee && members && (
        <IssuePropertyAssignee
          value={issue?.assignees || null}
          dropdownArrow={false}
          onChange={(ids: string[]) => handleAssignee(ids)}
          disabled={false}
          list={members}
        />
      )}

      {/* start date */}
      {display_properties && display_properties?.start_date && (
        <IssuePropertyDate
          value={issue?.start_date || null}
          onChange={(date: string) => handleStartDate(date)}
          disabled={false}
          placeHolder={`Start date`}
        />
      )}

      {/* target/due date */}
      {display_properties && display_properties?.due_date && (
        <IssuePropertyDate
          value={issue?.target_date || null}
          onChange={(date: string) => handleTargetDate(date)}
          disabled={false}
          placeHolder={`Target date`}
        />
      )}

      {/* estimates */}
      {display_properties && display_properties?.estimate && (
        <IssuePropertyEstimates
          value={issue?.estimate_point?.toString() || null}
          dropdownArrow={false}
          onChange={(id: string) => handleEstimate(id)}
          disabled={false}
          workspaceSlug={issue?.workspace_detail?.slug || null}
          projectId={issue?.project_detail?.id || null}
        />
      )}

      {/* extra render properties */}
      {/* sub-issues */}
      {display_properties && display_properties?.sub_issue_count && (
        <Tooltip tooltipHeading="Sub-issue" tooltipContent={`${issue.sub_issues_count}`}>
          <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center cursor-pointer">
            <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
              <Layers width={10} strokeWidth={2} />
            </div>
            <div className="pl-0.5 pr-1 text-xs">{issue.sub_issues_count}</div>
          </div>
        </Tooltip>
      )}

      {/* attachments */}
      {display_properties && display_properties?.attachment_count && (
        <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`}>
          <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center cursor-pointer">
            <div className="flex-shrink-0 w-[16px] h-[16px] flex justify-center items-center">
              <Paperclip width={10} strokeWidth={2} />
            </div>
            <div className="pl-0.5 pr-1 text-xs">{issue.attachment_count}</div>
          </div>
        </Tooltip>
      )}

      {/* link */}
      {display_properties && display_properties?.link && (
        <Tooltip tooltipHeading="Links" tooltipContent={`${issue.link_count}`}>
          <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center cursor-pointer">
            <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
              <Link width={10} strokeWidth={2} />
            </div>
            <div className="pl-0.5 pr-1 text-xs">{issue.link_count}</div>
          </div>
        </Tooltip>
      )}
    </div>
  );
});
