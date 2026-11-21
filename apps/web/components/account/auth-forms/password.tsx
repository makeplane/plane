/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { CloseCircleOutline, HideOutline, InfoOutline, ShowOutline } from "@makeplane/propel/icons";
// plane imports
import { Banner } from "@makeplane/propel/components/banner";
import { Icon } from "@makeplane/propel/components/icon";
import { InputField } from "@makeplane/propel/components/input-field";
import { API_BASE_URL, E_PASSWORD_STRENGTH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { PasswordStrengthIndicator } from "@plane/blocks/auth";
import { getPasswordStrength } from "@plane/utils";
// helpers
import { EAuthModes, EAuthSteps } from "@/helpers/authentication.helper";
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

export const AuthPasswordForm = observer(function AuthPasswordForm(props: Props) {
  const { email, isSMTPConfigured, handleAuthStep, handleEmailClear, mode, nextPath } = props;
  // plane imports
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
  const [isBannerMessage, setBannerMessage] = useState(false);
  const [showSmtpError, setShowSmtpError] = useState(false);

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFormChange = (key: keyof TPasswordFormValues, value: string) => {
    if (showSmtpError) setShowSmtpError(false);
    setPasswordFormData((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = authService.requestCSRFToken();
      setCsrfPromise(promise);
    }
  }, [csrfPromise]);

  const redirectToUniqueCodeSignIn = async () => {
    handleAuthStep(EAuthSteps.UNIQUE_CODE);
  };

  const passwordSupport =
    mode === EAuthModes.SIGN_IN ? (
      <div className="mt-1.5 flex w-full flex-col gap-6">
        {isSMTPConfigured ? (
          <Link
            href={`/accounts/forgot-password?email=${encodeURIComponent(email)}`}
            className="w-fit text-caption-md-medium leading-none text-accent-primary"
          >
            {t("auth.common.forgot_password")}
          </Link>
        ) : (
          <button
            type="button"
            aria-expanded={showSmtpError}
            aria-controls="forgot-password-smtp-error"
            onClick={() => setShowSmtpError(true)}
            className="w-fit text-caption-md-medium leading-none text-accent-primary"
          >
            {t("auth.common.forgot_password")}
          </button>
        )}
        {showSmtpError && (
          <Banner
            id="forgot-password-smtp-error"
            role="alert"
            placement="inline"
            variant="danger"
            title={t("auth.forgot_password.errors.smtp_not_enabled")}
            dismissLabel={t("close")}
            onDismiss={() => setShowSmtpError(false)}
          />
        )}
      </div>
    ) : (
      passwordFormData.password.length > 0 &&
      getPasswordStrength(passwordFormData.password) != E_PASSWORD_STRENGTH.STRENGTH_VALID && (
        <PasswordStrengthIndicator password={passwordFormData.password} isFocused={isPasswordInputFocused} />
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

  const isPasswordMismatch = !!confirmPassword && password !== confirmPassword && renderPasswordMatchError;

  return (
    <div className="space-y-4">
      {isBannerMessage && mode === EAuthModes.SIGN_UP && (
        <Banner
          role="alert"
          placement="inline"
          variant="danger"
          icon={<Icon icon={InfoOutline} />}
          title={t("auth.sign_up.errors.password.strength")}
          dismissLabel={t("close")}
          onDismiss={() => setBannerMessage(false)}
        />
      )}
      <form
        ref={formRef}
        className="flex flex-col"
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
            if (formRef.current) formRef.current.submit(); // Manually submit the form if the condition is met
          } else {
            setBannerMessage(true);
          }
        }}
        onError={() => {
          setIsSubmitting(false);
        }}
      >
        <input type="hidden" name="csrfmiddlewaretoken" />
        <input type="hidden" value={passwordFormData.email} name="email" />
        {nextPath && <input type="hidden" value={nextPath} name="next_path" />}
        <InputField
          size="xl"
          orientation="vertical"
          label={t("auth.common.email.label")}
          id="email"
          name="email"
          type="email"
          value={passwordFormData.email}
          onChange={(e) => handleFormChange("email", e.target.value)}
          placeholder={t("auth.common.email.placeholder")}
          disabled
          endIcon={
            passwordFormData.email.length > 0 && (
              <button
                type="button"
                onClick={handleEmailClear}
                className="grid size-5 shrink-0 place-items-center"
                aria-label={t("aria_labels.auth_forms.clear_email")}
              >
                <CloseCircleOutline className="size-5 text-placeholder" />
              </button>
            )
          }
        />

        <div className="mt-4">
          <div className="space-y-2">
            <InputField
              size="xl"
              orientation="vertical"
              label={
                mode === EAuthModes.SIGN_IN ? t("auth.common.password.label") : t("auth.common.password.set_password")
              }
              type={showPassword?.password ? "text" : "password"}
              id="password"
              aria-describedby={passwordSupport ? "auth-password-support" : undefined}
              name="password"
              value={passwordFormData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              placeholder={t("auth.common.password.placeholder")}
              onFocus={() => setIsPasswordInputFocused(true)}
              onBlur={() => setIsPasswordInputFocused(false)}
              autoComplete="off"
              autoFocus
              endIcon={
                <button
                  type="button"
                  onClick={() => handleShowPassword("password")}
                  className="grid size-5 shrink-0 place-items-center"
                  aria-label={t(
                    showPassword?.password
                      ? "aria_labels.auth_forms.hide_password"
                      : "aria_labels.auth_forms.show_password"
                  )}
                >
                  {showPassword?.password ? (
                    <HideOutline className="size-5 text-placeholder" />
                  ) : (
                    <ShowOutline className="size-5 text-placeholder" />
                  )}
                </button>
              }
            />
            {mode === EAuthModes.SIGN_UP && passwordSupport && <div id="auth-password-support">{passwordSupport}</div>}
          </div>
          {mode === EAuthModes.SIGN_IN && <div id="auth-password-support">{passwordSupport}</div>}
        </div>

        {mode === EAuthModes.SIGN_UP && (
          <div className="mt-4">
            <InputField
              size="xl"
              orientation="vertical"
              label={t("auth.common.password.confirm_password.label")}
              type={showPassword?.retypePassword ? "text" : "password"}
              id="confirm-password"
              name="confirm_password"
              value={passwordFormData.confirm_password}
              onChange={(e) => handleFormChange("confirm_password", e.target.value)}
              placeholder={t("auth.common.password.confirm_password.placeholder")}
              onFocus={() => setIsRetryPasswordInputFocused(true)}
              onBlur={() => setIsRetryPasswordInputFocused(false)}
              autoComplete="off"
              endIcon={
                <button
                  type="button"
                  onClick={() => handleShowPassword("retypePassword")}
                  className="grid size-5 shrink-0 place-items-center"
                  aria-label={t(
                    showPassword?.retypePassword
                      ? "aria_labels.auth_forms.hide_password"
                      : "aria_labels.auth_forms.show_password"
                  )}
                >
                  {showPassword?.retypePassword ? (
                    <HideOutline className="size-5 text-placeholder" />
                  ) : (
                    <ShowOutline className="size-5 text-placeholder" />
                  )}
                </button>
              }
              error={isPasswordMismatch ? t("auth.common.password.errors.match") : undefined}
            />
          </div>
        )}

        <div className="mt-4 space-y-2.5">
          {mode === EAuthModes.SIGN_IN ? (
            <>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                stretch="full"
                disabled={isButtonDisabled}
                loading={isSubmitting}
                label={isSMTPConfigured ? t("common.continue") : t("common.go_to_workspace")}
              />
              {isSMTPConfigured && (
                <Button
                  type="button"
                  onClick={redirectToUniqueCodeSignIn}
                  variant="secondary"
                  size="lg"
                  stretch="full"
                  label={t("auth.common.sign_in_with_unique_code")}
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
    </div>
  );
});
