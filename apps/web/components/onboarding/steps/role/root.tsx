/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { PenTool } from "lucide-react";
import {
  CubeOutline,
  MonitorOutline,
  RefreshOutline,
  RocketOutline,
  TickOutline,
  ViewsOutline,
} from "@makeplane/propel/icons";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
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

const defaultValues = {
  role: "",
};

export const RoleSetupStep = observer(function RoleSetupStep({ handleStepChange }: Props) {
  const { t } = useTranslation();
  const ROLES = [
    { id: "product-manager", label: t("web_ui.product_manager"), icon: CubeOutline },
    { id: "engineering-manager", label: t("web_ui.engineering_manager"), icon: ViewsOutline },
    { id: "designer", label: t("web_ui.designer"), icon: PenTool },
    { id: "developer", label: t("common.developer"), icon: MonitorOutline },
    { id: "founder-executive", label: t("web_ui.founder_executive"), icon: RocketOutline },
    { id: "operations-manager", label: t("web_ui.operations_manager"), icon: RefreshOutline },
    { id: "others", label: t("web_ui.others"), icon: CubeOutline },
  ];

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
      await updateUserProfile(profileUpdatePayload);
      setToast({
        type: "success",
        title: t("success"),
        message: t("web_ui.profile_setup_completed"),
      });
    } catch {
      setToast({
        type: "error",
        title: t("error"),
        message: t("web_ui.profile_setup_failed_please_try_again"),
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

  const isButtonDisabled = !(!isSubmitting && isValid);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">
      {/* Header */}
      <CommonOnboardingHeader
        title={t("web_ui.what_s_your_role")}
        description={t("web_ui.let_s_set_up_plane_for_how_you_work")}
      />
      {/* Role Selection */}
      <div className="flex flex-col gap-3">
        <p className="text-body-sm-semibold text-placeholder">{t("web_ui.select_one")}</p>
        <Controller
          control={control}
          name="role"
          rules={{
            required: t("common.errors.required"),
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
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 transition-all duration-200 ${
                      isSelected
                        ? "border-accent-strong bg-accent-subtle text-accent-primary"
                        : "border-subtle text-tertiary hover:border-strong"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="size-3.5" />
                      <span className="text-body-sm-semibold">{role.label}</span>
                    </div>
                    {isSelected && (
                      <>
                        <button
                          className={`border-blue-500 flex size-4 items-center justify-center rounded-sm border-2 bg-accent-primary`}
                        >
                          <TickOutline className="h-3 w-3 text-on-color" />
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
        <Button
          variant="primary"
          type="submit"
          stretch="full"
          size="lg"
          disabled={isButtonDisabled}
          label={t("common.continue")}
        />
        <Button
          variant="ghost"
          onClick={handleSkip}
          stretch="full"
          size="lg"
          render={<button type="button" className="text-tertiary" />}
          label={t("web_ui.skip")}
        />
      </div>
    </form>
  );
});
