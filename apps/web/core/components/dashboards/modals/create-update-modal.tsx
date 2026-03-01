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
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TDashboard } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";

type Props = {
  data?: Partial<TDashboard>;
  isOpen: boolean;
  onClose: () => void;
};

const defaultValues: Partial<TDashboard> = {
  name: "",
  project_ids: [],
};

export const CreateUpdateWorkspaceDashboardModal = observer(function CreateUpdateWorkspaceDashboardModal(props: Props) {
  const { data, isOpen, onClose } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // app router
  const router = useAppRouter();
  // store hooks
  const {
    getDashboardById,
    workspaceDashboards: { canCurrentUserCreateDashboard, createDashboard },
  } = useDashboards();
  const { getProjectById } = useProject();
  // form info
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<TDashboard>({
    defaultValues,
  });
  // derived value
  const isEditing = !!data?.id;
  // translation
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      reset();
    }, 300);
  };

  const handleCreate = async (payload: Partial<TDashboard>) => {
    if (!canCurrentUserCreateDashboard) return;
    const res = await createDashboard(payload);
    if (res.id) {
      const { toggleViewingMode } = getDashboardById(res.id) ?? {};
      toggleViewingMode?.(false);
    }
    return res;
  };

  const handleUpdate = async (payload: Partial<TDashboard>) => {
    if (!isEditing || !data?.id) return;
    const { updateDashboard } = getDashboardById(data.id) ?? {};
    await updateDashboard?.(payload);
  };

  const handleFormSubmit = async (payload: Partial<TDashboard>) => {
    try {
      if (isEditing) {
        await handleUpdate(payload);
      } else {
        const res = await handleCreate(payload);
        router.push(`/${workspaceSlug?.toString()}/dashboards/${res?.id}`);
      }
      handleClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong. Please try again.",
      });
    }
  };

  // update form values from pre-defined data
  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  if (!canCurrentUserCreateDashboard) return;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-heading-md font-medium text-secondary">
            {isEditing ? t("dashboards.create_modal.heading.update") : t("dashboards.create_modal.heading.create")}
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="inline-block mb-2 text-caption-md text-secondary font-medium">
                {t("dashboards.create_modal.title.label")}
              </label>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: t("dashboards.create_modal.title.required_error"),
                }}
                render={({ field: { value, onChange } }) => (
                  <Input
                    type="text"
                    placeholder={t("dashboards.create_modal.title.placeholder")}
                    className="w-full px-2 py-1.5 text-body-xs"
                    value={value}
                    onChange={onChange}
                    hasError={Boolean(errors?.name)}
                    autoFocus
                    maxLength={255}
                  />
                )}
              />
              <span className="text-caption-xs text-danger-primary">{errors?.name?.message}</span>
            </div>
            <div>
              <label className="inline-block mb-2 text-caption-md text-secondary font-medium">
                {t("dashboards.create_modal.project.label")}
              </label>
              <div className="space-y-1">
                <Controller
                  name="project_ids"
                  control={control}
                  rules={{
                    required: t("dashboards.create_modal.project.required_error"),
                  }}
                  render={({ field: { value, onChange } }) => (
                    <ProjectDropdown
                      value={value ?? []}
                      onChange={(val) => {
                        if (Array.isArray(val)) {
                          onChange(val);
                        }
                      }}
                      button={
                        <div
                          className={cn(
                            "px-2 py-1.5 rounded-md border-[0.5px] border-subtle-1 text-left flex items-center gap-2 flex-wrap",
                            {
                              "border-danger-strong": errors?.project_ids,
                            }
                          )}
                        >
                          {value && value.length > 0 ? (
                            value.map((projectId) => {
                              const projectDetails = getProjectById(projectId);
                              if (!projectDetails) return null;
                              return (
                                <div
                                  key={projectId}
                                  className="h-6 px-1 rounded-sm bg-layer-1 text-caption-md text-secondary flex items-center gap-1 truncate"
                                >
                                  <span className="flex-shrink-0 size-3 grid place-items-center">
                                    <Logo logo={projectDetails.logo_props} size={12} />
                                  </span>
                                  <span className="truncate">{projectDetails.name}</span>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-body-xs text-placeholder">
                              {t("dashboards.create_modal.project.placeholder")}
                            </span>
                          )}
                        </div>
                      }
                      multiple
                      buttonVariant="border-with-text"
                    />
                  )}
                />
                <span className="text-caption-xs text-danger-primary">{errors?.project_ids?.message}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle-1">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
            {isEditing
              ? isSubmitting
                ? t("common.updating")
                : t("dashboards.create_modal.update_dashboard")
              : isSubmitting
                ? t("common.creating")
                : t("dashboards.create_modal.create_dashboard")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
