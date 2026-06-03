/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { Eye, EyeOff, Info, XCircle } from "lucide-react";
// plane imports
import { API_BASE_URL, E_PASSWORD_STRENGTH, AUTH_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
import { PasswordStrengthIndicator, Spinner } from "@plane/ui";
import { getPasswordStrength } from "@plane/utils";
// components
import { ForgotPasswordPopover } from "@/components/account/auth-forms/forgot-password-popover";
// constants
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

  const redirectToUniqueCodeSignIn = () => {
    handleAuthStep(EAuthSteps.UNIQUE_CODE);
  };

  const passwordSupport =
    mode === EAuthModes.SIGN_IN ? (
      <div className="w-full">
        {isSMTPConfigured ? (
          <Link
            data-ph-element={AUTH_TRACKER_ELEMENTS.FORGOT_PASSWORD_FROM_SIGNIN}
            href={`/accounts/forgot-password?email=${encodeURIComponent(email)}`}
            className="text-11 font-medium text-accent-primary"
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

  return (
    <>
      {isBannerMessage && mode === EAuthModes.SIGN_UP && (
        <div className="relative flex items-center gap-2 rounded-md border border-danger-strong/50 bg-danger-subtle p-2">
          <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
            <Info size={16} className="text-danger-primary" />
          </div>
          <div className="w-full text-13 font-medium text-danger-primary">
            {t("auth.sign_up.errors.password.strength")}
          </div>
          <button
            type="button"
            className="relative ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded-xs text-accent-primary/80 transition-all hover:bg-danger-subtle-hover"
            onClick={() => setBannerMessage(false)}
          >
            <CloseIcon className="h-4 w-4 shrink-0 text-danger-primary" />
          </button>
        </div>
      )}
      <form
        ref={formRef}
        className="space-y-4"
        method="POST"
        action={`${API_BASE_URL}/auth/${mode === EAuthModes.SIGN_IN ? "sign-in" : "sign-up"}/`}
        onSubmit={(event) => {
          event.preventDefault(); // Prevent form from submitting by default
          void handleCSRFToken();
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
      >
        <input type="hidden" name="csrfmiddlewaretoken" />
        <input type="hidden" value={passwordFormData.email} name="email" />
        {nextPath && <input type="hidden" value={nextPath} name="next_path" />}
        <div className="space-y-1">
          <label htmlFor="email" className="tracking-wider mb-2 ml-2 block text-[12px] font-semibold text-[#0a1e3f]">
            {t("auth.common.email.label")}
          </label>
          <div className="flex items-center rounded-md border border-transparent bg-[#f4f7f9] px-[18px] py-[14px] transition-all duration-200 focus-within:border-shinhan-blue focus-within:bg-[#ffffff] focus-within:shadow-[0_0_0_3px_rgba(0,112,224,0.1)]">
            <svg
              className="mr-3 h-5 w-5 flex-shrink-0 text-[#6b7280]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <input
              id="email"
              name="email"
              type="email"
              value={passwordFormData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              placeholder={t("auth.common.email.placeholder")}
              className="w-full bg-transparent text-[15px] font-semibold text-[#111827] placeholder-[#9ca3af] disable-autofill-style focus:outline-none"
              disabled
            />
            {passwordFormData.email.length > 0 && (
              <button
                type="button"
                className="ml-2 grid size-5 flex-shrink-0 place-items-center"
                onClick={handleEmailClear}
                aria-label={t("aria_labels.auth_forms.clear_email")}
              >
                <XCircle className="size-5 stroke-[#9ca3af] hover:stroke-[#4b5563]" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="tracking-wider mb-2 ml-2 block text-[12px] font-semibold text-[#0a1e3f]">
            {mode === EAuthModes.SIGN_IN ? t("auth.common.password.label") : t("auth.common.password.set_password")}
          </label>
          <div className="relative flex items-center rounded-md border border-transparent bg-[#f4f7f9] px-[18px] py-[14px] transition-all duration-200 focus-within:border-shinhan-blue focus-within:bg-[#ffffff] focus-within:shadow-[0_0_0_3px_rgba(0,112,224,0.1)]">
            <svg
              className="mr-3 h-5 w-5 flex-shrink-0 text-[#6b7280]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <input
              type={showPassword?.password ? "text" : "password"}
              id="password"
              name="password"
              value={passwordFormData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              placeholder={t("auth.common.password.placeholder")}
              className={`w-full bg-transparent pr-8 text-[#111827] placeholder-[#9ca3af] disable-autofill-style focus:outline-none ${showPassword?.password ? "text-[15px] font-semibold" : "translate-y-[2px] text-[16px] font-semibold tracking-[0.35em]"}`}
              onFocus={() => setIsPasswordInputFocused(true)}
              onBlur={() => setIsPasswordInputFocused(false)}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => handleShowPassword("password")}
              className="absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer text-[#9ca3af] hover:text-[#4b5563]"
              aria-label={t(
                showPassword?.password ? "aria_labels.auth_forms.hide_password" : "aria_labels.auth_forms.show_password"
              )}
            >
              {showPassword?.password ? <EyeOff className="size-[22px]" /> : <Eye className="size-[22px]" />}
            </button>
          </div>
          {passwordSupport}
        </div>

        {mode === EAuthModes.SIGN_UP && (
          <div className="space-y-1">
            <label
              htmlFor="confirm-password"
              className="tracking-wider mb-2 ml-2 block text-[12px] font-semibold text-[#0a1e3f]"
            >
              {t("auth.common.password.confirm_password.label")}
            </label>
            <div className="relative flex items-center rounded-md border border-transparent bg-[#f4f7f9] px-[18px] py-[14px] transition-all duration-200 focus-within:border-shinhan-blue focus-within:bg-[#ffffff] focus-within:shadow-[0_0_0_3px_rgba(0,112,224,0.1)]">
              <svg
                className="mr-3 h-5 w-5 flex-shrink-0 text-[#6b7280]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <input
                type={showPassword?.retypePassword ? "text" : "password"}
                id="confirm-password"
                name="confirm_password"
                value={passwordFormData.confirm_password}
                onChange={(e) => handleFormChange("confirm_password", e.target.value)}
                placeholder={t("auth.common.password.confirm_password.placeholder")}
                className={`w-full bg-transparent pr-8 text-[#111827] placeholder-[#9ca3af] disable-autofill-style focus:outline-none ${showPassword?.retypePassword ? "text-[15px] font-semibold" : "translate-y-[2px] text-[16px] font-semibold tracking-[0.35em]"}`}
                onFocus={() => setIsRetryPasswordInputFocused(true)}
                onBlur={() => setIsRetryPasswordInputFocused(false)}
                autoComplete="off"
              />
              <button
                type="button"
                className="absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer text-[#9ca3af] hover:text-[#4b5563]"
                aria-label={t(
                  showPassword?.retypePassword
                    ? "aria_labels.auth_forms.hide_password"
                    : "aria_labels.auth_forms.show_password"
                )}
                onClick={() => handleShowPassword("retypePassword")}
              >
                {showPassword?.retypePassword ? <EyeOff className="size-[22px]" /> : <Eye className="size-[22px]" />}
              </button>
            </div>
            {!!passwordFormData.confirm_password &&
              passwordFormData.password !== passwordFormData.confirm_password &&
              renderPasswordMatchError && (
                <span className="ml-2 text-13 text-[#dc2626]">{t("auth.common.password.errors.match")}</span>
              )}
          </div>
        )}

        <div className="space-y-2.5 pt-4">
          {mode === EAuthModes.SIGN_IN ? (
            <>
              <button
                type="submit"
                disabled={isButtonDisabled}
                className="flex w-full items-center justify-center rounded-md bg-gradient-to-r from-shinhan-gradientStart via-shinhan-blue to-shinhan-gradientEnd py-[18px] text-[16px] font-semibold tracking-wide text-white shadow-[0_8px_16px_rgba(0,112,224,0.3)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_20px_rgba(0,112,224,0.4)] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_16px_rgba(0,112,224,0.3)]"
              >
                {isSubmitting ? (
                  <Spinner height="20px" width="20px" />
                ) : isSMTPConfigured ? (
                  t("common.continue")
                ) : (
                  t("common.go_to_workspace")
                )}
              </button>
              {isSMTPConfigured && (
                <button
                  type="button"
                  data-ph-element={AUTH_TRACKER_ELEMENTS.SIGN_IN_WITH_UNIQUE_CODE}
                  onClick={redirectToUniqueCodeSignIn}
                  className="hover:bg-gray-50 flex w-full items-center justify-center rounded-md border border-[#e5e7eb] bg-white py-[18px] text-[16px] font-semibold tracking-wide text-[#0a1e3f] transition-all duration-200 focus:outline-none"
                >
                  {t("auth.common.sign_in_with_unique_code")}
                </button>
              )}
            </>
          ) : (
            <button
              type="submit"
              disabled={isButtonDisabled}
              className="flex w-full items-center justify-center rounded-md bg-gradient-to-r from-shinhan-gradientStart via-shinhan-blue to-shinhan-gradientEnd py-[18px] text-[16px] font-semibold tracking-wide text-white shadow-[0_8px_16px_rgba(0,112,224,0.3)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_20px_rgba(0,112,224,0.4)] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_16px_rgba(0,112,224,0.3)]"
            >
              {isSubmitting ? <Spinner height="20px" width="20px" /> : "Create account"}
            </button>
          )}
        </div>
      </form>
    </>
  );
});
