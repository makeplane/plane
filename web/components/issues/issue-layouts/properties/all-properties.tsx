import { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { differenceInCalendarDays } from "date-fns";
import { Layers, Link, Paperclip } from "lucide-react";
import xor from "lodash/xor";
// hooks
import { useEventTracker, useEstimate, useLabel, useIssues } from "hooks/store";
// components
import { IssuePropertyLabels } from "../properties/labels";
import { Tooltip } from "@plane/ui";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
import {
  DateDropdown,
  EstimateDropdown,
  PriorityDropdown,
  ProjectMemberDropdown,
  ModuleDropdown,
  CycleDropdown,
  StateDropdown,
} from "components/dropdowns";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
import { cn } from "helpers/common.helper";
// types
import { TIssue, IIssueDisplayProperties, TIssuePriorities } from "@plane/types";
// constants
import { ISSUE_UPDATED } from "constants/event-tracker";
import { EIssuesStoreType } from "constants/issue";

export interface IIssueProperties {
  issue: TIssue;
  handleIssues: (issue: TIssue) => Promise<void>;
  displayProperties: IIssueDisplayProperties | undefined;
  isReadOnly: boolean;
  className: string;
  activeLayout: string;
}

export const IssueProperties: React.FC<IIssueProperties> = observer((props) => {
  const { issue, handleIssues, displayProperties, activeLayout, isReadOnly, className } = props;
  // store hooks
  const { labelMap } = useLabel();
  const { captureIssueEvent } = useEventTracker();
  const {
    issues: { addModulesToIssue, removeModulesFromIssue },
  } = useIssues(EIssuesStoreType.MODULE);
  const {
    issues: { addIssueToCycle, removeIssueFromCycle },
  } = useIssues(EIssuesStoreType.CYCLE);
  // router
  const router = useRouter();
  const { workspaceSlug, cycleId, moduleId } = router.query;
  const { areEstimatesEnabledForCurrentProject } = useEstimate();
  const currentLayout = `${activeLayout} layout`;

  const issueOperations = useMemo(
    () => ({
      addModulesToIssue: async (moduleIds: string[]) => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await addModulesToIssue?.(workspaceSlug.toString(), issue.project_id, issue.id, moduleIds);
      },
      removeModulesFromIssue: async (moduleIds: string[]) => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await removeModulesFromIssue?.(workspaceSlug.toString(), issue.project_id, issue.id, moduleIds);
      },
      addIssueToCycle: async (cycleId: string) => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await addIssueToCycle?.(workspaceSlug.toString(), issue.project_id, cycleId, [issue.id]);
      },
      removeIssueFromCycle: async (cycleId: string) => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await removeIssueFromCycle?.(workspaceSlug.toString(), issue.project_id, cycleId, issue.id);
      },
    }),
    [workspaceSlug, issue, addModulesToIssue, removeModulesFromIssue, addIssueToCycle, removeIssueFromCycle]
  );

  const handleState = (stateId: string) => {
    handleIssues({ ...issue, state_id: stateId }).then(() => {
      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...issue, state: "SUCCESS", element: currentLayout },
        path: router.asPath,
        updates: {
          changed_property: "state",
          change_details: stateId,
        },
      });
    });
  };

  const handlePriority = (value: TIssuePriorities) => {
    handleIssues({ ...issue, priority: value }).then(() => {
      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...issue, state: "SUCCESS", element: currentLayout },
        path: router.asPath,
        updates: {
          changed_property: "priority",
          change_details: value,
        },
      });
    });
  };

  const handleLabel = (ids: string[]) => {
    handleIssues({ ...issue, label_ids: ids }).then(() => {
      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...issue, state: "SUCCESS", element: currentLayout },
        path: router.asPath,
        updates: {
          changed_property: "labels",
          change_details: ids,
        },
      });
    });
  };

  const handleAssignee = (ids: string[]) => {
    handleIssues({ ...issue, assignee_ids: ids }).then(() => {
      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...issue, state: "SUCCESS", element: currentLayout },
        path: router.asPath,
        updates: {
          changed_property: "assignees",
          change_details: ids,
        },
      });
    });
  };

  const handleModule = useCallback(
    (moduleIds: string[] | null) => {
      if (!issue || !issue.module_ids || !moduleIds) return;

      const updatedModuleIds = xor(issue.module_ids, moduleIds);
      const modulesToAdd: string[] = [];
      const modulesToRemove: string[] = [];
      for (const moduleId of updatedModuleIds)
        if (issue.module_ids.includes(moduleId)) modulesToRemove.push(moduleId);
        else modulesToAdd.push(moduleId);
      if (modulesToAdd.length > 0) issueOperations.addModulesToIssue(modulesToAdd);
      if (modulesToRemove.length > 0) issueOperations.removeModulesFromIssue(modulesToRemove);

      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...issue, state: "SUCCESS", element: currentLayout },
        path: router.asPath,
        updates: { changed_property: "module_ids", change_details: { module_ids: moduleIds } },
      });
    },
    [issueOperations, captureIssueEvent, currentLayout, router, issue]
  );

  const handleCycle = useCallback(
    (cycleId: string | null) => {
      if (!issue || issue.cycle_id === cycleId) return;
      if (cycleId) issueOperations.addIssueToCycle?.(cycleId);
      else issueOperations.removeIssueFromCycle?.(issue.cycle_id ?? "");

      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...issue, state: "SUCCESS", element: currentLayout },
        path: router.asPath,
        updates: { changed_property: "cycle", change_details: { cycle_id: cycleId } },
      });
    },
    [issue, issueOperations, captureIssueEvent, currentLayout, router.asPath]
  );

  const handleStartDate = (date: Date | null) => {
    handleIssues({ ...issue, start_date: date ? renderFormattedPayloadDate(date) : null }).then(() => {
      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...issue, state: "SUCCESS", element: currentLayout },
        path: router.asPath,
        updates: {
          changed_property: "start_date",
          change_details: date ? renderFormattedPayloadDate(date) : null,
        },
      });
    });
  };

  const handleTargetDate = (date: Date | null) => {
    handleIssues({ ...issue, target_date: date ? renderFormattedPayloadDate(date) : null }).then(() => {
      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...issue, state: "SUCCESS", element: currentLayout },
        path: router.asPath,
        updates: {
          changed_property: "target_date",
          change_details: date ? renderFormattedPayloadDate(date) : null,
        },
      });
    });
  };

  const handleEstimate = (value: number | null) => {
    handleIssues({ ...issue, estimate_point: value }).then(() => {
      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...issue, state: "SUCCESS", element: currentLayout },
        path: router.asPath,
        updates: {
          changed_property: "estimate_point",
          change_details: value,
        },
      });
    });
  };

  const redirectToIssueDetail = () => {
    router.push({
      pathname: `/${workspaceSlug}/projects/${issue.project_id}/${issue.archived_at ? "archived-issues" : "issues"}/${
        issue.id
      }`,
      hash: "sub-issues",
    });
  };

  if (!displayProperties) return null;

  const defaultLabelOptions = issue?.label_ids?.map((id) => labelMap[id]) || [];

  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? new Date(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  const targetDateDistance = issue.target_date ? differenceInCalendarDays(new Date(issue.target_date), new Date()) : 1;

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
            minDate={minDate ?? undefined}
            placeholder="Due date"
            buttonVariant={issue.target_date ? "border-with-text" : "border-without-text"}
            buttonClassName={targetDateDistance <= 0 ? "text-red-500" : ""}
            clearIconClassName="!text-custom-text-100"
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

      {/* modules */}
      {moduleId === undefined && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="modules">
          <div className="h-5">
            <ModuleDropdown
              projectId={issue?.project_id}
              value={issue?.module_ids ?? []}
              onChange={handleModule}
              disabled={isReadOnly}
              multiple
              buttonVariant="border-with-text"
              showCount={true}
              showTooltip
            />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* cycles */}
      {cycleId === undefined && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="cycle">
          <div className="h-5">
            <CycleDropdown
              projectId={issue?.project_id}
              value={issue?.cycle_id}
              onChange={handleCycle}
              disabled={isReadOnly}
              buttonVariant="border-with-text"
              showTooltip
            />
          </div>
        </WithDisplayPropertiesHOC>
      )}

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
        shouldRenderProperty={(properties) => !!properties.sub_issue_count && !!issue.sub_issues_count}
      >
        <Tooltip tooltipHeading="Sub-issues" tooltipContent={`${issue.sub_issues_count}`}>
          <div
            onClick={issue.sub_issues_count ? redirectToIssueDetail : () => {}}
            className={cn(
              "flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1",
              {
                "hover:bg-custom-background-80 cursor-pointer": issue.sub_issues_count,
              }
            )}
          >
            <Layers className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.sub_issues_count}</div>
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
        shouldRenderProperty={(properties) => !!properties.link && !!issue.link_count}
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
