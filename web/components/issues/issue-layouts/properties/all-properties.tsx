import { useCallback, useMemo } from "react";
import xor from "lodash/xor";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// icons
import { CalendarCheck2, CalendarClock, Layers, Link, Paperclip } from "lucide-react";
// types
import { TIssue, IIssueDisplayProperties, TIssuePriorities } from "@plane/types";
// ui
import { Tooltip } from "@plane/ui";
// components
import {
  DateDropdown,
  EstimateDropdown,
  PriorityDropdown,
  MemberDropdown,
  ModuleDropdown,
  CycleDropdown,
  StateDropdown,
} from "@/components/dropdowns";
// constants
import { ISSUE_UPDATED } from "@/constants/event-tracker";
import { EIssuesStoreType } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
// hooks
import { useEventTracker, useEstimate, useLabel, useIssues, useProjectState, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import { IssuePropertyLabels } from "../properties/labels";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";

export interface IIssueProperties {
  issue: TIssue;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  isReadOnly: boolean;
  className: string;
  activeLayout: string;
}

export const IssueProperties: React.FC<IIssueProperties> = observer((props) => {
  const { issue, updateIssue, displayProperties, activeLayout, isReadOnly, className } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { labelMap } = useLabel();
  const { captureIssueEvent } = useEventTracker();
  const {
    issues: { changeModulesInIssue },
  } = useIssues(EIssuesStoreType.MODULE);
  const {
    issues: { addCycleToIssue, removeCycleFromIssue },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { areEstimatesEnabledForCurrentProject } = useEstimate();
  const { getStateById } = useProjectState();
  const { isMobile } = usePlatformOS();
  const projectDetails = getProjectById(issue.project_id);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const currentLayout = `${activeLayout} layout`;
  // derived values
  const stateDetails = getStateById(issue.state_id);
  const subIssueCount = issue.sub_issues_count;

  const issueOperations = useMemo(
    () => ({
      addModulesToIssue: async (moduleIds: string[]) => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await changeModulesInIssue?.(workspaceSlug.toString(), issue.project_id, issue.id, moduleIds, []);
      },
      removeModulesFromIssue: async (moduleIds: string[]) => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await changeModulesInIssue?.(workspaceSlug.toString(), issue.project_id, issue.id, [], moduleIds);
      },
      addIssueToCycle: async (cycleId: string) => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await addCycleToIssue?.(workspaceSlug.toString(), issue.project_id, cycleId, issue.id);
      },
      removeIssueFromCycle: async () => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await removeCycleFromIssue?.(workspaceSlug.toString(), issue.project_id, issue.id);
      },
    }),
    [workspaceSlug, issue, changeModulesInIssue, addCycleToIssue, removeCycleFromIssue]
  );

  const handleState = (stateId: string) => {
    updateIssue &&
      updateIssue(issue.project_id, issue.id, { state_id: stateId }).then(() => {
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
    updateIssue &&
      updateIssue(issue.project_id, issue.id, { priority: value }).then(() => {
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
    updateIssue &&
      updateIssue(issue.project_id, issue.id, { label_ids: ids }).then(() => {
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
    updateIssue &&
      updateIssue(issue.project_id, issue.id, { assignee_ids: ids }).then(() => {
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
      else issueOperations.removeIssueFromCycle?.();

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
    updateIssue &&
      updateIssue(issue.project_id, issue.id, { start_date: date ? renderFormattedPayloadDate(date) : null }).then(
        () => {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...issue, state: "SUCCESS", element: currentLayout },
            path: router.asPath,
            updates: {
              changed_property: "start_date",
              change_details: date ? renderFormattedPayloadDate(date) : null,
            },
          });
        }
      );
  };

  const handleTargetDate = (date: Date | null) => {
    updateIssue &&
      updateIssue(issue.project_id, issue.id, { target_date: date ? renderFormattedPayloadDate(date) : null }).then(
        () => {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...issue, state: "SUCCESS", element: currentLayout },
            path: router.asPath,
            updates: {
              changed_property: "target_date",
              change_details: date ? renderFormattedPayloadDate(date) : null,
            },
          });
        }
      );
  };

  const handleEstimate = (value: number | null) => {
    updateIssue &&
      updateIssue(issue.project_id, issue.id, { estimate_point: value }).then(() => {
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
      pathname: `/${workspaceSlug}/projects/${issue.project_id}/${issue.archived_at ? "archives/" : ""}issues/${
        issue.id
      }`,
      hash: "sub-issues",
    });
  };

  if (!displayProperties) return null;

  const defaultLabelOptions = issue?.label_ids?.map((id) => labelMap[id]) || [];

  const minDate = getDate(issue.start_date);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(issue.target_date);
  maxDate?.setDate(maxDate.getDate());

  const handleEventPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div className={className}>
      {/* basic properties */}
      {/* state */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="state">
        <div className="h-5" onClick={handleEventPropagation}>
          <StateDropdown
            buttonContainerClassName="truncate max-w-40"
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
        <div className="h-5" onClick={handleEventPropagation}>
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
        <div className="h-5" onClick={handleEventPropagation}>
          <IssuePropertyLabels
            projectId={issue?.project_id || null}
            value={issue?.label_ids || null}
            defaultOptions={defaultLabelOptions}
            onChange={handleLabel}
            disabled={isReadOnly}
            hideDropdownArrow
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* start date */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="start_date">
        <div className="h-5" onClick={handleEventPropagation}>
          <DateDropdown
            value={issue.start_date ?? null}
            onChange={handleStartDate}
            maxDate={maxDate}
            placeholder="Start date"
            icon={<CalendarClock className="h-3 w-3 flex-shrink-0" />}
            buttonVariant={issue.start_date ? "border-with-text" : "border-without-text"}
            disabled={isReadOnly}
            showTooltip
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* target/due date */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="due_date">
        <div className="h-5" onClick={handleEventPropagation}>
          <DateDropdown
            value={issue?.target_date ?? null}
            onChange={handleTargetDate}
            minDate={minDate}
            placeholder="Due date"
            icon={<CalendarCheck2 className="h-3 w-3 flex-shrink-0" />}
            buttonVariant={issue.target_date ? "border-with-text" : "border-without-text"}
            buttonClassName={shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group) ? "text-red-500" : ""}
            clearIconClassName="!text-custom-text-100"
            disabled={isReadOnly}
            showTooltip
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* assignee */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="assignee">
        <div className="h-5" onClick={handleEventPropagation}>
          <MemberDropdown
            projectId={issue?.project_id}
            value={issue?.assignee_ids}
            onChange={handleAssignee}
            disabled={isReadOnly}
            multiple
            buttonVariant={issue.assignee_ids?.length > 0 ? "transparent-without-text" : "border-without-text"}
            buttonClassName={issue.assignee_ids?.length > 0 ? "hover:bg-transparent px-0" : ""}
            showTooltip={issue?.assignee_ids?.length === 0}
            placeholder="Assignees"
            tooltipContent=""
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* modules */}
      {projectDetails?.module_view && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="modules">
          <div className="h-5" onClick={handleEventPropagation}>
            <ModuleDropdown
              buttonContainerClassName="truncate max-w-40"
              projectId={issue?.project_id}
              value={issue?.module_ids ?? []}
              onChange={handleModule}
              disabled={isReadOnly}
              multiple
              buttonVariant="border-with-text"
              showCount
              showTooltip
            />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* cycles */}
      {projectDetails?.cycle_view && (
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="cycle">
          <div className="h-5" onClick={handleEventPropagation}>
            <CycleDropdown
              buttonContainerClassName="truncate max-w-40"
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
          <div className="h-5" onClick={handleEventPropagation}>
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
        shouldRenderProperty={(properties) => !!properties.sub_issue_count && !!subIssueCount}
      >
        <Tooltip tooltipHeading="Sub-issues" tooltipContent={`${subIssueCount}`} isMobile={isMobile}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (subIssueCount) redirectToIssueDetail();
            }}
            className={cn(
              "flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1",
              {
                "hover:bg-custom-background-80 cursor-pointer": subIssueCount,
              }
            )}
          >
            <Layers className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{subIssueCount}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>

      {/* attachments */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="attachment_count"
        shouldRenderProperty={(properties) => !!properties.attachment_count && !!issue.attachment_count}
      >
        <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`} isMobile={isMobile}>
          <div
            className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1"
            onClick={handleEventPropagation}
          >
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
        <Tooltip tooltipHeading="Links" tooltipContent={`${issue.link_count}`} isMobile={isMobile}>
          <div
            className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded border-[0.5px] border-custom-border-300 px-2.5 py-1"
            onClick={handleEventPropagation}
          >
            <Link className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-xs">{issue.link_count}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>
    </div>
  );
});
