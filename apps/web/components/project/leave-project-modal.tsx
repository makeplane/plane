/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
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
  const { t } = useTranslation();

  const { project, isOpen, onClose } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { leaveProject } = useUserPermissions();

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
        if (data.confirmLeave === "Leave Project") {
          router.push(`/${workspaceSlug}/projects`);
          return leaveProject(workspaceSlug.toString(), project.id)
            .then(() => {
              handleClose();

              return undefined;
            })
            .catch((_err) => {
              setToast({
                type: "error",
                title: t("error"),
                message: t("web_ui.something_went_wrong_please_try_again_later"),
              });
            });
        } else {
          setToast({
            type: "error",
            title: t("error"),
            message: t("web_ui.please_confirm_leaving_the_project_by_typing_the_leave_project"),
          });
        }
      } else {
        setToast({
          type: "error",
          title: t("error"),
          message: t("web_ui.please_enter_the_project_name_as_shown_in_the_description"),
        });
      }
    } else {
      setToast({
        type: "error",
        title: t("error"),
        message: t("web_ui.please_fill_all_fields"),
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
                  <DialogTitle>{t("leave_project")}</DialogTitle>
                </DialogHeading>
              </div>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-6">
                <p className="text-13 leading-7 text-secondary">
                  {t("web_ui.are_you_sure_you_want_to_leave_the_project")}{" "}
                  <span className="font-medium text-primary">{` "${project?.name}" `}</span>
                  {t("web_ui.all_of_the_work_items_associated_with_you_will_become_inaccessible")}{" "}
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
                    rules={{
                      required: t("project_settings.labels.label_title_is_required"),
                    }}
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
                            placeholder={t("web_ui.enter_project_name")}
                          />
                        </InputGroup>
                      </Field>
                    )}
                  />
                </div>
                <div className="text-secondary">
                  <p className="text-13">
                    {t("web_ui.to_confirm_type")} <span className="font-medium text-primary">{t("leave_project")}</span>{" "}
                    {t("web_ui.below")}{" "}
                  </p>
                  <Controller
                    control={control}
                    name="confirmLeave"
                    render={({ field: { value, onChange, ref } }) => (
                      <Field name="confirmLeave" invalid={Boolean(errors.confirmLeave)}>
                        <InputGroup size="2xl">
                          <Input
                            size="2xl"
                            id="confirmLeave"
                            name="confirmLeave"
                            type="text"
                            value={value}
                            onChange={onChange}
                            ref={ref}
                            placeholder={t("web_ui.enter_leave_project")}
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
              label={isSubmitting ? t("leaving") : t("leave_project")}
              loading={isSubmitting}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
});
