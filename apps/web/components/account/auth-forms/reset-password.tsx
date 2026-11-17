/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// icons
import { HideOutline, ShowOutline } from "@makeplane/propel/icons";
// ui
import { Banner } from "@makeplane/propel/components/banner";
import { InputField } from "@makeplane/propel/components/input-field";
import { API_BASE_URL, E_PASSWORD_STRENGTH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { PasswordStrengthIndicator } from "@plane/blocks/auth";
// components
import { getPasswordStrength } from "@plane/utils";
// helpers
import type { EAuthenticationErrorCodes, TAuthErrorInfo } from "@/helpers/authentication.helper";
import { EErrorAlertType, authErrorHandler } from "@/helpers/authentication.helper";
// services
import { AuthService } from "@/services/auth.service";
// local imports
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
        <Banner
          placement="inline"
          variant="info"
          role="alert"
          description={errorInfo.message}
          dismissLabel={t("close")}
          onDismiss={() => setErrorInfo(undefined)}
        />
      )}
      <form
        className="space-y-4"
        method="POST"
        action={`${API_BASE_URL}/auth/reset-password/${uidb64?.toString()}/${token?.toString()}/`}
      >
        <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
        <InputField
          size="xl"
          orientation="vertical"
          label={t("auth.common.email.label")}
          id="email"
          name="email"
          type="email"
          value={resetFormData.email}
          placeholder={t("auth.common.email.placeholder")}
          autoComplete="off"
          disabled
        />
        <div className="space-y-1">
          <InputField
            size="xl"
            orientation="vertical"
            label={t("auth.common.password.label")}
            type={showPassword.password ? "text" : "password"}
            name="password"
            id="password"
            aria-describedby="reset-password-support"
            value={resetFormData.password}
            onChange={(e) => handleFormChange("password", e.target.value)}
            placeholder={t("auth.common.password.placeholder")}
            minLength={8}
            onFocus={() => setIsPasswordInputFocused(true)}
            onBlur={() => setIsPasswordInputFocused(false)}
            autoComplete="new-password"
            autoFocus
            endIcon={
              <button
                type="button"
                onClick={() => handleShowPassword("password")}
                className="grid size-5 shrink-0 place-items-center"
                aria-label={t(
                  showPassword.password
                    ? "aria_labels.auth_forms.hide_password"
                    : "aria_labels.auth_forms.show_password"
                )}
              >
                {showPassword.password ? (
                  <HideOutline className="size-5 text-placeholder" />
                ) : (
                  <ShowOutline className="size-5 text-placeholder" />
                )}
              </button>
            }
          />
          <div id="reset-password-support">
            <PasswordStrengthIndicator password={resetFormData.password} isFocused={isPasswordInputFocused} />
          </div>
        </div>
        <InputField
          size="xl"
          orientation="vertical"
          label={t("auth.common.password.confirm_password.label")}
          type={showPassword.retypePassword ? "text" : "password"}
          name="confirm_password"
          id="confirm_password"
          value={resetFormData.confirm_password}
          onChange={(e) => handleFormChange("confirm_password", e.target.value)}
          placeholder={t("auth.common.password.confirm_password.placeholder")}
          onFocus={() => setIsRetryPasswordInputFocused(true)}
          onBlur={() => setIsRetryPasswordInputFocused(false)}
          autoComplete="new-password"
          endIcon={
            <button
              type="button"
              onClick={() => handleShowPassword("retypePassword")}
              className="grid size-5 shrink-0 place-items-center"
              aria-label={t(
                showPassword.retypePassword
                  ? "aria_labels.auth_forms.hide_password"
                  : "aria_labels.auth_forms.show_password"
              )}
            >
              {showPassword.retypePassword ? (
                <HideOutline className="size-5 text-placeholder" />
              ) : (
                <ShowOutline className="size-5 text-placeholder" />
              )}
            </button>
          }
          error={
            !!confirmPassword && password !== confirmPassword && renderPasswordMatchError
              ? t("auth.common.password.errors.match")
              : undefined
          }
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          stretch="full"
          label={t("auth.common.password.submit")}
          disabled={isButtonDisabled}
        />
      </form>
    </FormContainer>
  );
});
