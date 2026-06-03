/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { Eye, EyeOff, XCircle } from "lucide-react";
// plane imports
import { Spinner } from "@plane/ui";
// components
import { ForgotPasswordPopover } from "@/components/account/auth-forms/forgot-password-popover";
// helpers
import {
  STAFF_EMAIL_PREFIX,
  STAFF_EMAIL_DOMAIN,
  isStaffId,
  isEmail,
  resolveFormAction,
  validateStaffIdentifier,
} from "./staff-id-helpers";
// services
import { AuthService } from "@/services/auth.service";

type Props = {
  nextPath: string | undefined;
  isLDAPEnabled: boolean;
  isSwingSSOEnabled: boolean;
  isSMTPConfigured: boolean;
};

const authService = new AuthService();

export const StaffIdLoginForm = observer(function StaffIdLoginForm(props: Props) {
  const { nextPath, isLDAPEnabled, isSwingSSOEnabled, isSMTPConfigured } = props;
  // refs
  const formRef = useRef<HTMLFormElement>(null);
  // states
  const [csrfPromise, setCsrfPromise] = useState<Promise<{ csrf_token: string }> | undefined>(undefined);
  const [isCsrfReady, setIsCsrfReady] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [identifierError, setIdentifierError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = authService.requestCSRFToken();
      setCsrfPromise(promise);
      promise.then(() => setIsCsrfReady(true)).catch(() => setIsCsrfReady(false));
    }
  }, [csrfPromise]);

  const validateIdentifier = (value: string): boolean => {
    const error = validateStaffIdentifier(value, isLDAPEnabled, isSwingSSOEnabled);
    setIdentifierError(error);
    return !error;
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    if (identifierError) setIdentifierError(undefined);
  };

  const handleCSRFToken = async () => {
    if (!formRef?.current) return;
    const token = await csrfPromise;
    if (!token?.csrf_token) return;
    const csrfElement = formRef.current.querySelector("input[name=csrfmiddlewaretoken]");
    csrfElement?.setAttribute("value", token?.csrf_token);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !identifier || !password) return;
    if (!validateIdentifier(identifier)) return;

    void (async () => {
      await handleCSRFToken();
      if (!formRef.current) return;

      const { action, inputName, value } = resolveFormAction(identifier, isSwingSSOEnabled, isLDAPEnabled);
      const input = formRef.current.querySelector<HTMLInputElement>(`input[name=${inputName}]`);
      if (input) input.value = value;
      formRef.current.action = action;

      setIsSubmitting(true);
      formRef.current.submit();
    })();
  };

  const isButtonDisabled = !identifier || !password || isSubmitting || !isCsrfReady;

  return (
    <form ref={formRef} className="space-y-6" method="POST" onSubmit={handleSubmit}>
      <input type="hidden" name="csrfmiddlewaretoken" />
      <input type="hidden" name="email" value="" />
      <input type="hidden" name="username" value="" />
      {nextPath && <input type="hidden" value={nextPath} name="next_path" />}

      {/* Identifier input */}
      <div>
        <label
          htmlFor="login-identifier"
          className="tracking-wider mb-2 ml-2 block text-[12px] font-semibold text-[#0a1e3f]"
        >
          {isLDAPEnabled ? "Employee No. / Email / Username" : "Employee No. / Email"}
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
            id="login-identifier"
            type="text"
            value={identifier}
            onChange={(e) => handleIdentifierChange(e.target.value)}
            onBlur={() => {
              if (identifier.length > 0) validateIdentifier(identifier);
            }}
            placeholder="e.g. 20508888"
            className="w-full bg-transparent text-[15px] font-semibold text-[#111827] placeholder-[#9ca3af] disable-autofill-style focus:outline-none"
          />
          {identifier.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIdentifier("");
                setIdentifierError(undefined);
              }}
              className="ml-2 grid size-5 flex-shrink-0 place-items-center"
              aria-label="Clear input"
              tabIndex={-1}
            >
              <XCircle className="size-5 stroke-[#9ca3af] hover:stroke-[#4b5563]" />
            </button>
          )}
        </div>
        {identifierError && <p className="mt-1 px-0.5 text-11 text-[#dc2626]">{identifierError}</p>}
      </div>

      {/* Password input */}
      <div>
        <label
          htmlFor="login-password"
          className="tracking-wider mb-2 ml-2 block text-[12px] font-semibold text-[#0a1e3f]"
        >
          Password
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
            type={showPassword ? "text" : "password"}
            id="login-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="•••••••"
            className={`w-full bg-transparent pr-8 text-[#111827] placeholder-[#9ca3af] disable-autofill-style focus:outline-none ${showPassword ? "text-[15px] font-semibold" : "translate-y-[2px] text-[16px] font-semibold tracking-[0.35em]"}`}
            autoComplete="on"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer text-[#9ca3af] hover:text-[#4b5563]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-[22px]" /> : <Eye className="size-[22px]" />}
          </button>
        </div>
        {!isSwingSSOEnabled &&
          (isSMTPConfigured ? (
            <Link
              href={
                isEmail(identifier)
                  ? `/accounts/forgot-password?email=${encodeURIComponent(identifier)}`
                  : isStaffId(identifier)
                    ? `/accounts/forgot-password?email=${encodeURIComponent(`${STAFF_EMAIL_PREFIX}${identifier}${STAFF_EMAIL_DOMAIN}`)}`
                    : "/accounts/forgot-password"
              }
              className="mt-3 ml-2 inline-block text-[12px] font-semibold text-shinhan-blue hover:text-shinhan-dark"
            >
              Forgot password?
            </Link>
          ) : (
            <div className="mt-3 ml-2">
              <ForgotPasswordPopover />
            </div>
          ))}
      </div>

      <div className="pt-6">
        <button
          type="submit"
          disabled={isButtonDisabled}
          className="flex w-full items-center justify-center rounded-md bg-gradient-to-r from-shinhan-gradientStart via-shinhan-blue to-shinhan-gradientEnd py-[18px] text-[16px] font-semibold tracking-wide text-white shadow-[0_8px_16px_rgba(0,112,224,0.3)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_20px_rgba(0,112,224,0.4)] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_16px_rgba(0,112,224,0.3)]"
        >
          {isSubmitting ? <Spinner height="20px" width="20px" /> : "Sign In"}
        </button>
      </div>
    </form>
  );
});
