/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
// Plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProject } from "@plane/types";
import { Input, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";

type DeleteProjectModal = {
  isOpen: boolean;
  project: IProject;
  onClose: () => void;
};

const defaultValues = {
  projectName: "",
  confirmDelete: "",
};

export function DeleteProjectModal(props: DeleteProjectModal) {
  const { isOpen, project, onClose } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { deleteProject } = useProject();
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // form info
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm({ defaultValues });

  const confirmDeletePhrase = t("project_modals.delete.confirm_phrase");
  const canDelete = watch("projectName") === project?.name && watch("confirmDelete") === confirmDeletePhrase;

  const handleClose = () => {
    const timer = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timer);
    }, 350);

    onClose();
  };

  const onSubmit = async () => {
    if (!workspaceSlug || !canDelete) return;

    try {
      await deleteProject(workspaceSlug.toString(), project.id);
      if (projectId && projectId.toString() === project.id) router.push(`/${workspaceSlug}/projects`);
      handleClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("project_modals.delete.toasts.success"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong_please_try_again"),
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
        <div className="flex w-full items-center justify-start gap-6">
          <span className="place-items-center rounded-full bg-danger-subtle p-4">
            <AlertTriangle className="h-6 w-6 text-danger-primary" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-18 font-medium 2xl:text-20">{t("project_settings.general.delete_project.title")}</h3>
          </span>
        </div>
        <span>
          <p className="text-13 leading-7 text-secondary">
            {t("project_modals.delete.description_prefix")}{" "}
            <span className="break-words font-semibold">{project?.name}</span>?
            {` ${t("project_modals.delete.description_suffix")}`}
          </p>
        </span>
        <div className="text-secondary">
          <p className="break-words text-13 ">
            {t("project_modals.delete.enter_project_name")}
            <span className="font-medium text-primary"> {project?.name}</span>
            :
          </p>
          <Controller
            control={control}
            name="projectName"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="projectName"
                name="projectName"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.projectName)}
                placeholder={t("project_modals.delete.placeholders.project_name")}
                className="mt-2 w-full"
                autoComplete="off"
              />
            )}
          />
        </div>
        <div className="text-secondary">
          <p className="text-13">
            {t("project_modals.delete.confirm_instruction_prefix")}{" "}
            <span className="font-medium text-primary">{confirmDeletePhrase}</span>{" "}
            {t("project_modals.delete.confirm_instruction_suffix")}
          </p>
          <Controller
            control={control}
            name="confirmDelete"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="confirmDelete"
                name="confirmDelete"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.confirmDelete)}
                placeholder={t("project_modals.delete.placeholders.confirm_delete")}
                className="mt-2 w-full"
                autoComplete="off"
              />
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button variant="error-fill" size="lg" type="submit" disabled={!canDelete} loading={isSubmitting}>
            {isSubmitting ? t("deleting") : t("project_settings.general.delete_project.title")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
