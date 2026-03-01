/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, XCircle } from "lucide-react";
import type { TMobileAuthSteps, TMobileAuthModes } from "@plane/constants";
import { EMobileAuthSteps, EMobileAuthModes, API_BASE_URL, E_PASSWORD_STRENGTH } from "@plane/constants";
import { Button } from "@plane/propel/button";
import type { TMobileCSRFToken } from "@plane/types";
import { Input, Spinner } from "@plane/ui";
import { getPasswordStrength } from "@plane/utils";
// services
import mobileAuthService from "@/services/mobile.service";
// components
import { MobilePasswordStrengthMeter } from "./password-strength-meter";

type TMobileAuthPasswordForm = {
  authMode: TMobileAuthModes;
  invitationId: string | undefined;
  email: string;
  handleEmail: (value: string) => void;
  handleAuthStep: (value: TMobileAuthSteps) => void;
  generateEmailUniqueCode: (email: string) => Promise<{ code: string } | undefined>;
  isSMTPConfigured: boolean;
};

type TFormValues = {
  email: string;
  password: string;
  passwordConfirmation: string;
};
type TShowPassword = {
  password: boolean;
  passwordConfirmation: boolean;
};

const defaultFormValues: TFormValues = {
  email: "",
  password: "",
  passwordConfirmation: "",
};

export function MobileAuthPasswordForm(props: TMobileAuthPasswordForm) {
  const { authMode, invitationId, email, handleEmail, handleAuthStep, generateEmailUniqueCode, isSMTPConfigured } =
    props;
  // ref
  const authFormRef = useRef<HTMLFormElement>(null);
  // states
  const [csrfPromise, setCsrfPromise] = useState<Promise<TMobileCSRFToken> | undefined>(undefined);
  const [formData, setFormData] = useState<TFormValues>({ ...defaultFormValues, email });
  const [showPassword, setShowPassword] = useState<TShowPassword>({ password: false, passwordConfirmation: false });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [passwordInputFocused, setPasswordInputFocused] = useState<TShowPassword>({
    password: false,
    passwordConfirmation: false,
  });

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = mobileAuthService.requestCSRFToken();
      setCsrfPromise(promise);
    }
  }, [csrfPromise]);

  const handleFormChange = (key: keyof TFormValues, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleShowPassword = (key: keyof TShowPassword) => setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handlePasswordInputFocused = (key: keyof TShowPassword) =>
    setPasswordInputFocused((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleCSRFToken = async () => {
    if (!authFormRef || !authFormRef.current) return;
    const token = await csrfPromise;
    if (!token?.csrf_token) return;
    const csrfElement = authFormRef.current.querySelector("input[name=csrfmiddlewaretoken]");
    csrfElement?.setAttribute("value", token?.csrf_token);
  };

  const handleEmailClear = () => {
    handleEmail("");
    handleAuthStep(EMobileAuthSteps.EMAIL);
  };

  const redirectToUniqueCodeSignIn = () => {
    handleAuthStep(EMobileAuthSteps.UNIQUE_CODE);
    // generate unique code
    generateEmailUniqueCode(email);
  };

  // signup password confirmation derived values and handlers
  const isPasswordConfirmationRequired = authMode === EMobileAuthModes.SIGN_UP;
  const isPasswordStrengthValid = getPasswordStrength(formData.password) === E_PASSWORD_STRENGTH.STRENGTH_VALID;

  const verifyPasswordStrength = () => {
    if (formData.password.length <= 0) return false;
    return isPasswordStrengthValid;
  };

  const verifyPasswordConfirmation = () => {
    if (formData.password !== formData.passwordConfirmation) return false;
    return true;
  };

  const isPasswordConfirmationEnabled = isPasswordConfirmationRequired && verifyPasswordStrength();
  const isPasswordConfirmationErrorStatus =
    !passwordInputFocused.passwordConfirmation &&
    isPasswordConfirmationEnabled &&
    formData.password !== formData.passwordConfirmation;

  const isButtonDisabled = isPasswordConfirmationRequired
    ? !(verifyPasswordStrength() && verifyPasswordConfirmation()) || isSubmitting
    : (formData.password.length === 0 && isPasswordStrengthValid) || isSubmitting;

  return (
    <form
      ref={authFormRef}
      className="mt-5 space-y-4"
      method="POST"
      action={`${API_BASE_URL}/auth/mobile/${authMode === EMobileAuthModes.SIGN_UP ? "sign-up" : "sign-in"}/`}
      onSubmit={async (event) => {
        event.preventDefault(); // Prevent form from submitting by default
        setIsSubmitting(true);
        await handleCSRFToken();
        const passwordVerification = isPasswordConfirmationRequired
          ? verifyPasswordStrength() && verifyPasswordConfirmation()
          : true;
        if (passwordVerification) {
          if (authFormRef.current) authFormRef.current.submit();
        } else {
          setIsSubmitting(false);
        }
      }}
      onError={() => setIsSubmitting(false)}
    >
      <input type="hidden" name="csrfmiddlewaretoken" />
      <input type="hidden" value={formData.email} name="email" />
      <input type="hidden" value={invitationId} name="invitation_id" />

      <div className="space-y-1">
        <label className="text-13 font-medium text-tertiary" htmlFor="email">
          Email
        </label>
        <div className={`relative flex items-center rounded-md bg-surface-1 border border-subtle`}>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder="name@company.com"
            className={`disable-autofill-style h-10 w-full placeholder:text-placeholder border-0`}
            disabled
          />
          {formData.email.length > 0 && (
            <XCircle
              className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
              onClick={handleEmailClear}
            />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="space-y-1">
          <label className="text-13 text-tertiary font-medium" htmlFor="password">
            Password
          </label>
          <div className="relative flex items-center rounded-md bg-surface-1">
            <Input
              type={showPassword?.password ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              placeholder="Enter password"
              className="disable-autofill-style h-10 w-full border border-subtle !bg-surface-1 pr-12 placeholder:text-placeholder"
              autoComplete="on"
              autoFocus
              onFocus={() => handlePasswordInputFocused("password")}
              onBlur={() => handlePasswordInputFocused("password")}
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
        </div>
        {isPasswordConfirmationRequired &&
          ((formData.password.length > 0 && !isPasswordStrengthValid) || passwordInputFocused.password) && (
            <MobilePasswordStrengthMeter password={formData.password} isFocused={passwordInputFocused.password} />
          )}
      </div>

      {isPasswordConfirmationRequired && (
        <div>
          <div className="space-y-1">
            <label className="text-13 text-tertiary font-medium" htmlFor="password">
              Confirm Password
            </label>
            <div className="relative flex items-center rounded-md bg-surface-1">
              <Input
                type={showPassword?.passwordConfirmation ? "text" : "password"}
                name="passwordConfirmation"
                value={formData.passwordConfirmation}
                onChange={(e) => handleFormChange("passwordConfirmation", e.target.value)}
                placeholder="Enter password"
                className="disable-autofill-style h-10 w-full border border-subtle !bg-surface-1 pr-12 placeholder:text-placeholder"
                disabled={!isPasswordConfirmationEnabled}
                onFocus={() => handlePasswordInputFocused("passwordConfirmation")}
                onBlur={() => handlePasswordInputFocused("passwordConfirmation")}
              />
              {showPassword?.passwordConfirmation ? (
                <EyeOff
                  className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                  onClick={() => handleShowPassword("passwordConfirmation")}
                />
              ) : (
                <Eye
                  className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                  onClick={() => handleShowPassword("passwordConfirmation")}
                />
              )}
            </div>
          </div>
          {isPasswordConfirmationErrorStatus && (
            <span className="text-13 text-danger-primary">Passwords don&apos;t match</span>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
          {isSubmitting ? <Spinner height="20px" width="20px" /> : isSMTPConfigured ? "Continue" : "Go to workspace"}
        </Button>

        {isSMTPConfigured && (
          <Button type="button" onClick={redirectToUniqueCodeSignIn} variant="secondary" className="w-full" size="xl">
            Sign in with unique code
          </Button>
        )}
      </div>
    </form>
  );
}
