/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { DueDateOutline, StartDateOutline } from "@makeplane/propel/icons";
// plane imports
import { DateSelect } from "@plane/blocks/property-select";
import { useTranslation } from "@plane/i18n";
// types
import type { TIssuePriorities, TWorkspaceDraftIssue } from "@plane/types";
import { cn, getDate, renderFormattedPayloadDate, shouldHighlightIssueDueDate } from "@plane/utils";
// components
import { CycleSelect } from "@/components/dropdowns/cycle/cycle-select";
import { EstimateSelect } from "@/components/dropdowns/estimate/estimate-select";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { ModuleSelect } from "@/components/dropdowns/module/module-select";
import { PrioritySelect } from "@/components/dropdowns/priority/priority-select";
import { StateSelect } from "@/components/dropdowns/state/state-select";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useLabel } from "@/hooks/store/use-label";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserProfile } from "@/hooks/store/user";
import { useWorkspaceDraftIssues } from "@/hooks/store/workspace-draft";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { IssuePropertyLabels } from "../issue-layouts/properties";
// local components

export interface IIssueProperties {
  issue: TWorkspaceDraftIssue;
  updateIssue:
    | ((projectId: string | null, issueId: string, data: Partial<TWorkspaceDraftIssue>) => Promise<void>)
    | undefined;
  className: string;
}

export const DraftIssueProperties = observer(function DraftIssueProperties(props: IIssueProperties) {
  const { issue, updateIssue, className } = props;
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { labelMap } = useLabel();
  const { addCycleToIssue, addModulesToIssue } = useWorkspaceDraftIssues();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { getStateById } = useProjectState();
  const { data: userProfile } = useUserProfile();
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

  const handleEstimate = (value: string | null) =>
    issue?.project_id && updateIssue && updateIssue(issue.project_id, issue.id, { estimate_point: value });

  if (!issue.project_id) return null;

  const defaultLabelOptions =
    issue?.label_ids?.flatMap((id) => {
      const label = labelMap[id];
      return label ? [label] : [];
    }) || [];

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
      <div role="presentation" onClick={handleEventPropagation}>
        <StateSelect
          value={issue.state_id}
          onChange={handleState}
          projectId={issue.project_id}
          variant="pill-sm"
          tooltip
        />
      </div>

      {/* priority */}
      <div role="presentation" onClick={handleEventPropagation}>
        <PrioritySelect value={issue?.priority} onChange={handlePriority} variant="pill-sm" tooltip />
      </div>

      {/* label */}

      <IssuePropertyLabels
        projectId={issue?.project_id || null}
        value={issue?.label_ids || null}
        defaultOptions={defaultLabelOptions}
        onChange={handleLabel}
        renderByDefault={isMobile}
        hideDropdownArrow
      />

      {/* start date */}
      <div role="presentation" onClick={handleEventPropagation}>
        <DateSelect
          value={getDate(issue.start_date) ?? null}
          onChange={handleStartDate}
          maxDate={maxDate}
          placeholder={t("common.order_by.start_date")}
          icon={<StartDateOutline />}
          clearable
          showTooltip
          tooltipHeading={t("common.order_by.start_date")}
          weekStartsOn={userProfile?.start_of_the_week}
          variant="pill-sm"
        />
      </div>

      {/* target/due date */}
      <div role="presentation" onClick={handleEventPropagation}>
        <DateSelect
          value={getDate(issue?.target_date) ?? null}
          onChange={handleTargetDate}
          minDate={minDate}
          placeholder={t("common.order_by.due_date")}
          icon={<DueDateOutline />}
          className={cn({
            "text-danger-primary": shouldHighlightIssueDueDate(issue?.target_date || null, stateDetails?.group),
          })}
          clearable
          showTooltip
          tooltipHeading={t("common.order_by.due_date")}
          weekStartsOn={userProfile?.start_of_the_week}
          variant="pill-sm"
        />
      </div>

      {/* assignee */}
      <div role="presentation" onClick={handleEventPropagation}>
        <MemberSelect
          projectId={issue?.project_id}
          value={issue?.assignee_ids ?? []}
          onChange={handleAssignee}
          multiple
          variant={issue.assignee_ids?.length ? "avatar-group-sm" : "pill-sm"}
          placeholder={t("common.assignees")}
          tooltip={{ heading: t("common.assignees") }}
        />
      </div>

      {/* modules */}
      {projectDetails?.module_view && (
        <div role="presentation" onClick={handleEventPropagation}>
          <ModuleSelect
            multiple
            projectId={issue?.project_id}
            value={issue?.module_ids ?? []}
            onChange={handleModule}
            variant="pill-sm"
            tooltip
          />
        </div>
      )}

      {/* cycles */}
      {projectDetails?.cycle_view && (
        <div role="presentation" onClick={handleEventPropagation}>
          <CycleSelect
            projectId={issue?.project_id}
            value={issue?.cycle_id || null}
            onChange={handleCycle}
            variant="pill-sm"
            tooltip
          />
        </div>
      )}

      {/* estimates */}
      {issue.project_id && areEstimateEnabledByProjectId(issue.project_id?.toString()) && (
        <div role="presentation" onClick={handleEventPropagation}>
          <EstimateSelect
            value={issue.estimate_point ?? undefined}
            onChange={handleEstimate}
            projectId={issue.project_id}
            variant="pill-sm"
            tooltip
          />
        </div>
      )}
    </div>
  );
});
