"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// constants
import {
  ORGANIZATION_SIZE,
  RESTRICTED_URLS,
  WORKSPACE_TRACKER_EVENTS,
  WORKSPACE_TRACKER_ELEMENTS,
} from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import { IUser, IWorkspace, TOnboardingSteps } from "@plane/types";
// ui
import { Button, CustomSelect, Input, Spinner, TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useUserProfile, useUserSettings, useWorkspace } from "@/hooks/store";
// services
import { WorkspaceService } from "@/plane-web/services";

type Props = {
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  user: IUser | undefined;
  invitedWorkspaces: number;
  handleCurrentViewChange: () => void;
};

// services
const workspaceService = new WorkspaceService();

export const CreateWorkspace: React.FC<Props> = observer((props) => {
  const { stepChange, user, invitedWorkspaces, handleCurrentViewChange } = props;
  // states
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { updateUserProfile } = useUserProfile();
  const { fetchCurrentUserSettings } = useUserSettings();
  const { createWorkspace, fetchWorkspaces } = useWorkspace();
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
    const payload: Partial<TOnboardingSteps> = {
      workspace_create: true,
      workspace_join: true,
    };

    await stepChange(payload);
    await updateUserProfile({
      last_workspace_id: workspaceId,
    });
    await fetchCurrentUserSettings();
  };

  const isButtonDisabled = !isValid || invalidSlug || isSubmitting;

  return (
    <div className="space-y-4">
      {!!invitedWorkspaces && (
        <>
          <Button
            variant="link-neutral"
            size="lg"
            className="w-full flex items-center gap-2 text-base bg-custom-background-90"
            onClick={handleCurrentViewChange}
          >
            I want to join invited workspaces{" "}
            <span className="bg-custom-primary-200 h-4 w-4 flex items-center justify-center rounded-sm text-xs font-medium text-white">
              {invitedWorkspaces}
            </span>
          </Button>
          <div className="mx-auto mt-4 flex items-center sm:w-96">
            <hr className="w-full border-onboarding-border-100" />
            <p className="mx-3 flex-shrink-0 text-center text-sm text-onboarding-text-400">or</p>
            <hr className="w-full border-onboarding-border-100" />
          </div>
        </>
      )}
      <div className="text-center space-y-1 py-4 mx-auto">
        <h3 className="text-3xl font-bold text-onboarding-text-100">{t("workspace_creation.heading")}</h3>
        <p className="font-medium text-onboarding-text-400">{t("workspace_creation.subheading")}</p>
      </div>
      <form className="w-full mx-auto mt-2 space-y-4" onSubmit={handleSubmit(handleCreateWorkspace)}>
        <div className="space-y-1">
          <label
            className="text-sm text-onboarding-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
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
                  className="w-full border-onboarding-border-100 placeholder:text-custom-text-400"
                  autoFocus
                />
              </div>
            )}
          />
          {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
        </div>
        <div className="space-y-1">
          <label
            className="text-sm text-onboarding-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
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
                  invalidSlug ? "border-red-500" : "border-onboarding-border-100"
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
          <p className="text-sm text-onboarding-text-300">{t("workspace_creation.form.url.edit_slug")}</p>
          {slugError && (
            <p className="-mt-3 text-sm text-red-500">{t("workspace_creation.errors.validation.url_already_taken")}</p>
          )}
          {invalidSlug && (
            <p className="text-sm text-red-500">{t("workspace_creation.errors.validation.url_alphanumeric")}</p>
          )}
          {errors.slug && <span className="text-sm text-red-500">{errors.slug.message}</span>}
        </div>
        <hr className="w-full border-onboarding-border-100" />
        <div className="space-y-1">
          <label
            className="text-sm text-onboarding-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
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
                <CustomSelect
                  value={value}
                  onChange={onChange}
                  label={
                    ORGANIZATION_SIZE.find((c) => c === value) ?? (
                      <span className="text-custom-text-400">
                        {t("workspace_creation.form.organization_size.placeholder")}
                      </span>
                    )
                  }
                  buttonClassName="!border-[0.5px] !border-onboarding-border-100 !shadow-none !rounded-md"
                  input
                  optionsClassName="w-full"
                >
                  {ORGANIZATION_SIZE.map((item) => (
                    <CustomSelect.Option key={item} value={item}>
                      {item}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
            {errors.organization_size && (
              <span className="text-sm text-red-500">{errors.organization_size.message}</span>
            )}
          </div>
        </div>
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
      </form>
    </div>
  );
});
