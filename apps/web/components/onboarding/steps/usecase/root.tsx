/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { USE_CASES } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import { TickOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
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
      [await updateUserProfile(profileUpdatePayload)];
      setToast({
        type: "success",
        title: "Success",
        message: "Profile setup completed!",
      });
    } catch {
      setToast({
        type: "error",
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
      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="mb-3 text-body-sm-semibold text-placeholder">Select one or more</legend>

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
                    type="button"
                    aria-pressed={isSelected}
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
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:outline-none",
                      isSelected
                        ? "border-accent-strong bg-accent-subtle"
                        : "border-subtle bg-layer-2 hover:bg-layer-2-hover"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn("flex size-4 shrink-0 items-center justify-center rounded-sm border", {
                        "border-accent-strong bg-accent-primary": isSelected,
                        "border-strong bg-layer-1": !isSelected,
                      })}
                    >
                      <TickOutline
                        className={cn("size-3 text-on-color", {
                          "opacity-100": isSelected,
                          "opacity-0": !isSelected,
                        })}
                      />
                    </span>
                    <span
                      className={cn("min-w-0 flex-1 truncate text-body-sm-medium", {
                        "text-accent-primary": isSelected,
                        "text-primary": !isSelected,
                      })}
                    >
                      {useCase}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.use_case && <span className="text-body-xs-regular text-danger-primary">{errors.use_case.message}</span>}
      </fieldset>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button variant="primary" type="submit" stretch="full" size="lg" disabled={isButtonDisabled} label="Continue" />
        <Button variant="ghost" onClick={handleSkip} stretch="full" size="lg" label="Skip" />
      </div>
    </form>
  );
});
