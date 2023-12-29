// mobx
import { observer } from "mobx-react-lite";
// lucide icons
import { Layers, Link, Paperclip } from "lucide-react";
// components
import { IssuePropertyState } from "../properties/state";
import { IssuePropertyPriority } from "../properties/priority";
import { IssuePropertyLabels } from "../properties/labels";
import { IssuePropertyDate } from "../properties/date";
import { Tooltip } from "@plane/ui";
import { TIssue, IIssueDisplayProperties, IState, TIssuePriorities } from "@plane/types";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
import { IssuePropertyEstimates } from "./estimates";
import { IssuePropertyAssignee } from "./assignee";
import { useLabel, useProjectState } from "hooks/store";

export interface IIssueProperties {
  issue: TIssue;
  handleIssues: (issue: TIssue) => void;
  displayProperties: IIssueDisplayProperties | undefined;
  isReadOnly: boolean;
  className: string;
}

export const IssueProperties: React.FC<IIssueProperties> = observer((props) => {
  const { issue, handleIssues, displayProperties, isReadOnly, className } = props;

  const { stateMap } = useProjectState();
  const { labelMap } = useLabel();

  const handleState = (state: IState) => {
    handleIssues({ ...issue, state_id: state.id });
  };

  const handlePriority = (value: TIssuePriorities) => {
    handleIssues({ ...issue, priority: value });
  };

  const handleLabel = (ids: string[]) => {
    handleIssues({ ...issue, label_ids: ids });
  };

  const handleAssignee = (ids: string[]) => {
    handleIssues({ ...issue, assignee_ids: ids });
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

  if (!displayProperties) return null;

  const defaultStateOptions = [stateMap[issue?.state_id]];
  const defaultLabelOptions = issue?.label_ids?.map((id) => labelMap[id]) || [];

  return (
    <div className={className}>
      {/* basic properties */}
      {/* state */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="state">
        <IssuePropertyState
          projectId={issue?.project_id || null}
          value={issue?.state_id || null}
          defaultOptions={defaultStateOptions}
          onChange={handleState}
          disabled={isReadOnly}
          hideDropdownArrow
        />
      </WithDisplayPropertiesHOC>

      {/* priority */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="priority">
        <IssuePropertyPriority
          value={issue?.priority}
          onChange={handlePriority}
          disabled={isReadOnly}
          hideDropdownArrow
        />
      </WithDisplayPropertiesHOC>

      {/* label */}

      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="labels">
        <IssuePropertyLabels
          projectId={issue?.project_id || null}
          value={issue?.label_ids || null}
          defaultOptions={defaultLabelOptions}
          onChange={handleLabel}
          disabled={isReadOnly}
          hideDropdownArrow
        />
      </WithDisplayPropertiesHOC>

      {/* start date */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="start_date">
        <IssuePropertyDate
          value={issue?.start_date || null}
          onChange={(date: string) => handleStartDate(date)}
          disabled={isReadOnly}
          type="start_date"
        />
      </WithDisplayPropertiesHOC>

      {/* target/due date */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="due_date">
        <IssuePropertyDate
          value={issue?.target_date || null}
          onChange={(date: string) => handleTargetDate(date)}
          disabled={isReadOnly}
          type="target_date"
        />
      </WithDisplayPropertiesHOC>

      {/* assignee */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="assignee">
        <IssuePropertyAssignee
          projectId={issue?.project_id || null}
          value={issue?.assignee_ids || null}
          hideDropdownArrow
          onChange={handleAssignee}
          disabled={isReadOnly}
          multiple
        />
      </WithDisplayPropertiesHOC>

      {/* estimates */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="estimate">
        <IssuePropertyEstimates
          projectId={issue?.project_id || null}
          value={issue?.estimate_point || null}
          onChange={handleEstimate}
          disabled={isReadOnly}
          hideDropdownArrow
        />
      </WithDisplayPropertiesHOC>

      {/* extra render properties */}
      {/* sub-issues */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="sub_issue_count"
        shouldRenderProperty={!!issue?.sub_issues_count}
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
        displayProperties={displayProperties}
        displayPropertyKey="attachment_count"
        shouldRenderProperty={!!issue?.attachment_count}
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
        displayProperties={displayProperties}
        displayPropertyKey="link"
        shouldRenderProperty={!!issue?.link_count}
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
