import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
// Plane Imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspace } from "@plane/types";
import { Input } from "@plane/ui";
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
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.general.delete_modal.success_title"),
        message: t("workspace_settings.settings.general.delete_modal.success_message"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.general.delete_modal.error_title"),
        message: t("workspace_settings.settings.general.delete_modal.error_message"),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <span
          className={cn(
            "shrink-0 grid place-items-center rounded-full size-12 sm:size-10 bg-danger-subtle text-danger-primary"
          )}
        >
          <AlertTriangle className="size-5 text-danger-primary" aria-hidden="true" />
        </span>
        <div>
          <div className="text-center sm:text-left">
            <h3 className="text-h5-medium">{t("workspace_settings.settings.general.delete_modal.title")}</h3>
            <p className="mt-1 text-body-xs-regular text-secondary">
              You are about to delete the workspace{" "}
              <span className="break-words text-body-xs-semibold">{data?.name}</span>. If you confirm, you will lose
              access to all your work data in this workspace without any way to restore it. Tread very carefully.
            </p>
          </div>

          <div className="text-secondary mt-4">
            <p className="break-words text-body-xs-regular ">Type in this workspace&apos;s name to continue.</p>
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

          <div className="text-secondary mt-4">
            <p className="text-body-xs-regular">
              For final confirmation, type{" "}
              <span className="text-body-xs-medium text-primary">delete my workspace </span>
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
        <Button variant="secondary" size="lg" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button variant="error-fill" size="lg" type="submit" disabled={!canDelete} loading={isSubmitting}>
          {isSubmitting ? t("deleting") : t("confirm")}
        </Button>
      </div>
    </form>
  );
});
