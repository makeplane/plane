import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { ImageIcon } from "lucide-react";
// plane imports
import { E_PASSWORD_STRENGTH } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUser } from "@plane/types";
import { EOnboardingSteps } from "@plane/types";
import { cn, getFileURL, getPasswordStrength } from "@plane/utils";
// components
import { UserImageUploadModal } from "@/components/core/modals/user-image-upload-modal";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useUser, useUserProfile } from "@/hooks/store/user";
// services
import { AuthService } from "@/services/auth.service";
// local components
import { CommonOnboardingHeader } from "../common";
import { MarketingConsent } from "./consent";
import { SetPasswordRoot } from "./set-password";

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
  use_case?: string[];
  has_marketing_email_consent?: boolean;
};

const authService = new AuthService();

const defaultValues: Partial<TProfileSetupFormValues> = {
  first_name: "",
  last_name: "",
  avatar_url: "",
  password: undefined,
  confirm_password: undefined,
  has_marketing_email_consent: true,
};

export const ProfileSetupStep = observer(function ProfileSetupStep({ handleStepChange }: Props) {
  // states
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  // store hooks
  const { data: user, updateCurrentUser } = useUser();
  const { updateUserProfile } = useUserProfile();
  const { config: instanceConfig } = useInstance();
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
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "User details update failed. Please try again!",
      });
    }
  };

  const onSubmit = async (formData: TProfileSetupFormValues) => {
    if (!user) return;
    updateUserProfile({
      has_marketing_email_consent: formData.has_marketing_email_consent,
    });
    await handleSubmitUserDetail(formData);
    handleStepChange(EOnboardingSteps.PROFILE_SETUP);
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
        <button
          className="size-12 rounded-full bg-accent-primary flex items-center justify-center text-on-color font-semibold text-18"
          type="button"
          onClick={() => setIsImageUploadModalOpen(true)}
        >
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
        </button>
        <input type="file" className="hidden" id="profile-image-input" />
        <button
          className="flex items-center gap-1.5 text-tertiary hover:text-secondary text-13 px-2 py-1"
          type="button"
          onClick={() => setIsImageUploadModalOpen(true)}
        >
          <ImageIcon className="size-4" />
          <span className="text-13">{userAvatar ? "Change image" : "Upload image"}</span>
        </button>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Name Input */}
        <div className="flex flex-col gap-2">
          <label
            className="block text-13 font-medium text-tertiary after:content-['*'] after:ml-0.5 after:text-danger-primary"
            htmlFor="first_name"
          >
            Name
          </label>
          <Controller
            control={control}
            name="first_name"
            rules={{
              required: "Name is required",
              maxLength: {
                value: 24,
                message: "Name must be within 24 characters.",
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <input
                ref={ref}
                id="first_name"
                name="first_name"
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoFocus
                className={cn(
                  "w-full px-3 py-2 text-secondary border border-strong rounded-md bg-surface-1 focus:outline-none focus:ring-2 focus:ring-accent-strong placeholder:text-placeholder focus:border-transparent transition-all duration-200",
                  {
                    "border-strong": !errors.first_name,
                    "border-danger-strong": errors.first_name,
                  }
                )}
                placeholder="Enter your full name"
                autoComplete="on"
              />
            )}
          />
          {errors.first_name && <span className="text-13 text-danger-primary">{errors.first_name.message}</span>}
        </div>

        {/* setting up password for the first time */}
        {!isPasswordAlreadySetup && (
          <SetPasswordRoot
            onPasswordChange={(password) => setValue("password", password)}
            onConfirmPasswordChange={(confirm_password) => setValue("confirm_password", confirm_password)}
          />
        )}
      </div>
      {/* Continue Button */}
      <Button variant="primary" type="submit" className="w-full" size="xl" disabled={isButtonDisabled}>
        Continue
      </Button>

      {/* Marketing Consent */}
      {!instanceConfig?.is_self_managed && (
        <MarketingConsent
          isChecked={!!watch("has_marketing_email_consent")}
          handleChange={(has_marketing_email_consent) =>
            setValue("has_marketing_email_consent", has_marketing_email_consent)
          }
        />
      )}
    </form>
  );
});
