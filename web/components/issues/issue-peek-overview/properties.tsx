import { FC } from "react";
// ui icons
import { DoubleCircleIcon, UserGroupIcon } from "@plane/ui";
import { CalendarDays, Signal } from "lucide-react";
// components
import { IssuePropertyState } from "components/issues/issue-layouts/properties/state";
import { IssuePropertyAssignee } from "components/issues/issue-layouts/properties/assignee";
import { IssuePropertyDate } from "../issue-layouts/properties/date";
import { IssuePropertyPriority } from "../issue-layouts/properties/priority";
// types
import { IIssue, IState, TIssuePriorities } from "types";

interface IPeekOverviewProperties {
  issue: IIssue;
  issueUpdate: (issue: Partial<IIssue>) => void;
}

export const PeekOverviewProperties: FC<IPeekOverviewProperties> = (props) => {
  const { issue, issueUpdate } = props;

  const handleState = (_state: IState) => {
    issueUpdate({ ...issue, state: _state.id });
  };

  const handlePriority = (_priority: TIssuePriorities) => {
    issueUpdate({ ...issue, priority: _priority });
  };

  const handleAssignee = (_assignees: string[]) => {
    issueUpdate({ ...issue, assignees: _assignees });
  };

  const handleStartDate = (_startDate: string) => {
    issueUpdate({ ...issue, start_date: _startDate });
  };

  const handleTargetDate = (_targetDate: string) => {
    issueUpdate({ ...issue, target_date: _targetDate });
  };

  return (
    <div className="flex flex-col gap-5 w-80 py-5">
      {/* state */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-2 w-1/2">
          <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium text-custom-text-200 line-clamp-1">State</span>
        </div>
        <div className="w-1/2">
          <IssuePropertyState
            projectId={issue?.project_detail?.id || null}
            value={issue?.state_detail || null}
            onChange={handleState}
            disabled={false}
            hideDropdownArrow={true}
          />
        </div>
      </div>

      {/* assignees */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-2 w-1/2">
          <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium text-custom-text-200 line-clamp-1">Assignees</span>
        </div>
        <div className="w-1/2">
          <IssuePropertyAssignee
            projectId={issue?.project_detail?.id || null}
            value={issue?.assignees || null}
            onChange={(ids: string[]) => handleAssignee(ids)}
            disabled={false}
            hideDropdownArrow={true}
          />
        </div>
      </div>

      {/* priority */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-2 w-1/2">
          <Signal className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium text-custom-text-200 line-clamp-1">Priority</span>
        </div>
        <div className="w-1/2">
          <IssuePropertyPriority
            value={issue?.priority || null}
            onChange={handlePriority}
            disabled={false}
            hideDropdownArrow={true}
          />
        </div>
      </div>

      {/* start_date */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-2 w-1/2">
          <CalendarDays className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium text-custom-text-200 line-clamp-1">Start date</span>
        </div>
        <div className="w-1/2">
          <IssuePropertyDate
            value={issue?.start_date || null}
            onChange={(date: string) => handleStartDate(date)}
            disabled={false}
            placeHolder={`Start date`}
          />
        </div>
      </div>

      {/* target_date */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-2 w-1/2">
          <CalendarDays className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium text-custom-text-200 line-clamp-1">Target date</span>
        </div>
        <div className="w-1/2">
          <IssuePropertyDate
            value={issue?.target_date || null}
            onChange={(date: string) => handleTargetDate(date)}
            disabled={false}
            placeHolder={`Target date`}
          />
        </div>
      </div>
    </div>
  );
};
