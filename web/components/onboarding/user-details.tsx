// react
import React, { useState } from "react";
// next
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { Button, Input } from "@plane/ui";
import DummySidebar from "components/account/sidebar";
import OnboardingStepIndicator from "components/account/step-indicator";
// types
import { IUser } from "types";
// constants
import { TIME_ZONES } from "constants/timezones";
// assets
import IssuesSvg from "public/onboarding/onboarding-issues.svg";
import { ImageUploadModal } from "components/core";
// icons
import { Camera, User2 } from "lucide-react";

const defaultValues: Partial<IUser> = {
  first_name: "",
  avatar: "",
  use_case: undefined,
};

type Props = {
  user?: IUser;
};

const timeZoneOptions = TIME_ZONES.map((timeZone) => ({
  value: timeZone.value,
  query: timeZone.label + " " + timeZone.value,
  content: timeZone.label,
}));

export const UserDetails: React.FC<Props> = observer((props) => {
  const { user } = props;
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedUsecase, setSelectedUsecase] = useState<number | null>();
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const { user: userStore } = useMobxStore();

  const {
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

  const useCases = [
    "Build Products",
    "Manage Feedbacks",
    "Service delivery",
    "Field force management",
    "Code Repository Integration",
    "Bug Tracking",
    "Test Case Management",
    "Rescource allocation",
  ];

  return (
    <div className="h-full w-full space-y-7 sm:space-y-10 overflow-y-auto flex ">
      <div className="hidden lg:block w-3/12">
        <DummySidebar showProject workspaceName="New Workspace" />
      </div>
      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        isRemoving={isRemoving}
        handleDelete={() => {}}
        onSuccess={(url) => {
          setValue("avatar", url);
          setIsImageUploadModalOpen(false);
        }}
        value={watch("avatar") !== "" ? watch("avatar") : undefined}
        userImage
      />
      <div className="flex lg:w-3/5 md:w-4/5 md:px-0 px-7 mx-auto flex-col">
        <form onSubmit={handleSubmit(onSubmit)} className="md:w-11/12 mx-auto">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-xl sm:text-2xl">What do we call you? </p>
            <OnboardingStepIndicator step={2} />
          </div>
          <div className="flex mt-5 w-full ">
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
                  And how will you use Plane{value.length>0?", ":""}{value}?
                </p>
              )}
            />

            <p className="font-medium text-onboarding-text-300 text-sm my-3">Choose just one</p>

            <Controller
              control={control}
              name="use_case"
              render={({ field: { value, onChange } }) => (
                <div className="flex flex-wrap break-all overflow-auto">
                  {useCases.map((useCase) => (
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
        <div className="mt-3 flex ml-auto">
          <Image src={IssuesSvg} className="w-2/3 h-[w-2/3] object-cover" />
        </div>
      </div>
    </div>
  );
});
