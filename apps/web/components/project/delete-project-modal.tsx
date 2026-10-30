/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { WarningTriangleOutline } from "@makeplane/propel/icons";
// Plane imports
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import type { IProject } from "@plane/types";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
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
  const { t } = useTranslation();

  const { isOpen, project, onClose } = props;
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

  const canDelete = watch("projectName") === project?.name && watch("confirmDelete") === "delete my project";

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
        type: "success",
        title: t("success"),
        message: t("web_ui.project_deleted_successfully"),
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: t("error"),
        message: t("web_ui.something_went_wrong_please_try_again_later"),
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <div className="flex w-full items-center justify-start gap-6">
                <span className="place-items-center rounded-full bg-danger-subtle p-4">
                  <WarningTriangleOutline className="h-6 w-6 text-danger-primary" aria-hidden="true" />
                </span>
                <DialogHeading>
                  <DialogTitle>{t("project_settings.general.delete_project.title")}</DialogTitle>
                </DialogHeading>
              </div>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-6">
                <p className="text-13 leading-7 text-secondary">
                  {t("web_ui.are_you_sure_you_want_to_delete_project")}{" "}
                  <span className="font-semibold break-words">{project?.name}</span>
                  {t(
                    "web_ui.all_of_the_data_related_to_the_project_will_be_permanently_removed_this_action_cannot_be_u"
                  )}{" "}
                </p>
                <div className="text-secondary">
                  <p className="text-13 break-words">
                    {t("web_ui.enter_the_project_name")}{" "}
                    <span className="font-medium text-primary">{project?.name}</span>{" "}
                    {t("work_item_types.settings.linked_properties.unlink_confirmation.input_label_suffix")}{" "}
                  </p>
                  <Controller
                    control={control}
                    name="projectName"
                    render={({ field: { value, onChange, ref } }) => (
                      <Field name="projectName" invalid={Boolean(errors.projectName)}>
                        <InputGroup size="2xl">
                          <Input
                            size="2xl"
                            id="projectName"
                            name="projectName"
                            type="text"
                            value={value}
                            onChange={onChange}
                            ref={ref}
                            placeholder={t("project_name")}
                            autoComplete="off"
                          />
                        </InputGroup>
                      </Field>
                    )}
                  />
                </div>
                <div className="text-secondary">
                  <p className="text-13">
                    {t("web_ui.to_confirm_type")}{" "}
                    <span className="font-medium text-primary">
                      {t("project_settings.general.delete_project.button")}
                    </span>{" "}
                    {t("web_ui.below")}{" "}
                  </p>
                  <Controller
                    control={control}
                    name="confirmDelete"
                    render={({ field: { value, onChange, ref } }) => (
                      <Field name="confirmDelete" invalid={Boolean(errors.confirmDelete)}>
                        <InputGroup size="2xl">
                          <Input
                            size="2xl"
                            id="confirmDelete"
                            name="confirmDelete"
                            type="text"
                            value={value}
                            onChange={onChange}
                            ref={ref}
                            placeholder={t("web_ui.enter_delete_my_project")}
                            autoComplete="off"
                          />
                        </InputGroup>
                      </Field>
                    )}
                  />
                </div>
              </div>
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <Button variant="secondary" size="md" stretch="auto" label={t("cancel")} onClick={handleClose} />
            <Button
              variant="danger"
              size="md"
              stretch="auto"
              type="submit"
              label={isSubmitting ? t("deleting") : t("project_settings.general.delete_project.title")}
              disabled={!canDelete}
              loading={isSubmitting}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
