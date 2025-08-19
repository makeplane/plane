"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// icons
import { Eye, EyeOff } from "lucide-react";
// plane imports
import { AUTH_TRACKER_ELEMENTS, AUTH_TRACKER_EVENTS, E_PASSWORD_STRENGTH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, Input, PasswordStrengthIndicator, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { getPasswordStrength } from "@plane/utils";
// helpers
import { captureError, captureSuccess, captureView } from "@/helpers/event-tracker.helper";
// hooks
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { AuthService } from "@/services/auth.service";
// local components
import { FormContainer } from "./common/container";
import { AuthFormHeader } from "./common/header";

type TResetPasswordFormValues = {
  email: string;
  password: string;
  confirm_password?: string;
};

const defaultValues: TResetPasswordFormValues = {
  email: "",
  password: "",
};

// services
const authService = new AuthService();

export const SetPasswordForm = observer(() => {
  // router
  const router = useAppRouter();
  // search params
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  // states
  const [showPassword, setShowPassword] = useState({
    password: false,
    retypePassword: false,
  });
  const [passwordFormData, setPasswordFormData] = useState<TResetPasswordFormValues>({
    ...defaultValues,
    email: email ? email.toString() : "",
  });
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [isRetryPasswordInputFocused, setIsRetryPasswordInputFocused] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { data: user, handleSetPassword } = useUser();

  useEffect(() => {
    captureView({
      elementName: AUTH_TRACKER_ELEMENTS.SET_PASSWORD_FORM,
    });
  }, []);

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFormChange = (key: keyof TResetPasswordFormValues, value: string) =>
    setPasswordFormData((prev) => ({ ...prev, [key]: value }));

  const isButtonDisabled = useMemo(
    () =>
      !!passwordFormData.password &&
      getPasswordStrength(passwordFormData.password) === E_PASSWORD_STRENGTH.STRENGTH_VALID &&
      passwordFormData.password === passwordFormData.confirm_password
        ? false
        : true,
    [passwordFormData]
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      if (!csrfToken) throw new Error("csrf token not found");
      await handleSetPassword(csrfToken, { password: passwordFormData.password });
      captureSuccess({
        eventName: AUTH_TRACKER_EVENTS.password_created,
      });
      router.push("/");
    } catch (error: unknown) {
      let message = undefined;
      if (error instanceof Error) {
        const err = error as Error & { error?: string };
        message = err.error;
      }
      captureError({
        eventName: AUTH_TRACKER_EVENTS.password_created,
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.errors.default.title"),
        message: message ?? t("common.errors.default.message"),
      });
    }
  };

  const password = passwordFormData?.password ?? "";
  const confirmPassword = passwordFormData?.confirm_password ?? "";
  const renderPasswordMatchError = !isRetryPasswordInputFocused || confirmPassword.length >= password.length;

  return (
    <FormContainer>
      <AuthFormHeader title="Set password" description="Create a new password." />
      <form className="space-y-4" onSubmit={(e) => handleSubmit(e)}>
        <div className="space-y-1">
          <label className="text-sm text-custom-text-300 font-medium" htmlFor="email">
            {t("auth.common.email.label")}
          </label>
          <div className="relative flex items-center rounded-md bg-custom-background-100">
            <Input
              id="email"
              name="email"
              type="email"
              value={user?.email}
              //hasError={Boolean(errors.email)}
              placeholder={t("auth.common.email.placeholder")}
              className="h-10 w-full border border-custom-border-300 !bg-custom-background-100 pr-12 text-custom-text-400 cursor-not-allowed"
              autoComplete="on"
              disabled
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-custom-text-300 font-medium" htmlFor="password">
            {t("auth.common.password.label")}
          </label>
          <div className="relative flex items-center rounded-md bg-custom-background-100">
            <Input
              type={showPassword.password ? "text" : "password"}
              name="password"
              value={passwordFormData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              //hasError={Boolean(errors.password)}
              placeholder={t("auth.common.password.placeholder")}
              className="h-10 w-full border border-custom-border-300 !bg-custom-background-100 pr-12 placeholder:text-custom-text-400"
              minLength={8}
              onFocus={() => setIsPasswordInputFocused(true)}
              onBlur={() => setIsPasswordInputFocused(false)}
              autoComplete="on"
              autoFocus
            />
            {showPassword.password ? (
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
          <PasswordStrengthIndicator password={passwordFormData.password} isFocused={isPasswordInputFocused} />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-custom-text-300 font-medium" htmlFor="confirm_password">
            {t("auth.common.password.confirm_password.label")}
          </label>
          <div className="relative flex items-center rounded-md bg-custom-background-100">
            <Input
              type={showPassword.retypePassword ? "text" : "password"}
              name="confirm_password"
              value={passwordFormData.confirm_password}
              onChange={(e) => handleFormChange("confirm_password", e.target.value)}
              placeholder={t("auth.common.password.confirm_password.placeholder")}
              className="h-10 w-full border border-custom-border-300 !bg-custom-background-100 pr-12 placeholder:text-custom-text-400"
              onFocus={() => setIsRetryPasswordInputFocused(true)}
              onBlur={() => setIsRetryPasswordInputFocused(false)}
            />
            {showPassword.retypePassword ? (
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
        <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
          {t("common.continue")}
        </Button>
      </form>
    </FormContainer>
  );
});
