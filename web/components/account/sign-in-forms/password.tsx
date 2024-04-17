import React, { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { Eye, EyeOff, XCircle } from "lucide-react";
// ui
import { Button, Input, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ESignInSteps, ForgotPasswordPopover } from "@/components/account";
// constants
import { FORGOT_PASSWORD } from "@/constants/event-tracker";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
import { checkEmailValidity } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useInstance } from "@/hooks/store";
// services
import { AuthService } from "@/services/auth.service";

type Props = {
  email: string;
  handleStepChange: (step: ESignInSteps) => void;
  handleEmailClear: () => void;
  onSubmit: () => Promise<void>;
};

type TPasswordFormValues = {
  email: string;
  password: string;
};

const defaultValues: TPasswordFormValues = {
  email: "",
  password: "",
};

const authService = new AuthService();

export const SignInPasswordForm: React.FC<Props> = observer((props) => {
  const { email, handleStepChange, handleEmailClear } = props;
  // states
  const [passwordFormData, setPasswordFormData] = useState<TPasswordFormValues>({ ...defaultValues, email });
  const [isSendingUniqueCode, setIsSendingUniqueCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { instance } = useInstance();
  const { captureEvent } = useEventTracker();
  // derived values
  const isSmtpConfigured = instance?.config?.is_smtp_configured;

  // const handleFormSubmit = async (formData: TPasswordFormValues) => {
  //   const payload: IPasswordSignInData = {
  //     email: formData.email,
  //     password: formData.password,
  //   };

  //   await authService
  //     .passwordSignIn(payload)
  //     .then(async () => {
  //       captureEvent(SIGN_IN_WITH_PASSWORD, {
  //         state: "SUCCESS",
  //         first_time: false,
  //       });
  //       await onSubmit();
  //     })
  //     .catch((err) =>
  //       setToast({
  //         type: TOAST_TYPE.ERROR,
  //         title: "Error!",
  //         message: err?.error ?? "Something went wrong. Please try again.",
  //       })
  //     );
  // };

  const handleFormChange = (key: keyof TPasswordFormValues, value: string) =>
    setPasswordFormData((prev) => ({ ...prev, [key]: value }));

  const handleSendUniqueCode = async () => {
    const emailFormValue = passwordFormData.password;

    const isEmailValid = checkEmailValidity(emailFormValue);

    if (!isEmailValid) {
      // TODO: Handle Error
      // setError("email", { message: "Email is invalid" });
      return;
    }

    setIsSendingUniqueCode(true);

    await authService
      .generateUniqueCode({ email: emailFormValue })
      .then(() => handleStepChange(ESignInSteps.USE_UNIQUE_CODE_FROM_PASSWORD))
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsSendingUniqueCode(false));
  };

  return (
    <>
      <div className="text-center space-y-1 py-4 mx-auto sm:w-96">
        <h3 className="text-3xl font-bold text-onboarding-text-100">Sign in to Plane</h3>
        <p className="font-medium text-onboarding-text-400">Get back to your projects and make progress</p>
      </div>
      <form
        className="mx-auto mt-5 space-y-4 sm:w-96"
        method="POST"
        action={`${API_BASE_URL}/api/instances/admins/sign-up/`}
      >
        <div className="space-y-1">
          <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center rounded-md bg-onboarding-background-200">
            <Input
              id="email"
              name="email"
              type="email"
              value={passwordFormData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              // hasError={Boolean(errors.email)}
              placeholder="name@company.com"
              className="h-[46px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
              disabled
            />
            {passwordFormData.email.length > 0 && (
              <XCircle
                className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                onClick={handleEmailClear}
              />
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="password">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center rounded-md bg-onboarding-background-200">
            <Input
              type={showPassword ? "text" : "password"}
              value={passwordFormData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              // hasError={Boolean(errors.password)}
              placeholder="Enter password"
              className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
              autoFocus
            />
            {showPassword ? (
              <EyeOff
                className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <Eye
                className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>
          <div className="mt-2 w-full pb-3">
            {isSmtpConfigured ? (
              <Link
                onClick={() => captureEvent(FORGOT_PASSWORD)}
                href={`/accounts/forgot-password?email=${email}`}
                className="text-xs font-medium text-custom-primary-100"
              >
                Forgot your password?
              </Link>
            ) : (
              <ForgotPasswordPopover />
            )}
          </div>
        </div>
        <div className="space-y-2.5">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="lg"
            // disabled={!isValid}
            // loading={isSubmitting}
          >
            {isSmtpConfigured ? "Continue" : "Go to workspace"}
          </Button>
          {instance && isSmtpConfigured && (
            <Button
              type="button"
              onClick={handleSendUniqueCode}
              variant="outline-primary"
              className="w-full"
              size="lg"
              loading={isSendingUniqueCode}
            >
              {isSendingUniqueCode ? "Sending code" : "Sign in with unique code"}
            </Button>
          )}
        </div>
      </form>
    </>
  );
});
