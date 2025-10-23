"use client";

import type { FC } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Check } from "lucide-react";
// plane imports
import { ONBOARDING_TRACKER_ELEMENTS, USER_TRACKER_EVENTS, USE_CASES } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TUserProfile } from "@plane/types";
import { EOnboardingSteps } from "@plane/types";
import { cn } from "@plane/utils";
// helpers
import { captureError, captureSuccess, captureView } from "@/helpers/event-tracker.helper";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local imports
import { CommonOnboardingHeader } from "../common";
import type { TProfileSetupFormValues } from "../profile/root";

type Props = {
  handleStepChange: (step: EOnboardingSteps, skipInvites?: boolean) => void;
};

const defaultValues = {
  use_case: "",
};

export const UseCaseSetupStep: FC<Props> = observer(({ handleStepChange }) => {
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
      use_case: profile?.use_case,
    },
    mode: "onChange",
  });

  // handle submit
  const handleSubmitUserPersonalization = async (formData: TProfileSetupFormValues) => {
    const profileUpdatePayload: Partial<TUserProfile> = {
      use_case: formData.use_case,
    };
    try {
      await Promise.all([
        updateUserProfile(profileUpdatePayload),
        // totalSteps > 2 && stepChange({ profile_complete: true }),
      ]);
      captureSuccess({
        eventName: USER_TRACKER_EVENTS.add_details,
        payload: {
          use_case: formData.use_case,
        },
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Profile setup completed!",
      });
    } catch {
      captureError({
        eventName: USER_TRACKER_EVENTS.add_details,
      });
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
    captureView({
      elementName: ONBOARDING_TRACKER_ELEMENTS.PROFILE_SETUP_FORM,
    });
    await handleSubmitUserPersonalization(formData).then(() => {
      handleStepChange(EOnboardingSteps.USE_CASE_SETUP);
    });
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
        <p className="text-sm font-medium text-custom-text-400">Select any</p>

        <Controller
          control={control}
          name="use_case"
          rules={{
            required: "This field is required",
          }}
          render={({ field: { value, onChange } }) => (
            <div className="flex flex-col gap-3">
              {USE_CASES.map((useCase) => {
                const isSelected = value === useCase;
                return (
                  <button
                    key={useCase}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(useCase);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                      isSelected
                        ? "border-custom-primary-100 bg-custom-primary-10 text-custom-primary-100"
                        : "border-custom-border-200 hover:border-custom-border-300 text-custom-text-300"
                    }`}
                  >
                    <span
                      className={cn(`size-4 rounded border-2 flex items-center justify-center`, {
                        "bg-custom-primary-100 border-custom-primary-100": isSelected,
                        "border-custom-border-300": !isSelected,
                      })}
                    >
                      <Check
                        className={cn("w-3 h-3 text-white", {
                          "opacity-100": isSelected,
                          "opacity-0": !isSelected,
                        })}
                      />
                    </span>

                    <span className="font-medium">{useCase}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.use_case && <span className="text-sm text-red-500">{errors.use_case.message}</span>}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button variant="primary" type="submit" className="w-full" size="lg" disabled={isButtonDisabled}>
          Continue
        </Button>
        <Button variant="link-neutral" onClick={handleSkip} className="w-full" size="lg">
          Skip
        </Button>
      </div>
    </form>
  );
});
