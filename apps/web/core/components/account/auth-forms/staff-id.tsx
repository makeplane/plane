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
          className="block text-[12px] font-semibold text-[#0a1e3f] tracking-wider mb-2 ml-2"
        >
          {isLDAPEnabled ? "Employee No. / Email / Username" : "Employee No. / Email"}
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
            id="login-identifier"
            type="text"
            value={identifier}
            onChange={(e) => handleIdentifierChange(e.target.value)}
            onBlur={() => {
              if (identifier.length > 0) validateIdentifier(identifier);
            }}
            placeholder="e.g. 20508888"
            className="disable-autofill-style bg-transparent w-full text-[#111827] font-semibold placeholder-[#9ca3af] focus:outline-none text-[15px]"
          />
          {identifier.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIdentifier("");
                setIdentifierError(undefined);
              }}
              className="ml-2 size-5 grid place-items-center flex-shrink-0"
              aria-label="Clear input"
              tabIndex={-1}
            >
              <XCircle className="size-5 stroke-[#9ca3af] hover:stroke-[#4b5563]" />
            </button>
          )}
        </div>
        {identifierError && <p className="text-11 text-[#dc2626] px-0.5 mt-1">{identifierError}</p>}
      </div>

      {/* Password input */}
      <div>
        <label
          htmlFor="login-password"
          className="block text-[12px] font-semibold text-[#0a1e3f] tracking-wider mb-2 ml-2"
        >
          Password
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
            type={showPassword ? "text" : "password"}
            id="login-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="•••••••"
            className={`disable-autofill-style bg-transparent w-full text-[#111827] placeholder-[#9ca3af] focus:outline-none pr-8 ${showPassword ? "text-[15px] font-semibold" : "font-semibold tracking-[0.35em] text-[16px] translate-y-[2px]"}`}
            autoComplete="on"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9ca3af] cursor-pointer hover:text-[#4b5563]"
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
              className="text-[12px] font-semibold text-shinhan-blue hover:text-shinhan-dark ml-2 mt-3 inline-block"
            >
              Forgot password?
            </Link>
          ) : (
            <div className="ml-2 mt-3">
              <ForgotPasswordPopover />
            </div>
          ))}
      </div>

      <div className="pt-6">
        <button
          type="submit"
          disabled={isButtonDisabled}
          className="w-full flex justify-center items-center py-[18px] text-white font-semibold text-[16px] tracking-wide rounded-md transition-all duration-200 bg-gradient-to-r from-shinhan-gradientStart via-shinhan-blue to-shinhan-gradientEnd shadow-[0_8px_16px_rgba(0,112,224,0.3)] hover:shadow-[0_10px_20px_rgba(0,112,224,0.4)] hover:-translate-y-[2px] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_16px_rgba(0,112,224,0.3)]"
        >
          {isSubmitting ? <Spinner height="20px" width="20px" /> : "Sign In"}
        </button>
      </div>
    </form>
  );
});
