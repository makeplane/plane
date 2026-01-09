import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// Plane Imports
import { ORGANIZATION_SIZE, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EditIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspace } from "@plane/types";
import { CustomSelect, Input } from "@plane/ui";
import { cn, copyUrlToClipboard, getFileURL } from "@plane/utils";
// components
import { WorkspaceImageUploadModal } from "@/components/core/modals/workspace-image-upload-modal";
import { TimezoneSelect } from "@/components/global/timezone-select";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { DeleteWorkspaceSection } from "@/plane-web/components/workspace/delete-workspace-section";

const defaultValues: Partial<IWorkspace> = {
  name: "",
  url: "",
  organization_size: "2-10",
  logo_url: null,
  timezone: "UTC",
};

export const WorkspaceDetails = observer(function WorkspaceDetails() {
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  // store hooks
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  // form info
  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<IWorkspace>({
    defaultValues: { ...defaultValues, ...currentWorkspace },
  });
  // derived values
  const workspaceLogo = watch("logo_url");

  const onSubmit = async (formData: IWorkspace) => {
    if (!currentWorkspace) return;

    setIsLoading(true);

    const payload: Partial<IWorkspace> = {
      name: formData.name,
      organization_size: formData.organization_size,
      timezone: formData.timezone,
    };

    try {
      await updateWorkspace(currentWorkspace.slug, payload);
      setToast({
        title: "Success!",
        type: TOAST_TYPE.SUCCESS,
        message: "Workspace updated successfully",
      });
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentWorkspace) return;

    try {
      await updateWorkspace(currentWorkspace.slug, {
        logo_url: "",
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Workspace picture removed successfully.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "There was some error in deleting your profile picture. Please try again.",
      });
    }
  };

  const handleCopyUrl = () => {
    if (!currentWorkspace) return;

    void copyUrlToClipboard(`${currentWorkspace.slug}`)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Workspace URL copied to the clipboard.",
        });
        return undefined;
      })
      .catch(() => {
        // Silently handle clipboard errors
      });
  };

  useEffect(() => {
    if (currentWorkspace) reset({ ...currentWorkspace });
  }, [currentWorkspace, reset]);

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!currentWorkspace) return null;

  return (
    <>
      <Controller
        control={control}
        name="logo_url"
        render={({ field: { onChange, value } }) => (
          <WorkspaceImageUploadModal
            isOpen={isImageUploadModalOpen}
            onClose={() => setIsImageUploadModalOpen(false)}
            handleRemove={handleRemoveLogo}
            onSuccess={(imageUrl) => {
              onChange(imageUrl);
              setIsImageUploadModalOpen(false);
            }}
            value={value}
          />
        )}
      />
      <div className={cn("w-full flex flex-col gap-y-7", { "opacity-60": !isAdmin })}>
        <div className="flex items-center gap-5">
          <div className="shrink-0 flex flex-col gap-1">
            <button type="button" onClick={() => setIsImageUploadModalOpen(true)} disabled={!isAdmin}>
              {workspaceLogo && workspaceLogo !== "" ? (
                <div className="relative flex size-14">
                  <img
                    src={getFileURL(workspaceLogo)}
                    className="absolute left-0 top-0 size-full rounded-md object-cover"
                    alt="Workspace Logo"
                  />
                </div>
              ) : (
                <div className="relative size-14 text-24 grid place-items-center rounded-md bg-accent-primary uppercase text-on-color">
                  {currentWorkspace?.name?.charAt(0) ?? "N"}
                </div>
              )}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-h5-semibold leading-6 mb:-my-5">{watch("name")}</div>
            <button type="button" onClick={handleCopyUrl} className="text-body-xs-regular tracking-tight text-left">{`${
              typeof window !== "undefined" && window.location.origin.replace("http://", "").replace("https://", "")
            }/${currentWorkspace.slug}`}</button>
            {isAdmin && (
              <button
                type="button"
                className="flex items-center gap-1.5 text-left text-caption-sm-medium text-accent-primary"
                onClick={() => setIsImageUploadModalOpen(true)}
              >
                {workspaceLogo && workspaceLogo !== "" ? (
                  <>
                    <EditIcon className="h-3 w-3" />
                    {t("workspace_settings.settings.general.edit_logo")}
                  </>
                ) : (
                  t("workspace_settings.settings.general.upload_logo")
                )}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-7">
          <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-10 xl:grid-cols-2 2xl:grid-cols-3">
            <div className="flex flex-col gap-2">
              <h4 className="text-body-sm-medium text-tertiary">{t("workspace_settings.settings.general.name")}</h4>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: t("workspace_settings.settings.general.errors.name.required"),
                  maxLength: {
                    value: 80,
                    message: t("workspace_settings.settings.general.errors.name.max_length"),
                  },
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.name)}
                    placeholder={t("workspace_settings.settings.general.name")}
                    className="w-full rounded-md"
                    disabled={!isAdmin}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-body-sm-medium text-tertiary">
                {t("workspace_settings.settings.general.company_size")}
              </h4>
              <Controller
                name="organization_size"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CustomSelect
                    value={value}
                    onChange={onChange}
                    label={
                      ORGANIZATION_SIZE.find((c) => c === value) ??
                      t("workspace_settings.settings.general.errors.company_size.select_a_range")
                    }
                    buttonClassName="border border-subtle bg-layer-2 !shadow-none !rounded-md"
                    input
                    disabled={!isAdmin}
                  >
                    {ORGANIZATION_SIZE.map((item) => (
                      <CustomSelect.Option key={item} value={item}>
                        {item}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-body-sm-medium text-tertiary">{t("workspace_settings.settings.general.url")}</h4>
              <Controller
                control={control}
                name="url"
                render={({ field: { onChange, ref } }) => (
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    value={`${
                      typeof window !== "undefined" &&
                      window.location.origin.replace("http://", "").replace("https://", "")
                    }/${currentWorkspace.slug}`}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.url)}
                    className="w-full cursor-not-allowed rounded-md !bg-layer-1"
                    disabled
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-body-sm-medium text-tertiary">
                {t("workspace_settings.settings.general.workspace_timezone")}
              </h4>
              <Controller
                name="timezone"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <>
                    <TimezoneSelect value={value} onChange={onChange} disabled={!isAdmin} />
                  </>
                )}
              />
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center justify-between py-2">
            <Button
              variant="primary"
              size="lg"
              onClick={(e) => {
                void handleSubmit(onSubmit)(e);
              }}
              loading={isLoading}
            >
              {isLoading ? t("updating") : t("workspace_settings.settings.general.update_workspace")}
            </Button>
          </div>
        )}
      </div>
      {isAdmin && (
        <div className="mt-10">
          <DeleteWorkspaceSection workspace={currentWorkspace} />
        </div>
      )}
    </>
  );
});
