/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Eye, EyeOff, XCircle } from "lucide-react";
// plane imports
import { API_BASE_URL, E_PASSWORD_STRENGTH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { AuthService } from "@plane/services";
import { Input, Spinner, PasswordStrengthIndicator } from "@plane/ui";
import { getPasswordStrength } from "@plane/utils";
// types
import { EAuthModes, EAuthSteps } from "@/types/auth";

type Props = {
  email: string;
  isPasswordAutoset: boolean;
  isSMTPConfigured: boolean;
  mode: EAuthModes;
  nextPath: string | undefined;
  handleEmailClear: () => void;
  handleAuthStep: (step: EAuthSteps) => void;
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

export const AuthPasswordForm = observer(function AuthPasswordForm(props: Props) {
  const { email, nextPath, isSMTPConfigured, handleAuthStep, handleEmailClear, mode } = props;
  const { t } = useTranslation();
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
  };

  const passwordSupport = passwordFormData.password.length > 0 &&
    mode === EAuthModes.SIGN_UP &&
    getPasswordStrength(passwordFormData.password) != E_PASSWORD_STRENGTH.STRENGTH_VALID && (
      <PasswordStrengthIndicator password={passwordFormData.password} isFocused={isPasswordInputFocused} />
    );

  const isButtonDisabled = useMemo(
    () =>
      !(
        !isSubmitting &&
        !!passwordFormData.password &&
        (mode === EAuthModes.SIGN_UP
          ? getPasswordStrength(passwordFormData.password) === E_PASSWORD_STRENGTH.STRENGTH_VALID &&
            passwordFormData.password === passwordFormData.confirm_password
          : true)
      ),
    [isSubmitting, mode, passwordFormData.confirm_password, passwordFormData.password]
  );

  const password = passwordFormData.password ?? "";
  const confirmPassword = passwordFormData.confirm_password ?? "";
  const renderPasswordMatchError = !isRetryPasswordInputFocused || confirmPassword.length >= password.length;

  const handleCSRFToken = async () => {
    if (!formRef || !formRef.current) return;
    const token = await csrfPromise;
    if (!token?.csrf_token) return;
    const csrfElement = formRef.current.querySelector("input[name=csrfmiddlewaretoken]");
    csrfElement?.setAttribute("value", token?.csrf_token);
  };

  return (
    <form
      ref={formRef}
      className="mt-5 space-y-4"
      method="POST"
      action={`${API_BASE_URL}/auth/spaces/${mode === EAuthModes.SIGN_IN ? "sign-in" : "sign-up"}/`}
      onSubmit={async (event) => {
        event.preventDefault();
        await handleCSRFToken();
        if (formRef.current) {
          formRef.current.submit();
        }
        setIsSubmitting(true);
      }}
      onError={() => setIsSubmitting(false)}
    >
      <input type="hidden" name="csrfmiddlewaretoken" />
      <input type="hidden" value={passwordFormData.email} name="email" />
      <input type="hidden" value={nextPath} name="next_path" />
      <div className="space-y-1">
        <label className="text-13 font-medium text-tertiary" htmlFor="email">
          {t("localized_ui.space_auth.email")}
        </label>
        <div className={`relative flex items-center rounded-md border border-subtle bg-surface-1`}>
          <Input
            id="email"
            name="email"
            type="email"
            value={passwordFormData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder="name@company.com"
            className={`h-10 w-full border-0 disable-autofill-style placeholder:text-placeholder`}
            disabled
          />
          {passwordFormData.email.length > 0 && (
            <XCircle
              className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
              onClick={handleEmailClear}
            />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-13 font-medium text-tertiary" htmlFor="password">
          {mode === EAuthModes.SIGN_IN
            ? t("localized_ui.space_auth.password")
            : t("localized_ui.space_auth.set_password")}
        </label>
        <div className="relative flex items-center rounded-md bg-surface-1">
          <Input
            type={showPassword?.password ? "text" : "password"}
            name="password"
            value={passwordFormData.password}
            onChange={(e) => handleFormChange("password", e.target.value)}
            placeholder={t("localized_ui.space_auth.enter_password")}
            className="h-10 w-full border border-subtle !bg-surface-1 pr-12 disable-autofill-style placeholder:text-placeholder"
            onFocus={() => setIsPasswordInputFocused(true)}
            onBlur={() => setIsPasswordInputFocused(false)}
            autoComplete="off"
          />
          {showPassword?.password ? (
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
        {passwordSupport}
      </div>

      {mode === EAuthModes.SIGN_UP && (
        <div className="space-y-1">
          <label className="text-13 font-medium text-tertiary" htmlFor="confirm_password">
            {t("localized_ui.space_auth.confirm_password")}
          </label>
          <div className="relative flex items-center rounded-md bg-surface-1">
            <Input
              type={showPassword?.retypePassword ? "text" : "password"}
              name="confirm_password"
              value={passwordFormData.confirm_password}
              onChange={(e) => handleFormChange("confirm_password", e.target.value)}
              placeholder={t("localized_ui.space_auth.confirm_password")}
              className="h-10 w-full border border-subtle !bg-surface-1 pr-12 disable-autofill-style placeholder:text-placeholder"
              onFocus={() => setIsRetryPasswordInputFocused(true)}
              onBlur={() => setIsRetryPasswordInputFocused(false)}
              autoComplete="off"
            />
            {showPassword?.retypePassword ? (
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
          {!!passwordFormData.confirm_password &&
            passwordFormData.password !== passwordFormData.confirm_password &&
            renderPasswordMatchError && (
              <span className="text-13 text-danger-primary">{t("localized_ui.space_auth.passwords_dont_match")}</span>
            )}
        </div>
      )}

      <div className="space-y-2.5">
        {mode === EAuthModes.SIGN_IN ? (
          <>
            <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
              {isSubmitting ? (
                <Spinner height="20px" width="20px" />
              ) : isSMTPConfigured ? (
                t("localized_ui.space_auth.continue")
              ) : (
                t("localized_ui.space_auth.go_to_workspace")
              )}
            </Button>
            {isSMTPConfigured && (
              <Button
                type="button"
                onClick={redirectToUniqueCodeSignIn}
                variant="secondary"
                className="w-full"
                size="xl"
              >
                {t("localized_ui.space_auth.sign_in_with_unique_code")}
              </Button>
            )}
          </>
        ) : (
          <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
            {isSubmitting ? <Spinner height="20px" width="20px" /> : t("localized_ui.space_auth.create_account")}
          </Button>
        )}
      </div>
    </form>
  );
});
