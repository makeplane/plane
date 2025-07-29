"use client";

import { FC, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff, ImageIcon } from "lucide-react";
// plane imports
import { E_PASSWORD_STRENGTH, ONBOARDING_TRACKER_ELEMENTS, USER_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EOnboardingSteps, IUser } from "@plane/types";
import { Button, Input, PasswordStrengthIndicator, TOAST_TYPE, setToast } from "@plane/ui";
import { getFileURL, getPasswordStrength } from "@plane/utils";
// components
import { UserImageUploadModal } from "@/components/core/modals/user-image-upload-modal";
// helpers
import { captureError, captureView } from "@/helpers/event-tracker.helper";
// hooks
import { useUser } from "@/hooks/store";
// services
import { AuthService } from "@/services/auth.service";
// local components
import { CommonOnboardingHeader } from "../common";

type Props = {
  handleStepChange: (step: EOnboardingSteps, skipInvites?: boolean) => void;
};

export type TProfileSetupFormValues = {
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  password?: string;
  confirm_password?: string;
  role?: string;
  use_case?: string;
};

const authService = new AuthService();

const defaultValues: Partial<TProfileSetupFormValues> = {
  first_name: "",
  last_name: "",
  avatar_url: "",
  password: undefined,
  confirm_password: undefined,
};

export const ProfileSetupStep: FC<Props> = observer(({ handleStepChange }) => {
  // states
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    retypePassword: false,
  });
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { data: user, updateCurrentUser } = useUser();
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
      ]);
    } catch {
      captureError({
        eventName: USER_TRACKER_EVENTS.add_details,
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "User details update failed. Please try again!",
      });
    }
  };

  const onSubmit = async (formData: TProfileSetupFormValues) => {
    if (!user) return;
    captureView({
      elementName: ONBOARDING_TRACKER_ELEMENTS.PROFILE_SETUP_FORM,
    });
    await handleSubmitUserDetail(formData).then(() => {
      handleStepChange(EOnboardingSteps.PROFILE_SETUP);
    });
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">
      {/* Header */}
      <CommonOnboardingHeader title="Create your profile." description="This is how you will appear in Plane." />

      {/* Profile Picture Section */}
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
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-full bg-green-700 flex items-center justify-center text-white font-semibold text-xl">
          {userAvatar ? (
            <img
              src={getFileURL(userAvatar ?? "")}
              onClick={() => setIsImageUploadModalOpen(true)}
              alt={user?.display_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <>{watch("first_name")[0] ?? "R"}</>
          )}
        </div>
        <input type="file" className="hidden" id="profile-image-input" />
        <button
          className="flex items-center gap-1.5 text-custom-text-300 hover:text-custom-text-200 text-sm px-2 py-1"
          type="button"
          onClick={() => setIsImageUploadModalOpen(true)}
        >
          <ImageIcon className="size-4" />
          <span className="text-sm">Add an image</span>
        </button>
      </div>

      {/* Name Input */}
      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-custom-text-300 after:content-['*'] after:ml-0.5 after:text-red-500"
          htmlFor="first_name"
        >
          Name
        </label>
        <Controller
          control={control}
          name="first_name"
          rules={{
            required: "First name is required",
            maxLength: {
              value: 24,
              message: "First name must be within 24 characters.",
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
              placeholder="Wilbur"
              className="w-full border-custom-border-300"
              autoComplete="on"
            />
          )}
        />
        {errors.first_name && <span className="text-sm text-red-500">{errors.first_name.message}</span>}
      </div>

      {/* setting up password for the first time */}
      {!isPasswordAlreadySetup && (
        <>
          <div className="space-y-1">
            <label className="text-sm text-custom-text-300 font-medium" htmlFor="password">
              Set a password ({t("common.optional")})
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
                    placeholder="New password..."
                    className="w-full border-[0.5px] border-custom-border-300 pr-12 placeholder:text-custom-text-400"
                    onFocus={() => setIsPasswordInputFocused(true)}
                    onBlur={() => setIsPasswordInputFocused(false)}
                    autoComplete="on"
                  />
                  {showPassword.password ? (
                    <EyeOff
                      className="absolute right-3 h-4 w-4 stroke-custom-text-400 hover:cursor-pointer"
                      onClick={() => handleShowPassword("password")}
                    />
                  ) : (
                    <Eye
                      className="absolute right-3 h-4 w-4 stroke-custom-text-400 hover:cursor-pointer"
                      onClick={() => handleShowPassword("password")}
                    />
                  )}
                </div>
              )}
            />
            <PasswordStrengthIndicator password={watch("password") ?? ""} isFocused={isPasswordInputFocused} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-custom-text-300 font-medium" htmlFor="confirm_password">
              {t("auth.common.password.confirm_password.label")} ({t("common.optional")})
            </label>
            <Controller
              control={control}
              name="confirm_password"
              rules={{
                required: watch("password") ? true : false,
                validate: (value) =>
                  watch("password") ? (value === watch("password") ? true : "Passwords don't match") : true,
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
                    className="w-full border-custom-border-300 pr-12 placeholder:text-custom-text-400"
                  />
                  {showPassword.retypePassword ? (
                    <EyeOff
                      className="absolute right-3 h-4 w-4 stroke-custom-text-400 hover:cursor-pointer"
                      onClick={() => handleShowPassword("retypePassword")}
                    />
                  ) : (
                    <Eye
                      className="absolute right-3 h-4 w-4 stroke-custom-text-400 hover:cursor-pointer"
                      onClick={() => handleShowPassword("retypePassword")}
                    />
                  )}
                </div>
              )}
            />
            {errors.confirm_password && <span className="text-sm text-red-500">{errors.confirm_password.message}</span>}
          </div>
        </>
      )}

      {/* Continue Button */}
      <Button variant="primary" type="submit" className="w-full" size="lg" disabled={isButtonDisabled}>
        Continue
      </Button>

      {/* TODO: To be added later */}
      {/* Marketing Consent */}
      {/* <MarketingConsent isChecked={formData.marketingConsent} handleChange={handleMarketingConsentChange} /> */}
    </form>
  );
});
