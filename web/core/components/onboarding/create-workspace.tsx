"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// constants
import { ORGANIZATION_SIZE, RESTRICTED_URLS } from "@plane/constants";
// types
import { IUser, IWorkspace, TOnboardingSteps } from "@plane/types";
// ui
import { Button, CustomSelect, Input, Spinner, TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { E_ONBOARDING, WORKSPACE_CREATED } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useUserProfile, useUserSettings, useWorkspace } from "@/hooks/store";
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
  // store hooks
  const { updateUserProfile } = useUserProfile();
  const { fetchCurrentUserSettings } = useUserSettings();
  const { createWorkspace, fetchWorkspaces } = useWorkspace();
  const { captureWorkspaceEvent } = useEventTracker();
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
                title: "Success!",
                message: "Workspace created successfully.",
              });
              captureWorkspaceEvent({
                eventName: WORKSPACE_CREATED,
                payload: {
                  ...workspaceResponse,
                  state: "SUCCESS",
                  first_time: true,
                  element: E_ONBOARDING,
                },
              });
              await fetchWorkspaces();
              await completeStep(workspaceResponse.id);
            })
            .catch(() => {
              captureWorkspaceEvent({
                eventName: WORKSPACE_CREATED,
                payload: {
                  state: "FAILED",
                  first_time: true,
                  element: E_ONBOARDING,
                },
              });
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error!",
                message: "Workspace could not be created. Please try again.",
              });
            });
        } else setSlugError(true);
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Some error occurred while creating workspace. Please try again.",
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
        <h3 className="text-3xl font-bold text-onboarding-text-100">Create a workspace</h3>
        <p className="font-medium text-onboarding-text-400">
          To start using Plane, you need to create or join a workspace.
        </p>
      </div>
      <form className="w-full mx-auto mt-2 space-y-4" onSubmit={handleSubmit(handleCreateWorkspace)}>
        <div className="space-y-1">
          <label
            className="text-sm text-onboarding-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
            htmlFor="name"
          >
            Name your workspace
          </label>
          <Controller
            control={control}
            name="name"
            rules={{
              required: "This is a required field.",
              validate: (value) =>
                /^[\w\s-]*$/.test(value) ||
                `Workspaces names can contain only (" "), ( - ), ( _ ) and alphanumeric characters.`,
              maxLength: {
                value: 80,
                message: "Limit your name to 80 characters.",
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
                  placeholder="Something familiar and recognizable is always best."
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
            Set your workspace&apos;s URL
          </label>
          <Controller
            control={control}
            name="slug"
            rules={{
              required: "This is a required field.",
              maxLength: {
                value: 48,
                message: "Limit your URL to 48 characters.",
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
                  placeholder="workspace-name"
                  className="w-full border-none !px-0"
                />
              </div>
            )}
          />
          <p className="text-sm text-onboarding-text-300">You can only edit the slug of the URL</p>
          {slugError && <p className="-mt-3 text-sm text-red-500">This URL is taken. Try something else.</p>}
          {invalidSlug && (
            <p className="text-sm text-red-500">{`URLs can contain only ( - ), ( _ ) and alphanumeric characters.`}</p>
          )}
          {errors.slug && <span className="text-sm text-red-500">{errors.slug.message}</span>}
        </div>
        <hr className="w-full border-onboarding-border-100" />
        <div className="space-y-1">
          <label
            className="text-sm text-onboarding-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
            htmlFor="organization_size"
          >
            How many people will use this workspace?
          </label>
          <div className="w-full">
            <Controller
              name="organization_size"
              control={control}
              rules={{ required: "This is a required field." }}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  onChange={onChange}
                  label={
                    ORGANIZATION_SIZE.find((c) => c === value) ?? (
                      <span className="text-custom-text-400">Select a range</span>
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
        <Button variant="primary" type="submit" size="lg" className="w-full" disabled={isButtonDisabled}>
          {isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
        </Button>
      </form>
    </div>
  );
});
