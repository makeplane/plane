"use client";

import React, { useMemo, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
// types
import { IUser, TUserProfile, TOnboardingSteps } from "@plane/types";
// ui
import { Button, Input, Spinner, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { PasswordStrengthMeter } from "@/components/account";
import { UserImageUploadModal } from "@/components/core";
import { OnboardingHeader, SwitchAccountDropdown } from "@/components/onboarding";
// constants
import { USER_DETAILS, E_ONBOARDING_STEP_1, E_ONBOARDING_STEP_2 } from "@/constants/event-tracker";
// helpers
import { E_PASSWORD_STRENGTH, getPasswordStrength } from "@/helpers/password.helper";
// hooks
import { useEventTracker, useUser, useUserProfile } from "@/hooks/store";
// services
// assets
import ProfileSetupDark from "@/public/onboarding/profile-setup-dark.webp";
import ProfileSetupLight from "@/public/onboarding/profile-setup-light.webp";
import UserPersonalizationDark from "@/public/onboarding/user-personalization-dark.webp";
import UserPersonalizationLight from "@/public/onboarding/user-personalization-light.webp";
import { AuthService } from "@/services/auth.service";
import { FileService } from "@/services/file.service";

type TProfileSetupFormValues = {
  first_name: string;
  last_name: string;
  avatar?: string | null;
  password?: string;
  confirm_password?: string;
  role?: string;
  use_case?: string;
};

const defaultValues: Partial<TProfileSetupFormValues> = {
  first_name: "",
  last_name: "",
  avatar: "",
  password: undefined,
  confirm_password: undefined,
  role: undefined,
  use_case: undefined,
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

const USER_ROLE = ["Individual contributor", "Senior Leader", "Manager", "Executive", "Freelancer", "Student"];

const USER_DOMAIN = [
  "Engineering",
  "Product",
  "Marketing",
  "Sales",
  "Operations",
  "Legal",
  "Finance",
  "Human Resources",
  "Project",
  "Other",
];

const fileService = new FileService();
const authService = new AuthService();

export const ProfileSetup: React.FC<Props> = observer((props) => {
  const { user, totalSteps, stepChange, finishOnboarding } = props;
  // states
  const [profileSetupStep, setProfileSetupStep] = useState<EProfileSetupSteps>(
    user?.is_password_autoset ? EProfileSetupSteps.USER_DETAILS : EProfileSetupSteps.ALL
  );
  const [isRemoving, setIsRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    retypePassword: false,
  });
  // hooks
  const { resolvedTheme } = useTheme();
  // store hooks
  const { updateCurrentUser } = useUser();
  const { updateUserProfile } = useUserProfile();
  const { captureEvent } = useEventTracker();
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
      avatar: user?.avatar,
    },
    mode: "onChange",
  });

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
      avatar: formData.avatar,
    };
    const profileUpdatePayload: Partial<TUserProfile> = {
      use_case: formData.use_case,
      role: formData.role,
    };
    try {
      await Promise.all([
        updateCurrentUser(userDetailsPayload),
        updateUserProfile(profileUpdatePayload),
        totalSteps > 2 && stepChange({ profile_complete: true }),
      ]);
      captureEvent(USER_DETAILS, {
        use_case: formData.use_case,
        role: formData.role,
        state: "SUCCESS",
        element: E_ONBOARDING_STEP_1,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Profile setup completed!",
      });
      // For Invited Users, they will skip all other steps and finish onboarding.
      if (totalSteps <= 2) {
        finishOnboarding();
      }
    } catch {
      captureEvent(USER_DETAILS, {
        state: "FAILED",
        element: E_ONBOARDING_STEP_1,
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Profile setup failed. Please try again!",
      });
    }
  };

  const handleSubmitUserDetail = async (formData: TProfileSetupFormValues) => {
    const userDetailsPayload: Partial<IUser> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar: formData.avatar,
    };
    try {
      await Promise.all([
        updateCurrentUser(userDetailsPayload),
        formData.password && handleSetPassword(formData.password),
      ]).then(() => setProfileSetupStep(EProfileSetupSteps.USER_PERSONALIZATION));
    } catch {
      captureEvent(USER_DETAILS, {
        state: "FAILED",
        element: E_ONBOARDING_STEP_1,
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "User details update failed. Please try again!",
      });
    }
  };

  const handleSubmitUserPersonalization = async (formData: TProfileSetupFormValues) => {
    const profileUpdatePayload: Partial<TUserProfile> = {
      use_case: formData.use_case,
      role: formData.role,
    };
    try {
      await Promise.all([
        updateUserProfile(profileUpdatePayload),
        totalSteps > 2 && stepChange({ profile_complete: true }),
      ]);
      captureEvent(USER_DETAILS, {
        use_case: formData.use_case,
        role: formData.role,
        state: "SUCCESS",
        element: E_ONBOARDING_STEP_2,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Profile setup completed!",
      });
      // For Invited Users, they will skip all other steps and finish onboarding.
      if (totalSteps <= 2) {
        finishOnboarding();
      }
    } catch {
      captureEvent(USER_DETAILS, {
        state: "FAILED",
        element: E_ONBOARDING_STEP_2,
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Profile setup failed. Please try again!",
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

    setIsRemoving(true);
    fileService.deleteUserFile(url).finally(() => {
      setValue("avatar", "");
      setIsRemoving(false);
    });
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

  const isCurrentStepUserPersonalization = profileSetupStep === EProfileSetupSteps.USER_PERSONALIZATION;

  return (
    <div className="flex h-full w-full">
      <div className="w-full h-full overflow-auto px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28">
        <div className="flex items-center justify-between">
          <OnboardingHeader currentStep={isCurrentStepUserPersonalization ? 2 : 1} totalSteps={totalSteps} />
          <div className="shrink-0 lg:hidden">
            <SwitchAccountDropdown fullName={`${watch("first_name")} ${watch("last_name")}`} />
          </div>
        </div>
        <div className="flex flex-col w-full items-center justify-center p-8 mt-6">
          <div className="text-center space-y-1 py-4 mx-auto">
            <h3 className="text-3xl font-bold text-onboarding-text-100">
              {isCurrentStepUserPersonalization
                ? `Looking good${user?.first_name && `, ${user.first_name}`}!`
                : "Welcome to Plane!"}
            </h3>
            <p className="font-medium text-onboarding-text-400">
              {isCurrentStepUserPersonalization
                ? "Let’s personalize Plane for you."
                : "Let’s setup your profile, tell us a bit about yourself."}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="w-full mx-auto mt-2 space-y-4 sm:w-96">
            {profileSetupStep !== EProfileSetupSteps.USER_PERSONALIZATION && (
              <>
                <Controller
                  control={control}
                  name="avatar"
                  render={({ field: { onChange, value } }) => (
                    <UserImageUploadModal
                      isOpen={isImageUploadModalOpen}
                      onClose={() => setIsImageUploadModalOpen(false)}
                      isRemoving={isRemoving}
                      handleDelete={() => handleDelete(getValues("avatar"))}
                      onSuccess={(url) => {
                        onChange(url);
                        setIsImageUploadModalOpen(false);
                      }}
                      value={value && value.trim() !== "" ? value : null}
                    />
                  )}
                />
                <div className="space-y-1 flex items-center justify-center">
                  <button type="button" onClick={() => setIsImageUploadModalOpen(true)}>
                    {!watch("avatar") || watch("avatar") === "" ? (
                      <div className="flex flex-col items-center justify-between">
                        <div className="relative h-14 w-14 overflow-hidden">
                          <div className="absolute left-0 top-0 flex items-center justify-center h-full w-full rounded-full text-white text-3xl font-medium bg-[#9747FF] uppercase">
                            {watch("first_name")[0] ?? "R"}
                          </div>
                        </div>
                        <div className="pt-1 text-sm font-medium text-custom-primary-300 hover:text-custom-primary-400">
                          Choose image
                        </div>
                      </div>
                    ) : (
                      <div className="relative mr-3 h-16 w-16 overflow-hidden">
                        <img
                          src={watch("avatar") || undefined}
                          className="absolute left-0 top-0 h-full w-full rounded-full object-cover"
                          onClick={() => setIsImageUploadModalOpen(true)}
                          alt={user?.display_name}
                        />
                      </div>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label
                      className="text-sm text-onboarding-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
                      htmlFor="first_name"
                    >
                      First name
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
                          className="w-full border-onboarding-border-100"
                          autoComplete="on"
                        />
                      )}
                    />
                    {errors.first_name && <span className="text-sm text-red-500">{errors.first_name.message}</span>}
                  </div>
                  <div className="space-y-1">
                    <label
                      className="text-sm text-onboarding-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
                      htmlFor="last_name"
                    >
                      Last name
                    </label>
                    <Controller
                      control={control}
                      name="last_name"
                      rules={{
                        required: "Last name is required",
                        maxLength: {
                          value: 24,
                          message: "Last name must be within 24 characters.",
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
                          placeholder="Wright"
                          className="w-full border-onboarding-border-100"
                          autoComplete="on"
                        />
                      )}
                    />
                    {errors.last_name && <span className="text-sm text-red-500">{errors.last_name.message}</span>}
                  </div>
                </div>

                {/* setting up password for the first time */}
                {!isPasswordAlreadySetup && (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="password">
                        Set a password (optional)
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
                              className="w-full border-[0.5px] border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
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
                      <PasswordStrengthMeter password={watch("password") ?? ""} isFocused={isPasswordInputFocused} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="confirm_password">
                        Confirm password (optional)
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
                              placeholder="Confirm password..."
                              className="w-full border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
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
                      {errors.confirm_password && (
                        <span className="text-sm text-red-500">{errors.confirm_password.message}</span>
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
                    className="text-sm text-onboarding-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
                    htmlFor="role"
                  >
                    What role are you working on? Choose one.
                  </label>
                  <Controller
                    control={control}
                    name="role"
                    rules={{
                      required: "This field is required",
                    }}
                    render={({ field: { value, onChange } }) => (
                      <div className="flex flex-wrap gap-2 py-2 overflow-auto break-all">
                        {USER_ROLE.map((userRole) => (
                          <div
                            key={userRole}
                            className={`flex-shrink-0 border-[0.5px] hover:cursor-pointer hover:bg-onboarding-background-300/30 ${
                              value === userRole ? "border-custom-primary-100" : "border-onboarding-border-100"
                            } rounded px-3 py-1.5 text-sm font-medium`}
                            onClick={() => onChange(userRole)}
                          >
                            {userRole}
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  {errors.role && <span className="text-sm text-red-500">{errors.role.message}</span>}
                </div>
                <div className="space-y-1">
                  <label
                    className="text-sm text-onboarding-text-300 font-medium after:content-['*'] after:ml-0.5 after:text-red-500"
                    htmlFor="use_case"
                  >
                    What is your domain expertise? Choose one.
                  </label>
                  <Controller
                    control={control}
                    name="use_case"
                    rules={{
                      required: "This field is required",
                    }}
                    render={({ field: { value, onChange } }) => (
                      <div className="flex flex-wrap gap-2 py-2 overflow-auto break-all">
                        {USER_DOMAIN.map((userDomain) => (
                          <div
                            key={userDomain}
                            className={`flex-shrink-0 border-[0.5px] hover:cursor-pointer hover:bg-onboarding-background-300/30 ${
                              value === userDomain ? "border-custom-primary-100" : "border-onboarding-border-100"
                            } rounded px-3 py-1.5 text-sm font-medium`}
                            onClick={() => onChange(userDomain)}
                          >
                            {userDomain}
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  {errors.use_case && <span className="text-sm text-red-500">{errors.use_case.message}</span>}
                </div>
              </>
            )}
            <Button variant="primary" type="submit" size="lg" className="w-full" disabled={isButtonDisabled}>
              {isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
            </Button>
          </form>
        </div>
      </div>
      <div className="hidden lg:block relative w-2/5 h-screen overflow-hidden px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28">
        <SwitchAccountDropdown fullName={`${watch("first_name")} ${watch("last_name")}`} />
        <div className="absolute inset-0 z-0">
          {profileSetupStep === EProfileSetupSteps.USER_PERSONALIZATION ? (
            <Image
              src={resolvedTheme === "dark" ? UserPersonalizationDark : UserPersonalizationLight}
              className="h-screen w-auto float-end object-cover"
              alt="User Personalization"
            />
          ) : (
            <Image
              src={resolvedTheme === "dark" ? ProfileSetupDark : ProfileSetupLight}
              className="h-screen w-auto float-end object-cover"
              alt="Profile setup"
            />
          )}
        </div>
      </div>
    </div>
  );
});
