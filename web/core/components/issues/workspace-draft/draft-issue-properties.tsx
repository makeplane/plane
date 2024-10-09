"use client";

import { useCallback, useMemo } from "react";
import xor from "lodash/xor";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// icons
import { CalendarCheck2, CalendarClock } from "lucide-react";
// types
import { TIssue, TIssuePriorities } from "@plane/types";
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
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
// hooks
import {
  useEventTracker,
  useLabel,
  useProjectState,
  useProject,
  useProjectEstimates,
  useWorkspaceDraftIssues,
} from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import { IssuePropertyLabels } from "../issue-layouts";

export interface IIssueProperties {
  issue: TIssue;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  className: string;
  activeLayout: string;
}

export const DraftIssueProperties: React.FC<IIssueProperties> = observer((props) => {
  const { issue, updateIssue, activeLayout, className } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { labelMap } = useLabel();
  const { captureIssueEvent } = useEventTracker();
  const { changeModulesInIssue } = useWorkspaceDraftIssues();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { getStateById } = useProjectState();
  const { isMobile } = usePlatformOS();
  const projectDetails = getProjectById(issue.project_id);

  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();

  const currentLayout = `${activeLayout} layout`;
  // derived values
  const stateDetails = getStateById(issue.state_id);

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
        // TODO: Uncomment this after adding function to draft issue store
        // await addCycleToIssue?.(workspaceSlug.toString(), issue.project_id, cycleId, issue.id);
      },
      removeIssueFromCycle: async () => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        // TODO: Uncomment this after adding function to draft issue store
        // await removeCycleFromIssue?.(workspaceSlug.toString(), issue.project_id, issue.id);
      },
    }),
    [workspaceSlug, issue, changeModulesInIssue]
  );

  const handleState = (stateId: string) => {
    updateIssue &&
      updateIssue(issue.project_id, issue.id, { state_id: stateId }).then(() => {
        captureIssueEvent({
          eventName: ISSUE_UPDATED,
          payload: { ...issue, state: "SUCCESS", element: currentLayout },
          path: pathname,
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
          path: pathname,
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
          path: pathname,
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
          path: pathname,
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
        path: pathname,
        updates: { changed_property: "module_ids", change_details: { module_ids: moduleIds } },
      });
    },
    [issueOperations, captureIssueEvent, currentLayout, pathname, issue]
  );

  const handleCycle = useCallback(
    (cycleId: string | null) => {
      if (!issue || issue.cycle_id === cycleId) return;
      if (cycleId) issueOperations.addIssueToCycle?.(cycleId);
      else issueOperations.removeIssueFromCycle?.();

      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...issue, state: "SUCCESS", element: currentLayout },
        path: pathname,
        updates: { changed_property: "cycle", change_details: { cycle_id: cycleId } },
      });
    },
    [issue, issueOperations, captureIssueEvent, currentLayout, pathname]
  );

  const handleStartDate = (date: Date | null) => {
    updateIssue &&
      updateIssue(issue.project_id, issue.id, { start_date: date ? renderFormattedPayloadDate(date) : null }).then(
        () => {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...issue, state: "SUCCESS", element: currentLayout },
            path: pathname,
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
            path: pathname,
            updates: {
              changed_property: "target_date",
              change_details: date ? renderFormattedPayloadDate(date) : null,
            },
          });
        }
      );
  };

  const handleEstimate = (value: string | undefined) => {
    updateIssue &&
      updateIssue(issue.project_id, issue.id, { estimate_point: value }).then(() => {
        captureIssueEvent({
          eventName: ISSUE_UPDATED,
          payload: { ...issue, state: "SUCCESS", element: currentLayout },
          path: pathname,
          updates: {
            changed_property: "estimate_point",
            change_details: value,
          },
        });
      });
  };

  if (!issue.project_id) return null;

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
      <div className="h-5" onClick={handleEventPropagation}>
        <StateDropdown
          buttonContainerClassName="truncate max-w-40"
          value={issue.state_id}
          onChange={handleState}
          projectId={issue.project_id}
          buttonVariant="border-with-text"
          renderByDefault={isMobile}
          showTooltip
        />
      </div>
      {/* </WithDisplayPropertiesHOC> */}

      {/* priority */}
      <div className="h-5" onClick={handleEventPropagation}>
        <PriorityDropdown
          value={issue?.priority}
          onChange={handlePriority}
          buttonVariant="border-without-text"
          buttonClassName="border"
          renderByDefault={isMobile}
          showTooltip
        />
      </div>
      {/* </WithDisplayPropertiesHOC> */}

      {/* label */}

      <div className="h-5" onClick={handleEventPropagation}>
        <IssuePropertyLabels
          projectId={issue?.project_id || null}
          value={issue?.label_ids || null}
          defaultOptions={defaultLabelOptions}
          onChange={handleLabel}
          renderByDefault={isMobile}
          hideDropdownArrow
        />
      </div>

      {/* start date */}
      <div className="h-5" onClick={handleEventPropagation}>
        <DateDropdown
          value={issue.start_date ?? null}
          onChange={handleStartDate}
          maxDate={maxDate}
          placeholder="Start date"
          icon={<CalendarClock className="h-3 w-3 flex-shrink-0" />}
          buttonVariant={issue.start_date ? "border-with-text" : "border-without-text"}
          optionsClassName="z-10"
          renderByDefault={isMobile}
          showTooltip
        />
      </div>

      {/* target/due date */}
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
          optionsClassName="z-10"
          renderByDefault={isMobile}
          showTooltip
        />
      </div>

      {/* assignee */}
      <div className="h-5" onClick={handleEventPropagation}>
        <MemberDropdown
          projectId={issue?.project_id}
          value={issue?.assignee_ids}
          onChange={handleAssignee}
          multiple
          buttonVariant={issue.assignee_ids?.length > 0 ? "transparent-without-text" : "border-without-text"}
          buttonClassName={issue.assignee_ids?.length > 0 ? "hover:bg-transparent px-0" : ""}
          showTooltip={issue?.assignee_ids?.length === 0}
          placeholder="Assignees"
          optionsClassName="z-10"
          tooltipContent=""
          renderByDefault={isMobile}
        />
      </div>

      {/* modules */}
      {projectDetails?.module_view && (
        <div className="h-5" onClick={handleEventPropagation}>
          <ModuleDropdown
            buttonContainerClassName="truncate max-w-40"
            projectId={issue?.project_id}
            value={issue?.module_ids ?? []}
            onChange={handleModule}
            renderByDefault={isMobile}
            multiple
            buttonVariant="border-with-text"
            showCount
            showTooltip
          />
        </div>
      )}

      {/* cycles */}
      {projectDetails?.cycle_view && (
        <div className="h-5" onClick={handleEventPropagation}>
          <CycleDropdown
            buttonContainerClassName="truncate max-w-40"
            projectId={issue?.project_id}
            value={issue?.cycle_id}
            onChange={handleCycle}
            buttonVariant="border-with-text"
            renderByDefault={isMobile}
            showTooltip
          />
        </div>
      )}

      {/* estimates */}
      {issue.project_id && areEstimateEnabledByProjectId(issue.project_id?.toString()) && (
        <div className="h-5" onClick={handleEventPropagation}>
          <EstimateDropdown
            value={issue.estimate_point ?? undefined}
            onChange={handleEstimate}
            projectId={issue.project_id}
            buttonVariant="border-with-text"
            renderByDefault={isMobile}
            showTooltip
          />
        </div>
      )}
    </div>
  );
});
