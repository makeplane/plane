import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { Eye, EyeOff, XCircle } from "lucide-react";
// ui
import { Button, Input, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EAuthModes, EAuthSteps, ForgotPasswordPopover, PasswordStrengthMeter } from "@/components/account";
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
  mode: EAuthModes;
  handleStepChange: (step: EAuthSteps) => void;
  handleEmailClear: () => void;
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

export const AuthPasswordForm: React.FC<Props> = observer((props: Props) => {
  const { email, handleStepChange, handleEmailClear, mode } = props;
  // states
  const [passwordFormData, setPasswordFormData] = useState<TPasswordFormValues>({ ...defaultValues, email });
  const [isSendingUniqueCode, setIsSendingUniqueCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const { instance } = useInstance();
  const { captureEvent } = useEventTracker();
  // derived values
  const isSmtpConfigured = instance?.config?.is_smtp_configured;

  const handleFormChange = (key: keyof TPasswordFormValues, value: string) =>
    setPasswordFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  const handleSendUniqueCode = async () => {
    const emailFormValue = passwordFormData.email;

    const isEmailValid = checkEmailValidity(emailFormValue);

    if (!isEmailValid) {
      // FIXME: Handle Error
      // setError("email", { message: "Email is invalid" });
      return;
    }

    setIsSendingUniqueCode(true);

    await authService
      .generateUniqueCode({ email: emailFormValue })
      .then(() => handleStepChange(EAuthSteps.UNIQUE_CODE))
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsSendingUniqueCode(false));
  };

  const passwordSupport =
    mode === EAuthModes.SIGN_IN ? (
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
    ) : (
      <PasswordStrengthMeter password={passwordFormData.password} />
    );

  return (
    <>
      <form
        className="mx-auto mt-5 space-y-4 sm:w-96"
        method="POST"
        action={`${API_BASE_URL}/auth/${mode === EAuthModes.SIGN_IN ? "sign-in" : "sign-up"}/`}
      >
        <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
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
              name="password"
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
          {passwordSupport}
        </div>
        <div className="space-y-2.5">
          {mode === EAuthModes.SIGN_IN ? (
            <>
              <Button type="submit" variant="primary" className="w-full" size="lg">
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
            </>
          ) : (
            <Button type="submit" variant="primary" className="w-full" size="lg">
              Create account
            </Button>
          )}
        </div>
      </form>
    </>
  );
});
