/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { WarningTriangleOutline } from "@makeplane/propel/icons";
// Plane Imports
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import {
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { setToast } from "@plane/blocks/toast";
import type { IWorkspace } from "@plane/types";

import { cn } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserSettings } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  data: IWorkspace | null;
  onClose: () => void;
};

const defaultValues = {
  workspaceName: "",
  confirmDelete: "",
};

export const DeleteWorkspaceForm = observer(function DeleteWorkspaceForm(props: Props) {
  const { data, onClose } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { deleteWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const { getWorkspaceRedirectionUrl } = useWorkspace();
  const { fetchCurrentUserSettings } = useUserSettings();
  // form info
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm({ defaultValues });

  const canDelete = watch("workspaceName") === data?.name && watch("confirmDelete") === "delete my workspace";

  const handleClose = () => {
    const timer = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timer);
    }, 350);

    onClose();
  };

  const onSubmit = async () => {
    if (!data || !canDelete) return;

    try {
      await deleteWorkspace(data.slug);
      await fetchCurrentUserSettings();
      handleClose();
      router.push(getWorkspaceRedirectionUrl());
      setToast({
        type: "success",
        title: t("workspace_settings.settings.general.delete_modal.success_title"),
        message: t("workspace_settings.settings.general.delete_modal.success_message"),
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: t("workspace_settings.settings.general.delete_modal.error_title"),
        message: t("workspace_settings.settings.general.delete_modal.error_message"),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <DialogMain>
        <DialogHeader>
          <div className="flex w-full items-center justify-start gap-4">
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-full bg-danger-subtle text-danger-primary sm:size-10"
              )}
            >
              <WarningTriangleOutline className="size-5 text-danger-primary" aria-hidden="true" />
            </span>
            <DialogHeading>
              <DialogTitle>{t("workspace_settings.settings.general.delete_modal.title")}</DialogTitle>
            </DialogHeading>
          </div>
        </DialogHeader>
        <DialogBody tabIndex={0}>
          <div className="space-y-4">
            <p className="text-body-xs-regular text-secondary">
              {t("web_ui.you_are_about_to_delete_the_workspace")}{" "}
              <span className="text-body-xs-semibold break-words">{data?.name}</span>
              {t(
                "web_ui.if_you_confirm_you_will_lose_access_to_all_your_work_data_in_this_workspace_without_any_wa"
              )}{" "}
            </p>
            <div className="text-secondary">
              <p className="text-body-xs-regular break-words">
                {t("web_ui.type_in_this_workspace_apos_s_name_to_continue")}
              </p>
              <Controller
                control={control}
                name="workspaceName"
                render={({ field: { value, onChange, ref } }) => (
                  <Field name="workspaceName" invalid={Boolean(errors.workspaceName)}>
                    <InputGroup size="2xl">
                      <Input
                        size="2xl"
                        id="workspaceName"
                        name="workspaceName"
                        type="text"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        placeholder={data?.name}
                        autoComplete="off"
                      />
                    </InputGroup>
                  </Field>
                )}
              />
            </div>
            <div className="text-secondary">
              <p className="text-body-xs-regular">
                {t("web_ui.for_final_confirmation_type")}{" "}
                <span className="text-body-xs-medium text-primary">delete my workspace </span>
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
                        placeholder=""
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
          label={isSubmitting ? t("deleting") : t("confirm")}
          disabled={!canDelete}
          loading={isSubmitting}
        />
      </DialogActions>
    </form>
  );
});
