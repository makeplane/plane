/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import {
  CubeOutline,
  MonitorOutline,
  PenToolOutline,
  RefreshOutline,
  RocketOutline,
  TickOutline,
  ViewsOutline,
} from "@makeplane/propel/icons";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import type { TUserProfile } from "@plane/types";
import { cn } from "@plane/utils";
import { EOnboardingSteps } from "@plane/types";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local components
import { CommonOnboardingHeader } from "../common";
import type { TProfileSetupFormValues } from "../profile/root";

type Props = {
  handleStepChange: (step: EOnboardingSteps, skipInvites?: boolean) => void;
};

const ROLES = [
  { id: "product-manager", label: "Product Manager", icon: CubeOutline },
  { id: "engineering-manager", label: "Engineering Manager", icon: ViewsOutline },
  { id: "designer", label: "Designer", icon: PenToolOutline },
  { id: "developer", label: "Developer", icon: MonitorOutline },
  { id: "founder-executive", label: "Founder/Executive", icon: RocketOutline },
  { id: "operations-manager", label: "Operations Manager", icon: RefreshOutline },
  { id: "others", label: "Others", icon: CubeOutline },
];

const defaultValues = {
  role: "",
};

export const RoleSetupStep = observer(function RoleSetupStep({ handleStepChange }: Props) {
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

  const onSubmit = async (formData: TProfileSetupFormValues) => {
    if (!profile) return;
    await handleSubmitUserPersonalization(formData);
    handleStepChange(EOnboardingSteps.ROLE_SETUP);
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
      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="mb-3 text-body-sm-semibold text-placeholder">Select one</legend>
        <Controller
          control={control}
          name="role"
          rules={{
            required: "This field is required",
          }}
          render={({ field: { value, onChange } }) => (
            <div className="flex flex-col gap-2">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = value === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onChange(role.id);
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
                    <Icon className={cn("size-4 shrink-0", { "text-icon-accent-primary": isSelected })} />
                    <span
                      className={cn("min-w-0 flex-1 truncate text-body-sm-medium", {
                        "text-accent-primary": isSelected,
                        "text-primary": !isSelected,
                      })}
                    >
                      {role.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.role && <span className="text-body-xs-regular text-danger-primary">{errors.role.message}</span>}
      </fieldset>
      {/* Action Buttons */}
      <div className="space-y-3">
        <Button variant="primary" type="submit" stretch="full" size="lg" disabled={isButtonDisabled} label="Continue" />
        <Button
          variant="ghost"
          onClick={handleSkip}
          stretch="full"
          size="lg"
          render={<button type="button" />}
          label="Skip"
        />
      </div>
    </form>
  );
});
