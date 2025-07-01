"use client";

import { useEffect, useState, FC } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
// constants
import {
  ORGANIZATION_SIZE,
  EUserPermissions,
  EUserPermissionsLevel,
  WORKSPACE_TRACKER_EVENTS,
  WORKSPACE_TRACKER_ELEMENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IWorkspace } from "@plane/types";
import { Button, CustomSelect, Input, TOAST_TYPE, setToast } from "@plane/ui";
import { copyUrlToClipboard, getFileURL } from "@plane/utils";
// components
import { LogoSpinner } from "@/components/common";
import { WorkspaceImageUploadModal } from "@/components/core";
// helpers
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { DeleteWorkspaceSection } from "@/plane-web/components/workspace";

const defaultValues: Partial<IWorkspace> = {
  name: "",
  url: "",
  organization_size: "2-10",
  logo_url: null,
};

export const WorkspaceDetails: FC = observer(() => {
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
    };

    await updateWorkspace(currentWorkspace.slug, payload)
      .then((res) => {
        captureSuccess({
          eventName: WORKSPACE_TRACKER_EVENTS.update,
          payload: { slug: currentWorkspace.slug },
        });
        setToast({
          title: "Success!",
          type: TOAST_TYPE.SUCCESS,
          message: "Workspace updated successfully",
        });
      })
      .catch((err) => {
        captureError({
          eventName: WORKSPACE_TRACKER_EVENTS.update,
          payload: { slug: currentWorkspace.slug },
          error: err,
        });
        console.error(err);
      });
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const handleRemoveLogo = async () => {
    if (!currentWorkspace) return;

    await updateWorkspace(currentWorkspace.slug, {
      logo_url: "",
    })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Workspace picture removed successfully.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "There was some error in deleting your profile picture. Please try again.",
        });
      });
  };

  const handleCopyUrl = () => {
    if (!currentWorkspace) return;

    copyUrlToClipboard(`${currentWorkspace.slug}`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Workspace URL copied to the clipboard.",
      });
    });
  };

  useEffect(() => {
    if (currentWorkspace) reset({ ...currentWorkspace });
  }, [currentWorkspace, reset]);

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!currentWorkspace)
    return (
      <div className="grid h-full w-full place-items-center px-4 sm:px-0">
        <LogoSpinner />
      </div>
    );

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
      <div className={`w-full md:pr-9 pr-4 ${isAdmin ? "" : "opacity-60"}`}>
        <div className="flex gap-5 border-b border-custom-border-100 pb-7 items-start">
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => setIsImageUploadModalOpen(true)} disabled={!isAdmin}>
              {workspaceLogo && workspaceLogo !== "" ? (
                <div className="relative mx-auto flex h-14 w-14">
                  <img
                    src={getFileURL(workspaceLogo)}
                    className="absolute left-0 top-0 h-full w-full rounded-md object-cover"
                    alt="Workspace Logo"
                  />
                </div>
              ) : (
                <div className="relative flex h-14 w-14 items-center justify-center rounded bg-gray-700 p-4 uppercase text-white">
                  {currentWorkspace?.name?.charAt(0) ?? "N"}
                </div>
              )}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-lg font-semibold leading-6 mb:-my-5">{watch("name")}</div>
            <button type="button" onClick={handleCopyUrl} className="text-sm tracking-tight text-left">{`${
              typeof window !== "undefined" && window.location.origin.replace("http://", "").replace("https://", "")
            }/${currentWorkspace.slug}`}</button>
            {isAdmin && (
              <button
                className="flex items-center gap-1.5 text-left text-xs font-medium text-custom-primary-100"
                onClick={() => setIsImageUploadModalOpen(true)}
              >
                {workspaceLogo && workspaceLogo !== "" ? (
                  <>
                    <Pencil className="h-3 w-3" />
                    {t("workspace_settings.settings.general.edit_logo")}
                  </>
                ) : (
                  t("workspace_settings.settings.general.upload_logo")
                )}
              </button>
            )}
          </div>
        </div>

        <div className="my-8 flex flex-col gap-8">
          <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-10 xl:grid-cols-2 2xl:grid-cols-3">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm">{t("workspace_settings.settings.general.name")}</h4>
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
                    className="w-full rounded-md font-medium"
                    disabled={!isAdmin}
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-1 ">
              <h4 className="text-sm">{t("workspace_settings.settings.general.company_size")}</h4>
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
                    optionsClassName="w-full"
                    buttonClassName="!border-[0.5px] !border-custom-border-200 !shadow-none"
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

            <div className="flex flex-col gap-1 ">
              <h4 className="text-sm">{t("workspace_settings.settings.general.url")}</h4>
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
                    className="w-full"
                    disabled
                  />
                )}
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between py-2">
              <Button
                data-ph-element={WORKSPACE_TRACKER_ELEMENTS.UPDATE_WORKSPACE_BUTTON}
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                loading={isLoading}
              >
                {isLoading ? t("updating") : t("workspace_settings.settings.general.update_workspace")}
              </Button>
            </div>
          )}
        </div>
        {isAdmin && <DeleteWorkspaceSection workspace={currentWorkspace} />}
      </div>
    </>
  );
});
