"use client";

import type { FC } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Box, Check, PenTool, Rocket, Monitor, RefreshCw } from "lucide-react";
// plane imports
import { ONBOARDING_TRACKER_ELEMENTS, USER_TRACKER_EVENTS } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { ViewsIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TUserProfile } from "@plane/types";
import { EOnboardingSteps } from "@plane/types";
// helpers
import { captureError, captureSuccess, captureView } from "@/helpers/event-tracker.helper";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local components
import { CommonOnboardingHeader } from "../common";
import type { TProfileSetupFormValues } from "../profile/root";

type Props = {
  handleStepChange: (step: EOnboardingSteps, skipInvites?: boolean) => void;
};

const ROLES = [
  { id: "product-manager", label: "Product Manager", icon: Box },
  { id: "engineering-manager", label: "Engineering Manager", icon: ViewsIcon },
  { id: "designer", label: "Designer", icon: PenTool },
  { id: "developer", label: "Developer", icon: Monitor },
  { id: "founder-executive", label: "Founder/Executive", icon: Rocket },
  { id: "operations-manager", label: "Operations Manager", icon: RefreshCw },
  { id: "others", label: "Others", icon: Box },
];

const defaultValues = {
  role: "",
};

export const RoleSetupStep: FC<Props> = observer(({ handleStepChange }) => {
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
      role: profile?.role,
    },
    mode: "onChange",
  });

  // handle submit
  const handleSubmitUserPersonalization = async (formData: TProfileSetupFormValues) => {
    const profileUpdatePayload: Partial<TUserProfile> = {
      role: formData.role,
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
          role: formData.role,
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

  const onSubmit = async (formData: TProfileSetupFormValues) => {
    if (!profile) return;
    captureView({
      elementName: ONBOARDING_TRACKER_ELEMENTS.PROFILE_SETUP_FORM,
    });
    await handleSubmitUserPersonalization(formData).then(() => {
      handleStepChange(EOnboardingSteps.ROLE_SETUP);
    });
  };

  const handleSkip = () => {
    handleStepChange(EOnboardingSteps.ROLE_SETUP);
  };

  const isButtonDisabled = !isSubmitting && isValid ? false : true;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">
      {/* Header */}
      <CommonOnboardingHeader title="What's your role?" description="Let's set up Plane for how you work." />
      {/* Role Selection */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-custom-text-400">Select one</p>
        <Controller
          control={control}
          name="role"
          rules={{
            required: "This field is required",
          }}
          render={({ field: { value, onChange } }) => (
            <div className="flex flex-col gap-3">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = value === role.id;

                return (
                  <button
                    key={role.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onChange(role.id);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? "border-custom-primary-100 bg-custom-primary-10 text-custom-primary-100"
                        : "border-custom-border-200 hover:border-custom-border-300 text-custom-text-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="size-3.5" />
                      <span className="font-medium">{role.label}</span>
                    </div>
                    {isSelected && (
                      <>
                        <button
                          className={`size-4 rounded border-2 flex items-center justify-center bg-blue-500 border-blue-500`}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </button>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.role && <span className="text-sm text-red-500">{errors.role.message}</span>}
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
