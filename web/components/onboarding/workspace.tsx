import { useState } from "react";
import { Control, Controller, FieldErrors, UseFormHandleSubmit, UseFormSetValue } from "react-hook-form";
// ui
import { Button, Input } from "@plane/ui";
// types
import { IUser, IWorkspace, TOnboardingSteps } from "@plane/types";
// hooks
import { useUser, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
// services
import { WorkspaceService } from "services/workspace.service";
// constants
import { RESTRICTED_URLS } from "constants/workspace";

type Props = {
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  user: IUser | undefined;
  control: Control<IWorkspace, any>;
  handleSubmit: UseFormHandleSubmit<IWorkspace, undefined>;
  errors: FieldErrors<IWorkspace>;
  setValue: UseFormSetValue<IWorkspace>;
  isSubmitting: boolean;
};

// services
const workspaceService = new WorkspaceService();

export const Workspace: React.FC<Props> = (props) => {
  const { stepChange, user, control, handleSubmit, setValue, errors, isSubmitting } = props;
  // states
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);
  // store hooks
  const { updateCurrentUser } = useUser();
  const { createWorkspace, fetchWorkspaces, workspaces } = useWorkspace();
  // toast alert
  const { setToastAlert } = useToast();

  const handleCreateWorkspace = async (formData: IWorkspace) => {
    if (isSubmitting) return;

    await workspaceService
      .workspaceSlugCheck(formData.slug)
      .then(async (res) => {
        if (res.status === true && !RESTRICTED_URLS.includes(formData.slug)) {
          setSlugError(false);

          await createWorkspace(formData)
            .then(async () => {
              setToastAlert({
                type: "success",
                title: "Success!",
                message: "Workspace created successfully.",
              });
              await fetchWorkspaces();
              await completeStep();
            })
            .catch(() =>
              setToastAlert({
                type: "error",
                title: "Error!",
                message: "Workspace could not be created. Please try again.",
              })
            );
        } else setSlugError(true);
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Some error occurred while creating workspace. Please try again.",
        });
      });
  };

  const completeStep = async () => {
    if (!user || !workspaces) return;

    const firstWorkspace = Object.values(workspaces ?? {})?.[0];

    const payload: Partial<TOnboardingSteps> = {
      workspace_create: true,
      workspace_join: true,
    };

    await stepChange(payload);
    await updateCurrentUser({
      last_workspace_id: firstWorkspace?.id,
    });
  };

  return (
    <form className="mt-5 md:w-2/3" onSubmit={handleSubmit(handleCreateWorkspace)}>
      <div className="mb-5">
        <p className="mb-1 text-base text-custom-text-400">Name it.</p>
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
            <div className="relative flex items-center rounded-md bg-onboarding-background-200">
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
                className="h-[46px] w-full border-onboarding-border-100 text-base placeholder:text-base placeholder:text-custom-text-400/50"
              />
            </div>
          )}
        />
        {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
        <p className="mb-1 mt-4 text-base text-custom-text-400">You can edit the slug.</p>
        <Controller
          control={control}
          name="slug"
          render={({ field: { value, ref, onChange } }) => (
            <div
              className={`relative flex items-center rounded-md border bg-onboarding-background-200 px-3 ${
                invalidSlug ? "border-red-500" : "border-onboarding-border-100"
              } `}
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
                className="h-[46px] w-full border-none !px-0"
              />
            </div>
          )}
        />
        {slugError && <span className="-mt-3 text-sm text-red-500">Workspace URL is already taken!</span>}
        {invalidSlug && (
          <span className="text-sm text-red-500">{`URL can only contain ( - ), ( _ ) & alphanumeric characters.`}</span>
        )}
      </div>
      <Button variant="primary" type="submit" size="md">
        {isSubmitting ? "Creating..." : "Make it live"}
      </Button>
    </form>
  );
};
