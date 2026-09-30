/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { E_PASSWORD_STRENGTH } from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUser, TUserProfile, TOnboardingSteps } from "@plane/types";
// ui
import { Input, PasswordStrengthIndicator, Spinner } from "@plane/ui";
// components
import { cn, getFileURL, getPasswordStrength, validatePersonName } from "@plane/utils";
import { UserImageUploadModal } from "@/components/core/modals/user-image-upload-modal";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";
// services
import { AuthService } from "@/services/auth.service";

type TProfileSetupFormValues = {
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  password?: string;
  confirm_password?: string;
  role?: string;
  use_case?: string[];
};

const defaultValues: Partial<TProfileSetupFormValues> = {
  first_name: "",
  last_name: "",
  avatar_url: "",
  password: undefined,
  confirm_password: undefined,
  role: undefined,
  use_case: [],
};

type Props = {
  user?: IUser;
  totalSteps: number;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  finishOnboarding: () => Promise<void>;
};

enum EProfileSetupSteps {
  ALL = "ALL",
  USER_DETAILS = "USER_DETAILS",
  USER_PERSONALIZATION = "USER_PERSONALIZATION",
}

const USER_ROLE = [
  { value: "Individual contributor", labelKey: "onboarding.profile.seniority_levels.individual_contributor" },
  { value: "Senior Leader", labelKey: "onboarding.profile.seniority_levels.senior_leader" },
  { value: "Manager", labelKey: "onboarding.profile.seniority_levels.manager" },
  { value: "Executive", labelKey: "onboarding.profile.seniority_levels.executive" },
  { value: "Freelancer", labelKey: "onboarding.profile.seniority_levels.freelancer" },
  { value: "Student", labelKey: "onboarding.profile.seniority_levels.student" },
];

const USER_DOMAIN = [
  { value: "Engineering", labelKey: "onboarding.profile.domains.engineering" },
  { value: "Product", labelKey: "onboarding.profile.domains.product" },
  { value: "Marketing", labelKey: "onboarding.profile.domains.marketing" },
  { value: "Sales", labelKey: "onboarding.profile.domains.sales" },
  { value: "Operations", labelKey: "onboarding.profile.domains.operations" },
  { value: "Legal", labelKey: "onboarding.profile.domains.legal" },
  { value: "Finance", labelKey: "onboarding.profile.domains.finance" },
  { value: "Human Resources", labelKey: "onboarding.profile.domains.human_resources" },
  { value: "Project", labelKey: "onboarding.profile.domains.project" },
  { value: "Other", labelKey: "onboarding.profile.domains.other" },
];

const authService = new AuthService();

export const ProfileSetup = observer(function ProfileSetup(props: Props) {
  const { user, totalSteps, stepChange, finishOnboarding } = props;
  // states
  const [profileSetupStep, setProfileSetupStep] = useState<EProfileSetupSteps>(
    user?.is_password_autoset ? EProfileSetupSteps.USER_DETAILS : EProfileSetupSteps.ALL
  );
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    retypePassword: false,
  });
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { updateCurrentUser } = useUser();
  const { updateUserProfile } = useUserProfile();
  // form info
  const {
    getValues,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TProfileSetupFormValues>({
    defaultValues: {
      ...defaultValues,
      first_name: user?.first_name,
      last_name: user?.last_name,
      avatar_url: user?.avatar_url,
    },
    mode: "onChange",
  });
  // derived values
  const userAvatar = watch("avatar_url");

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSetPassword = async (password: string) => {
    const token = await authService.requestCSRFToken().then((data) => data?.csrf_token);
    await authService.setPassword(token, { password });
  };

  const handleSubmitProfileSetup = async (formData: TProfileSetupFormValues) => {
    const userDetailsPayload: Partial<IUser> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar_url: formData.avatar_url ?? undefined,
    };
    const profileUpdatePayload: Partial<TUserProfile> = {
      use_case: formData.use_case && formData.use_case.length > 0 ? formData.use_case.join(". ") : undefined,
      role: formData.role,
    };
    try {
      await Promise.all([
        updateCurrentUser(userDetailsPayload),
        updateUserProfile(profileUpdatePayload),
        totalSteps > 2 && stepChange({ profile_complete: true }),
      ]);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("onboarding.profile.toast.profile_setup_completed"),
      });
      // For Invited Users, they will skip all other steps and finish onboarding.
      if (totalSteps <= 2) {
        finishOnboarding();
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("onboarding.profile.toast.profile_setup_failed"),
      });
    }
  };

  const handleSubmitUserDetail = async (formData: TProfileSetupFormValues) => {
    const userDetailsPayload: Partial<IUser> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar_url: formData.avatar_url ?? undefined,
    };
    try {
      await Promise.all([
        updateCurrentUser(userDetailsPayload),
        formData.password && handleSetPassword(formData.password),
      ]).then(() => {
        if (formData.password) {
        } else {
          setProfileSetupStep(EProfileSetupSteps.USER_PERSONALIZATION);
        }
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("onboarding.profile.toast.user_details_update_failed"),
      });
    }
  };

  const handleSubmitUserPersonalization = async (formData: TProfileSetupFormValues) => {
    const profileUpdatePayload: Partial<TUserProfile> = {
      use_case: formData.use_case && formData.use_case.length > 0 ? formData.use_case.join(". ") : undefined,
      role: formData.role,
    };
    try {
      await Promise.all([
        updateUserProfile(profileUpdatePayload),
        totalSteps > 2 && stepChange({ profile_complete: true }),
      ]);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("onboarding.profile.toast.profile_setup_completed"),
      });
      // For Invited Users, they will skip all other steps and finish onboarding.
      if (totalSteps <= 2) {
        finishOnboarding();
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("onboarding.profile.toast.profile_setup_failed"),
      });
    }
  };

  const onSubmit = async (formData: TProfileSetupFormValues) => {
    if (!user) return;
    if (profileSetupStep === EProfileSetupSteps.ALL) await handleSubmitProfileSetup(formData);
    if (profileSetupStep === EProfileSetupSteps.USER_DETAILS) await handleSubmitUserDetail(formData);
    if (profileSetupStep === EProfileSetupSteps.USER_PERSONALIZATION) await handleSubmitUserPersonalization(formData);
  };

  const handleDelete = (url: string | null | undefined) => {
    if (!url) return;
    setValue("avatar_url", "");
  };

  // derived values
  const isPasswordAlreadySetup = !user?.is_password_autoset;
  const currentPassword = watch("password") || undefined;
  const currentConfirmPassword = watch("confirm_password") || undefined;

  const isValidPassword = useMemo(() => {
    if (currentPassword) {
      if (
        currentPassword === currentConfirmPassword &&
        getPasswordStrength(currentPassword) === E_PASSWORD_STRENGTH.STRENGTH_VALID
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }, [currentPassword, currentConfirmPassword]);

  // Check for all available fields validation and if password field is available, then checks for password validation (strength + confirmation).
  // Also handles the condition for optional password i.e if password field is optional it only checks for above validation if it's not empty.
  const isButtonDisabled =
    !isSubmitting && isValid ? (isPasswordAlreadySetup ? false : isValidPassword ? false : true) : true;

  return (
    <div className="flex h-full w-full">
      <div className="mt-6 flex w-full flex-col items-center justify-center p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="mx-auto mt-2 w-full space-y-4 sm:w-96">
          {profileSetupStep !== EProfileSetupSteps.USER_PERSONALIZATION && (
            <>
              <Controller
                control={control}
                name="avatar_url"
                render={({ field: { onChange, value } }) => (
                  <UserImageUploadModal
                    isOpen={isImageUploadModalOpen}
                    onClose={() => setIsImageUploadModalOpen(false)}
                    handleRemove={async () => handleDelete(getValues("avatar_url"))}
                    onSuccess={(url) => {
                      onChange(url);
                      setIsImageUploadModalOpen(false);
                    }}
                    value={value && value.trim() !== "" ? value : null}
                  />
                )}
              />
              <div className="flex items-center justify-center space-y-1">
                <button type="button" onClick={() => setIsImageUploadModalOpen(true)}>
                  {!userAvatar || userAvatar === "" ? (
                    <div className="flex flex-col items-center justify-between">
                      <div className="relative h-14 w-14 overflow-hidden">
                        <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center rounded-full bg-accent-primary text-24 font-medium text-on-color uppercase">
                          {watch("first_name")[0] ?? "R"}
                        </div>
                      </div>
                      <div className="pt-1 text-13 font-medium text-accent-secondary hover:text-tertiary">
                        {t("onboarding.profile.choose_image")}
                      </div>
                    </div>
                  ) : (
                    <div className="relative mr-3 h-16 w-16 overflow-hidden">
                      <img
                        src={getFileURL(userAvatar ?? "")}
                        className="absolute top-0 left-0 h-full w-full rounded-full object-cover"
                        onClick={() => setIsImageUploadModalOpen(true)}
                        alt={user?.display_name}
                      />
                    </div>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    className="text-13 font-medium text-tertiary after:ml-0.5 after:text-danger-primary after:content-['*']"
                    htmlFor="first_name"
                  >
                    {t("first_name")}
                  </label>
                  <Controller
                    control={control}
                    name="first_name"
                    rules={{
                      required: t("onboarding.profile.first_name_required"),
                      validate: validatePersonName,
                      maxLength: {
                        value: 50,
                        message: t("onboarding.profile.first_name_max_length"),
                      },
                    }}
                    render={({ field: { value, onChange, ref } }) => (
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={value}
                        autoFocus
                        onChange={onChange}
                        ref={ref}
                        hasError={Boolean(errors.first_name)}
                        placeholder={t("onboarding.profile.first_name_placeholder")}
                        className="w-full border-strong"
                        autoComplete="on"
                      />
                    )}
                  />
                  {errors.first_name && (
                    <span className="text-13 text-danger-primary">{errors.first_name.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label
                    className="text-13 font-medium text-tertiary after:ml-0.5 after:text-danger-primary after:content-['*']"
                    htmlFor="last_name"
                  >
                    {t("last_name")}
                  </label>
                  <Controller
                    control={control}
                    name="last_name"
                    rules={{
                      required: t("onboarding.profile.last_name_required"),
                      validate: validatePersonName,
                      maxLength: {
                        value: 50,
                        message: t("onboarding.profile.last_name_max_length"),
                      },
                    }}
                    render={({ field: { value, onChange, ref } }) => (
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        hasError={Boolean(errors.last_name)}
                        placeholder={t("onboarding.profile.last_name_placeholder")}
                        className="w-full border-strong"
                        autoComplete="on"
                      />
                    )}
                  />
                  {errors.last_name && <span className="text-13 text-danger-primary">{errors.last_name.message}</span>}
                </div>
              </div>

              {/* setting up password for the first time */}
              {!isPasswordAlreadySetup && (
                <>
                  <div className="space-y-1">
                    <label className="text-13 font-medium text-tertiary" htmlFor="password">
                      {t("auth.common.password.set_password")} ({t("common.optional")})
                    </label>
                    <Controller
                      control={control}
                      name="password"
                      rules={{
                        required: false,
                      }}
                      render={({ field: { value, onChange, ref } }) => (
                        <div className="relative flex items-center rounded-md">
                          <Input
                            type={showPassword.password ? "text" : "password"}
                            name="password"
                            value={value}
                            onChange={onChange}
                            ref={ref}
                            hasError={Boolean(errors.password)}
                            placeholder={t("onboarding.profile.new_password_placeholder")}
                            className="w-full border-[0.5px] border-subtle pr-12 placeholder:text-placeholder"
                            onFocus={() => setIsPasswordInputFocused(true)}
                            onBlur={() => setIsPasswordInputFocused(false)}
                            autoComplete="new-password"
                          />
                          {showPassword.password ? (
                            <EyeOff
                              className="absolute right-3 h-4 w-4 stroke-placeholder hover:cursor-pointer"
                              onClick={() => handleShowPassword("password")}
                            />
                          ) : (
                            <Eye
                              className="absolute right-3 h-4 w-4 stroke-placeholder hover:cursor-pointer"
                              onClick={() => handleShowPassword("password")}
                            />
                          )}
                        </div>
                      )}
                    />
                    <PasswordStrengthIndicator password={watch("password") ?? ""} isFocused={isPasswordInputFocused} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-13 font-medium text-tertiary" htmlFor="confirm_password">
                      {t("auth.common.password.confirm_password.label")} ({t("common.optional")})
                    </label>
                    <Controller
                      control={control}
                      name="confirm_password"
                      rules={{
                        required: watch("password") ? true : false,
                        validate: (value) =>
                          watch("password")
                            ? value === watch("password")
                              ? true
                              : t("auth.common.password.errors.match")
                            : true,
                      }}
                      render={({ field: { value, onChange, ref } }) => (
                        <div className="relative flex items-center rounded-md">
                          <Input
                            type={showPassword.retypePassword ? "text" : "password"}
                            name="confirm_password"
                            value={value}
                            onChange={onChange}
                            ref={ref}
                            hasError={Boolean(errors.confirm_password)}
                            placeholder={t("auth.common.password.confirm_password.placeholder")}
                            className="w-full border-subtle pr-12 placeholder:text-placeholder"
                            autoComplete="new-password"
                          />
                          {showPassword.retypePassword ? (
                            <EyeOff
                              className="absolute right-3 h-4 w-4 stroke-placeholder hover:cursor-pointer"
                              onClick={() => handleShowPassword("retypePassword")}
                            />
                          ) : (
                            <Eye
                              className="absolute right-3 h-4 w-4 stroke-placeholder hover:cursor-pointer"
                              onClick={() => handleShowPassword("retypePassword")}
                            />
                          )}
                        </div>
                      )}
                    />
                    {errors.confirm_password && (
                      <span className="text-13 text-danger-primary">{errors.confirm_password.message}</span>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* user role once the password is set */}
          {profileSetupStep !== EProfileSetupSteps.USER_DETAILS && (
            <>
              <div className="space-y-1">
                <label
                  className="text-13 font-medium text-tertiary after:ml-0.5 after:text-danger-primary after:content-['*']"
                  htmlFor="role"
                >
                  {t("onboarding.profile.role_question")}
                </label>
                <Controller
                  control={control}
                  name="role"
                  rules={{
                    required: t("common.errors.required"),
                  }}
                  render={({ field: { value, onChange } }) => (
                    <div className="flex flex-wrap gap-2 overflow-auto py-2 break-all">
                      {USER_ROLE.map((userRole) => (
                        <div
                          key={userRole.value}
                          className={cn(
                            "shrink-0 rounded border-[0.5px] px-3 py-1.5 text-13 font-medium hover:cursor-pointer hover:bg-surface-2",
                            {
                              "border-accent-strong": value === userRole.value,
                              "border-strong": value !== userRole.value,
                            }
                          )}
                          onClick={() => onChange(userRole.value)}
                        >
                          {t(userRole.labelKey)}
                        </div>
                      ))}
                    </div>
                  )}
                />
                {errors.role && <span className="text-13 text-danger-primary">{errors.role.message}</span>}
              </div>
              <div className="space-y-1">
                <label
                  className="text-13 font-medium text-tertiary after:ml-0.5 after:text-danger-primary after:content-['*']"
                  htmlFor="use_case"
                >
                  {t("onboarding.profile.domain_question")}
                </label>
                <Controller
                  control={control}
                  name="use_case"
                  rules={{
                    required: t("onboarding.usecase.select_at_least_one"),
                    validate: (value) => (value && value.length > 0) || t("onboarding.usecase.select_at_least_one"),
                  }}
                  render={({ field: { value, onChange } }) => (
                    <div className="flex flex-wrap gap-2 overflow-auto py-2 break-all">
                      {USER_DOMAIN.map((userDomain) => {
                        const isSelected = value?.includes(userDomain.value) || false;
                        return (
                          <div
                            key={userDomain.value}
                            className={`flex-shrink-0 border-[0.5px] hover:cursor-pointer hover:bg-surface-2 ${
                              isSelected ? "border-accent-strong" : "border-strong"
                            } rounded px-3 py-1.5 text-13 font-medium`}
                            onClick={() => {
                              const currentValue = value || [];
                              if (isSelected) {
                                onChange(currentValue.filter((item) => item !== userDomain.value));
                              } else {
                                onChange([...currentValue, userDomain.value]);
                              }
                            }}
                          >
                            {t(userDomain.labelKey)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.use_case && <span className="text-13 text-danger-primary">{errors.use_case.message}</span>}
              </div>
            </>
          )}
          <Button variant="primary" type="submit" size="xl" className="w-full" disabled={isButtonDisabled}>
            {isSubmitting ? <Spinner height="20px" width="20px" /> : t("common.continue")}
          </Button>
        </form>
      </div>
    </div>
  );
});
