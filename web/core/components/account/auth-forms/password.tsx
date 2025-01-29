"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { Eye, EyeOff, Info, X, XCircle } from "lucide-react";
// plane imports
import { FORGOT_PASSWORD, SIGN_IN_WITH_CODE, SIGN_IN_WITH_PASSWORD, SIGN_UP_WITH_PASSWORD } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, Input, Spinner } from "@plane/ui";
// components
import { ForgotPasswordPopover, PasswordStrengthMeter } from "@/components/account";
// constants
// helpers
import { EAuthModes, EAuthSteps } from "@/helpers/authentication.helper";
import { API_BASE_URL } from "@/helpers/common.helper";
import { E_PASSWORD_STRENGTH, getPasswordStrength } from "@/helpers/password.helper";
// hooks
import { useEventTracker } from "@/hooks/store";
// services
import { AuthService } from "@/services/auth.service";

type Props = {
  email: string;
  isSMTPConfigured: boolean;
  mode: EAuthModes;
  handleEmailClear: () => void;
  handleAuthStep: (step: EAuthSteps) => void;
  nextPath: string | undefined;
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
  const { email, isSMTPConfigured, handleAuthStep, handleEmailClear, mode, nextPath } = props;
  // plane imports
  const { t } = useTranslation();
  // hooks
  const { captureEvent } = useEventTracker();
  // ref
  const formRef = useRef<HTMLFormElement>(null);
  // states
  const [csrfPromise, setCsrfPromise] = useState<Promise<{ csrf_token: string }> | undefined>(undefined);
  const [passwordFormData, setPasswordFormData] = useState<TPasswordFormValues>({ ...defaultValues, email });
  const [showPassword, setShowPassword] = useState({
    password: false,
    retypePassword: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [isRetryPasswordInputFocused, setIsRetryPasswordInputFocused] = useState(false);
  const [isBannerMessage, setBannerMessage] = useState(false);

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFormChange = (key: keyof TPasswordFormValues, value: string) =>
    setPasswordFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = authService.requestCSRFToken();
      setCsrfPromise(promise);
    }
  }, [csrfPromise]);

  const redirectToUniqueCodeSignIn = async () => {
    handleAuthStep(EAuthSteps.UNIQUE_CODE);
    captureEvent(SIGN_IN_WITH_CODE);
  };

  const passwordSupport =
    mode === EAuthModes.SIGN_IN ? (
      <div className="w-full">
        {isSMTPConfigured ? (
          <Link
            onClick={() => captureEvent(FORGOT_PASSWORD)}
            href={`/accounts/forgot-password?email=${encodeURIComponent(email)}`}
            className="text-xs font-medium text-custom-primary-100"
          >
            {t("auth.common.forgot_password")}
          </Link>
        ) : (
          <ForgotPasswordPopover />
        )}
      </div>
    ) : (
      passwordFormData.password.length > 0 &&
      getPasswordStrength(passwordFormData.password) != E_PASSWORD_STRENGTH.STRENGTH_VALID && (
        <PasswordStrengthMeter password={passwordFormData.password} isFocused={isPasswordInputFocused} />
      )
    );

  const isButtonDisabled = useMemo(
    () =>
      !isSubmitting &&
      !!passwordFormData.password &&
      (mode === EAuthModes.SIGN_UP ? passwordFormData.password === passwordFormData.confirm_password : true)
        ? false
        : true,
    [isSubmitting, mode, passwordFormData.confirm_password, passwordFormData.password]
  );

  const password = passwordFormData?.password ?? "";
  const confirmPassword = passwordFormData?.confirm_password ?? "";
  const renderPasswordMatchError = !isRetryPasswordInputFocused || confirmPassword.length >= password.length;

  const handleCSRFToken = async () => {
    if (!formRef || !formRef.current) return;
    const token = await csrfPromise;
    if (!token?.csrf_token) return;
    const csrfElement = formRef.current.querySelector("input[name=csrfmiddlewaretoken]");
    csrfElement?.setAttribute("value", token?.csrf_token);
  };

  return (
    <>
      {isBannerMessage && mode === EAuthModes.SIGN_UP && (
        <div className="relative flex items-center p-2 rounded-md gap-2 border border-red-500/50 bg-red-500/10">
          <div className="w-4 h-4 flex-shrink-0 relative flex justify-center items-center">
            <Info size={16} className="text-red-500" />
          </div>
          <div className="w-full text-sm font-medium text-red-500">{t("auth.sign_up.errors.password.strength")}</div>
          <div
            className="relative ml-auto w-6 h-6 rounded-sm flex justify-center items-center transition-all cursor-pointer hover:bg-red-500/20 text-custom-primary-100/80"
            onClick={() => setBannerMessage(false)}
          >
            <X className="w-4 h-4 flex-shrink-0 text-red-500" />
          </div>
        </div>
      )}
      <form
        ref={formRef}
        className="mt-5 space-y-4"
        method="POST"
        action={`${API_BASE_URL}/auth/${mode === EAuthModes.SIGN_IN ? "sign-in" : "sign-up"}/`}
        onSubmit={async (event) => {
          event.preventDefault(); // Prevent form from submitting by default
          await handleCSRFToken();
          const isPasswordValid =
            mode === EAuthModes.SIGN_UP
              ? getPasswordStrength(passwordFormData.password) === E_PASSWORD_STRENGTH.STRENGTH_VALID
              : true;
          if (isPasswordValid) {
            setIsSubmitting(true);
            captureEvent(mode === EAuthModes.SIGN_IN ? SIGN_IN_WITH_PASSWORD : SIGN_UP_WITH_PASSWORD);
            if (formRef.current) formRef.current.submit(); // Manually submit the form if the condition is met
          } else {
            setBannerMessage(true);
          }
        }}
        onError={() => setIsSubmitting(false)}
      >
        <input type="hidden" name="csrfmiddlewaretoken" />
        <input type="hidden" value={passwordFormData.email} name="email" />
        {nextPath && <input type="hidden" value={nextPath} name="next_path" />}
        <div className="space-y-1">
          <label className="text-sm font-medium text-onboarding-text-300" htmlFor="email">
            {t("auth.common.email.label")}
          </label>
          <div
            className={`relative flex items-center rounded-md bg-onboarding-background-200 border border-onboarding-border-100`}
          >
            <Input
              id="email"
              name="email"
              type="email"
              value={passwordFormData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              placeholder={t("auth.common.email.placeholder")}
              className={`disable-autofill-style h-[46px] w-full placeholder:text-onboarding-text-400 border-0`}
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
            {mode === EAuthModes.SIGN_IN ? t("auth.common.password.label") : t("auth.common.password.set_password")}
          </label>
          <div className="relative flex items-center rounded-md bg-onboarding-background-200">
            <Input
              type={showPassword?.password ? "text" : "password"}
              name="password"
              value={passwordFormData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              placeholder={t("auth.common.password.placeholder")}
              className="disable-autofill-style h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
              onFocus={() => setIsPasswordInputFocused(true)}
              onBlur={() => setIsPasswordInputFocused(false)}
              autoComplete="on"
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
              {t("auth.common.password.confirm_password.label")}
            </label>
            <div className="relative flex items-center rounded-md bg-onboarding-background-200">
              <Input
                type={showPassword?.retypePassword ? "text" : "password"}
                name="confirm_password"
                value={passwordFormData.confirm_password}
                onChange={(e) => handleFormChange("confirm_password", e.target.value)}
                placeholder={t("auth.common.password.confirm_password.placeholder")}
                className="disable-autofill-style h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                onFocus={() => setIsRetryPasswordInputFocused(true)}
                onBlur={() => setIsRetryPasswordInputFocused(false)}
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
            {!!passwordFormData.confirm_password &&
              passwordFormData.password !== passwordFormData.confirm_password &&
              renderPasswordMatchError && (
                <span className="text-sm text-red-500">{t("auth.common.password.errors.match")}</span>
              )}
          </div>
        )}

        <div className="space-y-2.5">
          {mode === EAuthModes.SIGN_IN ? (
            <>
              <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
                {isSubmitting ? (
                  <Spinner height="20px" width="20px" />
                ) : isSMTPConfigured ? (
                  t("common.continue")
                ) : (
                  t("common.go_to_workspace")
                )}
              </Button>
              {isSMTPConfigured && (
                <Button
                  type="button"
                  onClick={redirectToUniqueCodeSignIn}
                  variant="outline-primary"
                  className="w-full"
                  size="lg"
                >
                  {t("auth.common.sign_in_with_unique_code")}
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
    </>
  );
});
