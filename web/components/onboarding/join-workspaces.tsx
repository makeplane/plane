import React from "react";
import { Controller, useForm } from "react-hook-form";
// hooks
import useUser from "hooks/use-user";
// components
import { Invitations, OnboardingSidebar, OnboardingStepIndicator, Workspace } from "components/onboarding";
// types
import { IWorkspace, TOnboardingSteps } from "types";

type Props = {
  finishOnboarding: () => Promise<void>;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  setTryDiffAccount: () => void;
};

export const JoinWorkspaces: React.FC<Props> = ({ stepChange, setTryDiffAccount }) => {
  const { user } = useUser();
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

  return (
    <div className="flex w-full">
      <div className="h-full fixed hidden lg:block w-1/5 max-w-[320px]">
        <Controller
          control={control}
          name="name"
          render={({ field: { value } }) => (
            <OnboardingSidebar
              watch={watch}
              setValue={setValue}
              control={control}
              showProject={false}
              workspaceName={value.length > 0 ? value : "New Workspace"}
            />
          )}
        />
      </div>
      <div className="lg:w-2/3 w-full ml-auto ">
        <div className="w-full lg:w-4/5 px-7 lg:px-0 my-16 mx-auto">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-onboarding-text-200 text-xl sm:text-2xl">What will your workspace be?</p>
            <OnboardingStepIndicator step={1} />
          </div>
          <Workspace
            stepChange={stepChange}
            user={user}
            control={control}
            handleSubmit={handleSubmit}
            setValue={setValue}
            errors={errors}
            isSubmitting={isSubmitting}
          />
          <div className="flex md:w-1/2 items-center my-8">
            <hr className="border-onboarding-border-100 w-full" />
            <p className="text-center text-sm text-custom-text-400 mx-3 flex-shrink-0">Or</p>
            <hr className="border-onboarding-border-100 w-full" />
          </div>
          <div className="w-full">
            <Invitations setTryDiffAccount={setTryDiffAccount} handleNextStep={handleNextStep} />
          </div>
        </div>
      </div>
    </div>
  );
};
