// mobx
import { observer } from "mobx-react-lite";
// lucide icons
import { Circle, Layers, Link, Paperclip } from "lucide-react";
// components
import { IssuePropertyState } from "components/issues/issue-layouts/properties/state";
import { IssuePropertyPriority } from "components/issues/issue-layouts/properties/priority";
import { IssuePropertyLabels } from "components/issues/issue-layouts/properties/labels";
import { IssuePropertyAssignee } from "components/issues/issue-layouts/properties/assignee";
import { IssuePropertyEstimates } from "components/issues/issue-layouts/properties/estimates";
import { Tooltip } from "components/ui";

export interface IKanBanProperties {
  sub_group_id: string;
  columnId: string;
  issue: any;
  handleIssues?: (sub_group_by: string | null, group_by: string | null, issue: any) => void;
}

export const KanBanProperties: React.FC<IKanBanProperties> = observer(
  ({ sub_group_id, columnId: group_id, issue, handleIssues }) => {
    const handleState = (id: string) => {
      if (handleIssues)
        handleIssues(
          !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
          !group_id && group_id === "null" ? null : group_id,
          { ...issue, state: id }
        );
    };

    const handlePriority = (id: string) => {
      if (handleIssues)
        handleIssues(
          !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
          !group_id && group_id === "null" ? null : group_id,
          { ...issue, priority: id }
        );
    };

    const handleLabel = (ids: string[]) => {
      if (handleIssues)
        handleIssues(
          !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
          !group_id && group_id === "null" ? null : group_id,
          { ...issue, labels: ids }
        );
    };

    const handleAssignee = (ids: string[]) => {
      if (handleIssues)
        handleIssues(
          !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
          !group_id && group_id === "null" ? null : group_id,
          { ...issue, assignees: ids }
        );
    };

    const handleStartDate = (id: string) => {
      if (handleIssues)
        handleIssues(
          !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
          !group_id && group_id === "null" ? null : group_id,
          { ...issue, state: id }
        );
    };

    const handleTargetDate = (id: string) => {
      if (handleIssues)
        handleIssues(
          !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
          !group_id && group_id === "null" ? null : group_id,
          { ...issue, state: id }
        );
    };

    const handleEstimates = (id: string) => {
      if (handleIssues)
        handleIssues(
          !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
          !group_id && group_id === "null" ? null : group_id,
          { ...issue, state: id }
        );
    };

    return (
      <div className="relative flex gap-2 overflow-hidden overflow-x-auto whitespace-nowrap">
        {/* basic properties */}
        {/* state */}
        <IssuePropertyState
          value={issue?.state || null}
          dropdownArrow={false}
          onChange={(id: string) => handleState(id)}
          disabled={false}
        />

        {/* priority */}
        <IssuePropertyPriority
          value={issue?.priority || null}
          dropdownArrow={false}
          onChange={(id: string) => handlePriority(id)}
          disabled={false}
        />

        {/* label */}
        <IssuePropertyLabels
          value={issue?.labels || null}
          dropdownArrow={false}
          onChange={(ids: string[]) => handleLabel(ids)}
          disabled={false}
        />

        {/* assignee */}
        <IssuePropertyAssignee
          value={issue?.assignees || null}
          dropdownArrow={false}
          onChange={(ids: string[]) => handleAssignee(ids)}
          disabled={false}
        />

        {/* start date */}
        {/* <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
          <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
            <Circle width={10} strokeWidth={2} />
          </div>
          <div className="pl-0.5 pr-1 text-xs">start date</div>
        </div> */}

        {/* target/due date */}
        {/* <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center">
          <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
            <Circle width={10} strokeWidth={2} />
          </div>
          <div className="pl-0.5 pr-1 text-xs">target/due date</div>
        </div> */}

        {/* estimates */}
        {/* <IssuePropertyEstimates
          value={issue?.state || null}
          dropdownArrow={false}
          onChange={(id: string) => handleEstimates(id)}
          disabled={false}
        /> */}

        {/* extra render properties */}
        {/* sub-issues */}
        <Tooltip tooltipHeading="Sub-issue" tooltipContent={`${issue.sub_issues_count}`}>
          <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center cursor-pointer">
            <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
              <Layers width={10} strokeWidth={2} />
            </div>
            <div className="pl-0.5 pr-1 text-xs">{issue.sub_issues_count}</div>
          </div>
        </Tooltip>

        {/* attachments */}
        <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`}>
          <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center cursor-pointer">
            <div className="flex-shrink-0 w-[16px] h-[16px] flex justify-center items-center">
              <Paperclip width={10} strokeWidth={2} />
            </div>
            <div className="pl-0.5 pr-1 text-xs">{issue.attachment_count}</div>
          </div>
        </Tooltip>

        {/* link */}
        <Tooltip tooltipHeading="Links" tooltipContent={`${issue.link_count}`}>
          <div className="flex-shrink-0 border border-custom-border-300 min-w-[22px] h-[22px] overflow-hidden rounded-sm flex justify-center items-center cursor-pointer">
            <div className="flex-shrink-0  w-[16px] h-[16px] flex justify-center items-center">
              <Link width={10} strokeWidth={2} />
            </div>
            <div className="pl-0.5 pr-1 text-xs">{issue.link_count}</div>
          </div>
        </Tooltip>
      </div>
    );
  }
);
