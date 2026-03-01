/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { NETWORK_CHOICES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TProjectTemplateForm, TProjectTemplateFormData } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import type { TProjectSanitizationResult } from "@plane/utils";
import { cn, getDate, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { ProjectNetworkIcon } from "@/components/projects/common/project-network-icon";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { MembersDropdown } from "@/components/projects/dropdowns/members";
import { StateDropdown } from "@/components/projects/dropdowns/state";
import { COMMON_BUTTON_CLASS_NAME, COMMON_ERROR_CLASS_NAME } from "@/components/templates/settings/common";
import { useFlag, useWorkspaceFeatures, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";

type TProjectAttributesProps = {
  workspaceSlug: string;
  templateInvalidIds?: TProjectSanitizationResult<TProjectTemplateFormData>["invalid"];
  handleTemplateInvalidIdsChange: <K extends keyof TProjectTemplateFormData>(
    key: K,
    invalidIds: TProjectSanitizationResult<TProjectTemplateFormData>["invalid"][K]
  ) => void;
};

export const ProjectAttributes = observer(function ProjectAttributes(props: TProjectAttributesProps) {
  const { workspaceSlug, templateInvalidIds, handleTemplateInvalidIdsChange } = props;
  // plane hooks
  const { t } = useTranslation();
  // form context
  const {
    control,
    formState: { errors },
  } = useFormContext<TProjectTemplateForm>();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { defaultState } = useWorkspaceProjectStates();
  // derived values
  const isProjectGroupingFlagEnabled = useFlag(workspaceSlug.toString(), "PROJECT_GROUPING");
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) && isProjectGroupingFlagEnabled;

  if (!currentWorkspace) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-subtle">
      {isProjectGroupingEnabled && (
        <Controller
          name="project.state_id"
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="flex-shrink-0 h-7">
              <StateDropdown
                value={value || defaultState || ""}
                onChange={(stateId) => {
                  onChange(stateId);
                  handleTemplateInvalidIdsChange("state_id", null);
                }}
                workspaceSlug={workspaceSlug.toString()}
                workspaceId={currentWorkspace.id}
                className="h-full"
                buttonClassName={cn("h-full", COMMON_BUTTON_CLASS_NAME, {
                  [COMMON_ERROR_CLASS_NAME]: Boolean(errors?.project?.state_id || templateInvalidIds?.state_id),
                })}
                disabled={false}
                optionsClassName="z-20"
              />
            </div>
          )}
        />
      )}
      {isProjectGroupingEnabled && (
        <Controller
          control={control}
          name="project.priority"
          render={({ field: { value, onChange } }) => (
            <div className="flex-shrink-0 h-7">
              <PriorityDropdown
                value={value}
                onChange={(priority) => {
                  onChange(priority);
                }}
                buttonVariant="border-with-text"
                buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                  [COMMON_ERROR_CLASS_NAME]: Boolean(errors?.project?.priority),
                })}
              />
            </div>
          )}
        />
      )}
      <Controller
        name="project.network"
        control={control}
        render={({ field: { onChange, value } }) => {
          const currentNetwork = NETWORK_CHOICES.find((n) => n.key === value);
          return (
            <div className="flex-shrink-0 h-7">
              <CustomSelect
                value={value}
                onChange={onChange}
                label={
                  <div className="flex items-center gap-1 h-full">
                    {currentNetwork ? (
                      <>
                        <ProjectNetworkIcon iconKey={currentNetwork.iconKey} />
                        {t(currentNetwork.i18n_label)}
                      </>
                    ) : (
                      <span className="text-placeholder">Select network</span>
                    )}
                  </div>
                }
                placement="bottom-start"
                className="h-full"
                buttonClassName={cn("h-full", COMMON_BUTTON_CLASS_NAME, {
                  [COMMON_ERROR_CLASS_NAME]: Boolean(errors?.project?.network),
                })}
                noChevron
              >
                {NETWORK_CHOICES.map((network) => (
                  <CustomSelect.Option key={network.key} value={network.key}>
                    <div className="flex items-start gap-2">
                      <ProjectNetworkIcon iconKey={network.iconKey} className="h-3.5 w-3.5" />
                      <div className="-mt-1">
                        <p>{t(network.i18n_label)}</p>
                        <p className="text-caption-sm-regular text-placeholder">{t(network.description)}</p>
                      </div>
                    </div>
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          );
        }}
      />
      <Controller
        name="project.project_lead"
        control={control}
        render={({ field: { value, onChange } }) => {
          if (value === undefined || value === null || typeof value === "string")
            return (
              <div className="flex-shrink-0 h-7">
                <MemberDropdown
                  value={value ?? null}
                  onChange={(lead) => {
                    onChange(lead === value ? null : lead);
                    handleTemplateInvalidIdsChange("project_lead", null);
                  }}
                  placeholder="Lead"
                  multiple={false}
                  buttonVariant="border-with-text"
                  buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                    [COMMON_ERROR_CLASS_NAME]: Boolean(
                      errors?.project?.project_lead || templateInvalidIds?.project_lead
                    ),
                  })}
                />
              </div>
            );
          else return <></>;
        }}
      />
      {isProjectGroupingEnabled && (
        <Controller
          control={control}
          name="project.members"
          render={({ field: { value, onChange } }) => (
            <div className="flex-shrink-0 h-7">
              <MembersDropdown
                value={value ?? []}
                onChange={(members) => {
                  onChange(members);
                  handleTemplateInvalidIdsChange("members", []);
                }}
                buttonClassName={cn(COMMON_BUTTON_CLASS_NAME, {
                  [COMMON_ERROR_CLASS_NAME]: Boolean(
                    errors?.project?.members || (templateInvalidIds?.members && templateInvalidIds?.members?.length > 0)
                  ),
                })}
              />
            </div>
          )}
        />
      )}
      {isProjectGroupingEnabled && (
        <Controller
          control={control}
          name="project.start_date"
          render={({ field: { value: startDateValue, onChange: onChangeStartDate } }) => (
            <Controller
              control={control}
              name="project.target_date"
              render={({ field: { value: endDateValue, onChange: onChangeEndDate } }) => (
                <div className="flex-shrink-0 h-7">
                  <DateRangeDropdown
                    buttonVariant="border-with-text"
                    className={cn(COMMON_BUTTON_CLASS_NAME, {
                      [COMMON_ERROR_CLASS_NAME]:
                        Boolean(errors?.project?.start_date) || Boolean(errors?.project?.target_date),
                    })}
                    minDate={new Date()}
                    value={{
                      from: getDate(startDateValue),
                      to: getDate(endDateValue),
                    }}
                    onSelect={(val) => {
                      onChangeStartDate(val?.from ? renderFormattedPayloadDate(val.from) : null);
                      onChangeEndDate(val?.to ? renderFormattedPayloadDate(val.to) : null);
                    }}
                    placeholder={{
                      from: "Start date",
                      to: "End date",
                    }}
                    hideIcon={{
                      to: true,
                    }}
                  />
                </div>
              )}
            />
          )}
        />
      )}
    </div>
  );
});
