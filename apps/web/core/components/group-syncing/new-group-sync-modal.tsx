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
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CustomSelect, Input, ModalCore } from "@plane/ui";
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
import type { GroupMap } from "@plane/types";
import { useProject } from "@/hooks/store/use-project";
import { useRoleManagement } from "@/hooks/store/use-role-management";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronDownIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

export type TNewGroupSyncFormFieldOptions = {
  idp_group_name: string;
  project: string;
  role: string;
};

export type TNewGroupSyncModalProps = {
  isModalOpen: boolean;
  handleOnClose?: () => void;
  workspaceSlug: string;
  preloadedData?: GroupMap | null;
  onCreate: (payload: Partial<GroupMap>) => Promise<void>;
  onUpdate: (mappingId: string, payload: Partial<GroupMap>) => Promise<void>;
};

const defaultValues: TNewGroupSyncFormFieldOptions = {
  idp_group_name: "",
  project: "",
  role: "",
};

export const NewGroupSyncModal = observer(function NewGroupSyncModal(props: TNewGroupSyncModalProps) {
  const { isModalOpen, handleOnClose, workspaceSlug, preloadedData, onCreate, onUpdate } = props;
  const { getProjectRolesByWorkspaceSlug } = useRoleManagement();
  const projectRoles = getProjectRolesByWorkspaceSlug(workspaceSlug, "active");

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<TNewGroupSyncFormFieldOptions>({
    defaultValues,
    values: isModalOpen
      ? {
          ...defaultValues,
          idp_group_name: preloadedData?.idp_group_name ?? "",
          project: preloadedData?.project ?? "",
          role: preloadedData?.role ?? "",
        }
      : defaultValues,
  });
  const { t } = useTranslation();

  const onClose = () => {
    if (handleOnClose) handleOnClose();
  };

  const handleFormSubmit = async (formData: TNewGroupSyncFormFieldOptions) => {
    if (preloadedData?.id) await onUpdate(preloadedData.id, formData);
    else await onCreate(formData);

    onClose();
  };

  useEffect(() => {
    return () => reset(defaultValues);
  }, [preloadedData, reset, isModalOpen]);

  const { getProjectById } = useProject();

  const getRoleName = (roleId: string) => {
    const role = projectRoles.find((r) => r.id === roleId);
    return role?.name ?? "";
  };

  return (
    <ModalCore isOpen={isModalOpen} handleClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(async (data) => handleFormSubmit(data))(e);
        }}
      >
        <div className="space-y-5 p-5">
          <h3 className="text-18 font-medium text-secondary">
            {preloadedData?.id ? t("update") : t("workspace_settings.settings.group_syncing.group_mapping.button_text")}
          </h3>

          <div>
            <label htmlFor="idp_group_name" className="mb-2 text-secondary text-14 font-medium">
              {t("workspace_settings.settings.group_syncing.modal.idp_group_name.text")}
            </label>
            <Controller
              control={control}
              name="idp_group_name"
              rules={{
                required: t("workspace_settings.settings.group_syncing.modal.idp_group_name.required"),
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="idp_group_name"
                  type="text"
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.idp_group_name)}
                  placeholder={t("workspace_settings.settings.group_syncing.modal.idp_group_name.placeholder")}
                  className="w-full"
                />
              )}
            />
            {errors.idp_group_name && (
              <span className="text-11 text-danger-primary">{errors.idp_group_name?.message}</span>
            )}
          </div>

          <div>
            <label htmlFor="project_id" className="mb-2 text-secondary text-14 font-medium">
              {t("workspace_settings.settings.group_syncing.modal.project.text")}
            </label>
            <Controller
              control={control}
              name="project"
              rules={{
                required: t("workspace_settings.settings.group_syncing.modal.project.required"),
              }}
              render={({ field: { value, onChange } }) => (
                <ProjectDropdown
                  value={value}
                  onChange={(id: string) => onChange(id)}
                  multiple={false}
                  buttonVariant="border-with-text"
                  buttonContainerClassName="w-full text-13 flex w-full items-center justify-between gap-1 rounded-sm border-[0.5px] border-strong px-3 py-2 text-13 cursor-pointer hover:bg-layer-transparent-hover"
                  buttonClassName="px-3 py-2 w-full"
                  button={
                    <>
                      {((value) => {
                        const selectedProject = value ? getProjectById(value) : null;
                        return (
                          <div className="w-full truncate text-left">
                            <div className="flex items-center gap-2 truncate">
                              {selectedProject && (
                                <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                                  <Logo logo={selectedProject.logo_props} size={12} />
                                </span>
                              )}
                              <span
                                className={cn("truncate w-full", {
                                  "text-placeholder": !selectedProject,
                                })}
                              >
                                {selectedProject ? selectedProject.name : "Select a Project"}
                              </span>
                              <ChevronDownIcon className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                            </div>
                          </div>
                        );
                      })(value)}
                    </>
                  }
                />
              )}
            />
            {errors.project && <span className="text-11 text-danger-primary">{errors.project?.message}</span>}
          </div>

          <div>
            <label htmlFor="role" className="mb-2 text-secondary text-14 font-medium">
              {t("workspace_settings.settings.group_syncing.modal.default_role.text")}
            </label>
            <Controller
              control={control}
              name="role"
              rules={{
                required: t("workspace_settings.settings.group_syncing.modal.default_role.required"),
              }}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  label={<span className="text-13">{getRoleName(value) || "Select a Role"}</span>}
                  onChange={onChange}
                  className="flex-grow w-full"
                  buttonClassName="border-[0.5px] border-subtle-1"
                  input
                >
                  {projectRoles.map((role) => (
                    <CustomSelect.Option key={role.id} value={role.id}>
                      {role.name}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
            {errors.role && <span className="text-11 text-danger-primary">{errors.role?.message}</span>}
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {preloadedData?.id ? (isSubmitting ? t("updating") : t("update")) : isSubmitting ? t("adding") : t("add")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
