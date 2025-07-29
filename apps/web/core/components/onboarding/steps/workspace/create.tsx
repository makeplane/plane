"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { CircleCheck } from "lucide-react";
// plane imports
import {
  ORGANIZATION_SIZE,
  RESTRICTED_URLS,
  WORKSPACE_TRACKER_ELEMENTS,
  WORKSPACE_TRACKER_EVENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IUser, IWorkspace } from "@plane/types";
import { Button, Input, Spinner, TOAST_TYPE, setToast } from "@plane/ui";
import { cn } from "@plane/utils";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useUserProfile, useUserSettings, useWorkspace } from "@/hooks/store";
// plane-web imports
import { getIsWorkspaceCreationDisabled } from "@/plane-web/helpers/instance.helper";
import { WorkspaceService } from "@/plane-web/services";
// local components
import { CommonOnboardingHeader } from "../common";

type Props = {
  user: IUser | undefined;
  onComplete: (skipInvites?: boolean) => void;
  handleCurrentViewChange: () => void;
  hasInvitations?: boolean;
};

const workspaceService = new WorkspaceService();

export const WorkspaceCreateStep: React.FC<Props> = observer(
  ({ user, onComplete, handleCurrentViewChange, hasInvitations = false }) => {
    // states
    const [slugError, setSlugError] = useState(false);
    const [invalidSlug, setInvalidSlug] = useState(false);
    // plane hooks
    const { t } = useTranslation();
    // store hooks
    const { updateUserProfile } = useUserProfile();
    const { fetchCurrentUserSettings } = useUserSettings();
    const { createWorkspace, fetchWorkspaces } = useWorkspace();

    const isWorkspaceCreationEnabled = getIsWorkspaceCreationDisabled() === false;

    // form info
    const {
      handleSubmit,
      control,
      setValue,
      formState: { errors, isSubmitting, isValid },
    } = useForm<IWorkspace>({
      defaultValues: {
        name: "",
        slug: "",
        organization_size: "",
      },
      mode: "onChange",
    });

    const handleCreateWorkspace = async (formData: IWorkspace) => {
      if (isSubmitting) return;

      await workspaceService
        .workspaceSlugCheck(formData.slug)
        .then(async (res) => {
          if (res.status === true && !RESTRICTED_URLS.includes(formData.slug)) {
            setSlugError(false);
            await createWorkspace(formData)
              .then(async (workspaceResponse) => {
                setToast({
                  type: TOAST_TYPE.SUCCESS,
                  title: t("workspace_creation.toast.success.title"),
                  message: t("workspace_creation.toast.success.message"),
                });
                captureSuccess({
                  eventName: WORKSPACE_TRACKER_EVENTS.create,
                  payload: { slug: formData.slug },
                });
                await fetchWorkspaces();
                await completeStep(workspaceResponse.id);
              })
              .catch(() => {
                captureError({
                  eventName: WORKSPACE_TRACKER_EVENTS.create,
                  payload: { slug: formData.slug },
                  error: new Error("Error creating workspace"),
                });
                setToast({
                  type: TOAST_TYPE.ERROR,
                  title: t("workspace_creation.toast.error.title"),
                  message: t("workspace_creation.toast.error.message"),
                });
              });
          } else setSlugError(true);

          onComplete(formData.organization_size === "Just myself");
        })
        .catch(() =>
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("workspace_creation.toast.error.title"),
            message: t("workspace_creation.toast.error.message"),
          })
        );
    };

    const completeStep = async (workspaceId: string) => {
      if (!user) return;
      await updateUserProfile({
        last_workspace_id: workspaceId,
      });
      await fetchCurrentUserSettings();
    };

    const isButtonDisabled = !isValid || invalidSlug || isSubmitting;

    if (!isWorkspaceCreationEnabled) {
      return (
        <div className="flex flex-col gap-10">
          <span className="text-center text-base text-custom-text-300">
            You don&apos;t seem to have any invites to a workspace and your instance admin has restricted creation of
            new workspaces. Please ask a workspace owner or admin to invite you to a workspace first and come back to
            this screen to join.
          </span>
        </div>
      );
    }
    return (
      <form className="flex flex-col gap-10" onSubmit={handleSubmit(handleCreateWorkspace)}>
        <CommonOnboardingHeader title="Create your workspace" description="All your work — unified." />

        <div className="space-y-1">
          <label
            className="text-sm text-custom-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
            htmlFor="name"
          >
            {t("workspace_creation.form.name.label")}
          </label>
          <Controller
            control={control}
            name="name"
            rules={{
              required: t("common.errors.required"),
              validate: (value) =>
                /^[\w\s-]*$/.test(value) || t("workspace_creation.errors.validation.name_alphanumeric"),
              maxLength: {
                value: 80,
                message: t("workspace_creation.errors.validation.name_length"),
              },
            }}
            render={({ field: { value, ref, onChange } }) => (
              <div className="relative flex items-center rounded-md">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={value}
                  onChange={(event) => {
                    onChange(event.target.value);
                    setValue("name", event.target.value);
                    setValue("slug", event.target.value.toLocaleLowerCase().trim().replace(/ /g, "-"), {
                      shouldValidate: true,
                    });
                  }}
                  placeholder={t("workspace_creation.form.name.placeholder")}
                  ref={ref}
                  hasError={Boolean(errors.name)}
                  className="w-full border-custom-border-300 placeholder:text-custom-text-400"
                  autoFocus
                />
              </div>
            )}
          />
          {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
        </div>
        <div className="space-y-1">
          <label
            className="text-sm text-custom-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
            htmlFor="slug"
          >
            {t("workspace_creation.form.url.label")}
          </label>
          <Controller
            control={control}
            name="slug"
            rules={{
              required: t("common.errors.required"),
              maxLength: {
                value: 48,
                message: t("workspace_creation.errors.validation.url_length"),
              },
            }}
            render={({ field: { value, ref, onChange } }) => (
              <div
                className={`relative flex items-center rounded-md border-[0.5px] px-3 ${
                  invalidSlug ? "border-red-500" : "border-custom-border-300"
                }`}
              >
                <span className="whitespace-nowrap text-sm">{window && window.location.host}/</span>
                <Input
                  id="slug"
                  name="slug"
                  type="text"
                  value={value.toLocaleLowerCase().trim().replace(/ /g, "-")}
                  onChange={(e) => {
                    if (/^[a-zA-Z0-9_-]+$/.test(e.target.value)) setInvalidSlug(false);
                    else setInvalidSlug(true);
                    onChange(e.target.value.toLowerCase());
                  }}
                  ref={ref}
                  hasError={Boolean(errors.slug)}
                  placeholder={t("workspace_creation.form.url.placeholder")}
                  className="w-full border-none !px-0"
                />
              </div>
            )}
          />
          <p className="text-sm text-custom-text-300">{t("workspace_creation.form.url.edit_slug")}</p>
          {slugError && (
            <p className="-mt-3 text-sm text-red-500">{t("workspace_creation.errors.validation.url_already_taken")}</p>
          )}
          {invalidSlug && (
            <p className="text-sm text-red-500">{t("workspace_creation.errors.validation.url_alphanumeric")}</p>
          )}
          {errors.slug && <span className="text-sm text-red-500">{errors.slug.message}</span>}
        </div>
        <div className="space-y-1">
          <label
            className="text-sm text-custom-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
            htmlFor="organization_size"
          >
            {t("workspace_creation.form.organization_size.label")}
          </label>
          <div className="w-full">
            <Controller
              name="organization_size"
              control={control}
              rules={{ required: t("common.errors.required") }}
              render={({ field: { value, onChange } }) => (
                <div className="flex flex-wrap gap-3">
                  {ORGANIZATION_SIZE.map((size) => {
                    const isSelected = value === size;
                    return (
                      <button
                        key={size}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onChange(size);
                        }}
                        className={`text-sm px-3 py-2 rounded-lg border transition-all duration-200 flex gap-1 items-center justify-between ${
                          isSelected
                            ? "border-custom-border-200 bg-custom-background-80 text-custom-text-200"
                            : "border-custom-border-200 hover:border-custom-border-300 text-custom-text-300"
                        }`}
                      >
                        <CircleCheck
                          className={cn("size-4 text-custom-text-400", isSelected && "text-custom-text-200")}
                        />

                        <span className="font-medium">{size}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.organization_size && (
              <span className="text-sm text-red-500">{errors.organization_size.message}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Button
            data-ph-element={WORKSPACE_TRACKER_ELEMENTS.ONBOARDING_CREATE_WORKSPACE_BUTTON}
            variant="primary"
            type="submit"
            size="lg"
            className="w-full"
            disabled={isButtonDisabled}
          >
            {isSubmitting ? <Spinner height="20px" width="20px" /> : t("workspace_creation.button.default")}
          </Button>
          {hasInvitations && (
            <Button variant="link-neutral" size="lg" className="w-full" onClick={handleCurrentViewChange}>
              Join existing workspace
            </Button>
          )}
        </div>
      </form>
    );
  }
);
