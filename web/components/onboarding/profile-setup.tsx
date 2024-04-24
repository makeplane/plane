import React, { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff, Sparkles } from "lucide-react";
// types
import { IUser, TUserProfile, TOnboardingSteps } from "@plane/types";
// ui
import { Button, Input } from "@plane/ui";
// components
import { PasswordStrengthMeter } from "@/components/account";
import { UserImageUploadModal } from "@/components/core";
import { OnboardingHeader, SwitchOrDeleteAccountDropdown } from "@/components/onboarding";
// constants
import { USER_DETAILS } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useUser, useUserProfile } from "@/hooks/store";
// services
import { AuthService } from "@/services/auth.service";
import { FileService } from "@/services/file.service";
// assets
import profileSetup from "public/onboarding/profile-setup.png";

type TProfileSetupFormValues = {
  first_name: string;
  last_name: string;
  avatar?: string | null;
  password?: string;
  use_case?: string;
};

const defaultValues: Partial<TProfileSetupFormValues> = {
  first_name: "",
  last_name: "",
  avatar: "",
  password: undefined,
  use_case: undefined,
};

type Props = {
  user?: IUser;
  totalSteps: number;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  finishOnboarding: () => Promise<void>;
};

const USE_CASES = [
  "Build Products",
  "Manage Feedbacks",
  "Service delivery",
  "Field force management",
  "Code Repository Integration",
  "Bug Tracking",
  "Test Case Management",
  "Resource allocation",
];

const fileService = new FileService();
const authService = new AuthService();

export const ProfileSetup: React.FC<Props> = observer((props) => {
  const { user, totalSteps, stepChange, finishOnboarding } = props;
  // states
  const [isRemoving, setIsRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleUserDetailUpdate = async (data: Partial<IUser>) => {
    await updateCurrentUser(data);
  };

  const handleUserProfileUpdate = async (data: Partial<TUserProfile>) => {
    await updateUserProfile(data);
  };

  const handleSetPassword = async (password: string) => {
    await authService.setPassword({ password });
  };

  const onSubmit = async (formData: TProfileSetupFormValues) => {
    if (!user) return;

    const userDetailsPayload: Partial<IUser> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      avatar: formData.avatar,
    };

    const profileUpdatePayload: Partial<TUserProfile> = {
      use_case: formData.use_case,
    };

    try {
      await handleUserDetailUpdate(userDetailsPayload);
      await handleUserProfileUpdate(profileUpdatePayload);
      if (formData.password) {
        await handleSetPassword(formData.password);
      }
      await stepChange({ profile_complete: true }).then(() => {
        captureEvent(USER_DETAILS, {
          state: "SUCCESS",
          element: "Onboarding",
        });
        if (totalSteps === 1) {
          finishOnboarding();
        }
      });
    } catch {
      captureEvent(USER_DETAILS, {
        state: "FAILED",
        element: "Onboarding",
      });
    }
  };

  const handleDelete = (url: string | null | undefined) => {
    if (!url) return;

    setIsRemoving(true);
    fileService.deleteUserFile(url).finally(() => {
      setValue("avatar", "");
      setIsRemoving(false);
    });
  };

  const isPasswordAlreadySetup = !user?.is_password_autoset;
  const isSignUpUsingMagicCode = user?.last_login_medium === "magic-code";

  return (
    <div className="flex h-full w-full">
      <div className="w-full lg:w-3/5 h-full overflow-auto px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28">
        <div className="flex items-center justify-between">
          <OnboardingHeader currentStep={1} totalSteps={totalSteps} />
          <div className="shrink-0 lg:hidden">
            <SwitchOrDeleteAccountDropdown fullName={`${watch("first_name")} ${watch("last_name")}`} />
          </div>
        </div>
        <div className="flex flex-col w-full items-center justify-center p-8 mt-6">
          <div className="text-center space-y-1 py-4 mx-auto">
            <h3 className="text-3xl font-bold text-onboarding-text-100">Welcome to Plane!</h3>
            <p className="font-medium text-onboarding-text-400">
              Let’s setup your profile, tell us a bit about yourself.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="w-full mx-auto mt-2 space-y-4 sm:w-96">
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
            <div className="flex gap-4">
              <div className="space-y-1">
                <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="first_name">
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
                      placeholder="RWilbur"
                      className="w-full border-onboarding-border-100 focus:border-custom-primary-100"
                    />
                  )}
                />
                {errors.first_name && <span className="text-sm text-red-500">{errors.first_name.message}</span>}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="last_name">
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
                      className="w-full border-onboarding-border-100 focus:border-custom-primary-100"
                    />
                  )}
                />
                {errors.last_name && <span className="text-sm text-red-500">{errors.last_name.message}</span>}
              </div>
            </div>
            {!isPasswordAlreadySetup && (
              <div className="space-y-1">
                <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="password">
                  Set a password{" "}
                  {!isSignUpUsingMagicCode && <span className="text-onboarding-text-400">(optional)</span>}
                </label>
                <Controller
                  control={control}
                  name="password"
                  rules={{
                    required: isSignUpUsingMagicCode ? "Password is required" : false,
                  }}
                  render={({ field: { value, onChange, ref } }) => (
                    <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        hasError={Boolean(errors.password)}
                        placeholder="New password..."
                        className="w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                        onFocus={() => setIsPasswordInputFocused(true)}
                        onBlur={() => setIsPasswordInputFocused(false)}
                      />
                      {showPassword ? (
                        <EyeOff
                          className="absolute right-3 h-4 w-4 stroke-custom-text-400 hover:cursor-pointer"
                          onClick={() => setShowPassword(false)}
                        />
                      ) : (
                        <Eye
                          className="absolute right-3 h-4 w-4 stroke-custom-text-400 hover:cursor-pointer"
                          onClick={() => setShowPassword(true)}
                        />
                      )}
                    </div>
                  )}
                />
                {isPasswordInputFocused && <PasswordStrengthMeter password={watch("password") ?? ""} />}
                {errors.password && <span className="text-sm text-red-500">{errors.password.message}</span>}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="use_case">
                How will you use Plane? Choose one.
              </label>
              <Controller
                control={control}
                name="use_case"
                rules={{
                  required: "This field is required",
                }}
                render={({ field: { value, onChange } }) => (
                  <div className="flex flex-wrap gap-2 py-2 overflow-auto break-all">
                    {USE_CASES.map((useCase) => (
                      <div
                        key={useCase}
                        className={`flex-shrink-0 border-[0.5px] hover:cursor-pointer hover:bg-onboarding-background-300/30 ${
                          value === useCase ? "border-custom-primary-100" : "border-onboarding-border-100"
                        } rounded px-3 py-1.5 text-sm font-medium`}
                        onClick={() => onChange(useCase)}
                      >
                        {useCase}
                      </div>
                    ))}
                  </div>
                )}
              />
              {errors.use_case && <span className="text-sm text-red-500">{errors.use_case.message}</span>}
            </div>
            <Button
              variant="primary"
              type="submit"
              size="lg"
              className="w-full"
              disabled={!isValid}
              loading={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Continue"}
            </Button>
          </form>
        </div>
      </div>
      <div className="hidden lg:block relative w-2/5 px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28 bg-onboarding-gradient-100">
        <SwitchOrDeleteAccountDropdown fullName={`${watch("first_name")} ${watch("last_name")}`} />
        <div className="absolute right-0 bottom-0 flex flex-col items-start justify-end w-3/4 ">
          <div className="flex gap-2 pb-1 pr-2 text-base text-custom-primary-300 font-medium w-3/4 self-end">
            <Sparkles className="h-6 w-6" />
            Let your team assign, mention and discuss how your work is progressing.
          </div>
          <Image src={profileSetup} alt="profile-setup" />
        </div>
      </div>
    </div>
  );
});
