import React, { useState } from "react";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { Camera, User2 } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { Button, Input } from "@plane/ui";
import DummySidebar from "components/account/sidebar";
import OnboardingStepIndicator from "components/account/step-indicator";
import { UserImageUploadModal } from "components/core";
// types
import { IUser } from "types";
// services
import { FileService } from "services/file.service";
// assets
import IssuesSvg from "public/onboarding/onboarding-issues.svg";

const defaultValues: Partial<IUser> = {
  first_name: "",
  avatar: "",
  use_case: undefined,
};

type Props = {
  user?: IUser;
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
  const { user } = props;
  // states
  const [isRemoving, setIsRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const {
    user: userStore,
    workspace: { workspaces },
  } = useMobxStore();
  const workspaceName = workspaces ? workspaces[0]?.name : "New Workspace";
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

    await userStore.updateCurrentUser(payload);
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
    <div className="w-full h-full space-y-7 sm:space-y-10 overflow-y-auto flex ">
      <div className="h-full fixed hidden lg:block w-1/5 max-w-[320px]">
        <DummySidebar showProject workspaceName={workspaceName} />
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
      <div className="lg:w-2/3 w-full flex flex-col justify-between ml-auto ">
        <div className="flex lg:w-4/5 md:px-0 px-7 pt-3 mx-auto flex-col">
          <form onSubmit={handleSubmit(onSubmit)} className="md:w-11/12  ml-auto">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-xl sm:text-2xl">What do we call you? </p>
              <OnboardingStepIndicator step={2} />
            </div>
            <div className="flex mt-6 w-full ">
              <button type="button" onClick={() => setIsImageUploadModalOpen(true)}>
                {!watch("avatar") || watch("avatar") === "" ? (
                  <div className="h-16 hover:cursor-pointer justify-center items-center flex w-16 rounded-full flex-shrink-0 mr-3 relative bg-onboarding-background-300">
                    <div className="h-6 w-6 flex justify-center items-center bottom-1 border border-onboarding-border-100 -right-1 bg-onboarding-background-100 rounded-full absolute">
                      <Camera className="h-4 w-4 stroke-onboarding-background-400" />
                    </div>
                    <User2 className="h-10 w-10 stroke-onboarding-background-300 fill-onboarding-background-400" />
                  </div>
                ) : (
                  <div className="relative h-16 w-16 overflow-hidden mr-3">
                    <img
                      src={watch("avatar")}
                      className="absolute top-0 left-0 h-full w-full object-cover rounded-full"
                      onClick={() => setIsImageUploadModalOpen(true)}
                      alt={user?.display_name}
                    />
                  </div>
                )}
              </button>

              <div className="my-2 bg-onboarding-background-200 w-full mr-10 rounded-md flex text-sm">
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
                      onChange={onChange}
                      ref={ref}
                      hasError={Boolean(errors.first_name)}
                      placeholder="Enter your full name..."
                      className="w-full focus:border-custom-primary-100 border-onboarding-border-100"
                    />
                  )}
                />
              </div>
            </div>
            <div className="mt-14 mb-10">
              <Controller
                control={control}
                name="first_name"
                render={({ field: { value } }) => (
                  <p className="font-medium text-onboarding-text-200 text-xl sm:text-2xl p-0">
                    And how will you use Plane{value.length > 0 ? ", " : ""}
                    {value}?
                  </p>
                )}
              />

              <p className="font-medium text-onboarding-text-300 text-sm my-3">Choose just one</p>

              <Controller
                control={control}
                name="use_case"
                render={({ field: { value, onChange } }) => (
                  <div className="flex flex-wrap break-all overflow-auto">
                    {USE_CASES.map((useCase) => (
                      <div
                        className={`border mb-3 hover:cursor-pointer hover:bg-onboarding-background-300/30 flex-shrink-0 ${
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
        <div className="md:w-11/12 relative flex justify-end  bottom-0 ml-auto">
          <Image src={IssuesSvg} className="w-2/3 h-[w-2/3] object-cover" alt="issue-image" />
        </div>
      </div>
    </div>
  );
});
