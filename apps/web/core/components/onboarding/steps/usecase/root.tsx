import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { USE_CASES } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { CheckIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TUserProfile } from "@plane/types";
import { EOnboardingSteps } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local imports
import { CommonOnboardingHeader } from "../common";
import type { TProfileSetupFormValues } from "../profile/root";

type Props = {
  handleStepChange: (step: EOnboardingSteps, skipInvites?: boolean) => void;
};

const defaultValues = {
  use_case: [] as string[],
};

export const UseCaseSetupStep = observer(function UseCaseSetupStep({ handleStepChange }: Props) {
  // store hooks
  const { data: profile, updateUserProfile } = useUserProfile();
  // form info
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TProfileSetupFormValues>({
    defaultValues: {
      ...defaultValues,
      use_case: profile?.use_case ? profile.use_case.split(". ") : [],
    },
    mode: "onChange",
  });

  // handle submit
  const handleSubmitUserPersonalization = async (formData: TProfileSetupFormValues) => {
    const profileUpdatePayload: Partial<TUserProfile> = {
      use_case: formData.use_case && formData.use_case.length > 0 ? formData.use_case.join(". ") : undefined,
    };
    try {
      await Promise.all([
        updateUserProfile(profileUpdatePayload),
        // totalSteps > 2 && stepChange({ profile_complete: true }),
      ]);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Profile setup completed!",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Profile setup failed. Please try again!",
      });
    }
  };

  // on submit
  const onSubmit = async (formData: TProfileSetupFormValues) => {
    if (!profile) return;
    await handleSubmitUserPersonalization(formData);
    handleStepChange(EOnboardingSteps.USE_CASE_SETUP);
  };

  // handle skip
  const handleSkip = () => {
    handleStepChange(EOnboardingSteps.USE_CASE_SETUP);
  };

  // derived values
  const isButtonDisabled = !isSubmitting && isValid ? false : true;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">
      {/* Header */}
      <CommonOnboardingHeader title="What brings you to Plane?" description="Tell us your goals and team size." />

      {/* Use Case Selection */}
      <div className="flex flex-col gap-3">
        <p className="text-body-sm-semibold text-placeholder">Select one or more</p>

        <Controller
          control={control}
          name="use_case"
          rules={{
            required: "Please select at least one option",
            validate: (value) => (value && value.length > 0) || "Please select at least one option",
          }}
          render={({ field: { value, onChange } }) => (
            <div className="flex flex-col gap-3">
              {USE_CASES.map((useCase) => {
                const isSelected = value?.includes(useCase) || false;
                return (
                  <button
                    key={useCase}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const currentValue = value || [];
                      if (isSelected) {
                        // Remove from array
                        onChange(currentValue.filter((item) => item !== useCase));
                      } else {
                        // Add to array
                        onChange([...currentValue, useCase]);
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                      isSelected
                        ? "border-accent-strong bg-accent-subtle text-accent-primary"
                        : "border-subtle hover:border-strong text-tertiary"
                    }`}
                  >
                    <span
                      className={cn(`size-4 rounded-sm border-2 flex items-center justify-center`, {
                        "bg-accent-primary border-accent-strong": isSelected,
                        "border-strong": !isSelected,
                      })}
                    >
                      <CheckIcon
                        className={cn("w-3 h-3 text-on-color", {
                          "opacity-100": isSelected,
                          "opacity-0": !isSelected,
                        })}
                      />
                    </span>

                    <span className="text-body-sm-regular">{useCase}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.use_case && <span className="text-13 text-danger-primary">{errors.use_case.message}</span>}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button variant="primary" type="submit" className="w-full" size="xl" disabled={isButtonDisabled}>
          Continue
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="w-full" size="xl">
          Skip
        </Button>
      </div>
    </form>
  );
});
