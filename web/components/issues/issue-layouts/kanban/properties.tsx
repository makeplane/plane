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
import { IEstimatePoint, IIssue, IIssueLabels, IState, IUserLite, TIssuePriorities } from "types";

export interface IKanBanProperties {
  sub_group_id: string;
  columnId: string;
  issue: IIssue;
  handleIssues: (sub_group_by: string | null, group_by: string | null, issue: any) => void;
  display_properties: any;
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
    display_properties,
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
    <div className="relative flex gap-2 overflow-x-auto whitespace-nowrap">
      {/* basic properties */}
      {/* state */}
      {display_properties && display_properties?.state && (
        <IssuePropertyState
          value={issue?.state_detail || null}
          onChange={handleState}
          states={states}
          disabled={false}
          hideDropdownArrow={true}
        />
      )}

      {/* priority */}
      {display_properties && display_properties?.priority && (
        <IssuePropertyPriority
          value={issue?.priority || null}
          onChange={handlePriority}
          disabled={false}
          hideDropdownArrow={true}
        />
      )}

      {/* label */}
      {display_properties && display_properties?.labels && (
        <IssuePropertyLabels
          value={issue?.labels || null}
          dropdownArrow={false}
          onChange={(ids: string[]) => handleLabel(ids)}
          disabled={false}
        />
      )}

      {/* assignee */}
      {display_properties && display_properties?.assignee && (
        <IssuePropertyAssignee
          value={issue?.assignees || null}
          hideDropdownArrow={true}
          onChange={handleAssignee}
          members={members}
          disabled={false}
        />
      )}

      {/* start date */}
      {display_properties && display_properties?.start_date && (
        <IssuePropertyDate
          value={issue?.start_date || null}
          onChange={(date: string) => handleStartDate(date)}
          disabled={false}
        />
      )}

      {/* target/due date */}
      {display_properties && display_properties?.due_date && (
        <IssuePropertyDate
          value={issue?.target_date || null}
          onChange={(date: string) => handleTargetDate(date)}
          disabled={false}
        />
      )}

      {/* estimates */}
      {display_properties && display_properties?.estimate && (
        <IssuePropertyEstimates
          value={issue?.estimate_point || null}
          onChange={handleEstimate}
          estimatePoints={estimates}
          disabled={false}
          hideDropdownArrow={true}
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
