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

import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { NETWORK_CHOICES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IWorkspace } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { renderFormattedPayloadDate, getDate } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { MembersDropdown } from "@/components/projects/dropdowns/members";
import { StateDropdown } from "@/components/projects/dropdowns/state";
import { ProjectNetworkIcon } from "@/components/projects/common/project-network-icon";
// plane web imports
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import type { TProject } from "@/types/projects";

type Props = {
  workspaceSlug: string;
  currentWorkspace: IWorkspace;
  isProjectGroupingEnabled: boolean;
  data?: Partial<TProject>;
  handleFormOnChange?: () => void;
};

function ProjectAttributes(props: Props) {
  const { workspaceSlug, currentWorkspace, isProjectGroupingEnabled, data, handleFormOnChange } = props;
  // plane imports
  const { t } = useTranslation();
  // react-hook-form
  const { control, setValue } = useFormContext<TProject>();
  // store
  const { defaultState } = useWorkspaceProjectStates();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isProjectGroupingEnabled && (
        <Controller
          name="state_id"
          control={control}
          render={({ field: { onChange, value } }) => (
            <StateDropdown
              value={value || data?.state_id || defaultState || ""}
              onChange={(state) => {
                onChange(state);
                handleFormOnChange?.();
              }}
              workspaceSlug={workspaceSlug.toString()}
              workspaceId={currentWorkspace.id}
              buttonClassName="h-7"
              disabled={false}
            />
          )}
        />
      )}
      <Controller
        name="network"
        control={control}
        render={({ field: { onChange, value } }) => {
          const currentNetwork = NETWORK_CHOICES.find((n) => n.key === value);

          return (
            <div className="flex-shrink-0 h-7" tabIndex={4}>
              <CustomSelect
                value={value}
                onChange={(e: number) => {
                  onChange(e);
                  handleFormOnChange?.();
                }}
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
                buttonClassName="h-full"
                noChevron
                tabIndex={4}
              >
                {NETWORK_CHOICES.map((network) => (
                  <CustomSelect.Option key={network.key} value={network.key}>
                    <div className="flex items-start gap-2">
                      <ProjectNetworkIcon iconKey={network.iconKey} className="h-3.5 w-3.5" />
                      <div className="-mt-1">
                        <p>{t(network.i18n_label)}</p>
                        <p className="text-11 text-placeholder">{t(network.description)}</p>
                      </div>
                    </div>
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          );
        }}
      />
      {isProjectGroupingEnabled && (
        <Controller
          control={control}
          name="start_date"
          render={({ field: { value: startDateValue, onChange: onChangeStartDate } }) => (
            <Controller
              control={control}
              name="target_date"
              render={({ field: { value: endDateValue, onChange: onChangeEndDate } }) => (
                <DateRangeDropdown
                  buttonVariant="border-with-text"
                  className="h-7"
                  minDate={new Date()}
                  value={{
                    from: getDate(startDateValue),
                    to: getDate(endDateValue),
                  }}
                  onSelect={(val) => {
                    onChangeStartDate(val?.from ? renderFormattedPayloadDate(val.from) : null);
                    onChangeEndDate(val?.to ? renderFormattedPayloadDate(val.to) : null);
                    handleFormOnChange?.();
                  }}
                  placeholder={{
                    from: "Start date",
                    to: "End date",
                  }}
                  hideIcon={{
                    to: true,
                  }}
                  tabIndex={3}
                />
              )}
            />
          )}
        />
      )}
      {isProjectGroupingEnabled && (
        <Controller
          control={control}
          name="priority"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <PriorityDropdown
                value={value || data?.priority}
                onChange={(priority) => {
                  onChange(priority);
                  handleFormOnChange?.();
                }}
                buttonVariant="border-with-text"
              />
            </div>
          )}
        />
      )}
      <Controller
        name="project_lead"
        control={control}
        render={({ field: { value, onChange } }) => {
          if (value === undefined || value === null || typeof value === "string")
            return (
              <div className="flex-shrink-0 h-7" tabIndex={5}>
                <MemberDropdown
                  value={value ?? null}
                  onChange={(lead) => {
                    const newLead = lead === value ? null : lead;
                    // Use setValue with shouldDirty to explicitly mark form as dirty
                    setValue("project_lead", newLead, { shouldDirty: true });
                    // Update Controller's field value to keep it in sync
                    onChange(newLead);
                    handleFormOnChange?.();
                  }}
                  placeholder="Lead"
                  multiple={false}
                  buttonVariant="border-with-text"
                  tabIndex={5}
                />
              </div>
            );
          else return <></>;
        }}
      />
      {isProjectGroupingEnabled && (
        <Controller
          control={control}
          name="members"
          render={({ field: { value, onChange } }) => (
            <MembersDropdown
              value={value as unknown as string[]}
              onChange={(members) => {
                onChange(members);
                handleFormOnChange?.();
              }}
              className="h-7"
            />
          )}
        />
      )}
    </div>
  );
}

export default ProjectAttributes;
