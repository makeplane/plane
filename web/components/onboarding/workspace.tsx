import { useState } from "react";
import { Control, Controller, FieldErrors, UseFormHandleSubmit, UseFormSetValue } from "react-hook-form";
// ui
import { Button, Input } from "@plane/ui";
// types
import { IUser, IWorkspace, TOnboardingSteps } from "types";
// hooks
import useToast from "hooks/use-toast";
// services
import { WorkspaceService } from "services/workspace.service";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
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
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);

  const {
    workspace: workspaceStore,
    user: { updateCurrentUser },
  } = useMobxStore();

  const { setToastAlert } = useToast();

  const handleCreateWorkspace = async (formData: IWorkspace) => {
    if (isSubmitting) return;
    const slug = formData.slug.split("/");
    formData.slug = slug[slug.length - 1];

    await workspaceService
      .workspaceSlugCheck(formData.slug)
      .then(async (res) => {
        if (res.status === true && !RESTRICTED_URLS.includes(formData.slug)) {
          setSlugError(false);

          await workspaceStore
            .createWorkspace(formData)
            .then(async (res) => {
              setToastAlert({
                type: "success",
                title: "Success!",
                message: "Workspace created successfully.",
              });
              await workspaceStore.fetchWorkspaces();
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
    if (!user || !workspaceStore.workspaces) return;

    const payload: Partial<TOnboardingSteps> = {
      workspace_create: true,
      workspace_join: true,
    };

    await stepChange(payload);
    await updateCurrentUser({
      last_workspace_id: workspaceStore.workspaces[0]?.id,
    });
  };

  return (
    <form className="mt-5 md:w-2/3" onSubmit={handleSubmit(handleCreateWorkspace)}>
      <div className="mb-5">
        <p className="text-base text-custom-text-400 mb-1">Name it.</p>
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
            <div className="flex items-center relative rounded-md bg-onboarding-background-200">
              <Input
                id="name"
                name="name"
                type="text"
                value={value}
                onChange={(event) => {
                  onChange(event.target.value);
                  setValue("name", event.target.value);
                  if (window && window.location.host) {
                    const host = window.location.host;
                    const slug = event.currentTarget.value.split("/");
                    setValue("slug", `${host}/${slug[slug.length - 1].toLocaleLowerCase().trim().replace(/ /g, "-")}`);
                  }
                }}
                placeholder="Enter workspace name..."
                ref={ref}
                hasError={Boolean(errors.name)}
                className="w-full h-[46px] text-base placeholder:text-custom-text-400/50 placeholder:text-base border-onboarding-border-100"
              />
            </div>
          )}
        />
        {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
        <p className="text-base text-custom-text-400 mt-4 mb-1">You can edit the slug.</p>
        <Controller
          control={control}
          name="slug"
          render={({ field: { value, onChange, ref } }) => (
            <div className="flex items-center relative rounded-md bg-onboarding-background-200">
              <Input
                id="slug"
                name="slug"
                type="text"
                prefix="asdasdasdas"
                value={value.toLocaleLowerCase().trim().replace(/ /g, "-")}
                onChange={(e) => {
                  const host = window.location.host;
                  const slug = e.currentTarget.value.split("/");
                  if (slug.length > 1) {
                    /^[a-zA-Z0-9_-]+$/.test(slug[slug.length - 1]) ? setInvalidSlug(false) : setInvalidSlug(true);
                    setValue("slug", `${host}/${slug[slug.length - 1].toLocaleLowerCase().trim().replace(/ /g, "-")}`);
                  } else {
                    setValue("slug", `${host}/`);
                  }
                }}
                ref={ref}
                hasError={Boolean(errors.slug)}
                className="w-full h-[46px] border-onboarding-border-100"
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
