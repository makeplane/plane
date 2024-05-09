import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { Eye, EyeOff, XCircle } from "lucide-react";
// ui
import { Button, Input, Spinner } from "@plane/ui";
// components
import { ForgotPasswordPopover, PasswordStrengthMeter } from "@/components/account";
// constants
import { FORGOT_PASSWORD } from "@/constants/event-tracker";
// helpers
import { EAuthModes, EAuthSteps } from "@/helpers/authentication.helper";
import { API_BASE_URL } from "@/helpers/common.helper";
import { getPasswordStrength } from "@/helpers/password.helper";
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
  confirm_password?: string;
};

const defaultValues: TPasswordFormValues = {
  email: "",
  password: "",
};

const authService = new AuthService();

export const AuthPasswordForm: React.FC<Props> = observer((props: Props) => {
  const { email, handleStepChange, handleEmailClear, mode } = props;
  // hooks
  const { instance } = useInstance();
  const { captureEvent } = useEventTracker();
  // states
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [passwordFormData, setPasswordFormData] = useState<TPasswordFormValues>({ ...defaultValues, email });
  const [showPassword, setShowPassword] = useState({
    password: false,
    retypePassword: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  // derived values
  const isSmtpConfigured = instance?.config?.is_smtp_configured;

  const handleFormChange = (key: keyof TPasswordFormValues, value: string) =>
    setPasswordFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  const redirectToUniqueCodeSignIn = async () => {
    handleStepChange(EAuthSteps.UNIQUE_CODE);
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
      isPasswordInputFocused && <PasswordStrengthMeter password={passwordFormData.password} />
    );

  const isButtonDisabled = useMemo(
    () =>
      !isSubmitting &&
      !!passwordFormData.password &&
      (mode === EAuthModes.SIGN_UP
        ? getPasswordStrength(passwordFormData.password) >= 3 &&
          passwordFormData.password === passwordFormData.confirm_password
        : true)
        ? false
        : true,
    [isSubmitting, mode, passwordFormData.confirm_password, passwordFormData.password]
  );

  return (
    <form
      className="mt-5 space-y-4"
      method="POST"
      action={`${API_BASE_URL}/auth/${mode === EAuthModes.SIGN_IN ? "sign-in" : "sign-up"}/`}
      onSubmit={() => setIsSubmitting(true)}
      onError={() => setIsSubmitting(false)}
    >
      <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
      <div className="space-y-1">
        <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
          Email
        </label>
        <div className="relative flex items-center rounded-md bg-onboarding-background-200">
          <Input
            id="email"
            name="email"
            type="email"
            value={passwordFormData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
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
        <input type="hidden" value={passwordFormData.email} name="email" />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="password">
          {mode === EAuthModes.SIGN_IN ? "Password" : "Set a password"}
        </label>
        <div className="relative flex items-center rounded-md bg-onboarding-background-200">
          <Input
            type={showPassword?.password ? "text" : "password"}
            name="password"
            value={passwordFormData.password}
            onChange={(e) => handleFormChange("password", e.target.value)}
            placeholder="Enter password"
            className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
            onFocus={() => setIsPasswordInputFocused(true)}
            onBlur={() => setIsPasswordInputFocused(false)}
            autoFocus
          />
          {showPassword?.password ? (
            <EyeOff
              className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
              onClick={() => handleShowPassword("password")}
            />
          ) : (
            <Eye
              className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
              onClick={() => handleShowPassword("password")}
            />
          )}
        </div>
        {passwordSupport}
      </div>
      {mode === EAuthModes.SIGN_UP && (
        <div className="space-y-1">
          <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="confirm_password">
            Confirm password
          </label>
          <div className="relative flex items-center rounded-md bg-onboarding-background-200">
            <Input
              type={showPassword?.retypePassword ? "text" : "password"}
              name="confirm_password"
              value={passwordFormData.confirm_password}
              onChange={(e) => handleFormChange("confirm_password", e.target.value)}
              placeholder="Confirm password"
              className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
            />
            {showPassword?.retypePassword ? (
              <EyeOff
                className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                onClick={() => handleShowPassword("retypePassword")}
              />
            ) : (
              <Eye
                className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                onClick={() => handleShowPassword("retypePassword")}
              />
            )}
          </div>
          {!!passwordFormData.confirm_password && passwordFormData.password !== passwordFormData.confirm_password && (
            <span className="text-sm text-red-500">Passwords don{"'"}t match</span>
          )}
        </div>
      )}
      <div className="space-y-2.5">
        {mode === EAuthModes.SIGN_IN ? (
          <>
            <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
              {isSubmitting ? (
                <Spinner height="20px" width="20px" />
              ) : isSmtpConfigured ? (
                "Continue"
              ) : (
                "Go to workspace"
              )}
            </Button>
            {instance && isSmtpConfigured && (
              <Button
                type="button"
                onClick={redirectToUniqueCodeSignIn}
                variant="outline-primary"
                className="w-full"
                size="lg"
              >
                Sign in with unique code
              </Button>
            )}
          </>
        ) : (
          <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
            {isSubmitting ? <Spinner height="20px" width="20px" /> : "Create account"}
          </Button>
        )}
      </div>
    </form>
  );
});
