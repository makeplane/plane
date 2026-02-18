/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangleIcon } from "lucide-react";
// Plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProject } from "@plane/types";
import { Input, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type FormData = {
  projectName: string;
  confirmLeave: string;
};

const defaultValues: FormData = {
  projectName: "",
  confirmLeave: "",
};

export interface ILeaveProjectModal {
  project: IProject;
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveProjectModal = observer(function LeaveProjectModal(props: ILeaveProjectModal) {
  const { project, isOpen, onClose } = props;
  // i18n
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { leaveProject } = useUserPermissions();
  const leaveConfirmationPhrase = t("project_modals.leave.confirm_phrase");

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm({ defaultValues });

  const handleClose = () => {
    reset({ ...defaultValues });
    onClose();
  };

  const onSubmit = async (data: any) => {
    if (!workspaceSlug) return;

    if (data) {
      if (data.projectName === project?.name) {
        if (data.confirmLeave === leaveConfirmationPhrase) {
          router.push(`/${workspaceSlug}/projects`);
          return leaveProject(workspaceSlug.toString(), project.id)
            .then(() => {
              handleClose();
            })
            .catch(() => {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: t("toast.error"),
                message: t("something_went_wrong_please_try_again"),
              });
            });
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("project_modals.leave.errors.confirm_phrase"),
          });
        }
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("project_modals.leave.errors.project_name"),
        });
      }
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("project_modals.leave.errors.fill_all_fields"),
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
        <div className="flex w-full items-center justify-start gap-6">
          <span className="place-items-center rounded-full bg-danger-subtle p-4">
            <AlertTriangleIcon className="h-6 w-6 text-danger-primary" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-18 font-medium 2xl:text-20">{t("leave_project")}</h3>
          </span>
        </div>

        <span>
          <p className="text-13 leading-7 text-secondary">
            {t("project_modals.leave.description_prefix")}
            <span className="font-medium text-primary">{` "${project?.name}" `}</span>
            {t("project_modals.leave.description_suffix")}
          </p>
        </span>

        <div className="text-secondary">
          <p className="break-words text-13 ">
            {t("project_modals.leave.enter_project_name")}
            <span className="font-medium text-primary"> {project?.name}</span>
            :
          </p>
          <Controller
            control={control}
            name="projectName"
            rules={{
              required: t("name_is_required"),
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="projectName"
                name="projectName"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.projectName)}
                placeholder={t("project_modals.leave.placeholders.project_name")}
                className="mt-2 w-full"
              />
            )}
          />
        </div>

        <div className="text-secondary">
          <p className="text-13">
            {t("project_modals.leave.confirm_instruction_prefix")}{" "}
            <span className="font-medium text-primary">{leaveConfirmationPhrase}</span>{" "}
            {t("project_modals.leave.confirm_instruction_suffix")}
          </p>
          <Controller
            control={control}
            name="confirmLeave"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="confirmLeave"
                name="confirmLeave"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.confirmLeave)}
                placeholder={t("project_modals.leave.placeholders.confirm_leave")}
                className="mt-2 w-full"
              />
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button variant="error-fill" size="lg" type="submit" loading={isSubmitting}>
            {isSubmitting ? t("leaving") : t("leave_project")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
