/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, type Control, useWatch } from "react-hook-form";
import { ETabIndices, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
import { getDate, renderFormattedPayloadDate, getTabIndex } from "@plane/utils";
import { CycleDropdown } from "@/components/dropdowns/cycle";
import { DateDropdown } from "@/components/dropdowns/date";
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ModuleDropdown } from "@/components/dropdowns/module/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { IssueLabelSelect } from "@/components/issues/select";
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { IssueTypeSelect } from "@/plane-web/components/issues/issue-modal";
import type { TWorkItemTemplateFormFields } from "./work-item-template-form.types";

export type { TWorkItemTemplateFormFields } from "./work-item-template-form.types";

type TDefaultWorkItemFieldsProps = {
  control: Control<TWorkItemTemplateFormFields>;
  projectId: string | null;
  workspaceSlug: string;
};

export const WorkItemTemplateDefaultValueFields = observer(function WorkItemTemplateDefaultValueFields(
  props: TDefaultWorkItemFieldsProps
) {
  const { control, projectId, workspaceSlug } = props;
  const { t } = useTranslation();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { getProjectById } = useProject();
  const { isMobile } = usePlatformOS();
  const { allowPermissions } = useUserPermissions();

  const startDate = useWatch({ control, name: "start_date" });
  const targetDate = useWatch({ control, name: "target_date" });

  const projectDetails = getProjectById(projectId);
  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  const canCreateLabel =
    projectId && allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  const issueControl = control as unknown as Control<Partial<TIssue>>;

  const minDate = getDate(startDate);
  minDate?.setDate(minDate.getDate());
  const maxDate = getDate(targetDate);
  maxDate?.setDate(maxDate.getDate());

  return (
    <div className="space-y-3 rounded-md border border-subtle bg-layer-1 p-4">
      <h4 className="text-14 font-medium text-primary">
        {t("workspace_settings.settings.work_item_templates.form.default_values_section_title")}
      </h4>
      <p className="-mt-1 text-11 text-tertiary">
        {t("workspace_settings.settings.work_item_templates.form.default_values_section_hint")}
      </p>

      {!projectId ? (
        <p className="rounded-md border border-subtle bg-layer-2 px-3 py-2 text-12 text-tertiary">
          {t("workspace_settings.settings.work_item_templates.form.project_required_for_scoped_fields")}
        </p>
      ) : null}

      {projectId ? (
        <div className="h-7 max-w-xs">
          <IssueTypeSelect control={issueControl} projectId={projectId} handleFormChange={() => {}} renderChevron />
        </div>
      ) : null}

      <div>
        <label className="text-12 text-tertiary" htmlFor="work-item-payload-name">
          {t("workspace_settings.settings.work_item_templates.form.default_work_item_name")}
        </label>
        <Controller
          name="workItemName"
          control={control}
          render={({ field }) => (
            <Input
              id="work-item-payload-name"
              className="mt-1 w-full"
              value={field.value}
              onChange={field.onChange}
              placeholder={t("workspace_settings.settings.work_item_templates.form.default_work_item_name_placeholder")}
            />
          )}
        />
      </div>
      <div>
        <label className="text-12 text-tertiary" htmlFor="work-item-payload-desc">
          {t("workspace_settings.settings.work_item_templates.form.default_work_item_description")}
        </label>
        <p className="pt-0.5 pb-1 text-11 text-tertiary">
          {t("workspace_settings.settings.work_item_templates.form.default_work_item_description_hint")}
        </p>
        <Controller
          name="workItemDescriptionPlain"
          control={control}
          render={({ field }) => (
            <TextArea
              id="work-item-payload-desc"
              className="mt-1 min-h-[180px] w-full resize-y"
              value={field.value}
              onChange={field.onChange}
              rows={8}
              placeholder={t(
                "workspace_settings.settings.work_item_templates.form.default_work_item_description_placeholder"
              )}
            />
          )}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {projectId ? (
          <Controller
            control={control}
            name="state_id"
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <StateDropdown
                  value={value}
                  onChange={(stateId) => onChange(stateId)}
                  projectId={projectId ?? undefined}
                  buttonVariant="border-with-text"
                  tabIndex={getIndex("state_id")}
                  isForWorkItemCreation
                />
              </div>
            )}
          />
        ) : null}
        <Controller
          control={control}
          name="priority"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <PriorityDropdown
                value={value}
                onChange={(p) => onChange(p)}
                buttonVariant="border-with-text"
                placeholder={t("common.priority")}
                dropdownArrow
              />
            </div>
          )}
        />
        <div className="h-7 min-w-0 sm:min-w-[12rem]">
          <Controller
            name="assignee_ids"
            control={control}
            render={({ field: { value, onChange } }) => (
              <MemberDropdown
                projectId={projectId ?? undefined}
                value={value}
                onChange={(ids) => onChange(ids)}
                buttonVariant={value?.length > 0 ? "transparent-without-text" : "border-with-text"}
                buttonClassName={value?.length > 0 ? "hover:bg-transparent" : ""}
                placeholder={t("assignees")}
                multiple
              />
            )}
          />
        </div>
        {projectId ? (
          <Controller
            control={control}
            name="label_ids"
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <IssueLabelSelect
                  value={value}
                  onChange={(labelIds) => onChange(labelIds)}
                  projectId={projectId ?? undefined}
                  tabIndex={getIndex("label_ids")}
                  createLabelEnabled={!!canCreateLabel}
                />
              </div>
            )}
          />
        ) : null}
        <Controller
          control={control}
          name="start_date"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <DateDropdown
                value={value}
                onChange={(date) => onChange(date ? renderFormattedPayloadDate(date) : null)}
                buttonVariant="border-with-text"
                maxDate={maxDate ?? undefined}
                placeholder={t("start_date")}
                tabIndex={getIndex("start_date")}
              />
            </div>
          )}
        />
        <Controller
          control={control}
          name="target_date"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <DateDropdown
                value={value}
                onChange={(date) => onChange(date ? renderFormattedPayloadDate(date) : null)}
                buttonVariant="border-with-text"
                minDate={minDate ?? undefined}
                placeholder={t("due_date")}
                tabIndex={getIndex("target_date")}
              />
            </div>
          )}
        />
        {projectId && projectDetails?.cycle_view ? (
          <Controller
            control={control}
            name="cycle_id"
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <CycleDropdown
                  projectId={projectId ?? undefined}
                  onChange={(cycleId) => onChange(cycleId)}
                  placeholder={t("cycle.label", { count: 1 })}
                  value={value}
                  buttonVariant="border-with-text"
                  tabIndex={getIndex("cycle_id")}
                />
              </div>
            )}
          />
        ) : null}
        {projectId && projectDetails?.module_view && workspaceSlug ? (
          <Controller
            control={control}
            name="module_ids"
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <ModuleDropdown
                  projectId={projectId ?? undefined}
                  value={value ?? []}
                  onChange={(moduleIds) => onChange(moduleIds)}
                  placeholder={t("modules")}
                  buttonVariant="border-with-text"
                  tabIndex={getIndex("module_ids")}
                  multiple
                  showCount
                />
              </div>
            )}
          />
        ) : null}
        {projectId && areEstimateEnabledByProjectId(projectId) ? (
          <Controller
            control={control}
            name="estimate_point"
            render={({ field: { value, onChange } }) => (
              <div className="h-7">
                <EstimateDropdown
                  value={value || undefined}
                  onChange={(estimatePoint) => onChange(estimatePoint)}
                  projectId={projectId}
                  buttonVariant="border-with-text"
                  tabIndex={getIndex("estimate_point")}
                  placeholder={t("estimate")}
                />
              </div>
            )}
          />
        ) : null}
      </div>
    </div>
  );
});
