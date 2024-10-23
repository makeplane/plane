"use client";

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { CalendarCheck2, CalendarClock } from "lucide-react";
// types
import { TIssuePriorities, TWorkspaceDraftIssue } from "@plane/types";
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
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
// hooks
import { useLabel, useProjectState, useProject, useProjectEstimates, useWorkspaceDraftIssues } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import { IssuePropertyLabels } from "../issue-layouts";

export interface IIssueProperties {
  issue: TWorkspaceDraftIssue;
  updateIssue:
    | ((projectId: string | null, issueId: string, data: Partial<TWorkspaceDraftIssue>) => Promise<void>)
    | undefined;
  className: string;
}

export const DraftIssueProperties: React.FC<IIssueProperties> = observer((props) => {
  const { issue, updateIssue, className } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { labelMap } = useLabel();
  const { addCycleToIssue, addModulesToIssue } = useWorkspaceDraftIssues();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { getStateById } = useProjectState();
  const { isMobile } = usePlatformOS();
  const projectDetails = getProjectById(issue.project_id);

  // router
  const { workspaceSlug } = useParams();
  // derived values
  const stateDetails = getStateById(issue.state_id);

  const issueOperations = useMemo(
    () => ({
      updateIssueModules: async (moduleIds: string[]) => {
        if (!workspaceSlug || !issue.id) return;
        await addModulesToIssue(workspaceSlug.toString(), issue.id, moduleIds);
      },
      addIssueToCycle: async (cycleId: string) => {
        if (!workspaceSlug || !issue.id) return;
        await addCycleToIssue(workspaceSlug.toString(), issue.id, cycleId);
      },
      removeIssueFromCycle: async () => {
        if (!workspaceSlug || !issue.id) return;
        // TODO: To be checked
        await addCycleToIssue(workspaceSlug.toString(), issue.id, "");
      },
    }),
    [workspaceSlug, issue, addCycleToIssue, addModulesToIssue]
  );

  const handleState = (stateId: string) =>
    issue?.project_id && updateIssue && updateIssue(issue.project_id, issue.id, { state_id: stateId });

  const handlePriority = (value: TIssuePriorities) =>
    issue?.project_id && updateIssue && updateIssue(issue.project_id, issue.id, { priority: value });

  const handleLabel = (ids: string[]) =>
    issue?.project_id && updateIssue && updateIssue(issue.project_id, issue.id, { label_ids: ids });

  const handleAssignee = (ids: string[]) =>
    issue?.project_id && updateIssue && updateIssue(issue.project_id, issue.id, { assignee_ids: ids });

  const handleModule = useCallback(
    (moduleIds: string[] | null) => {
      if (!issue || !issue.module_ids || !moduleIds) return;
      issueOperations.updateIssueModules(moduleIds);
    },
    [issueOperations, issue]
  );

  const handleCycle = useCallback(
    (cycleId: string | null) => {
      if (!issue || issue.cycle_id === cycleId) return;
      if (cycleId) issueOperations.addIssueToCycle?.(cycleId);
      else issueOperations.removeIssueFromCycle?.();
    },
    [issue, issueOperations]
  );

  const handleStartDate = (date: Date | null) =>
    issue?.project_id &&
    updateIssue &&
    updateIssue(issue.project_id, issue.id, {
      start_date: date ? (renderFormattedPayloadDate(date) ?? undefined) : undefined,
    });

  const handleTargetDate = (date: Date | null) =>
    issue?.project_id &&
    updateIssue &&
    updateIssue(issue.project_id, issue.id, {
      target_date: date ? (renderFormattedPayloadDate(date) ?? undefined) : undefined,
    });

  const handleEstimate = (value: string | undefined) =>
    issue?.project_id && updateIssue && updateIssue(issue.project_id, issue.id, { estimate_point: value });

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
          buttonClassName={
            shouldHighlightIssueDueDate(issue?.target_date || null, stateDetails?.group) ? "text-red-500" : ""
          }
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
            value={issue?.cycle_id || null}
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
