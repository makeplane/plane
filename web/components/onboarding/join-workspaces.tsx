import React from "react";
import { Controller, useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
// components
import { Invitations, OnboardingSidebar, OnboardingStepIndicator, Workspace } from "components/onboarding";
// types
import { IWorkspace, TOnboardingSteps } from "@plane/types";

type Props = {
  finishOnboarding: () => Promise<void>;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  setTryDiffAccount: () => void;
};

export const JoinWorkspaces: React.FC<Props> = observer((props) => {
  const { stepChange, setTryDiffAccount } = props;
  // store hooks
  const { currentUser } = useUser();
  // form info
  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>({
    defaultValues: {
      name: "",
      slug: "",
    },
    mode: "onChange",
  });

  const handleNextStep = async () => {
    if (!currentUser) return;
    await stepChange({ workspace_join: true, workspace_create: true });
  };

  return (
    <div className="flex w-full">
      <div className="fixed hidden h-full w-1/5 max-w-[320px] lg:block">
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
      <div className="ml-auto w-full lg:w-2/3 ">
        <div className="mx-auto my-16 w-full px-7 lg:w-4/5 lg:px-0">
          <div className="flex items-center justify-between">
            <p className="text-xl font-semibold text-onboarding-text-200 sm:text-2xl">What will your workspace be?</p>
            <OnboardingStepIndicator step={1} />
          </div>
          <Workspace
            stepChange={stepChange}
            user={currentUser ?? undefined}
            control={control}
            handleSubmit={handleSubmit}
            setValue={setValue}
            errors={errors}
            isSubmitting={isSubmitting}
          />
          <div className="my-8 flex items-center md:w-1/2">
            <hr className="w-full border-onboarding-border-100" />
            <p className="mx-3 flex-shrink-0 text-center text-sm text-custom-text-400">Or</p>
            <hr className="w-full border-onboarding-border-100" />
          </div>
          <div className="w-full">
            <Invitations setTryDiffAccount={setTryDiffAccount} handleNextStep={handleNextStep} />
          </div>
        </div>
      </div>
    </div>
  );
});
