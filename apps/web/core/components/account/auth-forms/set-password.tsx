/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// icons
import { Eye, EyeOff } from "lucide-react";
// plane imports
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { E_PASSWORD_STRENGTH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { PasswordStrengthIndicator } from "@plane/ui";
// components
import { getPasswordStrength } from "@plane/utils";
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

export const SetPasswordForm = observer(function SetPasswordForm() {
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
      router.push("/");
    } catch (error: unknown) {
      let message = undefined;
      if (error instanceof Error) {
        const err = error as Error & { error?: string };
        message = err.error;
      }
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
          <label className="text-13 font-medium text-tertiary" htmlFor="email">
            {t("auth.common.email.label")}
          </label>
          <InputGroup size="2xl">
            <Input
              size="2xl"
              id="email"
              name="email"
              type="email"
              value={user?.email}
              placeholder={t("auth.common.email.placeholder")}
              autoComplete="off"
              disabled
            />
          </InputGroup>
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium text-tertiary" htmlFor="password">
            {t("auth.common.password.label")}
          </label>
          <InputGroup size="2xl">
            <Input
              size="2xl"
              type={showPassword.password ? "text" : "password"}
              name="password"
              id="password"
              value={passwordFormData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              placeholder={t("auth.common.password.placeholder")}
              minLength={8}
              onFocus={() => setIsPasswordInputFocused(true)}
              onBlur={() => setIsPasswordInputFocused(false)}
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => handleShowPassword("password")}
              className="grid size-5 place-items-center"
            >
              {showPassword.password ? (
                <EyeOff className="size-5 stroke-placeholder" />
              ) : (
                <Eye className="size-5 stroke-placeholder" />
              )}
            </button>
          </InputGroup>
          <PasswordStrengthIndicator password={passwordFormData.password} isFocused={isPasswordInputFocused} />
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium text-tertiary" htmlFor="confirm_password">
            {t("auth.common.password.confirm_password.label")}
          </label>
          <InputGroup size="2xl">
            <Input
              size="2xl"
              type={showPassword.retypePassword ? "text" : "password"}
              name="confirm_password"
              id="confirm_password"
              value={passwordFormData.confirm_password}
              onChange={(e) => handleFormChange("confirm_password", e.target.value)}
              placeholder={t("auth.common.password.confirm_password.placeholder")}
              onFocus={() => setIsRetryPasswordInputFocused(true)}
              onBlur={() => setIsRetryPasswordInputFocused(false)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => handleShowPassword("retypePassword")}
              className="grid size-5 place-items-center"
            >
              {showPassword.retypePassword ? (
                <EyeOff className="size-5 stroke-placeholder" />
              ) : (
                <Eye className="size-5 stroke-placeholder" />
              )}
            </button>
          </InputGroup>
          {!!passwordFormData.confirm_password &&
            passwordFormData.password !== passwordFormData.confirm_password &&
            renderPasswordMatchError && (
              <span className="text-13 text-danger-primary">{t("auth.common.password.errors.match")}</span>
            )}
        </div>
        <Button
          variant="primary"
          size="lg"
          stretch="full"
          label={t("common.continue")}
          type="submit"
          disabled={isButtonDisabled}
        />
      </form>
    </FormContainer>
  );
});
