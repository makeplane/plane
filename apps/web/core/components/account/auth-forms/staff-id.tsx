/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { Eye, EyeOff, XCircle } from "lucide-react";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { Input, Spinner } from "@plane/ui";
// services
import { AuthService } from "@/services/auth.service";

type Props = {
  nextPath: string | undefined;
};

// Staff ID email transform constants
const STAFF_EMAIL_PREFIX = "sh";
const STAFF_EMAIL_DOMAIN = "@swing.shinhan.com";

const authService = new AuthService();

export const StaffIdLoginForm = observer(function StaffIdLoginForm(props: Props) {
  const { nextPath } = props;
  // refs
  const formRef = useRef<HTMLFormElement>(null);
  // states
  const [csrfPromise, setCsrfPromise] = useState<Promise<{ csrf_token: string }> | undefined>(undefined);
  const [isCsrfReady, setIsCsrfReady] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffIdError, setStaffIdError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = authService.requestCSRFToken();
      setCsrfPromise(promise);
      promise.then(() => setIsCsrfReady(true)).catch(() => setIsCsrfReady(false));
    }
  }, [csrfPromise]);

  // Validate staff ID: must be exactly 8 digits
  const validateStaffId = (value: string): boolean => {
    const isValid = /^\d{8}$/.test(value);
    if (value.length > 0 && !isValid) {
      setStaffIdError("Mã nhân viên phải đúng 8 chữ số");
    } else {
      setStaffIdError(undefined);
    }
    return isValid;
  };

  const handleStaffIdChange = (value: string) => {
    // Only allow numeric input, max 8 characters
    const numericValue = value.replace(/\D/g, "").slice(0, 8);
    setStaffId(numericValue);
    // Clear error on any input change
    if (staffIdError) setStaffIdError(undefined);
  };

  // Transform staff ID to email: 'sh' + staffId + '@swing.shinhan.com'
  const getStaffEmail = (id: string): string => `${STAFF_EMAIL_PREFIX}${id}${STAFF_EMAIL_DOMAIN}`;

  const handleCSRFToken = async () => {
    if (!formRef || !formRef.current) return;
    const token = await csrfPromise;
    if (!token?.csrf_token) return;
    const csrfElement = formRef.current.querySelector("input[name=csrfmiddlewaretoken]");
    csrfElement?.setAttribute("value", token?.csrf_token);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validateStaffId(staffId)) return;

    // Handle async operations without returning promise
    void (async () => {
      await handleCSRFToken();
      // Set the hidden email field with transformed value
      if (formRef.current) {
        const emailInput = formRef.current.querySelector<HTMLInputElement>("input[name=email]");
        if (emailInput) emailInput.value = getStaffEmail(staffId);
      }
      setIsSubmitting(true);
      if (formRef.current) formRef.current.submit();
    })();
  };

  const isButtonDisabled = !staffId || !password || staffId.length !== 8 || isSubmitting || !isCsrfReady;

  return (
    <form
      ref={formRef}
      className="space-y-4"
      method="POST"
      action={`${API_BASE_URL}/auth/sign-in/`}
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="csrfmiddlewaretoken" />
      <input type="hidden" name="email" value="" />
      {nextPath && <input type="hidden" value={nextPath} name="next_path" />}

      {/* Staff ID input */}
      <div className="space-y-1">
        <label htmlFor="staff-id" className="text-13 font-medium text-tertiary">
          Mã nhân viên
        </label>
        <div className="relative flex items-center rounded-md bg-surface-1 border border-strong">
          <Input
            id="staff-id"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            value={staffId}
            onChange={(e) => handleStaffIdChange(e.target.value)}
            onBlur={() => {
              if (staffId.length > 0) validateStaffId(staffId);
            }}
            placeholder="Nhập mã nhân viên 8 số"
            className="disable-autofill-style h-10 w-full placeholder:text-placeholder border-0"
          />
          {staffId.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setStaffId("");
                setStaffIdError(undefined);
              }}
              className="absolute right-3 size-5 grid place-items-center"
              aria-label="Xóa mã nhân viên"
              tabIndex={-1}
            >
              <XCircle className="size-5 stroke-placeholder" />
            </button>
          )}
        </div>
        {staffIdError && <p className="text-11 text-danger-primary px-0.5">{staffIdError}</p>}
      </div>

      {/* Password input */}
      <div className="space-y-1">
        <label htmlFor="staff-password" className="text-13 text-tertiary font-medium">
          Mật khẩu
        </label>
        <div className="relative flex items-center rounded-md bg-surface-1">
          <Input
            type={showPassword ? "text" : "password"}
            id="staff-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            className="disable-autofill-style h-10 w-full border border-strong !bg-surface-1 pr-12 placeholder:text-placeholder"
            autoComplete="on"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 size-5 grid place-items-center"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? (
              <EyeOff className="size-5 stroke-placeholder" />
            ) : (
              <Eye className="size-5 stroke-placeholder" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
        {isSubmitting ? <Spinner height="20px" width="20px" /> : "Đăng nhập"}
      </Button>
    </form>
  );
});
