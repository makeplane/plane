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
        <div className="relative flex items-center p-2 rounded-md gap-2 border border-danger-strong/50 bg-danger-subtle">
          <div className="w-4 h-4 shrink-0 relative flex justify-center items-center">
            <Info size={16} className="text-danger-primary" />
          </div>
          <div className="w-full text-13 font-medium text-danger-primary">
            {t("auth.sign_up.errors.password.strength")}
          </div>
          <button
            type="button"
            className="relative ml-auto w-6 h-6 rounded-xs flex justify-center items-center transition-all cursor-pointer hover:bg-danger-subtle-hover text-accent-primary/80"
            onClick={() => setBannerMessage(false)}
          >
            <CloseIcon className="w-4 h-4 shrink-0 text-danger-primary" />
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
          <label htmlFor="email" className="block text-[12px] font-semibold text-[#0a1e3f] tracking-wider mb-2 ml-2">
            {t("auth.common.email.label")}
          </label>
          <div className="flex items-center bg-[#f4f7f9] border border-transparent rounded-md py-[14px] px-[18px] transition-all duration-200 focus-within:bg-[#ffffff] focus-within:border-shinhan-blue focus-within:shadow-[0_0_0_3px_rgba(0,112,224,0.1)]">
            <svg
              className="h-5 w-5 text-[#6b7280] mr-3 flex-shrink-0"
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
              className="disable-autofill-style bg-transparent w-full text-[#111827] font-semibold placeholder-[#9ca3af] focus:outline-none text-[15px]"
              disabled
            />
            {passwordFormData.email.length > 0 && (
              <button
                type="button"
                className="ml-2 size-5 grid place-items-center flex-shrink-0"
                onClick={handleEmailClear}
                aria-label={t("aria_labels.auth_forms.clear_email")}
              >
                <XCircle className="size-5 stroke-[#9ca3af] hover:stroke-[#4b5563]" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-[12px] font-semibold text-[#0a1e3f] tracking-wider mb-2 ml-2">
            {mode === EAuthModes.SIGN_IN ? t("auth.common.password.label") : t("auth.common.password.set_password")}
          </label>
          <div className="flex items-center relative bg-[#f4f7f9] border border-transparent rounded-md py-[14px] px-[18px] transition-all duration-200 focus-within:bg-[#ffffff] focus-within:border-shinhan-blue focus-within:shadow-[0_0_0_3px_rgba(0,112,224,0.1)]">
            <svg
              className="h-5 w-5 text-[#6b7280] mr-3 flex-shrink-0"
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
              className={`disable-autofill-style bg-transparent w-full text-[#111827] placeholder-[#9ca3af] focus:outline-none pr-8 ${showPassword?.password ? "text-[15px] font-semibold" : "font-semibold tracking-[0.35em] text-[16px] translate-y-[2px]"}`}
              onFocus={() => setIsPasswordInputFocused(true)}
              onBlur={() => setIsPasswordInputFocused(false)}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => handleShowPassword("password")}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9ca3af] cursor-pointer hover:text-[#4b5563]"
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
              className="block text-[12px] font-semibold text-[#0a1e3f] tracking-wider mb-2 ml-2"
            >
              {t("auth.common.password.confirm_password.label")}
            </label>
            <div className="flex items-center relative bg-[#f4f7f9] border border-transparent rounded-md py-[14px] px-[18px] transition-all duration-200 focus-within:bg-[#ffffff] focus-within:border-shinhan-blue focus-within:shadow-[0_0_0_3px_rgba(0,112,224,0.1)]">
              <svg
                className="h-5 w-5 text-[#6b7280] mr-3 flex-shrink-0"
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
                className={`disable-autofill-style bg-transparent w-full text-[#111827] placeholder-[#9ca3af] focus:outline-none pr-8 ${showPassword?.retypePassword ? "text-[15px] font-semibold" : "font-semibold tracking-[0.35em] text-[16px] translate-y-[2px]"}`}
                onFocus={() => setIsRetryPasswordInputFocused(true)}
                onBlur={() => setIsRetryPasswordInputFocused(false)}
                autoComplete="off"
              />
              <button
                type="button"
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9ca3af] cursor-pointer hover:text-[#4b5563]"
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
                <span className="text-13 text-[#dc2626] ml-2">{t("auth.common.password.errors.match")}</span>
              )}
          </div>
        )}

        <div className="pt-4 space-y-2.5">
          {mode === EAuthModes.SIGN_IN ? (
            <>
              <button
                type="submit"
                disabled={isButtonDisabled}
                className="w-full flex justify-center items-center py-[18px] text-white font-semibold text-[16px] tracking-wide rounded-md transition-all duration-200 bg-gradient-to-r from-shinhan-gradientStart via-shinhan-blue to-shinhan-gradientEnd shadow-[0_8px_16px_rgba(0,112,224,0.3)] hover:shadow-[0_10px_20px_rgba(0,112,224,0.4)] hover:-translate-y-[2px] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_16px_rgba(0,112,224,0.3)]"
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
                  className="w-full flex justify-center items-center py-[18px] text-[#0a1e3f] font-semibold text-[16px] tracking-wide rounded-md border border-[#e5e7eb] bg-white transition-all duration-200 hover:bg-gray-50 focus:outline-none"
                >
                  {t("auth.common.sign_in_with_unique_code")}
                </button>
              )}
            </>
          ) : (
            <button
              type="submit"
              disabled={isButtonDisabled}
              className="w-full flex justify-center items-center py-[18px] text-white font-semibold text-[16px] tracking-wide rounded-md transition-all duration-200 bg-gradient-to-r from-shinhan-gradientStart via-shinhan-blue to-shinhan-gradientEnd shadow-[0_8px_16px_rgba(0,112,224,0.3)] hover:shadow-[0_10px_20px_rgba(0,112,224,0.4)] hover:-translate-y-[2px] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_16px_rgba(0,112,224,0.3)]"
            >
              {isSubmitting ? <Spinner height="20px" width="20px" /> : "Create account"}
            </button>
          )}
        </div>
      </form>
    </>
  );
});
