"use client";

import React from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
// types
import { WORKSPACE_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IWorkspace } from "@plane/types";
// ui
import { Button, Input, TOAST_TYPE, setToast } from "@plane/ui";
// constants
// hooks
import { cn } from "@plane/utils";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useUserSettings, useWorkspace } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  data: IWorkspace | null;
  onClose: () => void;
};

const defaultValues = {
  workspaceName: "",
  confirmDelete: "",
};

export const DeleteWorkspaceForm: React.FC<Props> = observer((props) => {
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

    await deleteWorkspace(data.slug)
      .then(async () => {
        await fetchCurrentUserSettings();
        handleClose();
        router.push(getWorkspaceRedirectionUrl());
        captureSuccess({
          eventName: WORKSPACE_TRACKER_EVENTS.delete,
          payload: { slug: data.slug },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.general.delete_modal.success_title"),
          message: t("workspace_settings.settings.general.delete_modal.success_message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace_settings.settings.general.delete_modal.error_title"),
          message: t("workspace_settings.settings.general.delete_modal.error_message"),
        });
        captureError({
          eventName: WORKSPACE_TRACKER_EVENTS.delete,
          payload: { slug: data.slug },
          error: new Error("Error deleting workspace"),
        });
      });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <span
          className={cn(
            "flex-shrink-0 grid place-items-center rounded-full size-12 sm:size-10 bg-red-500/20 text-red-100"
          )}
        >
          <AlertTriangle className="size-5 text-red-600" aria-hidden="true" />
        </span>
        <div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-medium">{t("workspace_settings.settings.general.delete_modal.title")}</h3>
            <p className="mt-1 text-sm text-custom-text-200">
              You are about to delete the workspace <span className="break-words font-semibold">{data?.name}</span>. If
              you confirm, you will lose access to all your work data in this workspace without any way to restore it.
              Tread very carefully.
            </p>
          </div>

          <div className="text-custom-text-200 mt-4">
            <p className="break-words text-sm ">Type in this workspace&apos;s name to continue.</p>
            <Controller
              control={control}
              name="workspaceName"
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="workspaceName"
                  name="workspaceName"
                  type="text"
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.workspaceName)}
                  placeholder={data?.name}
                  className="mt-2 w-full"
                  autoComplete="off"
                />
              )}
            />
          </div>

          <div className="text-custom-text-200 mt-4">
            <p className="text-sm">
              For final confirmation, type{" "}
              <span className="font-medium text-custom-text-100">delete my workspace </span>
              below.
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
                  placeholder=""
                  className="mt-2 w-full"
                  autoComplete="off"
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button variant="danger" size="sm" type="submit" disabled={!canDelete} loading={isSubmitting}>
          {isSubmitting ? t("deleting") : t("confirm")}
        </Button>
      </div>
    </form>
  );
});
