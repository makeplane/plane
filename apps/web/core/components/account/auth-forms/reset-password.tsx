import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// icons
import { Eye, EyeOff } from "lucide-react";
// ui
import { API_BASE_URL, E_PASSWORD_STRENGTH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input, PasswordStrengthIndicator } from "@plane/ui";
// components
import { getPasswordStrength } from "@plane/utils";
// helpers
import type { EAuthenticationErrorCodes, TAuthErrorInfo } from "@/helpers/authentication.helper";
import { EErrorAlertType, authErrorHandler } from "@/helpers/authentication.helper";
// services
import { AuthService } from "@/services/auth.service";
// local imports
import { AuthBanner } from "./auth-banner";
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

export const ResetPasswordForm = observer(function ResetPasswordForm() {
  // search params
  const searchParams = useSearchParams();
  const uidb64 = searchParams.get("uidb64");
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const error_code = searchParams.get("error_code");
  // states
  const [showPassword, setShowPassword] = useState({
    password: false,
    retypePassword: false,
  });
  const [resetFormData, setResetFormData] = useState<TResetPasswordFormValues>({
    ...defaultValues,
    email: email ? email.toString() : "",
  });
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [isRetryPasswordInputFocused, setIsRetryPasswordInputFocused] = useState(false);
  const [errorInfo, setErrorInfo] = useState<TAuthErrorInfo | undefined>(undefined);
  // plane hooks
  const { t } = useTranslation();

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFormChange = (key: keyof TResetPasswordFormValues, value: string) =>
    setResetFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  const isButtonDisabled = useMemo(
    () =>
      !!resetFormData.password &&
      getPasswordStrength(resetFormData.password) === E_PASSWORD_STRENGTH.STRENGTH_VALID &&
      resetFormData.password === resetFormData.confirm_password
        ? false
        : true,
    [resetFormData]
  );

  useEffect(() => {
    if (error_code) {
      const errorhandler = authErrorHandler(error_code?.toString() as EAuthenticationErrorCodes);
      if (errorhandler) {
        setErrorInfo(errorhandler);
      }
    }
  }, [error_code]);

  const password = resetFormData?.password ?? "";
  const confirmPassword = resetFormData?.confirm_password ?? "";
  const renderPasswordMatchError = !isRetryPasswordInputFocused || confirmPassword.length >= password.length;

  return (
    <FormContainer>
      <AuthFormHeader title="Reset password" description="Create a new password." />

      {errorInfo && errorInfo?.type === EErrorAlertType.BANNER_ALERT && (
        <AuthBanner message={errorInfo.message} handleBannerData={(value) => setErrorInfo(value)} />
      )}
      <form
        className="space-y-4"
        method="POST"
        action={`${API_BASE_URL}/auth/reset-password/${uidb64?.toString()}/${token?.toString()}/`}
      >
        <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
        <div className="space-y-1">
          <label className="text-13 text-tertiary font-medium" htmlFor="email">
            {t("auth.common.email.label")}
          </label>
          <div className="relative flex items-center rounded-md bg-surface-1">
            <Input
              id="email"
              name="email"
              type="email"
              value={resetFormData.email}
              //hasError={Boolean(errors.email)}
              placeholder={t("auth.common.email.placeholder")}
              className="h-10 w-full border border-strong !bg-surface-1 pr-12 text-placeholder cursor-not-allowed"
              autoComplete="on"
              disabled
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-13 text-tertiary font-medium" htmlFor="password">
            {t("auth.common.password.label")}
          </label>
          <div className="relative flex items-center rounded-md bg-surface-1">
            <Input
              type={showPassword.password ? "text" : "password"}
              name="password"
              value={resetFormData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              //hasError={Boolean(errors.password)}
              placeholder={t("auth.common.password.placeholder")}
              className="h-10 w-full border border-strong !bg-surface-1 pr-12 placeholder:text-placeholder"
              minLength={8}
              onFocus={() => setIsPasswordInputFocused(true)}
              onBlur={() => setIsPasswordInputFocused(false)}
              autoComplete="on"
              autoFocus
            />
            {showPassword.password ? (
              <EyeOff
                className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                onClick={() => handleShowPassword("password")}
              />
            ) : (
              <Eye
                className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                onClick={() => handleShowPassword("password")}
              />
            )}
          </div>
          <PasswordStrengthIndicator password={resetFormData.password} isFocused={isPasswordInputFocused} />
        </div>
        <div className="space-y-1">
          <label className="text-13 text-tertiary font-medium" htmlFor="confirm_password">
            {t("auth.common.password.confirm_password.label")}
          </label>
          <div className="relative flex items-center rounded-md bg-surface-1">
            <Input
              type={showPassword.retypePassword ? "text" : "password"}
              name="confirm_password"
              value={resetFormData.confirm_password}
              onChange={(e) => handleFormChange("confirm_password", e.target.value)}
              placeholder={t("auth.common.password.confirm_password.placeholder")}
              className="h-10 w-full border border-strong !bg-surface-1 pr-12 placeholder:text-placeholder"
              onFocus={() => setIsRetryPasswordInputFocused(true)}
              onBlur={() => setIsRetryPasswordInputFocused(false)}
            />
            {showPassword.retypePassword ? (
              <EyeOff
                className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                onClick={() => handleShowPassword("retypePassword")}
              />
            ) : (
              <Eye
                className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                onClick={() => handleShowPassword("retypePassword")}
              />
            )}
          </div>
          {!!resetFormData.confirm_password &&
            resetFormData.password !== resetFormData.confirm_password &&
            renderPasswordMatchError && (
              <span className="text-13 text-danger-primary">{t("auth.common.password.errors.match")}</span>
            )}
        </div>
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
          {t("auth.common.password.submit")}
        </Button>
      </form>
    </FormContainer>
  );
});
