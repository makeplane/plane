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
import { IIssue, IState, TIssuePriorities } from "types";
import {
  ICycleIssuesFilterStore,
  IModuleIssuesFilterStore,
  IProfileIssuesFilterStore,
  IProjectIssuesFilterStore,
  IViewIssuesFilterStore,
} from "store_legacy/issues";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";

export interface IKanBanProperties {
  issue: IIssue;
  handleIssues: (issue: IIssue) => void;
  issuesFilter:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore
    | IProfileIssuesFilterStore;
  showEmptyGroup: boolean;
  isReadOnly: boolean;
}

export const KanBanProperties: React.FC<IKanBanProperties> = observer((props) => {
  const { issue, handleIssues, issuesFilter, isReadOnly } = props;

  const handleState = (state: IState) => {
    handleIssues({ ...issue, state: state.id });
  };

  const handlePriority = (value: TIssuePriorities) => {
    handleIssues({ ...issue, priority: value });
  };

  const handleLabel = (ids: string[]) => {
    handleIssues({ ...issue, labels: ids });
  };

  const handleAssignee = (ids: string[]) => {
    handleIssues({ ...issue, assignees: ids });
  };

  const handleStartDate = (date: string) => {
    handleIssues({ ...issue, start_date: date });
  };

  const handleTargetDate = (date: string) => {
    handleIssues({ ...issue, target_date: date });
  };

  const handleEstimate = (value: number | null) => {
    handleIssues({ ...issue, estimate_point: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
      {/* basic properties */}
      {/* state */}
      <WithDisplayPropertiesHOC
        issuesFilter={issuesFilter}
        getShouldRenderProperty={(displayProperties) => displayProperties && displayProperties?.state}
      >
        <IssuePropertyState
          projectId={issue?.project_detail?.id || null}
          value={issue?.state || null}
          defaultOptions={issue?.state_detail ? [issue.state_detail] : []}
          onChange={handleState}
          disabled={isReadOnly}
          hideDropdownArrow
        />
      </WithDisplayPropertiesHOC>

      {/* priority */}
      <WithDisplayPropertiesHOC
        issuesFilter={issuesFilter}
        getShouldRenderProperty={(displayProperties) => displayProperties && displayProperties?.priority}
      >
        <IssuePropertyPriority
          value={issue?.priority || null}
          onChange={handlePriority}
          disabled={isReadOnly}
          hideDropdownArrow
        />
      </WithDisplayPropertiesHOC>

      {/* label */}

      <WithDisplayPropertiesHOC
        issuesFilter={issuesFilter}
        getShouldRenderProperty={(displayProperties) => displayProperties && displayProperties?.labels}
      >
        <IssuePropertyLabels
          projectId={issue?.project_detail?.id || null}
          value={issue?.labels || null}
          defaultOptions={issue?.label_details ? issue.label_details : []}
          onChange={handleLabel}
          disabled={isReadOnly}
          hideDropdownArrow
        />
      </WithDisplayPropertiesHOC>

      {/* start date */}
      <WithDisplayPropertiesHOC
        issuesFilter={issuesFilter}
        getShouldRenderProperty={(displayProperties) => displayProperties?.start_date}
      >
        <IssuePropertyDate
          value={issue?.start_date || null}
          onChange={(date: string) => handleStartDate(date)}
          disabled={isReadOnly}
          type="start_date"
        />
      </WithDisplayPropertiesHOC>

      {/* target/due date */}
      <WithDisplayPropertiesHOC
        issuesFilter={issuesFilter}
        getShouldRenderProperty={(displayProperties) => displayProperties?.due_date}
      >
        <IssuePropertyDate
          value={issue?.target_date || null}
          onChange={(date: string) => handleTargetDate(date)}
          disabled={isReadOnly}
          type="target_date"
        />
      </WithDisplayPropertiesHOC>

      {/* assignee */}
      <WithDisplayPropertiesHOC
        issuesFilter={issuesFilter}
        getShouldRenderProperty={(displayProperties) => displayProperties?.assignee}
      >
        <IssuePropertyAssignee
          projectId={issue?.project_detail?.id || null}
          value={issue?.assignees || null}
          defaultOptions={issue?.assignee_details ? issue.assignee_details : []}
          hideDropdownArrow
          onChange={handleAssignee}
          disabled={isReadOnly}
          multiple
        />
      </WithDisplayPropertiesHOC>

      {/* estimates */}
      <WithDisplayPropertiesHOC
        issuesFilter={issuesFilter}
        getShouldRenderProperty={(displayProperties) => displayProperties?.estimate}
      >
        <IssuePropertyEstimates
          projectId={issue?.project_detail?.id || null}
          value={issue?.estimate_point || null}
          onChange={handleEstimate}
          disabled={isReadOnly}
          hideDropdownArrow
        />
      </WithDisplayPropertiesHOC>

      {/* extra render properties */}
      {/* sub-issues */}
      <WithDisplayPropertiesHOC
        issuesFilter={issuesFilter}
        getShouldRenderProperty={(displayProperties) => displayProperties?.sub_issue_count && !!issue?.sub_issues_count}
      >
        <Tooltip tooltipHeading="Sub-issues" tooltipContent={`${issue.sub_issues_count}`}>
          <div className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1">
            <Layers className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.sub_issues_count}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>

      {/* attachments */}
      <WithDisplayPropertiesHOC
        issuesFilter={issuesFilter}
        getShouldRenderProperty={(displayProperties) =>
          displayProperties?.attachment_count && !!issue?.attachment_count
        }
      >
        <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`}>
          <div className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1">
            <Paperclip className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.attachment_count}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>

      {/* link */}
      <WithDisplayPropertiesHOC
        issuesFilter={issuesFilter}
        getShouldRenderProperty={(displayProperties) => displayProperties?.link && !!issue?.link_count}
      >
        <Tooltip tooltipHeading="Links" tooltipContent={`${issue.link_count}`}>
          <div className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1">
            <Link className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.link_count}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>
    </div>
  );
});
