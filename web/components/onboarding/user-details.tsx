import React, { useState } from "react";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { Camera, User2 } from "lucide-react";
// hooks
import { useUser, useWorkspace } from "hooks/store";
// components
import { Button, Input } from "@plane/ui";
import { OnboardingSidebar, OnboardingStepIndicator } from "components/onboarding";
import { UserImageUploadModal } from "components/core";
// types
import { IUser } from "@plane/types";
// services
import { FileService } from "services/file.service";
// assets
import IssuesSvg from "public/onboarding/onboarding-issues.webp";

const defaultValues: Partial<IUser> = {
  first_name: "",
  avatar: "",
  use_case: undefined,
};

type Props = {
  user?: IUser;
  setUserName: (name: string) => void;
};

const USE_CASES = [
  "Build Products",
  "Manage Feedbacks",
  "Service delivery",
  "Field force management",
  "Code Repository Integration",
  "Bug Tracking",
  "Test Case Management",
  "Resource allocation",
];

const fileService = new FileService();

export const UserDetails: React.FC<Props> = observer((props) => {
  const { user, setUserName } = props;
  // states
  const [isRemoving, setIsRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  // store hooks
  const { updateCurrentUser } = useUser();
  const { workspaces } = useWorkspace();
  // derived values
  const workspaceName = workspaces ? Object.values(workspaces)?.[0]?.name : "New Workspace";
  // form info
  const {
    getValues,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<IUser>({
    defaultValues,
  });

  const onSubmit = async (formData: IUser) => {
    if (!user) return;

    const payload: Partial<IUser> = {
      ...formData,
      first_name: formData.first_name.split(" ")[0],
      last_name: formData.first_name.split(" ")[1],
      use_case: formData.use_case,
      onboarding_step: {
        ...user.onboarding_step,
        profile_complete: true,
      },
    };

    await updateCurrentUser(payload);
  };
  const handleDelete = (url: string | null | undefined) => {
    if (!url) return;

    setIsRemoving(true);
    fileService.deleteUserFile(url).finally(() => {
      setValue("avatar", "");
      setIsRemoving(false);
    });
  };

  return (
    <div className="flex h-full w-full space-y-7 overflow-y-auto sm:space-y-10 ">
      <div className="fixed hidden h-full w-1/5 max-w-[320px] lg:block">
        <Controller
          control={control}
          name="first_name"
          render={({ field: { value } }) => (
            <OnboardingSidebar
              userFullName={value.length === 0 ? undefined : value}
              showProject
              workspaceName={workspaceName}
            />
          )}
        />
      </div>
      <Controller
        control={control}
        name="avatar"
        render={({ field: { onChange, value } }) => (
          <UserImageUploadModal
            isOpen={isImageUploadModalOpen}
            onClose={() => setIsImageUploadModalOpen(false)}
            isRemoving={isRemoving}
            handleDelete={() => handleDelete(getValues("avatar"))}
            onSuccess={(url) => {
              onChange(url);
              setIsImageUploadModalOpen(false);
            }}
            value={value && value.trim() !== "" ? value : null}
          />
        )}
      />
      <div className="ml-auto flex w-full flex-col justify-between lg:w-2/3 ">
        <div className="mx-auto flex flex-col px-7 pt-3 md:px-0 lg:w-4/5">
          <form onSubmit={handleSubmit(onSubmit)} className="ml-auto  md:w-11/12">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold sm:text-2xl">What do we call you? </p>
              <OnboardingStepIndicator step={2} />
            </div>
            <div className="mt-6 flex w-full ">
              <button type="button" onClick={() => setIsImageUploadModalOpen(true)}>
                {!watch("avatar") || watch("avatar") === "" ? (
                  <div className="relative mr-3 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-onboarding-background-300 hover:cursor-pointer">
                    <div className="absolute -right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full border border-onboarding-border-100 bg-onboarding-background-100">
                      <Camera className="h-4 w-4 stroke-onboarding-background-400" />
                    </div>
                    <User2 className="h-10 w-10 fill-onboarding-background-400 stroke-onboarding-background-300" />
                  </div>
                ) : (
                  <div className="relative mr-3 h-16 w-16 overflow-hidden">
                    <img
                      src={watch("avatar")}
                      className="absolute left-0 top-0 h-full w-full rounded-full object-cover"
                      onClick={() => setIsImageUploadModalOpen(true)}
                      alt={user?.display_name}
                    />
                  </div>
                )}
              </button>

              <div className="my-2 mr-10 flex w-full rounded-md bg-onboarding-background-200 text-sm">
                <Controller
                  control={control}
                  name="first_name"
                  rules={{
                    required: "First name is required",
                    maxLength: {
                      value: 24,
                      message: "First name cannot exceed the limit of 24 characters",
                    },
                  }}
                  render={({ field: { value, onChange, ref } }) => (
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={value}
                      autoFocus={true}
                      onChange={(event) => {
                        setUserName(event.target.value);
                        onChange(event);
                      }}
                      ref={ref}
                      hasError={Boolean(errors.first_name)}
                      placeholder="Enter your full name..."
                      className="w-full border-onboarding-border-100 focus:border-custom-primary-100"
                    />
                  )}
                />
              </div>
            </div>
            <div className="mb-10 mt-14">
              <Controller
                control={control}
                name="first_name"
                render={({ field: { value } }) => (
                  <p className="p-0 text-xl font-medium text-onboarding-text-200 sm:text-2xl">
                    And how will you use Plane{value.length > 0 ? ", " : ""}
                    {value}?
                  </p>
                )}
              />

              <p className="my-3 text-sm font-medium text-onboarding-text-300">Choose just one</p>

              <Controller
                control={control}
                name="use_case"
                render={({ field: { value, onChange } }) => (
                  <div className="flex flex-wrap overflow-auto break-all">
                    {USE_CASES.map((useCase) => (
                      <div
                        className={`mb-3 flex-shrink-0 border hover:cursor-pointer hover:bg-onboarding-background-300/30 ${
                          value === useCase ? "border-custom-primary-100" : "border-onboarding-border-100"
                        } mr-3 rounded-sm p-3 text-sm font-medium`}
                        onClick={() => onChange(useCase)}
                      >
                        {useCase}
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>

            <Button variant="primary" type="submit" size="md" disabled={!isValid} loading={isSubmitting}>
              {isSubmitting ? "Updating..." : "Continue"}
            </Button>
          </form>
        </div>
        <div className="relative bottom-0 ml-auto flex  justify-end md:w-11/12">
          <Image src={IssuesSvg} className="h-[w-2/3] w-2/3 object-cover" alt="issue-image" />
        </div>
      </div>
    </div>
  );
});
