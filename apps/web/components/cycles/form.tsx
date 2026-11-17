/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import {
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { ETabIndices } from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import { DateRangeSelect } from "@plane/blocks/property-select";
import { Button } from "@makeplane/propel/components/button";
import { CalendarOutline } from "@makeplane/propel/icons";
import type { ICycle } from "@plane/types";
import { getDate, renderFormattedPayloadDate, getTabIndex } from "@plane/utils";
// components
import { ProjectSelect } from "@/components/dropdowns/project/project-select";
// hooks
import { useUserProfile } from "@/hooks/store/user";
import { useUser } from "@/hooks/store/user/user-user";

type Props = {
  handleFormSubmit: (values: Partial<ICycle>) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  projectId: string;
  setActiveProject: (projectId: string) => void;
  data?: ICycle | null;
  isMobile?: boolean;
};

const defaultValues: Partial<ICycle> = {
  name: "",
  description: "",
  start_date: null,
  end_date: null,
};

export function CycleForm(props: Props) {
  const { handleFormSubmit, handleClose, status, projectId, setActiveProject, data, isMobile = false } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { projectsWithCreatePermissions } = useUser();
  const { data: userProfile } = useUserProfile();
  // form data
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
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

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CYCLE, isMobile);

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit((formData) => handleFormSubmit(formData))}>
      <DialogMain>
        <DialogHeader>
          <div className="flex items-center gap-x-3">
            {!status && (
              <Controller
                control={control}
                name="project_id"
                render={({ field: { value, onChange } }) => (
                  <ProjectSelect
                    value={value}
                    onChange={(val) => {
                      if (!val) return;
                      onChange(val);
                      setActiveProject(val);
                    }}
                    multiple={false}
                    variant="pill-sm"
                    filterOption={(id) => !!projectsWithCreatePermissions?.[id]}
                    tabIndex={getIndex("cover_image")}
                  />
                )}
              />
            )}
            <DialogHeading>
              <DialogTitle>{status ? t("project_cycles.update_cycle") : t("project_cycles.create_cycle")}</DialogTitle>
            </DialogHeading>
          </div>
        </DialogHeader>
        <DialogBody tabIndex={0}>
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
                  <InputField
                    size="xl"
                    orientation="vertical"
                    error={errors?.name?.message}
                    name="name"
                    type="text"
                    placeholder={t("title")}
                    value={value}
                    onChange={onChange}
                    tabIndex={getIndex("description")}
                    autoFocus
                    aria-label={t("title")}
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="description"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextAreaField
                    size="xl"
                    autoResize
                    maxRows={8}
                    error={errors?.description?.message}
                    name="description"
                    placeholder={t("description")}
                    aria-label={t("description")}
                    value={value}
                    onChange={onChange}
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
                      <DateRangeSelect
                        variant="pill-sm"
                        className="max-w-none"
                        minDate={new Date()}
                        value={{
                          from: getDate(startDateValue) ?? null,
                          to: getDate(endDateValue) ?? null,
                        }}
                        onChange={(val) => {
                          onChangeStartDate(val.from ? renderFormattedPayloadDate(val.from) : null);
                          onChangeEndDate(val.to ? renderFormattedPayloadDate(val.to) : null);
                        }}
                        icon={<CalendarOutline />}
                        placeholder={`${t("start_date")} - ${t("end_date")}`}
                        weekStartsOn={userProfile?.start_of_the_week}
                        tabIndex={getIndex("date_range")}
                      />
                    )}
                  />
                )}
              />
            </div>
          </div>
        </DialogBody>
      </DialogMain>
      <DialogActions>
        <Button
          variant="secondary"
          size="md"
          stretch="auto"
          onClick={handleClose}
          tabIndex={getIndex("cancel")}
          label={t("common.cancel")}
        />
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          type="submit"
          loading={isSubmitting}
          tabIndex={getIndex("submit")}
          label={
            data
              ? isSubmitting
                ? t("common.updating")
                : t("project_cycles.update_cycle")
              : isSubmitting
                ? t("common.creating")
                : t("project_cycles.create_cycle")
          }
        />
      </DialogActions>
    </form>
  );
}
