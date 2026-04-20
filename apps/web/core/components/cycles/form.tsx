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

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { ETabIndices } from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { ICycle } from "@plane/types";
// ui
import { Input, TextArea } from "@plane/ui";
import { getDate, renderFormattedPayloadDate, getTabIndex } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  status: boolean;
  projectId: string;
  setActiveProject: (projectId: string) => void;
  data?: Partial<ICycle> | null;
  isMobile?: boolean;
  isBackwardDateEditEnabled?: boolean;
  onChange?: (formData: Partial<ICycle> | null) => Promise<void>;
  showActionButtons?: boolean;
  handleClose?: () => void;
  handleFormSubmit?: (values: Partial<ICycle>) => Promise<void>;
  workspaceSlug: string;
};

const defaultValues: Partial<ICycle> = {
  name: "",
  description: "",
  start_date: null,
  end_date: null,
};

export function CycleForm(props: Props) {
  const {
    handleFormSubmit,
    handleClose,
    status,
    projectId,
    setActiveProject,
    data,
    isMobile = false,
    isBackwardDateEditEnabled = false,
    showActionButtons = true,
    onChange,
    workspaceSlug,
  } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { workspaceProjectIds } = useProject();
  const {
    permissions: { getProjectIdsWithCyclePermission },
  } = useCycle();
  // form data
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    watch,
    reset,
  } = useForm<ICycle>({
    defaultValues: {
      project_id: projectId,
      name: data?.name || "",
      description: data?.description || "",
      start_date: data?.start_date || null,
      end_date: data?.end_date || null,
    },
  });
  // derived values
  const projectIdsWithCreateCyclePermission = getProjectIdsWithCyclePermission(
    workspaceSlug,
    workspaceProjectIds ?? [],
    "create"
  );

  const handleOnChange = () => {
    if (!onChange) return;
    onChange(watch());
  };

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CYCLE, isMobile);

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit((formData) => handleFormSubmit?.(formData))}>
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-x-3">
          {!status && (
            <Controller
              control={control}
              name="project_id"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <ProjectDropdown
                    value={value}
                    onChange={(val) => {
                      if (!Array.isArray(val)) {
                        onChange(val);
                        setActiveProject(val);
                        handleOnChange();
                      }
                    }}
                    multiple={false}
                    buttonVariant="border-with-text"
                    renderCondition={(projectId) => projectIdsWithCreateCyclePermission.has(projectId)}
                    tabIndex={getIndex("cover_image")}
                  />
                </div>
              )}
            />
          )}
          <h3 className="text-18 font-medium text-secondary">
            {status ? t("project_cycles.update_cycle") : t("project_cycles.create_cycle")}
          </h3>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Controller
              name="name"
              control={control}
              rules={{
                required: t("title_is_required"),
                maxLength: {
                  value: 255,
                  message: t("title_should_be_less_than_255_characters"),
                },
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  name="name"
                  type="text"
                  placeholder={t("title")}
                  className="w-full text-14"
                  value={value}
                  inputSize="md"
                  onChange={(e) => {
                    onChange(e.target.value);
                    handleOnChange();
                  }}
                  hasError={Boolean(errors?.name)}
                  tabIndex={getIndex("description")}
                  autoFocus
                />
              )}
            />
            <span className="text-11 text-danger-primary">{errors?.name?.message}</span>
          </div>
          <div>
            <Controller
              name="description"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextArea
                  name="description"
                  placeholder={t("description")}
                  className="w-full text-14 resize-none min-h-24"
                  hasError={Boolean(errors?.description)}
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    handleOnChange();
                  }}
                  tabIndex={getIndex("description")}
                />
              )}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Controller
              control={control}
              name="start_date"
              render={({ field: { value: startDateValue, onChange: onChangeStartDate } }) => (
                <Controller
                  control={control}
                  name="end_date"
                  render={({ field: { value: endDateValue, onChange: onChangeEndDate } }) => (
                    <DateRangeDropdown
                      buttonVariant="border-with-text"
                      className="h-7"
                      minDate={isBackwardDateEditEnabled ? undefined : new Date()}
                      value={{
                        from: getDate(startDateValue),
                        to: getDate(endDateValue),
                      }}
                      onSelect={(val) => {
                        onChangeStartDate(val?.from ? renderFormattedPayloadDate(val.from) : null);
                        onChangeEndDate(val?.to ? renderFormattedPayloadDate(val.to) : null);
                        handleOnChange();
                      }}
                      placeholder={{
                        from: "Start date",
                        to: "End date",
                      }}
                      hideIcon={{
                        to: true,
                      }}
                      tabIndex={getIndex("date_range")}
                    />
                  )}
                />
              )}
            />
          </div>
        </div>
      </div>
      {showActionButtons && (
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
          <Button variant="secondary" size="lg" onClick={handleClose} tabIndex={getIndex("cancel")}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting} tabIndex={getIndex("submit")}>
            {data
              ? isSubmitting
                ? t("common.updating")
                : t("project_cycles.update_cycle")
              : isSubmitting
                ? t("common.creating")
                : t("project_cycles.create_cycle")}
          </Button>
        </div>
      )}
    </form>
  );
}
