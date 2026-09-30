/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { CloseCircleOutline, HideOutline, ShowOutline } from "@makeplane/propel/icons";
// plane imports
import { API_BASE_URL, E_PASSWORD_STRENGTH } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import { Input } from "@makeplane/propel/components/input";
import { AuthService } from "@plane/services";
import { PasswordStrengthIndicator } from "@plane/blocks/auth";
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
      !isSubmitting &&
      !!passwordFormData.password &&
      (mode === EAuthModes.SIGN_UP
        ? getPasswordStrength(passwordFormData.password) === E_PASSWORD_STRENGTH.STRENGTH_VALID &&
          passwordFormData.password === passwordFormData.confirm_password
        : true)
        ? false
        : true,
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
          Email
        </label>
        <div className="relative flex h-10 items-center rounded-md border border-subtle bg-surface-1 px-3 [&_input]:disable-autofill-style">
          <Input
            id="email"
            name="email"
            type="email"
            size="xl"
            value={passwordFormData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder="name@company.com"
            disabled
          />
          {passwordFormData.email.length > 0 && (
            <button
              type="button"
              aria-label="Clear email"
              className="absolute right-3 hover:cursor-pointer"
              onClick={handleEmailClear}
              tabIndex={-1}
            >
              <CloseCircleOutline className="h-5 w-5 text-placeholder" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-13 font-medium text-tertiary" htmlFor="password">
          {mode === EAuthModes.SIGN_IN ? "Password" : "Set a password"}
        </label>
        <div className="relative flex h-10 items-center rounded-md border border-subtle bg-surface-1 pr-12 pl-3 [&_input]:disable-autofill-style">
          <Input
            id="password"
            type={showPassword?.password ? "text" : "password"}
            name="password"
            size="xl"
            value={passwordFormData.password}
            onChange={(e) => handleFormChange("password", e.target.value)}
            placeholder="Enter password"
            onFocus={() => setIsPasswordInputFocused(true)}
            onBlur={() => setIsPasswordInputFocused(false)}
            autoComplete="off"
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- sole primary field of a dedicated auth step; matches standard sign-in flows
            autoFocus
          />
          {showPassword?.password ? (
            <button
              type="button"
              aria-label="Hide password"
              className="absolute right-3 hover:cursor-pointer"
              onClick={() => handleShowPassword("password")}
            >
              <HideOutline className="h-5 w-5 text-placeholder" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Show password"
              className="absolute right-3 hover:cursor-pointer"
              onClick={() => handleShowPassword("password")}
            >
              <ShowOutline className="h-5 w-5 text-placeholder" />
            </button>
          )}
        </div>
        {passwordSupport}
      </div>

      {mode === EAuthModes.SIGN_UP && (
        <div className="space-y-1">
          <label className="text-13 font-medium text-tertiary" htmlFor="confirm_password">
            Confirm password
          </label>
          <div className="relative flex h-10 items-center rounded-md border border-subtle bg-surface-1 pr-12 pl-3 [&_input]:disable-autofill-style">
            <Input
              id="confirm_password"
              type={showPassword?.retypePassword ? "text" : "password"}
              name="confirm_password"
              size="xl"
              value={passwordFormData.confirm_password}
              onChange={(e) => handleFormChange("confirm_password", e.target.value)}
              placeholder="Confirm password"
              onFocus={() => setIsRetryPasswordInputFocused(true)}
              onBlur={() => setIsRetryPasswordInputFocused(false)}
              autoComplete="off"
            />
            {showPassword?.retypePassword ? (
              <button
                type="button"
                aria-label="Hide password"
                className="absolute right-3 hover:cursor-pointer"
                onClick={() => handleShowPassword("retypePassword")}
              >
                <HideOutline className="h-5 w-5 text-placeholder" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Show password"
                className="absolute right-3 hover:cursor-pointer"
                onClick={() => handleShowPassword("retypePassword")}
              >
                <ShowOutline className="h-5 w-5 text-placeholder" />
              </button>
            )}
          </div>
          {!!passwordFormData.confirm_password &&
            passwordFormData.password !== passwordFormData.confirm_password &&
            renderPasswordMatchError && <span className="text-13 text-danger-primary">Passwords don{"'"}t match</span>}
        </div>
      )}

      <div className="space-y-2.5">
        {mode === EAuthModes.SIGN_IN ? (
          <>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              stretch="full"
              disabled={isButtonDisabled}
              loading={isSubmitting}
              label={isSMTPConfigured ? "Continue" : "Go to workspace"}
            />
            {isSMTPConfigured && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                stretch="full"
                label="Sign in with unique code"
                onClick={redirectToUniqueCodeSignIn}
              />
            )}
          </>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size="lg"
            stretch="full"
            disabled={isButtonDisabled}
            loading={isSubmitting}
            label="Create account"
          />
        )}
      </div>
    </form>
  );
});
