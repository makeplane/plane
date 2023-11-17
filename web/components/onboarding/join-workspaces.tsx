import React, { useState } from "react";

// services
import { WorkspaceService } from "services/workspace.service";
// hooks
import useUser from "hooks/use-user";
// components
import Invitations from "./invitations";
import DummySidebar from "components/account/sidebar";
import OnboardingStepIndicator from "components/account/step-indicator";
import { Button, Input } from "@plane/ui";
// hooks
import useToast from "hooks/use-toast";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { IWorkspace, TOnboardingSteps } from "types";
// constants
import { RESTRICTED_URLS, ROLE } from "constants/workspace";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// icons
import { Search } from "lucide-react";

type Props = {
  finishOnboarding: () => Promise<void>;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  updateLastWorkspace: () => Promise<void>;
  setTryDiffAccount: () => void;
};

// services
const workspaceService = new WorkspaceService();

export const JoinWorkspaces: React.FC<Props> = ({ stepChange, updateLastWorkspace, setTryDiffAccount }) => {
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);
  const { user } = useUser();
  const { workspace: workspaceStore } = useMobxStore();
  const { setToastAlert } = useToast();
  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<IWorkspace>({
    defaultValues: {
      name: "",
      slug: `${window.location.host}/`,
    },
    mode: "onChange",
  });

  const handleNextStep = async () => {
    if (!user) return;
    await stepChange({ workspace_join: true, workspace_create: true });
  };

  const handleCreateWorkspace = async (formData: IWorkspace) => {
    const slug = formData.slug.split("/");
    formData.slug = slug[slug.length - 1];
    // TODO: remove this after adding organization size in backend
    formData.organization_size = "Just myself";
    console.log(formData.slug);
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

              const payload: Partial<TOnboardingSteps> = {
                workspace_create: true,
                workspace_join: true,
              };
              await updateLastWorkspace();
              await stepChange(payload);
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

  return (
    <div className="flex h-full w-full overflow-y-auto">
      <div className="hidden lg:block w-3/12">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, ref } }) => (
            <DummySidebar
              setValue={setValue}
              control={control}
              showProject={false}
              workspaceName={value.length > 0 ? value : "New Workspace"}
            />
          )}
        />
      </div>

      <div className="lg:w-3/5 md:w-4/5 md:px-0 px-7 w-full my-16 mx-auto">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-xl sm:text-2xl">What will your workspace </p>
          <OnboardingStepIndicator step={1} />
        </div>
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
                <div className="flex items-center relative rounded-md bg-white">
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
                        setValue(
                          "slug",
                          `${host}/${slug[slug.length - 1].toLocaleLowerCase().trim().replace(/ /g, "-")}`
                        );
                      }
                    }}
                    placeholder="Enter workspace name..."
                    ref={ref}
                    hasError={Boolean(errors.name)}
                    className="w-full h-[46px] text-base placeholder:text-custom-text-400/50 placeholder:text-base border-custom-border-200"
                  ></Input>
                </div>
              )}
            />
            {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
            <p className="text-base text-custom-text-400 mt-4 mb-1">You can edit the slug.</p>
            <Controller
              control={control}
              name="slug"
              render={({ field: { value, onChange, ref } }) => (
                <div className="flex items-center relative rounded-md bg-white">
                  <Input
                    id="slug"
                    name="slug"
                    type="text"
                    prefix="asdasdasdas"
                    value={value.toLocaleLowerCase().trim().replace(/ /g, "-")}
                    onChange={(e) => {
                      const host = window.location.host;
                      const slug = e.currentTarget.value.split("/");
                      /^[a-zA-Z0-9_-]+$/.test(slug[slug.length - 1]) ? setInvalidSlug(false) : setInvalidSlug(true);
                      setValue(
                        "slug",
                        `${host}/${slug[slug.length - 1].toLocaleLowerCase().trim().replace(/ /g, "-")}`
                      );
                    }}
                    ref={ref}
                    hasError={Boolean(errors.slug)}
                    className="w-full h-[46px] border-custom-border-300"
                  ></Input>
                </div>
              )}
            />
            {slugError && <span className="-mt-3 text-sm text-red-500">Workspace URL is already taken!</span>}
            {invalidSlug && (
              <span className="text-sm text-red-500">{`URL can only contain ( - ), ( _ ) & alphanumeric characters.`}</span>
            )}
          </div>
          <Button variant="primary" type="submit" size="md" disabled={!isValid} loading={isSubmitting}>
            Make it live
          </Button>
        </form>

        <div className="flex md:w-4/5 items-center my-5">
          <hr className="border-custom-border-200 w-full" />
          <p className="text-center text-sm text-custom-text-400 mx-3 flex-shrink-0">Or</p>
          <hr className="border-custom-border-200 w-full" />
        </div>
        <div className="md:w-2/3 w-full">
          <Invitations handleNextStep={handleNextStep} updateLastWorkspace={updateLastWorkspace} />
        </div>

        <div className="py-3 px-4 mt-8 bg-custom-primary-10 rounded-sm flex justify-between items-center">
          <div className="flex items-center">
            <Search className="h-4 w-4  mr-2" />
            <span className="text-sm text-custom-text-200">Don't see your workspace?</span>
          </div>

          <div>
            <div
              className="bg-white py-3 text-center hover:cursor-pointer text-custom-text-200 rounded-md text-sm font-medium border border-custom-border-200"
              onClick={setTryDiffAccount}
            >
              Try a different email address
            </div>
            <p className="text-xs mt-2 text-custom-text-300">
              Your right e-mail address could be from a Google or GitHub login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
