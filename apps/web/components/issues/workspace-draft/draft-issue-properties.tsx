/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Fragment, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { Icon } from "@makeplane/propel/components/icon";
import {
  AssigneeOutline,
  CyclesOutline,
  DueDateOutline,
  EstimateOutline,
  ModuleOutline,
  StartDateOutline,
} from "@makeplane/propel/icons";
// plane imports
import { LabelPropertyIcon, PriorityIcon, StateGroupIcon } from "@plane/blocks/icons";
import { DateSelect } from "@plane/blocks/property-select";
import type { WorkItemPropertyEntry } from "@plane/blocks/work-item-properties";
import { getWorkItemPropertyHidePriority, PropertiesOverflowRow } from "@plane/blocks/work-item-properties";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// types
import type { TIssuePriorities, TWorkspaceDraftIssue } from "@plane/types";
import { getDate, getIssueDueDateClassName, renderFormattedDate, renderFormattedPayloadDate } from "@plane/utils";
// components
import { CycleSelect } from "@/components/dropdowns/cycle/cycle-select";
import { EstimateSelect } from "@/components/dropdowns/estimate/estimate-select";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { ModuleSelect } from "@/components/dropdowns/module/module-select";
import { PrioritySelect } from "@/components/dropdowns/priority/priority-select";
import { StateSelect } from "@/components/dropdowns/state/state-select";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserProfile } from "@/hooks/store/user";
import { useWorkspaceDraftIssues } from "@/hooks/store/workspace-draft";
import { IssuePropertyLabels } from "../issue-layouts/properties";
import { buildLabelStepDownVariants, LabelsStepDownChip } from "../issue-layouts/properties/label-step-down";
import type { TDatePropertyEditorProps, TPropertyEditorProps } from "../issue-layouts/properties/property-editor";
import {
  getDatePropertyEditorProps,
  getPropertyEditorProps,
  PROPERTY_EDITOR_OVERLAY_CLASSNAME,
} from "../issue-layouts/properties/property-editor";

export interface IIssueProperties {
  issue: TWorkspaceDraftIssue;
  updateIssue:
    | ((projectId: string | null, issueId: string, data: Partial<TWorkspaceDraftIssue>) => Promise<void>)
    | undefined;
  className: string;
  /**
   * Room in px for the chips on one line; the rest collapse into a "+N" Properties menu. `null`
   * (stacked row, not measured yet) shows them all; omit it for a plain wrapping row.
   */
  overflowBudgetPx?: number | null;
}

/** Stops a press on a chip from reaching the clickable row it sits in. */
const handleEventPropagation = (e: React.MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();
};

export const DraftIssueProperties = observer(function DraftIssueProperties(props: IIssueProperties) {
  const { issue, updateIssue, className, overflowBudgetPx } = props;
  const { t, currentLocale } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { labelMap } = useLabel();
  const { addCycleToIssue, addModulesToIssue } = useWorkspaceDraftIssues();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { getCycleNameById } = useCycle();
  const { getStateById } = useProjectState();
  const { data: userProfile } = useUserProfile();
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

  const minDate = getDate(issue.start_date);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(issue.target_date);
  maxDate?.setDate(maxDate.getDate());

  const dueDateClassName = getIssueDueDateClassName(issue?.target_date || null, stateDetails?.group);
  const none = t("common.none");

  const chipShell = (chip: ReactNode) => (
    <div role="presentation" onClick={handleEventPropagation}>
      {chip}
    </div>
  );

  const entries: WorkItemPropertyEntry[] = [];

  // state
  const renderState = (extra: TPropertyEditorProps) => (
    <StateSelect
      value={issue.state_id}
      onChange={handleState}
      projectId={issue.project_id ?? undefined}
      variant="pill-md"
      {...extra}
    />
  );
  entries.push({
    key: "state",
    hidePriority: getWorkItemPropertyHidePriority("state"),
    measureKey: stateDetails?.name,
    chip: chipShell(renderState({ tooltip: true })),
    menuRow: {
      icon: <StateGroupIcon stateGroup={stateDetails?.group ?? "backlog"} color={stateDetails?.color} size="md" />,
      label: t("common.state"),
      preview: stateDetails?.name ?? none,
      editor: ({ onEditorClose }) => renderState(getPropertyEditorProps(onEditorClose)),
    },
  });

  // priority
  const priority = ISSUE_PRIORITIES.find((option) => option.key === issue.priority);
  const renderPriority = (extra: TPropertyEditorProps) => (
    <PrioritySelect value={issue?.priority} onChange={handlePriority} variant="pill-md" {...extra} />
  );
  entries.push({
    key: "priority",
    hidePriority: getWorkItemPropertyHidePriority("priority"),
    measureKey: issue.priority ?? undefined,
    chip: chipShell(renderPriority({ tooltip: true })),
    menuRow: {
      icon: <PriorityIcon priority={issue.priority ?? "none"} className="size-4" />,
      label: t("common.priority"),
      preview: priority && priority.key !== "none" ? t(priority.key) || priority.title : none,
      editor: ({ onEditorClose }) => renderPriority(getPropertyEditorProps(onEditorClose)),
    },
  });

  // label
  const labelIds = issue.label_ids ?? [];
  const labels = labelIds.flatMap((id) => {
    const label = labelMap[id];
    return label ? [{ id: label.id, name: label.name, color: label.color }] : [];
  });
  const renderLabelPicker = (triggerClassName?: string) => (
    <IssuePropertyLabels
      projectId={issue?.project_id || null}
      value={labelIds}
      onChange={handleLabel}
      buttonClassName={triggerClassName}
      className={triggerClassName ? "size-full" : undefined}
    />
  );
  const labelStepDownProps = { labels, disabled: false, renderPicker: renderLabelPicker };
  entries.push({
    key: "labels",
    hidePriority: getWorkItemPropertyHidePriority("labels"),
    measureKey: labels.map((label) => label.name).join(","),
    chip: <LabelsStepDownChip {...labelStepDownProps} pillCount={0} />,
    variants: buildLabelStepDownVariants({
      ...labelStepDownProps,
      getOverflowText: (count) => t("issue.properties_overflow.label_overflow_indicator", { count }),
      getSummaryText: (count) => t("labels_count", { count }),
    }),
    menuRow: {
      icon: <LabelPropertyIcon className="size-4" />,
      label: t("common.labels"),
      preview: labelIds.length ? `${labelIds.length}` : none,
      editor: ({ onEditorClose }) => (
        <IssuePropertyLabels
          projectId={issue?.project_id || null}
          value={labelIds}
          onChange={handleLabel}
          onClose={onEditorClose}
          buttonClassName={PROPERTY_EDITOR_OVERLAY_CLASSNAME}
          className="contents"
          showTooltip={false}
        />
      ),
    },
  });

  // start date
  const renderStartDate = (extra: TDatePropertyEditorProps) => (
    <DateSelect
      value={getDate(issue.start_date) ?? null}
      onChange={handleStartDate}
      maxDate={maxDate}
      placeholder={t("common.order_by.start_date")}
      icon={<StartDateOutline />}
      tooltipHeading={t("common.order_by.start_date")}
      weekStartsOn={userProfile?.start_of_the_week}
      variant="pill-md"
      {...extra}
    />
  );
  entries.push({
    key: "start_date",
    hidePriority: getWorkItemPropertyHidePriority("start_date"),
    measureKey: issue.start_date ?? undefined,
    chip: chipShell(renderStartDate({ clearable: true, showTooltip: true })),
    menuRow: {
      icon: <Icon icon={StartDateOutline} />,
      label: t("common.order_by.start_date"),
      preview: renderFormattedDate(issue.start_date) ?? none,
      editor: ({ onEditorClose }) => renderStartDate(getDatePropertyEditorProps(onEditorClose)),
    },
  });

  // target/due date
  const renderDueDate = (extra: TDatePropertyEditorProps) => (
    <DateSelect
      value={getDate(issue?.target_date) ?? null}
      onChange={handleTargetDate}
      minDate={minDate}
      placeholder={t("common.order_by.due_date")}
      icon={<DueDateOutline />}
      tooltipHeading={t("common.order_by.due_date")}
      weekStartsOn={userProfile?.start_of_the_week}
      variant="pill-md"
      {...extra}
    />
  );
  entries.push({
    key: "due_date",
    hidePriority: getWorkItemPropertyHidePriority("due_date"),
    measureKey: issue.target_date ?? undefined,
    chip: chipShell(renderDueDate({ className: dueDateClassName, clearable: true, showTooltip: true })),
    menuRow: {
      icon: <Icon icon={DueDateOutline} />,
      label: t("common.order_by.due_date"),
      preview: issue.target_date ? (
        <span className={dueDateClassName}>{renderFormattedDate(issue.target_date)}</span>
      ) : (
        none
      ),
      editor: ({ onEditorClose }) => renderDueDate(getDatePropertyEditorProps(onEditorClose)),
    },
  });

  // assignee
  const assigneeIds = issue.assignee_ids ?? [];
  entries.push({
    key: "assignee",
    hidePriority: getWorkItemPropertyHidePriority("assignee"),
    measureKey: assigneeIds.join(","),
    chip: chipShell(
      <MemberSelect
        projectId={issue?.project_id ?? undefined}
        value={assigneeIds}
        onChange={handleAssignee}
        multiple
        variant={assigneeIds.length ? "avatar-group-md" : "pill-md"}
        placeholder={t("common.assignees")}
        tooltip={{ heading: t("common.assignees") }}
      />
    ),
    menuRow: {
      icon: <Icon icon={AssigneeOutline} />,
      label: t("common.assignees"),
      preview: assigneeIds.length ? `${assigneeIds.length}` : none,
      editor: ({ onEditorClose }) => (
        <MemberSelect
          projectId={issue?.project_id ?? undefined}
          value={assigneeIds}
          onChange={handleAssignee}
          multiple
          variant="pill-md"
          placeholder={t("common.assignees")}
          {...getPropertyEditorProps(onEditorClose)}
        />
      ),
    },
  });

  // modules
  if (projectDetails?.module_view) {
    const moduleIds = issue.module_ids ?? [];
    const renderModules = (extra: TPropertyEditorProps) => (
      <ModuleSelect
        multiple
        projectId={issue?.project_id ?? undefined}
        value={moduleIds}
        onChange={handleModule}
        variant="pill-md"
        {...extra}
      />
    );
    entries.push({
      key: "modules",
      hidePriority: getWorkItemPropertyHidePriority("modules"),
      measureKey: moduleIds.join(","),
      chip: chipShell(renderModules({ tooltip: true })),
      menuRow: {
        icon: <Icon icon={ModuleOutline} />,
        label: t("common.modules"),
        preview: moduleIds.length ? `${moduleIds.length}` : none,
        editor: ({ onEditorClose }) => renderModules(getPropertyEditorProps(onEditorClose)),
      },
    });
  }

  // cycles
  if (projectDetails?.cycle_view) {
    const cycleName = issue.cycle_id ? getCycleNameById(issue.cycle_id) : undefined;
    const renderCycle = (extra: TPropertyEditorProps) => (
      <CycleSelect
        projectId={issue?.project_id ?? undefined}
        value={issue?.cycle_id || null}
        onChange={handleCycle}
        variant="pill-md"
        {...extra}
      />
    );
    entries.push({
      key: "cycle",
      hidePriority: getWorkItemPropertyHidePriority("cycle"),
      measureKey: cycleName ?? issue.cycle_id ?? undefined,
      chip: chipShell(renderCycle({ tooltip: true })),
      menuRow: {
        icon: <Icon icon={CyclesOutline} />,
        label: t("common.cycle"),
        preview: cycleName ?? none,
        editor: ({ onEditorClose }) => renderCycle(getPropertyEditorProps(onEditorClose)),
      },
    });
  }

  // estimates
  if (issue.project_id && areEstimateEnabledByProjectId(issue.project_id?.toString())) {
    const renderEstimate = (extra: TPropertyEditorProps) => (
      <EstimateSelect
        value={issue.estimate_point ?? undefined}
        onChange={handleEstimate}
        projectId={issue.project_id ?? undefined}
        variant="pill-md"
        {...extra}
      />
    );
    entries.push({
      key: "estimate",
      hidePriority: getWorkItemPropertyHidePriority("estimate"),
      measureKey: issue.estimate_point ?? undefined,
      chip: chipShell(renderEstimate({ tooltip: true })),
      menuRow: {
        icon: <Icon icon={EstimateOutline} />,
        label: t("common.estimate"),
        preview: issue.estimate_point ? undefined : none,
        editor: ({ onEditorClose }) => renderEstimate(getPropertyEditorProps(onEditorClose)),
      },
    });
  }

  if (overflowBudgetPx !== undefined) {
    return (
      <PropertiesOverflowRow
        className={className}
        entries={entries}
        availableWidth={overflowBudgetPx}
        menuLabel={t("common.properties")}
        getTriggerAriaLabel={(count) => t("issue.properties_overflow.trigger_aria_label", { count })}
        remeasureKey={currentLocale}
      />
    );
  }

  return (
    <div className={className}>
      {entries.map((entry) => (
        <Fragment key={entry.key}>{entry.chip}</Fragment>
      ))}
    </div>
  );
});
