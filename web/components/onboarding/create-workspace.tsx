import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
// types
import { IUser, IWorkspace, TOnboardingSteps } from "@plane/types";
// ui
import { Button, CustomSelect, Input, Spinner, TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { WORKSPACE_CREATED } from "@/constants/event-tracker";
import { ORGANIZATION_SIZE, RESTRICTED_URLS } from "@/constants/workspace";
// hooks
import { useEventTracker, useUserProfile, useWorkspace } from "@/hooks/store";
// services
import { WorkspaceService } from "@/services/workspace.service";

type Props = {
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  user: IUser | undefined;
  invitedWorkspaces: number;
  handleCurrentViewChange: () => void;
};

// services
const workspaceService = new WorkspaceService();

export const CreateWorkspace: React.FC<Props> = (props) => {
  const { stepChange, user, invitedWorkspaces, handleCurrentViewChange } = props;
  // states
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);
  // store hooks
  const { updateUserProfile } = useUserProfile();

  const { createWorkspace, fetchWorkspaces, workspaces } = useWorkspace();
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
            .then(async (res) => {
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Success!",
                message: "Workspace created successfully.",
              });
              captureWorkspaceEvent({
                eventName: WORKSPACE_CREATED,
                payload: {
                  ...res,
                  state: "SUCCESS",
                  first_time: true,
                  element: "Onboarding",
                },
              });
              await fetchWorkspaces();
              await completeStep();
            })
            .catch(() => {
              captureWorkspaceEvent({
                eventName: WORKSPACE_CREATED,
                payload: {
                  state: "FAILED",
                  first_time: true,
                  element: "Onboarding",
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

  const completeStep = async () => {
    if (!user || !workspaces) return;

    const firstWorkspace = Object.values(workspaces ?? {})?.[0];

    const payload: Partial<TOnboardingSteps> = {
      workspace_create: true,
      workspace_join: true,
    };

    await stepChange(payload);
    await updateUserProfile({
      last_workspace_id: firstWorkspace?.id,
    });
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
            Workspace name
          </label>
          <Controller
            control={control}
            name="name"
            rules={{
              required: "Workspace name is required",
              validate: (value) =>
                /^[\w\s-]*$/.test(value) || `Name can only contain (" "), ( - ), ( _ ) & alphanumeric characters.`,
              maxLength: {
                value: 80,
                message: "Workspace name should not exceed 80 characters",
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
                    setValue("slug", event.target.value.toLocaleLowerCase().trim().replace(/ /g, "-"));
                  }}
                  placeholder="Enter workspace name..."
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
            Workspace URL
          </label>
          <Controller
            control={control}
            name="slug"
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
                    /^[a-zA-Z0-9_-]+$/.test(e.target.value) ? setInvalidSlug(false) : setInvalidSlug(true);
                    onChange(e.target.value.toLowerCase());
                  }}
                  ref={ref}
                  hasError={Boolean(errors.slug)}
                  className="w-full border-none !px-0"
                />
              </div>
            )}
          />
          <p className="text-sm text-onboarding-text-300">You can only edit the slug of the URL</p>
          {slugError && <p className="-mt-3 text-sm text-red-500">Workspace URL is already taken!</p>}
          {invalidSlug && (
            <p className="text-sm text-red-500">{`URL can only contain ( - ), ( _ ) & alphanumeric characters.`}</p>
          )}
        </div>
        <hr className="w-full border-onboarding-border-100" />
        <div className="space-y-1">
          <label
            className="text-sm text-onboarding-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
            htmlFor="organization_size"
          >
            Company size
          </label>
          <div className="w-full">
            <Controller
              name="organization_size"
              control={control}
              rules={{ required: "This field is required" }}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  onChange={onChange}
                  label={
                    ORGANIZATION_SIZE.find((c) => c === value) ?? (
                      <span className="text-custom-text-400">Select organization size</span>
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
};
