/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode, SyntheticEvent } from "react";
import { Fragment, useCallback, useMemo } from "react";
import { xor } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import {
  AssigneeOutline,
  AttachOutline,
  CyclesOutline,
  DueDateOutline,
  EstimateOutline,
  LinkOutline,
  ModuleOutline,
  StartDateOutline,
  SubWorkItemsOutline,
} from "@makeplane/propel/icons";
// i18n
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Icon } from "@makeplane/propel/components/icon";
import { Pill } from "@makeplane/propel/components/pill";
import { LabelPropertyIcon, PriorityIcon, StateGroupIcon } from "@plane/blocks/icons";
import type { DateRangeValue } from "@plane/blocks/property-select";
import { DateRangeSelect, DateSelect } from "@plane/blocks/property-select";
import type { WorkItemPropertyEntry } from "@plane/blocks/work-item-properties";
import { getWorkItemPropertyHidePriority, PropertiesOverflowRow } from "@plane/blocks/work-item-properties";
import { ISSUE_PRIORITIES } from "@plane/constants";
import type { TIssue, IIssueDisplayProperties, TIssuePriorities } from "@plane/types";
// ui
import {
  getDate,
  renderFormattedDate,
  renderFormattedPayloadDate,
  generateWorkItemLink,
  getIssueDueDateClassName,
} from "@plane/utils";
// components
import { CycleSelect } from "@/components/dropdowns/cycle/cycle-select";
import { EstimateSelect, getEstimatePointDisplayValue } from "@/components/dropdowns/estimate/estimate-select";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { ModuleSelect } from "@/components/dropdowns/module/module-select";
import { PrioritySelect } from "@/components/dropdowns/priority/priority-select";
import { StateSelect } from "@/components/dropdowns/state/state-select";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useEstimate } from "@/hooks/store/estimates/use-estimate";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { useLabel } from "@/hooks/store/use-label";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserProfile } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import { buildLabelStepDownVariants, LabelsStepDownChip } from "./label-step-down";
import { IssuePropertyLabels } from "./labels";
import type { TDatePropertyEditorProps, TPropertyEditorProps } from "./property-editor";
import {
  getDatePropertyEditorProps,
  getPropertyEditorProps,
  PROPERTY_EDITOR_OVERLAY_CLASSNAME,
} from "./property-editor";

export interface IIssueProperties {
  issue: TIssue;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  isReadOnly: boolean;
  className: string;
  activeLayout: string;
  isEpic?: boolean;
  /**
   * List rows only: room in px for the chips on one line. Chips that don't fit collapse into a "+N"
   * Properties menu; `null` (stacked row, not measured yet) shows them all. Omit it for the plain
   * wrapping row (board cards).
   */
  overflowBudgetPx?: number | null;
  /** Closes the "+N" menu while the row is dragged. */
  isRowDragging?: boolean;
}

export const IssueProperties = observer(function IssueProperties(props: IIssueProperties) {
  const {
    issue,
    updateIssue,
    displayProperties,
    isReadOnly,
    className,
    isEpic = false,
    overflowBudgetPx,
    isRowDragging = false,
  } = props;
  // i18n
  const { t, currentLocale } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { labelMap } = useLabel();
  const storeType = useIssueStoreType();
  const {
    issues: { changeModulesInIssue },
  } = useIssues(storeType);
  const {
    issues: { addCycleToIssue, removeCycleFromIssue },
  } = useIssues(storeType);
  const { areEstimateEnabledByProjectId, currentActiveEstimateIdByProjectId } = useProjectEstimates();
  const activeEstimate = useEstimate(
    issue.project_id ? currentActiveEstimateIdByProjectId(issue.project_id) : undefined
  );
  const { getCycleNameById } = useCycle();
  const { getStateById } = useProjectState();
  const { data: userProfile } = useUserProfile();
  const { isMobile } = usePlatformOS();
  const projectDetails = getProjectById(issue.project_id);

  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();

  // derived values
  const stateDetails = getStateById(issue.state_id);
  const subIssueCount = issue?.sub_issues_count ?? 0;

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

  const handleState = async (stateId: string) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, { state_id: stateId });
  };

  const handlePriority = async (value: TIssuePriorities) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, { priority: value });
  };

  const handleLabel = async (ids: string[]) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, { label_ids: ids });
  };

  const handleAssignee = async (ids: string[]) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, { assignee_ids: ids });
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

  const handleStartDate = async (date: Date | null) => {
    if (updateIssue)
      await updateIssue(issue.project_id, issue.id, { start_date: date ? renderFormattedPayloadDate(date) : null });
  };

  const handleTargetDate = async (date: Date | null) => {
    if (updateIssue)
      await updateIssue(issue.project_id, issue.id, { target_date: date ? renderFormattedPayloadDate(date) : null });
  };

  const handleDateRangeUpdate = async (range: DateRangeValue) => {
    if (updateIssue)
      await updateIssue(issue.project_id, issue.id, {
        start_date: range.from ? renderFormattedPayloadDate(range.from) : null,
        target_date: range.to ? renderFormattedPayloadDate(range.to) : null,
      });
  };

  const handleEstimate = async (value: string | null) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, { estimate_point: value });
  };

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: issue?.project_id,
    issueId: issue?.id,
    projectIdentifier: projectDetails?.identifier,
    sequenceId: issue?.sequence_id,
    isArchived: !!issue?.archived_at,
    isEpic,
  });

  const redirectToIssueDetail = () => router.push(`${workItemLink}#sub-issues`);

  if (!displayProperties || !issue.project_id) return null;

  // date range is enabled only when both dates are available and both dates are enabled
  const isDateRangeEnabled: boolean = Boolean(
    issue.start_date && issue.target_date && displayProperties.start_date && displayProperties.due_date
  );

  const minDate = getDate(issue.start_date);
  const maxDate = getDate(issue.target_date);
  const dueDateClassName = getIssueDueDateClassName(issue.target_date, stateDetails?.group);
  const none = t("common.none");
  const isShown = (key: keyof IIssueDisplayProperties) => !!displayProperties[key];

  // Stops a press on a chip from reaching the clickable row it sits in.
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const handleEventPropagation = (e: SyntheticEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };
  const chipShell = (chip: ReactNode) => (
    <div role="presentation" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
      {chip}
    </div>
  );

  const entries: WorkItemPropertyEntry[] = [];

  // state
  if (isShown("state")) {
    const renderState = (extra: TPropertyEditorProps) => (
      <StateSelect
        value={issue.state_id}
        onChange={handleState}
        projectId={issue.project_id ?? undefined}
        disabled={isReadOnly}
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
        disabled: isReadOnly,
        editor: ({ onEditorClose }) => renderState(getPropertyEditorProps(onEditorClose)),
      },
    });
  }

  // priority
  if (isShown("priority")) {
    const priority = ISSUE_PRIORITIES.find((option) => option.key === issue.priority);
    const renderPriority = (extra: TPropertyEditorProps) => (
      <PrioritySelect
        value={issue?.priority}
        onChange={handlePriority}
        disabled={isReadOnly}
        variant="pill-md"
        {...extra}
      />
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
        disabled: isReadOnly,
        editor: ({ onEditorClose }) => renderPriority(getPropertyEditorProps(onEditorClose)),
      },
    });
  }

  // merged dates
  if (isDateRangeEnabled) {
    const renderDateRange = (extra: TDatePropertyEditorProps) => (
      <DateRangeSelect
        value={{
          from: getDate(issue.start_date) ?? null,
          to: getDate(issue.target_date) ?? null,
        }}
        onChange={handleDateRangeUpdate}
        icon={<StartDateOutline />}
        mergeDates
        disabled={isReadOnly}
        tooltipHeading={t("project_cycles.date_range")}
        weekStartsOn={userProfile?.start_of_the_week}
        variant="pill-md"
        {...extra}
      />
    );
    entries.push({
      key: "date_range",
      hidePriority: getWorkItemPropertyHidePriority("date_range"),
      measureKey: `${issue.start_date}~${issue.target_date}`,
      chip: chipShell(renderDateRange({ className: dueDateClassName, clearable: true, showTooltip: true })),
      menuRow: {
        icon: <Icon icon={StartDateOutline} />,
        label: t("project_cycles.date_range"),
        preview: (
          <span className={dueDateClassName}>
            {`${renderFormattedDate(issue.start_date) ?? ""} – ${renderFormattedDate(issue.target_date) ?? ""}`}
          </span>
        ),
        disabled: isReadOnly,
        editor: ({ onEditorClose }) => renderDateRange(getDatePropertyEditorProps(onEditorClose)),
      },
    });
  }

  // start date
  if (isShown("start_date") && !isDateRangeEnabled) {
    const renderStartDate = (extra: TDatePropertyEditorProps) => (
      <DateSelect
        value={getDate(issue.start_date) ?? null}
        onChange={handleStartDate}
        maxDate={maxDate}
        placeholder={t("common.order_by.start_date")}
        icon={<StartDateOutline />}
        disabled={isReadOnly}
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
        disabled: isReadOnly,
        editor: ({ onEditorClose }) => renderStartDate(getDatePropertyEditorProps(onEditorClose)),
      },
    });
  }

  // target/due date
  if (isShown("due_date") && !isDateRangeEnabled) {
    const renderDueDate = (extra: TDatePropertyEditorProps) => (
      <DateSelect
        value={getDate(issue?.target_date) ?? null}
        onChange={handleTargetDate}
        minDate={minDate}
        placeholder={t("common.order_by.due_date")}
        icon={<DueDateOutline />}
        disabled={isReadOnly}
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
        disabled: isReadOnly,
        editor: ({ onEditorClose }) => renderDueDate(getDatePropertyEditorProps(onEditorClose)),
      },
    });
  }

  // assignee
  if (isShown("assignee")) {
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
          disabled={isReadOnly}
          multiple
          variant={assigneeIds.length ? "avatar-group-md" : "pill-md"}
          tooltip={{ heading: t("common.assignees") }}
        />
      ),
      menuRow: {
        icon: <Icon icon={AssigneeOutline} />,
        label: t("common.assignees"),
        preview: assigneeIds.length ? `${assigneeIds.length}` : none,
        disabled: isReadOnly,
        editor: ({ onEditorClose }) => (
          <MemberSelect
            projectId={issue?.project_id ?? undefined}
            value={assigneeIds}
            onChange={handleAssignee}
            disabled={isReadOnly}
            multiple
            variant="pill-md"
            {...getPropertyEditorProps(onEditorClose)}
          />
        ),
      },
    });
  }

  if (!isEpic) {
    // modules
    if (projectDetails?.module_view && isShown("modules")) {
      const moduleIds = issue.module_ids ?? [];
      const renderModules = (extra: TPropertyEditorProps) => (
        <ModuleSelect
          multiple
          projectId={issue?.project_id ?? undefined}
          value={moduleIds}
          onChange={handleModule}
          disabled={isReadOnly}
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
          disabled: isReadOnly,
          editor: ({ onEditorClose }) => renderModules(getPropertyEditorProps(onEditorClose)),
        },
      });
    }

    // cycles
    if (projectDetails?.cycle_view && isShown("cycle")) {
      const cycleName = issue.cycle_id ? getCycleNameById(issue.cycle_id) : undefined;
      const renderCycle = (extra: TPropertyEditorProps) => (
        <CycleSelect
          projectId={issue?.project_id ?? undefined}
          value={issue?.cycle_id}
          onChange={handleCycle}
          disabled={isReadOnly}
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
          disabled: isReadOnly,
          editor: ({ onEditorClose }) => renderCycle(getPropertyEditorProps(onEditorClose)),
        },
      });
    }
  }

  // estimates
  if (projectId && areEstimateEnabledByProjectId(projectId?.toString()) && isShown("estimate")) {
    const renderEstimate = (extra: TPropertyEditorProps) => (
      <EstimateSelect
        value={issue.estimate_point ?? undefined}
        onChange={handleEstimate}
        projectId={issue.project_id ?? undefined}
        disabled={isReadOnly}
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
        preview: (issue.estimate_point && getEstimatePointDisplayValue(activeEstimate, issue.estimate_point)) || none,
        disabled: isReadOnly,
        editor: ({ onEditorClose }) => renderEstimate(getPropertyEditorProps(onEditorClose)),
      },
    });
  }

  // extra render properties
  // sub-issues
  if (!isEpic && isShown("sub_issue_count") && !!subIssueCount) {
    entries.push({
      key: "sub_issue_count",
      hidePriority: getWorkItemPropertyHidePriority("sub_issue_count"),
      measureKey: `${subIssueCount}`,
      chip: (
        <Tooltip label={`${t("common.sub_work_items")}: ${subIssueCount}`} disabled={isMobile}>
          <Pill
            size="sm"
            aria-label={`${t("common.sub_work_items")}: ${subIssueCount}`}
            label={`${subIssueCount}`}
            startIcon={<Icon icon={SubWorkItemsOutline} />}
            onFocus={handleEventPropagation}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (subIssueCount) redirectToIssueDetail();
            }}
          />
        </Tooltip>
      ),
      menuRow: {
        icon: <Icon icon={SubWorkItemsOutline} />,
        label: t("common.sub_work_items"),
        preview: `${subIssueCount}`,
        onSelect: redirectToIssueDetail,
      },
    });
  }

  // attachments
  if (isShown("attachment_count") && !!issue.attachment_count) {
    entries.push({
      key: "attachment_count",
      hidePriority: getWorkItemPropertyHidePriority("attachment_count"),
      measureKey: `${issue.attachment_count}`,
      chip: (
        <Tooltip label={`${t("common.attachments")}: ${issue.attachment_count}`} disabled={isMobile}>
          <Pill
            size="sm"
            aria-label={`${t("common.attachments")}: ${issue.attachment_count}`}
            label={`${issue.attachment_count}`}
            startIcon={<Icon icon={AttachOutline} />}
            onFocus={handleEventPropagation}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              router.push(workItemLink);
            }}
          />
        </Tooltip>
      ),
      menuRow: {
        icon: <Icon icon={AttachOutline} />,
        label: t("common.attachments"),
        preview: `${issue.attachment_count}`,
        onSelect: () => router.push(workItemLink),
      },
    });
  }

  // link
  if (isShown("link") && !!issue.link_count) {
    entries.push({
      key: "link",
      hidePriority: getWorkItemPropertyHidePriority("link"),
      measureKey: `${issue.link_count}`,
      chip: (
        <Tooltip label={`${t("common.links")}: ${issue.link_count}`} disabled={isMobile}>
          <Pill
            size="sm"
            aria-label={`${t("common.links")}: ${issue.link_count}`}
            label={`${issue.link_count}`}
            startIcon={<Icon icon={LinkOutline} />}
            onFocus={handleEventPropagation}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              router.push(workItemLink);
            }}
          />
        </Tooltip>
      ),
      menuRow: {
        icon: <Icon icon={LinkOutline} />,
        label: t("common.links"),
        preview: `${issue.link_count}`,
        onSelect: () => router.push(workItemLink),
      },
    });
  }

  // label
  if (isShown("labels")) {
    const labelIds = issue.label_ids ?? [];
    const labels = labelIds.flatMap((id) => {
      const label = labelMap[id];
      return label ? [{ id: label.id, name: label.name, color: label.color }] : [];
    });
    const renderPicker = (triggerClassName?: string) => (
      <IssuePropertyLabels
        projectId={issue?.project_id || null}
        value={labelIds}
        onChange={handleLabel}
        disabled={isReadOnly}
        buttonClassName={triggerClassName}
        className={triggerClassName ? "size-full" : undefined}
      />
    );
    const stepDownProps = { labels, disabled: isReadOnly, renderPicker };
    entries.push({
      key: "labels",
      hidePriority: getWorkItemPropertyHidePriority("labels"),
      measureKey: labels.map((label) => label.name).join(","),
      // Every rendering goes through the step-down chip so the picker keeps its place in the tree.
      chip: <LabelsStepDownChip {...stepDownProps} pillCount={0} />,
      variants: buildLabelStepDownVariants({
        ...stepDownProps,
        getOverflowText: (count) => t("issue.properties_overflow.label_overflow_indicator", { count }),
        getSummaryText: (count) => t("labels_count", { count }),
      }),
      menuRow: {
        icon: <LabelPropertyIcon className="size-4" />,
        label: t("common.labels"),
        preview: labelIds.length ? `${labelIds.length}` : none,
        disabled: isReadOnly,
        editor: ({ onEditorClose }) => (
          <IssuePropertyLabels
            projectId={issue?.project_id || null}
            value={labelIds}
            onChange={handleLabel}
            disabled={isReadOnly}
            onClose={onEditorClose}
            buttonClassName={PROPERTY_EDITOR_OVERLAY_CLASSNAME}
            className="contents"
            showTooltip={false}
          />
        ),
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
        forceCloseMenu={isRowDragging}
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
