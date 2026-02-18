/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Box, PenTool, Rocket, Monitor, RefreshCw } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CheckIcon, ViewsIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TUserProfile } from "@plane/types";
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
  { id: "product-manager", i18nLabel: "onboarding.role_setup.roles.product_manager", icon: Box },
  { id: "engineering-manager", i18nLabel: "onboarding.role_setup.roles.engineering_manager", icon: ViewsIcon },
  { id: "designer", i18nLabel: "onboarding.role_setup.roles.designer", icon: PenTool },
  { id: "developer", i18nLabel: "onboarding.role_setup.roles.developer", icon: Monitor },
  { id: "founder-executive", i18nLabel: "onboarding.role_setup.roles.founder_executive", icon: Rocket },
  { id: "operations-manager", i18nLabel: "onboarding.role_setup.roles.operations_manager", icon: RefreshCw },
  { id: "others", i18nLabel: "onboarding.role_setup.roles.others", icon: Box },
];

const defaultValues = {
  role: "",
};

export const RoleSetupStep = observer(function RoleSetupStep({ handleStepChange }: Props) {
  // i18n
  const { t } = useTranslation();
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
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("onboarding.profile.form.setup_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("onboarding.profile.form.setup_error"),
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
      <CommonOnboardingHeader
        title={t("onboarding.role_setup.title")}
        description={t("onboarding.role_setup.description")}
      />
      {/* Role Selection */}
      <div className="flex flex-col gap-3">
        <p className="text-body-sm-semibold text-placeholder">{t("onboarding.role_setup.select_one")}</p>
        <Controller
          control={control}
          name="role"
          rules={{
            required: t("onboarding.profile.form.role.required"),
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
                        ? "border-accent-strong bg-accent-subtle text-accent-primary"
                        : "border-subtle hover:border-strong text-tertiary"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="size-3.5" />
                      <span className="text-body-sm-semibold">{t(role.i18nLabel)}</span>
                    </div>
                    {isSelected && (
                      <>
                        <button
                          className={`size-4 rounded-sm border-2 flex items-center justify-center bg-accent-primary border-blue-500`}
                        >
                          <CheckIcon className="w-3 h-3 text-on-color" />
                        </button>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.role && <span className="text-13 text-danger-primary">{errors.role.message}</span>}
      </div>
      {/* Action Buttons */}
      <div className="space-y-3">
        <Button variant="primary" type="submit" className="w-full" size="xl" disabled={isButtonDisabled}>
          {t("onboarding.continue")}
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="text-tertiary w-full" size="xl">
          {t("onboarding.role_setup.skip")}
        </Button>
      </div>
    </form>
  );
});
