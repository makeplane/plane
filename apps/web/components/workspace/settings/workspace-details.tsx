/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// Plane Imports
import { FieldLabel } from "@makeplane/propel/elements/field";
import { Icon } from "@makeplane/propel/components/icon";
import { InputField } from "@makeplane/propel/components/input-field";
import { TextButton } from "@makeplane/propel/components/text-button";
import { WorkspaceAvatar } from "@makeplane/propel/components/workspace-avatar";
import { ORGANIZATION_SIZE, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { EditOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import type { IWorkspace } from "@plane/types";
import { Select, SelectContent, SelectItem, SelectList, SelectTrigger } from "@makeplane/propel/components/select";
import { cn, copyUrlToClipboard, getFileURL, validateWorkspaceName } from "@plane/utils";
// components
import { WorkspaceImageUploadModal } from "@/components/core/modals/workspace-image-upload-modal";
import { TimezoneSelect } from "@/components/global/timezone-select";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { DeleteWorkspaceSection } from "@/components/workspace/delete-workspace-section";

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
        type: "success",
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
        type: "success",
        title: "Success!",
        message: "Workspace picture removed successfully.",
      });
    } catch {
      setToast({
        type: "error",
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
          type: "success",
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
      <div className={cn("flex w-full flex-col gap-y-7", { "opacity-60": !isAdmin })}>
        <div className="flex items-center gap-5">
          <button
            type="button"
            className="flex size-14 shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-1 disabled:cursor-not-allowed"
            onClick={() => setIsImageUploadModalOpen(true)}
            disabled={!isAdmin}
            aria-label={
              workspaceLogo
                ? t("workspace_settings.settings.general.edit_logo")
                : t("workspace_settings.settings.general.upload_logo")
            }
          >
            <WorkspaceAvatar size="2xl" src={getFileURL(workspaceLogo ?? "")} alt={currentWorkspace?.name} />
          </button>
          <div className="flex flex-col items-start gap-0.5">
            <div className="text-h6-medium">{watch("name")}</div>
            <TextButton
              variant="secondary"
              size="md"
              onClick={handleCopyUrl}
              label={`${
                typeof window !== "undefined" && window.location.origin.replace("http://", "").replace("https://", "")
              }/${currentWorkspace.slug}`}
            />
            {isAdmin && (
              <TextButton
                variant="primary"
                size="md"
                onClick={() => setIsImageUploadModalOpen(true)}
                icon={workspaceLogo ? <Icon icon={EditOutline} /> : undefined}
                iconPosition="start"
                label={
                  workspaceLogo
                    ? t("workspace_settings.settings.general.edit_logo")
                    : t("workspace_settings.settings.general.upload_logo")
                }
              />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-7">
          <div className="grid-col grid w-full grid-cols-1 items-center justify-between gap-8 xl:grid-cols-2">
            <div className="col-span-1 flex flex-col gap-1.5">
              <Controller
                control={control}
                name="name"
                rules={{
                  validate: (value) => validateWorkspaceName(value, true),
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <InputField
                    size="lg"
                    orientation="vertical"
                    id="name"
                    name="name"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    label={t("workspace_settings.settings.general.name")}
                    placeholder={t("workspace_settings.settings.general.name")}
                    disabled={!isAdmin}
                    error={errors.name?.message}
                  />
                )}
              />
            </div>
            <div className="col-span-1 flex flex-col gap-1.5">
              <FieldLabel size="lg" inset={false} htmlFor="workspace-company-size">
                {t("workspace_settings.settings.general.company_size")}
              </FieldLabel>
              <Controller
                name="organization_size"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select<string>
                    value={value || null}
                    onValueChange={(next) => onChange(next ?? "")}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger
                      id="workspace-company-size"
                      size="lg"
                      placeholder={t("workspace_settings.settings.general.errors.company_size.select_a_range")}
                    />
                    <SelectContent side="bottom" align="end">
                      <SelectList>
                        {ORGANIZATION_SIZE.map((item) => (
                          <SelectItem key={item} value={item} size="lg" label={item} />
                        ))}
                      </SelectList>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="col-span-1 flex flex-col gap-1.5">
              <Controller
                control={control}
                name="url"
                render={({ field: { onChange, ref } }) => (
                  <InputField
                    size="lg"
                    orientation="vertical"
                    id="url"
                    name="url"
                    type="url"
                    value={`${
                      typeof window !== "undefined" &&
                      window.location.origin.replace("http://", "").replace("https://", "")
                    }/${currentWorkspace.slug}`}
                    onChange={onChange}
                    ref={ref}
                    label={t("workspace_settings.settings.general.url")}
                    disabled
                  />
                )}
              />
            </div>
            <div className="col-span-1 flex flex-col gap-1.5">
              <Controller
                name="timezone"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <>
                    <TimezoneSelect
                      fieldLabel={t("workspace_settings.settings.general.workspace_timezone")}
                      value={value}
                      onChange={onChange}
                      disabled={!isAdmin}
                      label={t("workspace_settings.settings.general.workspace_timezone")}
                    />
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
              size="md"
              stretch="auto"
              label={isLoading ? t("updating") : t("workspace_settings.settings.general.update_workspace")}
              onClick={(e) => {
                void handleSubmit(onSubmit)(e);
              }}
              loading={isLoading}
            />
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
