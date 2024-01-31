import { observer } from "mobx-react-lite";
import { CalendarCheck2, CalendarClock, Layers, Link, Paperclip } from "lucide-react";
// hooks
import { useEstimate, useLabel } from "hooks/store";
// components
import { IssuePropertyLabels } from "../properties/labels";
import { Tooltip } from "@plane/ui";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
import {
  DateDropdown,
  EstimateDropdown,
  PriorityDropdown,
  ProjectMemberDropdown,
  StateDropdown,
} from "components/dropdowns";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { TIssue, IIssueDisplayProperties, TIssuePriorities } from "@plane/types";

export interface IIssueProperties {
  issue: TIssue;
  handleIssues: (issue: TIssue) => void;
  displayProperties: IIssueDisplayProperties | undefined;
  isReadOnly: boolean;
  className: string;
}

export const IssueProperties: React.FC<IIssueProperties> = observer((props) => {
  const { issue, handleIssues, displayProperties, isReadOnly, className } = props;
  const { labelMap } = useLabel();
  const { areEstimatesEnabledForCurrentProject } = useEstimate();

  const handleState = (stateId: string) => {
    handleIssues({ ...issue, state_id: stateId });
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

  const handleStartDate = (date: Date | null) => {
    handleIssues({ ...issue, start_date: date ? renderFormattedPayloadDate(date) : null });
  };

  const handleTargetDate = (date: Date | null) => {
    handleIssues({ ...issue, target_date: date ? renderFormattedPayloadDate(date) : null });
  };

  const handleEstimate = (value: number | null) => {
    handleIssues({ ...issue, estimate_point: value });
  };

  if (!displayProperties) return null;

  const defaultLabelOptions = issue?.label_ids?.map((id) => labelMap[id]) || [];

  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? new Date(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <div className={className}>
      {/* basic properties */}
      {/* state */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="state">
        <div className="h-5">
          <StateDropdown
            value={issue.state_id}
            onChange={handleState}
            projectId={issue.project_id}
            disabled={isReadOnly}
            buttonVariant="border-with-text"
            showTooltip
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* priority */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="priority">
        <div className="h-5">
          <PriorityDropdown
            value={issue?.priority || null}
            onChange={handlePriority}
            disabled={isReadOnly}
            buttonVariant="border-without-text"
            buttonClassName="border"
            showTooltip
          />
        </div>
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
        <div className="h-5">
          <DateDropdown
            value={issue.start_date ?? null}
            onChange={handleStartDate}
            icon={<CalendarClock className="h-3 w-3 flex-shrink-0" />}
            maxDate={maxDate ?? undefined}
            placeholder="Start date"
            buttonVariant={issue.start_date ? "border-with-text" : "border-without-text"}
            disabled={isReadOnly}
            showTooltip
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* target/due date */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="due_date">
        <div className="h-5">
          <DateDropdown
            value={issue?.target_date ?? null}
            onChange={handleTargetDate}
            icon={<CalendarCheck2 className="h-3 w-3 flex-shrink-0" />}
            minDate={minDate ?? undefined}
            placeholder="Due date"
            buttonVariant={issue.target_date ? "border-with-text" : "border-without-text"}
            disabled={isReadOnly}
            showTooltip
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* assignee */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="assignee">
        <div className="h-5">
          <ProjectMemberDropdown
            projectId={issue?.project_id}
            value={issue?.assignee_ids}
            onChange={handleAssignee}
            disabled={isReadOnly}
            multiple
            buttonVariant={issue.assignee_ids?.length > 0 ? "transparent-without-text" : "border-without-text"}
            buttonClassName={issue.assignee_ids?.length > 0 ? "hover:bg-transparent px-0" : ""}
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* estimates */}
      {areEstimatesEnabledForCurrentProject && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="estimate">
          <div className="h-5">
            <EstimateDropdown
              value={issue.estimate_point}
              onChange={handleEstimate}
              projectId={issue.project_id}
              disabled={isReadOnly}
              buttonVariant="border-with-text"
              showTooltip
            />
          </div>
        </WithDisplayPropertiesHOC>
      )}

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
