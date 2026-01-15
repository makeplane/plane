import { observer } from "mobx-react";
import { Paperclip } from "lucide-react";
import { LinkIcon, ViewsIcon } from "@plane/propel/icons";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import type { IIssueDisplayProperties } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/with-display-properties-HOC";
// helpers
import { getDate } from "@/helpers/date-time.helper";
//// hooks
import type { IIssue } from "@/types/issue";
import { IssueBlockCycle } from "./cycle";
import { IssueBlockDate } from "./due-date";
import { IssueBlockLabels } from "./labels";
import { IssueBlockMembers } from "./member";
import { IssueBlockModules } from "./modules";
import { IssueBlockPriority } from "./priority";
import { IssueBlockState } from "./state";

export interface IIssueProperties {
  issue: IIssue;
  displayProperties: IIssueDisplayProperties | undefined;
  className: string;
}

export const IssueProperties = observer(function IssueProperties(props: IIssueProperties) {
  const { issue, displayProperties, className } = props;

  if (!displayProperties || !issue.project_id) return null;

  const minDate = getDate(issue.start_date);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(issue.target_date);
  maxDate?.setDate(maxDate.getDate());

  return (
    <div className={className}>
      {/* basic properties */}
      {/* state */}
      {issue.state_id && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="state">
          <div className="h-5">
            <IssueBlockState stateId={issue.state_id} />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* priority */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="priority">
        <div className="h-5">
          <IssueBlockPriority priority={issue.priority} />
        </div>
      </WithDisplayPropertiesHOC>

      {/* label */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="labels">
        <div className="h-5">
          <IssueBlockLabels labelIds={issue.label_ids} />
        </div>
      </WithDisplayPropertiesHOC>

      {/* start date */}
      {issue?.start_date && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="start_date">
          <div className="h-5">
            <IssueBlockDate
              due_date={issue?.start_date}
              stateId={issue?.state_id ?? undefined}
              shouldHighLight={false}
            />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* target/due date */}
      {issue?.target_date && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="due_date">
          <div className="h-5">
            <IssueBlockDate due_date={issue?.target_date} stateId={issue?.state_id ?? undefined} />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* assignee */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="assignee">
        <div className="h-5">
          <IssueBlockMembers memberIds={issue.assignee_ids} />
        </div>
      </WithDisplayPropertiesHOC>

      {/* modules */}
      {issue.module_ids && issue.module_ids.length > 0 && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="modules">
          <div className="h-5">
            <IssueBlockModules moduleIds={issue.module_ids} />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* cycles */}
      {issue.cycle_id && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="cycle">
          <div className="h-5">
            <IssueBlockCycle cycleId={issue.cycle_id} />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* estimates */}
      {/* {projectId && areEstimateEnabledByProjectId(projectId?.toString()) && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="estimate">
          <div className="h-5">
            <EstimateDropdown
              value={issue.estimate_point ?? undefined}
              onChange={handleEstimate}
              projectId={issue.project_id}
              disabled={isReadOnly}
              buttonVariant="border-with-text"
              showTooltip
            />
          </div>
        </WithDisplayPropertiesHOC>
      )} */}

      {/* extra render properties */}
      {/* sub-issues */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="sub_issue_count"
        shouldRenderProperty={(properties) => !!properties.sub_issue_count && !!issue.sub_issues_count}
      >
        <Tooltip tooltipHeading="Sub-work items" tooltipContent={`${issue.sub_issues_count}`}>
          <div
            className={cn(
              "flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-sm border-[0.5px] border-strong px-2.5 py-1",
              {
                "hover:bg-layer-1 cursor-pointer": issue.sub_issues_count,
              }
            )}
          >
            <ViewsIcon className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-11">{issue.sub_issues_count}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>

      {/* attachments */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="attachment_count"
        shouldRenderProperty={(properties) => !!properties.attachment_count && !!issue.attachment_count}
      >
        <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`}>
          <div className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-sm border-[0.5px] border-strong px-2.5 py-1">
            <Paperclip className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-11">{issue.attachment_count}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>

      {/* link */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="link"
        shouldRenderProperty={(properties) => !!properties.link && !!issue.link_count}
      >
        <Tooltip tooltipHeading="Links" tooltipContent={`${issue.link_count}`}>
          <div className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-sm border-[0.5px] border-strong px-2.5 py-1">
            <LinkIcon className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-11">{issue.link_count}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>
    </div>
  );
});
