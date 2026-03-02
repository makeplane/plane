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
import { Button } from "@plane/propel/button";
import { Input, Spinner } from "@plane/ui";
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
    <form ref={formRef} className="space-y-4" method="POST" onSubmit={handleSubmit}>
      <input type="hidden" name="csrfmiddlewaretoken" />
      <input type="hidden" name="email" value="" />
      <input type="hidden" name="username" value="" />
      {nextPath && <input type="hidden" value={nextPath} name="next_path" />}

      {/* Identifier input — staff ID (8 digits) or LDAP username */}
      <div className="space-y-1">
        <label htmlFor="login-identifier" className="text-13 font-medium text-tertiary">
          {isLDAPEnabled ? "Staff ID, Email, or Username" : "Staff ID or Email"}
        </label>
        <div className="relative flex items-center rounded-md bg-surface-1 border border-strong">
          <Input
            id="login-identifier"
            type="text"
            value={identifier}
            onChange={(e) => handleIdentifierChange(e.target.value)}
            onBlur={() => {
              if (identifier.length > 0) validateIdentifier(identifier);
            }}
            placeholder={isLDAPEnabled ? "Enter staff ID, email, or username" : "Enter staff ID or email"}
            className="disable-autofill-style h-10 w-full placeholder:text-placeholder border-0"
          />
          {identifier.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIdentifier("");
                setIdentifierError(undefined);
              }}
              className="absolute right-3 size-5 grid place-items-center"
              aria-label="Clear input"
              tabIndex={-1}
            >
              <XCircle className="size-5 stroke-placeholder" />
            </button>
          )}
        </div>
        {identifierError && <p className="text-11 text-danger-primary px-0.5">{identifierError}</p>}
      </div>

      {/* Password input */}
      <div className="space-y-1">
        <label htmlFor="login-password" className="text-13 text-tertiary font-medium">
          Password
        </label>
        <div className="relative flex items-center rounded-md bg-surface-1">
          <Input
            type={showPassword ? "text" : "password"}
            id="login-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="disable-autofill-style h-10 w-full border border-strong !bg-surface-1 pr-12 placeholder:text-placeholder"
            autoComplete="on"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 size-5 grid place-items-center"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-5 stroke-placeholder" />
            ) : (
              <Eye className="size-5 stroke-placeholder" />
            )}
          </button>
        </div>
        {isSMTPConfigured ? (
          <Link
            href={
              isEmail(identifier)
                ? `/accounts/forgot-password?email=${encodeURIComponent(identifier)}`
                : isStaffId(identifier)
                  ? `/accounts/forgot-password?email=${encodeURIComponent(`${STAFF_EMAIL_PREFIX}${identifier}${STAFF_EMAIL_DOMAIN}`)}`
                  : "/accounts/forgot-password"
            }
            className="text-11 font-medium text-accent-primary"
          >
            Forgot password?
          </Link>
        ) : (
          <ForgotPasswordPopover />
        )}
      </div>

      <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
        {isSubmitting ? <Spinner height="20px" width="20px" /> : "Sign in"}
      </Button>
    </form>
  );
});
