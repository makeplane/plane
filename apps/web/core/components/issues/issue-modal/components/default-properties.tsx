/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Icon as PropelIcon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { Pill } from "@makeplane/propel/components/pill";
import { Pill as PillChrome } from "@makeplane/propel/elements/pill";
import { CalendarOutline, ParentOutline } from "@makeplane/propel/icons";
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// types
import type { ISearchIssueResponse, TIssue } from "@plane/types";
// ui
import { DateSelect } from "@plane/blocks/property-select";
import { getDate, renderFormattedPayloadDate, getTabIndex } from "@plane/utils";
// components
import { CycleSelect } from "@/components/dropdowns/cycle/cycle-select";
import { EstimateSelect } from "@/components/dropdowns/estimate/estimate-select";
import { LabelSelect } from "@/components/dropdowns/label/label-select";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { ModuleSelect } from "@/components/dropdowns/module/module-select";
import { PrioritySelect } from "@/components/dropdowns/priority/priority-select";
import { StateSelect } from "@/components/dropdowns/state/state-select";
import { ParentIssuesListModal } from "@/components/issues/parent-issues-list-modal";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserProfile } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssueDefaultPropertiesProps = {
  control: Control<TIssue>;
  id: string | undefined;
  projectId: string | null;
  workspaceSlug: string;
  selectedParentIssue: ISearchIssueResponse | null;
  startDate: string | null;
  targetDate: string | null;
  parentId: string | null;
  isDraft: boolean;
  handleFormChange: () => void;
  setSelectedParentIssue: (issue: ISearchIssueResponse) => void;
};

export const IssueDefaultProperties = observer(function IssueDefaultProperties(props: TIssueDefaultPropertiesProps) {
  const {
    control,
    id,
    projectId,
    workspaceSlug,
    selectedParentIssue,
    startDate,
    targetDate,
    parentId,
    isDraft,
    handleFormChange,
    setSelectedParentIssue,
  } = props;
  // states
  const [parentIssueListModalOpen, setParentIssueListModalOpen] = useState(false);
  // store hooks
  const { t } = useTranslation();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { getProjectById } = useProject();
  const { getProjectDefaultStateId } = useProjectState();
  const { isMobile } = usePlatformOS();
  const { data: userProfile } = useUserProfile();
  // derived values
  const projectDetails = getProjectById(projectId);

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  const minDate = getDate(startDate);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(targetDate);
  maxDate?.setDate(maxDate.getDate());

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Controller
        control={control}
        name="state_id"
        render={({ field: { value, onChange } }) => (
          <StateSelect
            testId="create-work-item-state-select"
            // an empty state shows the project's default state, as the legacy dropdown did
            value={value || getProjectDefaultStateId(projectId)}
            onChange={(stateId) => {
              onChange(stateId);
              handleFormChange();
            }}
            projectId={projectId ?? undefined}
            variant="pill-md"
            tabIndex={getIndex("state_id")}
          />
        )}
      />
      <Controller
        control={control}
        name="priority"
        render={({ field: { value, onChange } }) => (
          <PrioritySelect
            testId="create-work-item-priority-select"
            value={value}
            onChange={(priority) => {
              onChange(priority);
              handleFormChange();
            }}
            variant="pill-md"
            tabIndex={getIndex("priority")}
          />
        )}
      />
      <Controller
        control={control}
        name="assignee_ids"
        render={({ field: { value, onChange } }) => (
          <MemberSelect
            testId="create-work-item-assignee-select"
            projectId={projectId ?? undefined}
            value={value}
            onChange={(assigneeIds) => {
              onChange(assigneeIds);
              handleFormChange();
            }}
            placeholder={t("assignees")}
            multiple
            variant={value?.length ? "avatar-group-md" : "pill-md"}
            tabIndex={getIndex("assignee_ids")}
          />
        )}
      />
      <Controller
        control={control}
        name="label_ids"
        render={({ field: { value, onChange } }) => (
          <LabelSelect
            testId="create-work-item-label-select"
            projectId={projectId ?? undefined}
            value={value ?? []}
            onChange={(labelIds) => {
              onChange(labelIds);
              handleFormChange();
            }}
            variant="pill-md"
            placeholder={t("labels")}
            tabIndex={getIndex("label_ids")}
          />
        )}
      />
      <Controller
        control={control}
        name="start_date"
        render={({ field: { value, onChange } }) => (
          <DateSelect
            value={getDate(value) ?? null}
            onChange={(date) => {
              onChange(date ? renderFormattedPayloadDate(date) : null);
              handleFormChange();
            }}
            maxDate={maxDate ?? undefined}
            placeholder={t("start_date")}
            icon={<CalendarOutline />}
            weekStartsOn={userProfile?.start_of_the_week}
            clearable
            tabIndex={getIndex("start_date")}
            variant="pill-md"
            testId="create-work-item-start-date-select"
          />
        )}
      />
      <Controller
        control={control}
        name="target_date"
        render={({ field: { value, onChange } }) => (
          <DateSelect
            value={getDate(value) ?? null}
            onChange={(date) => {
              onChange(date ? renderFormattedPayloadDate(date) : null);
              handleFormChange();
            }}
            minDate={minDate ?? undefined}
            placeholder={t("due_date")}
            icon={<CalendarOutline />}
            weekStartsOn={userProfile?.start_of_the_week}
            clearable
            tabIndex={getIndex("target_date")}
            variant="pill-md"
            testId="create-work-item-due-date-select"
          />
        )}
      />
      {projectDetails?.cycle_view && projectId && (
        <Controller
          control={control}
          name="cycle_id"
          render={({ field: { value, onChange } }) => (
            <CycleSelect
              projectId={projectId}
              onChange={(cycleId) => {
                onChange(cycleId);
                handleFormChange();
              }}
              placeholder={t("cycle.label", { count: 1 })}
              value={value ?? null}
              variant="pill-md"
              clearable
              tabIndex={getIndex("cycle_id")}
            />
          )}
        />
      )}
      {projectDetails?.module_view && workspaceSlug && projectId && (
        <Controller
          control={control}
          name="module_ids"
          render={({ field: { value, onChange } }) => (
            <ModuleSelect
              multiple
              projectId={projectId}
              value={value ?? []}
              onChange={(moduleIds) => {
                onChange(moduleIds);
                handleFormChange();
              }}
              placeholder={t("modules")}
              variant="pill-md"
              tabIndex={getIndex("module_ids")}
            />
          )}
        />
      )}
      {projectId && areEstimateEnabledByProjectId(projectId) && (
        <Controller
          control={control}
          name="estimate_point"
          render={({ field: { value, onChange } }) => (
            <EstimateSelect
              value={value || undefined}
              onChange={(estimatePoint) => {
                onChange(estimatePoint);
                handleFormChange();
              }}
              projectId={projectId}
              variant="pill-md"
              placeholder={t("estimate")}
              tabIndex={getIndex("estimate_point")}
            />
          )}
        />
      )}
      {parentId ? (
        <Menu>
          <MenuTrigger
            tabIndex={getIndex("parent_id")}
            render={
              // `MenuTrigger` supplies the real button, so this is chrome only.
              <PillChrome size="sm" variant="outline" render={<span />}>
                {selectedParentIssue?.project_id && (
                  <IssueIdentifier
                    projectId={selectedParentIssue.project_id}
                    issueTypeId={selectedParentIssue.type_id}
                    projectIdentifier={selectedParentIssue?.project__identifier}
                    issueSequenceId={selectedParentIssue.sequence_id}
                    size="xs"
                  />
                )}
              </PillChrome>
            }
          />
          <MenuContent side="bottom" align="start">
            <MenuItem label={t("change_parent_issue")} onClick={() => setParentIssueListModalOpen(true)} />
            <Controller
              control={control}
              name="parent_id"
              render={({ field: { onChange } }) => (
                <MenuItem
                  label={t("remove_parent_issue")}
                  onClick={() => {
                    onChange(null);
                    handleFormChange();
                  }}
                />
              )}
            />
          </MenuContent>
        </Menu>
      ) : (
        <Pill
          size="sm"
          variant="outline"
          startIcon={<PropelIcon icon={<ParentOutline className="size-3.5" />} />}
          onClick={() => setParentIssueListModalOpen(true)}
          label={t("add_parent")}
        />
      )}
      <Controller
        control={control}
        name="parent_id"
        render={({ field: { onChange } }) => (
          <ParentIssuesListModal
            isOpen={parentIssueListModalOpen}
            handleClose={() => setParentIssueListModalOpen(false)}
            onChange={(issue) => {
              onChange(issue.id);
              handleFormChange();
              setSelectedParentIssue(issue);
            }}
            projectId={projectId ?? undefined}
            issueId={isDraft ? undefined : id}
          />
        )}
      />
    </div>
  );
});
